#!/usr/bin/env python3

from __future__ import annotations

import csv
import io
import json
import re
import subprocess
import unicodedata
from pathlib import Path
from typing import Any

LEVELS = range(1, 7)
WORDLIST_URL_TEMPLATE = (
    "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/new/{level}.min.json"
)
SENTENCES_URL = (
    "https://raw.githubusercontent.com/krmanik/Chinese-Example-Sentences/main/Chinese%20Example%20Sentences/cmn_sen_db_2.tsv"
)
OUTPUT_PATH = Path("src/lib/demo/generated/chinese-hsk-corpus.ts")

POS_MAP = {
    "n": "noun",
    "nr": "proper noun",
    "ns": "proper noun",
    "nt": "proper noun",
    "nz": "proper noun",
    "v": "verb",
    "vn": "verb",
    "a": "adjective",
    "ad": "adverb",
    "an": "adjective",
    "d": "adverb",
    "m": "numeral",
    "q": "classifier",
    "mq": "classifier",
    "r": "pronoun",
    "t": "time",
    "f": "direction",
    "s": "noun",
    "c": "conjunction",
    "p": "preposition",
    "u": "particle",
    "y": "particle",
    "e": "interjection",
    "b": "noun",
    "i": "phrase",
    "l": "phrase",
    "z": "adjective"
}

LEVEL_DESCRIPTIONS = {
    1: "Foundational high-frequency Mandarin for the first HSK band.",
    2: "Early conversational Mandarin that expands daily range beyond the basics.",
    3: "Intermediate HSK vocabulary for more connected Mandarin reading and listening.",
    4: "Core upper-intermediate Mandarin vocabulary for denser real-world input.",
    5: "Advanced HSK vocabulary for longer-form reading, media, and discussion.",
    6: "High-range HSK vocabulary for academic and professional Mandarin comprehension."
}

GENERIC_EXAMPLES = {
    "noun": ("这个词是“{word}”。", 'This word is "{word}".'),
    "verb": ("我想学会“{word}”这个说法。", 'I want to learn how to say "{word}".'),
    "adjective": ("“{word}”是今天的新词。", '"{word}" is today\'s new word.'),
    "classifier": ("我正在记住“{word}”这个量词。", 'I am memorizing the classifier "{word}".'),
    "particle": ("这个句子里用了“{word}”。", 'This sentence uses "{word}".'),
    "phrase": ("我正在练习“{word}”这个表达。", 'I am practicing the expression "{word}".')
}

BAD_GLOSS_PATTERNS = [
    re.compile(r"^surname\b", re.I),
    re.compile(r"\bloanword\b", re.I),
    re.compile(r"^variant of\b", re.I),
    re.compile(r"^old variant\b", re.I),
    re.compile(r"^see also\b", re.I),
]

BAD_TRANSLATION_PATTERNS = [
    re.compile(r"\bmuiriel\b", re.I),
    re.compile(r"\bah\?\b", re.I),
]

POS_HINTS = {
    "particle": re.compile(r"\bparticle\b", re.I),
    "classifier": re.compile(r"\bclassifier\b", re.I),
    "pronoun": re.compile(r"\bpronoun\b", re.I),
    "numeral": re.compile(r"\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand)\b", re.I),
}


def fetch_text(url: str) -> str:
    return subprocess.check_output(["curl", "-L", url], text=True)


def compact_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")
    return slug or "term"


def normalize_gloss(meanings: list[str]) -> tuple[str, list[str], str | None]:
    cleaned: list[str] = []
    for meaning in meanings:
        segments = [compact_spaces(part) for part in re.split(r"[;/]", meaning) if compact_spaces(part)]
        cleaned.extend(segments)

    deduped: list[str] = []
    for meaning in cleaned:
        if meaning not in deduped:
            deduped.append(meaning)

    preferred = next(
        (meaning for meaning in deduped if not any(pattern.search(meaning) for pattern in BAD_GLOSS_PATTERNS)),
        deduped[0] if deduped else "meaning pending",
    )
    secondary = [meaning for meaning in deduped if meaning != preferred][:4]
    notes = "; ".join(secondary[:3]) if secondary else None
    return preferred, secondary, notes


def score_form(primary_gloss: str, pronunciation: str, preferred_pos: str) -> int:
    score = 0
    if any(pattern.search(primary_gloss) for pattern in BAD_GLOSS_PATTERNS):
        score += 80
    if pronunciation and pronunciation[:1].isupper():
        score += 24
    if re.search(r"\b(coll\.|abbr\.|loanword)\b", primary_gloss, re.I):
        score += 18
    hint = POS_HINTS.get(preferred_pos)
    if hint and not hint.search(primary_gloss):
        score += 28
    score += max(0, len(primary_gloss) - 36)
    return score


def choose_best_form(forms: list[dict[str, Any]], preferred_pos: str) -> tuple[dict[str, Any], str, list[str], str | None]:
    best_form = forms[0]
    best_primary, best_secondary, best_notes = normalize_gloss(best_form.get("m") or [])
    best_pronunciation = compact_spaces((best_form.get("i") or {}).get("y", ""))
    best_score = score_form(best_primary, best_pronunciation, preferred_pos)

    for form in forms[1:]:
        primary, secondary, notes = normalize_gloss(form.get("m") or [])
        pronunciation = compact_spaces((form.get("i") or {}).get("y", ""))
        score = score_form(primary, pronunciation, preferred_pos)
        if score < best_score:
            best_form = form
            best_primary, best_secondary, best_notes = primary, secondary, notes
            best_score = score

    return best_form, best_primary, best_secondary, best_notes


