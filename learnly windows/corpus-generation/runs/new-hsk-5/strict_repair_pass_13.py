import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-13.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass13"


REPAIRS = {
    161: {
        "primary_gloss": "be filled with",
        "secondary_glosses": ["be full of"],
        "notes": "Often used for spaces, atmosphere, sounds, smells, or inner feelings: 房间里充满了..., 对...充满....",
        "examples": [
            {
                "sentence": "晚饭前，厨房里已经充满了饭菜的香味。",
                "translation": "Before dinner, the kitchen was already filled with the smell of food.",
                "meaning_en": "be filled with",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "晚会一开始，大厅里就充满了掌声。",
                "translation": "As soon as the gala began, the hall filled with applause.",
                "meaning_en": "be filled with",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "虽然输了第一场，他还是对后面的比赛充满信心。",
                "translation": "Although he lost the first round, he was still full of confidence about the matches ahead.",
                "meaning_en": "be full of",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    454: {
        "primary_gloss": "excessive",
        "secondary_glosses": ["overly"],
        "notes": "Used when something goes beyond a healthy, normal, or reasonable limit.",
        "examples": [
            {
                "sentence": "考试前过度紧张，不但影响发挥，也让人更没有自信。",
                "translation": "Excessive nervousness before an exam not only hurts performance, it also makes a person less confident.",
                "meaning_en": "excessive",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "医生提醒他不要过度运动，不然身体很难恢复。",
                "translation": "The doctor reminded him not to exercise excessively, or his body would have a hard time recovering.",
                "meaning_en": "overly",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "过度关注别人的看法，常常让人越来越没有自信。",
                "translation": "Paying excessive attention to other people's opinions often makes a person less and less confident.",
                "meaning_en": "excessive",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    637: {
        "primary_gloss": "be ... away from",
        "secondary_glosses": ["be ... before (a time)"],
        "notes": "A formal written equivalent of 离, used to state physical distance or the time remaining before a point in time.",
        "examples": [
            {
                "sentence": "我家距地铁站只有五分钟的路，所以上班很方便。",
                "translation": "My home is only a five-minute walk from the subway station, so getting to work is easy.",
                "meaning_en": "be ... away from",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "距开会时间只剩半小时，他还在路上。",
                "translation": "With only half an hour left before the meeting, he was still on the road.",
                "meaning_en": "be ... before (a time)",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "我们学校距火车站很近，所以出发前不用太着急。",
                "translation": "Our school is very close to the train station, so there is no need to rush before heading out.",
                "meaning_en": "be ... away from",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    735: {
        "primary_gloss": "leave a message",
        "secondary_glosses": ["message", "comment"],
        "notes": "Verb: leave a message or comment. Noun: the message or comment itself, especially by phone or online.",
        "examples": [
            {
                "sentence": "如果我没接电话，你可以先留言，我晚上再回你。",
                "translation": "If I do not answer the phone, you can leave a message first, and I will get back to you tonight.",
                "meaning_en": "leave a message",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我打开电脑以后，就看见了你的留言。",
                "translation": "After I turned on my computer, I saw the message you left.",
                "meaning_en": "message",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这篇文章下面的留言很多，我看了半天才看完。",
                "translation": "There were so many comments under this article that it took me quite a while to finish reading them.",
                "meaning_en": "comment",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    737: {
        "secondary_glosses": ["leave out", "miss"],
        "notes": "Can mean that water or something else leaks out, or that something gets missed by accident. Also used for accidental omission in records, reading, and forms.",
        "examples": [
            {
                "sentence": "下雨的时候，这间屋子又漏了，桌子上的材料都要先搬到别的房间。",
                "translation": "When it rains, this room starts leaking again, and the materials on the table have to be moved to another room first.",
                "meaning_en": "leak",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这间屋子一下雨就漏水，大家晚上常常睡不好。",
                "translation": "Whenever it rains, water leaks into this room, and people often cannot sleep well at night.",
                "meaning_en": "leak",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "我整理会议记录时漏掉了一个重要日期，通知发出去以后才发现问题。",
                "translation": "While organizing the meeting notes, I left out an important date and only discovered the problem after the notice had been sent out.",
                "meaning_en": "leave out",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1001: {
        "primary_gloss": "win; defeat",
        "secondary_glosses": ["surpass", "be better than"],
        "notes": "A fairly formal verb, especially strong in written narration and comparisons such as 胜过.",
        "examples": [
            {
                "sentence": "虽然上半场一直落后，我们最后还是胜了这场比赛，大家都很意外。",
                "translation": "Although we were behind the entire first half, we still won the match in the end, and everyone was surprised.",
                "meaning_en": "win",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "在经验上，他胜过我，所以这件事最好先听他的。",
                "translation": "In terms of experience, he surpasses me, so it is best to listen to him first on this matter.",
                "meaning_en": "be better than",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "比赛快结束了，现在谁胜还很难说，大家都不敢离开。",
                "translation": "The match is almost over, but it is still hard to say who will win, so no one dares leave yet.",
                "meaning_en": "win",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1070: {
        "secondary_glosses": ["both parties"],
        "notes": "Formal noun for the two sides involved in a discussion, agreement, dispute, or competition.",
        "examples": [
            {
                "sentence": "签字以前，双方先把合同内容看清楚。",
                "translation": "Before signing, both parties should first read the contract carefully.",
                "meaning_en": "both parties",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "为了这个计划，双方已经谈了很久，还没有最后决定。",
                "translation": "Both sides have been discussing this plan for a long time and still have not made a final decision.",
                "meaning_en": "both sides",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "比赛结束后，双方主动握手，大家也都安静下来了。",
                "translation": "After the match, both sides took the initiative to shake hands, and everyone calmed down.",
                "meaning_en": "both sides",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1273: {
        "primary_gloss": "slanted; tilted",
        "secondary_glosses": ["at an angle", "crooked"],
        "notes": "Used for lines, surfaces, incoming light, or objects that are not straight or level; it can also describe something leaning or tilted.",
        "examples": [
            {
                "sentence": "这条路有点斜，下雨的时候骑车要特别小心。",
                "translation": "This road slopes a bit, so you need to be especially careful riding on it when it rains.",
                "meaning_en": "slanted",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "下午的太阳斜照进来，墙上的照片一下就亮了。",
                "translation": "The afternoon sun shone in at an angle, and the photo on the wall lit up at once.",
                "meaning_en": "at an angle",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他把帽子戴得有点斜，看起来轻松多了。",
                "translation": "He wore his hat a little askew, and it made him look much more relaxed.",
                "meaning_en": "tilted",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1276: {
        "primary_gloss": "groom",
        "secondary_glosses": ["bridegroom"],
        "notes": "The man at a wedding; the standard counterpart to 新娘.",
        "examples": [
            {
                "sentence": "婚礼还没开始，新郎已经紧张得一直看时间了。",
                "translation": "The wedding had not even started yet, and the groom was already nervously checking the time.",
                "meaning_en": "groom",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "大家一看见新郎走进来，就一起鼓掌欢迎他。",
                "translation": "As soon as everyone saw the groom walk in, they all applauded to welcome him.",
                "meaning_en": "groom",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "新郎说完感谢大家的话以后，全场都笑了。",
                "translation": "After the groom finished thanking everyone, everyone in the room laughed.",
                "meaning_en": "groom",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1279: {
        "secondary_glosses": ["new employee", "newlyweds"],
        "notes": "Usually means someone new to a workplace, team, or field; in wedding contexts it refers to the bride and groom.",
        "examples": [
            {
                "sentence": "新人第一天上班，先有人带他熟悉办公室。",
                "translation": "On a newcomer's first day at work, someone first shows him around the office.",
                "meaning_en": "newcomer",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "公司最近来了不少新人，大家都主动帮他们。",
                "translation": "Several newcomers have joined the company recently, and everyone has been quick to help them.",
                "meaning_en": "newcomer",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "婚礼开始前，新人在门口笑着欢迎客人。",
                "translation": "Before the wedding began, the newlyweds stood at the entrance smiling and welcoming guests.",
                "meaning_en": "newlyweds",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1310: {
        "primary_gloss": "academic subject",
        "secondary_glosses": ["discipline", "field of study"],
        "notes": "Used both for a school subject and for a broader academic field.",
        "examples": [
            {
                "sentence": "这门学科不只要背知识，还要学会分析问题。",
                "translation": "This subject is not just about memorizing knowledge; you also have to learn how to analyze problems.",
                "meaning_en": "academic subject",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "学校今年增加了这门学科，很多学生都很期待。",
                "translation": "The school added this subject this year, and many students are really looking forward to it.",
                "meaning_en": "subject",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这个问题需要几个学科一起研究，不能只看一个方面。",
                "translation": "This problem needs several disciplines working together; you cannot look at only one aspect.",
                "meaning_en": "discipline",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1429: {
        "primary_gloss": "round",
        "secondary_glosses": ["circle", "circular"],
        "notes": "Usually describes a round shape; it can also name a geometric circle.",
        "examples": [
            {
                "sentence": "这张桌子是圆的，开会时大家围着坐更方便讨论。",
                "translation": "This table is round, so it is easier for everyone to sit around it and discuss things during meetings.",
                "meaning_en": "round",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "老师先在黑板上画了一个圆，再让我们找出它的中心。",
                "translation": "The teacher first drew a circle on the blackboard, then asked us to find its center.",
                "meaning_en": "circle",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "孩子最近胖了一点，脸看起来比以前更圆了。",
                "translation": "The child has put on a little weight recently, and their face looks rounder than before.",
                "meaning_en": "round",
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
