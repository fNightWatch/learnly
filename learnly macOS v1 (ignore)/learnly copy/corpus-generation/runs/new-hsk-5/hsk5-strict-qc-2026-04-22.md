# HSK5 Strict QC Log — 2026-04-22

Active dataset: `new-hsk-5-words`  
DB path: `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite`

## Standing Goal

- Keep repairing HSK5 until it is not only validator-clean and audit-clean, but also no longer materially shorter or easier than HSK4.
- After every repair batch:
  - validate the batch
  - ingest the batch
  - rerun a live audit
  - recalculate average sentence length and average difficulty
  - append the refreshed metrics here

## Baseline Before 2026-04-22 Work

- Latest completed audit before this session: `hsk5-strict-qc-pass3-2026-04-18`
- HSK4 live metrics: `17.028` average Hanzi, `2.985` average difficulty
- HSK5 live metrics: `11.745` average Hanzi, `2.803` average difficulty
- Delta vs HSK4: `-5.283` average Hanzi, `-0.182` average difficulty

## Batch Log

### Batch 04

- Touched scope: `1497, 1499, 1506, 1520, 1552, 1554, 1558, 1561, 1563, 1565, 1570, 1581`
- Latest audit: `hsk5-strict-qc-pass4-2026-04-22` at `2026-04-22 06:55:37`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `11.813`, avg difficulty `2.807`, share len <= 8 `0.044`, share len >= 15 `0.121`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-5.215`, avg difficulty `-0.178`
- Notes: Validated, ingested, and re-audited after targeted rewrites of low-length high-leverage late-rank rows plus a definition upgrade for 中华.
### Batch 05

- Touched scope: `1406, 1431, 1440, 1453, 1488, 1495, 1508, 1519, 1539, 1543, 1578, 1594`
- Latest audit: `hsk5-strict-qc-pass5-2026-04-22` at `2026-04-22 07:08:30`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `11.875`, avg difficulty `2.807`, share len <= 8 `0.041`, share len >= 15 `0.128`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-5.153`, avg difficulty `-0.178`
- Notes: Integrated 3 gpt-5.4 xhigh subagent QC critiques, revalidated after lexicon repairs, then ingested and re-audited.
### Batch 06

- Touched scope: `161, 168, 175, 189, 448, 568, 662, 878, 998, 1192, 1332, 1433`
- Latest audit: `hsk5-strict-qc-pass6-2026-04-22` at `2026-04-22 07:16:11`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `11.909`, avg difficulty `2.812`, share len <= 8 `0.038`, share len >= 15 `0.13`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-5.119`, avg difficulty `-0.173`
- Notes: Integrated 3 gpt-5.4 xhigh subagent QC critiques, repaired two lexicon failures, then ingested and re-audited.
### Batch 07

- Touched scope: `171, 188, 216, 463, 673, 677, 1006, 1198, 1283, 1425, 1447, 1460`
- Latest audit: `hsk5-strict-qc-pass7-2026-04-22` at `2026-04-22 07:28:17`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `11.941`, avg difficulty `2.816`, share len <= 8 `0.038`, share len >= 15 `0.132`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-5.087`, avg difficulty `-0.169`
- Notes: Integrated 3 gpt-5.4 xhigh subagent QC critiques; batch was validator-clean on first pass, then ingested and re-audited.

### Batch 08

