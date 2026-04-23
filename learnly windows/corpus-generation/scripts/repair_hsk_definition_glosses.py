import json
import os
import sqlite3


ROOT = "/Users/moi/Desktop/business/learnly/corpus-generation"


DBS = {
    "hsk1": {
        "path": os.path.join(ROOT, "corpus.sqlite"),
        "dataset_id": "new-hsk-1-words",
    },
    "hsk2": {
        "path": os.path.join(ROOT, "corpus-hsk-2.sqlite"),
        "dataset_id": "new-hsk-2-words",
    },
    "hsk3": {
        "path": os.path.join(ROOT, "corpus-hsk-3.sqlite"),
        "dataset_id": "new-hsk-3-words",
    },
    "hsk4": {
        "path": os.path.join(ROOT, "corpus-hsk-4.sqlite"),
        "dataset_id": "new-hsk-4-words",
    },
}


def patch(primary, secondary, notes):
    return {
        "primary": primary,
        "secondary": secondary,
        "notes": notes,
    }


PATCHES = {
    "hsk1": {
        "new-hsk-1-0005": patch(
            "sentence-final particle; let's; okay?",
            ["used for suggestions", "softening", "guessing tone"],
            "A very common particle at the end of a sentence. It can soften a suggestion or request, invite agreement, or add a guessing tone.",
        ),
        "new-hsk-1-0024": patch(
            "than; compare with",
            ["compared with", "to compare"],
            "Most often used for comparisons. The basic pattern is A 比 B + adjective or phrase.",
        ),
        "new-hsk-1-0025": patch(
            "don't; other",
            ["do not", "separate"],
            "Most often this is the negative command word don't. It also commonly means other or separate in words like 别的 and 别人.",
        ),
        "new-hsk-1-0054": patch(
            "from; starting from",
            ["starting at", "through"],
            "A basic preposition for a starting point in time or place. It is very common in movement patterns and time expressions.",
        ),
        "new-hsk-1-0066": patch(
            "adverbial particle; -ly marker",
            ["used after an adverbial modifier"],
            "This particle links the word before it to the verb after it. It often works a bit like an English -ly pattern.",
        ),
        "new-hsk-1-0067": patch(
            "possessive particle; modifier marker",
            ["of", "used after modifiers"],
            "This is one of the most common grammar words in Chinese. It often marks possession or links a descriptive phrase to a noun.",
        ),
        "new-hsk-1-0075": patch(
            "ordinal marker: first / second / third",
            ["number marker for order"],
            "This comes before a number to show order, as in first, second, or third.",
        ),
        "new-hsk-1-0121": patch(
            "give; to; for",
            ["give to", "for someone's benefit"],
            "The core meaning is give. It is also very common in simple grammar patterns meaning to or for.",
        ),
        "new-hsk-1-0122": patch(
            "with; follow",
            ["together with", "to follow"],
            "Most often this means with in beginner material. It also commonly means to follow someone or something.",
        ),
        "new-hsk-1-0132": patch(
            "still; also; yet",
            ["in addition", "still not"],
            "A very common adverb. It often means still, also, or yet, depending on the sentence.",
        ),
        "new-hsk-1-0133": patch(
            "or; still",
            ["or (in questions)", "still"],
            "Very common in questions with two choices, where it means or. It can also mean still in other contexts.",
        ),
        "new-hsk-1-0145": patch(
            "and; with",
            ["together with"],
            "Most often this is the conjunction and. It can also mean with in some common patterns.",
        ),
        "new-hsk-1-0186": patch(
            "then; right away; as soon as",
            ["only then", "precisely"],
            "A very common grammar word. It often means then or right away, and in some sentences it adds a stronger sense like only then.",
        ),
        "new-hsk-1-0213": patch(
            "inside; in",
            ["within"],
            "A basic location word meaning inside or in. It is often used after a place word.",
        ),
        "new-hsk-1-0315": patch(
            "on; above; previous; go up",
            ["upper", "last"],
            "This word has several very common meanings. It can mean on or above, previous or last, and also to go up or get on.",
        ),
        "new-hsk-1-0389": patch(
            "under; below; next; go down",
            ["lower", "down"],
            "This word has several very common meanings. It can mean under or below, next, and also to go down or get off.",
        ),
        "new-hsk-1-0469": patch(
            "particle showing an ongoing state",
            ["state marker", "-ing-like marker"],
            "This particle shows that a state, action, or posture is continuing, like standing, wearing, or being placed somewhere.",
        ),
        "new-hsk-1-0472": patch(
            "right now; exactly",
            ["just", "precisely"],
            "Most often this means exactly or right at this moment, depending on the sentence.",
        ),
    },
    "hsk2": {
        "new-hsk-2-0001": patch(
            "ah; oh; sentence-final particle",
            ["particle for surprise or emphasis"],
            "A very common particle used for surprise, response, softening, or emphasis. It often appears at the end of a sentence.",
        ),
        "new-hsk-2-0031": patch(
            "not only",
            ["not only ... but also ..."],
            "Usually appears in a paired structure to add another point.",
        ),
        "new-hsk-2-0046": patch(
            "only; not until",
            ["only then", "as late as"],
            "This often means only, or not until a certain time or condition.",
        ),
        "new-hsk-2-0107": patch(
            "when; at the time of",
            ["serve as", "be"],
            "At this level the most important meaning is when or at the time of. In other contexts it can also mean to serve as or to be.",
        ),
        "new-hsk-2-0117": patch(
            "if; if it is the case that",
            ["in the case of"],
            "Usually follows a phrase or clause and turns it into an if condition.",
        ),
        "new-hsk-2-0118": patch(
            "particle after a verb showing degree or result",
            ["complement particle"],
            "This particle links a verb to the degree, result, or description that comes after it.",
        ),
        "new-hsk-2-0120": patch(
            "and so on; etc.",
            ["et cetera"],
            "Used after a list to mean and so on or etc.",
        ),
        "new-hsk-2-0145": patch(
            "toward; to; with regard to",
            ["to", "about"],
            "This preposition points something toward a person, thing, or topic. It often means to, toward, or about.",
        ),
        "new-hsk-2-0148": patch(
            "more; to a greater degree",
            ["much more"],
            "This adverb often follows an adjective or verb to show a greater degree.",
        ),
        "new-hsk-2-0150": patch(
            "how; how very",
            ["what a ..."],
            "Used in exclamations to show strong feeling, like how or how very.",
        ),
        "new-hsk-2-0153": patch(
            "and also; moreover",
            ["what is more"],
            "Used to add another related point, often with a meaning like and also or moreover.",
        ),
        "new-hsk-2-0181": patch(
            "just; just now",
            ["only just"],
            "Usually means just a moment ago or only just.",
        ),
        "new-hsk-2-0183": patch(
            "just; just now",
            ["a moment ago"],
            "A common time adverb meaning just or just now.",
        ),
        "new-hsk-2-0214": patch(
            "good; fine; easy to; okay to",
            ["well", "pleasant to", "ready to"],
            "A very flexible common word. It can describe quality, how someone feels, or how easy and suitable something is to do.",
        ),
        "new-hsk-2-0247": patch(
            "or",
            ["either", "written-style or"],
            "A shorter, more written-style word for or.",
        ),
        "new-hsk-2-0248": patch(
            "or; either...or...",
            ["or else"],
            "Used to link two or more options. It is often a little more neutral or written than 还是.",
        ),
        "new-hsk-2-0652": patch(
            "already",
            ["by now"],
            "Used to show that something has happened by a certain time.",
        ),
        "new-hsk-2-0730": patch(
            "only; just",
            ["merely"],
            "A common adverb meaning only or just.",
        ),
    },
    "hsk3": {
        "new-hsk-3-0004": patch(
            "press; according to",
            ["push", "in accordance with"],
            "Used for pressing something or for doing something according to a rule, order, or method.",
        ),
        "new-hsk-3-0005": patch(
            "according to; in line with",
            ["in accordance with"],
            "Used when something follows a rule, plan, request, or standard.",
        ),
        "new-hsk-3-0006": patch(
            "把; object marker before the verb",
            ["marks what you do with something"],
            "This preposition puts the object before the verb and highlights what is being done to it.",
        ),
        "new-hsk-3-0032": patch(
            "by; passive marker",
            ["used in passive sentences"],
            "A common passive marker in Chinese. It often introduces who did the action to someone or something.",
        ),
        "new-hsk-3-0034": patch(
            "originally; in the first place",
            ["at first", "as things originally were"],
            "Shows the original situation, plan, or expectation before something changed.",
        ),
        "new-hsk-3-0037": patch(
            "compare; relatively; fairly",
            ["rather"],
            "This word can mean to compare two things, and it also often means relatively or fairly.",
        ),
        "new-hsk-3-0052": patch(
            "and; also; not at all (in 并不)",
            ["furthermore", "not in the least"],
            "Often used in written language. It can mean and or also, and in patterns like 并不 it means not at all.",
        ),
        "new-hsk-3-0053": patch(
            "and also; moreover",
            ["in addition"],
            "A common conjunction for adding another point in a slightly more formal way.",
        ),
        "new-hsk-3-0058": patch(
            "no matter; regardless of",
            ["whether ... or ..."],
            "Used in fixed patterns meaning no matter or regardless of.",
        ),
        "new-hsk-3-0083": patch(
            "toward; facing",
            ["in the direction of"],
            "A common preposition showing direction or the way something faces.",
        ),
        "new-hsk-3-0107": patch(
            "except; besides; in addition to",
            ["apart from"],
            "Used to exclude something or to add something extra, depending on the sentence.",
        ),
        "new-hsk-3-0155": patch(
            "order; book; subscribe",
            ["reserve"],
            "Used for ordering something in advance, booking tickets or rooms, or subscribing to newspapers and magazines.",
        ),
        "new-hsk-3-0237": patch(
            "at all; fundamentally",
            ["simply", "from the start"],
            "Very common in strong negation, as in 根本不. It can also refer to the basic nature of something.",
        ),
        "new-hsk-3-0284": patch(
            "well; properly; carefully",
            ["thoroughly"],
            "Most often used as an adverb meaning to do something well, properly, or carefully.",
        ),
    },
    "hsk4": {
        "new-hsk-4-0001": patch(
            "ah; oh; sentence-final particle",
            ["particle for surprise or emphasis"],
            "A very common particle used for reaction, softening, or emphasis. It often appears at the end of a sentence.",
        ),
        "new-hsk-4-0006": patch(
            "press; according to",
            ["push", "in accordance with"],
            "Used for pressing something, or for doing something according to a rule, method, or schedule.",
        ),
        "new-hsk-4-0007": patch(
            "on time; on schedule",
            ["punctually"],
            "Used when something happens at the planned time and not late.",
        ),
        "new-hsk-4-0008": patch(
            "according to; in accordance with",
            ["following"],
            "Used when something follows a rule, plan, request, or standard.",
        ),
        "new-hsk-4-0025": patch(
            "originally; at first",
            ["actually", "in the first place"],
            "Shows the original situation or expectation before something changed. It can also be used to reveal what the situation really was.",
        ),
        "new-hsk-4-0039": patch(
            "and; also; not at all (in 并不)",
            ["furthermore", "not in the least"],
            "Often used in written language. It can mean and or also, and in patterns like 并不 it means not at all.",
        ),
        "new-hsk-4-0040": patch(
            "and also; moreover",
            ["furthermore"],
            "A conjunction used to add another point, often in a slightly more formal style.",
        ),
        "new-hsk-4-0043": patch(
            "need not; do not have to",
            ["there is no need to"],
            "Used to say something is unnecessary.",
        ),
        "new-hsk-4-0045": patch(
            "continuously; keep on",
            ["without stopping"],
            "Can describe something that continues without stopping, or an action that keeps happening again and again.",
        ),
        "new-hsk-4-0047": patch(
            "but; however; only",
            ["just"],
            "Very often used to introduce a contrast, like but or however. It can also mean only or just in some sentences.",
        ),
        "new-hsk-4-0048": patch(
            "no matter; regardless of",
            ["whether ... or ..."],
            "Used in patterns meaning no matter or regardless of.",
        ),
        "new-hsk-4-0051": patch(
            "have to; cannot avoid",
            ["cannot help but"],
            "Used when someone has no real choice and must do something.",
        ),
        "new-hsk-4-0053": patch(
            "no matter; regardless of",
            ["whether ... or ..."],
            "Used in patterns meaning no matter what happens or regardless of conditions.",
        ),
        "new-hsk-4-0054": patch(
            "not only",
            ["not only ... but also ..."],
            "Usually appears in a paired structure that adds another point.",
        ),
        "new-hsk-4-0055": patch(
            "not only",
            ["not only ... but also ..."],
            "Usually appears in a paired structure that adds another point.",
        ),
        "new-hsk-4-0070": patch(
            "almost; nearly; just about",
            ["came close to"],
            "Used when something nearly happened but did not quite happen.",
        ),
        "new-hsk-4-0086": patch(
            "again; once more; repeat",
            ["do again"],
            "This reading is common for doing something again or repeating it.",
        ),
        "new-hsk-4-0099": patch(
            "this; this matter",
            ["this point", "this one"],
            "A formal written word meaning this.",
        ),
        "new-hsk-4-0103": patch(
            "ever; always (usually in negatives)",
            ["at any time in the past"],
            "Very often used in patterns like 从来不 or 从来没, meaning never ever up to now.",
        ),
        "new-hsk-4-0104": patch(
            "from it; from among them",
            ["from among"],
            "Used when choosing, learning, or getting something out of a group or situation.",
        ),
        "new-hsk-4-0135": patch(
            "serve as; be; when",
            ["at the time of"],
            "Can mean to serve as or be, and it also appears in time expressions meaning when.",
        ),
        "new-hsk-4-0139": patch(
            "fall over; however; instead",
            ["pour", "on the contrary"],
            "As a verb it can mean fall over or pour. As an adverb it often introduces an unexpected contrast, like however or instead.",
        ),
        "new-hsk-4-0141": patch(
            "in the end; after all; exactly",
            ["what on earth", "to the end"],
            "Often used in questions for emphasis, as in exactly or after all. It can also refer to the final outcome.",
        ),
        "new-hsk-4-0147": patch(
            "and so on; etc.; class / grade",
            ["measure word", "rank"],
            "Most often used after a list to mean and so on. It can also refer to class or rank, and it is used as a measure word in some set phrases.",
        ),
        "new-hsk-4-0148": patch(
            "wait until; by the time",
            ["when the time comes"],
            "Used for reaching a certain time or stage before something happens.",
        ),
        "new-hsk-4-0176": patch(
            "toward; with regard to; about",
            ["as for", "regarding"],
            "A formal preposition used to introduce the person or thing being talked about.",
        ),
        "new-hsk-4-0180": patch(
            "how; how very",
            ["what a ..."],
            "Used in exclamations to show strong feeling.",
        ),
        "new-hsk-4-0183": patch(
            "and; but; while",
            ["yet"],
            "A common written conjunction that can link ideas with and, while, or but depending on the relationship.",
        ),
        "new-hsk-4-0206": patch(
            "otherwise; if not",
            ["or else"],
            "Used to show what will happen if the first condition is not met.",
        ),
        "new-hsk-4-0244": patch(
            "each; every; respectively",
            ["each one"],
            "Used to talk about each member of a group, and sometimes to mean respectively.",
        ),
        "new-hsk-4-0246": patch(
            "each; every single",
            ["every one"],
            "Used before a noun to stress each member of a group.",
        ),
        "new-hsk-4-0247": patch(
            "everyone; ladies and gentlemen",
            ["everyone present"],
            "A polite way to address a group of people.",
        ),
        "new-hsk-4-0258": patch(
            "altogether; in total; together",
            ["jointly"],
            "Can mean together, or it can be used to give a total number or amount.",
        ),
        "new-hsk-4-0260": patch(
            "enough; be enough; sufficiently",
            ["reach the required amount"],
            "Can describe enough quantity, or say that something reaches the needed level.",
        ),
        "new-hsk-4-0274": patch(
            "light; bare; only",
            ["smooth", "used up"],
            "As a noun it means light. As an adjective it can mean bare or smooth. In speech it can also mean only, and as a verb it can mean used up.",
        ),
        "new-hsk-4-0291": patch(
            "well; properly; carefully",
            ["thoroughly"],
            "Most often used as an adverb meaning to do something well, properly, or carefully.",
        ),
        "new-hsk-4-0301": patch(
            "each other; mutually",
            ["one another"],
            "Shows that two or more people do something to one another.",
        ),
        "new-hsk-4-0319": patch(
            "basic; basically",
            ["fundamental", "essentially"],
            "Can describe the basic nature of something, or mean basically as an adverb.",
        ),
        "new-hsk-4-0325": patch(
            "timely; in time; promptly",
            ["without delay"],
            "Used when something happens soon enough and not too late.",
        ),
        "new-hsk-4-0326": patch(
            "even if; even though",
            ["even when"],
            "Used to introduce a condition that does not change the result.",
        ),
        "new-hsk-4-0327": patch(
            "already; since; both...and...",
            ["as well as"],
            "Can mean already, and in paired patterns like 既...又... it means both...and.... It can also help introduce a reason, like since.",
        ),
        "new-hsk-4-0330": patch(
            "since; now that",
            ["given that"],
            "Used to introduce a reason that is already known or accepted.",
        ),
        "new-hsk-4-0339": patch(
            "plus; add; together with",
            ["on top of that"],
            "Can mean to add something, or together with something extra.",
        ),
        "new-hsk-4-0356": patch(
            "will; be going to; formal object marker",
            ["take ... and", "bring forward in formal style"],
            "A common written word for future action. In more formal grammar it can also bring the object before the verb.",
        ),
        "new-hsk-4-0381": patch(
            "then; continue; go on",
            ["next", "follow"],
            "Can mean then or next, and it can also mean to continue with what comes after.",
        ),
        "new-hsk-4-0382": patch(
            "result; as a result; in the end",
            ["outcome", "it turned out that"],
            "Can mean the result itself, and it is also used to introduce what happened in the end.",
        ),
        "new-hsk-4-0388": patch(
            "only",
            ["merely", "solely"],
            "A formal adverb meaning only.",
        ),
        "new-hsk-4-0389": patch(
            "although; even though; feel free to",
            ["despite that", "go ahead and"],
            "As a conjunction it means although or even though. Before a verb it can also mean feel free to or go ahead and.",
        ),
        "new-hsk-4-0390": patch(
            "only; merely",
            ["simply", "just"],
            "A stronger, more formal adverb meaning only or merely.",
        ),
        "new-hsk-4-0407": patch(
            "exactly; after all; in the end",
            ["what on earth", "the outcome"],
            "Often used in questions for emphasis, like exactly or what on earth. It can also refer to the final outcome of a matter.",
        ),
        "new-hsk-4-0408": patch(
            "exactly; namely; simply is",
            ["precisely", "that is to say"],
            "Often used for emphasis or exact identity. It can also mean namely or simply is.",
        ),
        "new-hsk-4-0419": patch(
            "joke; kid; make fun of",
            ["be kidding", "tease"],
            "Can mean to joke, kid around, or make fun of someone, depending on the context.",
        ),
        "new-hsk-4-0436": patch(
            "empty; free; in vain",
            ["vacant", "for nothing"],
            "Can describe an empty space, free time, or effort that leads to nothing.",
        ),
        "new-hsk-4-0438": patch(
            "I'm afraid; probably; to fear",
            ["perhaps"],
            "Very often used to soften a judgment, like I'm afraid or probably. It can also mean to fear.",
        ),
        "new-hsk-4-0439": patch(
            "leave empty; free up time; free time",
            ["make time", "empty"],
            "As a verb it can mean leave empty or make time free. As a noun or adjective it can refer to free time or being free.",
        ),
        "new-hsk-4-0469": patch(
            "even; including; connect",
            ["link", "join"],
            "Often used in patterns like 连...都/也 to mean even. It can also mean to connect or join things.",
        ),
        "new-hsk-4-0480": patch(
            "other; another; separately",
            ["otherwise"],
            "Used to mean another or other, and sometimes separately.",
        ),
        "new-hsk-4-0481": patch(
            "in addition; besides; other",
            ["else", "moreover"],
            "Very often used to add another point. It can also mean other or else.",
        ),
        "new-hsk-4-0523": patch(
            "could it be that...?; really?",
            ["rhetorical-question marker"],
            "Used in rhetorical questions to show surprise, doubt, or strong challenge.",
        ),
        "new-hsk-4-0567": patch(
            "next; second; secondly",
            ["after that"],
            "Used to introduce the second point or the next point in an explanation.",
        ),
        "new-hsk-4-0575": patch(
            "by all means; absolutely; ten million",
            ["absolutely not (with 不要)"],
            "In daily use this is very often an emphatic word, especially in 千万不要 for absolutely do not. It can also literally mean ten million.",
        ),
        "new-hsk-4-0598": patch(
            "whole; complete; entirely",
            ["all over"],
            "Can describe something whole or complete, and it can also mean entirely.",
        ),
        "new-hsk-4-0600": patch(
            "all; all of them",
            ["entirely"],
            "Used to mean the whole group, all of them.",
        ),
        "new-hsk-4-0606": patch(
            "but; yet; however",
            ["unexpectedly"],
            "Used to introduce a contrast, often one that feels unexpected.",
        ),
        "new-hsk-4-0613": patch(
            "any; any ... at all",
            ["whatever"],
            "Used before a noun to mean any or any ... at all.",
        ),
        "new-hsk-4-0616": patch(
            "still; yet",
            ["nevertheless"],
            "A formal word meaning still or yet.",
        ),
        "new-hsk-4-0617": patch(
            "still; yet",
            ["nevertheless"],
            "A fuller form of 仍, meaning still or yet.",
        ),
        "new-hsk-4-0633": patch(
            "a little; slightly",
            ["a bit"],
            "Used to reduce the degree a little.",
        ),
        "new-hsk-4-0634": patch(
            "a little; slightly",
            ["a bit"],
            "Used to reduce the degree a little.",
        ),
        "new-hsk-4-0657": patch(
            "very; extremely; fully",
            ["completely"],
            "Most often used as a formal, strong adverb meaning very or extremely.",
        ),
        "new-hsk-4-0660": patch(
            "actually; in fact",
            ["in reality"],
            "Used to correct, clarify, or reveal the real situation.",
        ),
        "new-hsk-4-0664": patch(
            "really; truly; honest",
            ["indeed", "reliable"],
            "Very often used as an adverb meaning really or truly. As an adjective it can describe a person or attitude as honest and dependable.",
        ),
        "new-hsk-4-0670": patch(
            "whether; whether or not",
            ["if"],
            "Used to present two possibilities, like whether or whether not.",
        ),
        "new-hsk-4-0683": patch(
            "first; first of all",
            ["firstly"],
            "Used to introduce the first point in an explanation or sequence.",
        ),
        "new-hsk-4-0696": patch(
            "while you're at it; on the way; by the way",
            ["in passing"],
            "Used when doing one thing at the same time as another, often conveniently on the way or while you are already doing something.",
        ),
        "new-hsk-4-0766": patch(
            "often; tend to",
            ["as a rule"],
            "Used for something that often happens as a general tendency, not just one repeated event.",
        ),
        "new-hsk-4-0784": patch(
            "no matter; regardless of",
            ["whether ... or ..."],
            "Used in patterns meaning no matter or regardless of.",
        ),
        "new-hsk-4-0804": patch(
            "opposite; on the contrary",
            ["contrary"],
            "Can describe something opposite, or introduce the opposite situation with on the contrary.",
        ),
        "new-hsk-4-0805": patch(
            "each other; mutual",
            ["one another"],
            "Used for a mutual relationship or for actions done to each other.",
        ),
        "new-hsk-4-0859": patch(
            "if; if it happens that",
            ["supposing"],
            "A common spoken conjunction meaning if.",
        ),
        "new-hsk-4-0861": patch(
            "maybe; perhaps",
            ["possibly"],
            "Used when something is uncertain.",
        ),
        "new-hsk-4-0865": patch(
            "everything; all",
            ["all things"],
            "A formal, broad word for everything as a whole.",
        ),
        "new-hsk-4-0866": patch(
            "already",
            ["finished", "ended"],
            "A formal written word meaning already. In some compounds it also relates to something being finished or ended.",
        ),
        "new-hsk-4-0871": patch(
            "therefore; so",
            ["for this reason"],
            "Used to introduce a result or conclusion.",
        ),
        "new-hsk-4-0884": patch(
            "by; from; due to",
            ["through"],
            "Can introduce who does an action, where something comes from, or what something is caused by.",
        ),
        "new-hsk-4-0886": patch(
            "especially; particularly",
            ["above all"],
            "Used to single out something as more important or more noticeable than the rest.",
        ),
        "new-hsk-4-0888": patch(
            "because of; due to",
            ["owing to"],
            "A formal connector used to explain the cause or reason for something.",
        ),
        "new-hsk-4-0896": patch(
            "so; therefore; as a result",
            ["thereupon"],
            "Used to show what happened next because of the earlier situation.",
        ),
        "new-hsk-4-0897": patch(
            "with; and",
            ["together with"],
            "A written-style word meaning with or and.",
        ),
        "new-hsk-4-0900": patch(
            "originally; it turns out; former",
            ["at first"],
            "Can mean originally or former. In many sentences it also means it turns out, when the real situation becomes clear.",
        ),
        "new-hsk-4-0906": patch(
            "about; approximately; arrange to meet",
            ["make an appointment"],
            "As an adverb it often means about or approximately. As a verb it can mean to arrange a meeting or appointment.",
        ),
        "new-hsk-4-0915": patch(
            "besides; anyway; say again",
            ["talk about later"],
            "Often used to add another point, like besides or anyway. In phrases like 以后再说 it can mean talk about it later.",
        ),
        "new-hsk-4-0926": patch(
            "person who...; -er suffix",
            ["one who"],
            "A formal noun ending meaning a person connected with the action or quality before it.",
        ),
        "new-hsk-4-0933": patch(
            "just right; just in time; happen to",
            ["coincidentally"],
            "Can mean exactly right, just in time, or happen to do something at the right moment.",
        ),
        "new-hsk-4-0938": patch(
            "classical particle meaning 'of', 'him', or 'it'",
            ["classical linking particle"],
            "A classical written word that often links nouns or refers back to a person or thing.",
        ),
        "new-hsk-4-0953": patch(
            "have no choice but to",
            ["be forced to"],
            "Used when the situation leaves only one practical choice.",
        ),
        "new-hsk-4-0956": patch(
            "at least",
            ["no less than"],
            "Used to give a minimum amount or standard.",
        ),
        "new-hsk-4-0961": patch(
            "key point; focus; mainly",
            ["emphasis"],
            "Can refer to the most important point, and in some contexts it means mainly or with emphasis.",
        ),
        "new-hsk-4-0968": patch(
            "specially; for a particular purpose; specialized",
            ["specifically"],
            "Can mean done especially for one purpose, or describe something specialized.",
        ),
        "new-hsk-4-0975": patch(
            "accurate; exact; sure to",
            ["definitely", "certainly"],
            "Can describe something precise or exact, and in some contexts it means sure to or certain to.",
        ),
        "new-hsk-4-0980": patch(
            "from; since; oneself",
            ["self-", "starting from"],
            "Often means from or since. In compounds it can also relate to oneself or self-.",
        ),
        "new-hsk-4-0981": patch(
            "nature; natural; naturally; of course",
            ["the natural world"],
            "Can refer to nature itself, describe something as natural, or mean naturally / of course as an adverb.",
        ),
        "new-hsk-4-0996": patch(
            "as; act as; take ... as",
            ["serve as", "regard as"],
            "Can mean to act as or serve as, and it is also used to introduce a role, identity, or point of view, like as.",
        ),
    },
}


