#!/usr/bin/env python3

import argparse
import json
import re
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parent.parent

RANK_X_MAX = 150
CHINESE_X_MAX = 230
PINYIN_X_MAX = 330
CONTENT_TOP_MIN = 70
CONTENT_TOP_MAX = 780
ROW_TOP_TOLERANCE = 1.5

ANNOTATION_RE = re.compile(r"（([^）]+)）")
LEADING_RANK_RE = re.compile(r"^(\d+)(.*)$")
CHINESE_CHAR_RE = re.compile(r"[\u3400-\u9fff]")
FOOTNOTE_RE = re.compile(r"[¹²³⁴⁵⁶⁷⁸⁹⁰]")
POS_MAP = {
    "形": "adjective",
    "动": "verb",
    "名": "noun",
    "副": "adverb",
    "代": "pronoun",
    "量": "measure word",
    "助": "particle",
    "介": "preposition",
    "连": "conjunction",
    "叹": "interjection",
    "数": "numeral",
}


def group_words_into_lines(page_words: list[dict]) -> list[list[dict]]:
    content_words = [
        word
        for word in page_words
        if CONTENT_TOP_MIN <= word["top"] <= CONTENT_TOP_MAX
    ]
    content_words.sort(key=lambda item: (item["top"], item["x0"]))

    lines: list[list[dict]] = []
    current_line: list[dict] = []
    current_top: float | None = None

    for word in content_words:
        if current_top is None or abs(word["top"] - current_top) <= ROW_TOP_TOLERANCE:
            current_line.append(word)
            if current_top is None:
                current_top = word["top"]
            continue
        lines.append(sorted(current_line, key=lambda item: item["x0"]))
        current_line = [word]
        current_top = word["top"]

    if current_line:
        lines.append(sorted(current_line, key=lambda item: item["x0"]))
    return lines


def parse_english_glosses(english: str) -> tuple[str, list[str]]:
    cleaned = re.sub(r"\s+", " ", english).strip(" ;,")
    parts = [part.strip() for part in re.split(r"\s*[;,]\s*", cleaned) if part.strip()]
    if not parts:
        return "", []
    return parts[0], parts[1:]


def parse_pos(display_form: str, primary_gloss: str) -> tuple[str, str]:
    match = ANNOTATION_RE.search(display_form)
    if match:
        code = match.group(1)
        if code in POS_MAP:
            return POS_MAP[code], f"Imported from the source PDF. The source marks this entry as {POS_MAP[code]}."
    primary_lower = primary_gloss.lower()
    if primary_lower.startswith("(measure word") or "measure word" in primary_lower:
        return "measure word", "Imported from the source PDF. The source gloss marks this entry as a measure word."
    if primary_lower in {"auxiliary word", "particle", "particle used for comparison"}:
        return "particle", "Imported from the source PDF. The source gloss suggests this entry functions as a particle."
    return (
        "unknown",
        "Imported from the source PDF. Sense splitting and part of speech may need refinement before example generation.",
    )


def extract_rows(pdf_path: Path) -> list[dict]:
    rows: list[dict] = []
    current: dict | None = None

    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            words = page.extract_words(use_text_flow=False)
            for line in group_words_into_lines(words):
                rank_parts: list[str] = []
                chinese_parts: list[str] = []
                pinyin_parts: list[str] = []
                english_parts: list[str] = []

                for token in line:
                    text = token["text"].strip()
                    if not text:
                        continue
                    x0 = token["x0"]
                    if x0 < RANK_X_MAX:
                        rank_parts.append(text)
                    elif x0 < CHINESE_X_MAX:
                        chinese_parts.append(text)
                    elif x0 < PINYIN_X_MAX:
                        pinyin_parts.append(text)
                    else:
                        english_parts.append(text)

                rank_text = "".join(rank_parts)
                chinese_text = "".join(chinese_parts)
                pinyin_text = " ".join(pinyin_parts).strip()
                english_text = " ".join(english_parts).strip()

                rank_number = ""
                rank_remainder = ""
                match = LEADING_RANK_RE.match(rank_text)
                if match:
                    rank_number = match.group(1)
                    rank_remainder = FOOTNOTE_RE.sub("", match.group(2)).strip()

                if CHINESE_CHAR_RE.search(rank_remainder):
                    chinese_text = f"{rank_remainder}{chinese_text}"

                if rank_number and chinese_text:
                    if current:
                        rows.append(current)
                    current = {
                        "rank": int(rank_number),
                        "display_form": chinese_text,
                        "pronunciation": pinyin_text,
                        "english": english_text,
                    }
                    continue

                if current and not rank_text and not chinese_text and not pinyin_text and english_text:
                    current["english"] = f"{current['english']} {english_text}".strip()

        if current:
            rows.append(current)

    expected_ranks = list(range(1, len(rows) + 1))
    actual_ranks = [row["rank"] for row in rows]
    if actual_ranks != expected_ranks:
        raise ValueError(f"Expected contiguous ranks 1..{len(rows)}, found {actual_ranks[:10]} ... {actual_ranks[-10:]}")

    output_rows = []
    for row in rows:
        primary_gloss, secondary_glosses = parse_english_glosses(row["english"])
        pos, notes = parse_pos(row["display_form"], primary_gloss)
        output_rows.append(
            {
                "rank": row["rank"],
                "display_form": row["display_form"],
                "pronunciation": row["pronunciation"],
                "pos": pos,
                "primary_gloss": primary_gloss,
                "secondary_glosses": secondary_glosses,
                "notes": notes,
            }
        )
    return output_rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract a New HSK PDF word list into source seed JSON.")
    parser.add_argument("--pdf", required=True, help="Path to the source PDF.")
    parser.add_argument("--output", required=True, help="Path to write the extracted seed JSON.")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    rows = extract_rows(pdf_path)
    output_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"pdf": str(pdf_path), "output": str(output_path), "row_count": len(rows)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
