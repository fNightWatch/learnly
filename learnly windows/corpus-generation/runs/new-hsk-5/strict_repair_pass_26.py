import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-26.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass26"


REPAIRS = {
    73: {
        "secondary_glosses": ["bad for", "disadvantageous"],
        "notes": "Usually appears in the pattern 对...不利 and means unfavorable to a person, plan, negotiation, application, or recovery.",
        "examples": [
            {
                "sentence": "现在公开这个消息，对双方接下来的谈判很不利。",
                "translation": "Releasing this news now would be very unfavorable to the negotiations that follow between the two sides.",
                "meaning_en": "unfavorable",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "证据准备得不够完整，对我们后面的申请很不利。",
                "translation": "The evidence was not prepared thoroughly enough, which is very disadvantageous for our later application.",
                "meaning_en": "disadvantageous",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "连续几天熬夜加班，对身体恢复非常不利。",
                "translation": "Staying up late and working overtime for several days in a row is very bad for physical recovery.",
                "meaning_en": "bad for",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    90: {
        "primary_gloss": "food service",
        "secondary_glosses": ["catering", "food and beverage service"],
        "notes": "A collective noun for the business or service of food and drink, often seen in phrases like 餐饮行业, 餐饮店, and 餐饮服务. It is broader and more business-oriented than just referring to a meal.",
        "examples": [
            {
                "sentence": "这家酒店的餐饮服务一直不错，很多客人都会再来。",
                "translation": "This hotel's food service has consistently been good, so many guests come back again.",
                "meaning_en": "food service",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "他毕业以后一直在餐饮行业工作，现在已经自己开店了。",
                "translation": "Since graduating, he has been working in the food-service industry, and now he has opened his own shop.",
                "meaning_en": "catering",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这条街这两年餐饮店越来越多，晚上特别热闹。",
                "translation": "Over the past two years, more and more food-service shops have opened on this street, so it gets especially lively at night.",
                "meaning_en": "food and beverage service",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    212: {
        "primary_gloss": "reach",
        "secondary_glosses": ["achieve", "arrive at"],
        "notes": "A relatively formal verb used for reaching an agreement, goal, or consensus. Common objects include 协议, 目标, and 一致.",
        "examples": [
            {
                "sentence": "双方谈了两个多小时，最后终于达成了协议。",
                "translation": "After talking for more than two hours, the two sides finally reached an agreement.",
                "meaning_en": "reach",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "经过几个月的努力，我们总算达成了年初定下的目标。",
                "translation": "After several months of effort, we finally achieved the goal set at the beginning of the year.",
                "meaning_en": "achieve",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "大家都希望尽快达成一致，这样工作才能继续。",
                "translation": "Everyone hopes to arrive at a consensus as soon as possible so that the work can continue.",
                "meaning_en": "arrive at",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    239: {
        "primary_gloss": "separately",
        "secondary_glosses": ["alone", "by oneself"],
        "notes": "Used before a verb to mean either by oneself without others, or separately from the group. Common in contexts like 单独谈, 单独说明, and 单独出门.",
        "examples": [
            {
                "sentence": "这个问题比较复杂，我们下午找个时间单独谈一谈。",
                "translation": "This issue is fairly complicated, so let's find some time this afternoon to talk about it separately.",
                "meaning_en": "separately",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "经理先把我单独叫进去，问了几个细节问题。",
                "translation": "The manager called me in separately first and asked a few detailed questions.",
                "meaning_en": "separately",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "孩子还太小，晚上不能单独坐车回家。",
                "translation": "The child is still too young to ride home alone at night.",
                "meaning_en": "alone",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    446: {
        "primary_gloss": "what is your surname? (polite)",
        "secondary_glosses": ["may I ask your surname?"],
        "notes": "A fixed respectful expression for asking someone's family name. It is mainly used in polite introductions and reported polite speech, not as an ordinary noun phrase by itself.",
        "examples": [
            {
                "sentence": "一见面，他就客气地问我：“请问您贵姓？”",
                "translation": "As soon as we met, he politely asked me, \"May I ask your surname?\"",
                "meaning_en": "may I ask your surname?",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "刚见面的时候，对方先问我贵姓，再把名片递过来。",
                "translation": "When we had just met, the other person first asked my surname politely and then handed over a business card.",
                "meaning_en": "what is your surname? (polite)",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "她先笑着问那位老师贵姓，再介绍自己。",
                "translation": "She first smiled and politely asked the teacher's surname, then introduced herself.",
                "meaning_en": "what is your surname? (polite)",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    468: {
        "secondary_glosses": ["professional field", "line of work"],
        "notes": "A whole business or professional field, not just one company or one specific job. It is commonly used when talking about trends, work experience, or entering a field.",
        "examples": [
            {
                "sentence": "这几年这个行业变化特别快，不学习就容易跟不上。",
                "translation": "This industry has been changing especially fast in recent years, and if you do not keep learning, it is easy to fall behind.",
                "meaning_en": "industry",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "她毕业后一直在教育行业工作，对这个行业很有感情。",
                "translation": "Since graduating, she has worked in the education field and feels strongly attached to the industry.",
                "meaning_en": "professional field",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "在这个行业里，经验重要，态度也一样重要。",
                "translation": "In this line of work, experience matters, but attitude matters just as much.",
                "meaning_en": "line of work",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    661: {
        "primary_gloss": "approach",
        "secondary_glosses": ["get close to", "be near"],
        "notes": "Can describe moving nearer to a person, place, or thing, and it can also describe one place being near another. The key idea is reduced distance.",
        "examples": [
            {
                "sentence": "请不要靠近那台机器，工作人员还在检查。",
                "translation": "Please do not approach that machine; the staff are still inspecting it.",
                "meaning_en": "approach",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "听见外面有声音，他慢慢靠近门口看了一眼。",
                "translation": "Hearing a sound outside, he slowly moved closer to the doorway and took a look.",
                "meaning_en": "get close to",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "我们订的酒店很靠近地铁站，出门确实方便很多。",
                "translation": "The hotel we booked is very near the subway station, so going out is indeed much more convenient.",
                "meaning_en": "be near",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    668: {
        "secondary_glosses": ["customer support", "customer service staff"],
        "notes": "A modern short form usually referring to customer service staff or the customer service department, especially in phone, online, shopping, and after-sales contexts.",
        "examples": [
            {
                "sentence": "这个问题我自己解决不了，只能再联系一下客服。",
                "translation": "I cannot solve this problem myself, so I can only contact customer service again.",
                "meaning_en": "customer service",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "客服已经帮我登记了情况，说两个工作日内会回复。",
                "translation": "Customer service has already recorded the situation for me and said they will reply within two working days.",
                "meaning_en": "customer service staff",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "我给客服打了好几次电话，才把退货的事说清楚。",
                "translation": "I called customer support several times before I finally explained the return issue clearly.",
                "meaning_en": "customer support",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    912: {
        "primary_gloss": "go around; detour",
        "secondary_glosses": ["wind around", "wrap around"],
        "notes": "Used when you avoid going straight by taking a route around something. It can also describe a road, river, or path winding around a place, or one thing being wrapped around another.",
        "examples": [
            {
                "sentence": "前面在修路，我们得从后面绕过去，不然上班就要迟到了。",
                "translation": "The road ahead is under repair, so we have to go around from the back or we'll be late for work.",
                "meaning_en": "go around",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这条路绕着湖往前走，天气好的时候风景特别不错。",
                "translation": "This road winds around the lake, and the view is especially nice when the weather is good.",
                "meaning_en": "wind around",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "她把线绕在手上，拿起来的时候方便一点。",
                "translation": "She wrapped the cord around her hand so it would be easier to carry.",
                "meaning_en": "wrap around",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1123: {
        "primary_gloss": "in someone's place; for",
        "secondary_glosses": ["on someone's behalf", "replace"],
        "notes": "Usually used before a person to mean doing something instead of them, for them, or on their behalf. It is very common in favors, work arrangements, and spoken requests.",
        "examples": [
            {
                "sentence": "今天下午我要去医院，所以请你替我去开会。",
                "translation": "I have to go to the hospital this afternoon, so please attend the meeting for me.",
                "meaning_en": "in someone's place",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "麻烦你替我向大家解释一下，我可能会晚到一会儿。",
                "translation": "Please explain it to everyone on my behalf; I may arrive a little late.",
                "meaning_en": "on someone's behalf",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "没有人能替你做这个决定，最后还是得你自己想清楚。",
                "translation": "No one can make this decision for you; in the end, you still have to think it through yourself.",
                "meaning_en": "for",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1126: {
        "primary_gloss": "fill out",
        "secondary_glosses": ["fill in", "write in"],
        "notes": "Most often used for entering information into a form, blank, or document. It can also mean putting something into an empty space.",
        "examples": [
            {
                "sentence": "请先把这张表填完整，特别是后面的联系地址。",
                "translation": "Please fill out this form completely first, especially the contact address at the end.",
                "meaning_en": "fill out",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "日期和地址都别填错，不然对方没法联系你。",
                "translation": "Make sure you don't write in the date or address incorrectly, or they won't be able to contact you.",
                "meaning_en": "write in",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这份材料还有两处没填，交以前最好再检查一遍。",
                "translation": "There are still two places left unfilled in this document, so it's best to check it once more before handing it in.",
                "meaning_en": "fill in",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1187: {
        "primary_gloss": "violate",
        "secondary_glosses": ["go against", "break a rule or law"],
        "notes": "Used for rules, laws, agreements, principles, and other standards that should not be broken or acted against.",
        "examples": [
            {
                "sentence": "为了省一点时间就违反规定，出了事谁也负责不了。",
                "translation": "If you violate the rules just to save a little time, no one will be able to take responsibility if something goes wrong.",
                "meaning_en": "violate",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "他不愿意为了赚钱违反原则，所以最后拒绝了那份工作。",
                "translation": "He wasn't willing to go against his principles just to make money, so he turned down the job in the end.",
                "meaning_en": "go against",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "公司再着急，也不能为了赶进度违反法律。",
                "translation": "No matter how urgent things are, a company still cannot break the law just to speed up progress.",
                "meaning_en": "break a rule or law",
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
