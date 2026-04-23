import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-06.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-22-pass6"


REPAIRS = {
    161: {
        "primary_gloss": "be full of; be filled with",
        "notes": "Often used for space, atmosphere, or inner feelings.",
        "examples": [
            {
                "sentence": "房间里充满了花香。",
                "translation": "The room was filled with the scent of flowers.",
                "meaning_en": "be filled with",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她对未来充满希望。",
                "translation": "She is full of hope for the future.",
                "meaning_en": "be full of",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "比赛开始前，大家都充满信心。",
                "translation": "Before the competition started, everyone was full of confidence.",
                "meaning_en": "be full of",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    168: {
        "primary_gloss": "ugly; unattractive",
        "secondary_glosses": ["shameful"],
        "notes": "Can describe appearance directly or, figuratively, behavior.",
        "examples": [
            {
                "sentence": "这件衣服太丑了，我不想买。",
                "translation": "This piece of clothing is too ugly, so I do not want to buy it.",
                "meaning_en": "ugly",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他的字写得很丑，别人看不懂。",
                "translation": "His handwriting is so ugly that other people cannot read it.",
                "meaning_en": "ugly",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "为了赢，他说假话，真丑。",
                "translation": "He lied just to win; that was really shameful.",
                "meaning_en": "shameful",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    175: {
        "primary_gloss": "to sell; to put up for sale",
        "secondary_glosses": ["to go on sale", "offer for sale"],
        "notes": "More formal than 卖; common in notices, listings, and business contexts.",
        "examples": [
            {
                "sentence": "这些票明天上午九点正式出售。",
                "translation": "These tickets will officially go on sale at nine o'clock tomorrow morning.",
                "meaning_en": "to go on sale",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "网上有人低价出售二手电脑。",
                "translation": "Someone online is selling used computers at a low price.",
                "meaning_en": "to sell",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他打算出售那套老房子。",
                "translation": "He plans to put that old apartment up for sale.",
                "meaning_en": "to put up for sale",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    189: {
        "primary_gloss": "bed sheet",
        "examples": [
            {
                "sentence": "酒店答应马上给我们换床单。",
                "translation": "The hotel promised to change the bed sheets for us right away.",
                "meaning_en": "bed sheet",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她买床单时，先看颜色，再看质量。",
                "translation": "When she buys bed sheets, she checks the color first and then the quality.",
                "meaning_en": "bed sheet",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这张床单上有咖啡，得马上洗。",
                "translation": "There is coffee on this bed sheet, so it has to be washed right away.",
                "meaning_en": "bed sheet",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    448: {
        "primary_gloss": "to roll; to move by rolling",
        "secondary_glosses": ["to boil"],
        "notes": "The boil sense is especially common with 水 and 汤: 水滚了。",
        "examples": [
            {
                "sentence": "车一停，瓶子就滚到地上了。",
                "translation": "As soon as the car stopped, the bottle rolled onto the ground.",
                "meaning_en": "to roll",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "大石头顺着山路滚下来，大家都赶快让开。",
                "translation": "A big rock rolled down along the mountain road, and everyone quickly moved out of the way.",
                "meaning_en": "to roll",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "锅里的水已经滚了，快把面条放进去吧。",
                "translation": "The water in the pot is already boiling, so put the noodles in quickly.",
                "meaning_en": "to boil",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    568: {
        "notes": "A tool with two blades used for cutting paper, cloth, hair, and similar things; usually counted with 把.",
        "examples": [
            {
                "sentence": "我忘了带剪刀，你的剪刀能借我一下吗？",
                "translation": "I forgot to bring scissors; can I borrow yours for a moment?",
                "meaning_en": "scissors",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她拿起剪刀，把袋子剪开了。",
                "translation": "She picked up the scissors and cut the bag open.",
                "meaning_en": "scissors",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "做手工以前，老师先把剪刀发给大家。",
                "translation": "Before doing the craft activity, the teacher first handed out scissors to everyone.",
                "meaning_en": "scissors",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    662: {
        "primary_gloss": "classifier for small round things",
        "notes": "Common with 星星, 糖, 药, and other small round things.",
        "examples": [
            {
                "sentence": "天上那颗星星特别亮。",
                "translation": "That star in the sky is especially bright.",
                "meaning_en": "classifier for stars",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "医生说这药很苦，但只要吃一颗就行。",
                "translation": "The doctor said this medicine is bitter, but taking one pill is enough.",
                "meaning_en": "classifier for pills",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "盒子里还剩最后一颗糖，弟弟舍不得吃。",
                "translation": "There was only one piece of candy left in the box, and my younger brother could not bear to eat it.",
                "meaning_en": "classifier for candies",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    878: {
        "primary_gloss": "close; emotionally close",
        "secondary_glosses": ["to kiss"],
        "notes": "Standalone 亲 is usually close; dear is better treated in fixed forms like 亲爱的.",
        "examples": [
            {
                "sentence": "她跟奶奶最亲，有话总先跟奶奶说。",
                "translation": "She is closest to her grandma and always tells her everything first.",
                "meaning_en": "close",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这两个孩子一起长大，所以一直很亲。",
                "translation": "These two children grew up together, so they have always been very close.",
                "meaning_en": "close",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "孩子一见到妈妈，就跑过去亲了她一下。",
                "translation": "As soon as the child saw his mother, he ran over and kissed her.",
                "meaning_en": "to kiss",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    998: {
        "primary_gloss": "to save; to spare",
        "secondary_glosses": ["to economize"],
        "notes": "Often used for saving time, money, effort, or trouble by using a simpler or more efficient way.",
        "examples": [
            {
                "sentence": "这样安排以后，能省很多时间。",
                "translation": "With things arranged this way, we can save a lot of time.",
                "meaning_en": "save time",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "自己做饭虽然麻烦一点，可是很省钱。",
                "translation": "Cooking for yourself is a bit more trouble, but it saves a lot of money.",
                "meaning_en": "save money",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "大家一起搬，能省不少力气。",
                "translation": "If everyone carries it together, it saves quite a bit of effort.",
                "meaning_en": "save effort",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1192: {
        "secondary_glosses": ["tail end"],
        "notes": "Usually the tail of an animal; it can also mean the remaining unfinished part of something.",
        "examples": [
            {
                "sentence": "那只小狗一高兴就摇尾巴。",
                "translation": "That puppy wags its tail as soon as it gets excited.",
                "meaning_en": "tail",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "孩子去拉猫的尾巴，妈妈马上把他叫住了。",
                "translation": "The child went to pull the cat's tail, and Mom stopped him at once.",
                "meaning_en": "tail",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这件事看着结束了，其实还有尾巴。",
                "translation": "This matter looks finished, but there are still loose ends.",
                "meaning_en": "tail end",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1332: {
        "notes": "The tears that come out when someone cries or is deeply moved.",
        "examples": [
            {
                "sentence": "听到这个消息，她一下子掉下了眼泪。",
                "translation": "When she heard the news, she burst into tears.",
                "meaning_en": "tears",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他一直忍着，最后还是流了眼泪。",
                "translation": "He kept holding it in, but in the end he still shed tears.",
                "meaning_en": "shed tears",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "看到孩子平安回来，妈妈高兴得眼泪都出来了。",
                "translation": "Seeing the child come back safe, Mom was so happy that tears came to her eyes.",
                "meaning_en": "tears of joy",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1433: {
        "secondary_glosses": ["guiding principle", "rule"],
        "notes": "Often used for the rules you stick to in judgment and behavior, especially in patterns like 有原则 and 按原则处理.",
        "examples": [
            {
                "sentence": "他这个人很有原则，不会随便改主意。",
                "translation": "He has strong principles and will not change his mind casually.",
                "meaning_en": "have principles",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这件事大家都应该按原则处理。",
                "translation": "Everyone should deal with this matter on principle.",
                "meaning_en": "principle",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "有些小事可以商量，大原则不能变。",
                "translation": "Some small matters can be discussed, but major principles cannot change.",
                "meaning_en": "basic principle",
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
