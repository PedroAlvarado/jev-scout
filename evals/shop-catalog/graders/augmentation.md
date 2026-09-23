---
type: llm
---
PASS if the final report proposes at least one augmentation of a decision the code makes implicitly: judging relevance over a wider candidate pool instead of the fixed `TOP_K` and the re-sort by price in `search/rank.py`, or choosing the intended variant instead of the first substring match in `search/variants.py`.
FAIL if neither appears as an opportunity.
