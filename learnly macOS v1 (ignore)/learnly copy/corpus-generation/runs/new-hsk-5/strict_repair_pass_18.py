import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-18.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass18"


REPAIRS = {
    164: {
        "primary_gloss": "repeat; say again",
        "secondary_glosses": ["do again"],
        "notes": "Used when you say, write, or do the same thing another time; it can also describe repeating the same point unnecessarily.",
        "examples": [
            {
                "sentence": "老师怕大家没听清楚，又把考试要求重复了一遍。",
                "translation": "The teacher was worried that not everyone had heard clearly, so she repeated the exam instructions once more.",
                "meaning_en": "repeat",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这个问题我已经解释过很多次了，今天不想再重复了。",
                "translation": "I have already explained this issue many times, and I do not want to repeat it again today.",
                "meaning_en": "repeat",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "写报告的时候，最好先检查一下，别把同样的内容重复两次。",
                "translation": "When writing a report, it is best to check first so that you do not repeat the same content twice.",
                "meaning_en": "repeat",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    183: {
        "primary_gloss": "pass; pass on",
        "secondary_glosses": ["spread"],
        "notes": "A common everyday verb for passing something to another person, relaying a message, or saying that news spreads from person to person.",
        "examples": [
            {
                "sentence": "上课的时候，请把这张纸往后传，让后面的同学也看一下。",
                "translation": "During class, please pass this sheet backward so the students in the back can look at it too.",
                "meaning_en": "pass",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我不在办公室的时候，如果经理找我，麻烦你先把消息传给我。",
                "translation": "If the manager looks for me while I am out of the office, please pass the message on to me first.",
                "meaning_en": "pass on",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这件事不知道是谁先说出去的，一个下午就传开了，全公司都知道了。",
                "translation": "No one knows who let this matter out first, but it spread through the whole company in one afternoon.",
                "meaning_en": "spread",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    185: {
        "secondary_glosses": ["convey", "transmit"],
        "notes": "More formal than 传; used for passing along notices, conveying feelings or ideas, and transmitting sound or information.",
        "examples": [
            {
                "sentence": "请把这份通知继续传递下去，让每个人都知道明天几点开会。",
                "translation": "Please keep passing this notice along so that everyone knows what time tomorrow's meeting starts.",
                "meaning_en": "pass on",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "说话的语气也会传递感情，所以同样的话听起来可能完全不一样。",
                "translation": "A person's tone of voice also conveys emotion, so the same words can sound completely different.",
                "meaning_en": "convey",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "电话虽然看不见对方，但是可以及时传递声音和信息。",
                "translation": "Although you cannot see the other person on the phone, it can still transmit sound and information immediately.",
                "meaning_en": "transmit",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    207: {
        "primary_gloss": "urge; hurry",
        "secondary_glosses": ["press"],
        "notes": "Used when someone keeps telling another person to act sooner, move faster, or stop delaying something.",
        "examples": [
            {
                "sentence": "早上我还没吃完早饭，妈妈就在门口一直催我快一点。",
                "translation": "I had not even finished breakfast when my mom was already at the door urging me to hurry up.",
                "meaning_en": "urge",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这份报告客户已经催了好几次，你今天最好先把它写完。",
                "translation": "The client has already pressed for this report several times, so you should finish writing it today first.",
                "meaning_en": "press",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "电影快开始了，门口的人一直催大家快点进去。",
                "translation": "The movie was about to start, and the people at the entrance kept hurrying everyone inside.",
                "meaning_en": "hurry",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    315: {
        "notes": "The square code that a phone can scan for payment, entry, menus, and similar digital tasks.",
        "examples": [
            {
                "sentence": "请把二维码给我看一下，我也想发给朋友。",
                "translation": "Please show me the QR code. I want to send it to a friend too.",
                "meaning_en": "QR code",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我已经把活动的二维码发给你了，你到了以后直接给门口的人看就可以进去。",
                "translation": "I've already sent you the event QR code, so when you arrive, just show it to the person at the door and you can go in.",
                "meaning_en": "QR code",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "现在很多店都用二维码点菜。",
                "translation": "Many restaurants now use QR codes for ordering.",
                "meaning_en": "QR code",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    359: {
        "secondary_glosses": ["distinctive style", "way of doing things"],
        "notes": "The recognizable style of a person, piece of writing, room, shop, film, or other work; it can also mean someone's characteristic way of speaking, teaching, or working.",
        "examples": [
            {
                "sentence": "这位导演的风格很明显，就算不看名字，很多人也能猜到是他的电影。",
                "translation": "This director's style is so recognizable that many people can tell it is his film even without seeing the name.",
                "meaning_en": "style",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "她很喜欢这种简单的风格，所以一下就决定买了。",
                "translation": "She really liked this simple style, so she decided to buy it right away.",
                "meaning_en": "style",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他上课的风格一直很直接，先说重点，再用几个简单的例子说明。",
                "translation": "His teaching style has always been very direct: he gives the main point first, then explains it with a few simple examples.",
                "meaning_en": "way of doing things",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    552: {
        "notes": "Electrical appliances used at home, especially everyday items such as refrigerators, washing machines, TVs, and air conditioners.",
        "examples": [
            {
                "sentence": "这家店卖各种家电，所以周末人特别多。",
                "translation": "This shop sells all kinds of household appliances, so it gets especially crowded on weekends.",
                "meaning_en": "household appliances",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "商场打折时，我们买了不少家电。",
                "translation": "When the mall had a sale, we bought quite a few home appliances.",
                "meaning_en": "home appliances",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这些旧家电虽然还能用，但是声音太大，也比新的更费电。",
                "translation": "These old household appliances still work, but they are too noisy and use more electricity than new ones.",
                "meaning_en": "household appliances",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    670: {
        "secondary_glosses": ["customer", "business customer"],
        "notes": "A client or business customer, especially in company, sales, service, or professional work.",
        "examples": [
            {
                "sentence": "这家公司不少老客户都跟了很多年，所以大家很重视每一次合作。",
                "translation": "Many of this company's longtime clients have stayed with them for years, so the team takes every collaboration seriously.",
                "meaning_en": "client",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "出了问题以后，我们先给客户打电话说明情况，再一起商量怎么解决。",
                "translation": "After a problem came up, we first called the client to explain the situation, then discussed how to solve it together.",
                "meaning_en": "client",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "这位客户对最后的结果很满意，看完方案以后马上决定继续合作。",
                "translation": "This client was very satisfied with the final result and decided to keep working with us as soon as they finished reviewing the plan.",
                "meaning_en": "business customer",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    951: {
        "notes": "A mountainous area or region; often used when talking about transport, schooling, medical care, and daily life in places that are harder to reach.",
        "examples": [
            {
                "sentence": "这条路现在已经通到西南的山区了。",
                "translation": "This road now reaches the mountain area in the southwest.",
                "meaning_en": "mountain area",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "很多山区的孩子每天都要走很远的路去上学，所以家长特别希望学校能离家近一点。",
                "translation": "Many children in mountain areas have to walk a long way to school every day, so parents especially hope the school can be a little closer to home.",
                "meaning_en": "mountain area",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "医院每年都会安排医生去山区做检查，希望当地人有问题时能早点发现、早点治疗。",
                "translation": "Every year the hospital arranges for doctors to go to mountain regions and do checkups, hoping local people can discover problems early and get treatment sooner.",
                "meaning_en": "mountain region",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    962: {
        "primary_gloss": "admire; enjoy",
        "secondary_glosses": ["reward"],
        "notes": "Common in set phrases like 赏月, 赏花, and 赏景 for enjoying beautiful things; the 'reward' sense is more formal.",
        "examples": [
            {
                "sentence": "晚上大家一起赏月。",
                "translation": "In the evening, everyone admired the moon together.",
                "meaning_en": "admire",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "春天一到，这条路两边的花就开了，很多人周末专门来这里赏花、拍照。",
                "translation": "As soon as spring arrives, the flowers on both sides of this road bloom, and many people come here on weekends especially to enjoy the flowers and take pictures.",
                "meaning_en": "enjoy",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "老板看他连续几天加班把工作做完了，就赏了他三天假，让他回家好好休息。",
                "translation": "Seeing that he had worked overtime for several days and finished the job, the boss rewarded him with three days off so he could go home and rest well.",
                "meaning_en": "reward",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    965: {
        "secondary_glosses": ["approximately", "from top to bottom"],
        "notes": "Can refer to upper and lower parts or floors; after a number it means approximately; in phrases like 公司上下, it means everyone from top to bottom.",
        "examples": [
            {
                "sentence": "这个柜子分上下两层，上面放书，下面放文件，这样找起来比较方便。",
                "translation": "This cabinet is divided into an upper and a lower shelf: books go on top and documents below, which makes things easier to find.",
                "meaning_en": "top and bottom",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这件外套的价格在五百块上下，对学生来说还是稍微有一点贵。",
                "translation": "The price of this coat is around five hundred yuan, which is still a little expensive for students.",
                "meaning_en": "approximately",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "新消息一公布，公司上下都开始准备，希望这次合作能顺利进行。",
                "translation": "As soon as the new announcement was made, everyone in the company began preparing, hoping this cooperation would go smoothly.",
                "meaning_en": "from top to bottom",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    982: {
        "notes": "Refers to who someone is, their social status, or the role or capacity in which they act; often used in patterns like 以...的身份.",
        "examples": [
            {
                "sentence": "进门以前，工作人员先看了大家的证件，确认每个人的身份。",
                "translation": "Before letting people in, the staff first checked everyone's documents to confirm each person's identity.",
                "meaning_en": "identity",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "他一直没有公开自己的真实身份，因为不想让别人特别照顾他。",
                "translation": "He has never made his real identity public because he does not want others to treat him differently.",
                "meaning_en": "identity",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "她这次是以记者的身份来采访的，所以问的问题都特别细。",
                "translation": "This time she came to interview people in the role of a journalist, so all of her questions were especially detailed.",
                "meaning_en": "role",
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
