#!/usr/bin/env python3

import argparse
import json
import re
import sqlite3
from pathlib import Path


ROOT = Path(__file__).absolute().parent
DEFAULT_DB_PATH = ROOT / "corpus.sqlite"
DB_PATH = DEFAULT_DB_PATH
SCHEMA_PATH = ROOT / "schema.sql"
REGISTRY_PATH = ROOT / "agents" / "agent-registry.json"
ALT_SEPARATOR_RE = re.compile(r"\s*[｜|/]\s*")
ANNOTATION_RE = re.compile(r"（[^）]*）")
CHINESE_PUNCT_RE = re.compile(r"[，。！？；：、“”‘’（）《》〈〉【】—…·\s,.!?;:\"'()\[\]{}-]+")
LEVEL_DATASET_RE = re.compile(r"^new-hsk-(\d+)-words$")
WORD_ID_LEVEL_RE = re.compile(r"^new-hsk-(\d+)-\d{4}$")
TRAILING_SENSE_DIGIT_RE = re.compile(r"^([\u3400-\u9fff]+)\d+$")

METRIC_FLOORS = {
    "new-hsk-3-words": {
        "avg_chars": 9.4,
        "avg_difficulty": 2.0,
        "max_share_len_le_8": 0.45,
    },
    "new-hsk-4-words": {
        "avg_chars": 10.0,
        "avg_difficulty": 2.1,
        "max_share_len_le_8": 0.30,
    },
    "new-hsk-5-words": {
        "avg_chars": 10.8,
        "avg_difficulty": 2.2,
        "max_share_len_le_8": 0.20,
    },
    "new-hsk-6-words": {
        "avg_words": 20.0,
        "avg_difficulty": 3.1,
    },
}


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def set_db_path(path: str) -> None:
    global DB_PATH
    DB_PATH = Path(path)


def init_db() -> None:
    with connect() as conn:
        conn.executescript(SCHEMA_PATH.read_text())
        example_columns = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(examples)").fetchall()
        }
        if "meaning_en" not in example_columns:
            conn.execute(
                "ALTER TABLE examples ADD COLUMN meaning_en TEXT NOT NULL DEFAULT ''"
            )
        registry = json.loads(REGISTRY_PATH.read_text())
        created_at = registry.get("created_at")
        active_roles = [agent["role"] for agent in registry["agents"]]
        if active_roles:
            placeholders = ",".join("?" for _ in active_roles)
            conn.execute(
                f"DELETE FROM agent_registry WHERE role NOT IN ({placeholders})",
                active_roles,
            )
        else:
            conn.execute("DELETE FROM agent_registry")
        for agent in registry["agents"]:
            conn.execute(
                """
                INSERT INTO agent_registry (role, label, prompt_file, agent_id, nickname, model, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(role) DO UPDATE SET
                  label = excluded.label,
                  prompt_file = excluded.prompt_file,
                  agent_id = excluded.agent_id,
                  nickname = excluded.nickname,
                  model = excluded.model,
                  created_at = excluded.created_at
                """,
                (
                    agent["role"],
                    agent["label"],
                    agent["prompt_file"],
                    agent.get("agent_id"),
                    agent.get("nickname"),
                    agent["model"],
                    created_at,
                ),
            )


def show_registry() -> None:
    data = json.loads(REGISTRY_PATH.read_text())
    print(json.dumps(data, indent=2, ensure_ascii=False))


