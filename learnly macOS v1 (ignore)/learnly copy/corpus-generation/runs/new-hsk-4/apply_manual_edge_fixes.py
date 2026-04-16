#!/usr/bin/env python3

import json
import sqlite3
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DB_PATH = ROOT / "corpus-hsk-4.sqlite"
OUTPUT_PATH = ROOT / "runs" / "new-hsk-4" / "manual-edge-fixes.jsonl"


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def build_notes(primary_gloss: str, secondary_glosses: list[str], pos: str) -> str:
    label = pos if pos and pos != "unknown" else "word"
    if secondary_glosses:
        return (
            f"Common {label} meaning {primary_gloss}. "
            f"It can also mean {', '.join(secondary_glosses)} in other common contexts."
        )
    return f"Common {label} meaning {primary_gloss}."


FIXES = {
    "new-hsk-4-0042": {
        "primary_gloss": "PhD; doctorate holder",
        "secondary_glosses": ["doctorate"],
        "examples": [
            ("PhD; doctorate holder", "他在大学读博士。", "He is studying for a PhD at the university.", 2, True),
            ("doctorate holder", "她想读博士。", "She wants to study for a doctorate.", 2, False),
            ("PhD; doctorate holder", "那位博士在大学教书。", "That PhD teaches at a university.", 2, False),
        ],
    },
    "new-hsk-4-0048": {
        "primary_gloss": "no matter",
        "secondary_glosses": ["regardless of"],
        "examples": [
            ("no matter", "不论你去不去，我都支持你。", "Whether you go or not, I will support you.", 2, True),
            ("regardless of", "不论结果好坏，我们都接受。", "No matter whether the result is good or bad, we will accept it.", 2, False),
            ("no matter", "不论路多远，他都想去。", "No matter how far the road is, he still wants to go.", 2, False),
        ],
    },
    "new-hsk-4-0050": {
        "primary_gloss": "department",
        "secondary_glosses": ["measure word for films and machines", "part"],
        "examples": [
            ("department", "他在服务部工作。", "He works in the service department.", 2, True),
            ("measure word for films and machines", "这部电影很感人。", "This movie is very moving.", 2, False),
            ("part", "这本书分成三部。", "This book is divided into three parts.", 2, False),
        ],
    },
    "new-hsk-4-0053": {
        "primary_gloss": "no matter",
        "secondary_glosses": ["regardless of"],
        "examples": [
            ("no matter", "不管下不下雨，我们都出门。", "Rain or shine, we will go out.", 2, True),
            ("regardless of", "不管他来不来，我都去。", "Whether he comes or not, I am going anyway.", 2, False),
            ("no matter", "不管多晚，她都等我。", "No matter how late it gets, she waits for me.", 2, False),
        ],
    },
    "new-hsk-4-0057": {
        "primary_gloss": "department",
        "secondary_glosses": ["division"],
        "examples": [
            ("department", "我在市场部门工作。", "I work in the marketing department.", 2, True),
            ("division", "这个部门负责服务工作。", "This division is responsible for service work.", 2, False),
            ("department", "两个部门明天一起开会。", "The two departments are having a meeting together tomorrow.", 2, False),
        ],
    },
    "new-hsk-4-0086": {
        "primary_gloss": "again",
        "secondary_glosses": ["repeat"],
        "examples": [
            ("again", "这句话请重说一遍。", "Please say this sentence again.", 2, True),
            ("repeat", "这封信我要重写。", "I need to rewrite this letter.", 2, False),
            ("again", "这道题做错了，要重做。", "This problem was done wrong, so it needs to be redone.", 2, False),
        ],
    },
    "new-hsk-4-0087": {
        "primary_gloss": "again",
        "secondary_glosses": ["anew"],
        "examples": [
            ("again", "我们明天重新开始。", "We will start again tomorrow.", 2, True),
            ("anew", "老师让我重新看一遍。", "The teacher asked me to look through it again.", 2, False),
            ("again", "他重新安排了时间。", "He rearranged the schedule.", 2, False),
        ],
    },
    "new-hsk-4-0095": {
        "primary_gloss": "window",
        "secondary_glosses": [],
        "examples": [
            ("window", "窗开着，风很大。", "The window is open, and the wind is strong.", 2, True),
            ("window", "他站在窗前看雨。", "He stands by the window and watches the rain.", 2, False),
            ("window", "请把窗关上。", "Please close the window.", 2, False),
        ],
    },
    "new-hsk-4-0096": {
        "primary_gloss": "window",
        "secondary_glosses": [],
        "examples": [
            ("window", "窗户外面很安静。", "It is very quiet outside the window.", 2, True),
            ("window", "我家的窗户很大。", "The window in my home is very large.", 2, False),
            ("window", "请把窗户打开一点。", "Please open the window a little.", 2, False),
        ],
    },
    "new-hsk-4-0125": {
        "primary_gloss": "doctor",
        "secondary_glosses": ["medical doctor"],
        "examples": [
            ("doctor", "他去找大夫了。", "He went to see a doctor.", 2, True),
            ("medical doctor", "大夫让他早点休息。", "The doctor told him to rest early.", 2, False),
            ("doctor", "这位大夫今天很忙。", "This doctor is very busy today.", 2, False),
        ],
    },
    "new-hsk-4-0140": {
        "primary_gloss": "measure word for questions; path",
        "secondary_glosses": ["way", "road"],
        "examples": [
            ("measure word for questions", "这道题有点难。", "This question is a little difficult.", 2, True),
            ("measure word for questions", "老师又出了一道题。", "The teacher gave us another question.", 2, False),
            ("path", "这条道很安静。", "This road is very quiet.", 2, False),
        ],
    },
    "new-hsk-4-0143": {
        "primary_gloss": "road",
        "secondary_glosses": ["path"],
        "examples": [
            ("road", "前面的道路很长。", "The road ahead is long.", 2, True),
            ("road", "晚上这条道路很安静。", "This road is very quiet at night.", 2, False),
            ("path", "这条道路很新。", "This road is quite new.", 2, False),
        ],
    },
    "new-hsk-4-0153": {
        "primary_gloss": "bottom",
        "secondary_glosses": ["base"],
        "examples": [
            ("bottom", "杯子底有一点水。", "There is a little water at the bottom of the cup.", 2, True),
            ("bottom", "盒子底有一张纸。", "There is a sheet of paper at the bottom of the box.", 2, False),
            ("base", "山底有一条小路。", "There is a small road at the foot of the mountain.", 2, False),
        ],
    },
    "new-hsk-4-0154": {
        "primary_gloss": "underneath",
        "secondary_glosses": ["below"],
        "examples": [
            ("underneath", "桌子底下有只猫。", "There is a cat under the table.", 2, True),
            ("below", "床底下很脏。", "It is very dirty under the bed.", 2, False),
            ("underneath", "他把鞋放在椅子底下。", "He put the shoes under the chair.", 2, False),
        ],
    },
    "new-hsk-4-0739": {
        "primary_gloss": "stop",
        "secondary_glosses": ["come to a halt"],
        "examples": [
            ("stop", "车停在门口。", "The car stopped at the door.", 2, True),
            ("stop", "雨终于停了。", "The rain finally stopped.", 2, False),
            ("stop", "你先停一下，再说。", "Stop for a second first, then continue.", 2, False),
        ],
    },
    "new-hsk-4-0742": {
        "primary_gloss": "stop",
        "secondary_glosses": ["halt"],
        "examples": [
            ("stop", "比赛突然停止了。", "The match suddenly came to a halt.", 2, True),
            ("stop", "请停止说话。", "Please stop talking.", 2, False),
            ("halt", "机器已经停止工作了。", "The machine has already stopped working.", 2, False),
        ],
    },
    "new-hsk-4-0810": {
        "primary_gloss": "measure word for items, tasks, projects",
        "secondary_glosses": ["item", "project"],
        "examples": [
            ("measure word for tasks", "这项工作很重要。", "This task is important.", 2, True),
            ("item", "我完成了三项任务。", "I finished three separate tasks.", 2, False),
            ("measure word for items", "那项规定写得很清楚。", "That rule is written very clearly.", 2, False),
        ],
    },
}


