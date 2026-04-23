import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-04.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass4"


REPAIRS = {
    1497: {
        "examples": [
            {
                "sentence": "考试通过以后，他很快就拿到了证书。",
                "translation": "After passing the exam, he received his certificate very quickly.",
                "meaning_en": "certificate",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "报名的时候，老师让大家先带上证书。",
                "translation": "When signing up, the teacher asked everyone to bring their certificate first.",
                "meaning_en": "certificate",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这张证书对以后找工作很有用。",
                "translation": "This certificate is very useful for finding a job later on.",
                "meaning_en": "certificate",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1499: {
        "examples": [
            {
                "sentence": "为了考试方便，我又买了两支黑笔。",
                "translation": "To make the exam easier, I bought two more black pens.",
                "meaning_en": "measure word for long, thin objects",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她把一支花轻轻放进瓶里。",
                "translation": "She gently put a flower into the bottle.",
                "meaning_en": "measure word for long, thin objects",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "那支队伍刚进门，大家就一起站起来了。",
                "translation": "As soon as that team came in the door, everyone stood up together.",
                "meaning_en": "measure word for teams",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1506: {
        "examples": [
            {
                "sentence": "雨一直下到晚上十点才止。",
                "translation": "The rain did not stop until ten o'clock at night.",
                "meaning_en": "to stop",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这场讨论先到这里为止，明天再继续。",
                "translation": "Let this discussion stop here for now, and we will continue tomorrow.",
                "meaning_en": "to come to an end",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他一想到那件事就笑得止不住。",
                "translation": "Whenever he thinks of that matter, he cannot stop laughing.",
                "meaning_en": "to stop",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1520: {
        "primary_gloss": "Chinese; China-related",
        "secondary_glosses": ["related to China (formal)"],
        "notes": "A formal word connected with China, especially in expressions about culture, history, and civilization.",
        "examples": [
            {
                "sentence": "老师上课时常提到中华文化。",
                "translation": "The teacher often mentions Chinese culture in class.",
                "meaning_en": "Chinese",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这本书介绍了中华饮食文化。",
                "translation": "This book introduces Chinese food culture.",
                "meaning_en": "China-related",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "很多孩子都在学中华文化。",
                "translation": "Many children are studying Chinese culture.",
                "meaning_en": "China-related",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1552: {
        "examples": [
            {
                "sentence": "请把现在的住址写清楚一点。",
                "translation": "Please write your current address a little more clearly.",
                "meaning_en": "address",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我换了住址以后，马上告诉了学校。",
                "translation": "After changing my address, I informed the school right away.",
                "meaning_en": "address",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "系统要先确认住址，才能继续报名。",
                "translation": "The system has to confirm the address first before registration can continue.",
                "meaning_en": "address",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1554: {
        "examples": [
            {
                "sentence": "他一着急，就马上抓住了我的手。",
                "translation": "As soon as he got anxious, he immediately grabbed my hand.",
                "meaning_en": "to grab",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "警察赶到以后，很快就抓到了人。",
                "translation": "After the police arrived, they caught the person very quickly.",
                "meaning_en": "to catch",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "机会来了就要抓住，不要再等下去。",
                "translation": "When an opportunity comes, you should seize it and not keep waiting.",
                "meaning_en": "to grab",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1558: {
        "examples": [
            {
                "sentence": "他的想法这几年有了很大转变。",
                "translation": "His way of thinking has undergone a big change in the past few years.",
                "meaning_en": "change",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "公司正在转变原来的方法。",
                "translation": "The company is changing its previous methods.",
                "meaning_en": "to transform",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她从紧张慢慢转变成了自信。",
                "translation": "She slowly changed from being nervous to being confident.",
                "meaning_en": "to transform",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1561: {
        "examples": [
            {
                "sentence": "他们打算今年把老房子重新装修一下。",
                "translation": "They plan to renovate the old house again this year.",
                "meaning_en": "to renovate",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这家店装修完以后，客人多了很多。",
                "translation": "After this shop finished renovating, it got many more customers.",
                "meaning_en": "to renovate",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "装修以前，最好先把计划定好。",
                "translation": "Before renovating, it is best to settle the plan first.",
                "meaning_en": "to decorate",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1563: {
        "examples": [
            {
                "sentence": "公司的状况这两年已经好转了很多。",
                "translation": "The company's situation has improved a lot in the past two years.",
                "meaning_en": "condition",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "现在家里经济状况一般，所以先不换房子。",
                "translation": "The family's financial situation is only average right now, so for now they are not changing houses.",
                "meaning_en": "situation",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "老师想先看看大家的学习状况。",
                "translation": "The teacher wants to first take a look at everyone's study situation.",
                "meaning_en": "situation",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1565: {
        "examples": [
            {
                "sentence": "小狗一直追着球跑，跑了很远都不停。",
                "translation": "The puppy kept chasing the ball and did not stop even after running far away.",
                "meaning_en": "to chase",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他看见车已经开走了，还是跑出去追。",
                "translation": "He saw that the bus had already left, but still ran out to chase after it.",
                "meaning_en": "to chase",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "警察一直在追前面的车，路上的人都停下来看。",
                "translation": "The police kept pursuing the car in front, and people on the road all stopped to watch.",
                "meaning_en": "to pursue",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1570: {
        "examples": [
            {
                "sentence": "有问题的时候，可以先咨询老师的意见。",
                "translation": "When you have a problem, you can first consult the teacher's opinion.",
                "meaning_en": "to consult",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她去医院以前，先打电话咨询医生。",
                "translation": "Before going to the hospital, she first called to consult the doctor.",
                "meaning_en": "to seek advice",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "家长报名以前，常先到学校咨询情况。",
                "translation": "Before registering, parents often go to the school first to ask about the situation.",
                "meaning_en": "to consult",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1581: {
        "examples": [
            {
                "sentence": "这家公司的总部一直在北京。",
                "translation": "This company's headquarters has long been in Beijing.",
                "meaning_en": "headquarters",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他下周要去总部开会，今天先把材料准备好。",
                "translation": "He is going to headquarters for a meeting next week, so today he is preparing the materials first.",
                "meaning_en": "headquarters",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "计划改了以后，总部很快就同意了。",
                "translation": "After the plan was changed, headquarters agreed very quickly.",
                "meaning_en": "headquarters",
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
