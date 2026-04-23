import argparse
import sqlite3
import re


HSK4_DB = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-4.sqlite"
HSK5_DB = "/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite"
LOG_PATH = "/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-5/hsk5-strict-qc-2026-04-22.md"
DATASET_ID = "new-hsk-5-words"


def corpus_metrics(path: str) -> dict:
    conn = sqlite3.connect(path)
    rows = conn.execute("SELECT sentence, difficulty FROM examples").fetchall()
    clean = lambda s: re.sub(r"[，。！？；：、“”‘’（）《》〈〉—…,.!?;:\\\"()\-\s]", "", s or "")
    lens = [len(clean(sentence)) for sentence, _ in rows]
    diffs = [float(d or 0) for _, d in rows]
    return {
        "example_count": len(rows),
        "avg_chars": round(sum(lens) / len(lens), 3),
        "avg_difficulty": round(sum(diffs) / len(diffs), 3),
        "share_len_le_8": round(sum(1 for x in lens if x <= 8) / len(lens), 3),
        "share_len_ge_15": round(sum(1 for x in lens if x >= 15) / len(lens), 3),
    }


def latest_audit() -> dict:
    conn = sqlite3.connect(HSK5_DB)
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        """
        SELECT audit_name, issue_count, lexicon_failures, missing_lemma,
               same_word_duplicate_sentences, same_word_duplicate_translations,
               cross_word_duplicate_sentence_groups, cross_word_duplicate_translation_groups,
               created_at
        FROM audit_runs
        WHERE dataset_id = ?
        ORDER BY row_id DESC
        LIMIT 1
        """,
        (DATASET_ID,),
    ).fetchone()
    return dict(row)


def append_entry(batch_label: str, touched_scope: str, notes: str) -> None:
    hsk4 = corpus_metrics(HSK4_DB)
    hsk5 = corpus_metrics(HSK5_DB)
    audit = latest_audit()
    delta_chars = round(hsk5["avg_chars"] - hsk4["avg_chars"], 3)
    delta_diff = round(hsk5["avg_difficulty"] - hsk4["avg_difficulty"], 3)

    lines = [
        f"### {batch_label}",
        "",
        f"- Touched scope: `{touched_scope}`",
        f"- Latest audit: `{audit['audit_name']}` at `{audit['created_at']}`",
        f"- Audit summary: issues `{audit['issue_count']}`, lexicon `{audit['lexicon_failures']}`, missing lemma `{audit['missing_lemma']}`, same-word dup sentences `{audit['same_word_duplicate_sentences']}`, same-word dup translations `{audit['same_word_duplicate_translations']}`, cross-word dup sentence groups `{audit['cross_word_duplicate_sentence_groups']}`, cross-word dup translation groups `{audit['cross_word_duplicate_translation_groups']}`",
        f"- HSK5 metrics now: avg Hanzi `{hsk5['avg_chars']}`, avg difficulty `{hsk5['avg_difficulty']}`, share len <= 8 `{hsk5['share_len_le_8']}`, share len >= 15 `{hsk5['share_len_ge_15']}`",
        f"- HSK4 reference: avg Hanzi `{hsk4['avg_chars']}`, avg difficulty `{hsk4['avg_difficulty']}`",
        f"- Delta vs HSK4: avg Hanzi `{delta_chars}`, avg difficulty `{delta_diff}`",
    ]
    if notes.strip():
        lines.append(f"- Notes: {notes.strip()}")
    lines.append("")

    with open(LOG_PATH, "a", encoding="utf-8") as handle:
        handle.write("\n".join(lines))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-label", required=True)
    parser.add_argument("--touched-scope", required=True)
    parser.add_argument("--notes", default="")
    args = parser.parse_args()
    append_entry(args.batch_label, args.touched_scope, args.notes)


if __name__ == "__main__":
    main()
