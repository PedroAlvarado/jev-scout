---
type: llm
---
PASS if the final report proposes at least one augmentation of a decision the code makes implicitly: judging help-article relevance instead of taking `hits[0]` behind a fixed `TOP_K` in `src/kb/suggest.ts`, or sorting or pre-annotating the `refund_review_queue` in `src/refunds/approve.ts` so people see the uncertain cases first.
FAIL if neither appears as an opportunity.
