# New HSK 4 Strict Review Report

Inputs reviewed:
- TSV: `/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-4/hsk4-strict-review-input.tsv`
- SQLite: `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-4.sqlite`

Date: 2026-04-09

## Verdict

The HSK4 corpus is not clean yet and is not ready to be treated as final.

The built-in SQL audit still fails on real corpus-quality issues:
- `1000` words
- `3000` examples
- `issue_count = 280`
- `missing_lemma = 24`
- `cross_word_duplicate_sentence_groups = 20`
- `cross_word_duplicate_translation_groups = 102`

My stricter semantic pass also found a larger templated-generation problem that the SQL audit only partly catches:
- at least `386` words contain one of six highly repetitive template frames
- `376` of those words come from `generator-2`
- `124` English example translations across `84` words still contain raw Chinese characters
- `11` words still have malformed secondary-gloss strings

## Highest-Priority Issue Groups

### 1. Wrong Headword Or Borrowed Example Sets

These are hard failures. The example set is teaching the wrong word, not just a weak sentence.

- `new-hsk-4-0378` rank `378` `叫作`
  `ex3` uses `叫`, not `叫作`: `大家叫他老师。`
- `new-hsk-4-0405` rank `405` `竞争`
  `ex1` and `ex2` use `比较`, not `竞争`: `我们比较一下两个办法。`, `这两个计划很难比较。`
- `new-hsk-4-0436` rank `436` `空`
  all three examples are copied from `或者`: `你或者我去。`, `我们明天或者后天去。`, `你想喝茶或者咖啡？`
- `new-hsk-4-0492` rank `492` `乱`
  same `或者` triplet reused again
- `new-hsk-4-0624` rank `624` `入学`
  `ex1` and `ex2` use `进入`, not `入学`; `ex3` is also unusable: `我知道入学。`
- `new-hsk-4-0660` rank `660` `实际上`
  all three examples are copied from `究竟`: `你究竟想说什么？`, `这究竟是什么问题？`, `事情究竟怎么样了？`
- `new-hsk-4-0670` rank `670` `是否`
  all three examples are copied from `或者`
- `new-hsk-4-0678` rank `678` `收入`
  all three examples are copied from `接受`: `老师接受了我的建议。`, `我接受这个礼物。`, `他接受了这个工作。`
- `new-hsk-4-0700` rank `700` `说明`
  all three examples are copied from `解释`: `老师解释了这个问题。`, `你能再解释一次吗？`, `请你解释一下原因。`
- `new-hsk-4-0740` rank `740` `停车`
  `ex2` hides the headword inside `停`: `我把车停在门口。`
- `new-hsk-4-0746` rank `746` `童年`
  `ex2` switches to `小时候`: `他小时候的生活很简单。`

Related non-template but still broken:
- `new-hsk-4-0622` rank `622` `入`
  `ex3` is ungrammatical: `我知道入。`

### 2. Large-Scale Template Contamination

This is the biggest corpus-level problem. A large mid/late HSK4 block was generated from a small set of reusable templates rather than word-specific examples.

#### 2a. Bare-verb template

At least `131` words use the English triplet:
- `I want to to X.`
- `Please to X first.`
- `Let's to X together.`

And the matching Chinese triplet is usually:
- `我想X。`
- `请先X。`
- `我们一起X。`

Representative words:
- `new-hsk-4-0218` rank `218` `改`
- `new-hsk-4-0219` rank `219` `改变`
- `new-hsk-4-0227` rank `227` `感觉`
- `new-hsk-4-0232` rank `232` `感受`
- `new-hsk-4-0410` rank `410` `举办`
- `new-hsk-4-0412` rank `412` `举行`
- `new-hsk-4-0921` rank `921` `增加`
- `new-hsk-4-0947` rank `947` `值得`

These rows are not just repetitive. Many are semantically bad Chinese and ungrammatical English.

#### 2b. Adjective template

