import json
import sqlite3
from pathlib import Path


DB_PATH = Path("/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite")
OUTPUT_PATH = Path("/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-02.jsonl")
SOURCE = "orchestrator-strict-repair-2026-04-18-pass2"


REPAIRS = {
    13: {
        "pos": "time noun, noun",
        "primary_gloss": "midnight; the middle of the night",
        "secondary_glosses": [],
        "notes": "A time noun meaning midnight or the middle of the night.",
    },
    41: {
        "pos": "adjective, noun",
        "primary_gloss": "local",
        "secondary_glosses": ["the local area"],
        "notes": "Usually describes something from the local area, such as local food, local conditions, or local media.",
    },
    50: {
        "pos": "adverb",
        "primary_gloss": "after all",
        "secondary_glosses": [],
        "notes": "Used when giving a reason or reminding someone of an important fact that should not be forgotten.",
        "example_updates": {
            1: {
                "translation": "It is his first time here; after all, he is still not very familiar with the place.",
            },
            2: {
                "translation": "I still decided to help him; after all, we have known each other for many years.",
            },
            3: {
                "translation": "Rest first. After all, your health matters more.",
            },
        },
    },
    54: {
        "pos": "adjective",
        "primary_gloss": "essential; indispensable",
        "secondary_glosses": ["required"],
        "notes": "Describes something that is necessary and cannot really be left out.",
        "example_updates": {
            1: {
                "translation": "Water and air are both indispensable to human life.",
                "meaning_en": "indispensable",
            },
            3: {
                "sentence": "做这份工作，耐心是必需的。",
                "translation": "For this job, patience is essential.",
                "meaning_en": "essential",
            },
        },
    },
    68: {
        "pos": "noun",
        "primary_gloss": "hospital ward",
        "secondary_glosses": ["ward"],
        "notes": "A hospital room or section where patients stay and receive care.",
    },
    74: {
        "pos": "adverb, adjective, noun",
        "primary_gloss": "unfortunately; unfortunate",
        "secondary_glosses": ["misfortune"],
        "notes": "Can introduce something unfortunate, describe something unfortunate, or refer to misfortune itself.",
        "example_updates": {
            1: {
                "meaning_en": "unfortunately",
            },
        },
    },
    80: {
        "pos": "conjunction",
        "primary_gloss": "otherwise",
        "secondary_glosses": ["or else"],
        "notes": "A spoken linker used before the bad or unwanted result that will happen if the earlier advice is not followed.",
    },
    84: {
        "pos": "noun, verb",
        "primary_gloss": "referee; judge",
        "secondary_glosses": ["to judge"],
        "notes": "Can mean a referee or judge in a competition, and it can also mean to judge or decide the result.",
    },
    89: {
        "pos": "verb, noun",
        "primary_gloss": "refer to; consult",
        "secondary_glosses": ["reference"],
        "notes": "Can mean to consult or refer to something, and it also appears in the noun use for reference.",
    },
    265: {
        "pos": "verb",
        "primary_gloss": "to equal; to amount to",
        "secondary_glosses": ["be tantamount to"],
        "notes": "Can mean being exactly equal in value or number, and it also often means amounting to the same result.",
        "example_updates": {
            3: {
                "sentence": "现在不学，等于以后更难。",
                "translation": "If you do not study now, that amounts to making things harder later.",
                "meaning_en": "to amount to",
            },
        },
    },
    571: {
        "pos": "adverb",
        "primary_gloss": "simply; downright",
        "secondary_glosses": ["really", "practically"],
        "notes": "An emphatic adverb used when the speaker feels something is really or almost unbelievably so.",
        "example_updates": {
            2: {
                "translation": "He is so busy that he has absolutely no time to eat.",
                "meaning_en": "absolutely",
            },
        },
    },
    618: {
        "pos": "adverb, noun",
        "primary_gloss": "recently; in the near term",
        "secondary_glosses": ["the recent period"],
        "notes": "Refers to the recent period or the near future, and is broader in time than 近日.",
        "example_updates": {
            1: {
                "translation": "Weather has been changing a lot recently, so everyone should be more careful.",
                "meaning_en": "recently",
            },
            3: {
                "meaning_en": "recently",
            },
        },
    },
    722: {
        "pos": "adverb, adjective",
        "primary_gloss": "temporary; at the last minute",
        "secondary_glosses": ["temporarily"],
        "notes": "Can describe something temporary, or something that changes suddenly at the last minute.",
        "example_updates": {
            1: {
                "translation": "Something came up at the last minute, so I cannot go today.",
                "meaning_en": "at the last minute",
            },
        },
    },
    853: {
        "pos": "pronoun",
        "primary_gloss": "its; his/her",
        "secondary_glosses": [],
        "notes": "A formal written possessive pronoun placed before a noun. This row focuses on that common written use only.",
    },
    1050: {
        "pos": "noun, verb",
        "primary_gloss": "surgery; to operate",
        "secondary_glosses": [],
        "notes": "Can mean a surgery as a noun, and it can also mean performing an operation as a verb in medical contexts.",
        "example_updates": {
            3: {
                "sentence": "情况比较急，医生准备马上给他手术。",
                "translation": "The situation is rather urgent, and the doctor is preparing to operate on him right away.",
                "meaning_en": "to operate",
            },
        },
    },
    1195: {
        "pos": "verb, interjection",
        "primary_gloss": "to feed; hello",
        "secondary_glosses": ["hey"],
        "notes": "Can mean feeding a person or animal, and it is also a very common spoken opening like hello? when answering or starting a call.",
        "example_updates": {
            2: {
                "sentence": "喂，你到哪儿了？我们都在等你。",
                "translation": "Hello, where are you now? We are all waiting for you.",
                "meaning_en": "hello",
            },
        },
    },
    1338: {
        "pos": "conjunction",
        "primary_gloss": "otherwise; how about",
        "secondary_glosses": ["or else"],
        "notes": "A spoken linker that can warn about an unwanted result, and it can also introduce a suggestion like how about....",
        "example_updates": {
            2: {
                "sentence": "要不我们先回去，明天再来吧。",
                "translation": "How about we go back first and come again tomorrow?",
                "meaning_en": "how about",
            },
        },
    },
    1362: {
        "pos": "preposition, conjunction",
        "primary_gloss": "by means of; taking ... as",
        "secondary_glosses": ["judging by"],
        "notes": "A formal function word used in patterns like 以...说明..., 以...为..., and 以...来看 to show means, standard, or point of view.",
        "examples": [
            {
                "sentence": "我们应该以事实说明问题。",
                "translation": "We should explain the problem by means of facts.",
                "meaning_en": "by means of",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我们以这个办法来做。",
                "translation": "We are doing it by using this method.",
                "meaning_en": "by means of",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "以现在的速度看，下午能到。",
                "translation": "Judging by the current speed, we can arrive this afternoon.",
                "meaning_en": "judging by",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1444: {
        "pos": "postposition",
        "primary_gloss": "including",
        "secondary_glosses": ["within the total"],
        "notes": "Placed after a noun to show that it is included in the total, as in 经理在内 or 学费在内.",
    },
    1589: {
        "pos": "adjective",
        "primary_gloss": "enough; sufficient",
        "secondary_glosses": [],
        "notes": "Describes a quantity, amount of time, amount of space, or ability as being enough for what is needed.",
    },
    1596: {
        "pos": "adverb, adjective",
        "primary_gloss": "at first; initial",
        "secondary_glosses": [],
        "notes": "Can mean at first in time, and it can also describe the initial stage or original plan.",
    },
    1600: {
        "pos": "verb",
        "primary_gloss": "to make; to render",
        "secondary_glosses": ["to make a contribution"],
        "notes": "Usually appears in formal phrases like 作出决定, 作出判断, or 作出贡献.",
        "example_updates": {
            2: {
                "meaning_en": "to render",
            },
        },
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

            payload["word"]["pos"] = repair["pos"]
            payload["glosses"]["primary_gloss"] = repair["primary_gloss"]
            payload["glosses"]["secondary_glosses"] = repair["secondary_glosses"]
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
