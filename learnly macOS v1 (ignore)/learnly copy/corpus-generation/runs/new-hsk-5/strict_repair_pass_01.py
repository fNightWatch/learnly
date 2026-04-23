import json
import sqlite3
from pathlib import Path


DB_PATH = Path("/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite")
OUTPUT_PATH = Path("/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-01.jsonl")
SOURCE = "orchestrator-strict-repair-2026-04-18"


REPAIRS = {
    179: {
        "primary_gloss": "to deal with; to get along with",
        "secondary_glosses": ["to handle", "to manage"],
        "notes": "A colloquial verb for dealing with a person, matter, or relationship. This row does not teach the noun senses such as place.",
        "examples": [
            {
                "sentence": "这件事不好处，得大家坐下来慢慢谈。",
                "translation": "This matter is not easy to handle, so everyone needs to sit down and talk it through slowly.",
                "meaning_en": "to deal with",
                "difficulty": 2,
                "is_primary": True,
            },
            {
                "sentence": "他这个人其实不难处，熟了以后很好说话。",
                "translation": "He is actually not hard to get along with; once you know him, he is easy to talk to.",
                "meaning_en": "to get along with",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "家里的矛盾要好好处，不能一直不管。",
                "translation": "Family conflicts need to be handled properly; you cannot just keep leaving them alone.",
                "meaning_en": "to handle",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    672: {
        "primary_gloss": "in the air",
        "secondary_glosses": ["aerial"],
        "notes": "Refers to the space above the ground, and can also describe things that happen or are shown in the air.",
        "examples": [
            {
                "sentence": "一只鸟从空中飞过，大家都抬头看它。",
                "translation": "A bird flew past in the air, and everyone looked up at it.",
                "meaning_en": "in the air",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "空中的星星特别亮，我们站在门口看了很久。",
                "translation": "The stars in the sky were especially bright, and we stood at the door looking for a long time.",
                "meaning_en": "in the air",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "飞机正在空中飞行，下面的人都能看见。",
                "translation": "The plane was flying in the air, and the people below could all see it.",
                "meaning_en": "aerial",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1028: {
        "primary_gloss": "-style; -type",
        "secondary_glosses": ["patterned as", "in the style of"],
        "notes": "A suffix added after a noun to show a style, type, or pattern, as in 中式, 老式, and 开放式.",
        "examples": [
            {
                "sentence": "他更习惯中式早餐，早上很少只喝咖啡。",
                "translation": "He is more used to Chinese-style breakfast and rarely drinks only coffee in the morning.",
                "meaning_en": "-style",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这家老店还保留着老式门和窗，看上去很特别。",
                "translation": "This old shop still keeps its old-style doors and windows, which gives it a distinctive look.",
                "meaning_en": "-style",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这家饭店也提供西式早餐，年轻人很喜欢。",
                "translation": "This restaurant also serves Western-style breakfast, and young people like it a lot.",
                "meaning_en": "-type",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1149: {
        "primary_gloss": "noun-forming suffix",
        "secondary_glosses": ["suffix in familiar nouns"],
        "notes": "A noun-forming suffix found in words like 石头, 木头, and 念头. It helps form familiar everyday nouns rather than carrying a full standalone meaning of its own.",
        "examples": [
            {
                "sentence": "门口那块大石头太重了，两个年轻人都搬不动。",
                "translation": "The big stone at the entrance is so heavy that even two young people cannot move it.",
                "meaning_en": "suffix in 石头",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这个念头刚一出来，他就认真记在本子上了。",
                "translation": "As soon as this thought came to him, he carefully wrote it down in his notebook.",
                "meaning_en": "suffix in 念头",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "门边那根木头放了很多年，表面都变黑了。",
                "translation": "That piece of wood by the door has been there for many years, and even its surface has turned black.",
                "meaning_en": "suffix in 木头",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1184: {
        "primary_gloss": "for; for the sake of",
        "secondary_glosses": ["in order to"],
        "notes": "A formal written preposition used before the person, goal, or reason involved, often meaning for, for the sake of, or in order to.",
        "examples": [
            {
                "sentence": "为安全起见，上车以后先把安全带系好。",
                "translation": "For safety, fasten your seatbelt first after getting into the car.",
                "meaning_en": "for the sake of",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他这些年一直在为家人更好的生活努力。",
                "translation": "All these years, he has been working hard for a better life for his family.",
                "meaning_en": "for",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这本书是专门为初学者写的，说明非常清楚。",
                "translation": "This book was written especially for beginners, and its explanations are very clear.",
                "meaning_en": "for",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1269: {
        "primary_gloss": "Miss; young lady",
        "secondary_glosses": ["Ms."],
        "notes": "Often used with a family name, like 王小姐, and in some polite service settings. In today's mainland speech it sounds formal and depends strongly on context.",
        "examples": [
            {
                "sentence": "这位小姐已经到了，现在在里面等你。",
                "translation": "This young lady has already arrived and is now waiting for you inside.",
                "meaning_en": "Ms.",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "那位小姐把钱包忘在车上了，后来又回来拿。",
                "translation": "That young lady left her wallet in the car and later came back to get it.",
                "meaning_en": "Miss",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "请问，那位小姐是不是跟你一起来的？",
                "translation": "Excuse me, did that young lady come with you?",
                "meaning_en": "Miss",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1397: {
        "primary_gloss": "long-standing; age-old",
        "secondary_glosses": ["with a long history"],
        "notes": "Describes a history, tradition, or cultural line that has lasted for a very long time.",
        "examples": [
            {
                "sentence": "这里文化悠久，也有很多老故事。",
                "translation": "The culture here is long-standing, and it also has many old stories.",
                "meaning_en": "long-standing",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这个节日传统悠久，到今天还很受欢迎。",
                "translation": "This festival has an age-old tradition and is still very popular today.",
                "meaning_en": "age-old",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这个地方有着悠久的传统，所以大家都很重视。",
                "translation": "This place has a long-standing tradition, so everyone takes it seriously.",
                "meaning_en": "with a long history",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1533: {
        "primary_gloss": "weight",
        "secondary_glosses": ["the amount something weighs"],
        "notes": "Refers to how heavy something is, whether it is luggage, fruit, a machine, or another object being measured.",
        "examples": [
            {
                "sentence": "上飞机以前，工作人员先检查了行李的重量。",
                "translation": "Before boarding the plane, the staff first checked the weight of the luggage.",
                "meaning_en": "weight",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这台机器的重量超过两百公斤，搬的时候要小心。",
                "translation": "The weight of this machine exceeds two hundred kilograms, so be careful when moving it.",
                "meaning_en": "weight",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "买水果的时候，很多人都会先问价格和重量。",
                "translation": "When buying fruit, many people first ask about the price and the weight.",
                "meaning_en": "weight",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1536: {
        "primary_gloss": "pig",
        "secondary_glosses": [],
        "notes": "The common animal word for pig, used for the animal itself rather than figurative insults.",
        "examples": [
            {
                "sentence": "养猪的地方离村子不远，早上常能听见猪叫。",
                "translation": "The place where pigs are raised is not far from the village, and you can often hear pigs squeal in the morning.",
                "meaning_en": "pig",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这种黑猪长得慢一点，可是肉的味道更好。",
                "translation": "This kind of black pig grows a bit more slowly, but the meat tastes better.",
                "meaning_en": "pig",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "孩子在书上看到猪以后，追着问了很多问题。",
                "translation": "After seeing a pig in the book, the child kept following up with lots of questions.",
                "meaning_en": "pig",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1551: {
        "primary_gloss": "lodging; to stay overnight",
        "secondary_glosses": ["accommodation"],
        "notes": "Can mean staying somewhere overnight, and it also means the lodging or accommodation arranged for a trip, event, or stay.",
        "examples": [
            {
                "sentence": "我们今天在学校住宿一晚，明天一早再走。",
                "translation": "We are staying overnight at the school tonight and leaving early tomorrow morning.",
                "meaning_en": "to stay overnight",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这家酒店的住宿不错，房间也很安静。",
                "translation": "The accommodation at this hotel is good, and the rooms are quiet too.",
                "meaning_en": "lodging",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "出发前最好先订好住宿，不然晚上不好找。",
                "translation": "It is best to book your accommodation before setting out; otherwise it is hard to find a place at night.",
                "meaning_en": "accommodation",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1572: {
        "primary_gloss": "purple",
        "secondary_glosses": ["violet"],
        "notes": "Describes something with a purple or violet color.",
        "examples": [
            {
                "sentence": "她今天穿了一条紫裙子，我们一下就看到她了。",
                "translation": "She wore a purple dress today, so we spotted her right away.",
                "meaning_en": "purple",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "天快黑的时候，远处的云慢慢变紫了。",
                "translation": "As it grew dark, the distant clouds slowly turned purple.",
                "meaning_en": "purple",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这条围巾有点紫，配灰色衣服很好看。",
                "translation": "This scarf is a little purple, and it looks great with gray clothes.",
                "meaning_en": "violet",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1574: {
        "primary_gloss": "since",
        "secondary_glosses": ["ever since"],
        "notes": "Introduces the starting point of a later change or situation, meaning since that time onward.",
        "examples": [
            {
                "sentence": "自从搬到这里以后，我们周末常在楼下散步。",
                "translation": "Since moving here, we often take walks downstairs on weekends.",
                "meaning_en": "since",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "他自从开始自己做饭，身体好了很多。",
                "translation": "Ever since he started cooking for himself, his health has improved a lot.",
                "meaning_en": "ever since",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "自从公司换了系统，大家工作方便多了。",
                "translation": "Since the company changed systems, everyone's work has become much more convenient.",
                "meaning_en": "since",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1575: {
        "primary_gloss": "automatically; automatic",
        "secondary_glosses": [],
        "notes": "Can describe something happening by itself without manual control, or an automatic machine, door, or system.",
        "examples": [
            {
                "sentence": "人一靠近，这扇门就会自动打开。",
                "translation": "As soon as someone gets near, this door opens automatically.",
                "meaning_en": "automatically",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "会议一结束，系统就自动保存刚才的记录。",
                "translation": "As soon as the meeting ends, the system automatically saves the record from just now.",
                "meaning_en": "automatically",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "新工厂用的是全自动设备，效率比以前高得多。",
                "translation": "The new factory uses fully automatic equipment, and its efficiency is much higher than before.",
                "meaning_en": "automatic",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1582: {
        "primary_gloss": "in total; altogether",
        "secondary_glosses": [],
        "notes": "Used before the final number or amount to give the total count, total cost, or total time.",
        "examples": [
            {
                "sentence": "这次装修从开始到结束，总共用了三个多月。",
                "translation": "From beginning to end, this renovation took more than three months in total.",
                "meaning_en": "in total",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "我们班总共有三十二个学生，男生比女生多一点。",
                "translation": "Our class has thirty-two students altogether, and there are slightly more boys than girls.",
                "meaning_en": "altogether",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这三项费用加起来，总共是八百多块。",
                "translation": "When these three expenses are added together, the total comes to more than eight hundred yuan.",
                "meaning_en": "in total",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1586: {
        "primary_gloss": "in short; all in all",
        "secondary_glosses": ["to sum up"],
        "notes": "Used to sum up what was just said and move to the final point or conclusion.",
        "examples": [
            {
                "sentence": "总之，这个方案先试一个月，再决定要不要继续。",
                "translation": "In short, let us try this plan for one month first and then decide whether to continue.",
                "meaning_en": "in short",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她解释了半天，总之就是希望大家别再争了。",
                "translation": "She explained for quite a while; all in all, she just hoped everyone would stop arguing.",
                "meaning_en": "all in all",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "总之，准备得越充分，后面出问题的机会就越小。",
                "translation": "To sum up, the more fully you prepare, the smaller the chance of problems later.",
                "meaning_en": "to sum up",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
}


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    with OUTPUT_PATH.open("w", encoding="utf-8") as handle:
        for rank in sorted(REPAIRS):
            word_row = conn.execute(
                """
                SELECT id, lang, lemma, display_form, pos, rank, pronunciation
                FROM words
                WHERE rank = ?
                """,
                (rank,),
            ).fetchone()
            if not word_row:
                raise ValueError(f"Missing word at rank {rank}")

            repair = REPAIRS[rank]
            word_id = word_row["id"]
            examples = []
            translations = []
            for idx, item in enumerate(repair["examples"], start=1):
                example_id = f"{word_id}-ex{idx}"
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

            payload = {
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
                    "primary_gloss": repair["primary_gloss"],
                    "secondary_glosses": repair["secondary_glosses"],
                    "notes": repair["notes"],
                },
                "examples": examples,
                "example_translations": translations,
            }
            handle.write(json.dumps(payload, ensure_ascii=False) + "\n")

    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
