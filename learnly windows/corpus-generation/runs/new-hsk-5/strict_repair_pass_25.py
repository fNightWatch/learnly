import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-25.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass25"


REPAIRS = {
    201: {
        "secondary_glosses": ["thereby", "as a result"],
        "notes": "A relatively formal conjunction used to introduce the result that follows from the first clause. It links a prior action, condition, or method to the outcome that comes from it.",
        "examples": [
            {
                "sentence": "大家先把要求写清楚，从而减少了后面的很多麻烦。",
                "translation": "Everyone first wrote the requirements down clearly, thus reducing a lot of trouble later on.",
                "meaning_en": "thus",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "公司先把问题公开说明，从而减少了大家的猜测。",
                "translation": "The company explained the issue openly first, thereby reducing everyone's speculation.",
                "meaning_en": "thereby",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "她坚持每天运动，从而慢慢把身体状态调整好了。",
                "translation": "She kept exercising every day, and as a result gradually got her physical condition back into good shape.",
                "meaning_en": "as a result",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    233: {
        "primary_gloss": "to do in someone's place",
        "secondary_glosses": ["generation", "era"],
        "notes": "As a verb, 代 means to do something for someone or instead of them. As a noun, it means a generation, and in more formal historical use it can refer to an era or dynasty.",
        "examples": [
            {
                "sentence": "今天下午我代经理去见客户，你先把材料发给我。",
                "translation": "This afternoon I'll meet the client on the manager's behalf, so send me the materials first.",
                "meaning_en": "to do in someone's place",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "他身体不舒服，所以让我代他去参加会议。",
                "translation": "He wasn't feeling well, so he asked me to attend the meeting in his place.",
                "meaning_en": "to do in someone's place",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这一代年轻人更愿意把时间花在自己喜欢的事上。",
                "translation": "This generation of young people is more willing to spend time on the things they truly like.",
                "meaning_en": "generation",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    289: {
        "secondary_glosses": ["cave", "opening"],
        "notes": "A hole or opening in something such as a wall, bag, or piece of clothing. It can also refer to a cave-like hollow in a mountain or rock.",
        "examples": [
            {
                "sentence": "墙上那个小洞一直往里进风，冬天特别明显。",
                "translation": "That small hole in the wall keeps letting wind in, which is especially noticeable in winter.",
                "meaning_en": "hole",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "包上破了一个洞，钥匙差点从里面掉出来。",
                "translation": "A hole tore in the bag, and the keys almost fell out through it.",
                "meaning_en": "hole",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "山腰上有个很深的洞，听说以前有人在里面住过。",
                "translation": "There is a deep cave halfway up the mountain, and I heard people used to live in it.",
                "meaning_en": "cave",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    304: {
        "primary_gloss": "pile",
        "secondary_glosses": ["to pile up", "heap"],
        "notes": "As a noun or measure word, 堆 refers to a pile or heap of things. As a verb, it means to pile things up together or leave them stacked somewhere.",
        "examples": [
            {
                "sentence": "角落里那堆旧资料放了太久，早该整理了。",
                "translation": "That pile of old materials in the corner has been sitting there too long and should have been sorted out by now.",
                "meaning_en": "pile",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "办公室里堆了不少材料，走路都不太方便。",
                "translation": "Quite a lot of materials have piled up in the office, making it inconvenient even to walk through.",
                "meaning_en": "to pile up",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "他把衣服全堆在椅子上，房间一下显得更乱了。",
                "translation": "He piled all the clothes onto the chair, and the room instantly looked even messier.",
                "meaning_en": "to pile up",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    357: {
        "primary_gloss": "strive",
        "secondary_glosses": ["work hard", "struggle"],
        "notes": "To keep pushing and working hard toward a goal over time, especially when life is difficult or the road is not easy. It often appears in contexts like career, family life, ideals, and long-term effort.",
        "examples": [
            {
                "sentence": "为了让家里过上更稳定的生活，他这些年一直在外面奋斗。",
                "translation": "For the past several years, he has been striving away from home so his family can live a more stable life.",
                "meaning_en": "strive",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "父母年轻时在这个城市奋斗了很多年，才终于买了房子。",
                "translation": "His parents struggled for many years in this city when they were young before they were finally able to buy a home.",
                "meaning_en": "struggle",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "很多人离开家乡以后，都在为更好的生活奋斗。",
                "translation": "After leaving their hometowns, many people work hard for a better life.",
                "meaning_en": "work hard",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    571: {
        "primary_gloss": "downright",
        "secondary_glosses": ["absolutely", "practically"],
        "notes": "An emphatic adverb used when something feels so extreme, obvious, or unbelievable that the speaker wants to strongly underline it. It often adds emotional force rather than changing the basic meaning.",
        "examples": [
            {
                "sentence": "这份报告我改了三遍，他还是不满意，简直让人生气。",
                "translation": "I revised this report three times, and he was still unhappy with it. It was downright infuriating.",
                "meaning_en": "downright",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "他最近忙得简直连周末都在开会。",
                "translation": "He has been so busy lately that he practically spends even his weekends in meetings.",
                "meaning_en": "practically",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这个决定来得太突然，大家简直一点准备都没有。",
                "translation": "The decision came so suddenly that everyone was absolutely unprepared.",
                "meaning_en": "absolutely",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    572: {
        "primary_gloss": "build",
        "secondary_glosses": ["set up", "establish"],
        "notes": "A short, slightly formal verb for constructing something such as a building, road, or bridge. It can also mean setting up an organization, group, or system, especially in written or official contexts.",
        "examples": [
            {
                "sentence": "市里打算明年在这里建一座新的图书馆。",
                "translation": "The city plans to build a new library here next year.",
                "meaning_en": "build",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "公司决定先建一个小组，专门负责这项工作。",
                "translation": "The company decided to set up a small team first to be specifically responsible for this work.",
                "meaning_en": "set up",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "村里准备先建一个小医院，方便大家看病。",
                "translation": "The village plans to build a small hospital first so it will be easier for everyone to see a doctor.",
                "meaning_en": "build",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    814: {
        "secondary_glosses": ["runway"],
        "notes": "Usually refers to a marked track for running in sports. It can also mean an airport runway, so the exact sense depends on whether the context is athletics or aviation.",
        "examples": [
            {
                "sentence": "下过雨以后，学校的跑道还有点滑，大家跑步时都很小心。",
                "translation": "After the rain, the school track was still a bit slippery, so everyone was very careful while running.",
                "meaning_en": "track",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "飞机在跑道上等了十几分钟，才收到起飞通知。",
                "translation": "The plane waited on the runway for more than ten minutes before receiving clearance to take off.",
                "meaning_en": "runway",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这条跑道太旧了，学校明年可能会重新修。",
                "translation": "This track is too old, and the school may rebuild it next year.",
                "meaning_en": "track",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    841: {
        "secondary_glosses": ["in balance", "to balance"],
        "notes": "Describes a state where different sides, amounts, or needs fit together well without one side being too much; as a verb, it means to keep or bring them into that state.",
        "examples": [
            {
                "sentence": "这个计划把工作、休息和运动安排得比较平衡，所以大家都能坚持下去。",
                "translation": "This plan keeps work, rest, and exercise fairly well balanced, so everyone can stick with it.",
                "meaning_en": "balanced",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "做管理的人得学会平衡效率和服务质量，不能只看数字。",
                "translation": "Anyone in management has to learn to balance efficiency and service quality instead of just looking at the numbers.",
                "meaning_en": "to balance",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "只有收入和支出保持平衡，店里才能安心继续做下去。",
                "translation": "Only when income and expenses stay in balance can the shop keep operating with peace of mind.",
                "meaning_en": "in balance",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    857: {
        "notes": "An inflatable balloon used for decoration, gifts, celebrations, or children's play.",
        "examples": [
            {
                "sentence": "门口挂了很多气球，大家一看就知道里面在办活动。",
                "translation": "There were lots of balloons hanging at the entrance, so everyone could tell right away there was an event inside.",
                "meaning_en": "balloon",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这个气球刚吹起来就破了，大家只好再换一个。",
                "translation": "This balloon burst as soon as it was inflated, so they had no choice but to replace it.",
                "meaning_en": "balloon",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她把写着名字的气球拿在手里，站在人群里特别好认。",
                "translation": "She held the balloon with her name written on it, which made her especially easy to spot in the crowd.",
                "meaning_en": "balloon",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    858: {
        "secondary_glosses": ["petrol"],
        "notes": "Fuel used in gasoline-powered cars and other engines; petrol is the common British English equivalent.",
        "examples": [
            {
                "sentence": "这辆旧车太费汽油，难怪很多人劝他早点换车。",
                "translation": "This old car uses far too much gasoline, so it's no surprise many people are urging him to replace it.",
                "meaning_en": "gasoline",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "最近汽油又涨价了，开车上下班的人压力更大了。",
                "translation": "Gasoline has gone up in price again recently, putting more pressure on people who drive to and from work.",
                "meaning_en": "gasoline",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "车刚开到半路，司机就发现汽油已经不多了。",
                "translation": "The car had only reached the halfway point when the driver realized there wasn't much gasoline left.",
                "meaning_en": "gasoline",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    886: {
        "secondary_glosses": ["blue-green"],
        "notes": "Often used for the color of plants, mountains, water, or unripe fruit; in many contexts it feels more natural or literary than plain 绿.",
        "examples": [
            {
                "sentence": "这个桃子还没熟，外皮还是青的，现在吃会有点酸。",
                "translation": "This peach isn't ripe yet; the skin is still green, so it will taste a little sour if you eat it now.",
                "meaning_en": "green",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "春天一到，山上的草慢慢青了，看着特别舒服。",
                "translation": "As soon as spring arrives, the grass on the hills gradually turns green, and the whole scene feels especially pleasant to look at.",
                "meaning_en": "green",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "下过雨以后，远处的山显得更青了。",
                "translation": "After the rain, the distant mountains looked an even deeper blue-green.",
                "meaning_en": "blue-green",
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