- Touched scope: `166, 172, 213, 269, 449, 450, 457, 462, 635, 678, 680, 1004`, plus follow-up duplicate-translation repair for `463`
- Latest audit: `hsk5-strict-qc-pass8-2026-04-22-r3` at `2026-04-22 07:45:02`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `11.980`, avg difficulty `2.821`, share len <= 8 `0.034`, share len >= 15 `0.135`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-5.048`, avg difficulty `-0.164`
- Notes: Integrated 3 gpt-5.4 xhigh subagent QC critiques, repaired two lexicon failures in the main batch, then ran a settled follow-up repair for the `含` vs `含有` cross-word duplicate translation before the final clean audit.
### Batch 09

- Touched scope: `1324, 1331, 1333, 1337, 1413, 1424, 1426, 1442, 1445, 1473, 1476, 1538`
- Latest audit: `hsk5-strict-qc-pass9-2026-04-22` at `2026-04-22 08:23:06`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.028`, avg difficulty `2.821`, share len <= 8 `0.033`, share len >= 15 `0.14`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-5.0`, avg difficulty `-0.164`
- Notes: Integrated 3 gpt-5.4 xhigh subagent candidate reviews, normalized 9 lexicon-failing sentences locally, then validated, ingested, and re-audited.
### Batch 10

- Touched scope: `240, 249, 265, 456, 463, 1049, 1069, 1197, 1226, 267, 1430, 1555`
- Latest audit: `hsk5-strict-qc-pass10-2026-04-22` at `2026-04-22 08:32:15`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.09`, avg difficulty `2.823`, share len <= 8 `0.03`, share len >= 15 `0.146`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.938`, avg difficulty `-0.162`
- Notes: Integrated 3 gpt-5.4 xhigh subagent candidate reviews, elevated several 2.x rows to stronger HSK5 contexts, then validated, ingested, and re-audited.
### Batch 11

- Touched scope: `1437, 1438, 1471, 1475, 1481, 1527, 1548, 1557, 1560, 1562, 1569, 1583`
- Latest audit: `hsk5-strict-qc-pass11-2026-04-22` at `2026-04-22 08:40:20`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.149`, avg difficulty `2.823`, share len <= 8 `0.028`, share len >= 15 `0.153`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.879`, avg difficulty `-0.162`
- Notes: Integrated 3 gpt-5.4 xhigh subagent candidate reviews, removed weak glosses like standalone 运=to use, then validated, ingested, and re-audited.
### Batch 12

- Touched scope: `155, 159, 163, 169, 202, 218, 570, 574, 665, 904, 913, 1186`
- Latest audit: `hsk5-strict-qc-pass12-2026-04-22` at `2026-04-22 16:37:10`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.232`, avg difficulty `2.834`, share len <= 8 `0.025`, share len >= 15 `0.16`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.796`, avg difficulty `-0.151`
- Notes: Integrated 3 gpt-5.4 xhigh subagent candidate reviews, focused on low-length low-difficulty rows, then validated, ingested, and re-audited.
### Batch 13

- Touched scope: `161, 454, 637, 735, 737, 1001, 1070, 1273, 1276, 1279, 1310, 1429`
- Latest audit: `hsk5-strict-qc-pass13-2026-04-22` at `2026-04-22 17:04:13`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.307`, avg difficulty `2.837`, share len <= 8 `0.023`, share len >= 15 `0.168`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.721`, avg difficulty `-0.148`
- Notes: Integrated 3 gpt-5.4 xhigh subagent candidate reviews, repaired one validator-caught lexicon failure in 过度 and one in 胜, then validated, ingested, and re-audited.
### Batch 14

- Touched scope: `158, 160, 165, 178, 180, 208, 209, 210, 214, 225, 236, 278`
- Latest audit: `hsk5-strict-qc-pass14-2026-04-22` at `2026-04-22 17:15:47`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.39`, avg difficulty `2.85`, share len <= 8 `0.022`, share len >= 15 `0.175`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.638`, avg difficulty `-0.135`
- Notes: Integrated 3 gpt-5.4 xhigh subagent candidate reviews, validator-clean on first pass, then resumed ingest after clearing generated workspace caches that had caused a live SQLite disk I/O blocker.
### Batch 15

- Touched scope: `832, 837, 839, 840, 845, 852, 855, 859, 865, 877, 930, 931`
- Latest audit: `hsk5-strict-qc-pass15-2026-04-22` at `2026-04-22 17:20:38`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.448`, avg difficulty `2.863`, share len <= 8 `0.022`, share len >= 15 `0.181`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.58`, avg difficulty `-0.122`
- Notes: Integrated 3 gpt-5.4 xhigh subagent candidate reviews, focused on late-rank definition debt and under-leveled sentence sets, then validated, ingested, and re-audited cleanly.
### Batch 16

- Touched scope: `153, 223, 293, 311, 369, 379, 403, 451, 467, 482, 567, 658`
- Latest audit: `hsk5-strict-qc-pass16-2026-04-23` at `2026-04-23 05:54:17`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.497`, avg difficulty `2.866`, share len <= 8 `0.022`, share len >= 15 `0.186`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.531`, avg difficulty `-0.119`
- Notes: Integrated 3 gpt-5.4 xhigh subagent candidate reviews, repaired several validator-caught lexicon issues locally in 橙子/豆腐/剪/国庆 before acceptance, then validated, ingested, and re-audited cleanly.
### Batch 17

- Touched scope: `167, 455, 651, 660, 869, 967, 973, 977, 981, 989, 1115, 1222`
- Latest audit: `hsk5-strict-qc-pass17-2026-04-23` at `2026-04-23 06:04:27`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.595`, avg difficulty `2.875`, share len <= 8 `0.021`, share len >= 15 `0.194`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.433`, avg difficulty `-0.11`
- Notes: Integrated 3 gpt-5.4 xhigh subagent candidate reviews, then tightened four validator-caught lexicon lines locally in 抽 / 靠 / 墙 / 吸管 before the final clean ingest and audit.
### Batch 18

- Touched scope: `164, 183, 185, 207, 315, 359, 552, 670, 951, 962, 965, 982`
- Latest audit: `hsk5-strict-qc-pass18-2026-04-23` at `2026-04-23 06:10:49`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.694`, avg difficulty `2.884`, share len <= 8 `0.021`, share len >= 15 `0.201`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.334`, avg difficulty `-0.101`
- Notes: Integrated 3 reusable gpt-5.4 xhigh subagent candidate reviews, then narrowed validator-caught lexicon lines locally in 催 / 二维码 / 家电 / 山区 / 赏 before the final clean ingest and audit.
### Batch 19

- Touched scope: `152, 154, 157, 222, 245, 554, 576, 581, 1002, 1018, 1154, 1155`
- Latest audit: `hsk5-strict-qc-pass19-2026-04-23` at `2026-04-23 06:15:50`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.794`, avg difficulty `2.893`, share len <= 8 `0.02`, share len >= 15 `0.208`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.234`, avg difficulty `-0.092`
- Notes: Integrated 3 reusable gpt-5.4 xhigh subagent candidate reviews, then narrowed validator-caught lexicon lines locally in 当地 / 加热 / 石头 / 土豆 before the final clean ingest and audit.
### Batch 20

- Touched scope: `156, 217, 375, 466, 657, 808, 953, 980, 1010, 1169, 1172, 1188`
- Latest audit: `hsk5-strict-qc-pass20-2026-04-23` at `2026-04-23 07:30:31`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.842`, avg difficulty `2.901`, share len <= 8 `0.02`, share len >= 15 `0.215`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.186`, avg difficulty `-0.084`
- Notes: 3 gpt-5.4 xhigh subagent candidate reviews merged by the orchestrator. Focused on underleveled rows with thin definitions or low adult-context sentence sets. Live orchestrator metrics after ingest: avg chars 14.296, avg words 9.075, avg difficulty 2.901. HSK4 live reference remains avg chars 19.626, avg words 12.167, avg difficulty 2.985. New weakest cluster now starts with 剪 / 看望 / 改天 / 豆腐 / 黑 / 国庆, then 淡 / 地面 / 电器 / 豆浆 / 柜子 / 果然.
### Batch 21

- Touched scope: `244, 271, 280, 293, 294, 379, 447, 451, 452, 482, 567, 658`
- Latest audit: `hsk5-strict-qc-pass21-2026-04-23` at `2026-04-23 07:35:48`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.872`, avg difficulty `2.911`, share len <= 8 `0.02`, share len >= 15 `0.219`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.156`, avg difficulty `-0.074`
- Notes: 3 gpt-5.4 xhigh subagent candidate reviews merged by the orchestrator. Focused on the lowest-difficulty cluster after Batch 20, with stronger adult contexts for 剪 / 看望 / 改天 / 豆腐 / 国庆 and cleaner definition coverage for 淡 / 地面 / 电器 / 果然. Live orchestrator metrics after ingest: avg chars 14.329, avg words 9.095, avg difficulty 2.911. HSK4 live reference remains avg chars 19.626, avg words 12.167, avg difficulty 2.985. New weakest cluster now starts with 哦 / 区域 / 人体 / 删 / 烧烤 / 蛇 / 舍得 / 升温, then 充值 / 初 / 大爷 / 果实 / 悄悄 / 扇子 / 伤 / 上传 / 拖鞋 / 万一.
### Batch 22

- Touched scope: `162, 170, 230, 453, 807, 896, 926, 948, 968, 969, 971, 994`
- Latest audit: `hsk5-strict-qc-pass22-2026-04-23` at `2026-04-23 08:42:18`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.918`, avg difficulty `2.92`, share len <= 8 `0.02`, share len >= 15 `0.226`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.11`, avg difficulty `-0.065`
- Notes: 3 gpt-5.4 xhigh subagent candidate reviews merged by the orchestrator. Focused on underleveled conversational/formal rows, with stronger definition teaching for 哦 / 区域 / 人体 / 舍得 / 初 and more natural real-life contexts for 充值 / 烧烤 / 蛇 / 升温. Live orchestrator metrics after ingest: avg chars 14.377, avg words 9.123, avg difficulty 2.920. HSK4 live reference remains avg chars 19.626, avg words 12.167, avg difficulty 2.985. New weakest cluster now starts with 悄悄 / 扇子 / 伤 / 上传 / 拖鞋 / 万一, then 念 / 农民 / 认 / 外公 / 玩具 / 微笑 / 生动 / 喂 / 成员 / 冻 / 扶 / 前进.
### Batch 23

- Touched scope: `801, 804, 876, 929, 955, 956, 963, 1166, 1168, 1173, 1177, 1181`
- Latest audit: `hsk5-strict-qc-pass23-2026-04-23` at `2026-04-23 08:46:34`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.96`, avg difficulty `2.93`, share len <= 8 `0.02`, share len >= 15 `0.233`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.068`, avg difficulty `-0.055`
- Notes: 3 gpt-5.4 xhigh subagent candidate reviews merged by the orchestrator. Focused on meaning-sensitive rows like 万一 / 念 / 认 / 微笑 plus underleveled concrete nouns and tech verbs. Live orchestrator metrics after ingest: avg chars 14.423, avg words 9.155, avg difficulty 2.930. HSK4 live reference remains avg chars 19.626, avg words 12.167, avg difficulty 2.985. Low-difficulty debt improved sharply: avg_diff < 2.34 is now down to 20 words. New weakest cluster now starts with 生动 / 喂 / 成员 / 冻 / 扶 / 前进, then 如今 / 生肖 / 晒 / 假如 / 牛仔裤 / 配 / 跑道 / 青 / 洞 / 平衡 / 奋斗 / 从而.
### Batch 24

- Touched scope: `151, 288, 366, 559, 802, 819, 863, 935, 947, 992, 996, 1195`
- Latest audit: `hsk5-strict-qc-pass24-2026-04-23` at `2026-04-23 09:23:29`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `12.999`, avg difficulty `2.938`, share len <= 8 `0.02`, share len >= 15 `0.239`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-4.029`, avg difficulty `-0.047`
- Notes: 3 gpt-5.4 xhigh subagent candidate reviews merged by the orchestrator. Focused on the remaining low-difficulty cluster, with stronger definition teaching for 假如 / 配 / 如今 / 晒 / 生肖 / 喂 and more natural adult contexts across the whole set. Live orchestrator metrics after ingest: avg chars 14.464, avg words 9.183, avg difficulty 2.938. HSK4 live reference remains avg chars 19.626, avg words 12.167, avg difficulty 2.985. Low-difficulty debt is now down to just 8 words with avg_diff < 2.34. New weakest cluster now starts with 跑道 / 青 / 洞 / 平衡 / 奋斗 / 从而 / 气球 / 汽油, then 代 / 堆 / 简直 / 建 / 靠近 / 客服 / 替 / 填 / 违反 / 餐饮.
### Batch 25