At least `58` words use the same adjective frame:
- `这个书很X。`
- `我觉得这个地方很X。`
- `今天比昨天更X。`

Representative words:
- `new-hsk-4-0500` rank `500` `美`
- `new-hsk-4-0501` rank `501` `美好`
- `new-hsk-4-0503` rank `503` `美丽`
- `new-hsk-4-0928` rank `928` `整`
- `new-hsk-4-0929` rank `929` `整个`

The English side is also broken:
- `This 书 is very beautiful.`
- `Today is beautifuler than yesterday.`
- `This 书 is very whole.`
- `Today is wholeer than yesterday.`

#### 2c. Measure-word / unit template

At least `20` words use the same `书` filler template:
- `我买了两X书。`
- `请给我一X书。`
- `他拿着三X书。`

Representative words:
- `new-hsk-4-0424` rank `424` `棵`
- `new-hsk-4-0430` rank `430` `克`
- `new-hsk-4-0473` rank `473` `两`
- `new-hsk-4-0554` rank `554` `篇`
- `new-hsk-4-0555` rank `555` `片`
- `new-hsk-4-0564` rank `564` `期`
- `new-hsk-4-0574` rank `574` `千克`

These are unusable as learner examples.

#### 2d. Flat noun template

Hundreds of noun rows are flattened into one of these English frames:
- `This X is very important.`
- `The teacher explained X.`
- `I am learning about X.`

Representative words:
- `new-hsk-4-0205` rank `205` `风景`
- `new-hsk-4-0403` rank `403` `景色`
- `new-hsk-4-0341` rank `341` `家乡`
- `new-hsk-4-0456` rank `456` `老家`
- `new-hsk-4-0661` rank `661` `食品`
- `new-hsk-4-0663` rank `663` `食物`

These are not always strictly ungrammatical, but at this scale they make the corpus feel mass-generated and pedagogically flat.

### 3. Duplicate Reuse Across Synonym Families

The SQL audit already flags the duplication problem, and the full review confirms it is meaningful rather than harmless noise.

Complete sentence-triplet cloning:
- `new-hsk-4-0349` `减` and `new-hsk-4-0351` `减少`
- `new-hsk-4-0380` `接受` and `new-hsk-4-0678` `收入`
- `new-hsk-4-0386` `解释` and `new-hsk-4-0700` `说明`
- `new-hsk-4-0407` `究竟` and `new-hsk-4-0660` `实际上`
- `new-hsk-4-0436` `空`, `new-hsk-4-0492` `乱`, and `new-hsk-4-0670` `是否`

Other duplicate-family reuse flagged by the audit:
- `new-hsk-4-0086` `重` and `new-hsk-4-0087` `重新`
- `new-hsk-4-0140` `道` and `new-hsk-4-0143` `道路`
- `new-hsk-4-0153` `底` and `new-hsk-4-0154` `底下`
- `new-hsk-4-0048` `不论` and `new-hsk-4-0053` `不管`
- `new-hsk-4-0050` `部` and `new-hsk-4-0057` `部门`
- `new-hsk-4-0095` `窗` and `new-hsk-4-0096` `窗户`

Some of these are near-synonym pairs, but the current reuse level is too exact and too frequent. It looks like template carryover, not deliberate contrastive teaching.

### 4. Definition And Sense-Selection Problems

These are not the largest issue group, but they still matter because the user explicitly prioritizes full, correct, learner-friendly meanings.

- `new-hsk-4-0678` rank `678` `收入`
  The gloss leads with `to receive`, but in HSK-style learner use the noun sense `income / revenue` is at least as important and arguably more central. The examples currently teach `接受`, so the entry fails both gloss priority and example alignment.
- `new-hsk-4-0700` rank `700` `说明`
  The gloss includes noun senses like `explanation / instructions`, but the examples cover only borrowed `解释` verb uses. The noun side is effectively untested.
