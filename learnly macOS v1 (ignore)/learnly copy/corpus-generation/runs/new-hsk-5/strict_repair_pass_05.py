import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-05.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass5"


REPAIRS = {
    1406: {
        "secondary_glosses": ["stamp"],
        "notes": "The stamp you stick on a letter or package before mailing it.",
        "examples": [
            {
                "sentence": "我把邮票贴好以后，就去邮局寄信了。",
                "translation": "After I put the stamp on, I went to the post office to mail the letter.",
                "meaning_en": "postage stamp",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "爷爷小时候喜欢收集外国邮票，家里现在还有很多。",
                "translation": "My grandfather liked collecting foreign stamps when he was young, and there are still many of them at home now.",
                "meaning_en": "postage stamp",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这封信没贴邮票，所以今天寄不出去。",
                "translation": "This letter does not have a stamp on it, so it cannot be mailed today.",
                "meaning_en": "postage stamp",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1431: {
        "secondary_glosses": ["January 1"],
        "notes": "In modern standard Chinese, 元旦 refers to January 1, not the Lunar New Year.",
        "examples": [
            {
                "sentence": "元旦放假那几天，很多商店都特别热闹。",
                "translation": "During the New Year's Day holiday, many shops are especially lively.",
                "meaning_en": "New Year's Day",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "公司准备在元旦晚上办一个小活动，大家都要参加。",
                "translation": "The company is preparing a small event for New Year's Day evening, and everyone is expected to attend.",
                "meaning_en": "New Year's Day",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "元旦早上，广场上很多人跑步，看起来特别热闹。",
                "translation": "On New Year's Day morning, lots of people were running in the square, and it looked especially lively.",
                "meaning_en": "New Year's Day",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1440: {
        "primary_gloss": "to transport; to ship",
        "secondary_glosses": ["transportation"],
        "notes": "Often used for moving goods, supplies, or materials; it can function as both a verb and a noun.",
        "examples": [
            {
                "sentence": "这些水果今天晚上要运输到外地的市场。",
                "translation": "These fruits need to be transported to an out-of-town market tonight.",
                "meaning_en": "transport",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "公司负责把药品运输到各地的医院。",
                "translation": "The company is responsible for transporting medicines to hospitals in many places.",
                "meaning_en": "transport",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "大雨以后，这条路上的运输没有以前那么方便了。",
                "translation": "After the heavy rain, transport on this road was no longer as convenient as before.",
                "meaning_en": "transportation",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1453: {
        "primary_gloss": "to build; to make",
        "secondary_glosses": ["to manufacture", "to create"],
        "notes": "Usually used for building or producing concrete things, and it is more specific than 做.",
        "examples": [
            {
                "sentence": "为了节省时间，他们决定在河上造一座桥。",
                "translation": "To save time, they decided to build a bridge over the river.",
                "meaning_en": "to build",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这个工厂去年开始造机器和小汽车。",
                "translation": "This factory started making machines and cars last year.",
                "meaning_en": "to manufacture",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这种木头不贵，也很适合造桌子。",
                "translation": "This kind of wood is not expensive and is also well suited for making tables.",
                "meaning_en": "to make",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1488: {
        "primary_gloss": "to compete for; to argue over",
        "secondary_glosses": ["to fight for"],
        "notes": "Used for actively trying to obtain something, or for disputing it with others.",
        "examples": [
            {
                "sentence": "为了争这个项目，两个公司都提前准备了材料。",
                "translation": "Both companies prepared their materials in advance to compete for this project.",
                "meaning_en": "to compete for",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "会议开了两个小时，大家还是在争谁来负责。",
                "translation": "The meeting lasted two hours, and everyone was still arguing over who should take responsibility.",
                "meaning_en": "to argue over",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这个机会只有一次，你不去争，很难再等到第二次。",
                "translation": "There is only one chance; if you do not fight for it, a second one may not come again.",
                "meaning_en": "to fight for",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1495: {
        "secondary_glosses": ["proof", "supporting evidence"],
        "notes": "Usually refers to facts, records, or documents used to support a conclusion or claim.",
        "examples": [
            {
                "sentence": "警察还在找证据，所以现在不能下结论。",
                "translation": "The police are still looking for evidence, so no conclusion can be made yet.",
                "meaning_en": "evidence",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "报告里的结论都要有证据，不能只看感觉。",
                "translation": "Every conclusion in the report needs evidence; it cannot rest on feeling alone.",
                "meaning_en": "supporting evidence",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这份合同可以作为证据，证明双方都同意了。",
                "translation": "This contract can serve as evidence showing that both sides agreed.",
                "meaning_en": "proof",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1508: {
        "primary_gloss": "to; until; up to (formal)",
        "secondary_glosses": ["to reach"],
        "notes": "Mostly a formal written word used to mark the end point of a time, place, or number range.",
        "examples": [
            {
                "sentence": "展览时间为周二至周日，周一休息。",
                "translation": "The exhibition is open from Tuesday to Sunday, with Monday closed.",
                "meaning_en": "to",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "调查对象是十八岁至三十岁的人。",
                "translation": "The survey targets people aged eighteen to thirty.",
                "meaning_en": "up to",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "会议从下午三点持续至五点，请大家提前到。",
                "translation": "The meeting will continue from 3 p.m. until 5 p.m., so please arrive early.",
                "meaning_en": "until",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1519: {
        "primary_gloss": "to produce",
        "secondary_glosses": ["to make", "to create"],
        "notes": "More formal and product-oriented than 做; used for media, products, and other finished outputs.",
        "examples": [
            {
                "sentence": "这个节目制作了半年，内容改了很多次。",
                "translation": "This program took half a year to produce, and its content was revised many times.",
                "meaning_en": "to produce",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "工厂已经开始制作新产品了，下个月就可以卖了。",
                "translation": "The factory has already started producing the new product, and it can be sold next month.",
                "meaning_en": "to produce",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "为了这次活动，我们自己制作了介绍视频。",
                "translation": "For this event, we produced the introductory video ourselves.",
                "meaning_en": "to make",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1539: {
        "notes": "The plant bamboo, used in nature, cultural, and everyday contexts.",
        "examples": [
            {
                "sentence": "这种竹子长得很快，两三年就能长到两层楼那么高。",
                "translation": "This kind of bamboo grows quickly and can reach the height of a two-story building in two or three years.",
                "meaning_en": "bamboo plant",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "很多人喜欢用竹子做家具，因为竹子又轻又结实。",
                "translation": "Many people like making furniture from bamboo because bamboo is both light and sturdy.",
                "meaning_en": "bamboo as material",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "下过雨以后，院子里的竹子看起来更绿了。",
                "translation": "After the rain, the bamboo in the yard looks even greener.",
                "meaning_en": "bamboo in a setting",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1543: {
        "secondary_glosses": ["based on personal feeling", "not fully objective"],
        "notes": "Describes a view or judgment based too much on personal feeling rather than objective facts.",
        "examples": [
            {
                "sentence": "只靠第一印象来评价别人，往往会很主观。",
                "translation": "If you judge other people only by first impressions, it will often be very subjective.",
                "meaning_en": "subjective evaluation",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "写报告时语言不能太主观，要尽量客观。",
                "translation": "When writing a report, the language should not be too subjective and should be as objective as possible.",
                "meaning_en": "subjective wording",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这个判断太主观，没有考虑全部情况。",
                "translation": "This judgment is too subjective and does not take the full situation into account.",
                "meaning_en": "subjective judgment",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1578: {
        "primary_gloss": "oneself; itself",
        "secondary_glosses": ["one's own"],
        "notes": "More formal than 自己; often used for a person, organization, or thing's own condition, problems, or qualities.",
        "examples": [
            {
                "sentence": "我们要先从自身找原因，不能只怪别人。",
                "translation": "We should first look for the reasons in ourselves instead of only blaming others.",
                "meaning_en": "one's own",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "公司正在解决自身的问题，不会影响正常工作。",
                "translation": "The company is solving its own problems, and that will not affect normal work.",
                "meaning_en": "one's own",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这种材料自身很轻，但是很结实。",
                "translation": "This material itself is very light, but it is very sturdy.",
                "meaning_en": "itself",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1594: {
        "secondary_glosses": ["mouth (everyday word)"],
        "notes": "Everyday spoken word; more conversational than 嘴.",
        "examples": [
            {
                "sentence": "医生看了看他的嘴巴，说没什么大问题。",
                "translation": "The doctor looked at his mouth and said there was no serious problem.",
                "meaning_en": "physical mouth",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她嘴巴很紧，公司的秘密从来不跟外面的人说。",
                "translation": "She is very tight-lipped and never tells people outside the company its secrets.",
                "meaning_en": "mouth for keeping secrets",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他想解释，可是张了张嘴巴，最后还是什么都没说。",
                "translation": "He wanted to explain, but after opening his mouth slightly, he still said nothing in the end.",
                "meaning_en": "mouth for speaking",
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