def apply_db_patches(db_key, config, patches):
    conn = sqlite3.connect(config["path"], timeout=30)
    conn.execute("PRAGMA busy_timeout = 30000")
    updated = 0
    seed_updates = 0
    try:
        for word_id, values in patches.items():
            row = conn.execute(
                "SELECT rank FROM words WHERE id = ?",
                (word_id,),
            ).fetchone()
            if row is None:
                raise RuntimeError(f"Missing word row: {word_id}")

            rank = row[0]
            conn.execute(
                """
                UPDATE words
                SET primary_gloss = ?,
                    secondary_glosses_json = ?,
                    notes = ?
                WHERE id = ?
                """,
                (
                    values["primary"],
                    json.dumps(values["secondary"], ensure_ascii=False),
                    values["notes"],
                    word_id,
                ),
            )
            updated += 1

            try:
                cur = conn.execute(
                    """
                    UPDATE source_translation_seeds
                    SET primary_gloss = ?,
                        secondary_glosses_json = ?,
                        notes = ?
                    WHERE dataset_id = ?
                      AND rank = ?
                    """,
                    (
                        values["primary"],
                        json.dumps(values["secondary"], ensure_ascii=False),
                        values["notes"],
                        config["dataset_id"],
                        rank,
                    ),
                )
                seed_updates += cur.rowcount
            except sqlite3.OperationalError:
                pass

        conn.commit()
    finally:
        conn.close()

    return updated, seed_updates


def main():
    total_words = 0
    total_seeds = 0
    for db_key, patches in PATCHES.items():
        updated, seed_updates = apply_db_patches(db_key, DBS[db_key], patches)
        total_words += updated
        total_seeds += seed_updates
        print(f"{db_key}: updated {updated} words, {seed_updates} seed rows")
    print(f"total: updated {total_words} words, {total_seeds} seed rows")


if __name__ == "__main__":
    main()