def score_sentence(word: str, sentence: str, english: str) -> int:
    score = abs(len(sentence) - 14)
    if len(sentence) < 5:
        score += 16
    if len(sentence) > 28:
        score += len(sentence) - 28
    if sentence.count(word) > 1:
        score += 6
    if any(char.isdigit() for char in sentence):
        score += 30
    if re.search(r"[A-Za-z]", sentence):
        score += 12
    if len(english) > 120:
        score += len(english) - 120
    if english and english[0].islower():
        score += 6
    if english.endswith("!"):
        score += 2
    if any(pattern.search(english) for pattern in BAD_TRANSLATION_PATTERNS):
        score += 40
    return score


def load_hsk_rows() -> tuple[list[dict[str, Any]], dict[int, list[str]]]:
    rows: list[dict[str, Any]] = []
    list_membership: dict[int, list[str]] = {level: [] for level in LEVELS}
    global_rank = 1

    for level in LEVELS:
        payload = json.loads(fetch_text(WORDLIST_URL_TEMPLATE.format(level=level)))
        for index, entry in enumerate(payload, start=1):
            simplified = compact_spaces(entry.get("s", ""))
            forms = entry.get("f") or []
            if not simplified or not forms:
                continue

            pos_codes = entry.get("p") or []
            pos = POS_MAP.get(pos_codes[0], "word") if pos_codes else "word"
            best_form, primary_gloss, secondary_glosses, notes = choose_best_form(forms, pos)
            info = best_form.get("i") or {}
            pinyin = compact_spaces(info.get("y", ""))
            item_id = f"zh-hsk-{level}-{index:04d}-{slugify(simplified)}"

            rows.append(
                {
                    "id": item_id,
                    "level": level,
                    "rank": global_rank,
                    "displayForm": simplified,
                    "lemma": simplified,
                    "pronunciation": pinyin,
                    "primaryGloss": primary_gloss,
                    "secondaryGlosses": secondary_glosses,
                    "notes": notes,
                    "pos": pos,
                }
            )
            list_membership[level].append(item_id)
            global_rank += 1

    return rows, list_membership


def load_sentence_candidates(target_words: set[str]) -> dict[str, list[tuple[int, str, str]]]:
    lengths = sorted({len(word) for word in target_words if word}, reverse=True)
    targets_by_length = {length: {word for word in target_words if len(word) == length} for length in lengths}
    candidates: dict[str, list[tuple[int, str, str]]] = {word: [] for word in target_words}

    raw = fetch_text(SENTENCES_URL)
    reader = csv.reader(io.StringIO(raw), delimiter="\t")
    for row in reader:
        if len(row) < 5:
            continue

        simplified = compact_spaces(row[1])
        english = compact_spaces(row[4])
        if not simplified or not english:
            continue

        seen_in_sentence: set[str] = set()
        for length in lengths:
            if len(simplified) < length:
                continue

            words_for_length = targets_by_length[length]
            for start in range(0, len(simplified) - length + 1):
                snippet = simplified[start : start + length]
                if snippet not in words_for_length or snippet in seen_in_sentence:
                    continue

                seen_in_sentence.add(snippet)
                score = score_sentence(snippet, simplified, english)
                bucket = candidates[snippet]
                bucket.append((score, simplified, english))
                bucket.sort(key=lambda value: value[0])
                del bucket[8:]

    return candidates


def pick_example(word: str, pos: str, candidates: dict[str, list[tuple[int, str, str]]]) -> tuple[str, str]:
    options = candidates.get(word) or []
    if options:
        _, sentence, translation = options[0]
        return sentence, translation

    fallback_sentence, fallback_translation = GENERIC_EXAMPLES.get(pos, GENERIC_EXAMPLES["phrase"])
    return fallback_sentence.format(word=word), fallback_translation.format(word=word)


def build_output() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    rows, list_membership = load_hsk_rows()
    candidates = load_sentence_candidates({row["displayForm"] for row in rows})

    corpus: list[dict[str, Any]] = []
    for row in rows:
        example, translation = pick_example(row["displayForm"], row["pos"], candidates)
        payload = {
            "id": row["id"],
            "languageCode": "zh",
            "type": "lemma",
            "lemma": row["lemma"],
            "displayForm": row["displayForm"],
            "primaryGloss": row["primaryGloss"],
            "pos": row["pos"],
            "rank": row["rank"],
            "example": example,
            "translation": translation,
            "pronunciation": row["pronunciation"],
        }
        if row["secondaryGlosses"]:
            payload["secondaryGlosses"] = row["secondaryGlosses"]
        if row["notes"]:
            payload["notes"] = row["notes"]
        corpus.append(payload)

    lists = [
        {
            "id": f"hsk-{level}",
            "title": f"HSK {level}",
            "description": LEVEL_DESCRIPTIONS[level],
            "itemIds": list_membership[level],
        }
        for level in LEVELS
    ]
    return corpus, lists


def write_typescript(corpus: list[dict[str, Any]], lists: list[dict[str, Any]]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(corpus, ensure_ascii=False, indent=2)
    list_payload = json.dumps(lists, ensure_ascii=False, indent=2)
    OUTPUT_PATH.write_text(
        'import type { DemoLexicalItem } from "@/lib/demo/types";\n\n'
        "export const chineseHskCorpus: DemoLexicalItem[] = "
        + payload
        + ";\n\n"
        + "export const chineseHskLists = "
        + list_payload
        + " as const;\n",
        encoding="utf8",
    )


def main() -> None:
    corpus, lists = build_output()
    write_typescript(corpus, lists)
    print(f"Wrote {len(corpus)} Chinese items and {len(lists)} HSK lists to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
