#!/usr/bin/env python3

import argparse
import json
import os
import re
import sqlite3


ROOT = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))
            )
        )
    )
)

DEFAULT_DB_PATH = os.path.join(ROOT, "corpus-hsk-4.sqlite")
ALT_SEPARATOR_RE = re.compile(r"\s*[｜|/]\s*")
ANNOTATION_RE = re.compile(r"（[^）]*）")
CHINESE_PUNCT_RE = re.compile(r"[，。！？；：、“”‘’（）《》〈〉【】—…·\s,.!?;:\"'()\[\]{}-]+")
LEVEL_DATASET_RE = re.compile(r"^new-hsk-(\d+)-words$")


DISPLAY_FIXES = {
    "出又": "出口",
    "又语": "口语",
    "入又": "入口",
    "十字路又": "十字路口",
}


COMMON = {
    "people": ["老师", "同学", "朋友", "医生", "警察", "教练", "教授", "经理", "我", "你", "他", "她", "我们", "他们"],
    "places": ["学校", "家", "房间", "门口", "车站", "医院", "公园", "商店", "餐厅", "厨房", "机场", "城市", "国家", "世界", "郊区", "路口", "江边", "河边"],
    "objects": ["书", "表格", "报告", "电话", "手机", "电脑", "照片", "消息", "意见", "答案", "计划", "目标", "任务", "材料", "东西", "办法", "理由", "原因", "问题", "工作", "时间"],
    "activities": ["学习", "练习", "讨论", "解释", "安排", "检查", "帮助", "适应", "减少", "提高", "接受", "继续", "比较", "理解", "知道", "明白", "交流", "参观", "参加", "收拾", "散步", "锻炼"],
    "adjectives": ["好", "大", "小", "高", "低", "快", "慢", "重要", "正确", "安静", "忙", "认真", "清楚", "方便", "普通", "漂亮", "有名", "安全", "紧张", "精彩"],
}


FUNCTION_WORDS = {
    "将", "将要", "不管", "不仅", "并且", "按照", "通过", "为了", "对于", "因为", "所以",
    "虽然", "但是", "或者", "只好", "终于", "另外", "而且", "如果", "直到", "才", "会", "能",
    "要", "可以", "应该", "再说", "后来", "反而", "不如", "比较", "就要", "仅", "仅仅", "尽管",
}


ENGLISH_HINTS = {
    "老师": "teacher",
    "同学": "classmate",
    "朋友": "friend",
    "医生": "doctor",
    "警察": "police officer",
    "教练": "coach",
    "教授": "professor",
    "经理": "manager",
    "学校": "school",
    "家": "home",
    "房间": "room",
    "门口": "door",
    "车站": "station",
    "医院": "hospital",
    "公园": "park",
    "商店": "shop",
    "餐厅": "restaurant",
    "厨房": "kitchen",
    "机场": "airport",
    "城市": "city",
    "国家": "country",
    "世界": "world",
    "郊区": "suburb",
    "路口": "intersection",
    "江边": "riverside",
    "河边": "riverside",
    "书": "book",
    "表格": "form",
    "报告": "report",
    "电话": "phone call",
    "手机": "mobile phone",
    "电脑": "computer",
    "照片": "photo",
    "消息": "message",
    "意见": "opinion",
    "答案": "answer",
    "计划": "plan",
    "目标": "goal",
    "任务": "task",
    "材料": "materials",
    "东西": "thing",
    "办法": "method",
    "理由": "reason",
    "原因": "reason",
    "问题": "problem",
    "工作": "work",
    "时间": "time",
    "文件": "document",
    "地图": "map",
    "画": "picture",
    "米饭": "rice",
    "面包": "bread",
    "苹果": "apple",
    "活动": "activity",
    "要求": "requirement",
    "高山": "mountain",
    "桥": "bridge",
    "老房子": "old building",
    "菜": "vegetables",
    "药": "medicine",
    "叶子": "leaf",
}


def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def display_form_variants(display_form: str) -> list[str]:
    variants: list[str] = []
    for part in ALT_SEPARATOR_RE.split(display_form.strip()):
        cleaned = ANNOTATION_RE.sub("", part).strip()
        if cleaned and cleaned not in variants:
            variants.append(cleaned)
    return variants or [display_form.strip()]


def allowed_dataset_ids_for_level(dataset_id: str, conn: sqlite3.Connection) -> list[str]:
    match = LEVEL_DATASET_RE.match(dataset_id)
    if not match:
        return [dataset_id]

    max_level = int(match.group(1))
    dataset_ids: list[str] = []
    for row in conn.execute("SELECT dataset_id FROM source_datasets ORDER BY dataset_id"):
        candidate = row["dataset_id"]
        candidate_match = LEVEL_DATASET_RE.match(candidate)
        if candidate_match and int(candidate_match.group(1)) <= max_level:
            dataset_ids.append(candidate)
    return dataset_ids or [dataset_id]


def clean_sentence_for_segmentation(sentence: str) -> str:
    return CHINESE_PUNCT_RE.sub("", sentence)


def can_segment_with_lexicon(text: str, lexicon: set[str]) -> bool:
    if not text:
        return True
    max_token_length = max((len(token) for token in lexicon), default=0)
    failed: set[int] = set()

    def dfs(index: int) -> bool:
        if index == len(text):
            return True
        if index in failed:
            return False
        upper = min(len(text), index + max_token_length)
        for end in range(upper, index, -1):
            if text[index:end] in lexicon and dfs(end):
                return True
        failed.add(index)
        return False

    return dfs(0)


def load_lexicon(db_path: str, dataset_id: str) -> set[str]:
    with connect(db_path) as conn:
        datasets = allowed_dataset_ids_for_level(dataset_id, conn)
        placeholders = ",".join("?" for _ in datasets)
        rows = conn.execute(
            f"SELECT display_form FROM source_translation_seeds WHERE dataset_id IN ({placeholders})",
            datasets,
        ).fetchall()
    lexicon: set[str] = set()
    for row in rows:
        for variant in display_form_variants(row["display_form"]):
            lexicon.add(variant)
    for fixed in DISPLAY_FIXES.values():
        lexicon.add(fixed)
    return lexicon


def normalized_form(display_form: str) -> str:
    return DISPLAY_FIXES.get(display_form, display_form)


def choose_present(options: list[str], lexicon: set[str], fallback: str) -> str:
    for option in options:
        if option in lexicon:
            return option
    return fallback


