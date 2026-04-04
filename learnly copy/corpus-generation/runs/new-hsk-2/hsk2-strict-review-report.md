# New HSK 2 Strict Review Report

Primary scan file used: `/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-2/hsk2-strict-review-input.tsv`

Cross-check source: `/tmp/hsk2-review.sqlite` copied from `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-2.sqlite`

Scope: full-corpus review of `new-hsk-2-words`

## Summary

- Critical: 78 entries are still fundamentally broken. Their English example translations still contain raw Chinese, and their example sets are templated, unidiomatic, or sense-wrong. These rows are not usable for learners and need full rewrites.
- High: 9 entries are structurally intact but still have real learner-facing problems in glossing, sense priority, collocation, or English naturalness.
- Medium: 6 entries mainly have polluted secondary-gloss data. Their example sentences are mostly usable, but the glossary layer is still wrong or incomplete.

## Critical

Shared defect for every row in this group:

- What is wrong: at least one English example translation still contains raw Chinese, and the entry still carries templated or semantically broken data in examples, sense labels, or both.
- Why it matters: these rows teach bad English, often bad Chinese, and in several cases the wrong sense entirely. They also fail the user’s “precise, learner-friendly, complete” definition requirement and the HSK2 sentence-difficulty requirement.
- Concrete proposed fix: rewrite the entry end to end. Replace the primary gloss, secondary glosses, notes, all 3 example sentences, all 3 English translations, and the `meaning_en` labels. Keep the most common sense in the primary example and make the sentences concrete, natural, and slightly richer than HSK1 while staying within HSK1+HSK2 vocabulary.

### Critical rows with generic template corruption

- `new-hsk-2-0201` `关机`
- `new-hsk-2-0202` `关心`
- `new-hsk-2-0203` `观点`
- `new-hsk-2-0204` `广场`
- `new-hsk-2-0205` `广告`
- `new-hsk-2-0206` `国际`
- `new-hsk-2-0207` `过来`
- `new-hsk-2-0208` `过年`
- `new-hsk-2-0209` `过去`
- `new-hsk-2-0210` `过`
- `new-hsk-2-0211` `海`
- `new-hsk-2-0212` `海边`
- `new-hsk-2-0213` `喊`
- `new-hsk-2-0218` `好人`
- `new-hsk-2-0219` `好事`
- `new-hsk-2-0222` `河`
- `new-hsk-2-0224` `黑板`
- `new-hsk-2-0230` `湖`
- `new-hsk-2-0231` `护照`
- `new-hsk-2-0232` `花`
- `new-hsk-2-0233` `花园`
- `new-hsk-2-0234` `画`
- `new-hsk-2-0235` `画家`
- `new-hsk-2-0236` `画儿`
- `new-hsk-2-0237` `坏处`
- `new-hsk-2-0238` `坏人`
- `new-hsk-2-0239` `欢迎`
- `new-hsk-2-0240` `换`
- `new-hsk-2-0243` `回`
- `new-hsk-2-0244` `回国`
- `new-hsk-2-0249` `机会`
- `new-hsk-2-0250` `鸡`
- `new-hsk-2-0254` `计算机`
- `new-hsk-2-0255` `加`
- `new-hsk-2-0258` `家庭`
- `new-hsk-2-0259` `家长`
- `new-hsk-2-0261` `假期`
- `new-hsk-2-0262` `检查`
- `new-hsk-2-0263` `见到`
- `new-hsk-2-0264` `见过`
- `new-hsk-2-0265` `件`
- `new-hsk-2-0267` `讲`
- `new-hsk-2-0268` `讲话`
- `new-hsk-2-0269` `交`
- `new-hsk-2-0270` `交给`
- `new-hsk-2-0271` `交朋友`
- `new-hsk-2-0273` `角`
- `new-hsk-2-0275` `饺子`
- `new-hsk-2-0276` `脚`
- `new-hsk-2-0277` `叫作`
- `new-hsk-2-0278` `教师`
- `new-hsk-2-0279` `教室`
- `new-hsk-2-0283` `接到`
- `new-hsk-2-0284` `接受`
- `new-hsk-2-0285` `接下来`
- `new-hsk-2-0286` `接着`
- `new-hsk-2-0287` `街`
- `new-hsk-2-0292` `借`
- `new-hsk-2-0295` `进入`
- `new-hsk-2-0296` `进行`
- `new-hsk-2-0300` `经理`
- `new-hsk-2-0302` `酒店`
- `new-hsk-2-0304` `举`
- `new-hsk-2-0305` `举手`
- `new-hsk-2-0306` `举行`
- `new-hsk-2-0540` `停车场`
- `new-hsk-2-0547` `同事`
- `new-hsk-2-0551` `头发`
- `new-hsk-2-0554` `腿`
- `new-hsk-2-0564` `碗`

