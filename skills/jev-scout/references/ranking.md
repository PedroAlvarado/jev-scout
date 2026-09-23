# Estimating and ranking

Rank with numbers you can defend. Every estimate names its source; anything unknown is written as "unknown - measure X" and added to **Measurements to collect**.

## Estimates for each candidate

**Volume.** Decisions per day as an order of magnitude (1, 10, 100, 1k, 10k, 100k+), with the derivation:

- scheduled jobs: schedule × batch size
- agent loops: step cap × runs per day, or steps per page × pages
- per-request paths: routes that run the decision × request volume, when the repository states it (rate limits, capacity config, load-test settings)
- per-record paths: rows created per day, when seeds, migrations or docs state it
- otherwise: unknown - measure the call count

**Error costs.** What a false yes and a false no each cost, and who pays: the user (bad experience, wrong outcome), the business (money, support load, churn), the data (silent corruption), or nobody (a harmless suggestion). Unequal costs set unequal thresholds; say which side the threshold should favor.

**Data sensitivity** of the state Jev would see:

| Level | Meaning | Consequence |
| --- | --- | --- |
| none | code, metadata, public content | no extra review |
| internal | business data without personal details | usual vendor review |
| personal | data about identifiable people | privacy review before shadowing on real users; start with synthetic or internal data |
| regulated | health, financial, children's, biometric or similar data | legal and compliance review first; often not a first move |

**Labels on hand.** The source of data that can evaluate the decision today, or "none - needs labeling".

**Evidence strength.** observed failure (fix history, tests, docs) > read in code > inferred.

**Time to a first shadow result.** Days, weeks or months, based on integration: a single function behind an interface is days; a new input that must be captured first is weeks.

## Scores

Score each dimension 0-5. The scores explain the ranking; they are not added up:

| Term | 0 | 5 |
| --- | --- | --- |
| business_leverage | no effect on a value-chain metric | moves a core metric (revenue, retention, trust, unit cost) |
| decision_frequency | rare | thousands or more per day, or every item of a core entity |
| current_friction | none | expensive model calls, repeated fixes, manual review, visible failures; for new capabilities, the value missed today |
| jev_fit | not bounded or not semantic | cleanly one Choice, Noul or Score with available state |
| integration_ease | no clear call site | one function or interface, result consumed in one place |
| evalability | no labels, no metric | labels on hand and a downstream metric |
| evidence_strength | speculative | observed failure or confirmed anchor in code |
| risk_penalty | wrong answer is harmless | wrong answer is irreversible, corrupts data, or touches money or safety |
| data_sensitivity | none | regulated |

Rank by judgment, with the scores as the stated reasons. A weak evidence score or a high risk or sensitivity penalty can outweigh several strong scores, and a candidate with no concrete location in the repository cannot be a top pick. The ranking is a judgment about where to look first, not measured return on investment.

## Choosing the top three

1. Rank within each family: substitution, augmentation, new capability.
2. Take the top three overall for full designs.
3. Substitutions score higher on evidence and integration by nature. If none of the three is an augmentation or new capability, replace the third with the best one that survived the challenge, and say so.
4. Break ties by time to a first shadow result, then by lower data sensitivity.

## Recommended first move

Choose the experiment with the best mix of value, fit, a clear integration point, labels on hand, low data sensitivity and low rollout risk - often not the top-ranked opportunity. Say why.
