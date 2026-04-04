#!/usr/bin/env python3

from __future__ import annotations

import csv
import io
import json
import re
import unicodedata
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

SOURCE_URL = "https://strommeninc.com/1000-most-common-spanish-words-frequency-vocabulary/"
FREQUENCY_URL = "https://raw.githubusercontent.com/doozan/spanish_data/master/frequency.csv"
SENTENCES_URL = "https://raw.githubusercontent.com/doozan/spanish_data/master/sentences.tsv"
OUTPUT_PATH = Path("src/lib/demo/generated/spanish-frequency-corpus.ts")
SOURCE_TIMEOUT = 30

PRONOUNS = {
    "yo",
    "tú",
    "tu",
    "él",
    "el",
    "ella",
    "ellas",
    "ellos",
    "nosotros",
    "nosotras",
    "vosotros",
    "vosotras",
    "usted",
    "ustedes",
    "me",
    "te",
    "se",
    "nos",
    "mi",
    "mis",
    "su",
    "sus",
    "nuestro",
    "nuestra",
    "nuestros",
    "nuestras",
    "quien",
    "quién",
    "qué",
    "que",
    "esto",
    "eso",
    "esta",
    "este",
    "estas",
    "estos",
    "aquello",
    "algo",
    "nada",
    "cada",
    "otro",
    "otra",
    "otros",
    "otras",
}

PREPOSITIONS = {
    "a",
    "ante",
    "bajo",
    "con",
    "contra",
    "de",
    "desde",
    "durante",
    "en",
    "entre",
    "hacia",
    "hasta",
    "para",
    "por",
    "sin",
    "sobre",
    "tras",
}

CONJUNCTIONS = {
    "que",
    "qué",
    "como",
    "si",
    "sí",
    "pero",
    "porque",
    "aunque",
    "mientras",
    "cuando",
    "y",
    "o",
    "ni",
    "donde",
    "dónde",
}

ARTICLES = {
    "el",
    "la",
    "los",
    "las",
    "lo",
    "un",
    "una",
    "unos",
    "unas",
}

ADVERBS = {
    "no",
    "más",
    "mas",
    "muy",
    "ya",
    "aquí",
    "alli",
    "allí",
    "ahora",
    "bien",
    "mal",
    "después",
    "despues",
    "antes",
    "siempre",
    "nunca",
    "todavía",
    "todavia",
    "casi",
    "aún",
    "aun",
    "también",
    "tambien",
}

POS_OVERRIDES = {
    "como": "conjunction",
    "su": "determiner",
    "que": "conjunction",
    "qué": "pronoun",
    "era": "verb",
    "son": "verb",
    "es": "verb",
    "fue": "verb",
    "ser": "verb",
    "estar": "verb",
    "tener": "verb",
    "hacer": "verb",
    "ir": "verb",
    "ver": "verb",
    "decir": "verb",
    "dar": "verb",
    "querer": "verb",
    "puede": "verb",
    "poder": "verb",
    "palabra": "noun",
    "caliente": "adjective",
}

EXAMPLE_OVERRIDES: dict[str, tuple[str, str]] = {
    "como": ("Trabajo como profesor en línea.", "I work as an online teacher."),
    "yo": ("Yo estudio español cada mañana.", "I study Spanish every morning."),
    "su": ("Su casa está cerca de aquí.", "His house is near here."),
    "que": ("Creo que ella tiene razón.", "I think that she is right."),
    "él": ("Él llega temprano a clase.", "He arrives early to class."),
    "era": ("Era una noche tranquila.", "It was a quiet night."),
    "para": ("Este regalo es para ti.", "This gift is for you."),
    "en": ("Estoy en casa ahora mismo.", "I am at home right now."),
    "son": ("Son muy buenos amigos.", "They are very good friends."),
    "con": ("Voy con mi hermana al mercado.", "I go to the market with my sister."),
    "ellos": ("Ellos viven cerca del parque.", "They live near the park."),
    "ser": ("Quiero ser médico algún día.", "I want to be a doctor one day."),
    "a": ("Vamos a la estación ahora.", "We are going to the station now."),
    "uno": ("Solo necesito uno por ahora.", "I only need one for now."),
    "tener": ("Quiero tener más tiempo mañana.", "I want to have more time tomorrow."),
    "este": ("Este libro es muy útil.", "This book is very useful."),
    "desde": ("Trabajo desde casa los viernes.", "I work from home on Fridays."),
    "por": ("Lo hice por ti.", "I did it for you."),
    "caliente": ("El café está caliente todavía.", "The coffee is still hot."),
    "palabra": ("No entiendo esa palabra.", "I do not understand that word."),
    "pero": ("Quiero ir, pero estoy cansado.", "I want to go, but I am tired."),
    "qué": ("¿Qué quieres comer hoy?", "What do you want to eat today?"),
    "algunos": ("Algunos estudiantes llegan temprano.", "Some students arrive early."),
    "es": ("Es una idea sencilla.", "It is a simple idea."),
    "esto": ("Esto cambia todo.", "This changes everything."),
    "tú": ("Tú decides el plan.", "You decide the plan."),
    "o": ("¿Café o té?", "Coffee or tea?"),
    "bien": ("Todo va bien hoy.", "Everything is going well today."),
    "de": ("Es una taza de café.", "It is a cup of coffee."),
    "la": ("La puerta está abierta.", "The door is open."),
    "el": ("El tren llega a las ocho.", "The train arrives at eight."),
    "las": ("Las calles están tranquilas.", "The streets are quiet."),
    "los": ("Los niños juegan afuera.", "The children play outside."),
    "una": ("Necesito una respuesta clara.", "I need a clear answer."),
    "un": ("Es un problema pequeño.", "It is a small problem."),
    "y": ("Pan y café, por favor.", "Bread and coffee, please."),
    "si": ("Si tienes tiempo, ven.", "If you have time, come."),
    "no": ("No tengo la llave ahora.", "I do not have the key right now."),
    "más": ("Quiero más agua, por favor.", "I want more water, please."),
    "ya": ("Ya estamos listos para salir.", "We are ready to leave now."),
    "muy": ("La calle está muy tranquila.", "The street is very quiet."),
    "también": ("Ella también estudia español.", "She also studies Spanish."),
    "sobre": ("El libro está sobre la mesa.", "The book is on the table."),
    "sin": ("Salimos sin paraguas hoy.", "We left without an umbrella today."),
}

