import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-08.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass8"


REPAIRS = {
    166: {
        "secondary_glosses": ["household pet", "companion animal"],
        "examples": [
            {
                "sentence": "宿舍里不能养宠物，这是学校的规定。",
                "translation": "You cannot keep pets in the dorm; that is the school's rule.",
                "meaning_en": "pet",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她一个人住，所以想养只宠物陪自己。",
                "translation": "She lives alone, so she wants a pet to keep her company.",
                "meaning_en": "pet",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "带宠物去看病的时候，主人比它还紧张。",
                "translation": "When taking a pet to the doctor, the owner is even more nervous than it is.",
                "meaning_en": "pet",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    172: {
        "primary_gloss": "beginner-level",
        "secondary_glosses": ["elementary-level", "basic"],
        "notes": "Common for classes, textbooks, exams, and skill levels.",
        "examples": [
            {
                "sentence": "我刚报名初级汉语课，下个月开始上课。",
                "translation": "I just signed up for a beginner Chinese class, and it starts next month.",
                "meaning_en": "beginner-level",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这本书是给初级学生准备的，你可以先看这本。",
                "translation": "This book is prepared for beginner students, and you can start with this one.",
                "meaning_en": "beginner-level",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他的汉语还是初级水平，所以老师说得比较慢。",
                "translation": "His Chinese is still at a beginner level, so the teacher speaks relatively slowly.",
                "meaning_en": "beginner-level",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    213: {
        "primary_gloss": "dress oneself up",
        "secondary_glosses": ["fix up one's appearance", "disguise oneself as"],
        "notes": "Most often everyday grooming or appearance; 打扮成 marks the disguised-as sense.",
        "examples": [
            {
                "sentence": "她出门前总要打扮一下。",
                "translation": "She always fixes herself up a bit before going out.",
                "meaning_en": "dress oneself up",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "面试那天，她打扮得很正式。",
                "translation": "On the day of the interview, she dressed very formally.",
                "meaning_en": "dress oneself up",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "孩子打扮成医生，别人都以为他真是医生。",
                "translation": "The child dressed up as a doctor, and everyone thought he really was one.",
                "meaning_en": "disguise oneself as",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    269: {
        "primary_gloss": "hand over",
        "secondary_glosses": ["pass to", "hand to"],
        "notes": "Usually takes an object plus recipient, often in the pattern 递给.",
        "examples": [
            {
                "sentence": "请把这个文件递给我，我先看一下。",
                "translation": "Please hand me this document; I will look at it first.",
                "meaning_en": "hand over",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "进去以前，要先把证件递给门口的人。",
                "translation": "Before going in, you need to hand your ID to the person at the door first.",
                "meaning_en": "hand over",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她把申请表递给老师，请老师签字。",
                "translation": "She handed the application form to the teacher and asked the teacher to sign it.",
                "meaning_en": "hand over",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    449: {
        "primary_gloss": "cooking pot; wok",
        "notes": "General kitchen vessel for boiling or frying; often counted with 口.",
        "examples": [
            {
                "sentence": "锅里的水开了，把面放进去吧。",
                "translation": "The water in the pot is boiling, so put the noodles in.",
                "meaning_en": "cooking pot",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "用这口锅炒菜很方便，也容易洗。",
                "translation": "This wok is convenient for stir-frying, and it is easy to wash.",
                "meaning_en": "wok",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "你先帮我看着锅，我去接个电话。",
                "translation": "Keep an eye on the pot for me first; I am going to answer a phone call.",
                "meaning_en": "cooking pot",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    450: {
        "secondary_glosses": ["Chinese-style painting"],
        "notes": "Refers both to the traditional art form and to an individual painting in that style.",
        "examples": [
            {
                "sentence": "老师说，国画和油画用的工具不一样。",
                "translation": "The teacher said traditional Chinese painting and oil painting use different tools.",
                "meaning_en": "traditional Chinese painting",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "墙上挂着一幅国画，画的是山水。",
                "translation": "A traditional Chinese painting is hanging on the wall, and it shows a landscape scene.",
                "meaning_en": "traditional Chinese painting",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她退休以后开始学国画，现在画得越来越好了。",
                "translation": "She started learning traditional Chinese painting after retiring, and now she paints better and better.",
                "meaning_en": "traditional Chinese painting",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    457: {
        "primary_gloss": "to expire; to be past its valid date",
        "secondary_glosses": ["to become invalid"],
        "notes": "Used for food, medicine, tickets, cards, and documents once their valid period has passed.",
        "examples": [
            {
                "sentence": "这张票已经过期了，现在不能用了。",
                "translation": "This ticket has already expired, so it cannot be used now.",
                "meaning_en": "expire",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "护照快过期了，出国前要先检查一下。",
                "translation": "The passport is about to expire, so check it before going abroad.",
                "meaning_en": "be past its valid date",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "身份证过期以后，很多事都办不了。",
                "translation": "Once an ID card expires, a lot of things cannot be handled anymore.",
                "meaning_en": "become invalid",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    462: {
        "notes": "Food-category noun covering fish, shrimp, crab, shellfish, and similar sea-derived foods.",
        "examples": [
            {
                "sentence": "这家店的海鲜很新鲜，所以客人很多。",
                "translation": "The seafood at this restaurant is very fresh, so it has many customers.",
                "meaning_en": "seafood",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她对海鲜过敏，所以从来不点海鲜。",
                "translation": "She is allergic to seafood, so she never orders it.",
                "meaning_en": "seafood",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "早上去市场买海鲜的人特别多。",
                "translation": "In the morning, there are especially many people going to the market to buy seafood.",
                "meaning_en": "seafood",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    635: {
        "primary_gloss": "orange (fruit)",
        "notes": "Fruit word, not the color orange.",
        "examples": [
            {
                "sentence": "我买了两斤橘子，带回家给家人吃。",
                "translation": "I bought about a kilo of oranges to take home for my family.",
                "meaning_en": "orange (fruit)",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这些橘子虽然不大，但是特别甜。",
                "translation": "These oranges are not big, but they are especially sweet.",
                "meaning_en": "orange (fruit)",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "医生建议他多吃水果，所以他买了不少橘子。",
                "translation": "The doctor advised him to eat more fruit, so he bought quite a few oranges.",
                "meaning_en": "orange (fruit)",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    678: {
        "examples": [
            {
                "sentence": "门的宽度不够，沙发搬不进去。",
                "translation": "The doorway is not wide enough, so the sofa cannot be moved in.",
                "meaning_en": "width",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "买桌子以前，最好先量一下房间的宽度。",
                "translation": "Before buying a table, it is best to measure the room's width first.",
                "meaning_en": "width",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "设计的时候，要先确定窗户的宽度。",
                "translation": "When designing, you need to determine the window's width first.",
                "meaning_en": "width",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    680: {
        "examples": [
            {
                "sentence": "夏天晚上，灯一亮就会出现很多昆虫。",
                "translation": "On summer nights, as soon as the light comes on, many insects appear.",
                "meaning_en": "insect",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "有些昆虫虽然很小，但是对植物的影响很大。",
                "translation": "Some insects are very small, but they have a big effect on plants.",
                "meaning_en": "insect",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "老师带孩子去公园观察昆虫。",
                "translation": "The teacher took the children to the park to observe insects.",
                "meaning_en": "insect",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1004: {
        "primary_gloss": "wet; damp",
        "examples": [
            {
                "sentence": "雨刚停，路上还是湿的，走路要小心。",
                "translation": "The rain just stopped, and the road is still wet, so be careful walking.",
                "meaning_en": "wet",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "衣服还没干，现在还是湿的。",
                "translation": "The clothes are not dry yet and are still wet now.",
                "meaning_en": "wet",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这个房间太湿，不适合放书。",
                "translation": "This room is too damp and is not suitable for keeping books.",
                "meaning_en": "damp",
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
