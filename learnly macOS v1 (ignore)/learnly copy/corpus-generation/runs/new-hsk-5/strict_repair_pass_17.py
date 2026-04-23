import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-17.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass17"


REPAIRS = {
    167: {
        "primary_gloss": "pull out; take out",
        "secondary_glosses": ["choose at random", "smoke (a cigarette)"],
        "notes": "A common verb used for taking something out, selecting someone unexpectedly or by draw, and in 抽烟 for smoking.",
        "examples": [
            {
                "sentence": "他从包里抽出一张纸，说这是刚收到的通知。",
                "translation": "He pulled a sheet of paper out of his bag and said this was the notice he had just received.",
                "meaning_en": "pull out",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "开会的时候，经理临时抽了两个人先介绍自己的计划。",
                "translation": "During the meeting, the manager picked two people at random to present their plans first.",
                "meaning_en": "choose at random",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "他下班以后常常出去抽烟，朋友都说这样对身体不好。",
                "translation": "He often goes out to smoke after work, and his friends all say this is bad for his health.",
                "meaning_en": "smoke",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    455: {
        "primary_gloss": "excessive; going too far",
        "secondary_glosses": ["overly", "unreasonable"],
        "notes": "Used for words, behavior, reactions, or demands that go beyond what is reasonable; it also works before adjectives to mean 'overly'.",
        "examples": [
            {
                "sentence": "你当着大家的面这样说她，真的太过分了。",
                "translation": "Saying that to her in front of everyone is really going too far.",
                "meaning_en": "going too far",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "为了这么小的一件事就跟同事发火，确实有点过分。",
                "translation": "Getting angry with a coworker over such a small matter is indeed a bit excessive.",
                "meaning_en": "excessive",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "他对自己要求过分严格，连周末也不让自己休息。",
                "translation": "He is overly strict with himself and does not even let himself rest on weekends.",
                "meaning_en": "overly",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    651: {
        "primary_gloss": "open officially",
        "secondary_glosses": ["begin officially"],
        "notes": "Used for formal public events such as exhibitions, conferences, festivals, or sports meets when they officially begin.",
        "examples": [
            {
                "sentence": "这次国际会议明天上午开幕，很多专家今天已经到了。",
                "translation": "This international conference opens tomorrow morning, and many specialists have already arrived today.",
                "meaning_en": "open officially",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "展览一开幕，就吸引了很多年轻人来参观。",
                "translation": "As soon as the exhibition opened, it attracted many young people to come visit.",
                "meaning_en": "begin officially",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "本来今天开幕的运动会，因为天气突然变化，改到明天举行。",
                "translation": "The sports meet that was supposed to open today has been moved to tomorrow because the weather suddenly changed.",
                "meaning_en": "open officially",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    660: {
        "primary_gloss": "lean on; lean against",
        "secondary_glosses": ["rely on", "be near"],
        "notes": "Can describe physical leaning, depending on someone or something, or a place being close to another place in everyday speech.",
        "examples": [
            {
                "sentence": "地铁上没有空座位，他只好靠着门站了一路。",
                "translation": "There were no empty seats on the subway, so he had to lean against the door for the whole ride.",
                "meaning_en": "lean on",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "小孩子不能总靠父母，很多事还是要自己学着做。",
                "translation": "Children cannot always rely on their parents; they still need to learn to do many things themselves.",
                "meaning_en": "rely on",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "我们新办公室靠地铁站，下班以后去市中心很方便。",
                "translation": "Our new office is close to the subway station, so getting to the city center after work is very convenient.",
                "meaning_en": "be near",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    869: {
        "secondary_glosses": ["outer wall"],
        "notes": "A physical wall in a room, building, yard, or similar place; it can mean either an indoor wall or an outside wall.",
        "examples": [
            {
                "sentence": "教室后面的墙上贴着很多学生自己画的画，一进门就能看见他们这一学期的进步。",
                "translation": "Many of the students' own drawings are posted on the back wall of the classroom, so as soon as you walk in you can see how much they have improved this semester.",
                "meaning_en": "wall",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "院子外面的墙有一点旧了，爸爸说明年春天要修一修，不然下雨的时候容易出问题。",
                "translation": "The outer wall around the yard is getting a little old. Dad says he'll repair it next spring, or rain will start causing problems.",
                "meaning_en": "outer wall",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "昨天晚上风很大，可是那面墙还是没有倒。",
                "translation": "The wind was strong last night, but that wall still did not collapse.",
                "meaning_en": "wall",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    967: {
        "secondary_glosses": ["cook slowly over heat", "have a fever"],
        "notes": "Most often means to burn something. In cooking, 烧 also means to cook a dish over heat, usually slowly; in spoken Chinese, 有点烧 means to have a fever.",
        "examples": [
            {
                "sentence": "他一着急，把最重要的那张纸也一起烧了，等发现的时候已经来不及了。",
                "translation": "In a panic, he burned the most important sheet of paper too, and by the time he realized it, it was already too late.",
                "meaning_en": "to burn",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这道菜要先用小火慢慢烧，里面的肉才会更香更软。",
                "translation": "This dish needs to be cooked slowly over low heat so the meat turns out more tender and flavorful.",
                "meaning_en": "cook slowly over heat",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "孩子下午一直不太舒服，晚上量体温才发现有点烧。",
                "translation": "The child had felt unwell all afternoon, and only when we took the temperature that night did we realize there was a slight fever.",
                "meaning_en": "have a fever",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    973: {
        "secondary_glosses": ["plan carefully", "design; layout"],
        "notes": "As a verb, it means to design or plan something with a clear purpose; as a noun, it means the design itself, especially how something is arranged or made.",
        "examples": [
            {
                "sentence": "这座桥是年轻工程师设计的，看上去简单，其实很安全。",
                "translation": "This bridge was designed by a young engineer; it looks simple, but it is actually very safe.",
                "meaning_en": "to design",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "为了这次活动，我们把原来的方案重新设计了一遍，希望大家参加起来更方便。",
                "translation": "For this event, we redesigned the original plan so it would be easier for everyone to take part.",
                "meaning_en": "plan carefully",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这个杯子的设计很简单，但是拿在手里很舒服，用起来也方便。",
                "translation": "The design of this cup is simple, but it feels comfortable in the hand and is easy to use.",
                "meaning_en": "design; layout",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    977: {
        "pos": "noun, verb",
        "primary_gloss": "photography",
        "secondary_glosses": ["take photographs"],
        "notes": "Usually means photography as an art, skill, or hobby; it can also mean going out to take photographs.",
        "examples": [
            {
                "sentence": "她大学时学过摄影，所以旅行的时候总能拍出很好看的照片。",
                "translation": "She studied photography in college, so she always manages to take beautiful photos when she travels.",
                "meaning_en": "photography",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他周末常去公园摄影，有时候为了等一张好照片会站很久。",
                "translation": "He often goes to the park on weekends to take photographs, and sometimes he stands there a long time waiting for one good shot.",
                "meaning_en": "to take photographs",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "爸爸年轻时很喜欢摄影，家里现在还留着很多他以前拍的照片。",
                "translation": "My dad loved photography when he was young, and we still keep many of the photos he took back then.",
                "meaning_en": "photography",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    981: {
        "secondary_glosses": ["substance", "insight"],
        "notes": "Usually refers to physical depth, or to the depth and substance of writing, discussion, or analysis; often appears in phrases like 有深度.",
        "examples": [
            {
                "sentence": "工程师先测了这条河的深度，才决定把桥建在什么位置。",
                "translation": "The engineer first measured the depth of the river before deciding where to build the bridge.",
                "meaning_en": "depth",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这篇报道不但介绍了情况，还分析了原因和影响，内容很有深度。",
                "translation": "This report not only describes the situation, but also analyzes the causes and effects, so it has real depth.",
                "meaning_en": "depth",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "他虽然话不多，但每次分析问题都很有深度，让大家想得更全面。",
                "translation": "He does not talk much, but whenever he analyzes a problem, he does it with real depth and makes everyone think more broadly.",
                "meaning_en": "insight",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    989: {
        "notes": "Verb only here, not the measure word for liters. Used for things moving upward or increasing, and also in patterns like 升为 for promotion.",
        "examples": [
            {
                "sentence": "这几天气温一直在升，中午出门明显比早上热得多。",
                "translation": "The temperature has been rising these past few days, and going out at noon is noticeably hotter than in the morning.",
                "meaning_en": "rise",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "太阳刚升起来的时候，公园里已经有很多人在跑步了。",
                "translation": "By the time the sun had just come up, there were already many people jogging in the park.",
                "meaning_en": "go up",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他在公司工作了八年，最近终于升为部门经理了。",
                "translation": "He has worked at the company for eight years, and recently he was finally promoted to department manager.",
                "meaning_en": "be promoted",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1115: {
        "notes": "Often means a question in homework or an exam; it can also mean the topic of a report or discussion, or the title of an article or book.",
        "examples": [
            {
                "sentence": "这道题目的答案不是直接写在课文里，需要你自己先分析一下。",
                "translation": "The answer to this question is not written directly in the text, so you need to analyze it yourself first.",
                "meaning_en": "question",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "老师给了我们几个方向，让大家自己决定报告的题目。",
                "translation": "The teacher gave us several directions and let us decide the topic of the report ourselves.",
                "meaning_en": "topic",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这篇文章的题目看起来很简单，其实讨论的是年轻人的工作压力。",
                "translation": "The title of this article looks simple, but it is actually about the work pressure young people face.",
                "meaning_en": "title",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1222: {
        "primary_gloss": "drinking straw",
        "notes": "The thin tube used for drinking liquids; normally refers to a drinking straw.",
        "examples": [
            {
                "sentence": "我买了一杯水，可是店里忘了给我吸管。",
                "translation": "I bought a cup of water, but the shop forgot to give me a straw.",
                "meaning_en": "drinking straw",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "孩子喝牛奶的时候喜欢用吸管，觉得这样更方便。",
                "translation": "Children like using a straw when they drink milk because they feel it is more convenient that way.",
                "meaning_en": "drinking straw",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "现在很多店都会主动问客人要不要吸管，希望少用一点塑料。",
                "translation": "Nowadays many shops proactively ask customers whether they want a straw, hoping to use a little less plastic.",
                "meaning_en": "drinking straw",
                "difficulty": 4,
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

            if "pos" in repair:
                payload["word"]["pos"] = repair["pos"]
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