POS_MAP = {
    "adj": "adjective",
    "adv": "adverb",
    "art": "article",
    "conj": "conjunction",
    "interj": "interjection",
    "n": "noun",
    "none": "word",
    "num": "number",
    "part": "particle",
    "phrase": "phrase",
    "prep": "preposition",
    "pron": "pronoun",
    "prop": "proper noun",
    "v": "verb",
}


def normalize_text(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", ascii_only.lower()).strip("_")
    return slug or "item"


def tokenize(text: str) -> list[str]:
    return re.findall(r"[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+", text)


def infer_type(word: str) -> str:
    return "phrase" if " " in word.strip() else "lemma"


def infer_pos(word: str, gloss: str) -> str:
    normalized_word = word.casefold()
    normalized_gloss = gloss.casefold()
    if normalized_word in POS_OVERRIDES:
        return POS_OVERRIDES[normalized_word]
    if normalized_word in PRONOUNS:
        return "pronoun"
    if normalized_word in PREPOSITIONS:
        return "preposition"
    if normalized_word in CONJUNCTIONS:
        return "conjunction"
    if normalized_word in ARTICLES:
        return "article"
    if normalized_word in ADVERBS:
        return "adverb"
    if infer_type(word) == "phrase":
        return "phrase"
    if normalized_gloss.startswith("to "):
        return "verb"
    if normalized_gloss in {"be", "is", "are", "was", "were", "have", "has", "had"}:
        return "verb"
    if normalized_gloss in {"hot", "cold", "big", "small", "good", "bad"}:
        return "adjective"
    return "word"


def build_frequency_pos_index() -> dict[str, str]:
    text = requests.get(FREQUENCY_URL, timeout=SOURCE_TIMEOUT).text
    reader = csv.DictReader(io.StringIO(text))
    token_pos: dict[str, str] = {}
    for row in reader:
        pos = POS_MAP.get((row.get("pos") or "").strip(), "word")
        lemma = normalize_text(row.get("spanish", "")).casefold()
        if lemma:
            token_pos.setdefault(lemma, pos)
        for usage in (row.get("usage") or "").split("|"):
            if ":" not in usage:
                continue
            token = normalize_text(usage.split(":", 1)[1]).casefold()
            if token:
                token_pos.setdefault(token, pos)
    return token_pos


def fetch_ranking_rows() -> list[dict[str, Any]]:
    html = requests.get(SOURCE_URL, timeout=SOURCE_TIMEOUT).text
    soup = BeautifulSoup(html, "html.parser")
    rows: list[dict[str, Any]] = []
    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in tr.find_all(["td", "th"])]
            if len(cells) < 3 or not cells[0].isdigit():
                continue
            rows.append(
                {
                    "word": cells[1].lower(),
                    "gloss": cells[2],
                }
            )
    return [
        {
            **row,
            "rank": index,
        }
        for index, row in enumerate(rows[:1000], start=1)
    ]


def score_candidate(word: str, spanish: str, english: str) -> int:
    tokens = tokenize(spanish)
    score = abs(len(tokens) - 6) * 2
    if len(tokens) < 2:
        score += 30
    if len(tokens) > 12:
        score += (len(tokens) - 12) * 3
    if len(spanish) > 90:
        score += len(spanish) - 90
    if len(english) > 110:
        score += len(english) - 110
    if any(char.isdigit() for char in spanish):
        score += 30
    if spanish.endswith("...") or english.endswith("..."):
        score += 20
    if word.casefold() not in {token.casefold() for token in tokens} and word.casefold() not in spanish.casefold():
        score += 40
    return score


