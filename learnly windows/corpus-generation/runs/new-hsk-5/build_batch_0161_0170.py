#!/usr/bin/env python3

import json
from pathlib import Path


OUTPUT_PATH = Path(__file__).parent / "generated" / "orchestrator" / "batch-0161-0170.jsonl"


PAYLOADS = [
    {
        "word": {
            "id": "new-hsk-5-0161",
            "lang": "zh",
            "lemma": "充满",
            "display_form": "充满",
            "pos": "verb",
            "rank": 161,
            "pronunciation": "chōngmǎn",
        },
        "glosses": {
            "primary_gloss": "be full of",
            "secondary_glosses": ["fill"],
            "notes": "Used when a place, object, or expression is filled with something.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0161-ex1",
                "meaning_en": "be full of",
                "sentence": "房间里充满了爱。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0161-ex2",
                "meaning_en": "be full of",
                "sentence": "她的眼里充满希望。",
                "difficulty": 3,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0161-ex3",
                "meaning_en": "fill",
                "sentence": "这个杯子已经充满水了。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0161-ex1",
                "translation": "The room is full of love.",
            },
            {
                "example_id": "new-hsk-5-0161-ex2",
                "translation": "Her eyes are full of hope.",
            },
            {
                "example_id": "new-hsk-5-0161-ex3",
                "translation": "This cup is already filled with water.",
            },
        ],
    },
    {
        "word": {
            "id": "new-hsk-5-0162",
            "lang": "zh",
            "lemma": "充值",
            "display_form": "充值",
            "pos": "verb",
            "rank": 162,
            "pronunciation": "chōngzhí",
        },
        "glosses": {
            "primary_gloss": "top up",
            "secondary_glosses": ["recharge"],
            "notes": "To add money or credit to a phone account, card, or online balance.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0162-ex1",
                "meaning_en": "top up",
                "sentence": "手机没话费了，我先去充值。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0162-ex2",
                "meaning_en": "top up",
                "sentence": "你先给这张卡充值，再坐车。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0162-ex3",
                "meaning_en": "recharge",
                "sentence": "他刚充值完，就买了电影票。",
                "difficulty": 3,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0162-ex1",
                "translation": "My phone is out of credit, so I am going to top it up first.",
            },
            {
                "example_id": "new-hsk-5-0162-ex2",
                "translation": "Top up this card first, then take the bus.",
            },
            {
                "example_id": "new-hsk-5-0162-ex3",
                "translation": "He had just topped up his account when he bought a movie ticket.",
            },
        ],
    },
    {
        "word": {
            "id": "new-hsk-5-0163",
            "lang": "zh",
            "lemma": "充足",
            "display_form": "充足",
            "pos": "adjective",
            "rank": 163,
            "pronunciation": "chōngzú",
        },
        "glosses": {
            "primary_gloss": "ample",
            "secondary_glosses": ["sufficient", "adequate"],
            "notes": "Enough in supply or amount for what is needed.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0163-ex1",
                "meaning_en": "ample",
                "sentence": "我们带的水很充足。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0163-ex2",
                "meaning_en": "sufficient",
                "sentence": "时间充足，你慢慢做。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0163-ex3",
                "meaning_en": "adequate",
                "sentence": "店里准备得很充足，不怕人多。",
                "difficulty": 3,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0163-ex1",
                "translation": "We brought plenty of water.",
            },
            {
                "example_id": "new-hsk-5-0163-ex2",
                "translation": "There is plenty of time, so take your time.",
            },
            {
                "example_id": "new-hsk-5-0163-ex3",
                "translation": "The shop is very well prepared and is not worried about a lot of customers coming.",
            },
        ],
    },
    {
        "word": {
            "id": "new-hsk-5-0164",
            "lang": "zh",
            "lemma": "重复",
            "display_form": "重复",
            "pos": "verb",
            "rank": 164,
            "pronunciation": "chóngfù",
        },
        "glosses": {
            "primary_gloss": "repeat",
            "secondary_glosses": [],
            "notes": "To say, do, or write the same thing again.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0164-ex1",
                "meaning_en": "repeat",
                "sentence": "这句话你不要再重复了。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0164-ex2",
                "meaning_en": "repeat",
                "sentence": "老师把这句话又重复了一次。",
                "difficulty": 3,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0164-ex3",
                "meaning_en": "repeat",
                "sentence": "我不想重复昨天的话。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0164-ex1",
                "translation": "Do not repeat this sentence again.",
            },
            {
                "example_id": "new-hsk-5-0164-ex2",
                "translation": "The teacher repeated this sentence one more time.",
            },
            {
                "example_id": "new-hsk-5-0164-ex3",
                "translation": "I do not want to repeat what I said yesterday.",
            },
        ],
    },
    {
        "word": {
            "id": "new-hsk-5-0165",
            "lang": "zh",
            "lemma": "虫子",
            "display_form": "虫子",
            "pos": "noun",
            "rank": 165,
            "pronunciation": "chóngzi",
        },
        "glosses": {
            "primary_gloss": "bug",
            "secondary_glosses": ["insect"],
            "notes": "A small insect or bug that people usually notice in daily life.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0165-ex1",
                "meaning_en": "bug",
                "sentence": "树上有一只小虫子。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0165-ex2",
                "meaning_en": "insect",
                "sentence": "孩子看到虫子，马上跑开了。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0165-ex3",
                "meaning_en": "bug",
                "sentence": "这只虫子飞进了杯子里。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0165-ex1",
                "translation": "There is a little bug on the tree.",
            },
            {
                "example_id": "new-hsk-5-0165-ex2",
                "translation": "The child saw the bug and ran away at once.",
            },
            {
                "example_id": "new-hsk-5-0165-ex3",
                "translation": "This bug flew into the cup.",
            },
        ],
    },
    {
        "word": {
            "id": "new-hsk-5-0166",
            "lang": "zh",
            "lemma": "宠物",
            "display_form": "宠物",
            "pos": "noun",
            "rank": 166,
            "pronunciation": "chǒngwù",
        },
        "glosses": {
            "primary_gloss": "pet",
            "secondary_glosses": [],
            "notes": "An animal someone keeps at home and cares for.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0166-ex1",
                "meaning_en": "pet",
                "sentence": "她下班以后先去看宠物。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0166-ex2",
                "meaning_en": "pet",
                "sentence": "这家店不能带宠物进去。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0166-ex3",
                "meaning_en": "pet",
                "sentence": "我的宠物一见我就跑过来。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0166-ex1",
                "translation": "After getting off work, she goes to see her pet first.",
            },
            {
                "example_id": "new-hsk-5-0166-ex2",
                "translation": "You cannot take pets into this shop.",
            },
            {
                "example_id": "new-hsk-5-0166-ex3",
                "translation": "As soon as my pet sees me, it runs over.",
            },
        ],
    },
    {
        "word": {
            "id": "new-hsk-5-0167",
            "lang": "zh",
            "lemma": "抽",
            "display_form": "抽",
            "pos": "verb",
            "rank": 167,
            "pronunciation": "chōu",
        },
        "glosses": {
            "primary_gloss": "pull out",
            "secondary_glosses": ["choose at random", "smoke"],
            "notes": "A common verb for pulling something out, selecting someone by drawing, or smoking.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0167-ex1",
                "meaning_en": "pull out",
                "sentence": "他从包里抽出一张纸。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0167-ex2",
                "meaning_en": "choose at random",
                "sentence": "老师抽了三个人起来读。",
                "difficulty": 3,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0167-ex3",
                "meaning_en": "smoke",
                "sentence": "他吃完饭以后出去抽烟。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0167-ex1",
                "translation": "He pulled a sheet of paper out of his bag.",
            },
            {
                "example_id": "new-hsk-5-0167-ex2",
                "translation": "The teacher picked three people at random to stand up and read.",
            },
            {
                "example_id": "new-hsk-5-0167-ex3",
                "translation": "After eating, he went outside to smoke.",
            },
        ],
    },
    {
        "word": {
            "id": "new-hsk-5-0168",
            "lang": "zh",
            "lemma": "丑",
            "display_form": "丑",
            "pos": "adjective",
            "rank": 168,
            "pronunciation": "chǒu",
        },
        "glosses": {
            "primary_gloss": "ugly",
            "secondary_glosses": [],
            "notes": "Used when something looks unattractive or unpleasant to look at.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0168-ex1",
                "meaning_en": "ugly",
                "sentence": "这张照片不丑，你别删。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0168-ex2",
                "meaning_en": "ugly",
                "sentence": "这个字写得很丑。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0168-ex3",
                "meaning_en": "ugly",
                "sentence": "这只狗不丑，很可爱。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0168-ex1",
                "translation": "This photo is not ugly, so do not delete it.",
            },
            {
                "example_id": "new-hsk-5-0168-ex2",
                "translation": "This character is written very badly.",
            },
            {
                "example_id": "new-hsk-5-0168-ex3",
                "translation": "This dog is not ugly; it is very cute.",
            },
        ],
    },
    {
        "word": {
            "id": "new-hsk-5-0169",
            "lang": "zh",
            "lemma": "臭",
            "display_form": "臭",
            "pos": "adjective",
            "rank": 169,
            "pronunciation": "chòu",
        },
        "glosses": {
            "primary_gloss": "smelly",
            "secondary_glosses": ["stinky"],
            "notes": "Used when something has a strong bad smell.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0169-ex1",
                "meaning_en": "smelly",
                "sentence": "这双鞋太臭了，快拿出去。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0169-ex2",
                "meaning_en": "stinky",
                "sentence": "鱼放太久就会变臭。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0169-ex3",
                "meaning_en": "smelly",
                "sentence": "垃圾一多，房间里就很臭。",
                "difficulty": 3,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0169-ex1",
                "translation": "These shoes smell so bad. Take them outside quickly.",
            },
            {
                "example_id": "new-hsk-5-0169-ex2",
                "translation": "If fish is left too long, it starts to smell bad.",
            },
            {
                "example_id": "new-hsk-5-0169-ex3",
                "translation": "As soon as there is too much trash, the room starts to smell bad.",
            },
        ],
    },
    {
        "word": {
            "id": "new-hsk-5-0170",
            "lang": "zh",
            "lemma": "初",
            "display_form": "初",
            "pos": "noun, adverb, prefix",
            "rank": 170,
            "pronunciation": "chū",
        },
        "glosses": {
            "primary_gloss": "beginning",
            "secondary_glosses": ["early", "at first"],
            "notes": "Usually appears in words like 年初, 月初, and 起初 to show an early stage or the beginning of a period.",
        },
        "examples": [
            {
                "id": "new-hsk-5-0170-ex1",
                "meaning_en": "beginning",
                "sentence": "我们年初就定好了这个计划。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": True,
            },
            {
                "id": "new-hsk-5-0170-ex2",
                "meaning_en": "early in the month",
                "sentence": "月初的时候，他还住在这里。",
                "difficulty": 2,
                "source": "orchestrator",
                "is_primary": False,
            },
            {
                "id": "new-hsk-5-0170-ex3",
                "meaning_en": "at first",
                "sentence": "起初我不太明白，后来才懂。",
                "difficulty": 3,
                "source": "orchestrator",
                "is_primary": False,
            },
        ],
        "example_translations": [
            {
                "example_id": "new-hsk-5-0170-ex1",
                "translation": "We settled this plan at the beginning of the year.",
            },
            {
                "example_id": "new-hsk-5-0170-ex2",
                "translation": "At the beginning of the month, he was still living here.",
            },
            {
                "example_id": "new-hsk-5-0170-ex3",
                "translation": "At first I did not understand, and only later did I get it.",
            },
        ],
    },
]


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        "\n".join(json.dumps(payload, ensure_ascii=False) for payload in PAYLOADS) + "\n"
    )


if __name__ == "__main__":
    main()
