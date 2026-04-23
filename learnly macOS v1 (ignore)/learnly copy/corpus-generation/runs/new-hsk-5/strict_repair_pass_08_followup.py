import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-08-followup.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass8-followup"


REPAIRS = {
    166: {},
    463: {
        "examples": [
            {
                "sentence": "这种水果含很多水分。",
                "translation": "This fruit is rich in moisture.",
                "meaning_en": "contain",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这句话含两层意思。",
                "translation": "This sentence has two layers of meaning.",
                "meaning_en": "imply",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她嘴里含着一块糖。",
                "translation": "She has a piece of candy in her mouth.",
                "meaning_en": "hold in the mouth",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
}


def current_payload_for_rank(conn: sqlite3.Connection, rank: int) -> dict:
    word_row = conn.execute(
        """
        SELECT id, lang, lemma, display_form, pos, rank, pronunciation,
               primary_gloss, secondary_glosses_json, notes
        FROM words
        WHERE rank = ?
        """,
        (rank,),
    ).fetchone()
    if not word_row:
        raise ValueError(f"Missing word at rank {rank}")

    examples = []
    translations = []
    for row in conn.execute(
        """
        SELECT id, sentence, translation, meaning_en, difficulty, is_primary
        FROM examples
        WHERE word_id = ?
        ORDER BY id
        """,
        (word_row["id"],),
    ):
        examples.append(
            {
                "id": row["id"],
                "sentence": row["sentence"],
                "meaning_en": row["meaning_en"],
                "difficulty": row["difficulty"],
                "source": SOURCE,
                "is_primary": bool(row["is_primary"]),
            }
        )
        translations.append(
            {
                "example_id": row["id"],
                "translation": row["translation"],
            }
        )

    return {
        "word": {
            "id": word_row["id"],
            "lang": word_row["lang"],
            "lemma": word_row["lemma"],
            "display_form": word_row["display_form"],
            "pos": word_row["pos"],
            "rank": word_row["rank"],
            "pronunciation": word_row["pronunciation"],
        },
        "glosses": {
            "primary_gloss": word_row["primary_gloss"],
            "secondary_glosses": json.loads(word_row["secondary_glosses_json"]),
            "notes": word_row["notes"],
        },
        "examples": examples,
        "example_translations": translations,
    }


def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    with open(OUTPUT_PATH, "w", encoding="utf-8") as handle:
        for rank in sorted(REPAIRS):
            payload = current_payload_for_rank(conn, rank)
            repair = REPAIRS[rank]

            if "examples" in repair:
                examples = []
                translations = []
                for idx, item in enumerate(repair["examples"], start=1):
                    example_id = f"{payload['word']['id']}-ex{idx}"
                    examples.append(
                        {
                            "id": example_id,
                            "sentence": item["sentence"],
                            "meaning_en": item["meaning_en"],
                            "difficulty": item["difficulty"],
                            "source": SOURCE,
                            "is_primary": item["is_primary"],
                        }
                    )
                    translations.append(
                        {
                            "example_id": example_id,
                            "translation": item["translation"],
                        }
                    )
                payload["examples"] = examples
                payload["example_translations"] = translations

            handle.write(json.dumps(payload, ensure_ascii=False) + "\n")

    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
