import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-24.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass24"


REPAIRS = {
    151: {
        "secondary_glosses": ["group member", "team member"],
        "notes": "A person who belongs to a group, team, organization, or committee; it refers to belonging to the group, not just showing up once.",
        "examples": [
            {
                "sentence": "每个成员都得把自己负责的部分准备好。",
                "translation": "Each member has to get the part they are responsible for ready.",
                "meaning_en": "member",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "项目组来了两位新成员，大家先花时间互相认识。",
                "translation": "Two new members joined the project team, so everyone first spent some time getting to know one another.",
                "meaning_en": "team member",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "讨论这个问题的时候，几个成员的意见并不一样。",
                "translation": "When discussing this issue, several members did not have the same opinion.",
                "meaning_en": "member",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    288: {
        "secondary_glosses": ["to become frozen", "to get numb from cold"],
        "notes": "Used when something freezes because of cold, when someone freezes food, or when part of the body becomes painfully cold or numb.",
        "examples": [
            {
                "sentence": "夜里太冷，放在外面的水早上已经冻上了。",
                "translation": "It was so cold at night that the water left outside had frozen over by morning.",
                "meaning_en": "to become frozen",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这些鱼先冻起来，周末家里人来了一起吃。",
                "translation": "Freeze these fish first, and we'll eat them together when the family comes over this weekend.",
                "meaning_en": "to freeze",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "我在外面等了半天，手都快冻得没有感觉了。",
                "translation": "I waited outside for a long time, and my hands were almost numb from the cold.",
                "meaning_en": "to get numb from cold",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    366: {
        "notes": "To hold or support a person or thing by hand so it does not fall; often used when helping someone stand, walk, or move carefully.",
        "examples": [
            {
                "sentence": "奶奶起身的时候，我赶紧过去扶了她一把。",
                "translation": "When Grandma got up, I quickly went over and gave her a supporting hand.",
                "meaning_en": "to help up",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "路太滑，他只好扶着墙慢慢往前走。",
                "translation": "The road was too slippery, so he had to hold onto the wall and move forward slowly.",
                "meaning_en": "to hold steady",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她刚做完手术，下楼的时候一直有人扶着她。",
                "translation": "She had just had surgery, so someone was supporting her the whole time while she went downstairs.",
                "meaning_en": "to support with one's hand",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    559: {
        "secondary_glosses": ["suppose", "if it were the case that"],
        "notes": "A somewhat more formal way to introduce a hypothetical condition or imagined situation, similar to 如果 but less everyday in tone.",
        "examples": [
            {
                "sentence": "假如明天还下雨，活动就得改到室内了。",
                "translation": "If it still rains tomorrow, the activity will have to be moved indoors.",
                "meaning_en": "if",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "假如你来负责这个项目，你会先解决哪个问题？",
                "translation": "Suppose you were in charge of this project; which problem would you solve first?",
                "meaning_en": "suppose",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "假如没有地图，我们可能到天黑也找不到那里。",
                "translation": "If we didn't have a map, we might not find that place even by nightfall.",
                "meaning_en": "if",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    802: {
        "notes": "Casual denim pants. In normal use, 牛仔裤 refers to jeans as an item of clothing, often in contexts like fit, style, comfort, or everyday wear.",
        "examples": [
            {
                "sentence": "我试了几条裤子，还是这条牛仔裤最合身。",
                "translation": "I tried on several pairs of pants, but this pair of jeans still fits best.",
                "meaning_en": "jeans",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他平时上班不穿牛仔裤，只有周末才会穿。",
                "translation": "He doesn't wear jeans to work; he only wears them on weekends.",
                "meaning_en": "jeans",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "旅行的时候穿牛仔裤虽然方便，但下雨以后不容易干。",
                "translation": "Wearing jeans while traveling is convenient, but after it rains they are not easy to dry.",
                "meaning_en": "jeans",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    819: {
        "primary_gloss": "match",
        "secondary_glosses": ["go with", "be well-matched"],
        "notes": "配 often means one thing goes well with another, especially clothes, colors, or food. In patterns like 很配, it means two things look right together or are well-matched.",
        "examples": [
            {
                "sentence": "这双白鞋配那条蓝裙子，确实很好看。",
                "translation": "These white shoes really go well with that blue dress.",
                "meaning_en": "match",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这条围巾虽然简单，但很配她那件大衣。",
                "translation": "Although this scarf is simple, it matches that coat of hers very well.",
                "meaning_en": "be well-matched",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "热汤配米饭，冬天吃起来特别舒服。",
                "translation": "Hot soup goes well with rice and feels especially comforting in winter.",
                "meaning_en": "go with",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    863: {
        "primary_gloss": "move forward",
        "secondary_glosses": ["advance", "make progress"],
        "notes": "Can describe literal forward movement or figurative progress. It usually suggests continuing ahead instead of stopping.",
        "examples": [
            {
                "sentence": "队伍在大雨里慢慢前进，谁也没有停下来。",
                "translation": "The group kept moving forward slowly in the heavy rain, and no one stopped.",
                "meaning_en": "move forward",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "只要方向没有错，我们就继续前进。",
                "translation": "As long as the direction is right, we'll keep moving forward.",
                "meaning_en": "advance",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "技术一直在前进，老办法已经不够用了。",
                "translation": "Technology keeps advancing, and the old methods are no longer enough.",
                "meaning_en": "make progress",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    935: {
        "secondary_glosses": ["now", "these days"],
        "notes": "A slightly more formal way to say now or nowadays, often when comparing the present with the past.",
        "examples": [
            {
                "sentence": "如今在网上买东西，比以前方便得多。",
                "translation": "Nowadays buying things online is much more convenient than before.",
                "meaning_en": "nowadays",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "如今不少老人也会用手机付钱了。",
                "translation": "Nowadays quite a few older people can also pay with their phones.",
                "meaning_en": "nowadays",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她如今一个人住，很多事都得自己决定。",
                "translation": "She lives on her own now, and she has to make many decisions herself.",
                "meaning_en": "now",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    947: {
        "primary_gloss": "dry in the sun",
        "secondary_glosses": ["put in the sun", "bask in the sun"],
        "notes": "For things, 晒 means putting them in the sun so they dry or air out. In 晒太阳, it means sitting in the sun yourself.",
        "examples": [
            {
                "sentence": "天气一放晴，奶奶就把被子拿到阳台上去晒。",
                "translation": "As soon as the weather cleared up, Grandma took the quilt out onto the balcony to dry in the sun.",
                "meaning_en": "dry in the sun",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这些衣服晒了一下午，太阳下山前应该能干。",
                "translation": "These clothes have been drying in the sun all afternoon, so they should be dry before sunset.",
                "meaning_en": "dry in the sun",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "冬天坐在窗边晒太阳，连看书都觉得舒服。",
                "translation": "In winter, sitting by the window in the sun makes even reading feel pleasant.",
                "meaning_en": "bask in the sun",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    992: {
        "secondary_glosses": ["lively", "lifelike"],
        "notes": "Describes speech, writing, pictures, expressions, or performances that feel clear, lively, and easy to picture in your mind.",
        "examples": [
            {
                "sentence": "她只用了几个小细节，就把那个人写得很生动。",
                "translation": "With just a few small details, she made that person come vividly to life in her writing.",
                "meaning_en": "vivid",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "画里孩子的表情很生动，看的人也会想笑。",
                "translation": "The child's expression in the picture is very lifelike, and it makes viewers want to smile too.",
                "meaning_en": "lifelike",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他说得太生动了，我一下就想起了小时候。",
                "translation": "He described it so vividly that I immediately thought of my childhood.",
                "meaning_en": "vivid",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    996: {
        "secondary_glosses": ["zodiac animal"],
        "notes": "Refers to one of the twelve traditional zodiac animals linked to a person's birth year, such as rat, ox, tiger, or rabbit.",
        "examples": [
            {
                "sentence": "别人一问我的生肖，我总得先想一下自己属什么。",
                "translation": "Whenever someone asks my Chinese zodiac sign, I always have to think for a moment about which animal year I was born in.",
                "meaning_en": "Chinese zodiac sign",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她和我生肖一样，所以每次过年都爱买一样的小东西。",
                "translation": "She has the same zodiac sign as I do, so every New Year we both like buying the same little things.",
                "meaning_en": "zodiac animal",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "过年的时候，商店里常能看到按生肖做的小礼物。",
                "translation": "During New Year, you can often see small gifts in shops made according to the zodiac animals.",
                "meaning_en": "Chinese zodiac sign",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1195: {
        "primary_gloss": "feed",
        "secondary_glosses": ["give by hand", "hello? (on the phone)", "hey"],
        "notes": "As a verb, 喂 means giving food, drink, or medicine to a person or animal. As an interjection, it is the very common hello? used when starting or answering a phone call, and sometimes hey to get attention.",
        "examples": [
            {
                "sentence": "奶奶每天一早都去院子里喂鸡，鸡一看见她就围过来。",
                "translation": "Every morning Grandma goes into the yard to feed the chickens, and they crowd around her as soon as they see her.",
                "meaning_en": "feed",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "孩子还没完全退烧，妈妈只好一口一口地喂他喝水。",
                "translation": "The child still hasn't fully recovered from the fever, so his mother has to give him water one mouthful at a time.",
                "meaning_en": "give by hand",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "喂，你先别挂电话，我还有一句话没说完。",
                "translation": "Hello, don't hang up yet; I still have one more thing to say.",
                "meaning_en": "hello? (on the phone)",
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
