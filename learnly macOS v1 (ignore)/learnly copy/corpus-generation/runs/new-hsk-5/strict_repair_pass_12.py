import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-12.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass12"


REPAIRS = {
    155: {
        "secondary_glosses": ["last", "be ongoing"],
        "notes": "Used for a state, process, trend, or condition that keeps going over time.",
        "examples": [
            {
                "sentence": "高温天气已经持续了一个多星期，大家都不想出门。",
                "translation": "The hot weather has already lasted more than a week, and nobody wants to go out.",
                "meaning_en": "last",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "病人的体温持续升高，医生马上安排了进一步检查。",
                "translation": "The patient's temperature kept rising, so the doctor immediately arranged further tests.",
                "meaning_en": "continue",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这种紧张的状态已经持续了很长时间，大家都希望早点结束。",
                "translation": "This tense state has continued for a long time, and everyone hopes it will end soon.",
                "meaning_en": "be ongoing",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    159: {
        "secondary_glosses": ["recharge oneself"],
        "notes": "Usually means charging a phone, vehicle, or other device; also common figuratively for restoring your energy or improving yourself.",
        "examples": [
            {
                "sentence": "手机只剩百分之十的电了，得马上充电。",
                "translation": "The phone only has ten percent battery left, so it needs charging right away.",
                "meaning_en": "charge",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这个停车场里有给电动车充电的地方，下班以后常常要排队。",
                "translation": "This parking lot has a place to charge electric vehicles, so there is often a line after work.",
                "meaning_en": "charge",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "最近工作太忙了，我想周末好好休息一下，给自己充电。",
                "translation": "Work has been so busy lately that I want to rest properly this weekend and recharge myself.",
                "meaning_en": "recharge oneself",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    163: {
        "secondary_glosses": ["sufficient"],
        "notes": "Means enough, or more than enough, for the need; common with time, supplies, food, money, and evidence.",
        "examples": [
            {
                "sentence": "现在离考试还有一个月，你有充足的时间复习。",
                "translation": "There is still a month before the exam, so you have plenty of time to review.",
                "meaning_en": "ample",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "为了保证大家都能吃饱，我们准备了充足的饭菜。",
                "translation": "To make sure everyone could eat enough, we prepared plenty of food.",
                "meaning_en": "ample",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "证据还不够充足，现在下结论太早了。",
                "translation": "The evidence still is not sufficient, so it is too early to draw a conclusion.",
                "meaning_en": "sufficient",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    169: {
        "secondary_glosses": [],
        "notes": "Describes a strong unpleasant smell. No need to force a secondary sense here; the core smell meaning is the real teaching target.",
        "examples": [
            {
                "sentence": "这条鱼闻起来有点臭，最好别吃了。",
                "translation": "This fish smells a bit off, so you had better not eat it.",
                "meaning_en": "smelly",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "雨鞋没晒干就收起来，第二天穿的时候特别臭。",
                "translation": "The rain boots were put away before they dried, so they smelled especially bad the next day.",
                "meaning_en": "smelly",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "垃圾如果不及时拿出去，整个厨房都会变得很臭。",
                "translation": "If the trash is not taken out in time, the whole kitchen will start to smell bad.",
                "meaning_en": "smelly",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    202: {
        "primary_gloss": "in the past",
        "secondary_glosses": ["once, long ago"],
        "notes": "Used for earlier times in real life, and also at the start of stories in the sense of 'once, long ago'.",
        "examples": [
            {
                "sentence": "我从前一直觉得他很难相处，后来才发现他其实很热心。",
                "translation": "I used to think he was hard to get along with, but later I realized he was actually very helpful.",
                "meaning_en": "in the past",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这家公司从前只卖一种产品，现在已经发展成大企业了。",
                "translation": "This company used to sell just one product, but now it has grown into a large enterprise.",
                "meaning_en": "formerly",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "从前有个年轻人，天天想着离开小村子去大城市发展。",
                "translation": "Once, there was a young man who spent every day dreaming of leaving his small village for the big city.",
                "meaning_en": "once, long ago",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    218: {
        "secondary_glosses": ["daring"],
        "notes": "Describes speech, actions, plans, or styles that are brave, confident, or willing to break with the usual way.",
        "examples": [
            {
                "sentence": "她在会上大胆提出了和大家都不一样的看法。",
                "translation": "At the meeting, she boldly put forward a view that differed from everyone else's.",
                "meaning_en": "bold",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这个设计很大胆，把传统颜色和现代材料放在了一起。",
                "translation": "This design is bold, combining traditional colors with modern materials.",
                "meaning_en": "bold",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "一个人去外地重新开始，对她来说是个很大胆的决定。",
                "translation": "Starting over alone in another place was a very daring decision for her.",
                "meaning_en": "daring",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    570: {
        "notes": "A document that sums up your education, work experience, and skills when you apply for a job.",
        "examples": [
            {
                "sentence": "如果你想申请这个工作，最好先把简历和照片一起发过去。",
                "translation": "If you want to apply for this job, it is best to send your resume and photo first.",
                "meaning_en": "resume",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她改了好几次简历，才把自己的项目经验写得更具体。",
                "translation": "She revised her resume several times before she finally described her project experience more specifically.",
                "meaning_en": "resume",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "很多毕业生第一次写简历的时候，都不知道该怎么介绍自己。",
                "translation": "When many graduates write a resume for the first time, they do not know how to present themselves.",
                "meaning_en": "resume",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    574: {
        "notes": "Marks a change that happens slowly over time and becomes noticeable step by step.",
        "examples": [
            {
                "sentence": "刚来这个城市的时候我很不习惯，住了半年以后才渐渐喜欢上这里的生活。",
                "translation": "When I first came to this city, I felt very out of place; only after living here for half a year did I gradually begin to like life here.",
                "meaning_en": "gradually",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "雨停了以后，街上的人渐渐多了起来，商店也重新开门了。",
                "translation": "After the rain stopped, people gradually returned to the street, and the shops reopened.",
                "meaning_en": "gradually",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "两个人谈了几次以后，原来的误会渐渐没有了。",
                "translation": "After the two talked several times, the old misunderstanding gradually disappeared.",
                "meaning_en": "gradually",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    665: {
        "secondary_glosses": ["dependable", "trustworthy"],
        "notes": "Can describe people, information, data, or methods you can trust.",
        "examples": [
            {
                "sentence": "他做事一直很可靠，所以领导放心把项目交给他。",
                "translation": "He has always been reliable in his work, so his manager feels comfortable handing the project to him.",
                "meaning_en": "reliable",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "网上流传的消息不一定可靠，最好先看看来源。",
                "translation": "Information circulating online is not necessarily reliable; it is best to check the source first.",
                "meaning_en": "reliable",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "没有可靠的数据支持，这个说法很难让人相信。",
                "translation": "Without reliable data to support it, this claim is hard to believe.",
                "meaning_en": "reliable",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    904: {
        "primary_gloss": "to urge; advise",
        "secondary_glosses": ["to try to persuade"],
        "notes": "By speaking, you try to get someone to do something, avoid something, or change their mind.",
        "examples": [
            {
                "sentence": "医生劝他先休息几天，不要急着回去上班。",
                "translation": "The doctor urged him to rest for a few days first and not rush back to work.",
                "meaning_en": "to urge",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我劝了他半天，他还是决定自己承担这个责任。",
                "translation": "I spent quite a while trying to persuade him, but he still decided to take responsibility himself.",
                "meaning_en": "to try to persuade",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "大家都劝她不要冲动辞职，先想清楚再决定。",
                "translation": "Everyone advised her not to quit impulsively and to think it through before deciding.",
                "meaning_en": "to advise",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    913: {
        "primary_gloss": "to love deeply; be devoted to",
        "secondary_glosses": [],
        "notes": "Stronger and more serious than 爱; usually used for work, music, education, or another lasting commitment, not a casual preference.",
        "examples": [
            {
                "sentence": "她从小就热爱音乐，后来还进了专业学校学习。",
                "translation": "She loved music from childhood, and later even entered a professional school to study it.",
                "meaning_en": "to love deeply",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "真正热爱这份工作的人，往往愿意为它花很多时间。",
                "translation": "People who truly love this work are often willing to spend a great deal of time on it.",
                "meaning_en": "be devoted to",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "很多老师都热爱教育，也愿意为学生花时间。",
                "translation": "Many teachers are deeply devoted to education and are willing to spend time on their students.",
                "meaning_en": "be devoted to",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1186: {
        "primary_gloss": "to break the law; be illegal",
        "secondary_glosses": ["against the law"],
        "notes": "Can describe someone breaking the law, or say that an action, practice, or arrangement is itself illegal.",
        "examples": [
            {
                "sentence": "公司因为长期违法经营，被有关部门调查。",
                "translation": "The company was investigated by the relevant authorities for operating illegally over a long period.",
                "meaning_en": "to break the law",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "如果没有得到同意就公开别人的照片，这种行为可能违法。",
                "translation": "If you make someone else's photos public without getting their consent, that kind of behavior may be illegal.",
                "meaning_en": "illegal",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "他知道自己在违法，却还是没有停下来。",
                "translation": "He knew he was breaking the law, yet still did not stop.",
                "meaning_en": "to break the law",
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
