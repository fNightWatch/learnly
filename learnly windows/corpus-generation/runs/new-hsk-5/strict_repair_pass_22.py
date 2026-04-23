import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-22.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass22"


REPAIRS = {
    162: {
        "secondary_glosses": ["recharge", "add credit"],
        "notes": "Add money or stored value to a phone balance, transit card, app account, or similar service so it can keep being used.",
        "examples": [
            {
                "sentence": "手机没话费了，我得先充值，不然晚上打不了电话。",
                "translation": "My phone is out of credit, so I need to top it up first, or I won't be able to make calls tonight.",
                "meaning_en": "top up",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "坐车前先给卡里充值，不然连地铁站都进不去。",
                "translation": "Top up the card before you travel, or you won't even be able to get into the subway station.",
                "meaning_en": "top up",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这个月我已经充值两次了，话费还是不太够。",
                "translation": "I've already topped up twice this month, and my phone credit still isn't really enough.",
                "meaning_en": "add credit",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    170: {
        "primary_gloss": "beginning; early stage",
        "secondary_glosses": ["at first", "early in a period"],
        "notes": "Usually a bound form rather than a standalone everyday word. It appears in compounds like 年初, 月初, 起初, and 当初 to mark the beginning or early part of a time period, or to mean at first.",
        "examples": [
            {
                "sentence": "我们年初就谈过这个问题，只是一直没时间处理。",
                "translation": "We discussed this issue at the beginning of the year; we just never had time to deal with it.",
                "meaning_en": "beginning of the year",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "月初工资刚发的时候，他就先把房租交了。",
                "translation": "As soon as his salary was paid at the beginning of the month, he paid the rent first.",
                "meaning_en": "beginning of the month",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "起初我以为这事很简单，做起来才发现并不容易。",
                "translation": "At first I thought this would be simple, but once I started doing it, I realized it wasn't easy at all.",
                "meaning_en": "at first",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    230: {
        "primary_gloss": "older man",
        "secondary_glosses": ["sir (to an older man)", "father's older brother"],
        "notes": "In everyday speech, often a respectful way to address or refer to an older man. In family use, especially in northern Mandarin, it can mean one's father's older brother.",
        "examples": [
            {
                "sentence": "小区门口那位大爷每天都出来散步，我们都跟他打招呼。",
                "translation": "The older man by the neighborhood gate comes out for a walk every day, and we all greet him.",
                "meaning_en": "older man",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "我问了门口的大爷，他说今天外人不能进去。",
                "translation": "I asked the older man at the entrance, and he said outsiders weren't allowed in today.",
                "meaning_en": "sir (to an older man)",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "我大爷退休以后搬回老家住了，现在很少来城里。",
                "translation": "My father's older brother moved back to our hometown after retiring, so he rarely comes into the city now.",
                "meaning_en": "father's older brother",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    453: {
        "secondary_glosses": ["fruits of one's labor", "results"],
        "notes": "Literally the fruit produced by a plant or tree. It is also used figuratively for the results achieved through work, effort, or long-term activity.",
        "examples": [
            {
                "sentence": "秋天一到，树上的果实就慢慢变红了。",
                "translation": "As soon as autumn arrives, the fruit on the tree gradually turns red.",
                "meaning_en": "fruit",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这种植物的果实不大，但是成熟以后很甜。",
                "translation": "The fruit of this plant isn't big, but it's very sweet once it ripens.",
                "meaning_en": "fruit",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "大家忙了这么久，总算看到了自己的劳动果实。",
                "translation": "After working for so long, everyone finally saw the fruits of their own labor.",
                "meaning_en": "fruits of one's labor",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    807: {
        "primary_gloss": "oh",
        "secondary_glosses": ["I see"],
        "notes": "Spoken interjection used when someone suddenly understands, realizes, or recognizes something; it is very conversational, and tone affects the feeling.",
        "examples": [
            {
                "sentence": "哦，原来这就是你昨天提到的那家店。",
                "translation": "Oh, so this is the shop you mentioned yesterday.",
                "meaning_en": "oh",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "哦，我还以为会议已经开始了。",
                "translation": "Oh, I thought the meeting had already started.",
                "meaning_en": "oh",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "哦，你这么解释以后，我一下就明白了。",
                "translation": "Oh, after you explained it like that, I understood right away.",
                "meaning_en": "I see",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    896: {
        "primary_gloss": "area",
        "secondary_glosses": ["region", "zone"],
        "notes": "A clearly defined part of a place or larger space, such as part of a city, building, map, or geographic area; more formal than just 地方.",
        "examples": [
            {
                "sentence": "这个区域比较危险，没有特别原因不要进去。",
                "translation": "This area is fairly dangerous, so don't go in unless there's a special reason.",
                "meaning_en": "area",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "北方不少区域一到冬天就会下很大的雪。",
                "translation": "Many regions in the north get heavy snow as soon as winter arrives.",
                "meaning_en": "region",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "医院把儿童检查放在单独的区域，方便家长等候。",
                "translation": "The hospital put children's checkups in a separate area so it would be easier for parents to wait.",
                "meaning_en": "zone",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    926: {
        "primary_gloss": "the human body",
        "notes": "Formal word for the human body, common in medicine, health, and science; less everyday and personal than 身体.",
        "examples": [
            {
                "sentence": "医生说这种药进入人体以后，起作用比较快。",
                "translation": "The doctor said that once this medicine enters the human body, it works fairly quickly.",
                "meaning_en": "the human body",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "长期睡眠不足，对人体的影响比很多人想的更大。",
                "translation": "Long-term lack of sleep affects the human body more than many people think.",
                "meaning_en": "the human body",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "保持正常体重，对人体各方面都更有利。",
                "translation": "Maintaining a normal weight is better for the human body in all respects.",
                "meaning_en": "the human body",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    948: {
        "secondary_glosses": ["to remove", "to cut out"],
        "notes": "Informal short verb for deleting or removing words, sentences, photos, files, or other content, often in the form 删掉.",
        "examples": [
            {
                "sentence": "发出去以前，我把不太重要的内容删掉了。",
                "translation": "Before sending it out, I deleted the less important content.",
                "meaning_en": "to delete",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "老师说这一段和主题关系不大，可以先删掉。",
                "translation": "The teacher said this section wasn't very closely related to the topic, so it could be removed first.",
                "meaning_en": "to remove",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这张照片拍得不清楚，还是删了重新拍吧。",
                "translation": "This photo didn't come out clearly, so let's delete it and take another one.",
                "meaning_en": "to delete",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    968: {
        "secondary_glosses": ["grilled food", "barbecue meal"],
        "notes": "Best taught here as a noun: barbecue food, a barbecue meal, or the barbecue sold at stalls and small restaurants.",
        "examples": [
            {
                "sentence": "这家店的烧烤味道不错，就是人太多。",
                "translation": "The barbecue at this place tastes good; it's just too crowded.",
                "meaning_en": "barbecue",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "天气一热，这条街晚上卖烧烤的就特别多。",
                "translation": "As soon as the weather gets hot, this street fills with barbecue sellers at night.",
                "meaning_en": "barbecue",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "大家忙完以后，决定一起去吃烧烤放松一下。",
                "translation": "After finishing up, everyone decided to go have a barbecue meal together and relax.",
                "meaning_en": "barbecue meal",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    969: {
        "notes": "General everyday word for a snake. It is best taught through warning, fear, and real-life sighting contexts rather than zoological wording.",
        "examples": [
            {
                "sentence": "看见地上那条蛇的时候，她一下子就停住了。",
                "translation": "When she saw the snake on the ground, she stopped instantly.",
                "meaning_en": "snake",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "工作人员发现草里有蛇以后，马上让大家离开。",
                "translation": "After the staff found a snake in the grass, they immediately told everyone to leave.",
                "meaning_en": "snake",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "他小时候在农村住过，所以没那么怕蛇。",
                "translation": "He lived in the countryside when he was little, so he isn't that afraid of snakes.",
                "meaning_en": "snake",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    971: {
        "primary_gloss": "be willing to spend or part with",
        "secondary_glosses": ["bring oneself to", "be willing to give up"],
        "notes": "舍得 is not just plain willingness. It usually means being willing to do something that feels costly, such as spending money, giving up time, or parting with something valuable or emotionally important.",
        "examples": [
            {
                "sentence": "只要对孩子有帮助，他就舍得花钱。",
                "translation": "As long as it helps the child, he is willing to spend the money.",
                "meaning_en": "be willing to spend",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这么贵的外套，你也舍得买？",
                "translation": "You're willing to buy a coat that expensive?",
                "meaning_en": "bring oneself to buy",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "养了这么久的猫，你真舍得送人吗？",
                "translation": "After keeping this cat for so long, can you really bring yourself to give it away?",
                "meaning_en": "be willing to part with",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    994: {
        "primary_gloss": "warm up",
        "secondary_glosses": ["heat up", "intensify"],
        "notes": "First used for temperature rising. It can also extend to moods, discussions, or situations becoming warmer, stronger, or more intense.",
        "examples": [
            {
                "sentence": "这几天天气明显升温，大家都换上了薄衣服。",
                "translation": "The weather has clearly warmed up these past few days, and everyone has changed into lighter clothes.",
                "meaning_en": "warm up",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "汤刚放到火上没多久就开始升温了。",
                "translation": "The soup started heating up not long after it was put on the fire.",
                "meaning_en": "heat up",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "随着讨论继续下去，大家的情绪也慢慢升温了。",
                "translation": "As the discussion continued, everyone's emotions gradually intensified too.",
                "meaning_en": "intensify",
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