- Touched scope: `201, 233, 289, 304, 357, 571, 572, 814, 841, 857, 858, 886`
- Latest audit: `hsk5-strict-qc-pass25-2026-04-23` at `2026-04-23 10:03:52`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `13.052`, avg difficulty `2.949`, share len <= 8 `0.02`, share len >= 15 `0.245`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-3.976`, avg difficulty `-0.036`
- Notes: 3 gpt-5.4 xhigh subagent candidate reviews merged by the orchestrator. Focused on the last low-difficulty tail and the next-shortest frontier, with stronger definition teaching for 从而 / 代 / 堆 / 简直 / 平衡 and more adult, longer contexts for 奋斗 / 跑道 / 汽油 / 青. Live orchestrator metrics after ingest: avg chars 14.521, avg words 9.220, avg difficulty 2.949. HSK4 live reference remains avg chars 19.626, avg words 12.167, avg difficulty 2.985. Low-difficulty debt is now fully cleared: avg_diff < 2.34 is 0 and avg_diff < 2.5 is 0. New weakest cluster now starts with 达成 / 行业 / 靠近 / 客服 / 绕 / 替 / 填 / 违反, then 不利 / 餐饮 / 单独 / 贵姓.
### Batch 26

- Touched scope: `73, 90, 212, 239, 446, 468, 661, 668, 912, 1123, 1126, 1187`
- Latest audit: `hsk5-strict-qc-pass26-2026-04-23` at `2026-04-23 10:08:44`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `13.124`, avg difficulty `2.958`, share len <= 8 `0.019`, share len >= 15 `0.252`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-3.904`, avg difficulty `-0.027`
- Notes: 3 gpt-5.4 xhigh subagent candidate reviews merged by the orchestrator. Focused on the next short-row frontier, with stronger definition teaching for 餐饮 / 贵姓 / 行业 / 客服 / 替 / 违反 and longer adult-useful sentence sets across the whole batch. Live orchestrator metrics after ingest: avg chars 14.600, avg words 9.269, avg difficulty 2.958. HSK4 live reference remains avg chars 19.626, avg words 12.167, avg difficulty 2.985. The low-difficulty tail stays cleared at 0 rows below avg_diff 2.5. New shortest cluster now starts with 眼 / 样式 / 约定 / 运用 / 早已 / 造成 / 增进 / 展开 / 展示 / 占 / 珍贵 / 争取.
### Batch 27

