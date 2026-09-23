---
type: llm
weight: 2
---
PASS if the final report proposes at least one new capability the code does not do today, and for that idea names all three of: the data it would judge (a specific file, field or event in this repository), the integration point where the result would be used (a file or function), and why the system does not do it today. It must also say what the idea would improve. Examples that qualify: judging frustration or churn risk on every inbound ticket from the ticket body with the `csat_submitted` event as an outcome; verifying each reply drafted by `src/replies/draft.ts` against policy or the customer's request before it is sent; detecting refund intent in ticket bodies to route or pre-fill refund requests.
FAIL if every proposal only replaces or checks existing code paths, or if no new idea names its data, its integration point and why it is not done today.
