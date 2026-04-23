import json
import sqlite3


DB_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
OUTPUT_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/strict-repair-pass-23.jsonl"
SOURCE = "orchestrator-strict-repair-2026-04-23-pass23"


REPAIRS = {
    801: {
        "primary_gloss": "read aloud; recite",
        "secondary_glosses": ["miss", "keep thinking about"],
        "notes": "With words, names, or text, 念 means to read or say something aloud. With people or places, especially in 念着, it means to miss them or keep thinking about them.",
        "examples": [
            {
                "sentence": "老师让他站起来，把最后一段大声念一遍。",
                "translation": "The teacher asked him to stand up and read the last paragraph aloud once.",
                "meaning_en": "read aloud",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "孩子一边走一边念今天刚学的课文。",
                "translation": "The child walked along reciting the text he had just learned today.",
                "meaning_en": "recite",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "奶奶嘴上不说，其实一直念着在外地工作的儿子。",
                "translation": "Grandma doesn't say it, but she has been missing her son who works away from home.",
                "meaning_en": "miss",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    804: {
        "notes": "A person whose work and living come from farming. It refers to farmers as an occupational group, not just anyone who lives in the countryside.",
        "examples": [
            {
                "sentence": "天还没亮，村里的农民就已经下地干活了。",
                "translation": "Before it was even light out, the farmers in the village had already gone to work in the fields.",
                "meaning_en": "farmer",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "这些年，不少农民开始在网上卖自己种的水果。",
                "translation": "In recent years, quite a few farmers have started selling the fruit they grow online.",
                "meaning_en": "farmer",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "对很多农民来说，今年的收成比去年更重要。",
                "translation": "For many farmers, this year's harvest matters more than last year's.",
                "meaning_en": "farmer",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    876: {
        "notes": "Used when someone does something softly or without drawing attention; it can describe low-noise action or doing something without others noticing.",
        "examples": [
            {
                "sentence": "他悄悄走到后面坐下，谁也没注意到。",
                "translation": "He quietly walked to the back and sat down, and nobody noticed.",
                "meaning_en": "quietly",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "她把礼物悄悄放在门口，然后就离开了。",
                "translation": "She quietly left the gift at the door and then went away.",
                "meaning_en": "secretly",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "他把这个消息悄悄告诉我，让我先别往外说。",
                "translation": "He told me the news in secret and asked me not to tell anyone yet.",
                "meaning_en": "secretly",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    929: {
        "primary_gloss": "recognize",
        "secondary_glosses": ["admit", "accept as"],
        "notes": "A broad everyday verb. It can mean to recognize someone or something, admit that something is true or that you were wrong, or accept someone as having a certain identity or standing.",
        "examples": [
            {
                "sentence": "虽然很多年没见了，我还是一下就认出了他的声音。",
                "translation": "Although I hadn't seen him for many years, I still recognized his voice immediately.",
                "meaning_en": "recognize",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "做错了事就要认，老找理由只会让人更生气。",
                "translation": "If you did something wrong, you should admit it; constantly making excuses will only make people angrier.",
                "meaning_en": "admit",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "大家都认他是这方面最有经验的人。",
                "translation": "Everyone regards him as the most experienced person in this area.",
                "meaning_en": "accept as",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    955: {
        "secondary_glosses": ["fan"],
        "notes": "A fan held and waved by hand, often used for cooling; it can also appear as a stage prop or an older everyday object.",
        "examples": [
            {
                "sentence": "天气太热，奶奶坐在门口慢慢摇着扇子。",
                "translation": "It was so hot that Grandma sat by the doorway slowly waving a hand fan.",
                "meaning_en": "hand fan",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "那把旧扇子虽然有点破，爷爷还是一直留着。",
                "translation": "That old fan is a little worn, but Grandpa has still kept it all this time.",
                "meaning_en": "hand fan",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "演员上台前才发现忘了带扇子，只好临时去借。",
                "translation": "The performer only realized before going onstage that they had forgotten the fan, so they had to borrow one at the last minute.",
                "meaning_en": "fan",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    956: {
        "notes": "As a noun, it means an injury or wound; as a verb, often in patterns like 伤人, it means to hurt someone physically or emotionally.",
        "examples": [
            {
                "sentence": "他的手上还有伤，所以这几天不能碰水。",
                "translation": "He still has an injury on his hand, so he can't let it touch water these next few days.",
                "meaning_en": "injury",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "这点伤虽然不大，但是走路还是会疼。",
                "translation": "Although this injury isn't serious, it still hurts when walking.",
                "meaning_en": "injury",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "这种话说得太重了，很容易伤人。",
                "translation": "Words said that harshly can easily hurt people.",
                "meaning_en": "to hurt",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    963: {
        "secondary_glosses": ["to put online"],
        "notes": "A tech verb for sending a photo, file, video, or document from a device to a website, app, platform, or online system.",
        "examples": [
            {
                "sentence": "报名以前，你得先把证件照片上传到系统里。",
                "translation": "Before registering, you need to upload your ID photo to the system first.",
                "meaning_en": "to upload",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "文件上传以后，组里的人都可以直接下载。",
                "translation": "After the file is uploaded, everyone in the group can download it directly.",
                "meaning_en": "to upload",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "网络一直不稳定，这个视频上传了半天还没成功。",
                "translation": "The connection has been unstable the whole time, and this video still hasn't uploaded successfully after ages.",
                "meaning_en": "to upload",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1166: {
        "secondary_glosses": ["house slippers"],
        "notes": "Slip-on slippers, usually worn indoors, at home, in hotels, or after washing. The focus is casual indoor footwear, not regular street shoes.",
        "examples": [
            {
                "sentence": "回家以后，他总是先换上拖鞋再进房间。",
                "translation": "After coming home, he always changes into slippers before going into the room.",
                "meaning_en": "slippers",
                "difficulty": 3,
                "is_primary": True,
            },
            {
                "sentence": "地上刚擦过，你还是先换上拖鞋吧。",
                "translation": "The floor has just been wiped, so you'd better put on slippers first.",
                "meaning_en": "slippers",
                "difficulty": 3,
                "is_primary": False,
            },
            {
                "sentence": "我忘了带拖鞋，只好先穿酒店准备的那双。",
                "translation": "I forgot to bring slippers, so I had to wear the pair the hotel prepared.",
                "meaning_en": "slippers",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1168: {
        "primary_gloss": "maternal grandfather",
        "secondary_glosses": ["mother's father"],
        "notes": "Specifically your mother's father. This is different from 爷爷, which refers to your father's father.",
        "examples": [
            {
                "sentence": "外公虽然七十多了，每天还是坚持出去散步。",
                "translation": "Although my maternal grandfather is already over seventy, he still keeps going out for a walk every day.",
                "meaning_en": "maternal grandfather",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "小时候一放暑假，我就去外公家住上两个星期。",
                "translation": "When I was little, as soon as summer vacation started, I would go stay at my maternal grandfather's home for two weeks.",
                "meaning_en": "maternal grandfather",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "今年过年不能回老家，我们只好先给外公打电话。",
                "translation": "We can't go back to our hometown for New Year this year, so we have to call my maternal grandfather first.",
                "meaning_en": "maternal grandfather",
                "difficulty": 3,
                "is_primary": False,
            },
        ],
    },
    1173: {
        "notes": "A general word for a toy or plaything, especially something made for children to play with.",
        "examples": [
            {
                "sentence": "这个玩具不但会说话，还会跟着音乐跳舞。",
                "translation": "This toy can not only talk, but also dance along with music.",
                "meaning_en": "toy",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "弟弟每天都抱着那个玩具睡觉，谁拿走他都不高兴。",
                "translation": "My younger brother sleeps holding that toy every day, and he gets upset if anyone takes it away.",
                "meaning_en": "toy",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "商店刚到了一批新玩具，不少家长一看见就给孩子买了。",
                "translation": "The shop has just received a batch of new toys, and many parents bought them for their children as soon as they saw them.",
                "meaning_en": "toy",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1177: {
        "primary_gloss": "if by any chance; in case",
        "secondary_glosses": ["just in case"],
        "notes": "Usually introduces an unlikely but unwanted possibility. In the fixed phrase 以防万一, it is noun-like and refers to a possible emergency or unexpected problem.",
        "examples": [
            {
                "sentence": "万一明天下大雨，比赛可能就要改时间。",
                "translation": "If it happens to rain heavily tomorrow, the game may have to be rescheduled.",
                "meaning_en": "if by any chance",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "你先把文件发给我，万一电脑出问题就麻烦了。",
                "translation": "Send me the file first, in case something goes wrong with the computer.",
                "meaning_en": "in case",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "我还是把护照又检查了一遍，以防万一。",
                "translation": "I checked my passport one more time, just in case.",
                "meaning_en": "just in case",
                "difficulty": 4,
                "is_primary": False,
            },
        ],
    },
    1181: {
        "primary_gloss": "smile",
        "secondary_glosses": ["give a gentle smile", "a smile"],
        "notes": "Usually refers to a gentle, calm smile. It can be used as a verb or as a noun.",
        "examples": [
            {
                "sentence": "老师一进门，就微笑着向大家问好。",
                "translation": "As soon as the teacher walked in, she smiled and greeted everyone.",
                "meaning_en": "smile",
                "difficulty": 4,
                "is_primary": True,
            },
            {
                "sentence": "她脸上的微笑让大家一下就放松了不少。",
                "translation": "The smile on her face made everyone relax a lot right away.",
                "meaning_en": "a smile",
                "difficulty": 4,
                "is_primary": False,
            },
            {
                "sentence": "她只是微笑着点了点头，没有马上回答。",
                "translation": "She only smiled and nodded, without answering right away.",
                "meaning_en": "smile",
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
