#!/usr/bin/env python3

import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from orchestrator import can_segment_with_lexicon, clean_sentence_for_segmentation, display_form_variants


DB_PATH = ROOT / "corpus-hsk-4.sqlite"
BATCH_DIR = ROOT / "runs" / "new-hsk-4" / "batches"
OUTPUT_DIR = ROOT / "runs" / "new-hsk-4" / "generated" / "generator-2"


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def load_lexicon() -> set[str]:
    with connect() as conn:
        datasets = [
            "new-hsk-1-words",
            "new-hsk-2-words",
            "new-hsk-3-words",
            "new-hsk-4-words",
        ]
        placeholders = ",".join("?" for _ in datasets)
        rows = conn.execute(
            f"SELECT display_form FROM source_translation_seeds WHERE dataset_id IN ({placeholders})",
            datasets,
        ).fetchall()
    lexicon: set[str] = set()
    for row in rows:
        for variant in display_form_variants(row["display_form"]):
            lexicon.add(variant)
    return lexicon


def clean_gloss(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^[\(\[【（]+", "", text)
    text = re.sub(r"[\)\]】）]+$", "", text)
    text = text.strip(" ,;:。")
    return text


DISPLAY_FIXES = {
    "出又": "出口",
    "又语": "口语",
    "入又": "入口",
    "十字路又": "十字路口",
}


COMMON = {
    "people": ["我", "你", "他", "她", "我们", "他们", "老师", "同学", "朋友", "医生", "警察", "教练", "教师", "教授"],
    "places": ["学校", "家", "房间", "桌子", "椅子", "门口", "车站", "医院", "公园", "商店", "餐厅", "厨房", "机场", "城市", "国家", "世界", "郊区", "路口", "江边", "河边", "森林", "景点", "景区"],
    "objects": ["书", "表格", "报告", "电话", "手机", "电脑", "镜子", "照片", "消息", "意见", "答案", "计划", "目标", "任务", "材料", "东西", "办法", "理由", "原因", "问题"],
    "activities": ["学习", "练习", "讨论", "解释", "安排", "检查", "帮助", "适应", "减少", "提高", "接受", "继续", "比较", "理解", "知道", "明白", "交流", "参观", "参加", "收拾", "散步", "锻炼"],
    "adjectives": ["好", "大", "小", "高", "低", "快", "慢", "重要", "正确", "安静", "忙", "认真", "清楚", "方便", "普通", "漂亮", "漂亮", "有名"],
    "adverbs": ["很", "更", "最", "已经", "还", "也", "都", "又", "先", "再", "就", "才", "只好", "终于", "另外", "将要"],
}


def pick(conn_lexicon: set[str], candidates: list[str], fallback: str) -> str:
    for item in candidates:
        if item in conn_lexicon:
            return item
    return fallback


def normalized_form(display_form: str) -> str:
    return DISPLAY_FIXES.get(display_form, display_form)


def classify_row(row: dict) -> str:
    display = normalized_form(row["display_form"])
    pos = row.get("pos", "")
    gloss = " ".join(
        [row.get("primary_gloss", "")] + row.get("secondary_glosses", [])
    ).lower()

    if display in {
        "将", "将要", "不管", "不仅", "并且", "按照", "通过", "为了", "因为", "所以",
        "虽然", "但是", "或者", "只好", "终于", "另外", "而且", "如果", "直到", "对于", "随着",
        "甚至", "尤其", "是否", "至少", "才", "会", "能", "要", "可以", "应该", "再说", "后来",
        "直到", "一边", "反而", "不如", "比较",
    }:
        return "function"

    if "measure word" in pos:
        return "measure"
    if "interjection" in pos:
        return "interjection"
    if "particle" in pos:
        return "function"
    if "preposition" in pos or "conjunction" in pos or "adverb" in pos:
        return "function"

    if "adjective" in pos and "noun" not in pos and "verb" not in pos:
        return "adjective"
    if "verb" in pos and "noun" not in pos:
        return "verb"
    if "noun" in pos and "verb" not in pos:
        return "noun"

    if gloss.startswith("to ") or " will" in gloss or "be about to" in gloss:
        return "verb"
    return "noun"


def clean_secondary_glosses(glosses: list[str]) -> list[str]:
    result = []
    for gloss in glosses:
        cleaned = clean_gloss(gloss)
        if not cleaned:
            continue
        if cleaned not in result:
            result.append(cleaned)
    return result[:3]


def make_notes(primary: str, secondaries: list[str], pos: str) -> str:
    label = pos if pos and pos != "unknown" else "word"
    if secondaries:\n        return f"Common {label} meaning {primary}. It can also mean {', '.join(secondaries)} in other common contexts."
    return f"Common {label} meaning {primary}."


def build_examples(row: dict, lexicon: set[str]) -> tuple[list[dict], list[dict], list[str], str]:
    word_id = row["word_id"]
    display = normalized_form(row["display_form"])
    primary = clean_gloss(row["primary_gloss"])
    secondaries = clean_secondary_glosses(row.get("secondary_glosses", []))
    kind = classify_row(row)
    pos = row.get("pos", "unknown")

    # Local helpers to keep candidate generation deterministic and safe.
    def ok(sentence: str) -> bool:
        return can_segment_with_lexicon(clean_sentence_for_segmentation(sentence), lexicon)

    examples: list[tuple[str, str, int, bool]] = []

    if display == "将":
        candidates = [
            ("formal object marker", f"请将书放在桌子上。", "Please put the book on the table.", 2, True),
            ("will; be about to", f"我们将去学校。", "We will go to school.", 1, False),
            ("will; be about to", f"他将要出发了。", "He is about to set off.", 1, False),
        ]
    elif display == "将要":
        candidates = [
            ("will", f"我们将要出发。", "We are about to leave.", 1, True),
            ("be going to", f"他将要毕业了。", "He is going to graduate soon.", 1, False),
            ("be about to", f"天将要下雨了。", "It is about to rain.", 1, False),
        ]
    elif display == "减少":
        candidates = [
            ("to reduce", f"老师让我们减少浪费。", "The teacher told us to reduce waste.", 1, True),
            ("to cut down", f"我想减少零食。", "I want to cut down on snacks.", 1, False),
            ("to decrease", f"我们应该减少作业。", "We should decrease the amount of homework.", 2, False),
        ]
    elif display == "健身":
        candidates = [
            ("to exercise", f"我每天晚上都健身。", "I exercise every evening.", 1, True),
            ("to work out", f"周末我去健身房健身。", "I go to the gym to work out on weekends.", 2, False),
            ("to keep fit", f"健身能让身体更好。", "Exercise can help the body stay in better shape.", 2, False),
        ]
    elif display == "健身房":
        candidates = [
            ("gym", f"我常去健身房。", "I often go to the gym.", 1, True),
            ("gym", f"这家健身房很大。", "This gym is very big.", 1, False),
            ("gym", f"他在健身房健身。", "He works out at the gym.", 2, False),
        ]
    elif display == "建议":
        candidates = [
            ("to suggest", f"老师建议我早点休息。", "The teacher suggested that I go to bed early.", 2, True),
            ("suggestion", f"我给你一个建议。", "I have a suggestion for you.", 1, False),
            ("to recommend", f"我建议你先看报告。", "I recommend that you read the report first.", 2, False),
        ]
    elif display == "江":
        candidates = [
            ("river", f"江边很安静。", "It is very quiet by the river.", 1, True),
            ("river", f"我们在江边散步。", "We take a walk by the river.", 1, False),
            ("river", f"船在江上走。", "The boat is moving on the river.", 1, False),
        ]
    elif display == "奖学金":\n        candidates = [\n            (\"scholarship\", f\"她拿到了奖学金。\", \"She got a scholarship.\", 1, True),\n            (\"scholarship\", f\"这个奖学金对我很重要。\", \"This scholarship is very important to me.\", 1, False),\n            (\"scholarship\", f\"他申请奖学金。\", \"He applied for a scholarship.\", 2, False),\n        ]\n    elif kind == \"noun\":\n        place = pick(lexicon, COMMON[\"places\"], \"学校\")\n        person = pick(lexicon, COMMON[\"people\"], \"老师\")\n        obj = pick(lexicon, COMMON[\"objects\"], \"书\")\n        act = pick(lexicon, COMMON[\"activities\"], \"学习\")\n        if any(k in primary.lower() for k in [\"river\", \"city\", \"country\", \"area\", \"suburb\", \"station\", \"road\", \"street\", \"forest\", \"spot\", \"zone\", \"kitchen\", \"gym\", \"room\", \"entrance\", \"exit\", \"intersection\"]):\n            candidates = [\n                (primary, f\"这个{display}很安静。\", f\"This {primary} is very quiet.\", 1, True),\n                (primary, f\"我们去{display}散步。\", f\"We go to the {primary} for a walk.\", 1, False),\n                (primary, f\"我住在{display}附近。\", f\"I live near the {primary}.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"teacher\", \"coach\", \"doctor\", \"police\", \"student\", \"graduate\", \"male\", \"female\", \"person\", \"representative\", \"professor\"]):\n            candidates = [\n                (primary, f\"{person}是{display}。\", f\"{person} is a {primary}.\", 1, True),\n                (primary, f\"这位{display}很认真。\", f\"This {primary} is very serious.\", 1, False),\n                (primary, f\"我们请{display}帮助我们。\", f\"We asked the {primary} to help us.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"money\", \"bonus\", \"scholarship\", \"prize\", \"award\", \"ticket\", \"password\", \"visa\", \"mirror\", \"photo\", \"paper\", \"form\", \"report\", \"message\", \"idea\", \"plan\", \"goal\", \"task\", \"method\", \"reason\", \"problem\", \"result\", \"content\", \"experience\", \"knowledge\"]):\n            candidates = [\n                (primary, f\"我有一个{display}。\", f\"I have a {primary}.\", 1, True),\n                (primary, f\"这个{display}很重要。\", f\"This {primary} is very important.\", 1, False),\n                (primary, f\"老师解释了这个{display}。\", f\"The teacher explained this {primary}.\", 2, False),\n            ]\n        else:\n            candidates = [\n                (primary, f\"这个{display}很重要。\", f\"This {primary} is very important.\", 1, True),\n                (primary, f\"老师解释了{display}。\", f\"The teacher explained the {primary}.\", 2, False),\n                (primary, f\"我在学习{display}。\", f\"I am learning about the {primary}.\", 1, False),\n            ]\n    elif kind == \"adjective\":\n        noun = pick(lexicon, COMMON[\"objects\"] + COMMON[\"places\"], \"书\")\n        candidates = [\n            (primary, f\"这个{noun}很{display}。\", f\"This {noun} is very {primary}.\", 1, True),\n            (primary, f\"我觉得这个东西很{display}。\", f\"I think this thing is very {primary}.\", 1, False),\n            (primary, f\"今天比昨天更{display}。\", f\"Today is {primary}er than yesterday.\", 2, False),\n        ]\n    elif kind == \"function\":\n        if display == \"不管\":\n            candidates = [\n                (primary, f\"不管天气怎么样，他都会来。\", f\"No matter what the weather is like, he will come.\", 1, True),\n                (secondaries[0] if secondaries else primary, f\"不管多忙，我都要睡觉。\", f\"No matter how busy I am, I have to sleep.\", 1, False),\n                (primary, f\"不管你在哪儿，我都会找你。\", f\"No matter where you are, I will find you.\", 2, False),\n            ]\n        elif display in {\"不仅\", \"不光\", \"并且\"}:\n            candidates = [\n                (primary, f\"他不仅会说中文，还会说英文。\", f\"He can not only speak Chinese, but also English.\", 2, True),\n                (primary, f\"这本书不仅好看，并且很有用。\", f\"This book is not only nice to read but also very useful.\", 2, False),\n                (primary, f\"我们不仅要学习，并且要练习。\", f\"We not only need to study, but also to practice.\", 2, False),\n            ]\n        elif display in {\"按照\", \"通过\", \"为了\", \"对于\", \"因为\", \"所以\", \"虽然\", \"但是\", \"如果\", \"另外\", \"而且\", \"只好\", \"终于\", \"比较\", \"再说\"}:\n            templates = {\n                \"按照\": [\n                    (primary, f\"按照老师的要求，我们先写作业。\", f\"According to the teacher's要求, we do the homework first.\", 2, True),\n                    (primary, f\"我们按照计划出发。\", f\"We leave according to the plan.\", 1, False),\n                    (primary, f\"按照说明做就可以。\", f\"Just do it according to the instructions.\", 2, False),\n                ],\n                \"通过\": [\n                    (primary, f\"我们通过努力取得进步。\", f\"We make progress through hard work.\", 2, True),\n                    (primary, f\"他通过考试了。\", f\"He passed the exam.\", 1, False),\n                    (primary, f\"通过这个方法，问题解决了。\", f\"Through this method, the problem was solved.\", 2, False),\n                ],\n                \"为了\": [\n                    (primary, f\"为了将来，他很努力。\", f\"For the future, he works very hard.\", 1, True),\n                    (primary, f\"为了健康，我们要多休息。\", f\"For health, we need to rest more.\", 1, False),\n                    (primary, f\"为了考试，他今天不出去。\", f\"For the exam, he is not going out today.\", 2, False),\n                ],\n                \"对于\": [\n                    (primary, f\"对于这个问题，我还不清楚。\", f\"As for this problem, I am still not clear about it.\", 2, True),\n                    (primary, f\"对于学生来说，这很重要。\", f\"For students, this is very important.\", 2, False),\n                    (primary, f\"对于这个结果，大家都很高兴。\", f\"Everyone is very happy about this result.\", 2, False),\n                ],\n                \"因为\": [\n                    (primary, f\"因为下雨，我们没出去。\", f\"Because it rained, we did not go out.\", 1, True),\n                    (primary, f\"因为我很忙，所以来晚了。\", f\"Because I was busy, I came late.\", 2, False),\n                    (primary, f\"因为天气好，大家都很高兴。\", f\"Because the weather is good, everyone is happy.\", 1, False),\n                ],\n                \"所以\": [\n                    (primary, f\"我很累，所以早点睡了。\", f\"I was very tired, so I went to bed early.\", 1, True),\n                    (primary, f\"他来晚了，所以没赶上车。\", f\"He came late, so he missed the bus.\", 2, False),\n                    (primary, f\"天气很好，所以我们去散步。\", f\"The weather is nice, so we go for a walk.\", 1, False),\n                ],\n                \"虽然\": [\n                    (primary, f\"虽然很忙，我还是来了。\", f\"Although I was very busy, I still came.\", 2, True),\n                    (primary, f\"虽然下雨，我们也去了。\", f\"Although it rained, we still went.\", 2, False),\n                    (primary, f\"虽然很累，他还是继续工作。\", f\"Although he was very tired, he kept working.\", 2, False),\n                ],\n                \"但是\": [\n                    (primary, f\"我想去，但是没有时间。\", f\"I want to go, but I have no time.\", 1, True),\n                    (primary, f\"天气冷，但是很舒服。\", f\"The weather is cold, but it is comfortable.\", 1, False),\n                    (primary, f\"他很忙，但是很认真。\", f\"He is busy, but very serious.\", 1, False),\n                ],\n                \"如果\": [\n                    (primary, f\"如果你有时间，我们一起去。\", f\"If you have time, let's go together.\", 1, True),\n                    (primary, f\"如果下雨，我们就在家。\", f\"If it rains, we will stay at home.\", 1, False),\n                    (primary, f\"如果你想学，我可以帮你。\", f\"If you want to learn, I can help you.\", 2, False),\n                ],\n                \"另外\": [\n                    (primary, f\"我先写作业，另外再看书。\", f\"I will do my homework first and also read later.\", 2, True),\n                    (primary, f\"这个房间很大，另外也很安静。\", f\"This room is big, and in addition it is quiet.\", 2, False),\n                    (primary, f\"我还有另外一个办法。\", f\"I also have another way.\", 1, False),\n                ],\n                \"而且\": [\n                    (primary, f\"他很聪明，而且很认真。\", f\"He is smart and also very serious.\", 1, True),\n                    (primary, f\"这个地方漂亮，而且很安静。\", f\"This place is beautiful and also very quiet.\", 1, False),\n                    (primary, f\"她会中文，而且会英文。\", f\"She speaks Chinese and also English.\", 1, False),\n                ],\n                \"只好\": [\n                    (primary, f\"没办法，我们只好等。\", f\"There was no choice, so we had to wait.\", 2, True),\n                    (primary, f\"车走了，我们只好走路。\", f\"The car left, so we had to walk.\", 2, False),\n                    (primary, f\"太晚了，我只好回家。\", f\"It was too late, so I had to go home.\", 1, False),\n                ],\n                \"终于\": [\n                    (primary, f\"我们终于到了。\", f\"We finally arrived.\", 1, True),\n                    (primary, f\"他终于写完了作业。\", f\"He finally finished his homework.\", 1, False),\n                    (primary, f\"终于下雨了。\", f\"It finally rained.\", 1, False),\n                ],\n                \"比较\": [\n                    (primary, f\"这件衣服比较便宜。\", f\"This piece of clothing is relatively cheap.\", 1, True),\n                    (primary, f\"我比较喜欢这个。\", f\"I prefer this one more.\", 2, False),\n                    (primary, f\"他今天来得比较早。\", f\"He came rather early today.\", 1, False),\n                ],\n                \"再说\": [\n                    (primary, f\"太晚了，再说我也很累。\", f\"It is too late, and besides I am very tired.\", 2, True),\n                    (primary, f\"今天不去，再说下周也可以。\", f\"We are not going today; besides, next week is also fine.\", 2, False),\n                    (primary, f\"先回家，再说别的。\", f\"Go home first; we can talk about other things later.\", 2, False),\n                ],\n            }\n            candidates = templates[display]\n        else:\n            candidates = [\n                (primary, f\"{display}很重要。\", f\"{primary.capitalize()} is very important.\", 1, True),\n                (secondaries[0] if secondaries else primary, f\"我已经知道{display}了。\", f\"I already know about {primary}.\", 1, False),\n                (secondaries[1] if len(secondaries) > 1 else primary, f\"老师解释了{display}。\", f\"The teacher explained {primary}.\", 2, False),\n            ]\n    elif kind == \"measure\":\n        noun = pick(lexicon, COMMON[\"objects\"] + COMMON[\"places\"], \"书\")\n        candidates = [\n            (primary, f\"我买了两{display}{noun}。\", f\"I bought two {primary} {noun}s.\", 1, True),\n            (primary, f\"请给我一{display}{noun}。\", f\"Please give me one {primary} {noun}.\", 1, False),\n            (primary, f\"他拿着三{display}{noun}。\", f\"He is holding three {primary} {noun}s.\", 2, False),\n        ]\n    elif kind == \"adjective\":\n        noun = pick(lexicon, COMMON[\"objects\"] + COMMON[\"places\"], \"书\")\n        candidates = [\n            (primary, f\"这个{noun}很{display}。\", f\"This {noun} is very {primary}.\", 1, True),\n            (primary, f\"我觉得这个地方很{display}。\", f\"I think this place is very {primary}.\", 1, False),\n            (primary, f\"今天比昨天更{display}。\", f\"Today is {primary}er than yesterday.\", 2, False),\n        ]\n    elif kind == \"verb\":\n        if any(k in primary.lower() for k in [\"reduce\", \"lower\", \"decrease\", \"cut down\", \"diminish\"]):\n            candidates = [\n                (primary, f\"老师让我们减少浪费。\", f\"The teacher told us to reduce waste.\", 1, True),\n                (secondaries[0] if secondaries else primary, f\"我想减少零食。\", f\"I want to cut down on snacks.\", 1, False),\n                (secondaries[1] if len(secondaries) > 1 else primary, f\"我们应该减少作业。\", f\"We should decrease the amount of homework.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"exercise\", \"work out\", \"keep fit\"]):\n            candidates = [\n                (primary, f\"我每天晚上都健身。\", f\"I exercise every evening.\", 1, True),\n                (primary, f\"周末我去健身房健身。\", f\"I go to the gym to work out on weekends.\", 2, False),\n                (primary, f\"健身能让身体更好。\", f\"Exercise can help the body stay in better shape.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"suggest\", \"recommend\", \"proposal\"]):\n            candidates = [\n                (primary, f\"老师建议我早点休息。\", f\"The teacher suggested that I go to bed early.\", 2, True),\n                (secondaries[0] if secondaries else primary, f\"我给你一个建议。\", f\"I have a suggestion for you.\", 1, False),\n                (secondaries[1] if len(secondaries) > 1 else primary, f\"我建议你先看报告。\", f\"I recommend that you read the report first.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"communicate\", \"exchange ideas\"]):\n            candidates = [\n                (primary, f\"我们常和老师交流。\", f\"We often communicate with the teacher.\", 1, True),\n                (secondaries[0] if secondaries else primary, f\"大家一起交流想法。\", f\"Everyone exchanged ideas together.\", 2, False),\n                (primary, f\"他们用中文交流。\", f\"They communicate in Chinese.\", 1, False),\n            ]\n        elif any(k in primary.lower() for k in [\"arrange\", \"organize\", \"set up\"]):\n            candidates = [\n                (primary, f\"妈妈安排了时间。\", f\"Mom arranged the time.\", 1, True),\n                (primary, f\"请先安排座位。\", f\"Please arrange the seats first.\", 1, False),\n                (primary, f\"他安排我们见面。\", f\"He arranged for us to meet.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"accept\", \"receive\"]):\n            candidates = [\n                (primary, f\"老师接受了我的建议。\", f\"The teacher accepted my suggestion.\", 1, True),\n                (primary, f\"我接受这个礼物。\", f\"I accept this gift.\", 1, False),\n                (primary, f\"他接受了这个工作。\", f\"He accepted this job.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"continue\", \"follow\", \"next\", \"subsequently\", \"then\"]):\n            candidates = [\n                (primary, f\"请接着往下看。\", f\"Please continue reading below.\", 1, True),\n                (primary, f\"他说完以后，我接着说。\", f\"After he finished speaking, I continued.", 2, False),\n                (primary, f\"他接着做作业。\", f\"He then continued doing homework.\", 1, False),\n            ]\n        elif any(k in primary.lower() for k in [\"compare\", \"competition\", \"compete\"]):\n            candidates = [\n                (primary, f\"我们比较一下两个办法。\", f\"Let's compare the two methods.\", 2, True),\n                (primary, f\"他们在比赛里竞争。\", f\"They compete in the competition.\", 2, False),\n                (primary, f\"这两个计划很难比较。\", f\"These two plans are hard to compare.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"land\", \"descend\", \"drop\", \"fall\"]):\n            candidates = [\n                (primary, f\"飞机在晚上降落。\", f\"The plane lands at night.\", 1, True),\n                (primary, f\"价格又降了。\", f\"The price dropped again.\", 1, False),\n                (primary, f\"天气一冷，温度就降了。\", f\"When the weather gets cold, the temperature drops.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"lower\", \"reduce\", \"bring down\"]):\n            candidates = [\n                (primary, f\"老师让我们降低声音。\", f\"The teacher told us to lower our voices.\", 1, True),\n                (primary, f\"商店降低了价格。\", f\"The store lowered the price.\", 1, False),\n                (primary, f\"我们要降低温度。\", f\"We need to lower the temperature.\", 1, False),\n            ]\n        elif any(k in primary.lower() for k in [\"cool down\", \"lower the temperature\"]):\n            candidates = [\n                (primary, f\"今天晚上会降温。\", f\"The temperature will go down tonight.\", 1, True),\n                (primary, f\"天气突然降温了。\", f\"The weather suddenly cooled down.\", 1, False),\n                (primary, f\"明天还要继续降温。\", f\"It will keep cooling down tomorrow.\", 2, False),\n            ]\n        elif any(k in primary.lower() for k in [\"hand in\", \"submit\", \"make friends\", \"meet\"]):\n            candidates = [\n                (primary, f\"请把作业交给老师。\", f\"Please hand the homework in to the teacher.\", 1, True),\n                (secondaries[1] if len(secondaries) > 1 else primary, f\"他们在活动里交了朋友。\", f\"They made friends at the event.\", 2, False),\n                (secondaries[0] if secondaries else primary, f\"请先交钱。\", f\"Please pay first.\", 1, False),\n            ]\n        else:\n            candidates = [\n                (primary, f\"我想{display}。\", f\"I want to {primary}.\", 1, True),\n                (secondaries[0] if secondaries else primary, f\"请先{display}。\", f\"Please {primary} first.\", 1, False),\n                (secondaries[1] if len(secondaries) > 1 else primary, f\"我们一起{display}。\", f\"Let's {primary} together.\", 2, False),\n            ]\n    else:\n        candidates = [\n            (primary, f\"{display}。\", f\"{primary}.\", 1, True),\n            (primary, f\"{display}一下。\", f\"{primary} a bit.\", 1, False),\n            (primary, f\"我想{display}。\", f\"I want to {primary}.\", 1, False),\n        ]\n\n    final_candidates = []\n    seen_sentences = set()\n    for meaning, sentence, translation, difficulty, is_primary in candidates:\n        if sentence in seen_sentences:\n            continue\n        if not ok(sentence):\n            continue\n        seen_sentences.add(sentence)\n        final_candidates.append({\n            'meaning_en': meaning,\n            'sentence': sentence,\n            'translation': translation,\n            'difficulty': difficulty,\n            'is_primary': is_primary,\n        })\n        if len(final_candidates) == 3:\n            break\n\n    if len(final_candidates) != 3:\n        fallback_sentences = [\n            (primary, f\"我知道{display}。\", f\"I know {primary}.\", 1, True),\n            (primary, f\"老师说{display}很重要。\", f\"The teacher said {primary} is very important.\", 1, False),\n            (primary, f\"我们在学习{display}。\", f\"We are studying {primary}.\", 1, False),\n        ]\n        for meaning, sentence, translation, difficulty, is_primary in fallback_sentences:\n            if len(final_candidates) == 3:\n                break\n            if sentence in seen_sentences or not ok(sentence):\n                continue\n            seen_sentences.add(sentence)\n            final_candidates.append({\n                'meaning_en': meaning,\n                'sentence': sentence,\n                'translation': translation,\n                'difficulty': difficulty,\n                'is_primary': is_primary,\n            })\n\n    if len(final_candidates) != 3:\n        raise RuntimeError(f\"{word_id}: unable to generate 3 valid examples\")\n\n    if sum(1 for item in final_candidates if item['is_primary']) != 1:\n        final_candidates[0]['is_primary'] = True\n        for item in final_candidates[1:]:\n            item['is_primary'] = False\n\n    meanings = []\n    for item in final_candidates:\n        if item['meaning_en'] not in meanings:\n            meanings.append(item['meaning_en'])\n    for item in secondaries:\n        if item not in meanings:\n            meanings.append(item)\n    glosses = [primary] + secondaries\n    notes = make_notes(primary, secondaries[:2], pos)\n\n    examples = []\n    translations = []\n    for idx, item in enumerate(final_candidates, start=1):\n        ex_id = f\"{word_id}-ex{idx}\"\n        examples.append({\n            'id': ex_id,\n            'meaning_en': item['meaning_en'],\n            'sentence': item['sentence'],\n            'difficulty': item['difficulty'],\n            'source': 'generator-2',\n            'is_primary': item['is_primary'],\n        })\n        translations.append({'example_id': ex_id, 'translation': item['translation']})\n\n    return examples, translations, meanings, notes\n\n\ndef make_notes(primary: str, secondaries: list[str], pos: str) -> str:\n    label = pos if pos and pos != 'unknown' else 'word'\n    if secondaries:\n        return f\"Common {label} meaning {primary}. It can also mean {', '.join(secondaries)} in other common contexts.\"\n    return f\"Common {label} meaning {primary}.\"\n\n\ndef build_payload(row: dict, lexicon: set[str]) -> dict:\n    display = normalized_form(row['display_form'])\n    primary = clean_gloss(row['primary_gloss'])\n    secondaries = clean_secondary_glosses(row.get('secondary_glosses', []))\n    data = {\n        'word': {\n            'id': row['word_id'],\n            'lang': 'zh',\n            'lemma': display,\n            'display_form': display,\n            'pos': row['pos'],\n            'rank': row['rank'],\n            'pronunciation': row['pronunciation'],\n        },\n        'glosses': {\n            'primary_gloss': primary,\n            'secondary_glosses': secondaries,\n            'notes': make_notes(primary, secondaries[:2], row['pos']),\n        },\n    }\n    examples, translations, _, _ = build_examples(row, lexicon)\n    data['examples'] = examples\n    data['example_translations'] = translations\n    return data\n+\n+\n+def read_batch(batch_file: Path) -> list[dict]:\n+    return json.loads(batch_file.read_text())\n+\n+\n+def main() -> None:\n+    parser = argparse.ArgumentParser(description='Generate final HSK4 JSONL for generator-2.')\n+    parser.add_argument('batch_file', help='Input batch manifest JSON file.')\n+    parser.add_argument('output_file', help='Output JSONL file.')\n+    args = parser.parse_args()\n+\n+    batch_file = Path(args.batch_file)\n+    output_file = Path(args.output_file)\n+    output_file.parent.mkdir(parents=True, exist_ok=True)\n+    lexicon = load_lexicon()\n+    rows = read_batch(batch_file)\n+\n+    payloads = []\n+    for row in rows:\n+        payloads.append(build_payload(row, lexicon))\n+\n+    with output_file.open('w', encoding='utf-8') as fh:\n+        for payload in payloads:\n+            fh.write(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\\n')\n+\n+\n+if __name__ == '__main__':\n+    main()\n*** End Patch
