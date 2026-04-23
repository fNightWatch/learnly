import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-10.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass10"


REPAIRS = {
    240: {
        "secondary_glosses": [],
        "notes": "Used for formally taking or holding a specific role, post, or duty.",
        "examples": [
            {
                "sentence": "毕业以后，她一直在这所学校担任音乐老师。",
                "translation": "After graduating, she has worked as a music teacher at this school.",
                "meaning_en": "serve as",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "在这次活动中，他担任主持人，负责介绍每一位嘉宾。",
                "translation": "At this event, he served as the host and was responsible for introducing each guest.",
                "meaning_en": "serve as",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她年轻的时候曾经担任记者，后来才开始写小说。",
                "translation": "When she was younger, she worked as a journalist, and only later started writing novels.",
                "meaning_en": "serve as",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    249: {
        "primary_gloss": "block",
        "secondary_glosses": ["shield"],
        "notes": "Usually means blocking something or getting in the way; with 风, 雨, 太阳, and similar things, it often means shielding someone or something from it.",
        "examples": [
            {
                "sentence": "前面的车坏了，把整条路都挡住了。",
                "translation": "The vehicle in front broke down and blocked the whole road.",
                "meaning_en": "block",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "窗外的树把太阳挡住了，房间里舒服多了。",
                "translation": "The tree outside blocked the sun, so the room felt much more comfortable.",
                "meaning_en": "block",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她站在门口替我挡风，我就没那么冷了。",
                "translation": "She stood in the doorway to shield me from the wind, and I did not feel so cold anymore.",
                "meaning_en": "shield",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    265: {
        "primary_gloss": "to equal",
        "secondary_glosses": ["to amount to", "be tantamount to"],
        "notes": "Used for exact equality in scores, money, time, or size; by extension it can also mean amounting to the same result.",
        "examples": [
            {
                "sentence": "这次考试的总分等于平时成绩加口试成绩。",
                "translation": "The total score for this exam equals the coursework score plus the oral exam score.",
                "meaning_en": "equal",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这笔钱等于我们一个月的房租。",
                "translation": "This amount equals one month's rent for us.",
                "meaning_en": "be equal to",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "现在放弃，等于把前面的努力都浪费了。",
                "translation": "Giving up now would amount to wasting all the effort you have already put in.",
                "meaning_en": "amount to",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    456: {
        "secondary_glosses": ["have an allergic reaction"],
        "notes": "Used for allergies to food, medicine, pollen, and similar things. It can describe both a person's condition and the reaction itself.",
        "examples": [
            {
                "sentence": "我对海鲜过敏，所以出去吃饭前总要先问清楚。",
                "translation": "I'm allergic to seafood, so I always ask first before eating out.",
                "meaning_en": "to be allergic",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "医生先问我对什么药过敏，再让我吃药。",
                "translation": "The doctor first asked what medicine I was allergic to before letting me take it.",
                "meaning_en": "to be allergic",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她用了这种药以后，身上马上就过敏了。",
                "translation": "After she used this medicine, she immediately had an allergic reaction all over her body.",
                "meaning_en": "have an allergic reaction",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    463: {
        "primary_gloss": "to contain",
        "secondary_glosses": ["to imply", "to hold in the mouth"],
        "notes": "More formal or written when it means contain; it also appears when words or expressions carry an implied meaning.",
        "examples": [
            {
                "sentence": "这份材料里含很多有用信息，开会前最好先看一遍。",
                "translation": "This material contains a lot of useful information, so it is best to read through it once before the meeting.",
                "meaning_en": "contain",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他的话里含一点批评的意思，不过大家都听出来了。",
                "translation": "What he said carried a hint of criticism, but everyone picked up on it.",
                "meaning_en": "imply",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "孩子嘴里含着糖，所以说话不太清楚。",
                "translation": "The child had candy in his mouth, so he was not speaking very clearly.",
                "meaning_en": "hold in the mouth",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1049: {
        "secondary_glosses": ["handicrafts"],
        "notes": "As an adjective, it means made by hand; in 做手工, it refers to handicrafts or craft work done by hand.",
        "examples": [
            {
                "sentence": "这个包是手工做的，所以每一个都不完全一样。",
                "translation": "This bag is handmade, so no two are exactly the same.",
                "meaning_en": "handmade",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她周末常在家做手工，做好以后就送给朋友。",
                "translation": "She often does handicrafts at home on weekends, and after finishing them she gives them to friends.",
                "meaning_en": "handicrafts",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这家店的手工围巾虽然贵一点，但是冬天特别受欢迎。",
                "translation": "The handmade scarves in this shop are a bit expensive, but they are especially popular in winter.",
                "meaning_en": "handmade",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1069: {
        "primary_gloss": "fall; hit the ground hard",
        "secondary_glosses": ["throw down"],
        "notes": "Used when a person or object falls hard; with an object it can also mean throwing or slamming it down.",
        "examples": [
            {
                "sentence": "路口太滑，他骑车转弯时一下子摔倒了。",
                "translation": "The road was too slippery, and he fell while turning the corner on his bike.",
                "meaning_en": "fall",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "手机从他手里滑下来，摔在地上以后就不能用了。",
                "translation": "The phone slipped out of his hand, hit the ground, and stopped working.",
                "meaning_en": "fall",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他听完以后很生气，把手里的杯子摔在地上。",
                "translation": "After hearing that, he got angry and threw the cup in his hand onto the ground.",
                "meaning_en": "throw down",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1197: {
        "primary_gloss": "to be located in",
        "notes": "A formal verb used in written or informational contexts to state where a place, building, or institution is located.",
        "examples": [
            {
                "sentence": "这座博物馆位于市中心，交通非常方便。",
                "translation": "This museum is located in the city center, so transportation is very convenient.",
                "meaning_en": "to be located in",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "会场位于酒店二楼，门外有人负责接待。",
                "translation": "The venue is located on the second floor of the hotel, with someone outside handling reception.",
                "meaning_en": "to be located in",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "学校图书馆位于操场北边，晚上也对外开放。",
                "translation": "The school library is located north of the sports field and is also open to the public at night.",
                "meaning_en": "to be located in",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1226: {
        "notes": "Used mainly for academic departments in schools and universities, often in compounds like 中文系 or 法律系.",
        "examples": [
            {
                "sentence": "她在大学读法律系，希望以后当律师。",
                "translation": "She is in the law department at university and hopes to become a lawyer later.",
                "meaning_en": "department",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这个系每年都会请作家来学校开讲座。",
                "translation": "This department invites writers to the school to give talks every year.",
                "meaning_en": "department",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他们学校的音乐系常常举办公开演出。",
                "translation": "Their school's music department often puts on public performances.",
                "meaning_en": "department",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    267: {
        "secondary_glosses": ["really"],
        "notes": "A slightly formal adverb used to confirm that something really is true or exactly as described.",
        "examples": [
            {
                "sentence": "你提醒得对，这样做的确更安全。",
                "translation": "You were right to point that out; doing it this way is indeed safer.",
                "meaning_en": "indeed",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这份报告虽然不长，但内容的确很完整。",
                "translation": "Although this report is not long, its content is indeed quite complete.",
                "meaning_en": "indeed",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他说得很简单，可是真正做起来的确不容易。",
                "translation": "He makes it sound simple, but it really is not easy when you actually do it.",
                "meaning_en": "really",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1430: {
        "primary_gloss": "existing",
        "secondary_glosses": ["original"],
        "notes": "Describes something that was already there before a later change, especially in phrases like 原有安排, 原有设备, or 在原有基础上.",
        "examples": [
            {
                "sentence": "新计划不会影响公司原有的安排。",
                "translation": "The new plan will not affect the company's existing arrangements.",
                "meaning_en": "existing",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "在原有基础上，我们又增加了夜间服务。",
                "translation": "Building on what was already there, we added night services.",
                "meaning_en": "existing",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "学校在原有制度上做了不少调整。",
                "translation": "The school made quite a few adjustments to the existing system.",
                "meaning_en": "existing",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1555: {
        "primary_gloss": "to hurry and make the most of",
        "secondary_glosses": ["hold tight"],
        "notes": "Very often used with 时间 or 机会 to mean hurrying to use limited time or a chance well; it can also mean holding something firmly.",
        "examples": [
            {
                "sentence": "离考试只剩一个月了，你得抓紧时间复习。",
                "translation": "There is only one month left before the exam, so you need to make the most of your time reviewing.",
                "meaning_en": "to hurry and make the most of",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "坐车的时候请抓紧扶手，别着急下车。",
                "translation": "Please hold tight to the handrail while riding, and do not rush to get off.",
                "meaning_en": "hold tight",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "要是想按时交，就得抓紧把最后一部分写完。",
                "translation": "If you want to hand it in on time, you need to hurry and finish the last part.",
                "meaning_en": "to hurry and make the most of",
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

            if "primary_gloss" in repair:
                payload["glosses"]["primary_gloss"] = repair["primary_gloss"]
            if "secondary_glosses" in repair:
                payload["glosses"]["secondary_glosses"] = repair["secondary_glosses"]
            if "notes" in repair:
                payload["glosses"]["notes"] = repair["notes"]

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
