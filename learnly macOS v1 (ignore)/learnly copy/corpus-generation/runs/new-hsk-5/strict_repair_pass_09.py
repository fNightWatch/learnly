import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-09.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass9"


REPAIRS = {
    1324: {
        "notes": "Usually refers to teeth in general; with a classifier like 颗, it can also refer to a single tooth in context.",
        "examples": [
            {
                "sentence": "医生说，保护牙齿要从小开始。",
                "translation": "The doctor said that protecting your teeth should start when you are young.",
                "meaning_en": "teeth",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这颗牙齿一碰就疼，我连饭都不敢吃。",
                "translation": "This tooth hurts as soon as anything touches it, so I do not even dare eat.",
                "meaning_en": "tooth",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她笑的时候，牙齿很整齐。",
                "translation": "When she smiles, her teeth look very even.",
                "meaning_en": "teeth",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1331: {
        "notes": "Usually refers to formal public speaking; as a noun, it means the speech itself.",
        "examples": [
            {
                "sentence": "今天她代表全班上台演讲，所以有点紧张。",
                "translation": "Today she went on stage to give a speech on behalf of the whole class, so she felt a little nervous.",
                "meaning_en": "to give a speech",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他的演讲只有十分钟，却把问题讲得很清楚。",
                "translation": "His speech lasted only ten minutes, yet he explained the issue very clearly.",
                "meaning_en": "speech",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "老师希望他能代表全班上台演讲。",
                "translation": "The teacher hoped he could go on stage and give a speech on behalf of the whole class.",
                "meaning_en": "to give a speech",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1333: {
        "notes": "An outdoor platform attached to an apartment or building, often used for drying clothes, getting air, or placing plants.",
        "examples": [
            {
                "sentence": "这套房子的阳台很大，白天晒衣服很方便。",
                "translation": "The balcony in this apartment is large, so it is very convenient for drying clothes during the day.",
                "meaning_en": "balcony",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她把刚洗好的衣服放到阳台上去晒。",
                "translation": "She put the clothes she had just washed out on the balcony to dry in the sun.",
                "meaning_en": "balcony",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "晚上站在阳台上吹风，比待在房间里舒服多了。",
                "translation": "Standing on the balcony and enjoying the breeze at night is much more comfortable than staying in the room.",
                "meaning_en": "balcony",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1337: {
        "notes": "Used for people, animals, or insects biting with the mouth; common patterns include 咬人, 咬嘴唇, and 被蚊子咬.",
        "examples": [
            {
                "sentence": "这只狗不咬人，你不用怕。",
                "translation": "This dog does not bite people, so you do not need to be afraid.",
                "meaning_en": "to bite",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "紧张的时候，他总爱咬手。",
                "translation": "When he is nervous, he always tends to bite his hand.",
                "meaning_en": "to bite",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "苹果太硬，他咬了一口就不吃了。",
                "translation": "The apple was too hard, so after one bite he stopped eating it.",
                "meaning_en": "to bite",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1413: {
        "secondary_glosses": ["helpful", "good for"],
        "notes": "有益 describes something that brings clear benefit, often in patterns like 对……有益 or 有益于……, especially for health, learning, or personal development.",
        "examples": [
            {
                "sentence": "规律运动和充足的睡眠，对提高学习效率很有益。",
                "translation": "Regular exercise and sufficient sleep are very beneficial for improving study efficiency.",
                "meaning_en": "beneficial",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "多交流，对提高表达能力很有益。",
                "translation": "More communication is very beneficial for improving your ability to express yourself.",
                "meaning_en": "beneficial",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "多参加讨论，对年轻人形成自己的看法很有益。",
                "translation": "Taking part in more discussions is very beneficial for young people as they form their own views.",
                "meaning_en": "helpful",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1424: {
        "secondary_glosses": ["to guard against"],
        "notes": "预防 means taking action beforehand so illness, accidents, or other problems do not happen.",
        "examples": [
            {
                "sentence": "学校每学期都会做安全检查，预防意外发生。",
                "translation": "The school carries out safety inspections every semester to prevent accidents.",
                "meaning_en": "to prevent",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "医生提醒大家，平时要注意卫生，预防流感。",
                "translation": "Doctors remind everyone to pay attention to hygiene in daily life to prevent the flu.",
                "meaning_en": "to prevent",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "家长平时多和孩子沟通，也能预防不少问题。",
                "translation": "Parents can also prevent many problems by communicating more with their children in everyday life.",
                "meaning_en": "to guard against",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1426: {
        "notes": "玉米 refers both to the crop grown in fields and to the corn people eat as food.",
        "examples": [
            {
                "sentence": "这种玉米煮熟以后很甜，很多孩子都爱吃。",
                "translation": "This kind of corn becomes very sweet after it is cooked, and many children love it.",
                "meaning_en": "corn",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "今年天气不错，地里的玉米长得特别好。",
                "translation": "The weather has been good this year, and the corn in the fields is growing especially well.",
                "meaning_en": "corn",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "在这个地区，很多农民靠种玉米增加收入。",
                "translation": "In this area, many farmers increase their income by growing corn.",
                "meaning_en": "corn",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1442: {
        "secondary_glosses": ["to be on the scene"],
        "notes": "在场 means being physically present when a meeting, negotiation, accident, or other event takes place.",
        "examples": [
            {
                "sentence": "谈判开始前，双方的律师都已经在场。",
                "translation": "Before the negotiations began, the lawyers from both sides were already present.",
                "meaning_en": "to be present",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "请在场的各位把手机关掉，会议马上开始。",
                "translation": "Everyone present, please turn off your phones; the meeting is about to begin.",
                "meaning_en": "to be present",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "事故发生时，只有一名保安在场。",
                "translation": "Only one security guard was on the scene when the accident happened.",
                "meaning_en": "to be on the scene",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1445: {
        "secondary_glosses": ["be online"],
        "notes": "Used for being connected to the internet, or for doing something through the internet.",
        "examples": [
            {
                "sentence": "开会前，请确认大家都已经在线了。",
                "translation": "Before the meeting starts, please make sure everyone is already online.",
                "meaning_en": "be online",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "现在许多手续都可以在线办理，不用出门。",
                "translation": "Many procedures can now be handled online, so there is no need to go out.",
                "meaning_en": "online",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "如果你不在线，可以先给我留言。",
                "translation": "If you are not online, you can leave me a message first.",
                "meaning_en": "be online",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1473: {
        "notes": "The sound of people clapping to show approval, welcome, or congratulations.",
        "examples": [
            {
                "sentence": "好消息一公布，教室里就响起了掌声。",
                "translation": "As soon as the good news was announced, applause broke out in the classroom.",
                "meaning_en": "applause",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他的发言很真诚，赢得了大家的掌声。",
                "translation": "His speech was sincere and won everyone's applause.",
                "meaning_en": "applause",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "比赛结束后，观众用掌声向队员表示祝贺。",
                "translation": "After the match ended, the audience congratulated the players with applause.",
                "meaning_en": "applause",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1476: {
        "secondary_glosses": ["bank account", "user account"],
        "notes": "Most often refers to a financial account, especially a bank account, but it is also common for online or service login accounts.",
        "examples": [
            {
                "sentence": "这个月的工资已经进到账户里了。",
                "translation": "This month's salary has already been deposited into the account.",
                "meaning_en": "bank account",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "请先确认你的账户信息，再继续。",
                "translation": "Please confirm your account information before continuing.",
                "meaning_en": "account",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "注册以后，你可以用这个账户登录网站。",
                "translation": "After registering, you can use this account to log in to the website.",
                "meaning_en": "user account",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1538: {
        "secondary_glosses": ["little by little"],
        "notes": "Used before verbs or adjectives to show a change that happens step by step over time.",
        "examples": [
            {
                "sentence": "经过一段时间的练习，他的发音逐渐变得自然了。",
                "translation": "After a period of practice, his pronunciation gradually became more natural.",
                "meaning_en": "gradually",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这个办法的好处逐渐明显起来。",
                "translation": "The advantages of this method gradually became apparent.",
                "meaning_en": "gradually",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "经过多年的发展，这个城市逐渐形成了自己的特色。",
                "translation": "After years of development, the city gradually developed its own distinctive character.",
                "meaning_en": "gradually",
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
