import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import orchestrator


DB_PATH = "corpus-hsk-2.sqlite"
OUTPUT_PATH = "runs/new-hsk-2/hsk2-feynman-fixes.jsonl"


def ex(meaning_en: str, sentence: str, translation: str, difficulty: int) -> dict:
    return {
        "meaning_en": meaning_en,
        "sentence": sentence,
        "translation": translation,
        "difficulty": difficulty,
    }


REPAIRS = {
    "new-hsk-2-0215": {
        "primary_gloss": "benefit; advantage",
        "secondary_glosses": ["good point"],
        "notes": (
            "Common noun meaning benefit or advantage. It is often used in patterns "
            "like 对...有好处 to talk about something being good for a person or situation."
        ),
        "examples": [
            ex("benefit", "运动对身体有好处。", "Exercise is good for the body.", 1),
            ex("benefit", "早睡对身体有好处。", "Going to bed early is good for the body.", 1),
            ex("advantage", "这个办法有很多好处。", "This method has many advantages.", 2),
        ],
    },
    "new-hsk-2-0216": {
        "primary_gloss": "many; a lot of",
        "secondary_glosses": ["so many"],
        "notes": (
            "Common phrase meaning many or a lot of. It often adds a spoken feeling of "
            "surprise or emphasis, like so many."
        ),
        "examples": [
            ex("so many", "今天来的人好多。", "So many people came today.", 1),
            ex("a lot of", "桌子上有好多书。", "There are a lot of books on the table.", 1),
            ex("a lot of", "商店里有好多水果。", "There is a lot of fruit in the store.", 1),
        ],
    },
    "new-hsk-2-0217": {
        "primary_gloss": "for a long time",
        "secondary_glosses": ["quite a while"],
        "notes": "Common time expression meaning for a long time or after quite a while.",
        "examples": [
            ex("for a long time", "我等了好久。", "I waited for a long time.", 1),
            ex("for a long time", "他好久没有来了。", "He has not come for a long time.", 2),
            ex("for a long time", "我们好久没有见面了。", "We have not seen each other for a long time.", 2),
        ],
    },
    "new-hsk-2-0220": {
        "primary_gloss": "seem; appear",
        "secondary_glosses": ["look like"],
        "notes": (
            "Common verb for seeming or appearing a certain way. It can also mean look like "
            "when comparing people or things."
        ),
        "examples": [
            ex("seem", "他好像在家。", "He seems to be at home.", 1),
            ex("look like", "这个人好像老师。", "This person looks like a teacher.", 2),
            ex("seem", "我好像认识他。", "I seem to know him.", 2),
        ],
    },
    "new-hsk-2-0223": {
        "primary_gloss": "black; dark",
        "secondary_glosses": ["dark"],
        "notes": "Common adjective meaning black in color. It can also describe things becoming dark.",
        "examples": [
            ex("black", "他的头发很黑。", "His hair is very black.", 1),
            ex("dark", "外面已经黑了。", "It is already dark outside.", 2),
            ex("black", "这个包是黑的。", "This bag is black.", 1),
        ],
    },
    "new-hsk-2-0225": {
        "primary_gloss": "black",
        "secondary_glosses": ["the color black"],
        "notes": "Common noun and modifier for the color black.",
        "examples": [
            ex("the color black", "我喜欢黑色。", "I like black.", 1),
            ex("black", "他的手机是黑色的。", "His phone is black.", 2),
            ex("black", "黑色衣服很好看。", "Black clothes look nice.", 2),
        ],
    },
    "new-hsk-2-0226": {
        "primary_gloss": "red",
        "secondary_glosses": [],
        "notes": "Common adjective meaning red.",
        "examples": [
            ex("red", "这个花是红的。", "This flower is red.", 1),
            ex("red", "她的脸有点红。", "Her face is a little red.", 2),
            ex("red", "红衣服在床上。", "The red clothes are on the bed.", 2),
        ],
    },
    "new-hsk-2-0227": {
        "primary_gloss": "red",
        "secondary_glosses": ["the color red"],
        "notes": "Common noun and modifier for the color red.",
        "examples": [
            ex("the color red", "我最喜欢红色。", "Red is my favorite color.", 1),
            ex("red", "这个包是红色的。", "This bag is red in color.", 2),
            ex("red", "红色汽车很漂亮。", "The red car is pretty.", 2),
        ],
    },
    "new-hsk-2-0229": {
        "primary_gloss": "suddenly",
        "secondary_glosses": [],
        "notes": "Common adverb meaning suddenly or all of a sudden.",
        "examples": [
            ex("suddenly", "天忽然下雨了。", "It suddenly started to rain.", 2),
            ex("suddenly", "他忽然笑了。", "He suddenly laughed.", 2),
            ex("suddenly", "我忽然想回家。", "I suddenly wanted to go home.", 2),
        ],
    },
    "new-hsk-2-0241": {
        "primary_gloss": "yellow",
        "secondary_glosses": [],
        "notes": "Common adjective meaning yellow.",
        "examples": [
            ex("yellow", "这个花是黄的。", "This flower is yellow.", 1),
            ex("yellow", "他的头发有点黄。", "His hair is a little yellow.", 2),
            ex("yellow", "黄花在桌子上。", "The yellow flower is on the table.", 2),
        ],
    },
    "new-hsk-2-0242": {
        "primary_gloss": "yellow",
        "secondary_glosses": ["the color yellow"],
        "notes": "Common noun and modifier for the color yellow.",
        "examples": [
            ex("the color yellow", "我喜欢黄色。", "I like yellow.", 1),
            ex("yellow", "这个包是黄色的。", "This bag is yellow in color.", 2),
            ex("yellow", "黄色汽车在路上。", "A yellow car is on the road.", 2),
        ],
    },
    "new-hsk-2-0246": {
        "primary_gloss": "activity; event",
        "secondary_glosses": [],
        "notes": "Common noun meaning an activity or event, often at school or in a group setting.",
        "examples": [
            ex("activity", "学校明天有一个活动。", "There is an activity at school tomorrow.", 2),
            ex("activity", "我们班都想去这个活动。", "Everyone in our class wants to go to this activity.", 2),
            ex("activity", "这个活动很有意思。", "This activity is very interesting.", 2),
        ],
    },
    "new-hsk-2-0251": {
        "primary_gloss": "level; grade",
        "secondary_glosses": ["rank"],
        "notes": "Common noun meaning level or grade. It often appears in study, school, and test contexts.",
        "examples": [
            ex("level", "我现在学二级。", "I am studying Level 2 now.", 2),
            ex("grade", "我妹妹在一年级。", "My younger sister is in first grade.", 2),
            ex("level", "这个考试一共有三级。", "This exam has three levels in total.", 2),
        ],
    },
    "new-hsk-2-0274": {
        "primary_gloss": "angle; perspective",
        "secondary_glosses": [],
        "notes": "Common noun meaning a physical angle or a point of view.",
        "examples": [
            ex("angle", "从这个角度看，房子很大。", "From this angle, the house looks big.", 2),
            ex("perspective", "我们换个角度看这个问题。", "Let us look at this question from a different angle.", 2),
            ex("angle", "这个角度不太好。", "This angle is not very good.", 1),
        ],
    },
    "new-hsk-2-0288": {
        "primary_gloss": "class period; section",
        "secondary_glosses": ["festival (in compounds)"],
        "notes": (
            "As a standalone word, 节 commonly means a class period or a section. It also "
            "appears in compounds such as 节日 and 节目."
        ),
        "examples": [
            ex("class period", "今天下午有两节课。", "There are two class periods this afternoon.", 2),
            ex("section", "这本书一共有五节。", "This book has five sections in total.", 2),
            ex("class period", "今天下午第一节是中文课。", "The first class this afternoon is Chinese.", 2),
        ],
    },
    "new-hsk-2-0289": {
        "primary_gloss": "program; show",
        "secondary_glosses": [],
        "notes": "Common noun meaning a show or program, especially on television or at an event.",
        "examples": [
            ex("show", "我们晚上一起看节目。", "We are watching a show together tonight.", 2),
            ex("program", "这个节目很好看。", "This program is very enjoyable.", 2),
            ex("TV program", "妈妈喜欢看电视节目。", "Mom likes watching TV programs.", 2),
        ],
    },
    "new-hsk-2-0290": {
        "primary_gloss": "festival; holiday",
        "secondary_glosses": [],
        "notes": "Common noun meaning a festival or holiday.",
        "examples": [
            ex("holiday", "今天是个特别的节日。", "Today is a special holiday.", 2),
            ex("festival", "节日的时候，大家都很高兴。", "During festivals, everyone is very happy.", 2),
            ex("holiday", "节日里商店的人很多。", "There are many people in the store during the holiday.", 2),
        ],
    },
    "new-hsk-2-0291": {
        "primary_gloss": "result; outcome",
        "secondary_glosses": ["in the end"],
        "notes": (
            "Common noun meaning result or outcome. In other contexts, 结果 can also "
            "introduce what happened in the end."
        ),
        "examples": [
            ex("result", "这个结果很好。", "This result is good.", 1),
            ex("result", "考试结果出来了。", "The exam result is out.", 2),
            ex("result", "我们都想知道结果。", "We all want to know the result.", 2),
        ],
    },
    "new-hsk-2-0294": {
        "primary_gloss": "from now on; in the future",
        "secondary_glosses": [],
        "notes": "Common time expression meaning from now on or in the future.",
        "examples": [
            ex("from now on", "今后我会常来。", "I will come often from now on.", 2),
            ex("from now on", "今后我们都要更认真。", "From now on, we all need to be more serious.", 2),
            ex("in the future", "今后他会在这里工作。", "He will work here in the future.", 2),
        ],
    },
    "new-hsk-2-0297": {
        "primary_gloss": "near; close",
        "secondary_glosses": ["recent"],
        "notes": "Common adjective meaning near or close. It can also describe something recent in time.",
        "examples": [
            ex("near", "我家离学校很近。", "My home is near the school.", 2),
            ex("close", "车站跟我家很近。", "The station is close to my home.", 2),
            ex("close", "我们两家住得很近。", "Our families live close to each other.", 2),
        ],
    },
    "new-hsk-2-0307": {
        "primary_gloss": "sentence; line",
        "secondary_glosses": ["measure word for sentences"],
        "notes": "Common noun and measure word for sentences or lines of speech and writing.",
        "examples": [
            ex("sentence", "请你再说一句。", "Please say one more sentence.", 2),
            ex("sentence", "老师让我写三句。", "The teacher asked me to write three sentences.", 2),
            ex("sentence", "这句有点长。", "This sentence is a bit long.", 2),
        ],
    },
    "new-hsk-2-0402": {
        "primary_gloss": "do; handle; fix",
        "secondary_glosses": ["make ready", "get done"],
        "notes": (
            "Common verb for doing, handling, fixing, or getting something ready. It usually "
            "needs an object or complement."
        ),
        "examples": [
            ex("handle", "这件事我自己来弄。", "I will handle this myself.", 2),
            ex("fix", "我的手机弄好了。", "My phone is fixed now.", 2),
            ex("make", "这个菜是爸爸弄的。", "Dad made this dish.", 2),
        ],
    },
    "new-hsk-2-0474": {
        "primary_gloss": "teenager; youth",
        "secondary_glosses": ["young person"],
        "notes": "Common noun meaning a teenager or young person, especially a boy or youth.",
        "examples": [
            ex("teenager", "那个少年今年十六岁。", "That teenager is sixteen this year.", 2),
            ex("teenager", "两个少年在车站等朋友。", "Two teenagers are waiting for a friend at the station.", 2),
            ex("youth", "这个少年很喜欢运动。", "This young person really likes sports.", 2),
        ],
    },
    "new-hsk-2-0524": {
        "primary_gloss": "hurt; ache",
        "secondary_glosses": [],
        "notes": "Common adjective and verb for pain, hurting, or aching.",
        "examples": [
            ex("hurt", "我头很疼。", "My head hurts badly.", 1),
            ex("ache", "他的腿有点疼。", "His leg aches a little.", 2),
            ex("hurt", "你的脚还疼吗？", "Does your foot still hurt?", 2),
        ],
    },
    "new-hsk-2-0525": {
        "primary_gloss": "carry; lift; mention",
        "secondary_glosses": [],
        "notes": "Common verb meaning carry or lift. It can also mean bring up or mention a topic.",
        "examples": [
            ex("carry", "她提着包去学校。", "She is carrying a bag to school.", 2),
            ex("carry", "爸爸提着水回家。", "Dad is carrying water home.", 2),
            ex("mention", "这个问题我明天再提。", "I will bring up this question tomorrow.", 2),
        ],
    },
    "new-hsk-2-0595": {
        "primary_gloss": "ring; loud",
        "secondary_glosses": ["sound loudly"],
        "notes": "Common verb and adjective for making a sound, ringing, or being loud.",
        "examples": [
            ex("ring", "电话响了。", "The phone rang.", 1),
            ex("loud", "这个音乐太响了。", "This music is too loud.", 2),
            ex("loud", "外面的声音很响。", "The sound outside is loud.", 2),
        ],
    },
    "new-hsk-2-0600": {
        "primary_gloss": "camera",
        "secondary_glosses": [],
        "notes": "Common noun meaning camera.",
        "examples": [
            ex("camera", "我想买一个新相机。", "I want to buy a new camera.", 2),
            ex("camera", "爸爸带相机出去了。", "Dad went out with the camera.", 2),
            ex("camera", "这个相机有点贵。", "This camera is a bit expensive.", 2),
        ],
    },
    "new-hsk-2-0602": {
        "primary_gloss": "small; little; young",
        "secondary_glosses": [],
        "notes": "Common adjective meaning small or little. It can also describe someone as young.",
        "examples": [
            ex("small", "这个房间有点小。", "This room is a bit small.", 1),
            ex("young", "那个孩子还小。", "That child is still young.", 1),
            ex("small", "我想买小一点的碗。", "I want to buy a slightly smaller bowl.", 2),
        ],
    },
    "new-hsk-2-0612": {
        "primary_gloss": "shoe; shoes",
        "secondary_glosses": [],
        "notes": "Common noun meaning shoe or shoes.",
        "examples": [
            ex("shoes", "我想买新鞋。", "I want to buy new shoes.", 2),
            ex("shoes", "我的鞋有点大。", "My shoes are a bit big.", 2),
            ex("shoes", "他的鞋在床下。", "His shoes are under the bed.", 2),
        ],
    },
    "new-hsk-2-0668": {
        "primary_gloss": "cloudy; overcast",
        "secondary_glosses": [],
        "notes": "Common weather word meaning cloudy or overcast.",
        "examples": [
            ex("cloudy", "今天天很阴。", "It is very cloudy today.", 1),
            ex("overcast", "外面很阴，好像要下雨。", "It is very overcast outside, and it looks like rain.", 2),
            ex("cloudy", "早上还好，下午忽然阴了。", "The morning was fine, but it suddenly turned cloudy in the afternoon.", 2),
        ],
    },
    "new-hsk-2-0690": {
        "primary_gloss": "language",
        "secondary_glosses": ["speech"],
        "notes": (
            "Common noun meaning language. It can also refer to speech or the language "
            "people use to communicate."
        ),
        "examples": [
            ex("language", "中文和英文都是语言。", "Chinese and English are both languages.", 2),
            ex("language", "我很喜欢学语言。", "I really like studying languages.", 2),
            ex("language", "学语言要多听多说。", "To learn a language, you need to listen and speak a lot.", 2),
        ],
    },
    "new-hsk-2-0693": {
        "primary_gloss": "yard; courtyard",
        "secondary_glosses": ["institution; hospital (in compounds)"],
        "notes": (
            "As a standalone word, 院 commonly means a yard or courtyard. In compounds, "
            "it can also refer to an institution or hospital."
        ),
        "examples": [
            ex("yard", "院里有很多花。", "There are many flowers in the yard.", 2),
            ex("courtyard", "我们在院里说话。", "We are talking in the courtyard.", 2),
            ex("yard", "这个院不大，可是很安静。", "This yard is not big, but it is very quiet.", 2),
        ],
    },
    "new-hsk-2-0714": {
        "primary_gloss": "stop; stand still",
        "secondary_glosses": [],
        "notes": "Common verb meaning stop and stay where you are.",
        "examples": [
            ex("stop", "老师叫我站住。", "The teacher told me to stop.", 2),
            ex("stop", "他听见以后马上站住了。", "He stopped right away after hearing it.", 2),
            ex("stop", "前面的孩子听见以后站住了。", "The child in front stopped after hearing it.", 2),
        ],
    },
    "new-hsk-2-0733": {
        "primary_gloss": "paper",
        "secondary_glosses": [],
        "notes": "Common noun meaning paper.",
        "examples": [
            ex("paper", "我想买纸。", "I want to buy paper.", 2),
            ex("paper", "老师说纸在桌子上。", "The teacher said the paper is on the table.", 2),
            ex("paper", "他在纸上写了名字。", "He wrote his name on the paper.", 2),
        ],
    },
    "new-hsk-2-0762": {
        "primary_gloss": "mouth",
        "secondary_glosses": [],
        "notes": "Common noun meaning mouth.",
        "examples": [
            ex("mouth", "她的嘴很小。", "Her mouth is very small.", 1),
            ex("mouth", "他的嘴里还有饭。", "He still has food in his mouth.", 2),
            ex("mouth", "孩子吃饭的时候，嘴上都是饭。", "When the child eats, there is food all around the mouth.", 2),
        ],
    },
}


