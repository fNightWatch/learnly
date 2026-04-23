import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-15.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass15"


REPAIRS = {
    832: {
        "primary_gloss": "bound form in words for kinds, products, or quality",
        "secondary_glosses": ["to savor"],
        "notes": "Usually not a free-standing noun in modern speech. It mostly appears inside compounds such as 品种, 品质, and 食品. As a verb, it means to taste or savor something slowly and attentively, especially tea.",
        "examples": [
            {
                "sentence": "这种水果的品种越来越多，年轻人也愿意试新的味道。",
                "translation": "There are more and more varieties of this fruit, and young people are also willing to try new flavors.",
                "meaning_en": "bound form in words for kinds / varieties",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "现在大家买东西的时候，不只看价格，也会看产品品质。",
                "translation": "Nowadays when people buy things, they do not just look at the price; they also look at product quality.",
                "meaning_en": "bound form in words for quality",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "晚上没有别的事的时候，他喜欢一个人安静地品茶。",
                "translation": "When he has nothing else to do in the evening, he likes to sit quietly by himself and savor tea.",
                "meaning_en": "to savor",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    837: {
        "secondary_glosses": ["even", "to lay or make flat"],
        "notes": "As an adjective, 平 describes something flat, level, or even. After verbs such as 放 or 弄, it often means to make or lay something flat.",
        "examples": [
            {
                "sentence": "这条路修好以后又宽又平，晚上开车也舒服多了。",
                "translation": "After this road was repaired, it became wide and level, and driving on it at night became much more comfortable.",
                "meaning_en": "flat; level",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "桌子不平，杯子放在上面总让人觉得不放心。",
                "translation": "The table is uneven, so putting a cup on it always makes people feel a little uneasy.",
                "meaning_en": "even",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她先把照片放平，再让我看看上面写了什么。",
                "translation": "She first laid the photo flat and then let me look at what was written on it.",
                "meaning_en": "to lay or make flat",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    839: {
        "primary_gloss": "on the basis of; with",
        "secondary_glosses": ["rely on", "by means of"],
        "notes": "Most often used before a noun to mark the basis, evidence, document, or means for doing something: 凭身份证, 凭经验, 凭结果. It can also mean to rely on something or someone.",
        "examples": [
            {
                "sentence": "不能只凭一次比赛的结果就说他没有能力。",
                "translation": "You cannot say he lacks ability just on the basis of the result of one competition.",
                "meaning_en": "on the basis of",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "你到了车站以后，可以凭身份证直接取票。",
                "translation": "After you get to the station, you can collect the ticket directly with your ID card.",
                "meaning_en": "with",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "年轻的时候，他一直凭自己的本事生活，不愿意麻烦别人。",
                "translation": "When he was young, he always lived by relying on his own abilities and was unwilling to trouble other people.",
                "meaning_en": "rely on",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    840: {
        "secondary_glosses": ["safe", "free from trouble"],
        "notes": "Describes being safe, unharmed, and free from mishap. It is very common in arrival updates and set wishes such as 一路平安.",
        "examples": [
            {
                "sentence": "看到孩子平安回到家，父母才真正放下心来。",
                "translation": "Only after seeing the child return home safe and sound did the parents truly relax.",
                "meaning_en": "safe and sound",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "只要家里人都平安，别的困难总能慢慢解决。",
                "translation": "As long as everyone in the family is safe, other difficulties can always be solved little by little.",
                "meaning_en": "safe",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "出门在外，大家最希望的还是一路平安。",
                "translation": "When away from home, what everyone hopes for most is still a safe journey.",
                "meaning_en": "safe and sound",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    845: {
        "secondary_glosses": ["on average", "divide evenly"],
        "notes": "Can describe an average level or number; before quantities it often means 'on average'; as a verb it can mean to divide something evenly.",
        "examples": [
            {
                "sentence": "这份调查显示，年轻人的平均工资这几年一直在增加。",
                "translation": "This survey shows that young people's average salary has kept rising over the past few years.",
                "meaning_en": "average",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这家饭店周末平均每天要接待几百位客人。",
                "translation": "On weekends, this restaurant serves several hundred guests a day on average.",
                "meaning_en": "on average",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "为了让大家都能接受，他们决定把总费用平均分给每个人。",
                "translation": "To make it acceptable to everyone, they decided to divide the total cost evenly among everyone.",
                "meaning_en": "divide evenly",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    852: {
        "primary_gloss": "all present; complete",
        "secondary_glosses": ["neat", "evenly aligned"],
        "notes": "Often appears in patterns like 到齐, 排齐, and 摆齐. It can mean that everyone or everything is all there, or that things are arranged in an even, neat line.",
        "examples": [
            {
                "sentence": "人到齐以后，会议才正式开始，负责人先说明了讨论重点。",
                "translation": "Once everyone had arrived, the meeting officially began, and the person in charge first explained the main discussion points.",
                "meaning_en": "all present; complete",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这几行字写得不够齐，看起来有点乱，最好再改一下。",
                "translation": "These lines are not written evenly enough; they look a bit messy, so it is best to fix them a little.",
                "meaning_en": "neat",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "拍照以前，老师让我们把椅子排齐，别挡住后面的人。",
                "translation": "Before taking the photo, the teacher told us to line the chairs up evenly so they would not block the people behind.",
                "meaning_en": "evenly aligned",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    855: {
        "secondary_glosses": ["the remaining", "the others"],
        "notes": "Refers to what remains after one part has already been singled out. It can stand alone or come before a noun such as 人, 时间, or 部分.",
        "examples": [
            {
                "sentence": "这部分内容今天必须完成，其余的可以留到明天再处理。",
                "translation": "This part has to be finished today; the rest can be left until tomorrow to deal with.",
                "meaning_en": "the rest",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "五个人里已经有两个人决定参加，其余的人还在考虑。",
                "translation": "Out of the five people, two have already decided to take part, and the others are still thinking it over.",
                "meaning_en": "the others",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "前半小时先介绍情况，其余时间留给大家提问和讨论。",
                "translation": "Use the first half hour to explain the situation, and leave the remaining time for questions and discussion.",
                "meaning_en": "the remaining",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    859: {
        "secondary_glosses": ["sign one's name", "approve by signing"],
        "notes": "Means to write your name or signature on a contract, form, or other document in order to confirm, approve, or agree.",
        "examples": [
            {
                "sentence": "合同的内容你最好先看清楚，再决定要不要签。",
                "translation": "You should read the contents of the contract carefully first, and then decide whether to sign it.",
                "meaning_en": "sign",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "材料都准备好了，只差负责人回来在最后一页签个字。",
                "translation": "Everything is ready; we are only waiting for the person in charge to come back and sign on the last page.",
                "meaning_en": "sign one's name",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "经理还没看过，这份申请现在还不能签，我们得先等他的意见。",
                "translation": "The manager has not looked at it yet, so this application cannot be signed for now; we need to wait for his opinion first.",
                "meaning_en": "approve by signing",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    865: {
        "secondary_glosses": ["future", "promising future"],
        "notes": "Talks about how promising a person's, job's, field's, or plan's future looks, often in evaluative phrases like 有前途 or 没前途.",
        "examples": [
            {
                "sentence": "这个行业虽然很辛苦，但是发展快，也很有前途。",
                "translation": "Although this industry is demanding, it is developing quickly and has very good future prospects.",
                "meaning_en": "future prospects",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "他不想只看眼前的工资，更想考虑这份工作的前途。",
                "translation": "He does not want to look only at the current salary; he wants to think more about this job's future prospects.",
                "meaning_en": "future prospects",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "家里人都支持他继续读下去，因为大家觉得他很有前途。",
                "translation": "His family all supports him continuing his studies, because everyone thinks he has a very promising future.",
                "meaning_en": "future",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    877: {
        "secondary_glosses": ["to slice", "to chop"],
        "notes": "Here it is the verb qiē: cutting something with a knife or blade, especially food, but also paper, medicine, and other materials.",
        "examples": [
            {
                "sentence": "做这个菜的时候，土豆不要切得太厚，不然不容易熟。",
                "translation": "When making this dish, do not cut the potatoes too thick, or they will not cook easily.",
                "meaning_en": "to cut",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "厨师先把肉切薄一点，再放进锅里炒。",
                "translation": "The chef first slices the meat a bit thinner, then puts it into the wok to stir-fry it.",
                "meaning_en": "to slice",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "开会前，他把纸切成一样大小，方便大家做记录。",
                "translation": "Before the meeting, he cut the paper into equal sizes so it would be easier for everyone to take notes.",
                "meaning_en": "to cut",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    930: {
        "secondary_glosses": [],
        "notes": "A paper or digital calendar used to check dates and write down plans, deadlines, or reminders.",
        "examples": [
            {
                "sentence": "我一看日历，才发现离考试只剩两个星期了。",
                "translation": "When I looked at the calendar, I realized there were only two weeks left before the exam.",
                "meaning_en": "calendar",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "办公室里的日历还停在上个月，难怪有人写错了日期。",
                "translation": "The calendar in the office is still on last month, so no wonder someone wrote the wrong date.",
                "meaning_en": "calendar",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "我怕自己记不住，就把出发日期写在日历上了。",
                "translation": "I was afraid I would not remember, so I wrote the departure date on the calendar.",
                "meaning_en": "calendar",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    931: {
        "secondary_glosses": ["everyday items"],
        "notes": "Things people use routinely in daily life, especially household or personal-use items rather than food or larger purchases.",
        "examples": [
            {
                "sentence": "这家超市的日用品不算便宜，但是质量一直比较稳定。",
                "translation": "The daily necessities at this supermarket are not exactly cheap, but the quality is consistently fairly stable.",
                "meaning_en": "daily necessities",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "旅行时间长的话，最好把需要的日用品提前带好。",
                "translation": "If the trip will be long, it is best to pack the daily necessities you need in advance.",
                "meaning_en": "daily necessities",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "公司给新来的员工准备了一些基本日用品。",
                "translation": "The company prepared some basic daily necessities for the new employees.",
                "meaning_en": "daily necessities",
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
