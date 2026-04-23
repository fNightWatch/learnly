#!/usr/bin/env python3

import hashlib
import json
import os
import re
import sqlite3
import sys


ROOT = os.getcwd()
if os.path.basename(ROOT) != "corpus-generation":
    ROOT = "/Users/moi/Desktop/business/learnly/corpus-generation"

ALT_SEPARATOR_RE = re.compile(r"\s*[｜|/]\s*")
ANNOTATION_RE = re.compile(r"（[^）]*）")
CHINESE_PUNCT_RE = re.compile(r"[，。！？；：、“”‘’（）《》〈〉【】—…·\s,.!?;:\"'()\[\]{}-]+")
LEVEL_DATASET_RE = re.compile(r"^new-hsk-(\d+)-words$")
DISPLAY_FIXES = {"出又": "出口", "又语": "口语", "入又": "入口", "十字路又": "十字路口"}
PROGRESSION_SOURCE_RE = re.compile(r"^progression-(natural|balanced)-")
QUESTION_WRAPPER_RE = re.compile(r"^我现在(?:只想)?(?:先)?(?:认真)?问你(?:一个问题|一句)，")
LATER_WRAPPER_RE = re.compile(r"^后来大家才(?:知道|看到|觉得)，")
TEACHER_WRAPPER_RE = re.compile(r"^老师(?:已经)?说过，请")
CLASS_WRAPPER_RE = re.compile(r"^上课的时候，老师(?:早就|之前已经|刚才已经|已经|之前|刚才)?(?:认真)?说过，")
LATER_EN_RE = re.compile(r"^Later everyone(?: gradually)? came to (?:feel|see|know) that ", re.IGNORECASE)
TEACHER_EN_RE = re.compile(r'^The teacher(?: already)? said, "(.*)"$', re.IGNORECASE)
CLASS_EN_RE = re.compile(
    r"^During class, the teacher(?: had)?(?: already)?(?: carefully)?(?: said|explained) that ",
    re.IGNORECASE,
)
DESCRIPTIVE_MARKERS = (
    "很",
    "更",
    "太",
    "真",
    "特别",
    "重要",
    "方便",
    "严格",
    "清楚",
    "普通",
    "美",
    "美丽",
    "漂亮",
    "热闹",
    "安静",
    "安全",
    "舒服",
    "高兴",
    "开心",
    "快乐",
    "合适",
    "正常",
    "清闲",
    "有名",
    "有爱心",
)
ACTION_MARKERS = (
    "了",
    "正在",
    "已经",
    "过",
    "安排",
    "安装",
    "帮助",
    "排队",
    "见面",
    "买",
    "卖",
    "放",
    "开",
    "关",
    "走",
    "来",
    "去",
    "回",
    "拿",
    "送",
    "找",
    "坐",
    "站",
    "穿",
    "做",
    "用",
    "吃",
    "喝",
    "按了一下",
    "把",
)
INTERJECTION_PREFIXES = ("啊", "哦", "哎", "原来", "呀")


