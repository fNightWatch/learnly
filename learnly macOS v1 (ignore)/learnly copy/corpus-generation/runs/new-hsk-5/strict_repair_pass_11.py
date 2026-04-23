import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-11.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass11"


REPAIRS = {
    1437: {
        "secondary_glosses": [],
        "notes": "运 means carrying or moving people or goods from one place to another, often over some distance.",
        "examples": [
            {
                "sentence": "这些菜天亮前就运到了城里的市场。",
                "translation": "These vegetables were transported to the city market before daybreak.",
                "meaning_en": "to transport",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "为了省时间，他们决定连夜把水果运回家。",
                "translation": "To save time, they decided to transport the fruit back home overnight.",
                "meaning_en": "to transport",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "受伤的人已经运到医院去了，家里人正在那边等他。",
                "translation": "The injured person has already been taken to the hospital, and the family is waiting there now.",
                "meaning_en": "to transport",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1438: {
        "secondary_glosses": ["freight charge"],
        "notes": "运费 is the money you pay to have something shipped or delivered.",
        "examples": [
            {
                "sentence": "这次网购不用付运费，所以我马上下单了。",
                "translation": "This online order has no shipping cost, so I placed the order right away.",
                "meaning_en": "shipping cost",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这件东西本身不贵，运费却一点也不低。",
                "translation": "The item itself is not expensive, but the shipping cost is not low at all.",
                "meaning_en": "shipping cost",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "从这里寄到北京，运费要比我想的多不少。",
                "translation": "The shipping cost from here to Beijing is quite a bit more than I expected.",
                "meaning_en": "shipping cost",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1471: {
        "primary_gloss": "to rise; to go up",
        "secondary_glosses": [],
        "notes": "涨 is used when prices, wages, levels, or water go up.",
        "examples": [
            {
                "sentence": "最近很多东西都在涨，连水果也比以前贵了。",
                "translation": "Recently a lot of things have been going up in price; even fruit is more expensive than before.",
                "meaning_en": "to rise",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "下了一夜大雨以后，河水第二天涨了很多。",
                "translation": "After a night of heavy rain, the river rose a lot the next day.",
                "meaning_en": "to rise",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他的工资去年没涨，今年终于涨了一点。",
                "translation": "His salary did not go up last year, but this year it finally rose a little.",
                "meaning_en": "to go up",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1475: {
        "primary_gloss": "account",
        "secondary_glosses": ["account number"],
        "notes": "账号 can mean a login account on a site or app, and it can also mean an account number used to receive or send money.",
        "examples": [
            {
                "sentence": "换了手机以后，我还是能用这个账号登录。",
                "translation": "Even after changing phones, I can still log in with this account.",
                "meaning_en": "account",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "要是忘了账号，可以用手机号找回来。",
                "translation": "If you forget your account, you can recover it with your phone number.",
                "meaning_en": "account",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "请把钱打到这个账号上，下午我再查一下。",
                "translation": "Please transfer the money to this account, and I will check again this afternoon.",
                "meaning_en": "account number",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1481: {
        "notes": "真诚 is for people, words, or attitudes that come from real feeling and honesty, not politeness alone.",
        "examples": [
            {
                "sentence": "她真诚地感谢大家这段时间的帮助。",
                "translation": "She sincerely thanked everyone for the help they had given her during this time.",
                "meaning_en": "sincere",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "面对大家的批评，他真诚地承认了自己的问题。",
                "translation": "Facing everyone's criticism, he sincerely admitted his own problems.",
                "meaning_en": "sincere",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "老师说，真诚的态度比漂亮的话更重要。",
                "translation": "The teacher said that a sincere attitude matters more than nice-sounding words.",
                "meaning_en": "genuine",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1527: {
        "notes": "Usually means medicine prescribed in the traditional Chinese medical system, especially herbal medicine.",
        "examples": [
            {
                "sentence": "医生看了以后，让她先吃几天中药。",
                "translation": "After examining her, the doctor told her to take Chinese medicine for a few days first.",
                "meaning_en": "traditional Chinese medicine",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "中药太苦了，她每次都要喝很多水。",
                "translation": "The Chinese medicine was so bitter that she drank a lot of water every time.",
                "meaning_en": "Chinese herbal medicine",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这家医院除了开中药，也会提醒病人早点休息。",
                "translation": "Besides prescribing Chinese medicine, this hospital also reminds patients to rest early.",
                "meaning_en": "traditional Chinese medicine",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1548: {
        "notes": "主席 is the person presiding over a meeting or serving as the titled head of an organization or committee.",
        "examples": [
            {
                "sentence": "会议开始以后，主席先介绍了今天的安排。",
                "translation": "After the meeting began, the chairperson first introduced today's agenda.",
                "meaning_en": "chairperson",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她去年当选为学生会主席，今年还是一样很忙。",
                "translation": "She was elected student union chairperson last year and is still just as busy this year.",
                "meaning_en": "chairperson",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "主席听了大家的意见以后，最后做了总结。",
                "translation": "After listening to everyone's opinions, the chairperson gave a final summary.",
                "meaning_en": "chair",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1557: {
        "notes": "专心 describes keeping your mind on one task, class, or piece of work without letting your attention wander.",
        "examples": [
            {
                "sentence": "他最近为了准备考试，学习的时候特别专心。",
                "translation": "He has been especially focused while studying for the exam lately.",
                "meaning_en": "focused",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "你要是不能专心，就先休息十分钟吧。",
                "translation": "If you cannot stay focused, then rest for ten minutes first.",
                "meaning_en": "focused",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "做这种工作的时候，一定要很专心。",
                "translation": "When doing this kind of work, you have to be very attentive.",
                "meaning_en": "attentive",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1560: {
        "notes": "As a verb, it means to make a place look nicer; as a noun, it means decorative items or decoration.",
        "examples": [
            {
                "sentence": "她想用花和照片装饰自己的房间。",
                "translation": "She wants to decorate her room with flowers and photos.",
                "meaning_en": "to decorate",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她买这些装饰，是想让房间更有节日的感觉。",
                "translation": "She bought these decorations because she wants the room to feel more festive.",
                "meaning_en": "decoration",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "节日前，这家商店会重新装饰门口和窗户。",
                "translation": "Before the holiday, this shop will redecorate the entrance and windows.",
                "meaning_en": "to decorate",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1562: {
        "secondary_glosses": ["to collide"],
        "notes": "Usually means hitting a person or thing by accident; for vehicles, it also commonly means collide.",
        "examples": [
            {
                "sentence": "他一边说话一边往后走，结果撞到了门口的人。",
                "translation": "He was talking while walking backward and ended up bumping into someone by the door.",
                "meaning_en": "to bump into",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "两辆车在路口撞了以后，司机马上下车看情况。",
                "translation": "After two cars collided at the intersection, the drivers got out immediately to check what happened.",
                "meaning_en": "to collide",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "孩子跑得太快，一转身就撞到我身上了。",
                "translation": "The child was running too fast and bumped right into me as soon as he turned around.",
                "meaning_en": "to bump into",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1569: {
        "notes": "Usually means the way someone holds their body; it can also mean a pose, especially in photos.",
        "examples": [
            {
                "sentence": "老师提醒我们写字的时候要注意姿势。",
                "translation": "The teacher reminded us to pay attention to our posture when writing.",
                "meaning_en": "posture",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她拍照片的时候，换了好几个姿势。",
                "translation": "While taking photos, she changed poses several times.",
                "meaning_en": "pose",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "你坐着看书的姿势不对，时间长了会不舒服。",
                "translation": "Your posture when you sit and read is wrong, and after a while it will feel uncomfortable.",
                "meaning_en": "posture",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1583: {
        "secondary_glosses": [],
        "notes": "Used for the complete count of people or things after everything has been added up.",
        "examples": [
            {
                "sentence": "今年来这里参观的人很多，游客总数已经超过一万。",
                "translation": "A lot of people came to visit this year, and the total number of visitors has already passed ten thousand.",
                "meaning_en": "total number",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "等我们把名单都看完，就能知道报名总数了。",
                "translation": "Once we finish checking the list, we will know the total number of registrations.",
                "meaning_en": "total number",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "工作人员还在统计总数，现在不能告诉你结果。",
                "translation": "The staff are still tallying the total number, so they cannot tell you the result yet.",
                "meaning_en": "total number",
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
