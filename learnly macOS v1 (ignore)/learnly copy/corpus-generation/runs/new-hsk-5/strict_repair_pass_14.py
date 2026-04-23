import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-14.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass14"


REPAIRS = {
    158: {
        "primary_gloss": "rush",
        "secondary_glosses": ["rinse", "brew with hot water"],
        "notes": "A common everyday verb. It can mean rush outward or forward, rinse something briefly with water, or make tea or coffee by pouring in hot water.",
        "examples": [
            {
                "sentence": "听到外面有人叫自己的名字，他马上冲出去看发生了什么事。",
                "translation": "Hearing someone outside call his name, he rushed out at once to see what had happened.",
                "meaning_en": "rush",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这个杯子先用热水冲一下，再倒牛奶比较好。",
                "translation": "Give this cup a quick rinse with hot water first before pouring in the milk.",
                "meaning_en": "rinse",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他每天早上都会先给自己冲一杯咖啡，然后才开始工作。",
                "translation": "Every morning he first makes himself a cup of coffee, and only then starts work.",
                "meaning_en": "brew with hot water",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    160: {
        "primary_gloss": "full; thorough",
        "secondary_glosses": ["sufficient", "ample"],
        "notes": "Enough in amount or degree. In common collocations like 充分准备 or 充分讨论, it often means full or thorough rather than just enough.",
        "examples": [
            {
                "sentence": "我们在出发前做了充分准备，所以一路都很顺利。",
                "translation": "We made thorough preparations before setting out, so the whole trip went smoothly.",
                "meaning_en": "thorough",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "证据还不够充分，现在下结论太早了。",
                "translation": "The evidence is still not sufficient, so it is too early to draw a conclusion.",
                "meaning_en": "sufficient",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "经过充分讨论以后，大家终于同意了这个计划。",
                "translation": "After full discussion, everyone finally agreed to the plan.",
                "meaning_en": "full",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    165: {
        "primary_gloss": "bug",
        "secondary_glosses": ["insect"],
        "notes": "An everyday word for small flying or crawling bugs. It is broader and less formal than a scientific term for insect.",
        "examples": [
            {
                "sentence": "外面的灯一亮，就会有很多小虫子飞过来。",
                "translation": "As soon as the outside light comes on, lots of little bugs fly over.",
                "meaning_en": "bug",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "米放久了以后，里面很容易长虫子。",
                "translation": "If rice is kept too long, it can easily get bugs in it.",
                "meaning_en": "bug",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这种虫子白天不太容易看见，晚上倒常常会出来。",
                "translation": "This kind of insect is not very easy to spot during the day, but it often comes out at night.",
                "meaning_en": "insect",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    178: {
        "secondary_glosses": [],
        "notes": "The last evening of the lunar year, strongly associated with going home, family reunion, and preparing the New Year dinner.",
        "examples": [
            {
                "sentence": "每年除夕，家里再忙也要等人到齐了才开始吃饭。",
                "translation": "Every Chinese New Year's Eve, no matter how busy the family is, they still wait until everyone has arrived before starting dinner.",
                "meaning_en": "Chinese New Year's Eve",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "很多人在外地工作了一年，就是为了赶在除夕前回家。",
                "translation": "Many people spend the whole year working away from home just to get back before Chinese New Year's Eve.",
                "meaning_en": "Chinese New Year's Eve",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "每年到除夕的时候，奶奶总是最早起来准备晚饭。",
                "translation": "Every year when Chinese New Year's Eve comes around, Grandma is always the first one up to prepare dinner.",
                "meaning_en": "Chinese New Year's Eve",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    180: {
        "primary_gloss": "handle",
        "secondary_glosses": ["deal with", "process"],
        "notes": "Used for handling problems, situations, requests, or materials that need action, resolution, or further work.",
        "examples": [
            {
                "sentence": "出了这种情况以后，最重要的不是着急解释，而是先把问题处理好。",
                "translation": "When this kind of situation comes up, the most important thing is not to rush to explain, but to handle the problem first.",
                "meaning_en": "handle",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "客户的要求突然变了，我们得重新处理已经准备好的材料。",
                "translation": "The client's requirements suddenly changed, so we need to rework the materials that were already prepared.",
                "meaning_en": "process",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这件事情如果处理不好，不但会影响进度，还可能让客户失去信任。",
                "translation": "If this matter is not handled well, it will not only affect progress but may also make the client lose trust.",
                "meaning_en": "deal with",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    208: {
        "primary_gloss": "store",
        "secondary_glosses": ["put in storage", "keep"],
        "notes": "Means to place something somewhere for storage or safekeeping, often in an organized or protected way.",
        "examples": [
            {
                "sentence": "重要文件最好按照时间分类存放，需要的时候比较容易找到。",
                "translation": "Important documents are best stored by date so they are easier to find when needed.",
                "meaning_en": "store",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这种药品要存放在低温的地方，不然很容易坏。",
                "translation": "This kind of medicine needs to be kept in a low-temperature place, otherwise it can spoil easily.",
                "meaning_en": "keep",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "展览结束以后，工作人员把作品小心地存放在专门的房间里。",
                "translation": "After the exhibition ended, the staff carefully placed the works in a special room for storage.",
                "meaning_en": "put in storage",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    209: {
        "primary_gloss": "savings",
        "secondary_glosses": ["deposit money"],
        "notes": "As a noun, it means money saved in the bank; as a verb, it means to deposit money into a bank account.",
        "examples": [
            {
                "sentence": "虽然他的工资不算高，但工作几年以后还是慢慢有了一笔存款。",
                "translation": "Although his salary is not high, after working for a few years he still gradually built up some savings.",
                "meaning_en": "savings",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "每次发工资以后，他都会先去银行存款，再安排这个月的生活费用。",
                "translation": "Every time he gets paid, he deposits money in the bank first and only then plans that month's living expenses.",
                "meaning_en": "deposit money",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "为了以后孩子上学的费用，他们一直不敢乱花自己的存款。",
                "translation": "To prepare for their child's future school expenses, they have not dared spend their savings carelessly.",
                "meaning_en": "savings",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    210: {
        "primary_gloss": "exist",
        "secondary_glosses": ["be present"],
        "notes": "Used to say that something is really there or present, especially a problem, risk, difference, or phenomenon.",
        "examples": [
            {
                "sentence": "这种现象在不少地方都存在，只是大家平时没有注意到。",
                "translation": "This phenomenon exists in many places; people just do not usually notice it.",
                "meaning_en": "exist",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "两代人之间确实存在一些看法上的差距，很难一下子完全解决。",
                "translation": "There really is a gap in views between the two generations, and it is hard to resolve it completely all at once.",
                "meaning_en": "be present",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "表面上看一切都很顺利，其实还存在不少安全问题。",
                "translation": "On the surface everything looks smooth, but there are actually still quite a few safety problems.",
                "meaning_en": "be present",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    214: {
        "primary_gloss": "pack up",
        "secondary_glosses": ["pack to go"],
        "notes": "Most often means packing belongings or equipment together; in restaurant use, it means packing unfinished food to take away.",
        "examples": [
            {
                "sentence": "出差前一晚，他把要带的资料和衣服都提前打包好了。",
                "translation": "The night before the business trip, he packed up the documents and clothes he needed in advance.",
                "meaning_en": "pack up",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "活动结束以后，工作人员连夜把设备一件一件打包运走。",
                "translation": "After the event ended, the staff spent the night packing up the equipment piece by piece and hauling it away.",
                "meaning_en": "pack up",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这几个菜我们没吃完，麻烦你帮我打包，我想晚上带回去继续吃。",
                "translation": "We did not finish these dishes, so please pack them up for me; I want to take them home and eat the rest tonight.",
                "meaning_en": "pack to go",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    225: {
        "primary_gloss": "large numbers of",
        "secondary_glosses": ["large quantities of"],
        "notes": "Usually appears before a noun to describe people or goods arriving, being released, recruited, or moving in notably large numbers.",
        "examples": [
            {
                "sentence": "演出消息一公布，就有大批观众在网上排队买票。",
                "translation": "As soon as the performance was announced, large numbers of audience members lined up online to buy tickets.",
                "meaning_en": "large numbers of",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "节日前后，市场上会出现大批水果和海鲜。",
                "translation": "Around the holidays, large quantities of fruit and seafood appear on the market.",
                "meaning_en": "large quantities of",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "每到假期开始的时候，大批学生都会坐火车回家。",
                "translation": "Whenever a vacation begins, large numbers of students take the train home.",
                "meaning_en": "large numbers of",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    236: {
        "primary_gloss": "replace",
        "secondary_glosses": ["take someone's place", "substitute for"],
        "notes": "Used when one person or thing serves the role or function of another, either temporarily or more generally.",
        "examples": [
            {
                "sentence": "在很多重复的工作上，机器已经可以代替人工了。",
                "translation": "In many repetitive tasks, machines can already replace human labor.",
                "meaning_en": "replace",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "因为经理今天下午有事，所以我代替他去开会。",
                "translation": "Because the manager had something to do this afternoon, I went to the meeting in his place.",
                "meaning_en": "take someone's place",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "网上开会虽然方便，但还是不能代替当面交流。",
                "translation": "Although online meetings are convenient, they still cannot replace face-to-face communication.",
                "meaning_en": "replace",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    278: {
        "secondary_glosses": [],
        "notes": "The power source used by devices such as phones, toys, cameras, or clocks; depending on context, it may mean a built-in battery or a replaceable cell.",
        "examples": [
            {
                "sentence": "天气太冷的时候，电池的性能会明显变差。",
                "translation": "When the weather gets very cold, battery performance drops noticeably.",
                "meaning_en": "battery",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这个玩具很费电，两节电池不到一天就用完了。",
                "translation": "This toy uses a lot of power, and two batteries run out in less than a day.",
                "meaning_en": "battery",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这种相机要用五号电池，出门时最好多带两节。",
                "translation": "This kind of camera uses AA batteries, so it is best to bring two extra when you go out.",
                "meaning_en": "battery",
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