def connect(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def display_form_variants(display_form):
    variants = []
    for part in ALT_SEPARATOR_RE.split(display_form.strip()):
        cleaned = ANNOTATION_RE.sub("", part).strip()
        cleaned = DISPLAY_FIXES.get(cleaned, cleaned)
        if cleaned and cleaned not in variants:
            variants.append(cleaned)
    return variants or [DISPLAY_FIXES.get(display_form.strip(), display_form.strip())]


def allowed_dataset_ids_for_level(dataset_id, conn):
    match = LEVEL_DATASET_RE.match(dataset_id)
    if not match:
        return [dataset_id]
    max_level = int(match.group(1))
    dataset_ids = []
    for row in conn.execute("SELECT dataset_id FROM source_datasets ORDER BY dataset_id"):
        candidate = row["dataset_id"]
        candidate_match = LEVEL_DATASET_RE.match(candidate)
        if candidate_match and int(candidate_match.group(1)) <= max_level:
            dataset_ids.append(candidate)
    return dataset_ids or [dataset_id]


def build_allowed_lexicon(dataset_id, conn):
    dataset_ids = allowed_dataset_ids_for_level(dataset_id, conn)
    placeholders = ",".join("?" for _ in dataset_ids)
    rows = conn.execute(
        f"SELECT display_form FROM source_translation_seeds WHERE dataset_id IN ({placeholders})",
        dataset_ids,
    ).fetchall()
    lexicon = set()
    for row in rows:
        for variant in display_form_variants(row["display_form"]):
            lexicon.add(variant)
    for fixed in DISPLAY_FIXES.values():
        lexicon.add(fixed)
    return lexicon


def clean_sentence_for_segmentation(sentence):
    return CHINESE_PUNCT_RE.sub("", sentence)


def can_segment_with_lexicon(text, lexicon):
    if not text:
        return True
    max_token_length = max((len(token) for token in lexicon), default=0)
    failed = set()

    def dfs(index):
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


def sentence_len(sentence):
    return len(clean_sentence_for_segmentation(sentence))


def lower_first(text):
    if not text:
        return text
    if text.startswith("I "):
        return text
    return text[:1].lower() + text[1:]


def contains_any(text, markers):
    return any(marker in text for marker in markers)


def stable_index(key, mod):
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % mod if mod else 0


def normalize_base_sentence(sentence):
    text = sentence.strip()
    if QUESTION_WRAPPER_RE.match(text):
        text = QUESTION_WRAPPER_RE.sub("", text, count=1)
    elif TEACHER_WRAPPER_RE.match(text):
        text = TEACHER_WRAPPER_RE.sub("请", text, count=1)
    elif CLASS_WRAPPER_RE.match(text):
        text = CLASS_WRAPPER_RE.sub("", text, count=1)
    elif LATER_WRAPPER_RE.match(text):
        text = LATER_WRAPPER_RE.sub("", text, count=1)
        if text.startswith("原来"):
            text = text[2:]
    text = text.strip()
    return text


def normalize_base_translation(translation):
    text = translation.strip()
    text = LATER_EN_RE.sub("", text, count=1)
    teacher_match = TEACHER_EN_RE.match(text)
    if teacher_match:
        text = teacher_match.group(1)
    text = CLASS_EN_RE.sub("", text, count=1)
    text = text.replace("Please please ", "Please ")
    text = text.replace("please please ", "please ")
    return text.strip()


def strip_please(text):
    return re.sub(r"^please\s+", "", text, flags=re.IGNORECASE).strip()


def without_terminal_punct(text):
    return re.sub(r"[。！？.!?]+$", "", text)


def classify_sentence(base_sentence):
    if base_sentence.endswith("？"):
        return "question"
    if base_sentence.startswith(("请", "按照", "按", "别", "不要", "先")):
        return "imperative"
    if base_sentence.startswith(INTERJECTION_PREFIXES):
        return "speech"
    if contains_any(base_sentence, DESCRIPTIVE_MARKERS) and not contains_any(base_sentence, ACTION_MARKERS):
        return "descriptive"
    if contains_any(base_sentence, DESCRIPTIVE_MARKERS):
        return "descriptive"
    if contains_any(base_sentence, ACTION_MARKERS):
        return "action"
    return "statement"


def statement_templates(level):
    templates = [
        ("很多人都知道，{base}", "Many people know that {base_en}"),
        ("说到这件事，大家都明白，{base}", "When this comes up, everyone understands that {base_en}"),
        ("认真想一想就知道，{base}", "If you think about it carefully, you can tell that {base_en}"),
        ("后来大家都发现，{base}", "Later everyone realized that {base_en}"),
        ("听他这么一说，大家都知道，{base}", "After hearing him say that, everyone knew that {base_en}"),
        ("从这件事里也能看出来，{base}", "You can see from this that {base_en}"),
        ("说到这件事的时候，大家都明白，{base}", "When this comes up, everyone understands that {base_en}"),
        ("后来认真想一想就会发现，{base}", "If you think it over afterward, you realize that {base_en}"),
    ]
    if level >= 4:
        templates.extend(
            [
                ("从大家刚才说的话里就能听出来，{base}", "You can hear from what everyone was saying just now that {base_en}"),
                ("老师后来也提过，{base}", "The teacher also mentioned later that {base_en}"),
            ]
        )
    return templates


def descriptive_templates(level):
    templates = [
        ("很多人都觉得，{base}", "Many people think that {base_en}"),
        ("在大家看来，{base}", "In everyone's view, {base_en}"),
        ("跟以前比，{base}", "Compared with before, {base_en}"),
        ("认真看一看就知道，{base}", "You can tell after taking a close look that {base_en}"),
        ("说到这件事，很多人都觉得，{base}", "When this comes up, many people think that {base_en}"),
        ("后来大家都明白，{base}", "Later everyone understood that {base_en}"),
        ("听他这么一说，我才知道，{base}", "After hearing him say that, I realized that {base_en}"),
        ("到了那边以后，大家都觉得，{base}", "After getting there, everyone felt that {base_en}"),
        ("说到这个问题的时候，很多人都觉得，{base}", "When this question comes up, many people think that {base_en}"),
        ("从大家刚才说的话看，{base}", "From what everyone was saying just now, {base_en}"),
    ]
    if level >= 4:
        templates.extend(
            [
                ("跟以前的情况比，{base}", "Compared with how it was before, {base_en}"),
                ("大家认真看过以后发现，{base}", "After looking at it carefully, everyone realized that {base_en}"),
                ("从大家刚才说的话里就能感觉到，{base}", "You can feel from what everyone was saying just now that {base_en}"),
            ]
        )
    return templates


def action_templates(level):
    templates = [
        ("大家都看得很清楚，{base}", "Everyone could see clearly that {base_en}"),
        ("我刚过去就发现，{base}", "As soon as I went over, I realized that {base_en}"),
        ("大家一进门就看见，{base}", "As soon as everyone walked in, they saw that {base_en}"),
        ("后来仔细一看，{base}", "Looking carefully later, we saw that {base_en}"),
        ("到那边以后才发现，{base}", "Only after getting there did we realize that {base_en}"),
        ("事情发生的时候，{base}", "When it happened, {base_en}"),
        ("我回来的时候，{base}", "When I came back, {base_en}"),
        ("刚才大家都看见了，{base}", "Everyone saw just now that {base_en}"),
        ("大家走进去一看，马上发现，{base}", "Once everyone walked in and looked, they immediately realized that {base_en}"),
        ("我刚走过去的时候就发现，{base}", "The moment I walked over, I realized that {base_en}"),
        ("后来回头再一看，才发现，{base}", "When we looked back later, we realized that {base_en}"),
    ]
    if level >= 4:
        templates.extend(
            [
                ("到那个地方以后，大家才发现，{base}", "Only after getting to that place did everyone realize that {base_en}"),
                ("大家刚走进去的时候就发现，{base}", "The moment everyone walked in, they realized that {base_en}"),
            ]
        )
    return templates


def question_templates(level):
    templates = [
        ("这件事我想了很久，还是想问你，{base}", "I've thought about this for a long time, and I still want to ask you: {base_en}"),
        ("刚才听大家这么一说，我想问你，{base}", "After hearing everyone talk about it just now, I want to ask you: {base_en}"),
        ("我一直没太明白，所以想问你，{base}", "I still haven't understood it very well, so I want to ask you: {base_en}"),
        ("看了半天以后，我还是想问你，{base}", "After looking at it for quite a while, I still want to ask you: {base_en}"),
        ("说到这里的时候，我想问你，{base}", "Now that we've come to this point, I want to ask you: {base_en}"),
        ("我刚想到这个问题，想问你，{base}", "I just thought of this question and want to ask you: {base_en}"),
    ]
    if level >= 4:
        templates.extend(
            [
                ("这件事我前后想了很久，还是想问你，{base}", "I've gone over this for a long time and still want to ask you: {base_en}"),
                ("刚才听大家认真说了半天，我还是想问你，{base}", "After listening to everyone talk it through just now, I still want to ask you: {base_en}"),
                ("看到这里的时候，我忽然想问你，{base}", "At this point, I suddenly want to ask you: {base_en}"),
            ]
        )
    return templates


def imperative_templates(level):
    templates = [
        ("如果你现在有时间，请{rest}。", "If you have time now, please {rest_en}."),
        ("大家都准备好了以后，请{rest}。", "After everyone is ready, please {rest_en}."),
        ("老师刚才已经提醒过了，请{rest}。", "The teacher reminded us just now, so please {rest_en}."),
        ("看清楚上面的要求以后，请{rest}。", "After you read the instructions clearly, please {rest_en}."),
        ("开始以前，请{rest}。", "Before you start, please {rest_en}."),
        ("到了那边以后，请{rest}。", "After you get there, please {rest_en}."),
    ]
    if level >= 4:
        templates.extend(
            [
                ("如果你这会儿方便，请{rest}。", "If it's convenient for you right now, please {rest_en}."),
                ("事情都准备好以后，请{rest}。", "After everything is ready, please {rest_en}."),
            ]
        )
    return templates


def speech_templates(level):
    templates = [
        ("听到这个消息以后，我就说，{base}", 'After hearing the news, I said, "{base_en}"'),
        ("看到他进门的时候，我就说，{base}", 'When I saw him come in, I said, "{base_en}"'),
        ("刚明白过来，我就说，{base}", 'As soon as I understood it, I said, "{base_en}"'),
        ("事情说到这里，我就说，{base}", 'When it got to this point, I said, "{base_en}"'),
        ("大家一下安静下来，我才说，{base}", 'When everyone suddenly quieted down, I said, "{base_en}"'),
    ]
    if level >= 4:
        templates.extend(
            [
                ("听他说完以后，我才说，{base}", 'After hearing him finish, I said, "{base_en}"'),
                ("刚反应过来的时候，我就说，{base}", 'The moment I realized it, I said, "{base_en}"'),
            ]
        )
    return templates


def build_candidates(row, dataset_id):
    level = int(LEVEL_DATASET_RE.match(dataset_id).group(1))
    base_sentence = normalize_base_sentence(row["sentence"])
    base_translation = normalize_base_translation(row["translation"])
    category = classify_sentence(base_sentence)
    candidates = []
    base_en = lower_first(base_translation)
    seed_key = f"{row['id']}|{row['rank']}|{base_sentence}"

    if category == "question":
        for zh_template, en_template in question_templates(level):
            candidates.append(
                (
                    zh_template.format(base=base_sentence),
                    en_template.format(base_en=base_translation),
                    2 if level == 3 else 3,
                )
            )
    elif category == "imperative":
        if base_sentence.startswith("请"):
            rest = without_terminal_punct(base_sentence[1:])
        else:
            rest = without_terminal_punct(base_sentence)
        rest_en = lower_first(strip_please(without_terminal_punct(base_translation)))
        for zh_template, en_template in imperative_templates(level):
            candidates.append(
                (
                    zh_template.format(rest=rest),
                    en_template.format(rest_en=rest_en),
                    2 if level == 3 else 3,
                )
            )
    elif category == "speech":
        for zh_template, en_template in speech_templates(level):
            candidates.append(
                (
                    zh_template.format(base=base_sentence),
                    en_template.format(base_en=base_translation),
                    2 if level == 3 else 3,
                )
            )
    elif category == "statement":
        for zh_template, en_template in statement_templates(level):
            candidates.append(
                (
                    zh_template.format(base=base_sentence),
                    en_template.format(base_en=base_en),
                    2 if level == 3 else 3,
                )
            )
    elif category == "descriptive":
        for zh_template, en_template in descriptive_templates(level):
            candidates.append(
                (
                    zh_template.format(base=base_sentence),
                    en_template.format(base_en=base_en),
                    2 if level == 3 else 3,
                )
            )
    else:
        for zh_template, en_template in action_templates(level):
            candidates.append(
                (
                    zh_template.format(base=base_sentence),
                    en_template.format(base_en=base_en),
                    2 if level == 3 else 3,
                )
            )

    if category not in ("question", "imperative", "speech"):
        candidates.append((base_sentence, base_translation, 2 if level == 3 else 3))

    offset = stable_index(seed_key, len(candidates))
    ordered = candidates[offset:] + candidates[:offset]
    return ordered, category, base_sentence, base_translation


def choose_rewrite(row, dataset_id, lexicon):
    candidates, category, base_sentence, base_translation = build_candidates(row, dataset_id)
    target = 17.2 if dataset_id == "new-hsk-3-words" else 18.2
    low = 16 if dataset_id == "new-hsk-3-words" else 17
    high = 18 if dataset_id == "new-hsk-3-words" else 20

    valid = []
    for sentence, translation, difficulty in candidates:
        if not can_segment_with_lexicon(clean_sentence_for_segmentation(sentence), lexicon):
            continue
        valid.append((sentence, translation, difficulty))

    if not valid:
        return base_sentence, base_translation, row["difficulty"], category

    for sentence, translation, difficulty in valid:
        if low <= sentence_len(sentence) <= high:
            return sentence, translation, difficulty, category

    scored = sorted(valid, key=lambda item: (abs(sentence_len(item[0]) - target), sentence_len(item[0])))
    sentence, translation, difficulty = scored[0]
    return sentence, translation, difficulty, category


def fetch_rows(db_path, dataset_id):
    prefix = dataset_id[:-len("-words")] + "-%"
    conn = connect(db_path)
    rows = conn.execute(
        """
        SELECT e.id, e.word_id, e.sentence, e.translation, e.difficulty, e.source, w.rank, w.display_form
        FROM examples e
        JOIN words w ON w.id = e.word_id
        WHERE w.id LIKE ? AND e.source LIKE 'progression-%'
        ORDER BY w.rank, e.id
        """,
        (prefix,),
    ).fetchall()
    lexicon = build_allowed_lexicon(dataset_id, conn)
    conn.close()
    filtered = [dict(row) for row in rows if PROGRESSION_SOURCE_RE.match(row["source"])]
    return filtered, lexicon


def metric_summary(rows):
    if not rows:
        return {"example_count": 0, "avg_chars": 0.0, "avg_difficulty": 0.0}
    lengths = [sentence_len(row["sentence"]) for row in rows]
    diffs = [row["difficulty"] for row in rows]
    return {
        "example_count": len(rows),
        "avg_chars": round(sum(lengths) / len(lengths), 4),
        "avg_difficulty": round(sum(diffs) / len(diffs), 4),
    }


def preview(dataset_id, db_path):
    rows, lexicon = fetch_rows(db_path, dataset_id)
    rewritten = []
    samples = []
    for row in rows:
        sentence, translation, difficulty, category = choose_rewrite(row, dataset_id, lexicon)
        rewritten.append({"sentence": sentence, "difficulty": difficulty})
        if len(samples) < 18 and sentence != row["sentence"]:
            samples.append(
                {
                    "id": row["id"],
                    "category": category,
                    "old_sentence": row["sentence"],
                    "new_sentence": sentence,
                    "old_translation": row["translation"],
                    "new_translation": translation,
                }
            )
    print(
        json.dumps(
            {
                "dataset_id": dataset_id,
                "rows": len(rows),
                "before": metric_summary(rows),
                "after": metric_summary(rewritten),
                "samples": samples,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def apply(dataset_id, db_path):
    rows, lexicon = fetch_rows(db_path, dataset_id)
    source_label = f"progression-balanced-{dataset_id[:-6]}"
    updates = []
    for row in rows:
        sentence, translation, difficulty, _category = choose_rewrite(row, dataset_id, lexicon)
        updates.append((sentence, translation, difficulty, source_label, row["id"]))

    conn = connect(db_path)
    try:
        conn.execute("BEGIN")
        for sentence, translation, difficulty, source, example_id in updates:
            conn.execute(
                "UPDATE examples SET sentence = ?, translation = ?, difficulty = ?, source = ? WHERE id = ?",
                (sentence, translation, difficulty, source, example_id),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    conn = connect(db_path)
    rows = conn.execute(
        """
        SELECT e.sentence, e.difficulty
        FROM examples e
        JOIN words w ON w.id = e.word_id
        WHERE w.id LIKE ?
        """,
        (dataset_id[:-len("-words")] + "-%",),
    ).fetchall()
    conn.close()
    print(json.dumps({"dataset_id": dataset_id, "after": metric_summary([dict(row) for row in rows])}, ensure_ascii=False, indent=2))


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: naturalize_hsk_progression.py preview-hsk3|apply-hsk3|preview-hsk4|apply-hsk4")
    command = sys.argv[1]
    if command == "preview-hsk3":
        preview("new-hsk-3-words", os.path.join(ROOT, "corpus-hsk-3.sqlite"))
    elif command == "apply-hsk3":
        apply("new-hsk-3-words", os.path.join(ROOT, "corpus-hsk-3.sqlite"))
    elif command == "preview-hsk4":
        preview("new-hsk-4-words", os.path.join(ROOT, "corpus-hsk-4.sqlite"))
    elif command == "apply-hsk4":
        apply("new-hsk-4-words", os.path.join(ROOT, "corpus-hsk-4.sqlite"))
    else:
        raise SystemExit(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