### Critical rows with additional sense or logic defects

- `new-hsk-2-0245` `会`
  What is wrong: the entry is supposed to teach the noun sense `meeting`, but all three examples are broken templates like `我常会。`
  Why it matters: this does not teach the target HSK2 sense at all, and it also collides with the very common HSK1 auxiliary sense `can / know how to`.
  Concrete proposed fix: keep the HSK2 noun gloss `meeting` or `meeting; gathering`, then rewrite all examples around real meeting contexts such as class meetings, work meetings, or parent meetings.

- `new-hsk-2-0256` `加油`
  What is wrong: the primary gloss `oil` is wrong for learner use, and the examples are broken templates.
  Why it matters: learners will miss the two core common meanings: `refuel / add fuel` and the encouragement use `come on / keep it up`.
  Concrete proposed fix: widen the gloss to `refuel; add oil; come on / keep it up`, then use the primary example for the most common everyday learner-facing sense and a secondary example for the other.

- `new-hsk-2-0257` `家`
  What is wrong: the primary gloss is the suffix sense `-ist / expert`, but the examples all teach the unrelated `home / family` sense.
  Why it matters: this is a direct sense-priority mismatch. It teaches the wrong word meaning while claiming to teach the suffix sense.
  Concrete proposed fix: decide whether this row is really the suffix entry. If yes, rewrite all examples with forms like `画家`, `作家`, `科学家`. If no, correct the gloss to the intended sense and align the examples.

- `new-hsk-2-0260` `假`
  What is wrong: the gloss says `false`, but the examples are semantically nonsensical: `这个房间很假`, `天气很假`.
  Why it matters: even if the learner remembers the word, they learn impossible collocations.
  Concrete proposed fix: keep a fuller gloss like `fake; false; not real`, then rewrite around objects or situations that can naturally be fake.

- `new-hsk-2-0282` `接`
  What is wrong: the gloss `meet， pick` is malformed and incomplete, and all examples are broken templates.
  Why it matters: `接` is a high-frequency verb with common learner uses like `pick up`, `meet`, `receive`, and sometimes `answer`. The current row teaches none of them cleanly.
  Concrete proposed fix: replace the gloss with `meet; pick up; receive`, then use natural examples like meeting someone at a station or picking up a child after school.

- `new-hsk-2-0299` `经过`
  What is wrong: the primary gloss `after` is too narrow and the examples are broken templates.
  Why it matters: the common HSK2 learner-facing use is often the verb sense `pass by / go through`, not just a vague post-event meaning.
  Concrete proposed fix: broaden the gloss to `pass by; go through; after`, and make the primary example teach the verb sense.

- `new-hsk-2-0301` `酒`
  What is wrong: the primary gloss `alcohol` is too chemical and the examples are broken templates.
  Why it matters: beginners need the everyday noun sense `alcoholic drink; wine; liquor`, not the lab-like abstract noun.
  Concrete proposed fix: change the gloss to `alcoholic drink; wine; liquor`, then rewrite the examples around drinking, buying, or not drinking alcohol.

- `new-hsk-2-0601` `像`
  What is wrong: all three examples are broken and the English still contains raw Chinese. The entry also under-teaches the common `look like / resemble` use.
  Why it matters: `像` is a very common comparison verb; broken examples here damage both sentence quality and meaning acquisition.
  Concrete proposed fix: keep the gloss `be like; look like; resemble` and rewrite all 3 examples around clear person/object comparisons.

## High

- `new-hsk-2-0178` `感觉`
  What is wrong: example 2 English is unnatural: `Mom has a feeling of being a little tired.`
  Why it matters: the Chinese sentence is simple and natural, but the translation teaches clumsy English instead of learner-friendly English.
  Concrete proposed fix: keep the Chinese, but change the English to `Mom feels a little tired.` Also keep the gloss fuller as `feel; feeling`.

- `new-hsk-2-0214` `好`
  What is wrong: the primary gloss is only `well`, but the examples teach `good`, `good to watch/read`, and `study well`.
  Why it matters: the current gloss is too narrow and mismatches the actual sentence set.
  Concrete proposed fix: expand the entry to `good; well; fine; easy to` and make the primary example clearly teach the most common adjective sense.

