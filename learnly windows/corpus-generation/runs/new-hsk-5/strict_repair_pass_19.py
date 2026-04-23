import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-19.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass19"


REPAIRS = {
    152: {
        "primary_gloss": "grow; develop",
        "secondary_glosses": ["grow up", "mature"],
        "notes": "Used for children, people, or other things becoming more developed, capable, or mature over time.",
        "examples": [
            {
                "sentence": "孩子在充满关心和鼓励的环境里，更容易健康地成长。",
                "translation": "Children grow more easily in a healthy way in an environment full of care and encouragement.",
                "meaning_en": "grow up",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这几年她在工作中成长得很快，现在已经能独立处理很多问题了。",
                "translation": "Over the past few years, she has developed quickly through her work and can now handle many problems independently.",
                "meaning_en": "develop",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "一个人不可能什么都一次做好，很多能力都是在失败中慢慢成长起来的。",
                "translation": "No one can do everything well in one try; many abilities are built up gradually through failure.",
                "meaning_en": "grow",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    154: {
        "primary_gloss": "pool; pond",
        "secondary_glosses": [],
        "notes": "A body of still water, often a pool or pond; it is also common in words like 游泳池 and 水池.",
        "examples": [
            {
                "sentence": "夏天一到，游泳池里就有很多孩子，连池边都坐满了等他们的家长。",
                "translation": "As soon as summer arrives, the swimming pool fills with children, and even the poolside is full of parents waiting for them.",
                "meaning_en": "pool",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "院子后面有一个小池，天气暖和的时候还能看见鱼在里面游来游去。",
                "translation": "There is a small pond behind the yard, and when the weather is warm you can still see fish swimming around in it.",
                "meaning_en": "pond",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "公园里的池虽然不大，可是周围种了很多花，晚上看起来特别安静。",
                "translation": "Although the pond in the park is not large, many flowers are planted around it, and it looks especially peaceful at night.",
                "meaning_en": "pond",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    157: {
        "secondary_glosses": [],
        "notes": "The wing of a bird, insect, or airplane; it is the part used for flying.",
        "examples": [
            {
                "sentence": "那只小鸟的翅膀受伤以后，在地上站了很久，都飞不起来。",
                "translation": "After that little bird hurt its wing, it stood on the ground for a long time and could not fly up.",
                "meaning_en": "wing",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "坐在靠窗的位置，可以清楚地看到飞机的翅膀在阳光下发亮。",
                "translation": "If you sit by the window, you can clearly see the airplane's wing shining in the sunlight.",
                "meaning_en": "wing",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "蝴蝶刚停在花上，轻轻动了动翅膀，就又飞走了。",
                "translation": "The butterfly had just landed on the flower, gently moved its wings, and then flew away again.",
                "meaning_en": "wing",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    222: {
        "primary_gloss": "middle-aged woman; auntie",
        "secondary_glosses": ["aunt"],
        "notes": "In everyday speech, 大妈 usually refers to a middle-aged woman or auntie; in family context, it can also mean an aunt.",
        "examples": [
            {
                "sentence": "小区门口卖早点的大妈每天都很热情，见到谁都会主动打招呼。",
                "translation": "The auntie who sells breakfast at the entrance of the neighborhood is warm every day and greets everyone she sees.",
                "meaning_en": "middle-aged woman",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "车上那位大妈看见孩子一直站着，就马上给他让了座。",
                "translation": "When the middle-aged woman on the bus saw the child standing the whole time, she immediately gave him her seat.",
                "meaning_en": "middle-aged woman",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "我小时候常去大妈家吃饭，她做的面到现在我还记得。",
                "translation": "I often went to my aunt's home for meals when I was little, and I still remember the noodles she made.",
                "meaning_en": "aunt",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    245: {
        "primary_gloss": "local; the local area",
        "secondary_glosses": ["the local area"],
        "notes": "Refers to the place where something happens. It can describe people, food, weather, or customs from that place, and it can also mean the area itself.",
        "examples": [
            {
                "sentence": "很多人来了以后，都想先吃当地的小吃。",
                "translation": "After arriving, many people want to try the local snacks first.",
                "meaning_en": "local",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "出发前我们先看了当地这几天的天气，怕到了以后一直下雨。",
                "translation": "Before setting out, we first checked the local weather for the next few days because we were worried it might keep raining after we arrived.",
                "meaning_en": "local",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这件事在当地已经很有名了，很多人都知道。",
                "translation": "This matter is already well known in the local area, and many people know about it.",
                "meaning_en": "the local area",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    554: {
        "notes": "To make food, drink, or another object warmer or hotter, especially before eating, drinking, or using it.",
        "examples": [
            {
                "sentence": "牛奶有点凉了，你先加热一下，再给孩子喝。",
                "translation": "The milk has gotten a little cold, so heat it up first before giving it to the child.",
                "meaning_en": "to heat",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "饭前把菜加热就可以吃了。",
                "translation": "You can eat the dish after heating it before the meal.",
                "meaning_en": "to warm up",
                "difficulty": 2,
                "is_primary": False,
            },
            {
                "sentence": "这种机器可以很快把水加热到合适的温度，所以冬天用起来特别方便。",
                "translation": "This kind of machine can quickly heat water to a suitable temperature, so it is especially convenient to use in winter.",
                "meaning_en": "to heat",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    576: {
        "notes": "The set of keys used for typing on a computer or similar device.",
        "examples": [
            {
                "sentence": "这个键盘太小了，我打字的时候总是按错，所以一直用不习惯。",
                "translation": "This keyboard is too small, so I keep hitting the wrong keys when I type and still have not gotten used to it.",
                "meaning_en": "keyboard",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "她不小心把水倒在键盘上，结果电脑马上就不能用了。",
                "translation": "She accidentally spilled water on the keyboard, and the computer stopped working right away.",
                "meaning_en": "keyboard",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "开会前请把键盘往左边放一点，不然我这边连记笔记的地方都没有了。",
                "translation": "Before the meeting starts, please move the keyboard a little to the left, or I will not even have room on my side to take notes.",
                "meaning_en": "keyboard",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    581: {
        "secondary_glosses": ["to talk", "speech; remarks"],
        "notes": "Usually means to speak or talk. In more formal situations, it can also mean a speech or public remarks.",
        "examples": [
            {
                "sentence": "请大家先安静一下，校长马上要开始讲话了，今天的重要安排他都会说明。",
                "translation": "Please quiet down for a moment. The principal is about to speak, and he will explain all of today's important arrangements.",
                "meaning_en": "to speak",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "他平时不太爱讲话，可是一谈到自己喜欢的工作，就会说个不停。",
                "translation": "He usually does not talk much, but as soon as the conversation turns to work he likes, he cannot stop talking.",
                "meaning_en": "to talk",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "经理今天的讲话虽然不长，但是把下个月的计划和要求都说清楚了。",
                "translation": "Although the manager's speech today was not long, it clearly explained next month's plans and requirements.",
                "meaning_en": "speech; remarks",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1002: {
        "secondary_glosses": ["win", "triumph"],
        "notes": "Usually a noun meaning victory; it can also be used as a more formal verb meaning to win or prevail.",
        "examples": [
            {
                "sentence": "这场胜利来得很不容易，大家准备了几个月，最后才在比赛里赢了对手。",
                "translation": "This victory did not come easily; everyone prepared for months before finally beating their opponents in the match.",
                "meaning_en": "victory",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "大家都相信，只要我们继续合作、坚持到底，就一定能胜利。",
                "translation": "Everyone believed that as long as we kept working together and held on to the end, we would definitely win.",
                "meaning_en": "win",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "听到胜利的消息以后，全队都站起来鼓掌，连平时最安静的人也笑了。",
                "translation": "After hearing the news of the victory, the whole team stood up and applauded; even the quietest person was smiling.",
                "meaning_en": "triumph",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1018: {
        "secondary_glosses": ["rock"],
        "notes": "The everyday word for a stone or rock, whether small or large, especially in natural settings.",
        "examples": [
            {
                "sentence": "山路中间有一块大石头，车开到那里时只好慢下来，从旁边绕过去。",
                "translation": "There was a big stone in the middle of the mountain road, so when the car reached it, it had to slow down and go around.",
                "meaning_en": "stone",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "孩子把小石头扔进水里。",
                "translation": "The child threw a small stone into the water.",
                "meaning_en": "stone",
                "difficulty": 2,
                "is_primary": False,
            },
            {
                "sentence": "这座山上树不多，到处都是黑色的石头，下雨以后路特别难走。",
                "translation": "There are not many trees on this mountain; it is full of black rocks, and after it rains the path becomes especially hard to walk.",
                "meaning_en": "rock",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1154: {
        "notes": "The everyday spoken word for potato, especially in shopping and cooking contexts.",
        "examples": [
            {
                "sentence": "今天晚上我们吃土豆和鸡蛋，大家都很喜欢。",
                "translation": "Tonight we are eating potatoes and eggs, and everyone likes it.",
                "meaning_en": "potato",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "超市里的土豆今天正在打折，不少人一下子买了好几斤回家。",
                "translation": "The potatoes at the supermarket were on sale today, so quite a few people bought several jin at once to take home.",
                "meaning_en": "potato",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "冬天家里常常会多买一些土豆，因为保存的时间比较长，做饭的时候很方便。",
                "translation": "In winter, families often buy extra potatoes because they keep for a long time and are convenient for cooking.",
                "meaning_en": "potato",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1155: {
        "notes": "The everyday word for a rabbit, commonly used for pets, zoo animals, and storybook animals.",
        "examples": [
            {
                "sentence": "这只兔子一点也不怕人，看见有人走近，还会慢慢跳过来。",
                "translation": "This rabbit is not afraid of people at all; when someone comes near, it even slowly hops over.",
                "meaning_en": "rabbit",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "孩子们一进动物园就跑去看兔子，因为它吃东西的样子特别可爱。",
                "translation": "As soon as the children entered the zoo, they ran to see the rabbits because the way they eat is especially cute.",
                "meaning_en": "rabbit",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "兔子一听到门外有声音，就立刻躲到桌子下面，半天都不出来。",
                "translation": "As soon as the rabbit heard a sound outside the door, it immediately hid under the table and would not come out for a long time.",
                "meaning_en": "rabbit",
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
