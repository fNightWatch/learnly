import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-07.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass7"


REPAIRS = {
    171: {
        "primary_gloss": "to publish; to come out in print",
        "examples": [
            {
                "sentence": "这本小说下个月正式出版。",
                "translation": "This novel will be officially published next month.",
                "meaning_en": "publish",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这套教材去年已经出版了。",
                "translation": "This set of textbooks was already published last year.",
                "meaning_en": "publish",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这本杂志每个月出版一次。",
                "translation": "This magazine is published once a month.",
                "meaning_en": "come out in print",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    188: {
        "examples": [
            {
                "sentence": "她把钥匙放在窗台上了。",
                "translation": "She put the keys on the windowsill.",
                "meaning_en": "windowsill",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "雨太大了，窗台上有很多水。",
                "translation": "The rain is so heavy that there is a lot of water on the windowsill.",
                "meaning_en": "windowsill",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这个窗台太窄，不能放台灯。",
                "translation": "This windowsill is too narrow to put a lamp on.",
                "meaning_en": "windowsill",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    216: {
        "primary_gloss": "to break; to break through",
        "secondary_glosses": ["to shatter", "to break a record"],
        "notes": "Also used for abstract things such as records, silence, calm, or old limits.",
        "examples": [
            {
                "sentence": "他把杯子打破了。",
                "translation": "He broke the cup.",
                "meaning_en": "break something",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她在比赛中打破了学校的纪录。",
                "translation": "She broke the school record in the competition.",
                "meaning_en": "break a record",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这个消息打破了这里的平静。",
                "translation": "This news broke the calm here.",
                "meaning_en": "break calm",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    463: {
        "primary_gloss": "to contain; to include",
        "secondary_glosses": ["to imply", "to hold in the mouth"],
        "notes": "Often more written or formal when it means contain or include.",
        "examples": [
            {
                "sentence": "这种水果含很多水分。",
                "translation": "This fruit contains a lot of water.",
                "meaning_en": "contain",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这句话含两层意思。",
                "translation": "This sentence has two layers of meaning.",
                "meaning_en": "imply",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她嘴里含着一块糖。",
                "translation": "She has a piece of candy in her mouth.",
                "meaning_en": "hold in the mouth",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    673: {
        "primary_gloss": "to control; to keep under control",
        "secondary_glosses": ["to hold back"],
        "notes": "Often used with abstract objects like 情绪, 病情, and 场面, and very commonly in 控制住 and 控制不住 patterns.",
        "examples": [
            {
                "sentence": "开会前，他先喝了点水，想控制一下自己的情绪。",
                "translation": "Before the meeting, he drank some water first, trying to get his emotions under control.",
                "meaning_en": "to control one's emotions",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "医生说，只要按时吃药，就能把病情控制住。",
                "translation": "The doctor said that as long as the medicine is taken on time, the illness can be kept under control.",
                "meaning_en": "to keep an illness under control",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "现在情况很乱，我们已经控制不住场面了。",
                "translation": "The situation is chaotic now, and we can no longer keep things under control.",
                "meaning_en": "to keep a situation under control",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    677: {
        "primary_gloss": "wide; broad",
        "secondary_glosses": ["loose"],
        "notes": "Keep the row on the adjective sense, but note that 宽 also appears naturally in measure patterns like 三十米宽.",
        "examples": [
            {
                "sentence": "新修的路更宽了，早上开车没有那么挤。",
                "translation": "The newly rebuilt road is wider now, so driving in the morning is not as crowded.",
                "meaning_en": "wide",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这条河有三十米宽，雨后更不好过。",
                "translation": "This river is thirty meters wide, and it is even harder to get across after rain.",
                "meaning_en": "wide",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这件外套有点宽，我想换小一点的。",
                "translation": "This coat is a bit loose, so I want to get a smaller one.",
                "meaning_en": "loose",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1006: {
        "primary_gloss": "to suffer from insomnia",
        "secondary_glosses": ["to be unable to sleep"],
        "notes": "Can describe either a recurring sleep problem or a single sleepless night.",
        "examples": [
            {
                "sentence": "最近工作压力大，他常常失眠。",
                "translation": "Lately, work pressure has been high, and he often suffers from insomnia.",
                "meaning_en": "to suffer from insomnia",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "想到明天的面试，她紧张得失眠了。",
                "translation": "Thinking about tomorrow's interview made her so nervous that she could not sleep.",
                "meaning_en": "to be unable to sleep",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "她失眠了一个晚上，第二天很没精神。",
                "translation": "She could not sleep for the whole night and had no energy the next day.",
                "meaning_en": "to be unable to sleep",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1198: {
        "primary_gloss": "position; location",
        "secondary_glosses": ["seat", "place"],
        "notes": "Useful for assigned seats, object placement, and map or location reference.",
        "examples": [
            {
                "sentence": "这个位置离门太近，冬天会有点冷。",
                "translation": "This seat is too close to the door, so it gets a bit cold in winter.",
                "meaning_en": "seat",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "你把花放错位置了，应该放在窗边。",
                "translation": "You put the flowers in the wrong place; they should be by the window.",
                "meaning_en": "place",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "我在地图上找到了这家店的位置。",
                "translation": "I found this shop's location on the map.",
                "meaning_en": "location",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1283: {
        "examples": [
            {
                "sentence": "请把地址和姓名都写清楚，再把信放进信封里。",
                "translation": "Write the address and name clearly, then put the letter into the envelope.",
                "meaning_en": "envelope",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这个信封里装的是申请表和照片。",
                "translation": "This envelope contains an application form and photos.",
                "meaning_en": "envelope",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "信封上只写了名字，没有写地址。",
                "translation": "Only the name was written on the envelope; the address was not.",
                "meaning_en": "envelope",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1425: {
        "primary_gloss": "to estimate; to expect",
        "secondary_glosses": ["to forecast"],
        "notes": "Used for fairly objective predictions about time, quantity, or results.",
        "examples": [
            {
                "sentence": "按现在的速度，工程预计年底完成。",
                "translation": "At the current pace, the project is expected to be completed by the end of the year.",
                "meaning_en": "to estimate",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "医生预计他休息两周就能上班。",
                "translation": "The doctor expects that he will be able to go back to work after two weeks of rest.",
                "meaning_en": "to expect",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "专家预计今年游客会继续增加。",
                "translation": "Experts predict that the number of tourists will continue to rise this year.",
                "meaning_en": "to forecast",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1447: {
        "primary_gloss": "to approve of; to support",
        "secondary_glosses": ["to agree with"],
        "notes": "Commonly used for approving a plan, opinion, or request.",
        "examples": [
            {
                "sentence": "我不太赞成现在就做决定。",
                "translation": "I do not really support making a decision right now.",
                "meaning_en": "to support",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "公司最后赞成了他的请求。",
                "translation": "The company finally approved his request.",
                "meaning_en": "to approve of",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "虽然有人反对，但多数人还是赞成这个计划。",
                "translation": "Although some people objected, most people still supported this plan.",
                "meaning_en": "to support",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1460: {
        "primary_gloss": "to fry; to deep-fry",
        "notes": "Here 炸 is read zha and means cooking in hot oil, not zha meaning to explode.",
        "examples": [
            {
                "sentence": "这家店的鱼都是刚炸的，所以特别香。",
                "translation": "The fish at this shop is freshly fried, so it smells especially good.",
                "meaning_en": "to fry",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "花生先炸一下，再放盐更好吃。",
                "translation": "Fry the peanuts briefly first, then add salt; they will taste better.",
                "meaning_en": "to fry",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "油太热的时候炸东西，要小心一点。",
                "translation": "Be a little careful when frying food if the oil gets too hot.",
                "meaning_en": "to fry",
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