def main() -> int:
    with connect() as conn:
        payloads = []
        for word_id, fix in FIXES.items():
            row = conn.execute(
                """
                SELECT id, lang, lemma, display_form, pos, rank, pronunciation
                FROM words
                WHERE id = ?
                """,
                (word_id,),
            ).fetchone()
            if not row:
                raise SystemExit(f"Missing word row for {word_id}")

            primary_gloss = fix["primary_gloss"]
            secondary_glosses = fix["secondary_glosses"]
            payloads.append(
                {
                    "word": {
                        "id": row["id"],
                        "lang": row["lang"],
                        "lemma": row["lemma"],
                        "display_form": row["display_form"],
                        "pos": row["pos"],
                        "rank": row["rank"],
                        "pronunciation": row["pronunciation"],
                    },
                    "glosses": {
                        "primary_gloss": primary_gloss,
                        "secondary_glosses": secondary_glosses,
                        "notes": build_notes(primary_gloss, secondary_glosses, row["pos"]),
                    },
                    "examples": [
                        {
                            "id": f"{word_id}-ex{index}",
                            "meaning_en": meaning_en,
                            "sentence": sentence,
                            "difficulty": difficulty,
                            "source": "orchestrator-manual-fix",
                            "is_primary": is_primary,
                        }
                        for index, (meaning_en, sentence, translation, difficulty, is_primary) in enumerate(
                            fix["examples"], start=1
                        )
                    ],
                    "example_translations": [
                        {
                            "example_id": f"{word_id}-ex{index}",
                            "translation": translation,
                        }
                        for index, (_, sentence, translation, difficulty, is_primary) in enumerate(
                            fix["examples"], start=1
                        )
                    ],
                }
            )

    OUTPUT_PATH.write_text(
        "".join(json.dumps(payload, ensure_ascii=False) + "\n" for payload in payloads),
        encoding="utf-8",
    )
    print(str(OUTPUT_PATH))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
