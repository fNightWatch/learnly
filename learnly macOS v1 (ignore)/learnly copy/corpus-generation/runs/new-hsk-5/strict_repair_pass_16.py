import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-16.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass16"


REPAIRS = {
    153: {
        "secondary_glosses": [],
        "notes": "Usually means the fruit; the color is normally 橙色.",
        "examples": [
            {
                "sentence": "这个橙子看着不大，吃起来却很甜。",
                "translation": "This orange does not look very big, but it is very sweet.",
                "meaning_en": "orange",
                "difficulty": 2,
                "is_primary": True,
            },
            {
                "sentence": "超市今天的橙子很甜，所以我又买了几个。",
                "translation": "The oranges at the supermarket were very sweet today, so I bought a few more.",
                "meaning_en": "orange",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她把橙子放在家里，准备明天再吃。",
                "translation": "She put the oranges at home and plans to eat them tomorrow.",
                "meaning_en": "orange",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    223: {
        "primary_gloss": "uncooked rice",
        "secondary_glosses": [],
        "notes": "Usually means uncooked rice or rice as an ingredient; a bowl of cooked rice is normally 米饭.",
        "examples": [
            {
                "sentence": "在南方，大米是很多家庭每天都离不开的主食。",
                "translation": "In the south, rice is a staple that many families rely on every day.",
                "meaning_en": "uncooked rice",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这种大米煮出来很香，所以食堂一直用它。",
                "translation": "This kind of rice comes out very fragrant when cooked, so the cafeteria has kept using it.",
                "meaning_en": "uncooked rice",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "最近大米价格涨了不少，所以超市一打折大家就会多买一点。",
                "translation": "Rice prices have gone up quite a bit lately, so whenever the supermarket has a sale, people buy extra.",
                "meaning_en": "uncooked rice",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    293: {
        "secondary_glosses": [],
        "notes": "Tofu made from soybeans, common in home cooking and everyday dishes.",
        "examples": [
            {
                "sentence": "今天晚饭有豆腐，我想多吃一点。",
                "translation": "There is tofu for dinner tonight, and I want to eat a little more of it.",
                "meaning_en": "tofu",
                "difficulty": 2,
                "is_primary": True,
            },
            {
                "sentence": "他最近不太想吃肉，晚饭常常做豆腐和青菜。",
                "translation": "He has not really wanted to eat meat lately, so dinner is often tofu and green vegetables.",
                "meaning_en": "tofu",
                "difficulty": 2,
                "is_primary": False,
            },
            {
                "sentence": "晚上妈妈做了豆腐汤，我喝了两碗。",
                "translation": "Mom made tofu soup tonight, and I drank two bowls of it.",
                "meaning_en": "tofu",
                "difficulty": 2,
                "is_primary": False,
            },
        ],
    },
    311: {
        "secondary_glosses": ["measure word for clouds"],
        "notes": "Mainly used for flowers and clouds. It can also extend to small flower-shaped things, but those uses are less central for learners.",
        "examples": [
            {
                "sentence": "她回家的路上买了三朵花，想放在客厅的桌子上。",
                "translation": "On the way home, she bought three flowers and wanted to put them on the table in the living room.",
                "meaning_en": "measure word for flowers",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "下午天上只有几朵云，所以大家还是决定出去走走。",
                "translation": "There were only a few clouds in the sky that afternoon, so everyone still decided to go out for a walk.",
                "meaning_en": "measure word for clouds",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "花园里那朵花开得最晚，所以大家都先去看它。",
                "translation": "That flower in the garden was the last to bloom, so everyone went to look at it first.",
                "meaning_en": "measure word for flowers",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    369: {
        "primary_gloss": "measure word for pairs and sets",
        "secondary_glosses": ["measure word for a look or appearance"],
        "notes": "Used for certain paired or complete-set items such as glasses and gloves. It is also common in patterns like 一副样子 or 一副表情 for someone's look or expression.",
        "examples": [
            {
                "sentence": "他最近看电脑太久，准备周末去配一副新眼镜。",
                "translation": "He has been looking at the computer too much lately, so he plans to get a new pair of glasses this weekend.",
                "meaning_en": "measure word for pairs and sets",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "天冷以后，她给孩子买了一副手套，早上骑车就不怕冷了。",
                "translation": "After the weather turned cold, she bought the child a pair of gloves, so riding in the morning was no longer so cold.",
                "meaning_en": "measure word for pairs and sets",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "老板一进会议室就是一副很着急的样子，大家马上安静下来。",
                "translation": "As soon as the boss walked into the meeting room with a very anxious look on his face, everyone quieted down immediately.",
                "meaning_en": "measure word for a look or appearance",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    379: {
        "secondary_glosses": ["another day"],
        "notes": "Used to put something off to another day, often as a polite way to postpone, reschedule, or continue later.",
        "examples": [
            {
                "sentence": "今天太晚了，这件事我们改天再说吧。",
                "translation": "It is too late today, so let us talk about this another day.",
                "meaning_en": "some other day",
                "difficulty": 2,
                "is_primary": True,
            },
            {
                "sentence": "这家店已经关门了，改天我再带你来吧。",
                "translation": "This shop is already closed, so I will bring you back another day.",
                "meaning_en": "another day",
                "difficulty": 2,
                "is_primary": False,
            },
            {
                "sentence": "这周我有点忙，改天再请你吃饭。",
                "translation": "I am a bit busy this week; I will treat you to a meal another day.",
                "meaning_en": "some other day",
                "difficulty": 2,
                "is_primary": False,
            },
        ],
    },
    403: {
        "primary_gloss": "measure word for long, thin things",
        "secondary_glosses": ["root"],
        "notes": "Most often used as a classifier for long, thin things such as bananas, hair, ropes, or sticks. As a noun, it also means the root of a plant.",
        "examples": [
            {
                "sentence": "他早上没吃早饭，只带了一根香蕉就出门了。",
                "translation": "He did not have breakfast that morning and left home with only a banana.",
                "meaning_en": "measure word for long, thin things",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她低头的时候，发现外套上有一根头发，就顺手拿掉了。",
                "translation": "When she looked down, she noticed a strand of hair on her coat and removed it right away.",
                "meaning_en": "measure word for long, thin things",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这棵树的根很深，下了几天大雨也没有倒。",
                "translation": "This tree's roots are deep, so it did not fall even after several days of heavy rain.",
                "meaning_en": "root",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    451: {
        "secondary_glosses": ["National Day holiday"],
        "notes": "Refers to China's National Day; in everyday use it often also refers to the National Day holiday period around it.",
        "examples": [
            {
                "sentence": "国庆快到了，街上已经很热闹了。",
                "translation": "National Day is coming soon, and the streets are already getting lively.",
                "meaning_en": "National Day",
                "difficulty": 2,
                "is_primary": True,
            },
            {
                "sentence": "今年国庆假期，我们打算一起回家陪父母几天。",
                "translation": "This National Day holiday, we plan to go home together and spend a few days with our parents.",
                "meaning_en": "National Day holiday",
                "difficulty": 2,
                "is_primary": False,
            },
            {
                "sentence": "每年国庆期间，来这里旅游的人都特别多。",
                "translation": "Every year during the National Day holiday, a lot of people come here as tourists.",
                "meaning_en": "National Day holiday",
                "difficulty": 2,
                "is_primary": False,
            },
        ],
    },
    467: {
        "primary_gloss": "line",
        "secondary_glosses": ["row", "measure word for lines of text"],
        "notes": "Read háng here, not xíng. It refers to a line or row in writing, and it can also describe people standing in a line; it also works as a measure word for lines of text.",
        "examples": [
            {
                "sentence": "请把地址写在下一行，名字和电话已经写在上面了。",
                "translation": "Please write the address on the next line; the name and phone number are already written above.",
                "meaning_en": "line",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "孩子们在门口站成一行，等老师带大家进去。",
                "translation": "The children stood in a line at the door, waiting for the teacher to lead them in.",
                "meaning_en": "row",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这首诗虽然不长，可是最后两行我一直没有读懂。",
                "translation": "This poem is not long, but I still have not understood the last two lines.",
                "meaning_en": "measure word for lines of text",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    482: {
        "primary_gloss": "black; dark",
        "secondary_glosses": [],
        "notes": "Usually describes something black in color; it also commonly describes the sky or surroundings becoming dark.",
        "examples": [
            {
                "sentence": "她今天穿了一件黑外套，看起来很精神。",
                "translation": "She is wearing a black coat today, and she looks very sharp.",
                "meaning_en": "black",
                "difficulty": 2,
                "is_primary": True,
            },
            {
                "sentence": "外面已经黑了，我们早点回去吧。",
                "translation": "It is already dark outside, so let us head back early.",
                "meaning_en": "dark",
                "difficulty": 2,
                "is_primary": False,
            },
            {
                "sentence": "这只猫全身都是黑的，晚上不太容易看见。",
                "translation": "This cat is completely black, so it is not easy to spot at night.",
                "meaning_en": "black",
                "difficulty": 2,
                "is_primary": False,
            },
        ],
    },
    567: {
        "secondary_glosses": ["to trim"],
        "notes": "Usually means cutting or trimming with scissors, especially hair, paper, or cloth.",
        "examples": [
            {
                "sentence": "天气一热，她就把头发剪短了一些。",
                "translation": "As soon as the weather got hot, she had her hair cut a little shorter.",
                "meaning_en": "to trim",
                "difficulty": 2,
                "is_primary": True,
            },
            {
                "sentence": "请先把这张纸剪开，我等一下要用。",
                "translation": "Please cut this sheet of paper first; I need it in a moment.",
                "meaning_en": "to cut",
                "difficulty": 2,
                "is_primary": False,
            },
            {
                "sentence": "妈妈让我把这张纸剪成小块。",
                "translation": "Mom asked me to cut this sheet of paper into small pieces.",
                "meaning_en": "to cut",
                "difficulty": 2,
                "is_primary": False,
            },
        ],
    },
    658: {
        "primary_gloss": "to visit someone",
        "secondary_glosses": ["to go see someone"],
        "notes": "Used for going to see a person, especially to show care or respect, such as a relative, teacher, elder, or someone who is ill; it is not used for visiting places.",
        "examples": [
            {
                "sentence": "周末我们打算去医院看望生病的老师。",
                "translation": "We are planning to go to the hospital this weekend to visit our sick teacher.",
                "meaning_en": "to visit someone",
                "difficulty": 2,
                "is_primary": True,
            },
            {
                "sentence": "放假以后，她先回老家去看望外婆。",
                "translation": "After the break starts, she will first go back to her hometown to visit her grandmother.",
                "meaning_en": "to go see someone",
                "difficulty": 2,
                "is_primary": False,
            },
            {
                "sentence": "他带了一些水果去看望生病的朋友。",
                "translation": "He took some fruit to visit a sick friend.",
                "meaning_en": "to visit someone",
                "difficulty": 2,
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