- `new-hsk-2-0221` `合适`
  What is wrong: the secondary-gloss field contains sentence translations instead of meanings, and example 3 English is stiff: `It is very suitable to go now.`
  Why it matters: the glossary layer is dirty, and the English is not how a learner would naturally say it.
  Concrete proposed fix: replace the secondary glosses with real meanings like `suitable; appropriate; a good fit`, and change example 3 English to something like `Now is a good time to go.`

- `new-hsk-2-0228` `后来`
  What is wrong: the secondary-gloss field is polluted, and examples 1-2 are too flat and slightly awkward for `后来`.
  Why it matters: `后来` usually works best across a clearer narrative shift. These sentences feel HSK1-simple and under-teach the connective use.
  Concrete proposed fix: keep the later-time narrative sense, but rewrite the examples with more natural event progression such as `开始...后来...`.

- `new-hsk-2-0248` `或者`
  What is wrong: the primary gloss is `perhaps`, but all three examples clearly teach `or`.
  Why it matters: this is a direct gloss/example mismatch on a core function word.
  Concrete proposed fix: change the primary gloss to `or`, optionally with a note that it is slightly more formal or written than `还是` in some contexts.

- `new-hsk-2-0252` `急`
  What is wrong: the primary gloss is `fast`, but the examples teach `be anxious / be in a hurry`.
  Why it matters: learners will build the wrong mental meaning for a very common adjective.
  Concrete proposed fix: change the gloss to `anxious; in a hurry; urgent`, and keep the current example direction.

- `new-hsk-2-0272` `交通`
  What is wrong: examples 2-3 use awkward Chinese collocations: `路口交通很多`, `车站旁边交通很忙`.
  Why it matters: even though the English is understandable, the Chinese is not a natural model for learners.
  Concrete proposed fix: rewrite around natural collocations like `这里交通很方便`, `下班的时候路上车很多`, or `这个路口交通很乱`.

- `new-hsk-2-0280` `教学`
  What is wrong: the primary gloss is `teach`, but all examples are noun-like `teaching / instruction` uses.
  Why it matters: the part of speech and sense priority are misaligned.
  Concrete proposed fix: change the gloss to `teaching; instruction`, and keep examples in school/classroom contexts.

- `new-hsk-2-0281` `教育`
  What is wrong: the examples are understandable, but the Chinese/English pairing is stiff: `这个学校教育很好 / This school has good education.`
  Why it matters: it is not quite wrong, but it is not polished learner-quality English or especially natural Chinese.
  Concrete proposed fix: rewrite with clearer contexts like family education or school education, and use more natural English such as `This school provides a good education.`

## Medium

- `new-hsk-2-0247` `或`
  What is wrong: the secondary-gloss field stores sentence translations instead of meanings.
  Why it matters: the row is usable now, but the glossary layer is still corrupted and incomplete.
  Concrete proposed fix: replace the secondary glosses with real sense labels such as `or; either`.

- `new-hsk-2-0253` `计划`
  What is wrong: the secondary-gloss field stores sentence translations instead of meanings, and the examples are serviceable but generic.
  Why it matters: the entry works, but it under-teaches a common word that supports slightly richer HSK2 contexts.
  Concrete proposed fix: replace the secondary glosses with `plan; schedule`, and slightly enrich the examples.

- `new-hsk-2-0266` `健康`
  What is wrong: the secondary-gloss field stores sentence translations instead of meanings.
  Why it matters: the example set is fine, but the definition layer is still noisy.
  Concrete proposed fix: replace the secondary glosses with real meanings like `healthy; health`.

- `new-hsk-2-0293` `斤`
  What is wrong: the secondary-gloss field stores sentence translations instead of meanings.
  Why it matters: the examples are understandable, but the glossary layer should teach that `斤` is a unit word, not repeat example English.
  Concrete proposed fix: replace the secondary glosses with `jin; half-kilogram measure word`.

- `new-hsk-2-0298` `经常`
  What is wrong: the secondary-gloss field stores sentence translations instead of meanings.
  Why it matters: the examples are usable, but the row is still definition-corrupted.
  Concrete proposed fix: replace the secondary glosses with `often; frequently`.

- `new-hsk-2-0303` `就要`
  What is wrong: the secondary-gloss field stores sentence translations instead of meanings.
  Why it matters: the sentence set is okay, but the definition layer is not clean.
  Concrete proposed fix: replace the secondary glosses with `be about to; be going to`.