def register_source_dataset(
    dataset_id: str,
    name: str,
    lang: str,
    kind: str,
    source_file: str,
    source_label: str,
    metadata_json: str,
) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO source_datasets (dataset_id, name, lang, kind, source_file, worksheet_name, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(dataset_id) DO UPDATE SET
              name = excluded.name,
              lang = excluded.lang,
              kind = excluded.kind,
              source_file = excluded.source_file,
              worksheet_name = excluded.worksheet_name,
              metadata_json = excluded.metadata_json,
              imported_at = CURRENT_TIMESTAMP
            """,
            (dataset_id, name, lang, kind, source_file, source_label, metadata_json),
        )


def seed_source_translations(json_file: str, dataset_id: str) -> None:
    seed_rows = json.loads(Path(json_file).read_text())
    with connect() as conn:
        for row in seed_rows:
            conn.execute(
                """
                INSERT INTO source_translation_seeds (
                  dataset_id, rank, display_form, pronunciation, pos,
                  primary_gloss, secondary_glosses_json, notes, ready_for_generation
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(dataset_id, rank) DO UPDATE SET
                  display_form = excluded.display_form,
                  pronunciation = excluded.pronunciation,
                  pos = excluded.pos,
                  primary_gloss = excluded.primary_gloss,
                  secondary_glosses_json = excluded.secondary_glosses_json,
                  notes = excluded.notes,
                  ready_for_generation = excluded.ready_for_generation,
                  updated_at = CURRENT_TIMESTAMP
                """,
                (
                    dataset_id,
                    row["rank"],
                    row["display_form"],
                    row["pronunciation"],
                    row["pos"],
                    row["primary_gloss"],
                    json.dumps(row.get("secondary_glosses", []), ensure_ascii=False),
                    row["notes"],
                ),
            )


def preview_source_translations(dataset_id: str, limit: int) -> None:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT rank, display_form, pronunciation, pos, primary_gloss
            FROM source_translation_seeds
            WHERE dataset_id = ?
            ORDER BY rank
            LIMIT ?
            """,
            (dataset_id, limit),
        ).fetchall()
    print(json.dumps([dict(row) for row in rows], indent=2, ensure_ascii=False))


def purge_dataset(dataset_id: str) -> None:
    word_prefix = f"{dataset_word_prefix(dataset_id)}-%"
    with connect() as conn:
        conn.execute(
            "DELETE FROM words WHERE id LIKE ?",
            (word_prefix,),
        )
        conn.execute(
            "DELETE FROM source_translation_seeds WHERE dataset_id = ?",
            (dataset_id,),
        )
        conn.execute(
            "DELETE FROM source_datasets WHERE dataset_id = ?",
            (dataset_id,),
        )


def upsert_word(payload: dict) -> None:
    word = payload["word"]
    glosses = payload["glosses"]
    examples = payload["examples"]
    translations = {
        item["example_id"]: item["translation"]
        for item in payload["example_translations"]
    }

    with connect() as conn:
        validate_payload_vocabulary(payload, conn)
        conn.execute(
            """
            INSERT INTO words (
              id, lang, lemma, display_form, pos, rank, pronunciation,
              primary_gloss, secondary_glosses_json, notes, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'complete')
            ON CONFLICT(id) DO UPDATE SET
              lang = excluded.lang,
              lemma = excluded.lemma,
              display_form = excluded.display_form,
              pos = excluded.pos,
              rank = excluded.rank,
              pronunciation = excluded.pronunciation,
              primary_gloss = excluded.primary_gloss,
              secondary_glosses_json = excluded.secondary_glosses_json,
              notes = excluded.notes,
              status = 'complete',
              updated_at = CURRENT_TIMESTAMP
            """,
            (
                word["id"],
                word["lang"],
                word["lemma"],
                word["display_form"],
                word["pos"],
                word["rank"],
                word["pronunciation"],
                glosses["primary_gloss"],
                json.dumps(glosses["secondary_glosses"], ensure_ascii=False),
                glosses["notes"],
            ),
        )

        conn.execute("DELETE FROM examples WHERE word_id = ?", (word["id"],))
        for example in examples:
            conn.execute(
                """
                INSERT INTO examples (id, word_id, sentence, translation, meaning_en, difficulty, source, is_primary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    example["id"],
                    word["id"],
                    example["sentence"],
                    translations[example["id"]],
                    example.get("meaning_en", glosses["primary_gloss"]),
                    example["difficulty"],
                    example["source"],
                    1 if example["is_primary"] else 0,
                ),
            )


def normalize_display_form(display_form: str) -> str:
    return display_form_variants(display_form)[0]


def normalize_pronunciation(pronunciation: str) -> str:
    primary = ALT_SEPARATOR_RE.split(pronunciation.strip())[0].strip()
    return primary


def display_form_variants(display_form: str) -> list[str]:
    variants = []
    for part in ALT_SEPARATOR_RE.split(display_form.strip()):
        cleaned = ANNOTATION_RE.sub("", part).strip()
        if not cleaned:
            continue
        match = TRAILING_SENSE_DIGIT_RE.match(cleaned)
        candidates = [cleaned]
        if match:
            candidates = [match.group(1), cleaned]
        for candidate in candidates:
            if candidate and candidate not in variants:
                variants.append(candidate)
    return variants or [display_form.strip()]


def dataset_word_prefix(dataset_id: str) -> str:
    if dataset_id.endswith("-words"):
        return dataset_id[: -len("-words")]
    return dataset_id.replace("_", "-")


def build_word_id(dataset_id: str, rank: int) -> str:
    return f"{dataset_word_prefix(dataset_id)}-{rank:04d}"


def dataset_id_for_word_id(word_id: str) -> str | None:
    match = WORD_ID_LEVEL_RE.match(word_id)
    if not match:
        return None
    return f"new-hsk-{match.group(1)}-words"


def allowed_dataset_ids_for_level(dataset_id: str, conn: sqlite3.Connection) -> list[str]:
    match = LEVEL_DATASET_RE.match(dataset_id)
    if not match:
        return [dataset_id]

    max_level = int(match.group(1))
    dataset_ids = []
    for row in conn.execute("SELECT dataset_id FROM source_datasets ORDER BY dataset_id"):
        candidate = row["dataset_id"]
        candidate_match = LEVEL_DATASET_RE.match(candidate)
        if candidate_match and int(candidate_match.group(1)) <= max_level:
            dataset_ids.append(candidate)
    return dataset_ids or [dataset_id]


def build_allowed_lexicon(dataset_id: str, conn: sqlite3.Connection) -> set[str]:
    dataset_ids = allowed_dataset_ids_for_level(dataset_id, conn)
    placeholders = ",".join("?" for _ in dataset_ids)
    rows = conn.execute(
        f"SELECT display_form FROM source_translation_seeds WHERE dataset_id IN ({placeholders})",
        dataset_ids,
    ).fetchall()
    lexicon = set()
    for row in rows:
        for variant in display_form_variants(row["display_form"]):
            lexicon.add(variant)
    return lexicon


def clean_sentence_for_segmentation(sentence: str) -> str:
    return CHINESE_PUNCT_RE.sub("", sentence)


def segment_with_lexicon(text: str, lexicon: set[str]) -> list[str] | None:
    if not text:
        return []
    max_token_length = max((len(token) for token in lexicon), default=0)
    failed: set[int] = set()
    memo: dict[int, list[str] | None] = {}

    def dfs(index: int) -> list[str] | None:
        if index == len(text):
            return []
        if index in memo:
            return memo[index]
        if index in failed:
            return None
        upper = min(len(text), index + max_token_length)
        for end in range(upper, index, -1):
            token = text[index:end]
            if token not in lexicon:
                continue
            rest = dfs(end)
            if rest is not None:
                memo[index] = [token] + rest
                return memo[index]
        failed.add(index)
        memo[index] = None
        return None

    return dfs(0)


def can_segment_with_lexicon(text: str, lexicon: set[str]) -> bool:
    return segment_with_lexicon(text, lexicon) is not None


def validate_and_count_payload_tokens(payload: dict, conn: sqlite3.Connection) -> list[int]:
    dataset_id = dataset_id_for_word_id(payload["word"]["id"])
    if not dataset_id:
        return []
    lexicon = build_allowed_lexicon(dataset_id, conn)
    token_counts: list[int] = []
    for example in payload["examples"]:
        segmented = segment_with_lexicon(
            clean_sentence_for_segmentation(example["sentence"]),
            lexicon,
        )
        if segmented is None:
            raise ValueError(
                f"{payload['word']['id']}: sentence uses words outside allowed New HSK level set: {example['sentence']}"
            )
        token_counts.append(len(segmented))
    return token_counts


def validate_payload_vocabulary(payload: dict, conn: sqlite3.Connection) -> None:
    validate_and_count_payload_tokens(payload, conn)


def compute_dataset_metrics(dataset_id: str) -> dict:
    word_prefix = f"{dataset_word_prefix(dataset_id)}-%"
    with connect() as conn:
        word_count = conn.execute(
            "SELECT COUNT(*) FROM words WHERE id LIKE ?",
            (word_prefix,),
        ).fetchone()[0]
        example_rows = conn.execute(
            """
            SELECT e.sentence, e.difficulty
            FROM examples e
            JOIN words w ON w.id = e.word_id
            WHERE w.id LIKE ?
            ORDER BY w.rank, e.id
            """,
            (word_prefix,),
        ).fetchall()
        lexicon = build_allowed_lexicon(dataset_id, conn)

    sentence_lengths: list[int] = []
    token_counts: list[int] = []
    difficulties: list[int] = []
    segmentation_failures = 0
    for row in example_rows:
        sentence = row["sentence"]
        difficulty = row["difficulty"]
        sentence_lengths.append(len(sentence))
        difficulties.append(difficulty)
        segmented = segment_with_lexicon(clean_sentence_for_segmentation(sentence), lexicon)
        if segmented is None:
            segmentation_failures += 1
            continue
        token_counts.append(len(segmented))

    example_count = len(example_rows)
    avg_words = round(sum(token_counts) / len(token_counts), 3) if token_counts else 0.0
    return {
        "dataset_id": dataset_id,
        "db_path": str(DB_PATH),
        "word_count": word_count,
        "example_count": example_count,
        "avg_chars": round(sum(sentence_lengths) / example_count, 3) if example_count else 0.0,
        "avg_words": avg_words,
        "avg_tokens": avg_words,
        "avg_difficulty": round(sum(difficulties) / len(difficulties), 3) if difficulties else 0.0,
        "share_len_le_8": round(sum(1 for length in sentence_lengths if length <= 8) / example_count, 3) if example_count else 0.0,
        "segmentation_failures": segmentation_failures,
    }


def export_generation_jobs(
    dataset_id: str,
    output_file: str,
    start_rank: int,
    end_rank: int,
    include_existing: bool = False,
) -> None:
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with connect() as conn:
        seed_rows = conn.execute(
            """
            SELECT
              s.dataset_id,
              s.rank,
              s.display_form,
              s.pronunciation,
              s.pos,
              s.primary_gloss,
              s.secondary_glosses_json,
              s.notes
            FROM source_translation_seeds s
            WHERE s.dataset_id = ?
              AND s.rank BETWEEN ? AND ?
            ORDER BY s.rank
            """,
            (dataset_id, start_rank, end_rank),
        ).fetchall()
        existing_word_ids = set()
        if not include_existing:
            existing_word_ids = {
                row["id"]
                for row in conn.execute(
                    "SELECT id FROM words WHERE id LIKE ?",
                    (f"{dataset_word_prefix(dataset_id)}-%",),
                ).fetchall()
            }

    jobs = []
    for row in seed_rows:
        display_form = row["display_form"]
        word_id = build_word_id(row["dataset_id"], row["rank"])
        if not include_existing and word_id in existing_word_ids:
            continue
        jobs.append(
            {
                "dataset_id": row["dataset_id"],
                "word_id": word_id,
                "rank": row["rank"],
                "display_form": display_form,
                "lemma": normalize_display_form(display_form),
                "generation_form": normalize_display_form(display_form),
                "pronunciation": normalize_pronunciation(row["pronunciation"]),
                "pos": row["pos"],
                "primary_gloss": row["primary_gloss"],
                "secondary_glosses": json.loads(row["secondary_glosses_json"]),
                "notes": row["notes"],
            }
        )

    output_path.write_text(json.dumps(jobs, ensure_ascii=False, indent=2) + "\n")


def build_default_notes(primary_gloss: str, secondary_glosses: list[str], pos: str) -> str:
    pos_label = pos if pos and pos != "unknown" else "word"
    if secondary_glosses:
        return (
            f"Common {pos_label} meaning {primary_gloss}. "
            f"It can also mean {', '.join(secondary_glosses)} in other common contexts."
        )
    return f"Common {pos_label} meaning {primary_gloss}."


def merge_agent_batch(dataset_id: str, generator1_file: str, generator2_file: str) -> None:
    g1_results = json.loads(Path(generator1_file).read_text())["results"]
    g2_results = {
        row["word_id"]: row
        for row in json.loads(Path(generator2_file).read_text())["results"]
    }

    with connect() as conn:
        for g1 in g1_results:
            word_id = g1["word_id"]
            rank = g1["rank"]
            g2 = g2_results[word_id]

            seed = conn.execute(
                """
                SELECT display_form, pronunciation, pos, primary_gloss
                FROM source_translation_seeds
                WHERE dataset_id = ? AND rank = ?
                """,
                (dataset_id, rank),
            ).fetchone()
            if not seed:
                raise ValueError(f"Missing seed row for {word_id}")

            lemma = normalize_display_form(seed["display_form"])
            meanings = []
            for item in g1.get("meanings", []):
                meaning = item["meaning_en"].strip()
                if meaning and meaning not in meanings:
                    meanings.append(meaning)
            for example in g1["examples"] + g2["examples"]:
                meaning = example["meaning_en"].strip()
                if meaning and meaning not in meanings:
                    meanings.append(meaning)
            if not meanings:
                meanings = [seed["primary_gloss"]]

            primary_gloss = meanings[0]
            secondary_glosses = meanings[1:3]
            notes = g1.get("notes") or build_default_notes(primary_gloss, secondary_glosses, seed["pos"])

            merged_examples = []
            merged_translations = []
            source_map = {1: "generator-1", 2: "generator-1", 3: "generator-2"}
            all_examples = sorted(g1["examples"] + g2["examples"], key=lambda item: item["slot"])
            if len(all_examples) != 3:
                raise ValueError(f"{word_id}: expected 3 merged examples")

            for example in all_examples:
                slot = example["slot"]
                example_id = f"{word_id}-ex{slot}"
                merged_examples.append(
                    {
                        "id": example_id,
                        "meaning_en": example["meaning_en"],
                        "sentence": example["sentence"],
                        "difficulty": example["difficulty"],
                        "source": source_map[slot],
                        "is_primary": slot == 1,
                    }
                )
                merged_translations.append(
                    {
                        "example_id": example_id,
                        "translation": example["translation"],
                    }
                )

            payload = {
                "word": {
                    "id": word_id,
                    "lang": "zh",
                    "lemma": lemma,
                    "display_form": lemma,
                    "pos": seed["pos"] if seed["pos"] != "unknown" else g1.get("pos", "unknown"),
                    "rank": rank,
                    "pronunciation": normalize_pronunciation(seed["pronunciation"]),
                },
                "glosses": {
                    "primary_gloss": primary_gloss,
                    "secondary_glosses": secondary_glosses,
                    "notes": notes,
                },
                "examples": merged_examples,
                "example_translations": merged_translations,
            }
            upsert_word(payload)


def ingest_jsonl(jsonl_file: str) -> None:
    validate_jsonl(jsonl_file)
    with Path(jsonl_file).open() as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            payload = json.loads(line)
            upsert_word(payload)


def validate_jsonl(jsonl_file: str) -> None:
    path = Path(jsonl_file)
    count = 0
    seen_word_ids = set()
    sentence_lengths: list[int] = []
    token_counts: list[int] = []
    example_difficulties: list[int] = []
    dataset_ids: set[str] = set()
    with connect() as conn:
        with path.open() as handle:
            for line_number, line in enumerate(handle, start=1):
                line = line.strip()
                if not line:
                    continue
                payload = json.loads(line)
                word = payload["word"]
                glosses = payload["glosses"]
                examples = payload["examples"]
                translations = payload["example_translations"]

                word_id = word["id"]
                dataset_id = dataset_id_for_word_id(word_id)
                if dataset_id:
                    dataset_ids.add(dataset_id)
                if word_id in seen_word_ids:
                    raise ValueError(f"{path}:{line_number}: duplicate word id {word_id}")
                seen_word_ids.add(word_id)

                if len(examples) != 3:
                    raise ValueError(f"{path}:{line_number}: expected 3 examples for {word_id}")
                if len(translations) != 3:
                    raise ValueError(f"{path}:{line_number}: expected 3 translations for {word_id}")
                if sum(1 for example in examples if example["is_primary"]) != 1:
                    raise ValueError(f"{path}:{line_number}: expected exactly one primary example for {word_id}")

                expected_example_ids = {f"{word_id}-ex1", f"{word_id}-ex2", f"{word_id}-ex3"}
                actual_example_ids = {example["id"] for example in examples}
                if actual_example_ids != expected_example_ids:
                    raise ValueError(f"{path}:{line_number}: bad example ids for {word_id}")

                actual_translation_ids = {item["example_id"] for item in translations}
                if actual_translation_ids != expected_example_ids:
                    raise ValueError(f"{path}:{line_number}: translation ids do not match examples for {word_id}")

                if "primary_gloss" not in glosses or "notes" not in glosses:
                    raise ValueError(f"{path}:{line_number}: incomplete gloss block for {word_id}")

                sentence_values = [example["sentence"] for example in examples]
                if len(set(sentence_values)) != len(sentence_values):
                    raise ValueError(f"{path}:{line_number}: duplicate Chinese sentences inside {word_id}")
                sentence_lengths.extend(len(sentence) for sentence in sentence_values)
                for example in examples:
                    if example["difficulty"] not in {1, 2, 3, 4, 5}:
                        raise ValueError(
                            f"{path}:{line_number}: {word_id}: difficulty must be 1, 2, 3, 4, or 5, got {example['difficulty']}"
                        )
                example_difficulties.extend(example["difficulty"] for example in examples)

                translation_values = [item["translation"] for item in translations]
                if len(set(translation_values)) != len(translation_values):
                    raise ValueError(f"{path}:{line_number}: duplicate English translations inside {word_id}")

                variants = display_form_variants(word["display_form"])
                for example in examples:
                    if not any(variant and variant in example["sentence"] for variant in variants):
                        raise ValueError(
                            f"{path}:{line_number}: {word_id}: example does not visibly contain the target display form or any accepted variant: {example['sentence']}"
                        )

                try:
                    token_counts.extend(validate_and_count_payload_tokens(payload, conn))
                except ValueError as exc:
                    raise ValueError(f"{path}:{line_number}: {exc}") from exc

                count += 1

    if len(dataset_ids) == 1 and example_difficulties:
        dataset_id = next(iter(dataset_ids))
        floors = METRIC_FLOORS.get(dataset_id)
        if floors:
            avg_difficulty = sum(example_difficulties) / len(example_difficulties)
            if "avg_chars" in floors and sentence_lengths:
                avg_chars = sum(sentence_lengths) / len(sentence_lengths)
                if avg_chars < floors["avg_chars"]:
                    raise ValueError(
                        f"{path}: average sentence length {avg_chars:.2f} is below the {dataset_id} floor of {floors['avg_chars']:.2f}"
                    )
            avg_words_floor = floors.get("avg_words", floors.get("avg_tokens"))
            if avg_words_floor is not None and token_counts:
                avg_words = sum(token_counts) / len(token_counts)
                if avg_words < avg_words_floor:
                    raise ValueError(
                        f"{path}: average segmented word count {avg_words:.2f} is below the {dataset_id} floor of {avg_words_floor:.2f}"
                    )
            if "avg_difficulty" in floors and avg_difficulty < floors["avg_difficulty"]:
                raise ValueError(
                    f"{path}: average difficulty {avg_difficulty:.2f} is below the {dataset_id} floor of {floors['avg_difficulty']:.2f}"
                )
            if "max_share_len_le_8" in floors and sentence_lengths:
                share_len_le_8 = sum(1 for length in sentence_lengths if length <= 8) / len(sentence_lengths)
                if share_len_le_8 > floors["max_share_len_le_8"]:
                    raise ValueError(
                        f"{path}: share of sentences with length <= 8 is {share_len_le_8:.1%}, above the {dataset_id} cap of {floors['max_share_len_le_8']:.1%}"
                    )

    print(json.dumps({"file": str(path), "word_count": count}, ensure_ascii=False))


def show_dataset_metrics(dataset_id: str) -> None:
    print(json.dumps(compute_dataset_metrics(dataset_id), ensure_ascii=False, indent=2))


def compare_lower_level_metrics(dataset_id: str) -> None:
    match = LEVEL_DATASET_RE.match(dataset_id)
    if not match:
        raise ValueError(f"{dataset_id} is not a New HSK level dataset id")

    target_level = int(match.group(1))
    target_metrics = compute_dataset_metrics(dataset_id)
    lower_levels = []
    for level in range(1, target_level):
        candidate = f"new-hsk-{level}-words"
        db_path = ROOT / "corpus.sqlite" if level == 1 else ROOT / f"corpus-hsk-{level}.sqlite"
        if not db_path.exists():
            continue
        previous_db_path = DB_PATH
        try:
            set_db_path(str(db_path))
            lower_levels.append(compute_dataset_metrics(candidate))
        finally:
            set_db_path(str(previous_db_path))

    comparison = {
        "dataset_id": dataset_id,
        "db_path": str(DB_PATH),
        "target": target_metrics,
        "lower_levels": lower_levels,
        "max_lower_avg_words": max((item["avg_words"] for item in lower_levels), default=0.0),
        "max_lower_avg_tokens": max((item["avg_tokens"] for item in lower_levels), default=0.0),
        "max_lower_avg_difficulty": max((item["avg_difficulty"] for item in lower_levels), default=0.0),
    }
    print(json.dumps(comparison, ensure_ascii=False, indent=2))


def show_coverage(dataset_id: str) -> None:
    with connect() as conn:
        seed_count = conn.execute(
            """
            SELECT COUNT(*)
            FROM source_translation_seeds
            WHERE dataset_id = ?
            """,
            (dataset_id,),
        ).fetchone()[0]
        complete_count = conn.execute(
            """
            SELECT COUNT(*)
            FROM words
            WHERE id LIKE ?
            """,
            (f"{dataset_word_prefix(dataset_id)}-%",),
        ).fetchone()[0]

    print(
        json.dumps(
            {
                "dataset_id": dataset_id,
                "db_path": str(DB_PATH),
                "seed_count": seed_count,
                "complete_count": complete_count,
                "pending_count": max(seed_count - complete_count, 0),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def duplicate_rows_by_value(rows: list[sqlite3.Row], field_name: str) -> list[sqlite3.Row]:
    counts: dict[tuple[str, str], int] = {}
    for row in rows:
        key = (row["word_id"], row[field_name])
        counts[key] = counts.get(key, 0) + 1
    return [row for row in rows if counts[(row["word_id"], row[field_name])] > 1]


def cross_word_duplicate_groups(rows: list[sqlite3.Row], field_name: str) -> dict[str, list[sqlite3.Row]]:
    groups: dict[str, list[sqlite3.Row]] = {}
    for row in rows:
        value = row[field_name]
        groups.setdefault(value, []).append(row)
    return {
        value: group
        for value, group in groups.items()
        if len({row["word_id"] for row in group}) > 1
    }


def audit_dataset(dataset_id: str, audit_name: str, notes: str = "") -> None:
    word_prefix = f"{dataset_word_prefix(dataset_id)}-%"
    issues: list[dict] = []

    with connect() as conn:
        seed_count = conn.execute(
            "SELECT COUNT(*) FROM source_translation_seeds WHERE dataset_id = ?",
            (dataset_id,),
        ).fetchone()[0]
        word_rows = conn.execute(
            """
            SELECT id, rank, lemma, display_form
            FROM words
            WHERE id LIKE ?
            ORDER BY rank, id
            """,
            (word_prefix,),
        ).fetchall()
        example_rows = conn.execute(
            """
            SELECT e.id, e.word_id, e.sentence, e.translation, e.is_primary, w.rank, w.lemma, w.display_form
            FROM examples e
            JOIN words w ON w.id = e.word_id
            WHERE e.word_id LIKE ?
            ORDER BY w.rank, e.id
            """,
            (word_prefix,),
        ).fetchall()

        examples_by_word: dict[str, list[sqlite3.Row]] = {}
        for row in example_rows:
            examples_by_word.setdefault(row["word_id"], []).append(row)

        allowed_lexicon = build_allowed_lexicon(dataset_id, conn)

        for word in word_rows:
            word_examples = examples_by_word.get(word["id"], [])
            if len(word_examples) != 3:
                issues.append(
                    {
                        "issue_type": "bad_example_count",
                        "word_id": word["id"],
                        "rank": word["rank"],
                        "details": f"Expected 3 examples, found {len(word_examples)}.",
                    }
                )

            primary_count = sum(1 for row in word_examples if row["is_primary"])
            if primary_count != 1:
                issues.append(
                    {
                        "issue_type": "bad_primary_count",
                        "word_id": word["id"],
                        "rank": word["rank"],
                        "details": f"Expected exactly 1 primary example, found {primary_count}.",
                    }
                )

            variants = display_form_variants(word["display_form"])
            for example in word_examples:
                cleaned = clean_sentence_for_segmentation(example["sentence"])
                if not can_segment_with_lexicon(cleaned, allowed_lexicon):
                    issues.append(
                        {
                            "issue_type": "lexicon_failure",
                            "word_id": word["id"],
                            "example_id": example["id"],
                            "rank": word["rank"],
                            "sentence": example["sentence"],
                            "translation": example["translation"],
                            "details": "Sentence uses tokens outside the allowed New HSK level set.",
                        }
                    )

                if not any(variant and variant in example["sentence"] for variant in variants):
                    issues.append(
                        {
                            "issue_type": "missing_lemma",
                            "word_id": word["id"],
                            "example_id": example["id"],
                            "rank": word["rank"],
                            "sentence": example["sentence"],
                            "translation": example["translation"],
                            "details": "Example does not visibly contain the target display form or any accepted variant.",
                        }
                    )

        for row in duplicate_rows_by_value(example_rows, "sentence"):
            issues.append(
                {
                    "issue_type": "same_word_duplicate_sentence",
                    "word_id": row["word_id"],
                    "example_id": row["id"],
                    "rank": row["rank"],
                    "sentence": row["sentence"],
                    "translation": row["translation"],
                    "details": "The same word has a duplicate Chinese sentence across its 3 examples.",
                }
            )

        for row in duplicate_rows_by_value(example_rows, "translation"):
            issues.append(
                {
                    "issue_type": "same_word_duplicate_translation",
                    "word_id": row["word_id"],
                    "example_id": row["id"],
                    "rank": row["rank"],
                    "sentence": row["sentence"],
                    "translation": row["translation"],
                    "details": "The same word has a duplicate English translation across its 3 examples.",
                }
            )

        for sentence, group in cross_word_duplicate_groups(example_rows, "sentence").items():
            details = "; ".join(f"{row['word_id']}::{row['id']}" for row in group)
            for row in group:
                issues.append(
                    {
                        "issue_type": "cross_word_duplicate_sentence",
                        "word_id": row["word_id"],
                        "example_id": row["id"],
                        "rank": row["rank"],
                        "sentence": sentence,
                        "translation": row["translation"],
                        "details": details,
                    }
                )

        for translation, group in cross_word_duplicate_groups(example_rows, "translation").items():
            details = "; ".join(f"{row['word_id']}::{row['id']}" for row in group)
            for row in group:
                issues.append(
                    {
                        "issue_type": "cross_word_duplicate_translation",
                        "word_id": row["word_id"],
                        "example_id": row["id"],
                        "rank": row["rank"],
                        "sentence": row["sentence"],
                        "translation": translation,
                        "details": details,
                    }
                )

        bad_example_count_words = len({issue["word_id"] for issue in issues if issue["issue_type"] == "bad_example_count"})
        bad_primary_count_words = len({issue["word_id"] for issue in issues if issue["issue_type"] == "bad_primary_count"})
        lexicon_failures = len([issue for issue in issues if issue["issue_type"] == "lexicon_failure"])
        missing_lemma = len([issue for issue in issues if issue["issue_type"] == "missing_lemma"])
        same_word_duplicate_sentences = len(
            {
                (issue["word_id"], issue.get("sentence", ""))
                for issue in issues
                if issue["issue_type"] == "same_word_duplicate_sentence"
            }
        )
        same_word_duplicate_translations = len(
            {
                (issue["word_id"], issue.get("translation", ""))
                for issue in issues
                if issue["issue_type"] == "same_word_duplicate_translation"
            }
        )
        cross_word_duplicate_sentence_groups = len(
            {issue.get("sentence", "") for issue in issues if issue["issue_type"] == "cross_word_duplicate_sentence"}
        )
        cross_word_duplicate_translation_groups = len(
            {
                issue.get("translation", "")
                for issue in issues
                if issue["issue_type"] == "cross_word_duplicate_translation"
            }
        )

        audit_run_id = conn.execute(
            """
            INSERT INTO audit_runs (
              dataset_id, audit_name, notes, seed_count, word_count, example_count, issue_count,
              bad_example_count_words, bad_primary_count_words, lexicon_failures, missing_lemma,
              same_word_duplicate_sentences, same_word_duplicate_translations,
              cross_word_duplicate_sentence_groups, cross_word_duplicate_translation_groups
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                dataset_id,
                audit_name,
                notes,
                seed_count,
                len(word_rows),
                len(example_rows),
                len(issues),
                bad_example_count_words,
                bad_primary_count_words,
                lexicon_failures,
                missing_lemma,
                same_word_duplicate_sentences,
                same_word_duplicate_translations,
                cross_word_duplicate_sentence_groups,
                cross_word_duplicate_translation_groups,
            ),
        ).lastrowid

        for issue in issues:
            conn.execute(
                """
                INSERT INTO audit_issues (
                  audit_run_id, dataset_id, issue_type, word_id, example_id, rank, sentence, translation, details
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    audit_run_id,
                    dataset_id,
                    issue["issue_type"],
                    issue.get("word_id"),
                    issue.get("example_id"),
                    issue.get("rank"),
                    issue.get("sentence", ""),
                    issue.get("translation", ""),
                    issue.get("details", ""),
                ),
            )

    print(
        json.dumps(
            {
                "dataset_id": dataset_id,
                "db_path": str(DB_PATH),
                "audit_name": audit_name,
                "notes": notes,
                "seed_count": seed_count,
                "word_count": len(word_rows),
                "example_count": len(example_rows),
                "issue_count": len(issues),
                "bad_example_count_words": bad_example_count_words,
                "bad_primary_count_words": bad_primary_count_words,
                "lexicon_failures": lexicon_failures,
                "missing_lemma": missing_lemma,
                "same_word_duplicate_sentences": same_word_duplicate_sentences,
                "same_word_duplicate_translations": same_word_duplicate_translations,
                "cross_word_duplicate_sentence_groups": cross_word_duplicate_sentence_groups,
                "cross_word_duplicate_translation_groups": cross_word_duplicate_translation_groups,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Corpus generation orchestrator helpers.")
    parser.add_argument("--db-path", default=str(DEFAULT_DB_PATH))
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("init-db")
    subparsers.add_parser("show-registry")

    register = subparsers.add_parser("register-source-dataset")
    register.add_argument("--dataset-id", required=True)
    register.add_argument("--name", required=True)
    register.add_argument("--lang", required=True)
    register.add_argument("--kind", required=True)
    register.add_argument("--source-file", required=True)
    register.add_argument("--source-label", required=True)
    register.add_argument("--metadata-json", required=True)

    seed = subparsers.add_parser("seed-source-translations")
    seed.add_argument("json_file", help="Path to source translation seed JSON.")
    seed.add_argument("--dataset-id", required=True)

    preview_seed = subparsers.add_parser("preview-source-translations")
    preview_seed.add_argument("--dataset-id", required=True)
    preview_seed.add_argument("--limit", type=int, default=10)

    purge = subparsers.add_parser("purge-dataset")
    purge.add_argument("--dataset-id", required=True)

    export_jobs = subparsers.add_parser("export-generation-jobs")
    export_jobs.add_argument("--dataset-id", required=True)
    export_jobs.add_argument("--output-file", required=True)
    export_jobs.add_argument("--start-rank", type=int, required=True)
    export_jobs.add_argument("--end-rank", type=int, required=True)
    export_jobs.add_argument("--include-existing", action="store_true")

    coverage = subparsers.add_parser("coverage")
    coverage.add_argument("--dataset-id", required=True)

    metrics = subparsers.add_parser("dataset-metrics")
    metrics.add_argument("--dataset-id", required=True)

    compare_metrics = subparsers.add_parser("compare-lower-level-metrics")
    compare_metrics.add_argument("--dataset-id", required=True)

    audit = subparsers.add_parser("audit-dataset")
    audit.add_argument("--dataset-id", required=True)
    audit.add_argument("--audit-name", required=True)
    audit.add_argument("--notes", default="")

    ingest = subparsers.add_parser("ingest-result")
    ingest.add_argument("json_file", help="Path to a final word JSON payload.")

    ingest_jsonl_parser = subparsers.add_parser("ingest-jsonl")
    ingest_jsonl_parser.add_argument("jsonl_file", help="Path to a JSONL file of final word payloads.")

    validate_jsonl_parser = subparsers.add_parser("validate-jsonl")
    validate_jsonl_parser.add_argument("jsonl_file", help="Path to a JSONL file of final word payloads.")

    merge_batch = subparsers.add_parser("merge-agent-batch")
    merge_batch.add_argument("--dataset-id", required=True)
    merge_batch.add_argument("--generator1-file", required=True)
    merge_batch.add_argument("--generator2-file", required=True)

    args = parser.parse_args()
    set_db_path(args.db_path)

    if args.command == "init-db":
        init_db()
    elif args.command == "show-registry":
        show_registry()
    elif args.command == "register-source-dataset":
        init_db()
        register_source_dataset(
            args.dataset_id,
            args.name,
            args.lang,
            args.kind,
            args.source_file,
            args.source_label,
            args.metadata_json,
        )
    elif args.command == "seed-source-translations":
        init_db()
        seed_source_translations(args.json_file, args.dataset_id)
    elif args.command == "preview-source-translations":
        preview_source_translations(args.dataset_id, args.limit)
    elif args.command == "purge-dataset":
        purge_dataset(args.dataset_id)
    elif args.command == "export-generation-jobs":
        export_generation_jobs(
            args.dataset_id,
            args.output_file,
            args.start_rank,
            args.end_rank,
            args.include_existing,
        )
    elif args.command == "coverage":
        show_coverage(args.dataset_id)
    elif args.command == "dataset-metrics":
        show_dataset_metrics(args.dataset_id)
    elif args.command == "compare-lower-level-metrics":
        compare_lower_level_metrics(args.dataset_id)
    elif args.command == "audit-dataset":
        audit_dataset(args.dataset_id, args.audit_name, args.notes)
    elif args.command == "ingest-result":
        payload = json.loads(Path(args.json_file).read_text())
        upsert_word(payload)
    elif args.command == "ingest-jsonl":
        ingest_jsonl(args.jsonl_file)
    elif args.command == "validate-jsonl":
        validate_jsonl(args.jsonl_file)
    elif args.command == "merge-agent-batch":
        merge_agent_batch(args.dataset_id, args.generator1_file, args.generator2_file)


if __name__ == "__main__":
    main()