def clean_gloss(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^[\(\[【（]+", "", text)
    text = re.sub(r"[\)\]】）]+$", "", text)
    text = text.replace("(", " ").replace(")", " ")
    text = re.sub(r"\s+", " ", text)
    text = text.strip(" ,;:。")
    return text


def clean_secondary_glosses(glosses: list[str]) -> list[str]:
    result: list[str] = []
    for gloss in glosses:
        cleaned = clean_gloss(gloss)
        if cleaned and cleaned not in result:
            result.append(cleaned)
    return result[:4]


def classify(row: dict) -> str:
    display = normalized_form(row["display_form"])
    pos = row.get("pos", "") or ""
    primary = (row.get("primary_gloss", "") or "").lower()
    secondary = " ".join(row.get("secondary_glosses", []) or []).lower()
    gloss = f"{primary} {secondary}"

    if display in FUNCTION_WORDS:
        return "function"
    if "measure word" in pos:
        return "measure"
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

    if any(k in gloss for k in ["will", "be about to", "to ", "suggest", "accept", "continue", "compare", "enter", "carry out", "prohibit", "experience", "explain", "reduce", "increase", "lower", "save", "check out"]):
        return "verb"
    return "noun"


def make_notes(primary: str, secondaries: list[str], pos: str) -> str:
    label = pos if pos and pos != "unknown" else "word"
    if secondaries:
        return f"Common {label} meaning {primary}. It can also mean {', '.join(secondaries)} in other common contexts."
    return f"Common {label} meaning {primary}."


def ok(sentence: str, lexicon: set[str]) -> bool:
    return can_segment_with_lexicon(clean_sentence_for_segmentation(sentence), lexicon)


def choose_valid_candidates(candidates: list[tuple[str, str, str, int, bool]], lexicon: set[str]) -> list[dict]:
    chosen: list[dict] = []
    seen_sentences: set[str] = set()
    for meaning, sentence, translation, difficulty, is_primary in candidates:
        if sentence in seen_sentences:
            continue
        if not ok(sentence, lexicon):
            continue
        seen_sentences.add(sentence)
        chosen.append(
            {
                "meaning_en": meaning,
                "sentence": sentence,
                "translation": translation,
                "difficulty": difficulty,
                "is_primary": is_primary,
            }
        )
        if len(chosen) == 3:
            break
    return chosen


def rotate_candidates(candidates: list[tuple[str, str, str, int, bool]], rank: int) -> list[tuple[str, str, str, int, bool]]:
    if not candidates:
        return candidates
    offset = rank % len(candidates)
    return candidates[offset:] + candidates[:offset]


def clean_translation_text(text: str) -> str:
    for zh, en in sorted(ENGLISH_HINTS.items(), key=lambda item: len(item[0]), reverse=True):
        text = text.replace(zh, en)
    text = re.sub(r"\bThe I\b", "I", text)
    text = re.sub(r"\bthe I\b", "I", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def level_for_dataset(dataset_id: str) -> int:
    match = LEVEL_DATASET_RE.match(dataset_id)
    if not match:
        return 0
    return int(match.group(1))


def stretch_sentence(sentence: str, translation: str, dataset_level: int, rank: int, slot: int) -> tuple[str, str]:
    prefixes = [
        ("今天在学校里，", "At school today, "),
        ("下课以后，", "After class, "),
        ("今天回家以后，", "After getting home today, "),
    ]
    text = clean_sentence_for_segmentation(sentence)
    threshold = 8 if dataset_level == 3 else 10 if dataset_level >= 4 else 0
    if dataset_level < 3 or len(text) > threshold or "，" in sentence:
        return sentence, translation
    prefix_zh, prefix_en = prefixes[(rank + slot) % len(prefixes)]
    return prefix_zh + sentence, prefix_en + translation[:1].lower() + translation[1:]


def tune_examples_for_progression(examples: list[dict], translations: list[dict], dataset_id: str, rank: int) -> None:
    dataset_level = level_for_dataset(dataset_id)
    translation_map = {item["example_id"]: item for item in translations}
    for slot, example in enumerate(examples, start=1):
        translation_item = translation_map[example["id"]]
        sentence, translation = stretch_sentence(example["sentence"], translation_item["translation"], dataset_level, rank, slot)
        example["sentence"] = sentence
        translation_item["translation"] = clean_translation_text(translation)
        base_difficulty = max(example["difficulty"], 2 if dataset_level >= 3 else 1)
        sentence_length = len(clean_sentence_for_segmentation(sentence))
        if dataset_level >= 4 and (
            (slot == 3 and ("，" in sentence or sentence_length >= 12))
            or (slot == 2 and sentence_length >= 14)
        ):
            base_difficulty = max(base_difficulty, 3)
        elif dataset_level == 3 and slot == 3 and ("，" in sentence or sentence_length >= 11):
            base_difficulty = max(base_difficulty, 3)
        example["difficulty"] = base_difficulty


def special_candidates(display: str, primary: str, secondaries: list[str]) -> list[tuple[str, str, str, int, bool]] | None:
    if display == "教学":
        return [
            ("teaching; instruction", "学校的教学很重要。", "Teaching at school is very important.", 1, True),
            ("teaching; instruction", "老师负责教学工作。", "The teacher is responsible for the teaching work.", 2, False),
            ("teaching; instruction", "这门课的教学安排得很好。", "The teaching arrangement for this class is very good.", 2, False),
        ]
    if display == "教育":
        return [
            ("education", "教育很重要。", "Education is very important.", 1, True),
            ("to educate", "父母要教育孩子。", "Parents need to educate their children.", 1, False),
            ("education", "学校重视教育。", "The school values education.", 1, False),
        ]
    if display == "叫作":
        return [
            ("be called", "这种车叫作出租车。", "This kind of vehicle is called a taxi.", 2, True),
            ("be known as", "这个地方叫作北山。", "This place is known as North Mountain.", 2, False),
            ("be called", "这个节目叫作《早上好》。", "This program is called Good Morning.", 2, False),
        ]
    if display == "竞争":
        return [
            ("to compete", "两家公司在价格上竞争。", "The two companies compete on price.", 2, True),
            ("competition", "他想在比赛里竞争。", "He wants to compete in the contest.", 2, False),
            ("to compete", "为了这个工作，很多人都在竞争。", "Many people are competing for this job.", 2, False),
        ]
    if display == "空":
        return [
            ("empty", "杯子空了。", "The cup is empty.", 2, True),
            ("free", "我今天晚上有空。", "I am free tonight.", 2, False),
            ("empty", "这间教室现在是空的。", "This classroom is empty right now.", 2, False),
        ]
    if display == "乱":
        return [
            ("messy", "他的房间很乱。", "His room is very messy.", 2, True),
            ("in disorder", "桌子上太乱了。", "The desk is far too messy.", 2, False),
            ("chaotic", "下课的时候门口有点乱。", "It gets a little chaotic by the door after class.", 2, False),
        ]
    if display == "入学":
        return [
            ("enter school", "孩子今年九月入学。", "The child starts school this September.", 2, True),
            ("be admitted to school", "她七岁的时候入学了。", "She entered school when she was seven.", 2, False),
            ("school enrollment", "入学以后，他认识了很多朋友。", "After starting school, he met many friends.", 2, False),
        ]
    if display == "实际上":
        return [
            ("actually", "这件事实际上不难。", "This matter is actually not difficult.", 2, True),
            ("in fact", "他看起来很轻松，实际上很紧张。", "He looks relaxed, but in fact he is nervous.", 2, False),
            ("actually", "我们以为他不来，实际上他已经到了。", "We thought he would not come, but actually he had already arrived.", 2, False),
        ]
    if display == "是否":
        return [
            ("whether or not", "我还不知道他是否会来。", "I still do not know whether he will come.", 2, True),
            ("whether", "老师问我们是否准备好了。", "The teacher asked whether we were ready.", 2, False),
            ("whether or not", "这要看你是否同意。", "This depends on whether you agree.", 2, False),
        ]
    if display == "收入":
        return [
            ("income", "他的收入比以前高。", "His income is higher than before.", 2, True),
            ("income", "这份工作的收入很稳定。", "The income from this job is very stable.", 2, False),
            ("earnings", "她想提高自己的收入。", "She wants to increase her own earnings.", 2, False),
        ]
    if display == "说明":
        return [
            ("to explain", "老师说明了这个要求。", "The teacher explained this requirement.", 2, True),
            ("instructions", "请先看说明，再开始做。", "Please read the instructions before you start.", 2, False),
            ("explanation", "他的说明很清楚。", "His explanation is very clear.", 2, False),
        ]
    if display == "口语":
        return [
            ("spoken language", "她的口语进步很快。", "Her spoken Chinese is improving quickly.", 2, True),
            ("oral Chinese", "老师常常练我们的口语。", "The teacher often practices our spoken Chinese with us.", 2, False),
            ("spoken language", "我想先提高口语。", "I want to improve my spoken Chinese first.", 2, False),
        ]
    if display == "街道":
        return [
            ("street", "这条街道很安静。", "This street is very quiet.", 1, True),
            ("street", "街道上有很多车。", "There are many cars on the street.", 1, False),
            ("street", "我们住在街道附近。", "We live near the street.", 2, False),
        ]
    if display == "接受":
        return [
            ("accept", "老师接受了我的建议。", "The teacher accepted my suggestion.", 1, True),
            ("accept", "我接受这个礼物。", "I accept this gift.", 1, False),
            ("accept", "他接受了这个工作。", "He accepted this job.", 2, False),
        ]
    if display == "接着":
        return [
            ("continue", "请接着往下看。", "Please continue reading below.", 1, True),
            ("then", "他说完以后，我接着说。", "After he finished speaking, I spoke next.", 2, False),
            ("next", "他接着做作业。", "Then he continued doing homework.", 1, False),
        ]
    if display == "结果":
        return [
            ("result", "考试结果出来了。", "The exam result came out.", 1, True),
            ("as a result", "他没准备，结果来晚了。", "He was not prepared, and as a result he came late.", 2, False),
            ("outcome", "我们努力了，结果很好。", "We worked hard, and the result was very good.", 2, False),
        ]
    if display == "节假日":
        return [
            ("festivals and holidays", "节假日里车站很忙。", "The station is busy during holidays.", 2, True),
            ("holiday season", "节假日大家都休息。", "Everyone rests during the holidays.", 1, False),
            ("festivals and holidays", "我喜欢节假日。", "I like festivals and holidays.", 1, False),
        ]
    if display == "节约":
        return [
            ("to save", "我们要节约用水。", "We need to save water.", 1, True),
            ("to conserve", "他很节约。", "He is very frugal.", 1, False),
            ("to economize", "节约时间很重要。", "Saving time is very important.", 1, False),
        ]
    if display == "结账":
        return [
            ("to pay the bill", "我们去餐厅结账。", "We went to the restaurant to pay the bill.", 1, True),
            ("to check out", "请先结账。", "Please check out first.", 1, False),
            ("to settle an account", "他们已经结账了。", "They have already settled the bill.", 1, False),
        ]
    if display == "解释":
        return [
            ("to explain", "老师解释了这个问题。", "The teacher explained this problem.", 1, True),
            ("to explain", "你能再解释一次吗？", "Can you explain it once more?", 1, False),
            ("to interpret", "请你解释一下原因。", "Please explain the reason.", 1, False),
        ]
    if display == "今后":
        return [
            ("from now on", "今后我们要更认真。", "From now on, we need to be more serious.", 1, True),
            ("in the future", "今后你也要努力。", "In the future, you must also work hard.", 1, False),
            ("henceforth", "今后我会继续学习。", "Henceforth I will continue studying.", 1, False),
        ]
    if display == "仅":
        return [
            ("only", "我仅有一点时间。", "I only have a little time.", 1, True),
            ("merely", "这本书仅十页。", "This book is merely ten pages long.", 2, False),
            ("solely", "他仅来了一个小时。", "He came for only one hour.", 1, False),
        ]
    if display == "尽管":
        return [
            ("feel free to", "尽管说。", "Feel free to say it.", 1, True),
            ("although", "尽管很忙，我还是来了。", "Although I was very busy, I still came.", 2, False),
            ("even though", "尽管下雨，我们也去了。", "Even though it rained, we still went.", 2, False),
        ]
    if display == "仅仅":
        return [
            ("only", "我仅仅知道这个。", "I only know this.", 1, True),
            ("barely", "他仅仅来了十分钟。", "He only came for ten minutes.", 2, False),
            ("merely", "这只是仅仅一个开始。", "This is merely just the beginning.", 2, False),
        ]
    if display == "紧张":
        return [
            ("nervous", "考试前我很紧张。", "I am nervous before the exam.", 1, True),
            ("tense", "房间里的气氛很紧张。", "The atmosphere in the room is tense.", 2, False),
            ("in short supply", "这个地方座位很紧张。", "Seats are in short supply here.", 2, False),
        ]
    if display == "进入":
        return [
            ("to enter", "请进入房间。", "Please enter the room.", 1, True),
            ("to be admitted to", "学生进入学校。", "The student is admitted to the school.", 1, False),
            ("to access", "他进入了新的阶段。", "He entered a new stage.", 2, False),
        ]
    if display == "进行":
        return [
            ("to carry out", "老师正在进行检查。", "The teacher is carrying out a check.", 2, True),
            ("to conduct", "我们正在进行讨论。", "We are conducting a discussion.", 2, False),
            ("to proceed with", "比赛正在进行。", "The game is in progress.", 1, False),
        ]
    if display == "禁止":
        return [
            ("to prohibit", "这里禁止吸烟。", "Smoking is prohibited here.", 1, True),
            ("to forbid", "学校禁止带手机。", "The school forbids bringing mobile phones.", 2, False),
            ("to ban", "公园里禁止开车。", "Driving is banned in the park.", 2, False),
        ]
    if display == "精彩":
        return [
            ("brilliant", "这个节目很精彩。", "This program is brilliant.", 1, True),
            ("wonderful", "昨天的演出很精彩。", "Yesterday's performance was wonderful.", 1, False),
            ("exciting", "比赛非常精彩。", "The game was very exciting.", 1, False),
        ]
    if display == "经济":
        return [
            ("economy", "中国经济发展很快。", "China's economy develops very quickly.", 2, True),
            ("economical", "这个办法很经济。", "This method is very economical.", 1, False),
            ("economics", "他学经济。", "He studies economics.", 1, False),
        ]
    if display == "京剧":
        return [
            ("Beijing opera", "我喜欢看京剧。", "I like watching Beijing opera.", 1, True),
            ("Beijing opera", "爷爷会唱京剧。", "Grandpa can sing Beijing opera.", 1, False),
            ("Beijing opera", "京剧演员很认真。", "Beijing opera performers are very serious.", 2, False),
        ]
    if display == "经历":
        return [
            ("to experience", "我经历过很多事。", "I have experienced many things.", 1, True),
            ("experience", "他有一次很难的经历。", "He had a very difficult experience.", 2, False),
            ("to go through", "我们一起经历了这件事。", "We went through this matter together.", 2, False),
        ]
    if display == "经验":
        return [
            ("experience", "老师有很多经验。", "The teacher has a lot of experience.", 1, True),
            ("experience", "我没有经验。", "I have no experience.", 1, False),
            ("experience", "这次经验很重要。", "This experience is very important.", 1, False),
        ]
    if display == "警察":
        return [
            ("police", "警察来了。", "The police came.", 1, True),
            ("police", "警察帮助了我。", "The police helped me.", 1, False),
            ("police", "我问了警察。", "I asked the police.", 1, False),
        ]
    return None


def generic_candidates(display: str, primary: str, secondaries: list[str], kind: str, lexicon: set[str]) -> list[tuple[str, str, str, int, bool]]:
    person = choose_present(COMMON["people"], lexicon, "老师")
    place = choose_present(COMMON["places"], lexicon, "学校")
    obj = choose_present(COMMON["objects"], lexicon, "书")
    adjective = choose_present(COMMON["adjectives"], lexicon, "重要")
    activity = choose_present(COMMON["activities"], lexicon, "学习")
    after_school = choose_present(["下课以后", "放学以后", "回家以后"], lexicon, "今天")
    weekend = choose_present(["周末", "今天", "明天"], lexicon, "今天")
    document = choose_present(["文件", "材料", "表格", "报告", "消息"], lexicon, obj)
    picture = choose_present(["照片", "地图", "画"], lexicon, obj)
    food = choose_present(["米饭", "面包", "苹果"], lexicon, obj)
    problem = choose_present(["问题", "计划", "工作", "活动", "要求", "办法"], lexicon, obj)
    gloss = f"{primary} {' '.join(secondaries)}".lower()

    if kind == "noun":
        if any(k in primary.lower() for k in ["river", "city", "country", "road", "street", "room", "station", "park", "hospital", "garden", "forest", "suburb", "area", "place", "exit", "entrance", "intersection"]):
            return [
                (primary, f"{after_school}，我们去{display}看看。", f"After class, we are going to take a look at the {primary}.", 2, True),
                (primary, f"这个{display}离{place}不远。", f"This {primary} is not far from the {place}.", 2, False),
                (primary, f"{weekend}来{display}的人很多。", f"A lot of people come to the {primary} on weekends.", 2, False),
            ]
        if any(k in primary.lower() for k in ["teacher", "doctor", "police", "coach", "professor", "student", "person", "people", "representative", "member"]):
            return [
                (primary, f"那位{display}正在跟{person}说话。", f"That {primary} is talking with the {person}.", 2, True),
                (primary, f"我先去问问那位{display}。", f"I will first go ask that {primary}.", 2, False),
                (primary, f"这个{display}对工作很认真。", f"This {primary} is very serious about work.", 2, False),
            ]
        if any(k in primary.lower() for k in ["map", "photo", "picture", "camera", "mirror", "towel", "sweater", "hat", "document", "report", "message", "newspaper", "glasses", "food", "snack", "gift", "ticket", "password", "new word", "material"]):
            return [
                (primary, f"我把{display}放在桌子上了。", f"I put the {primary} on the table.", 2, True),
                (primary, f"出门以前，别忘了带{display}。", f"Do not forget to bring the {primary} before you leave.", 2, False),
                (primary, f"{person}让我们先看{display}。", f"The {person} asked us to look at the {primary} first.", 2, False),
            ]
        if any(k in primary.lower() for k in ["money", "bonus", "scholarship", "prize", "award", "idea", "plan", "goal", "task", "method", "reason", "problem", "result", "experience", "knowledge", "economy", "education", "score", "grade", "income", "future", "language", "culture", "condition", "pressure", "relationship"]):
            return [
                (primary, f"这个{display}和我们的{problem}有关。", f"This {primary} is related to our {problem}.", 2, True),
                (primary, f"{person}在课上讲了{display}。", f"The {person} talked about the {primary} in class.", 2, False),
                (primary, f"我们先讨论一下{display}。", f"Let us discuss the {primary} first.", 2, False),
            ]
        if any(k in primary.lower() for k in ["father", "mother", "parent", "son", "daughter", "family", "child", "childhood", "friend", "classmate"]):
            return [
                (primary, f"{after_school}，他和{display}一起回家。", f"After class, he went home together with his {primary}.", 2, True),
                (primary, f"照片里的{display}笑得很开心。", f"The {primary} in the photo are smiling happily.", 2, False),
                (primary, f"我们常常听他谈起{display}。", f"We often hear him talk about his {primary}.", 2, False),
            ]
        return [
            (primary, f"这个{display}跟我们的{problem}有关系。", f"This {primary} has something to do with our {problem}.", 2, True),
            (primary, f"{person}在课上讲了{display}。", f"The {person} talked about the {primary} in class.", 2, False),
            (primary, f"我们得先弄清楚{display}。", f"We need to clarify the {primary} first.", 3, False),
        ]

    if kind == "adjective":
        return [
            (primary, f"我觉得这个地方特别{display}。", f"I think this place is especially {primary}.", 2, True),
            (primary, f"今天这里比昨天更{display}了。", f"It feels even more {primary} here today than yesterday.", 2, False),
            (primary, f"大家都说这个地方很{display}。", f"Everyone says this place is very {primary}.", 2, False),
        ]

    if kind == "measure":
        if display == "公里":
            return [
                ("kilometer", f"我家离{place}有五{display}。", f"My home is five kilometers from the {place}.", 2, True),
                ("kilometer", f"我们今天走了三{display}。", "We walked three kilometers today.", 2, False),
                ("kilometer", f"这个地方离车站不到两{display}。", "This place is less than two kilometers from the station.", 2, False),
            ]
        if display in {"克", "千克"}:
            return [
                (primary, f"这袋米有五百{display}。", f"This bag of rice weighs five hundred {primary}.", 2, True),
                (primary, f"这个西瓜有五{display}。", f"This watermelon weighs five {primary}.", 2, False),
                (primary, f"这些菜不到一{display}。", f"These vegetables weigh less than one {primary}.", 2, False),
            ]
        if display == "摄氏度":
            return [
                ("degrees Celsius", f"今天外面有三十{display}。", "It is thirty degrees Celsius outside today.", 2, True),
                ("degrees Celsius", f"夏天这里常常超过三十五{display}。", "In summer, it often goes above thirty-five degrees Celsius here.", 3, False),
                ("degrees Celsius", f"水已经到一百{display}了。", "The water has already reached one hundred degrees Celsius.", 2, False),
            ]
        if display == "份":
            return [
                ("measure word for copies", f"我打印了两{display}{document}。", f"I printed two copies of the {document}.", 2, True),
                ("measure word for servings", f"他想再来一{display}{food}。", f"He wants another serving of {food}.", 2, False),
                ("share", f"这{display}工作在上海。", "This job is in Shanghai.", 2, False),
            ]
        if display == "幅":
            return [
                ("measure word for paintings", f"墙上挂着一{display}{picture}。", f"There is a {picture} hanging on the wall.", 2, True),
                ("measure word for paintings", f"孩子画了一{display}画。", "The child drew a picture.", 2, False),
                ("measure word for paintings", f"教室后面有一{display}照片。", "There is a photo at the back of the classroom.", 2, False),
            ]
        if display == "棵":
            return [
                ("measure word for trees", f"门口有一{display}大树。", "There is a big tree by the door.", 2, True),
                ("measure word for trees", f"公园里种了很多{display}树。", "Many trees have been planted in the park.", 2, False),
                ("measure word for trees", f"那{display}树已经很高了。", "That tree is already very tall.", 2, False),
            ]
        if display == "篇":
            return [
                ("measure word for articles", f"这{display}文章有点长。", "This article is a little long.", 2, True),
                ("measure word for articles", f"{person}让我们写一{display}作文。", f"The {person} asked us to write an essay.", 2, False),
                ("measure word for articles", f"我昨天看了一{display}报道。", "I read a report yesterday.", 2, False),
            ]
        if display == "片":
            return [
                ("slice", f"我早上吃了两{display}面包。", "I ate two slices of bread this morning.", 2, True),
                ("piece", f"桌上有一{display}叶子。", "There is a leaf on the table.", 2, False),
                ("piece", f"{person}让他先吃一{display}药。", f"The {person} told him to take one pill first.", 2, False),
            ]
        if display == "秒":
            return [
                ("second", f"请再等我十{display}。", "Please wait for me another ten seconds.", 2, True),
                ("second", f"他用了三十{display}就跑完了。", "He finished running in thirty seconds.", 2, False),
                ("second", f"只过了几{display}，门就开了。", "Only a few seconds passed before the door opened.", 2, False),
            ]
        if display == "首":
            return [
                ("measure word for songs", f"我会唱一{display}老歌。", "I can sing an old song.", 2, True),
                ("measure word for songs", f"他刚写完一{display}新歌。", "He has just finished writing a new song.", 2, False),
                ("measure word for songs", f"这{display}歌大家都会唱。", "Everyone can sing this song.", 2, False),
            ]
        if display == "组":
            return [
                ("group", f"我们班分成三{display}。", "Our class is divided into three groups.", 2, True),
                ("group", f"那{display}同学已经到了。", "That group of students has already arrived.", 2, False),
                ("group", f"老师让每{display}先讨论。", "The teacher told each group to discuss first.", 2, False),
            ]
        if display == "座":
            return [
                ("measure word for mountains and buildings", f"前面有一{display}高山。", "There is a tall mountain ahead.", 2, True),
                ("measure word for mountains and buildings", f"这{display}桥是新的。", "This bridge is new.", 2, False),
                ("measure word for mountains and buildings", f"{place}后面有一{display}老房子。", f"There is an old building behind the {place}.", 2, False),
            ]
        return [
            (primary, f"这{display}{document}我已经看过了。", f"I have already looked through this {document}.", 2, True),
            (primary, f"{person}让我准备两{display}{document}。", f"The {person} asked me to prepare two {document}s.", 2, False),
            (primary, f"桌上还有一{display}{document}。", f"There is still one {document} left on the table.", 2, False),
        ]

    if kind == "function":
        if display == "将":
            return [
                ("formal marker", "请将书放在桌子上。", "Please put the book on the table.", 2, True),
                ("will; be about to", "我们将去学校。", "We will go to school.", 1, False),
                ("will; be about to", "他将要出发了。", "He is about to set off.", 1, False),
            ]
        if display == "将要":
            return [
                ("will", "我们将要出发。", "We are about to leave.", 1, True),
                ("be going to", "他将要毕业了。", "He is going to graduate soon.", 1, False),
                ("be about to", "天将要下雨了。", "It is about to rain.", 1, False),
            ]
        if display == "不管":
            return [
                ("no matter", "不管天气怎么样，他都会来。", "No matter what the weather is like, he will come.", 1, True),
                ("no matter", "不管多忙，我都要睡觉。", "No matter how busy I am, I still need to sleep.", 1, False),
                ("no matter", "不管你在哪儿，我都会找你。", "No matter where you are, I will find you.", 2, False),
            ]
        if display in {"不仅", "并且"}:
            return [
                ("not only", "他不仅会说中文，还会说英文。", "He can not only speak Chinese, but also English.", 2, True),
                ("not only", "这本书不仅好看，并且很有用。", "This book is not only nice to read but also very useful.", 2, False),
                ("not only", "我们不仅要学习，并且要练习。", "We not only need to study, but also to practice.", 2, False),
            ]
        if display in {"按照", "通过", "为了", "对于", "因为", "所以", "虽然", "但是", "如果", "另外", "而且", "只好", "终于", "比较", "再说"}:
            templates = {
                "按照": [
                    ("according to", "按照老师的要求，我们先写作业。", "According to the teacher's requirements, we do the homework first.", 2, True),
                    ("according to", "我们按照计划出发。", "We leave according to the plan.", 1, False),
                    ("according to", "按照说明做就可以。", "Just do it according to the instructions.", 2, False),
                ],
                "通过": [
                    ("through", "我们通过努力取得进步。", "We make progress through hard work.", 2, True),
                    ("through", "他通过考试了。", "He passed the exam.", 1, False),
                    ("through", "通过这个方法，问题解决了。", "Through this method, the problem was solved.", 2, False),
                ],
                "为了": [
                    ("for the sake of", "为了将来，他很努力。", "For the sake of the future, he works very hard.", 1, True),
                    ("for", "为了健康，我们要多休息。", "For health, we need to rest more.", 1, False),
                    ("in order to", "为了考试，他今天不出去。", "In order to take the exam, he is not going out today.", 2, False),
                ],
                "对于": [
                    ("for; regarding", "对于这个问题，我还不清楚。", "As for this problem, I am still not clear about it.", 2, True),
                    ("for", "对于学生来说，这很重要。", "For students, this is very important.", 2, False),
                    ("about", "对于这个结果，大家都很高兴。", "Everyone is very happy about this result.", 2, False),
                ],
                "因为": [
                    ("because", "因为下雨，我们没出去。", "Because it rained, we did not go out.", 1, True),
                    ("because", "因为我很忙，所以来晚了。", "Because I was busy, I came late.", 2, False),
                    ("because", "因为天气好，大家都很高兴。", "Because the weather is good, everyone is happy.", 1, False),
                ],
                "所以": [
                    ("so", "我很累，所以早点睡了。", "I was very tired, so I went to bed early.", 1, True),
                    ("so", "他来晚了，所以没赶上车。", "He came late, so he missed the bus.", 2, False),
                    ("so", "天气很好，所以我们去散步。", "The weather is nice, so we go for a walk.", 1, False),
                ],
                "虽然": [
                    ("although", "虽然很忙，我还是来了。", "Although I was very busy, I still came.", 2, True),
                    ("although", "虽然下雨，我们也去了。", "Although it rained, we still went.", 2, False),
                    ("although", "虽然很累，他还是继续工作。", "Although he was very tired, he kept working.", 2, False),
                ],
                "但是": [
                    ("but", "我想去，但是没有时间。", "I want to go, but I have no time.", 1, True),
                    ("but", "天气冷，但是很舒服。", "The weather is cold, but it is comfortable.", 1, False),
                    ("but", "他很忙，但是很认真。", "He is busy, but very serious.", 1, False),
                ],
                "如果": [
                    ("if", "如果你有时间，我们一起去。", "If you have time, let's go together.", 1, True),
                    ("if", "如果下雨，我们就在家。", "If it rains, we will stay at home.", 1, False),
                    ("if", "如果你想学，我可以帮你。", "If you want to learn, I can help you.", 2, False),
                ],
                "另外": [
                    ("in addition", "我先写作业，另外再看书。", "I will do my homework first and also read later.", 2, True),
                    ("in addition", "这个房间很大，另外也很安静。", "This room is big, and in addition it is quiet.", 2, False),
                    ("another", "我还有另外一个办法。", "I also have another way.", 1, False),
                ],
                "而且": [
                    ("and also", "他很聪明，而且很认真。", "He is smart and also very serious.", 1, True),
                    ("and also", "这个地方漂亮，而且很安静。", "This place is beautiful and also very quiet.", 1, False),
                    ("and also", "她会中文，而且会英文。", "She speaks Chinese and also English.", 1, False),
                ],
                "只好": [
                    ("have to", "没办法，我们只好等。", "There was no choice, so we had to wait.", 2, True),
                    ("have to", "车走了，我们只好走路。", "The car left, so we had to walk.", 2, False),
                    ("have to", "太晚了，我只好回家。", "It was too late, so I had to go home.", 1, False),
                ],
                "终于": [
                    ("finally", "我们终于到了。", "We finally arrived.", 1, True),
                    ("finally", "他终于写完了作业。", "He finally finished his homework.", 1, False),
                    ("finally", "终于下雨了。", "It finally rained.", 1, False),
                ],
                "比较": [
                    ("relatively", "这件衣服比较便宜。", "This piece of clothing is relatively cheap.", 1, True),
                    ("rather", "我比较喜欢这个。", "I rather like this one.", 2, False),
                    ("more", "他今天来得比较早。", "He came rather early today.", 1, False),
                ],
                "再说": [
                    ("besides", "太晚了，再说我也很累。", "It is too late, and besides I am also very tired.", 2, True),
                    ("besides", "今天不去，再说下周也可以。", "We are not going today; besides, next week is also fine.", 2, False),
                    ("besides", "先回家，再说别的。", "Go home first; we can talk about other things later.", 2, False),
                ],
                "尽管": [
                    ("feel free to", "尽管说。", "Feel free to say it.", 1, True),
                    ("although", "尽管很忙，我还是来了。", "Although I was very busy, I still came.", 2, False),
                    ("even though", "尽管下雨，我们也去了。", "Even though it rained, we still went.", 2, False),
                ],
                "仅": [
                    ("only", "我仅有一点时间。", "I only have a little time.", 1, True),
                    ("merely", "这本书仅十页。", "This book is merely ten pages long.", 2, False),
                    ("solely", "他仅来了一个小时。", "He came for only one hour.", 1, False),
                ],
                "仅仅": [
                    ("only", "我仅仅知道这个。", "I only know this.", 1, True),
                    ("barely", "他仅仅来了十分钟。", "He only came for ten minutes.", 2, False),
                    ("merely", "这只是仅仅一个开始。", "This is merely just the beginning.", 2, False),
                ],
            }
            return templates[display]
        if display == "将":
            return [
                ("will; be about to", "请将书放在桌子上。", "Please put the book on the table.", 2, True),
                ("will; be about to", "我们将去学校。", "We will go to school.", 1, False),
                ("will; be about to", "他将要出发了。", "He is about to set off.", 1, False),
            ]
        if display == "将要":
            return [
                ("will", "我们将要出发。", "We are about to leave.", 1, True),
                ("be going to", "他将要毕业了。", "He is going to graduate soon.", 1, False),
                ("be about to", "天将要下雨了。", "It is about to rain.", 1, False),
            ]
        if display == "会":
            return [
                ("will; be able to", "我会去学校。", "I will go to school.", 1, True),
                ("know how to", "他会写中文。", "He knows how to write Chinese.", 1, False),
                ("likely to", "明天会下雨。", "It will likely rain tomorrow.", 1, False),
            ]
        if display == "能":
            return [
                ("can", "我能帮你。", "I can help you.", 1, True),
                ("be able to", "他今天不能来。", "He cannot come today.", 1, False),
                ("able to", "我们能理解这个问题。", "We can understand this problem.", 2, False),
            ]
        if display == "可以":
            return [
                ("can", "你可以先休息。", "You can rest first.", 1, True),
                ("may", "我可以进去吗？", "May I come in?", 1, False),
                ("can", "这个办法可以。", "This method works.", 1, False),
            ]
        if display == "应该":
            return [
                ("should", "你应该早点睡。", "You should go to bed early.", 1, True),
                ("should", "我们应该继续学习。", "We should continue studying.", 1, False),
                ("should", "他应该知道这个问题。", "He should know this problem.", 1, False),
            ]
        if display == "要":
            return [
                ("need to", "你要先学习。", "You need to study first.", 1, True),
                ("will", "我明天要去学校。", "I am going to school tomorrow.", 1, False),
                ("want to", "他要这个答案。", "He wants this answer.", 1, False),
            ]
        if display == "才":
            return [
                ("only then", "我九点才到家。", "I did not get home until nine o'clock.", 2, True),
                ("only then", "他看了很久才明白。", "He understood only after looking for a long time.", 2, False),
                ("only after", "雨停了才出去。", "Only after the rain stopped did we go out.", 2, False),
            ]
        if display == "后来":
            return [
                ("later", "后来他去了北京。", "Later he went to Beijing.", 2, True),
                ("afterwards", "我们后来又见面了。", "We met again afterwards.", 2, False),
                ("later", "后来大家都明白了。", "Later everyone understood.", 2, False),
            ]
        if display == "反而":
            return [
                ("instead", "我以为会冷，反而很热。", "I thought it would be cold, but instead it was very hot.", 2, True),
                ("on the contrary", "他没生气，反而笑了。", "He was not angry; on the contrary, he laughed.", 2, False),
                ("instead", "我没累，反而更有精神。", "I was not tired; instead I felt more energetic.", 2, False),
            ]
        if display == "不如":
            return [
                ("would rather", "今天太晚了，不如明天再去。", "It is too late today, so we might as well go tomorrow.", 2, True),
                ("not as good as", "这个办法不如那个。", "This method is not as good as that one.", 2, False),
                ("would rather", "不如先休息一下。", "We would rather rest first.", 2, False),
            ]
        if display == "就要":
            return [
                ("be about to", "他就要来了。", "He is about to come.", 1, True),
                ("will soon", "车就要开了。", "The bus is about to leave.", 1, False),
                ("will soon", "天就要黑了。", "It is about to get dark.", 1, False),
            ]
        if display == "于是":
            return [
                ("therefore", "他很忙，于是来晚了。", "He was busy, so he came late.", 2, True),
                ("therefore", "天气不好，于是我们没去。", "The weather was bad, so we did not go.", 1, False),
                ("therefore", "我想休息，于是先回家。", "I wanted to rest, so I went home first.", 2, False),
            ]
        if display == "原来":
            return [
                ("originally", "我原来住在这里。", "I originally lived here.", 1, True),
                ("actually", "原来你在这儿。", "So you were here all along.", 1, False),
                ("as it turned out", "原来他已经知道了。", "As it turned out, he already knew.", 2, False),
            ]
        if display == "再次":
            return [
                ("once again", "请再次检查。", "Please check once again.", 1, True),
                ("once more", "我再次见到他。", "I saw him once more.", 1, False),
                ("again", "老师再次解释了这个问题。", "The teacher explained this problem again.", 2, False),
            ]
        if display == "正好":
            return [
                ("exactly right", "时间正好。", "The timing is exactly right.", 1, True),
                ("just in time", "我们正好赶上车。", "We just made it in time for the bus.", 2, False),
                ("coincidentally", "他正好也在这里。", "Coincidentally, he is here too.", 1, False),
            ]
        if "therefore" in gloss or "thus" in gloss or "consequently" in gloss or "as a result" in gloss:
            return [
                ("therefore", "他很忙，因此来晚了。", "He was busy, therefore he came late.", 2, True),
                ("therefore", "天气不好，因此我们没去。", "The weather was bad, therefore we did not go.", 1, False),
                ("therefore", "我想休息，因此先回家。", "I want to rest, therefore I go home first.", 2, False),
            ]
        if "forever" in gloss or "always" in gloss or "eternity" in gloss:
            return [
                ("forever", "我们永远在一起。", "We will be together forever.", 1, True),
                ("always", "我永远记得你。", "I will always remember you.", 2, False),
                ("forever", "这个朋友永远不会忘记。", "This friend will never be forgotten forever.", 2, False),
            ]
        if "unexpected" in gloss or "unexpectedly" in gloss:
            return [
                ("unexpectedly", "他竟然来了。", "He unexpectedly came.", 1, True),
                ("unexpectedly", "我竟然没看见他。", "I unexpectedly did not see him.", 2, False),
                ("unexpectedly", "今天竟然下雨了。", "It unexpectedly rained today.", 1, False),
            ]
        if "actually" in gloss or "in the end" in gloss or "what on earth" in gloss:
            return [
                ("actually", "你究竟想说什么？", "What on earth do you actually want to say?", 2, True),
                ("actually", "这究竟是什么问题？", "What on earth is this problem exactly?", 2, False),
                ("actually", "事情究竟怎么样了？", "How did things actually turn out?", 2, False),
            ]
        if "precisely" in gloss or "exactly" in gloss:
            return [
                ("exactly", "这就是答案。", "This is exactly the answer.", 1, True),
                ("exactly", "他就是老师。", "He is exactly the teacher.", 1, False),
                ("exactly", "我就是想去。", "I just want to go.", 1, False),
            ]
        if "or" in gloss:
            return [
                ("or", "你或者我去。", "Either you or I will go.", 1, True),
                ("or", "我们明天或者后天去。", "We will go tomorrow or the day after tomorrow.", 1, False),
                ("or", "你想喝茶或者咖啡？", "Do you want tea or coffee?", 1, False),
            ]
        if "then" in gloss or "next" in gloss or "after" in gloss:
            return [
                ("then", "我先吃饭，然后学习。", "I eat first, then study.", 1, True),
                ("then", "他说完以后我才说。", "Only after he finished speaking did I speak.", 2, False),
                ("then", "大家接着往下看。", "Everyone then kept reading below.", 1, False),
            ]
        return [
            (primary, f"{after_school}，他{display}来找我们。", f"After class, he {primary} came to find us.", 2, True),
            (primary, f"我现在{display}知道该怎么做了。", f"I now {primary} know what to do.", 2, False),
            (primary, f"这件事{display}和我们的计划有关。", f"This matter {primary} is related to our plan.", 2, False),
        ]

    if kind == "verb":
        if any(k in primary.lower() for k in ["reduce", "decrease", "lower", "save", "economize"]):
            return [
                (primary, "老师让我们减少浪费。", "The teacher told us to reduce waste.", 1, True),
                (secondaries[0] if secondaries else primary, "我想减少零食。", "I want to cut down on snacks.", 1, False),
                (secondaries[1] if len(secondaries) > 1 else primary, "我们应该减少作业。", "We should decrease the amount of homework.", 2, False),
            ]
        if any(k in primary.lower() for k in ["suggest", "recommend", "advice"]):
            return [
                (primary, "老师建议我早点休息。", "The teacher suggested that I rest early.", 2, True),
                (secondaries[0] if secondaries else primary, "我给你一个建议。", "I have a suggestion for you.", 1, False),
                (secondaries[1] if len(secondaries) > 1 else primary, "我建议你先看报告。", "I recommend that you read the report first.", 2, False),
            ]
        if any(k in primary.lower() for k in ["accept", "receive"]):
            return [
                (primary, "老师接受了我的建议。", "The teacher accepted my suggestion.", 1, True),
                (primary, "我接受这个礼物。", "I accept this gift.", 1, False),
                (primary, "他接受了这个工作。", "He accepted this job.", 2, False),
            ]
        if any(k in primary.lower() for k in ["continue", "follow", "then", "next", "subsequently"]):
            return [
                (primary, "请接着往下看。", "Please continue reading below.", 1, True),
                (primary, "他说完以后，我接着说。", "After he finished speaking, I spoke next.", 2, False),
                (primary, "他接着做作业。", "Then he continued doing homework.", 1, False),
            ]
        if any(k in primary.lower() for k in ["compare", "compete", "competition"]):
            return [
                (primary, "我们比较一下两个办法。", "Let's compare the two methods.", 2, True),
                (primary, "这两个计划很难比较。", "These two plans are hard to compare.", 2, False),
                (primary, "他们在比赛里竞争。", "They compete in the competition.", 2, False),
            ]
        if any(k in primary.lower() for k in ["enter", "access", "admit"]):
            return [
                (primary, "请进入房间。", "Please enter the room.", 1, True),
                (primary, "学生进入学校。", "The students enter the school.", 1, False),
                (primary, "他进入了新的阶段。", "He entered a new stage.", 2, False),
            ]
        if any(k in primary.lower() for k in ["carry out", "conduct", "proceed"]):
            return [
                (primary, "老师正在进行检查。", "The teacher is carrying out a check.", 2, True),
                (primary, "我们正在进行讨论。", "We are conducting a discussion.", 2, False),
                (primary, "比赛正在进行。", "The game is in progress.", 1, False),
            ]
        if any(k in primary.lower() for k in ["prohibit", "forbid", "ban"]):
            return [
                (primary, "这里禁止吸烟。", "Smoking is prohibited here.", 1, True),
                (primary, "学校禁止带手机。", "The school forbids bringing mobile phones.", 2, False),
                (primary, "公园里禁止开车。", "Driving is banned in the park.", 2, False),
            ]
        if any(k in primary.lower() for k in ["explain", "interpret", "account for"]):
            return [
                (primary, "老师解释了这个问题。", "The teacher explained this problem.", 1, True),
                (primary, "你能再解释一次吗？", "Can you explain it once more?", 1, False),
                (primary, "请你解释一下原因。", "Please explain the reason.", 1, False),
            ]
        if any(k in primary.lower() for k in ["experience", "go through"]):
            return [
                (primary, "我经历过很多事。", "I have experienced many things.", 1, True),
                (secondaries[0] if secondaries else primary, "他有一次很难的经历。", "He had a very difficult experience.", 2, False),
                (primary, "我们一起经历了这件事。", "We went through this matter together.", 2, False),
            ]
        return [
            (primary, f"为了这个{problem}，我们得先{display}。", f"For this {problem}, we need to {primary} first.", 2, True),
            (secondaries[0] if secondaries else primary, f"{after_school}，他还在想怎么{display}。", f"After class, he was still thinking about how to {primary}.", 2, False),
            (secondaries[1] if len(secondaries) > 1 else primary, f"老师让我们先{display}{problem}。", f"The teacher asked us to {primary} the {problem} first.", 3, False),
        ]

    return [
        (primary, f"这个{display}和我们的{problem}有关。", f"This {primary} is related to our {problem}.", 2, True),
        (primary, f"{person}在课上讲了{display}。", f"The {person} talked about the {primary} in class.", 2, False),
        (primary, f"我们先讨论一下{display}。", f"Let us discuss the {primary} first.", 2, False),
    ]


def build_payload(row: dict, lexicon: set[str], source_name: str) -> dict:
    display = normalized_form(row["display_form"])
    primary = clean_gloss(row["primary_gloss"])
    secondaries = clean_secondary_glosses(row.get("secondary_glosses", []))
    kind = classify(row)
    pos = row.get("pos", "unknown")

    candidates = special_candidates(display, primary, secondaries)
    if candidates is None:
        candidates = generic_candidates(display, primary, secondaries, kind, lexicon)
    candidates = rotate_candidates(candidates, row["rank"])

    chosen = choose_valid_candidates(candidates, lexicon)
    if len(chosen) != 3:
        fallback = [
            (primary, f"今天我们在课上学了{display}。", f"Today we learned about {primary} in class.", 2, True),
            (primary, f"{display}和我们的计划有关系。", f"{primary} is related to our plan.", 2, False),
            (primary, f"老师让我们先讨论{display}。", f"The teacher asked us to discuss {primary} first.", 2, False),
        ]
        chosen = choose_valid_candidates(candidates + fallback, lexicon)
    if len(chosen) != 3:
        raise RuntimeError(f"{row['word_id']}: unable to generate 3 valid examples")

    if sum(1 for item in chosen if item["is_primary"]) != 1:
        chosen[0]["is_primary"] = True
        for item in chosen[1:]:
            item["is_primary"] = False

    examples = []
    translations = []
    for idx, item in enumerate(chosen, start=1):
        ex_id = f"{row['word_id']}-ex{idx}"
        examples.append(
            {
                "id": ex_id,
                "meaning_en": item["meaning_en"],
                "sentence": item["sentence"],
                "difficulty": item["difficulty"],
                "source": source_name,
                "is_primary": item["is_primary"],
            }
        )
        translations.append({"example_id": ex_id, "translation": item["translation"]})

    tune_examples_for_progression(examples, translations, row["dataset_id"], row["rank"])

    return {
        "word": {
            "id": row["word_id"],
            "lang": "zh",
            "lemma": display,
            "display_form": display,
            "pos": row["pos"],
            "rank": row["rank"],
            "pronunciation": row["pronunciation"],
        },
        "glosses": {
            "primary_gloss": primary,
            "secondary_glosses": secondaries,
            "notes": make_notes(primary, secondaries[:2], pos),
        },
        "examples": examples,
        "example_translations": translations,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a single HSK4 batch JSONL.")
    parser.add_argument("batch_file", help="Input batch manifest JSON file.")
    parser.add_argument("output_file", help="Output JSONL file.")
    parser.add_argument("--db-path", default=str(DEFAULT_DB_PATH))
    parser.add_argument("--source-name", default="generator-2")
    args = parser.parse_args()

    batch_file = args.batch_file
    output_file = args.output_file
    output_dir = os.path.dirname(output_file)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(batch_file, encoding="utf-8") as fh:
        rows = json.load(fh)
    dataset_id = rows[0]["dataset_id"]
    db_path = args.db_path
    lexicon = load_lexicon(db_path, dataset_id)
    payloads = [build_payload(row, lexicon, args.source_name) for row in rows]

    with open(output_file, "w", encoding="utf-8") as fh:
        for payload in payloads:
            fh.write(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    main()
