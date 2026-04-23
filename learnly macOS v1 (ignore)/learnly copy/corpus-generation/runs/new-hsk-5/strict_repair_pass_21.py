import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-21.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass21"


REPAIRS = {
    244: {
        "secondary_glosses": ["bland", "faint"],
        "notes": "Describes color, taste, smell, and similar qualities when they are not strong. With food or drink it often means bland or weak; with color it means light or pale.",
        "examples": [
            {
                "sentence": "这碗汤喝起来有点淡，你再放一点盐吧。",
                "translation": "This soup tastes a little bland, so add a bit more salt.",
                "meaning_en": "bland",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这件衬衫的颜色太淡了，远一点就不明显了。",
                "translation": "The color of this shirt is too light, so it stops being noticeable from farther away.",
                "meaning_en": "light in color",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "放了一下午以后，花的香味也慢慢变淡了。",
                "translation": "After sitting there all afternoon, the flowers' fragrance gradually became faint.",
                "meaning_en": "faint",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    271: {
        "notes": "The surface under your feet. Outdoors it usually means the ground; indoors it often means the floor.",
        "examples": [
            {
                "sentence": "雨停以后，地面还没有完全干。",
                "translation": "After the rain stopped, the ground still wasn't completely dry.",
                "meaning_en": "ground",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "教室里的地面刚洗过，走路慢一点。",
                "translation": "The classroom floor has just been washed, so walk a little more slowly.",
                "meaning_en": "floor",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "飞机离开地面以后，她才慢慢放松下来。",
                "translation": "Only after the plane left the ground did she slowly relax.",
                "meaning_en": "ground",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    280: {
        "primary_gloss": "electrical appliance",
        "secondary_glosses": ["appliance", "home appliance"],
        "notes": "Used for electrically powered appliances in everyday life, especially things people use at home or buy in appliance stores, rather than electronics in general.",
        "examples": [
            {
                "sentence": "出门前记得把不用的电器关掉，这样更安全。",
                "translation": "Before going out, remember to turn off any appliances you're not using; it's safer that way.",
                "meaning_en": "electrical appliance",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "搬进新家以后，很多电器都得重新买，花了不少钱。",
                "translation": "After moving into the new place, a lot of appliances had to be bought again, and it cost quite a bit.",
                "meaning_en": "electrical appliance",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "厨房里的电器太多了，第一次用的时候得看说明。",
                "translation": "There are so many appliances in the kitchen that you have to read the instructions the first time you use them.",
                "meaning_en": "electrical appliance",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    293: {
        "secondary_glosses": ["bean curd"],
        "notes": "Soybean curd used as food; common in soups, home cooking, and everyday dishes.",
        "examples": [
            {
                "sentence": "今天买的豆腐很新鲜，简单做一做就很好吃。",
                "translation": "The tofu we bought today is very fresh, and it tastes great even with simple cooking.",
                "meaning_en": "tofu",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她最近不太想吃肉，所以晚饭常常做豆腐和青菜。",
                "translation": "She hasn't really felt like eating meat lately, so dinner is often tofu and greens.",
                "meaning_en": "tofu",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这块豆腐看起来很普通，做出来却特别香。",
                "translation": "This piece of tofu looks ordinary, but it turns out especially fragrant when cooked.",
                "meaning_en": "tofu",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    294: {
        "notes": "A drink made from soybeans, often served hot or fresh and especially common at breakfast.",
        "examples": [
            {
                "sentence": "我早上只喝了一杯豆浆，到中午就饿了。",
                "translation": "I only had a cup of soy milk in the morning, so I was hungry again by noon.",
                "meaning_en": "soy milk",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "豆浆放久了以后，味道就没有刚做好的那么好了。",
                "translation": "If soy milk sits too long, it no longer tastes as good as it did when it was freshly made.",
                "meaning_en": "soy milk",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "天气冷的时候，喝一杯热豆浆会舒服很多。",
                "translation": "When it's cold, drinking a cup of hot soy milk feels much better.",
                "meaning_en": "soy milk",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    379: {
        "primary_gloss": "another day",
        "secondary_glosses": ["some other day", "another time"],
        "notes": "A spoken time expression for postponing something to an unspecified later day, often politely.",
        "examples": [
            {
                "sentence": "今天事情太多，报告的事我们改天再谈吧。",
                "translation": "There's too much going on today, so let's talk about the report another day.",
                "meaning_en": "another day",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这次真来不及了，改天我再陪你去看看。",
                "translation": "We really don't have time this time, so I'll go with you and check it out some other day.",
                "meaning_en": "some other day",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "你先把材料发我，改天我有空再仔细看。",
                "translation": "Send me the materials first; I'll look through them carefully another time when I have time.",
                "meaning_en": "another time",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    447: {
        "secondary_glosses": ["cupboard", "storage cabinet"],
        "notes": "A general everyday word for a cabinet or storage unit; the best English translation depends on what it stores and where it is.",
        "examples": [
            {
                "sentence": "重要的材料都锁在那个柜子里，别人拿不到。",
                "translation": "All the important materials are locked in that cabinet, so other people can't get them.",
                "meaning_en": "cabinet",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她把厚衣服收进柜子里，房间一下子整齐多了。",
                "translation": "She put the thick clothes away in the cabinet, and the room immediately looked much tidier.",
                "meaning_en": "cabinet",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "我找了半天，才想起钥匙还在办公室的柜子里。",
                "translation": "I looked for quite a while before remembering that the key was still in the office cabinet.",
                "meaning_en": "cabinet",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    451: {
        "secondary_glosses": ["National Day holiday"],
        "notes": "Usually refers to China's National Day on October 1. In everyday use, it often also refers to the holiday period around it.",
        "examples": [
            {
                "sentence": "国庆那天，很多人都会在家看晚会。",
                "translation": "On National Day itself, many people stay home and watch the gala.",
                "meaning_en": "National Day",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他们打算在国庆放假的时候回家看看父母。",
                "translation": "They plan to go home and see their parents during the National Day break.",
                "meaning_en": "National Day holiday",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "国庆前一个星期，很多商店就开始做活动了。",
                "translation": "A week before National Day, many shops already start running promotions.",
                "meaning_en": "National Day",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    452: {
        "notes": "Used when what actually happens matches what someone expected, guessed, or said beforehand.",
        "examples": [
            {
                "sentence": "天气预报说今天有雨，果然下午就开始下了。",
                "translation": "The weather forecast said it would rain today, and sure enough it started in the afternoon.",
                "meaning_en": "as expected",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我按他说的方法去试，果然比以前省时间。",
                "translation": "I tried it the way he suggested, and it did indeed save more time than before.",
                "meaning_en": "indeed",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "我换了这个办法以后，问题果然很快就解决了。",
                "translation": "After I switched to this method, the problem was resolved very quickly, just as expected.",
                "meaning_en": "as expected",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    482: {
        "secondary_glosses": ["dark"],
        "notes": "Most often describes something black in color. It also describes the sky or surroundings becoming dark enough that things are harder to see.",
        "examples": [
            {
                "sentence": "外套还是买黑的吧，平时比较好配衣服。",
                "translation": "Let's buy the black one; it's easier to match with other clothes for everyday wear.",
                "meaning_en": "black",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他的头发又黑又亮，看起来很年轻。",
                "translation": "His hair is black and shiny, so he looks very young.",
                "meaning_en": "black",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "天一黑，这条小路上就没什么人了。",
                "translation": "Once it gets dark, there are almost no people on this small road.",
                "meaning_en": "dark",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    567: {
        "secondary_glosses": ["to trim", "to clip"],
        "notes": "Usually means cutting with scissors or cutting something shorter or smaller, especially hair, paper, cloth, or a photo; common result patterns include 剪短 and 剪下来.",
        "examples": [
            {
                "sentence": "请把照片沿着这条线剪下来，我马上要用。",
                "translation": "Please cut the photo out along this line; I need it right away.",
                "meaning_en": "to cut",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "天气热了以后，她把头发剪得更短了。",
                "translation": "After the weather turned hot, she cut her hair even shorter.",
                "meaning_en": "to trim",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这条裤子有点长，回去以后我想剪短一点。",
                "translation": "These pants are a little long, so I want to shorten them a bit when I get home.",
                "meaning_en": "to trim",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    658: {
        "secondary_glosses": ["to go see someone"],
        "notes": "Used for visiting a person out of care, concern, or respect; it is for people, not places.",
        "examples": [
            {
                "sentence": "周末我们准备去医院看望刚做完手术的老师。",
                "translation": "This weekend we plan to go to the hospital to visit the teacher who just had surgery.",
                "meaning_en": "to visit someone",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "放假第一天，她就回老家看望外公外婆。",
                "translation": "On the first day of the break, she went back to her hometown to visit her grandparents.",
                "meaning_en": "to go see someone",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "每年过节，他都会带着礼物去看望以前的老师。",
                "translation": "Every holiday, he brings a gift and goes to visit his former teacher.",
                "meaning_en": "to visit someone",
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
