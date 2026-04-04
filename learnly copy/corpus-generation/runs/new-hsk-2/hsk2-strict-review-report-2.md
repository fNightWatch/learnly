# New HSK 2 Strict Review Report 2

Primary scan file used: `/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-2/hsk2-strict-review-input-clean.tsv`

Cross-check source: `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-2.sqlite`

Scope: full-corpus review of all 772 `new-hsk-2-words` rows. This was a read-only audit; the DB was not modified.

## Summary

- The repaired corpus is much cleaner than the earlier pass. The big template-corruption wave is gone, the TSV matches the live DB exactly, all 2,316 examples stay within the allowed New HSK 1+2 lexicon, and I found no exact duplicate example sentences or translations.
- It is not fully clean yet. I still see 35 rows worth flagging:
- Critical: 3 rows still fail the final quality bar and need full rewrites.
- High: 21 rows still carry polluted definition metadata, and several of them also have examples that are too generic or too flat.
- Medium: 11 rows are structurally fine but still weaker than they should be for a final HSK2 corpus.

## Validation Notes

- Row count: 772 words, 2,316 examples.
- Structure: every word still has exactly 3 examples.
- TSV/DB consistency: the cleaned TSV matches the live SQLite data for all reviewed fields.
- Lexicon check: all examples segment cleanly with the combined New HSK 1 + New HSK 2 seed lexicon.
- Exact duplicates: none found across Chinese example sentences or English translations.

## Critical

- `new-hsk-2-0402` `弄`
  The entry is still fundamentally broken. The gloss `do` is too vague, all three Chinese examples are malformed because `弄` needs an object or clearer complement, and the English is ungrammatical: `I was do at school today.`, `The teacher had us do in class today.`, `He often dos at home today.` This row needs a full rewrite from gloss to examples to translations.

- `new-hsk-2-0602` `小`
  The definition is wrong and incomplete. The row teaches `Xiao- prefix in names`, but the examples are `小朋友`, `小学生`, and even unrelated `小心`. The `meaning_en` labels collapse to `person`, which is clearly wrong. This does not teach the core HSK sense `small / little / young`, and it does not even consistently teach the claimed prefix use.

- `new-hsk-2-0668` `阴`
  The primary gloss is the pinyin-like label `yin`, the note says `Common word for yin`, and example 2 shifts into the abstract yin/yang sense while examples 1 and 3 teach weather: `今天很阴`, `外面很阴`. This row is still sense-confused and not learner-friendly. It needs to be re-centered on the actual HSK2 meaning `cloudy / overcast` and rewritten accordingly.

## High

Shared defect for the rows below:

- The `secondary_glosses_json` field still contains full example translations instead of compact meaning labels.
- The `meaning_en` field is polluted the same way, so the sense layer is still not clean even when the Chinese example itself is usable.
- This is a real remaining data bug, not just a style preference.

Rows with this remaining metadata corruption:

- `new-hsk-2-0215` `好处`
- `new-hsk-2-0216` `好多`
- `new-hsk-2-0217` `好久`
- `new-hsk-2-0220` `好像`
- `new-hsk-2-0223` `黑`
- `new-hsk-2-0225` `黑色`
- `new-hsk-2-0226` `红`
- `new-hsk-2-0227` `红色`
- `new-hsk-2-0229` `忽然`
- `new-hsk-2-0241` `黄`
- `new-hsk-2-0242` `黄色`
- `new-hsk-2-0246` `活动`
- `new-hsk-2-0251` `级`
- `new-hsk-2-0274` `角度`
- `new-hsk-2-0288` `节`
- `new-hsk-2-0289` `节目`
- `new-hsk-2-0290` `节日`
- `new-hsk-2-0291` `结果`
- `new-hsk-2-0294` `今后`
- `new-hsk-2-0297` `近`
- `new-hsk-2-0307` `句`

Extra notes on the weakest rows inside that cluster:

- `new-hsk-2-0220` `好像`
  The gloss should foreground `seem / appear`; `be like` is not the best learner-facing primary gloss for the current example set.

- `new-hsk-2-0246` `活动`
  The examples are still very generic and under-contextualized: `这个活动很好`, `学校里有活动`. They pass structure, but they still feel thinner than the HSK2 target bar.

- `new-hsk-2-0251` `级`
  Example 3 `这个级很难` is awkward, and the row still under-teaches the common `grade / level` use in a natural classroom context.

- `new-hsk-2-0288` `节`
  The examples are weak and unnatural: `这个节很重要`, `我觉得这个节很好`, `今天有节`. This row still sounds like placeholder prose rather than natural beginner-safe Chinese.

- `new-hsk-2-0289` `节目`
  `电视里有节目` is understandable, but the row remains very generic, and `This program is very good to watch` is not polished English.

- `new-hsk-2-0290` `节日`
  `今天是节日` and especially `我们过节日` are weaker than they should be. The row needs more natural holiday contexts.

- `new-hsk-2-0297` `近`
  `这里很近` and `学校在这里，很近` are semantically clear but clunky. The row still feels underwritten.

- `new-hsk-2-0307` `句`
  All three examples are too short and too bare for final HSK2 quality: `我说一句`, `他写了三句`, `这句很短`.

## Medium

- `new-hsk-2-0474` `少年`
  The primary gloss `juvenile` is not learner-friendly, and the examples are repetitive and weak. `今天这个少年很年轻` is especially tautological and unhelpful.

- `new-hsk-2-0524` `疼`
  The row is understandable, but `我的头疼` is not the cleanest learner model. More natural HSK2 Chinese would use something like `我头疼` or `我的头很疼`.

- `new-hsk-2-0525` `提`
  The examples are too telegraphic: `我提包`, `他提水`. They are grammatical, but they still read below the intended HSK2 sentence bar.

- `new-hsk-2-0595` `响`
  The examples use odd collocations: `教室里很响`, `房间里很响`, `这里很响`. Natural beginner Chinese would more likely use `声音很响` or `电话响了`.

- `new-hsk-2-0600` `相机`
  The row is too flat, especially `我用相机`, which is semantically empty. It passes structure but still feels like filler.

- `new-hsk-2-0612` `鞋`
  `我买了一只鞋` is odd in normal learner context unless the sentence explicitly means one shoe. This row needs a more natural example set.

- `new-hsk-2-0690` `语言`
  The examples are definition-like and under-challenging: `中文是语言`, `汉语是语言`. This feels more like dictionary paraphrase than usable beginner context.

- `new-hsk-2-0693` `院`
  All three examples are flat noun-location templates: `院里有花`, `院里有树`, `院很大`. Correct, but still too weak for a final pass.

- `new-hsk-2-0714` `站住`
  The imperative is valid, but the whole row is too thin and repetitive: `站住！`, `他站住了。`, `老师说站住。`

- `new-hsk-2-0733` `纸`
  `我有纸` and `他拿纸` are too bare and HSK1-flat. The row needs slightly richer, more concrete HSK2 contexts.

- `new-hsk-2-0762` `嘴`
  Example 3 `我用嘴吃饭 / I eat with my mouth` is awkward and not good learner material. The row needs more natural body-part contexts.

## Final Verdict

- The corpus now looks mostly usable and far cleaner than the earlier broken version.
- It is not fully clean enough to call final yet.
- If you want a true final-quality HSK2 corpus, I would repair the 3 critical rows first, then clean the 21-row metadata-corruption cluster, then rewrite the 11 weaker-but-usable rows.
- If you only care about whether the corpus is broadly serviceable, the answer is yes. If you care about a polished final release, the answer is not yet.