- `new-hsk-4-0140` rank `140` `道`
  The entry is internally inconsistent. `ex1` and `ex2` are really about `道` as a measure word for questions (`这道题`), while the stored gloss order starts with `path / way`, and `ex3` is actually a `道路` sentence.
- `new-hsk-4-0378` rank `378` `叫作`
  The English is mechanically understandable but not good learner English: `This word is called mobile phone.`

Malformed secondary gloss strings remain on at least `11` words:
- `new-hsk-4-0247` `各位`
- `new-hsk-4-0327` `既`
- `new-hsk-4-0350` `减轻`
- `new-hsk-4-0389` `尽管`
- `new-hsk-4-0407` `究竟`
- `new-hsk-4-0408` `就是`
- `new-hsk-4-0409` `举`
- `new-hsk-4-0410` `举办`
- `new-hsk-4-0412` `举行`
- `new-hsk-4-0542` `拍`
- `new-hsk-4-0924` `着`

These still contain broken parenthetical fragments like:
- `all (respectful`
- `to organize (an event`
- `to take (a photo`

### 5. Translation Quality Is Not Final-Clean

There are still `124` English example translations across `84` words that contain raw Chinese characters. That is a hard quality failure.

Representative rows:
- `new-hsk-4-0424-ex1` `I bought two measure word for trees 书s.`
- `new-hsk-4-0430-ex1` `I bought two gram 书s.`
- `new-hsk-4-0500-ex1` `This 书 is very beautiful.`
- `new-hsk-4-0554-ex1` `I bought two measure word for essays 书s.`
- `new-hsk-4-0574-ex1` `I bought two kilogram 书s.`

There are also plain English-grammar failures:
- `I want to to change.`
- `Please to hold first.`
- `Let's to feel together.`
- `Today is beautifuler than yesterday.`
- `Today is wholeer than yesterday.`

### 6. HSK4 Difficulty Control Is Not Holding

HSK4 is supposed to be only slightly harder than HSK3. The current corpus does not consistently meet that bar.

Using the current workspace corpora as the benchmark:
- HSK3 average sentence length: `8.57` Chinese characters
- HSK4 average sentence length: `7.38` Chinese characters
- HSK3 average stored difficulty: `2.03`
- HSK4 average stored difficulty: `1.33`
- HSK4 `difficulty = 1` examples: `2011 / 3000`

This is only a heuristic, but it matches what the rows look like by inspection: many HSK4 entries are actually simpler than the current HSK3 slice, especially inside the templated generator-2 blocks.

Representative under-difficult / too-simple rows:
- `new-hsk-4-0436` `空` -> `你或者我去。`
- `new-hsk-4-0410` `举办` -> `请先举办。`
- `new-hsk-4-0921` `增加` -> `我想增加。`
- `new-hsk-4-0500` `美` -> `这个书很美。`

Also note a few clearly unnatural rows outside the big template families:
- `new-hsk-4-0154` `底下` `ex2` -> `我在门底下。`
- `new-hsk-4-0622` `入` `ex3` -> `我知道入。`

## Overall Assessment

The corpus has usable material in it, especially outside the worst contaminated families, but the current HSK4 DB is still carrying a large number of obviously generated placeholder rows, recycled synonym examples, wrong-headword example sets, and broken English lines.

The most severe damage is concentrated in `generator-2` output, especially from roughly the low `200`s onward and again across much of the `400-1000` range. Generator-1 and generator-3 are cleaner overall, but they still contain real problems such as `道`, `底下`, `停车`, and `童年`.

## Recommended Repair Order

1. Fix every wrong-headword row first.
2. Purge the large template families next, especially the `我想X / 请先X / 我们一起X`, `这个书很X`, and `X书` measure-word blocks.
3. Remove the cross-word duplicate sentence and translation groups.
4. Clean the word-level gloss layer after the example layer is stable, especially `收入`, `说明`, `道`, and the malformed secondary-gloss entries.
5. Rebalance sentence difficulty upward so HSK4 is actually slightly harder than HSK3.

I did not edit the database during this review.
