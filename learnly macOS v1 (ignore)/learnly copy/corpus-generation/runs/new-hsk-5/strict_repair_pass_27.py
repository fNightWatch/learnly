import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-27.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass27"


REPAIRS = {
    1330: {
        "secondary_glosses": ["a glance", "look"],
        "notes": "The basic noun for the eye. As a standalone word, 眼 very often appears in fixed everyday uses like 看一眼 and 一眼认出, where it extends to the idea of a glance or one look.",
        "examples": [
            {
                "sentence": "她抬头看了我一眼，又低头继续写邮件。",
                "translation": "She looked up at me once, then lowered her head and kept writing emails.",
                "meaning_en": "a glance",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "我刚进会议室，一眼就认出坐在里面的是他。",
                "translation": "The moment I walked into the meeting room, I recognized at a glance that the person sitting inside was him.",
                "meaning_en": "a glance",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "她的一只眼一直发红，下午只好先去医院。",
                "translation": "One of her eyes had stayed red the whole time, so she had to go to the hospital that afternoon.",
                "meaning_en": "eye",
                "difficulty": 4,
                "is_primary": True,
            },
        ],
    },
    1334: {
        "secondary_glosses": ["design", "pattern"],
        "notes": "The outward style, form, or design of something, especially clothing, bags, products, or other visible items people compare and choose between.",
        "examples": [
            {
                "sentence": "这件外套的样式比较简单，上班穿也很合适。",
                "translation": "The style of this coat is fairly simple, so it also works well for wearing to the office.",
                "meaning_en": "style",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这个包的样式有点旧，现在已经不太常见了。",
                "translation": "The style of this bag is a bit dated, and it is not very common anymore now.",
                "meaning_en": "style",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "几种样式都看过以后，她最后还是选了最简单的那个。",
                "translation": "After looking through several designs, she still ended up choosing the simplest one.",
                "meaning_en": "design",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1436: {
        "pos": "verb, noun",
        "primary_gloss": "agree in advance",
        "secondary_glosses": ["agreement", "arrange in advance"],
        "notes": "As a verb, 约定 means to make an agreement beforehand about time, action, or terms. As a noun, it can refer to that prior agreement or arrangement itself.",
        "examples": [
            {
                "sentence": "我们约定下周把资料准备齐，再一起去见客户。",
                "translation": "We agreed in advance to get all the materials ready next week and then go see the client together.",
                "meaning_en": "agree in advance",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "双方约定先试行一个月，再决定要不要长期合作。",
                "translation": "The two sides arranged in advance to try it for one month first and then decide whether to cooperate long term.",
                "meaning_en": "arrange in advance",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "他虽然先到了，但还是按约定在楼下等我们。",
                "translation": "Although he arrived early, he still waited for us downstairs as agreed.",
                "meaning_en": "agreement",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1441: {
        "secondary_glosses": ["put to use", "utilize"],
        "notes": "A relatively formal verb meaning to use knowledge, methods, experience, or data in a real task or situation, not just to possess them in theory.",
        "examples": [
            {
                "sentence": "她很会运用生活里的例子，把难懂的内容讲清楚。",
                "translation": "She is very good at applying examples from everyday life to explain difficult content clearly.",
                "meaning_en": "apply",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "学到的知识只有运用到实际工作里，才算真正掌握。",
                "translation": "Knowledge you have learned only counts as truly mastered once you can put it to use in real work.",
                "meaning_en": "put to use",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "他们会运用数据来分析问题，所以做决定更快。",
                "translation": "They know how to utilize data to analyze problems, so they make decisions faster.",
                "meaning_en": "utilize",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1452: {
        "primary_gloss": "already",
        "secondary_glosses": ["long since", "long ago"],
        "notes": "Used before a verb to show something was already true or already done well before now or before another later point. It often carries the sense that this should no longer be surprising.",
        "examples": [
            {
                "sentence": "这件事公司早已决定了，现在只是正式通知大家。",
                "translation": "The company had already decided this long before; now they are only formally informing everyone.",
                "meaning_en": "already",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "我早已把资料发到你邮箱里了，你再检查一下。",
                "translation": "I sent the materials to your mailbox long ago, so check again.",
                "meaning_en": "long ago",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "她早已习惯一个人住，所以没觉得有什么不方便。",
                "translation": "She had long since gotten used to living alone, so she did not find it inconvenient.",
                "meaning_en": "long since",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1454: {
        "secondary_glosses": ["bring about", "lead to"],
        "notes": "Used when one thing produces a result, especially an unwanted one such as inconvenience, misunderstanding, loss, pressure, or damage.",
        "examples": [
            {
                "sentence": "这次系统出问题，给很多用户造成了不便。",
                "translation": "This system problem caused inconvenience for many users.",
                "meaning_en": "cause",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "他说话太直接，在会议上造成了误会。",
                "translation": "He spoke too directly and brought about a misunderstanding at the meeting.",
                "meaning_en": "bring about",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "如果处理不及时，可能会造成更大的损失。",
                "translation": "If it is not handled in time, it may lead to even greater losses.",
                "meaning_en": "lead to",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1456: {
        "secondary_glosses": ["strengthen", "promote"],
        "notes": "Used for making something positive grow stronger or better, especially understanding, trust, feelings, cooperation, or health.",
        "examples": [
            {
                "sentence": "面对面交流更容易增进彼此的理解和信任。",
                "translation": "Face-to-face communication makes it easier to enhance mutual understanding and trust.",
                "meaning_en": "enhance",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "经常一起做饭，反而更能增进感情。",
                "translation": "Cooking together regularly can actually strengthen the relationship.",
                "meaning_en": "strengthen",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这种训练对增进身体健康也有帮助。",
                "translation": "This kind of training also helps promote physical health.",
                "meaning_en": "promote",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1464: {
        "secondary_glosses": ["carry out", "spread out"],
        "notes": "Can mean to open or spread something out physically, and also to begin or carry out something step by step, such as a discussion, investigation, or story.",
        "examples": [
            {
                "sentence": "他把那张旧地图慢慢展开，开始找我们要去的地方。",
                "translation": "He slowly unfolded the old map and started looking for the place we were going.",
                "meaning_en": "unfold",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "双方围绕这个问题展开了长时间的讨论。",
                "translation": "The two sides carried out a long discussion around this issue.",
                "meaning_en": "carry out",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "调查一展开，就发现了不少过去没注意到的问题。",
                "translation": "Once the investigation got underway, it uncovered quite a few problems that had not been noticed before.",
                "meaning_en": "carry out",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1466: {
        "primary_gloss": "show",
        "secondary_glosses": ["present", "display"],
        "notes": "Used when something is shown clearly to other people so they can look at it, understand it, or evaluate it. It is common for data, reports, products, plans, and presentations.",
        "examples": [
            {
                "sentence": "她在会上展示了最新的数据，大家一下就看出了问题在哪儿。",
                "translation": "She showed the latest data at the meeting, and everyone immediately saw where the problem was.",
                "meaning_en": "show",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "报告用一张图展示了这几年收入的变化。",
                "translation": "The report used a chart to display the changes in income over the past few years.",
                "meaning_en": "display",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "店门口展示着几件新衣服，路过的人都会多看两眼。",
                "translation": "Several new clothes were on display at the shop entrance, and people passing by all took an extra look.",
                "meaning_en": "display",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1468: {
        "secondary_glosses": ["occupy", "take up"],
        "notes": "Can mean making up part of a total, such as a percentage or majority, and can also mean taking up physical space.",
        "examples": [
            {
                "sentence": "房租和交通费加起来，占了工资的一大半。",
                "translation": "Rent and transportation together account for more than half of the salary.",
                "meaning_en": "account for",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这张桌子太大，占了办公室不少地方。",
                "translation": "This desk is too big and takes up quite a lot of space in the office.",
                "meaning_en": "take up",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "年轻员工占了部门的一大半，所以大家做事都比较快。",
                "translation": "Young employees account for more than half of the department, so people tend to work fairly quickly.",
                "meaning_en": "account for",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1483: {
        "secondary_glosses": ["valuable"],
        "notes": "Describes something highly valuable because it is rare, meaningful, hard to replace, or deeply worth protecting, including trust, time, materials, and relationships.",
        "examples": [
            {
                "sentence": "在最困难的时候，别人愿意相信你，这份信任很珍贵。",
                "translation": "When times are hardest, the trust of someone who is still willing to believe in you is very precious.",
                "meaning_en": "precious",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "对刚开始做生意的人来说，第一批老客户特别珍贵。",
                "translation": "For someone just starting a business, the first group of loyal customers is especially valuable.",
                "meaning_en": "valuable",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这种一手材料很珍贵，以后做研究还用得上。",
                "translation": "This kind of first-hand material is very valuable and may still be useful for research later on.",
                "meaning_en": "valuable",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1489: {
        "secondary_glosses": ["win over", "fight for"],
        "notes": "Means making an active effort to gain time, chances, support, or opportunities, and can also mean trying to win someone's understanding or backing.",
        "examples": [
            {
                "sentence": "我们得先争取一点时间，把最重要的问题想清楚。",
                "translation": "We need to strive for a little more time first and think through the most important issues clearly.",
                "meaning_en": "strive for",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "她主动去和家里人谈，希望争取他们的理解和支持。",
                "translation": "She took the initiative to talk with her family, hoping to win over their understanding and support.",
                "meaning_en": "win over",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "公司最近正在争取几个大客户，所以大家都特别忙。",
                "translation": "The company has recently been fighting for several major clients, so everyone has been especially busy.",
                "meaning_en": "fight for",
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

            if "pos" in repair:
                payload["word"]["pos"] = repair["pos"]
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
