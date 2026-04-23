import json
import sqlite3
from pathlib import Path


DB_PATH = Path("/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite")
OUTPUT_PATH = Path("/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-03.jsonl")
SOURCE = "orchestrator-strict-repair-2026-04-18-pass3"


REPAIRS = {
    211: {
        "examples": [
            {
                "sentence": "这个措施出来以后，大家报名方便多了。",
                "translation": "After this measure came out, it became much easier for everyone to sign up.",
                "meaning_en": "measure",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "为了让交通更安全，政府出了新的措施。",
                "translation": "To make traffic safer, the government introduced new measures.",
                "meaning_en": "measure",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "为了解决这个问题，他们想了不少措施。",
                "translation": "To solve this problem, they thought of quite a few measures.",
                "meaning_en": "step",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    219: {
        "examples": [
            {
                "sentence": "这个班的学生大多已经看过这本书了。",
                "translation": "Most of the students in this class have already read this book.",
                "meaning_en": "mostly",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "周末来这家店吃饭的人，大多是一家人。",
                "translation": "Most of the people who come to eat at this place on weekends are whole families.",
                "meaning_en": "mostly",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这些问题大多不难，只要认真看就行。",
                "translation": "Most of these problems are not hard, as long as you look carefully.",
                "meaning_en": "mostly",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    562: {
        "examples": [
            {
                "sentence": "没有驾照的人，不能自己开车上路。",
                "translation": "People without a driver's license cannot drive on the road by themselves.",
                "meaning_en": "driver's license",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他考试过了以后，马上去拿驾照。",
                "translation": "After passing the exam, he went to get his driver's license right away.",
                "meaning_en": "driver's license",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "出门前他一直找驾照，怕路上要检查。",
                "translation": "Before leaving, he kept looking for his driver's license because he was afraid there might be a check on the road.",
                "meaning_en": "driver's license",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    653: {
        "examples": [
            {
                "sentence": "医生让我多喝开水，少喝咖啡。",
                "translation": "The doctor told me to drink more hot boiled water and less coffee.",
                "meaning_en": "boiled water",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这杯开水太热了，你等一会儿再喝。",
                "translation": "This cup of hot boiled water is too hot, so wait a little before drinking it.",
                "meaning_en": "boiled water",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "外面很冷，回家先喝点开水吧。",
                "translation": "It is cold outside, so have some hot boiled water first after you get home.",
                "meaning_en": "boiled water",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    674: {
        "examples": [
            {
                "sentence": "他把钱放在口袋里，出去买东西了。",
                "translation": "He put the money in his pocket and went out to buy something.",
                "meaning_en": "pocket",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她从口袋里拿出手机，先看了时间。",
                "translation": "She took her phone out of her pocket and first checked the time.",
                "meaning_en": "pocket",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这件衣服没有口袋，用起来不太方便。",
                "translation": "This piece of clothing has no pockets, so it is not very convenient to use.",
                "meaning_en": "pocket",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    889: {
        "primary_gloss": "emotion; feeling",
        "secondary_glosses": ["affection"],
        "notes": "Feelings and emotional responses, whether in daily life, relationships, music, or writing.",
        "example_updates": {
            1: {
                "translation": "The song is simple, but the feeling in it is very genuine.",
                "meaning_en": "feeling",
            },
        },
    },
    1003: {
        "examples": [
            {
                "sentence": "他给孩子读了一首诗，孩子听得很认真。",
                "translation": "He read a poem to the child, and the child listened very carefully.",
                "meaning_en": "poem",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这首诗写得很美，读完以后心里很安静。",
                "translation": "This poem is beautifully written, and after reading it your heart feels very calm.",
                "meaning_en": "poem",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "以前她也常常写诗，把心里的话写下来。",
                "translation": "She also used to write poetry often, putting the words in her heart down on paper.",
                "meaning_en": "poetry",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1066: {
        "examples": [
            {
                "sentence": "窗外照进来一束阳光。",
                "translation": "A beam of sunlight is shining in from outside the window.",
                "meaning_en": "measure word for beams of light",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他买了一束花，想下班以后送给妈妈。",
                "translation": "He bought a bouquet of flowers because he wanted to give it to his mother after work.",
                "meaning_en": "measure word for bunches",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "前面忽然有一束光，大家都停下来看。",
                "translation": "A beam of light suddenly appeared ahead, and everyone stopped to look.",
                "meaning_en": "measure word for beams of light",
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
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    with OUTPUT_PATH.open("w", encoding="utf-8") as handle:
        for rank in sorted(REPAIRS):
            payload = current_payload_for_rank(conn, rank)
            repair = REPAIRS[rank]

            if "primary_gloss" in repair:
                payload["glosses"]["primary_gloss"] = repair["primary_gloss"]
            if "secondary_glosses" in repair:
                payload["glosses"]["secondary_glosses"] = repair["secondary_glosses"]
            if "notes" in repair:
                payload["glosses"]["notes"] = repair["notes"]

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

            for ex_number, updates in repair.get("example_updates", {}).items():
                example = payload["examples"][ex_number - 1]
                translation = payload["example_translations"][ex_number - 1]
                if "sentence" in updates:
                    example["sentence"] = updates["sentence"]
                if "meaning_en" in updates:
                    example["meaning_en"] = updates["meaning_en"]
                if "difficulty" in updates:
                    example["difficulty"] = updates["difficulty"]
                if "is_primary" in updates:
                    example["is_primary"] = updates["is_primary"]
                if "translation" in updates:
                    translation["translation"] = updates["translation"]

            handle.write(json.dumps(payload, ensure_ascii=False) + "\n")

    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
