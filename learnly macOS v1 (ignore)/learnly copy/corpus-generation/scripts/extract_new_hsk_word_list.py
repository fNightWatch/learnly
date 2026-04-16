#!/usr/bin/env python3

import argparse
import json
import re
import unicodedata
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parent.parent

RANK_X_MAX = 150
CHINESE_X_MAX = 230
PINYIN_X_MAX = 330
LEVEL4_RANK_X_MAX = 80
LEVEL4_CHINESE_X_MAX = 150
LEVEL4_PINYIN_X_MAX = 240
LEVEL4_POS_X_MAX = 360
CONTENT_TOP_MIN = 70
CONTENT_TOP_MAX = 780
ROW_TOP_TOLERANCE = 2.5

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
ENGLISH_POS_MAP = {
    "adjective": "adjective",
    "adverb": "adverb",
    "classifier": "measure word",
    "conjunction": "conjunction",
    "interjection": "interjection",
    "measure word": "measure word",
    "noun": "noun",
    "numeral": "numeral",
    "particle": "particle",
    "preposition": "preposition",
    "pronoun": "pronoun",
    "verb": "verb",
}


def normalize_text(text: str) -> str:
    return unicodedata.normalize("NFKC", text).strip()


def group_words_into_lines(page_words: list[dict]) -> list[list[dict]]:
    content_words = [
        word
        for word in page_words
        if CONTENT_TOP_MIN <= word["top"] <= CONTENT_TOP_MAX
    ]
    for word in content_words:
        word["text"] = normalize_text(word["text"])
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


def uses_level4_layout(page_words: list[dict]) -> bool:
    header_tokens = {
        normalize_text(word["text"]).upper()
        for word in page_words
        if word["top"] <= 140
    }
    if {"PART", "SPEECH", "TRANSLATION"}.issubset(header_tokens):
        return True

    pos_hits = 0
    for word in page_words:
        text = normalize_text(word["text"]).lower()
        if not (240 <= word["x0"] <= 360):
            continue
        if any(label in text for label in ENGLISH_POS_MAP):
            pos_hits += 1
            if pos_hits >= 3:
                return True
    return False


def split_line_by_layout(line: list[dict], has_pos_column: bool) -> tuple[list[str], list[str], list[str], list[str], list[str]]:
    rank_parts: list[str] = []
    chinese_parts: list[str] = []
    pinyin_parts: list[str] = []
    pos_parts: list[str] = []
    english_parts: list[str] = []

    for token in line:
        text = normalize_text(token["text"])
        if not text:
            continue
        x0 = token["x0"]
        if has_pos_column:
            if x0 < LEVEL4_RANK_X_MAX:
                rank_parts.append(text)
            elif x0 < LEVEL4_CHINESE_X_MAX:
                chinese_parts.append(text)
            elif x0 < LEVEL4_PINYIN_X_MAX:
                pinyin_parts.append(text)
            elif x0 < LEVEL4_POS_X_MAX:
                pos_parts.append(text)
            else:
                english_parts.append(text)
        else:
            if x0 < RANK_X_MAX:
                rank_parts.append(text)
            elif x0 < CHINESE_X_MAX:
                chinese_parts.append(text)
            elif x0 < PINYIN_X_MAX:
                pinyin_parts.append(text)
            else:
                english_parts.append(text)

    return rank_parts, chinese_parts, pinyin_parts, pos_parts, english_parts


def parse_english_glosses(english: str) -> tuple[str, list[str]]:
    cleaned = re.sub(r"\s+", " ", english).strip(" ;,")
    parts = [part.strip() for part in re.split(r"\s*[;,]\s*", cleaned) if part.strip()]
    if not parts:
        return "", []
    return parts[0], parts[1:]


def normalize_english_pos(pos_text: str) -> tuple[str, str] | None:
    cleaned = normalize_text(pos_text)
    cleaned = cleaned.replace("、", ", ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ;,")
    if not cleaned:
        return None

    parts = [part.strip(" ()") for part in re.split(r"[;,]", cleaned) if part.strip(" ()")]
    normalized_parts = []
    for part in parts:
        lowered = part.lower()
        mapped = ENGLISH_POS_MAP.get(lowered, lowered)
        if mapped not in normalized_parts:
            normalized_parts.append(mapped)

    normalized = ", ".join(normalized_parts) if normalized_parts else "unknown"
    return (
        normalized,
        f"Imported from the source PDF. The source marks this entry as {normalized}.",
    )


def parse_pos(display_form: str, primary_gloss: str, pos_text: str = "") -> tuple[str, str]:
    english_pos = normalize_english_pos(pos_text)
    if english_pos:
        return english_pos
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
            has_pos_column = uses_level4_layout(words)
            for line in group_words_into_lines(words):
                rank_parts, chinese_parts, pinyin_parts, pos_parts, english_parts = split_line_by_layout(
                    line,
                    has_pos_column,
                )

                rank_text = "".join(rank_parts)
                chinese_text = normalize_text("".join(chinese_parts))
                pinyin_text = " ".join(pinyin_parts).strip()
                pos_text = " ".join(pos_parts).strip()
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
                        "pos_text": pos_text,
                        "english": english_text,
                    }
                    continue

                if current and not rank_text and not chinese_text:
                    if pinyin_text:
                        current["pronunciation"] = f"{current['pronunciation']} {pinyin_text}".strip()
                    if pos_text:
                        current["pos_text"] = f"{current['pos_text']} {pos_text}".strip()
                    if english_text:
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
        pos, notes = parse_pos(row["display_form"], primary_gloss, row.get("pos_text", ""))
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
