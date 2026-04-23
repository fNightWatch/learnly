#!/usr/bin/env python3

import json
from pathlib import Path


BATCH_PATH = Path(__file__).parent / "generated" / "generator-3" / "batch-0101-0150.jsonl"

REPLACEMENTS = {
    "new-hsk-5-0101": {
        "new-hsk-5-0101-ex3": (
            "半年没练，他和大家的水平差距更明显了。",
            "After not practicing for half a year, the gap between him and everyone else became even clearer.",
        ),
    },
    "new-hsk-5-0102": {
        "new-hsk-5-0102-ex2": (
            "这家小店没有叉子，我们只好先用筷子。",
            "This little shop had no forks, so we had to use chopsticks first.",
        ),
        "new-hsk-5-0102-ex3": (
            "孩子第一次用叉子吃面，还不太会用。",
            "It was the child's first time eating noodles with a fork, and he still did not really know how to use it.",
        ),
    },
    "new-hsk-5-0103": {
        "new-hsk-5-0103-ex2": (
            "下雨前，他们把院子里的旧门拆了。",
            "Before it rained, they took down the old gate in the yard.",
        ),
    },
    "new-hsk-5-0105": {
        "new-hsk-5-0105-ex1": (
            "今年天气好，这里的产量比去年高。",
            "The weather has been good this year, so the output here is higher than last year.",
        ),
    },
    "new-hsk-5-0107": {
        "new-hsk-5-0107-ex1": (
            "这个小城以前人少，现在开始发展旅游产业。",
            "This small city used to have few people, but now it has started developing its tourism industry.",
        ),
        "new-hsk-5-0107-ex3": (
            "本地水果卖得好，也带动了这里的服务产业。",
            "Local fruit has been selling well, and that has also boosted the service industry here.",
        ),
    },
    "new-hsk-5-0109": {
        "new-hsk-5-0109-ex2": (
            "买衣服前，最好先量一下长度。",
            "Before buying clothes, it is best to measure the length first.",
        ),
    },
    "new-hsk-5-0113": {
        "new-hsk-5-0113-ex2": (
            "这道菜我没做过，今天想尝试一下。",
            "I have never made this dish before, and I want to try it today.",
        ),
    },
    "new-hsk-5-0115": {
        "new-hsk-5-0115-ex1": (
            "这个决定现在省钱，但长远看不一定好。",
            "This decision saves money now, but it may not be good in the long term.",
        ),
    },
    "new-hsk-5-0120": {
        "new-hsk-5-0120-ex1": (
            "前面的车刚超速，就被警察发现了。",
            "The car in front had just been speeding when the police noticed it.",
        ),
    },
    "new-hsk-5-0121": {
        "new-hsk-5-0121-ex3": (
            "她朝我点点头，然后先上了车。",
            "She nodded toward me and then got into the car first.",
        ),
    },
    "new-hsk-5-0124": {
        "new-hsk-5-0124-ex2": (
            "他听说朋友出了车祸，马上打了电话。",
            "When he heard his friend had been in a car accident, he called right away.",
        ),
    },
    "new-hsk-5-0125": {
        "new-hsk-5-0125-ex2": (
            "这座楼没有车库，晚上停车不太方便。",
            "This building has no garage, so parking at night is not very convenient.",
        ),
    },
    "new-hsk-5-0129": {
        "new-hsk-5-0129-ex1": (
            "房间昨天彻底收拾过了，今天很干净。",
            "The room was tidied up thoroughly yesterday, so it is very clean today.",
        ),
    },
    "new-hsk-5-0130": {
        "new-hsk-5-0130-ex1": (
            "这个盒子太沉，一个人根本搬不动。",
            "This box is so heavy that one person cannot move it at all.",
        ),
    },
    "new-hsk-5-0132": {
        "new-hsk-5-0132-ex1": (
            "村里人都称他师傅，他也笑着答应。",
            "People in the village all call him master, and he answers with a smile.",
        ),
    },
    "new-hsk-5-0133": {
        "new-hsk-5-0133-ex2": (
            "这些书太重，得先称一下再寄。",
            "These books are too heavy, so we need to weigh them before mailing them.",
        ),
    },
    "new-hsk-5-0134": {
        "new-hsk-5-0134-ex3": (
            "老师把这种情况称为正常反应，让我们不用怕。",
            "The teacher called this a normal reaction and told us not to be afraid.",
        ),
    },
    "new-hsk-5-0135": {
        "new-hsk-5-0135-ex3": (
            "这道菜一出来，就被客人连连称赞。",
            "As soon as this dish came out, the guests praised it again and again.",
        ),
    },
    "new-hsk-5-0136": {
        "new-hsk-5-0136-ex1": (
            "这种材料质量好，但成本也更高。",
            "This material is good in quality, but the cost is also higher.",
        ),
    },
    "new-hsk-5-0139": {
        "new-hsk-5-0139-ex3": (
            "医生说，这种药的主要成分不太强。",
            "The doctor said the main ingredient in this medicine is not too strong.",
        ),
    },
    "new-hsk-5-0140": {
        "new-hsk-5-0140-ex1": (
            "大家的成果都放在这里，等老师来看。",
            "Everyone's results are all placed here, waiting for the teacher to come look.",
        ),
    },
}


def main() -> None:
    payloads = []
    for line in BATCH_PATH.read_text().splitlines():
        if not line.strip():
            continue
        payload = json.loads(line)
        word_repairs = REPLACEMENTS.get(payload["word"]["id"], {})
        translations = {
            item["example_id"]: item
            for item in payload["example_translations"]
        }
        for example in payload["examples"]:
            if example["id"] not in word_repairs:
                continue
            sentence, translation = word_repairs[example["id"]]
            example["sentence"] = sentence
            translations[example["id"]]["translation"] = translation
        payload["example_translations"] = [
            translations[item["example_id"]]
            for item in payload["example_translations"]
        ]
        payloads.append(payload)

    BATCH_PATH.write_text(
        "\n".join(json.dumps(payload, ensure_ascii=False) for payload in payloads) + "\n"
    )


if __name__ == "__main__":
    main()
