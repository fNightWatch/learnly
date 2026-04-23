import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-20.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass20"


REPAIRS = {
    156: {
        "notes": "The flat measuring tool used to draw straight lines or measure length.",
        "examples": [
            {
                "sentence": "老师让我们用尺子把表格画整齐一点。",
                "translation": "The teacher told us to use a ruler to make the table lines neater.",
                "meaning_en": "ruler",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我把尺子放在书下面了，你先用我的吧。",
                "translation": "I put the ruler under the book, so use mine first.",
                "meaning_en": "ruler",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他拿尺子量了量桌子的宽度，才决定买不买。",
                "translation": "He measured the desk's width with a ruler before deciding whether to buy it.",
                "meaning_en": "ruler",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    217: {
        "primary_gloss": "ask around",
        "secondary_glosses": ["ask about", "find out by asking"],
        "notes": "Used when someone tries to get information by asking people, often about news, routes, prices, or someone's situation.",
        "examples": [
            {
                "sentence": "我想跟你打听一下，去火车站应该坐哪路车。",
                "translation": "I'd like to ask you which bus I should take to the train station.",
                "meaning_en": "ask around",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "为了找工作，他到处打听那家公司的情况。",
                "translation": "To find a job, he asked around everywhere about that company.",
                "meaning_en": "ask about",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这件事我已经替你打听清楚了，晚上再告诉你。",
                "translation": "I've already asked around and found out about it for you, and I'll tell you tonight.",
                "meaning_en": "find out by asking",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    375: {
        "notes": "To make an exact copy of a document, file, key, pattern, or successful model.",
        "examples": [
            {
                "sentence": "请把这份文件复制三份，开会的人都要看。",
                "translation": "Please make three copies of this document; everyone at the meeting needs to read it.",
                "meaning_en": "to copy",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这种钥匙不能自己复制，得去专门的店。",
                "translation": "You can't duplicate this kind of key yourself; you have to go to a specialized shop.",
                "meaning_en": "to duplicate",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "别人的成功经验可以参考，但很难完全复制。",
                "translation": "You can learn from other people's success, but it's hard to reproduce it completely.",
                "meaning_en": "to reproduce",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    466: {
        "secondary_glosses": ["hard work", "effort"],
        "notes": "Literal body sweat; also used figuratively for the effort behind an achievement.",
        "examples": [
            {
                "sentence": "跑完步以后，他的脸上已经全是汗水了。",
                "translation": "After his run, his face was already covered in sweat.",
                "meaning_en": "sweat",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她擦了擦脸上的汗水，又回去继续练了。",
                "translation": "She wiped the sweat from her face and went back to keep practicing.",
                "meaning_en": "sweat",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这份成绩的背后，是大家一点一点流下的汗水。",
                "translation": "Behind this result is the sweat everyone shed little by little.",
                "meaning_en": "hard work",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    657: {
        "secondary_glosses": ["keep an eye on", "watch over"],
        "notes": "Read kān here, not kàn. It means guarding or keeping watch over a person, thing, or place for a period of time.",
        "examples": [
            {
                "sentence": "你先帮我看着行李，我去窗口买票。",
                "translation": "Keep an eye on the luggage for me first; I'll go buy the tickets at the window.",
                "meaning_en": "keep an eye on",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "医生不在的时候，护士会先帮忙看着病人。",
                "translation": "When the doctor isn't around, the nurse will help watch over the patient first.",
                "meaning_en": "watch over",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "他出门前总会让我帮他看着店。",
                "translation": "Before going out, he always asks me to watch over the shop for him.",
                "meaning_en": "watch over",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    808: {
        "notes": "The continent Europe, used for the region as a whole in travel, study, culture, and business contexts.",
        "examples": [
            {
                "sentence": "他准备明年去欧洲读书，已经开始学语言了。",
                "translation": "He plans to go study in Europe next year and has already started learning the language.",
                "meaning_en": "Europe",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这家公司这几年一直在欧洲发展业务。",
                "translation": "This company has been expanding its business in Europe over the past few years.",
                "meaning_en": "Europe",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "欧洲很多城市的老建筑都保护得很好。",
                "translation": "Many cities in Europe have preserved their old buildings very well.",
                "meaning_en": "Europe",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    953: {
        "primary_gloss": "kind",
        "secondary_glosses": ["kind-hearted", "good-hearted"],
        "notes": "Describes someone whose nature is warm, caring, and morally good, not just polite on the surface.",
        "examples": [
            {
                "sentence": "那个老师很善良，对学生一直很有耐心。",
                "translation": "That teacher is very kind and has always been patient with the students.",
                "meaning_en": "kind",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他看起来有点严肃，其实心里很善良。",
                "translation": "He looks a little serious, but he's actually very kind-hearted inside.",
                "meaning_en": "kind-hearted",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "真正善良的人，不会只在别人面前做好事。",
                "translation": "A truly kind-hearted person doesn't do good things only when other people are watching.",
                "meaning_en": "kind-hearted",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    980: {
        "secondary_glosses": ["build", "body shape"],
        "notes": "Refers to someone's overall body build or figure, especially when talking about appearance, fitness, or how clothes fit.",
        "examples": [
            {
                "sentence": "她平时很注意饮食，所以一直保持着不错的身材。",
                "translation": "She pays close attention to her diet, so she has kept a good figure.",
                "meaning_en": "figure",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这件裙子很适合她的身材，穿上以后很自然。",
                "translation": "This dress suits her figure well, and it looks natural on her.",
                "meaning_en": "figure",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "坚持运动以后，他的身材比以前结实多了。",
                "translation": "After sticking with exercise, his build is much sturdier than before.",
                "meaning_en": "build",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1010: {
        "secondary_glosses": ["time-zone difference", "jet lag"],
        "notes": "Usually means the time gap between places in different time zones; in everyday use it can also mean the body-clock discomfort after long-distance travel.",
        "examples": [
            {
                "sentence": "这两个地方时差很大，开会前得先把时间算好。",
                "translation": "There is a big time-zone difference between these two places, so you need to work out the time before the meeting.",
                "meaning_en": "time-zone difference",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我刚到国外，时差还没倒过来，晚上一点也不困。",
                "translation": "I just arrived abroad and still haven't adjusted to the jet lag, so I'm not sleepy at all at night.",
                "meaning_en": "jet lag",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "跟国外的同事联系时，要先看时差，不然容易打扰别人休息。",
                "translation": "When contacting coworkers abroad, you should check the time difference first, or you may disturb them while they're resting.",
                "meaning_en": "time-zone difference",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1169: {
        "secondary_glosses": ["outward look", "exterior"],
        "notes": "The visible outside look of something, especially a product, object, or building, rather than what it is like inside.",
        "examples": [
            {
                "sentence": "买手机的时候，很多人先看外观，再看功能和价格。",
                "translation": "When buying a phone, many people look at the appearance first, then the features and price.",
                "meaning_en": "appearance",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这两辆车外观差不多，用起来很不一样。",
                "translation": "These two cars have a similar exterior, but they feel very different to use.",
                "meaning_en": "exterior",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这套家具外观简单，放在客厅里反而更好看。",
                "translation": "This set of furniture has a simple appearance, and it actually looks better in the living room.",
                "meaning_en": "appearance",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1172: {
        "primary_gloss": "curved; winding",
        "secondary_glosses": ["to bend", "a bend; a turn"],
        "notes": "As an adjective it describes something that is not straight; as a verb it means to bend something or bend your body; as a noun it means a bend in a road, river, or path.",
        "examples": [
            {
                "sentence": "这条路特别弯，下雨的时候开车更要小心。",
                "translation": "This road is especially winding, so you need to drive even more carefully when it rains.",
                "meaning_en": "curved; winding",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他把纸轻轻弯了一下，放进了口袋里。",
                "translation": "He bent the paper slightly and put it into his pocket.",
                "meaning_en": "to bend",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "过了前面那个弯，手机就没有信号了。",
                "translation": "Once you get past the bend ahead, your phone won't have any signal.",
                "meaning_en": "a bend; a turn",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1188: {
        "notes": "A piece of clothing worn around the neck for warmth, and sometimes also as part of how someone is dressed.",
        "examples": [
            {
                "sentence": "天冷了，出门前记得戴上围巾，不然很容易感冒。",
                "translation": "It's cold, so remember to put on a scarf before you go out, or you'll easily catch a cold.",
                "meaning_en": "scarf",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这条围巾虽然不贵，可是跟那件大衣很配。",
                "translation": "This scarf isn't expensive, but it goes very well with that coat.",
                "meaning_en": "scarf",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她把红色的围巾借给我，说晚上回去再还也来得及。",
                "translation": "She lent me her red scarf and said it would still be fine to return it tonight.",
                "meaning_en": "scarf",
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