- Touched scope: `1330, 1334, 1436, 1441, 1452, 1454, 1456, 1464, 1466, 1468, 1483, 1489`
- Latest audit: `hsk5-strict-qc-pass27-2026-04-23` at `2026-04-23 10:45:26`
- Audit summary: issues `0`, lexicon `0`, missing lemma `0`, same-word dup sentences `0`, same-word dup translations `0`, cross-word dup sentence groups `0`, cross-word dup translation groups `0`
- HSK5 metrics now: avg Hanzi `13.196`, avg difficulty `2.966`, share len <= 8 `0.018`, share len >= 15 `0.26`
- HSK4 reference: avg Hanzi `17.028`, avg difficulty `2.985`
- Delta vs HSK4: avg Hanzi `-3.832`, avg difficulty `-0.019`
- Notes: 3 gpt-5.4 xhigh subagent candidate reviews merged by the orchestrator. Focused on the next late-rank short-row frontier, with stronger definition teaching for 眼 / 约定 / 运用 / 展示 / 占 / 争取 and longer adult-useful sentence sets across the whole batch. Live orchestrator metrics after ingest: avg chars 14.678, avg words 9.320, avg difficulty 2.966. HSK4 live reference remains avg chars 19.626, avg words 12.167, avg difficulty 2.985. New shortest cluster now starts with 至今 / 逐步 / 主动 / 注重 / 子女 / 阻止, then 出自 / 吨 / 隔 / 集中 / 系 / 捡.