def fallback_example(word: str, gloss: str, pos: str, rank: int) -> tuple[str, str]:
    if pos == "verb":
        return (f"Quiero {word} mejor cada día.", f"I want to {gloss} better every day.")
    if pos == "pronoun":
        return (f"{word.capitalize()} llega primero hoy.", f"{gloss.capitalize()} arrives first today.")
    if pos == "preposition":
        return (f"Salimos {word} clase esta tarde.", f"We leave {gloss} class this afternoon.")
    if pos == "conjunction":
        return (f"Volvemos temprano {word} mañana hay clase.", f"We are coming back early {gloss} there is class tomorrow.")
    if pos == "adjective":
        return (f"Hoy todo parece {word}.", f"Today everything seems {gloss}.")
    if pos == "noun":
        return (f"Necesito {word} para esta lección.", f"I need {gloss} for this lesson.")
    if rank <= 250:
        return (f"Usamos {word} en una frase común.", f"We use {gloss} in a common sentence.")
    return (f"La palabra {word} aparece en esta lección.", f"The word {gloss} appears in this lesson.")


def build_sentence_index(rows: list[dict[str, Any]]) -> dict[str, list[tuple[int, str, str]]]:
    target_words = {row["word"].casefold() for row in rows if " " not in row["word"]}
    target_phrases = {row["word"].casefold() for row in rows if " " in row["word"]}
    best_examples: dict[str, list[tuple[int, str, str]]] = {}

    text = requests.get(SENTENCES_URL, timeout=SOURCE_TIMEOUT).text
    for line_number, line in enumerate(text.splitlines(), start=1):
        parts = line.split("\t")
        if len(parts) < 2:
            continue

        english = normalize_text(parts[0])
        spanish = normalize_text(parts[1])
        if not english or not spanish:
            continue

        tokens = {token.casefold() for token in tokenize(spanish)}
        matches = tokens & target_words
        lower_spanish = spanish.casefold()
        for phrase in target_phrases:
            if phrase in lower_spanish:
                matches.add(phrase)

        for match in matches:
            score = score_candidate(match, spanish, english)
            current = best_examples.setdefault(match, [])
            if any(existing[1] == spanish for existing in current):
                continue
            current.append((score, spanish, english))
            current.sort(key=lambda item: item[0])
            del current[6:]

        if line_number % 50000 == 0:
            print(f"Scanned {line_number} sentence rows...", flush=True)

    return best_examples


def build_corpus() -> list[dict[str, Any]]:
    rows = fetch_ranking_rows()
    frequency_pos_index = build_frequency_pos_index()
    for row in rows:
        row["type"] = infer_type(row["word"])
        row["pos"] = frequency_pos_index.get(row["word"].casefold()) or infer_pos(row["word"], row["gloss"])

    sentence_index = build_sentence_index(rows)
    used_ids: set[str] = set()
    used_examples: set[str] = set()
    corpus: list[dict[str, Any]] = []

    for row in rows:
        word_key = row["word"].casefold()
        if word_key in EXAMPLE_OVERRIDES:
            example, translation = EXAMPLE_OVERRIDES[word_key]
        else:
            candidates = sentence_index.get(word_key, [])
            picked = next(
                ((spanish, english) for _, spanish, english in candidates if spanish not in used_examples),
                None,
            )
            if picked is None and candidates:
                _, spanish, english = candidates[0]
                picked = (spanish, english)

            example, translation = picked or fallback_example(row["word"], row["gloss"], row["pos"], row["rank"])

        base_id = slugify(row["word"])
        item_id = base_id
        if item_id in used_ids:
            item_id = f"{base_id}_{row['rank']}"
        used_ids.add(item_id)
        used_examples.add(example)

        corpus.append(
            {
                "id": item_id,
                "languageCode": "es",
                "type": row["type"],
                "lemma": row["word"],
                "displayForm": row["word"],
                "primaryGloss": row["gloss"],
                "pos": row["pos"],
                "rank": row["rank"],
                "example": example,
                "translation": translation,
            }
        )

    return corpus


def write_typescript(corpus: list[dict[str, Any]]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(corpus, ensure_ascii=False, indent=2)
    content = (
        'import { DemoLexicalItem } from "@/lib/demo/types";\n\n'
        "export const spanishFrequencyCorpus: DemoLexicalItem[] = "
        f"{payload};\n"
    )
    OUTPUT_PATH.write_text(content, encoding="utf-8")


def main() -> None:
    corpus = build_corpus()
    write_typescript(corpus)
    print(f"Wrote {len(corpus)} items to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