def main() -> int:
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    lexicon = orchestrator.build_allowed_lexicon("new-hsk-2-words", conn)

    target_word_ids = set(REPAIRS)
    existing_sentences: dict[str, set[str]] = {}
    existing_translations: dict[str, set[str]] = {}
    for row in conn.execute("SELECT word_id, sentence, translation FROM examples WHERE word_id LIKE 'new-hsk-2-%'"):
        if row["word_id"] in target_word_ids:
            continue
        existing_sentences.setdefault(row["sentence"], set()).add(row["word_id"])
        existing_translations.setdefault(row["translation"], set()).add(row["word_id"])

    failures: list[str] = []
    seen_sentences: dict[str, str] = {}
    seen_translations: dict[str, str] = {}
    payloads: list[dict] = []

    for word_id, spec in REPAIRS.items():
        base = conn.execute(
            "SELECT id, lang, lemma, display_form, pos, rank, pronunciation FROM words WHERE id = ?",
            (word_id,),
        ).fetchone()
        if not base:
            failures.append(f"missing word row: {word_id}")
            continue

        variants = orchestrator.display_form_variants(base["display_form"])
        examples = []
        translations = []
        for slot, example in enumerate(spec["examples"], start=1):
            sentence = example["sentence"]
            translation = example["translation"]
            cleaned = orchestrator.clean_sentence_for_segmentation(sentence)

            if not orchestrator.can_segment_with_lexicon(cleaned, lexicon):
                failures.append(f"{word_id}: lexicon failure: {sentence}")
            if not any(variant and variant in sentence for variant in variants):
                failures.append(f"{word_id}: missing lemma in sentence: {sentence}")
            if sentence in existing_sentences:
                failures.append(f"{word_id}: cross-word duplicate sentence already exists: {sentence}")
            if translation in existing_translations:
                failures.append(f"{word_id}: cross-word duplicate translation already exists: {translation}")
            if sentence in seen_sentences and seen_sentences[sentence] != word_id:
                failures.append(
                    f"{word_id}: duplicate sentence in repair set with {seen_sentences[sentence]}: {sentence}"
                )
            if translation in seen_translations and seen_translations[translation] != word_id:
                failures.append(
                    f"{word_id}: duplicate translation in repair set with {seen_translations[translation]}: {translation}"
                )

            seen_sentences[sentence] = word_id
            seen_translations[translation] = word_id

            examples.append(
                {
                    "id": f"{word_id}-ex{slot}",
                    "meaning_en": example["meaning_en"],
                    "sentence": sentence,
                    "difficulty": example["difficulty"],
                    "source": "orchestrator-repair",
                    "is_primary": slot == 1,
                }
            )
            translations.append({"example_id": f"{word_id}-ex{slot}", "translation": translation})

        payloads.append(
            {
                "word": {
                    "id": base["id"],
                    "lang": base["lang"],
                    "lemma": base["lemma"],
                    "display_form": base["display_form"],
                    "pos": base["pos"],
                    "rank": base["rank"],
                    "pronunciation": base["pronunciation"],
                },
                "glosses": {
                    "primary_gloss": spec["primary_gloss"],
                    "secondary_glosses": spec["secondary_glosses"],
                    "notes": spec["notes"],
                },
                "examples": examples,
                "example_translations": translations,
            }
        )

    if failures:
        for failure in failures:
            print(failure)
        return 1

    output_path = Path(OUTPUT_PATH)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        "".join(json.dumps(payload, ensure_ascii=False) + "\n" for payload in payloads),
        encoding="utf-8",
    )
    print(json.dumps({"status": "ok", "file": OUTPUT_PATH, "count": len(payloads)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
