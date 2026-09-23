# Required output: Jev Opportunity Map

Use this structure for a discovery request. Adapt labels when the repository makes another name clearer, but keep every section; write "none found" rather than dropping one. Deliver it in the reply unless the user asks for a file.

# Jev Opportunity Map for [repository or product]

## Executive view

One short paragraph: where Jev has the strongest leverage in this system and why, including the best new capability.

| Rank | Opportunity | Family | Business lever | Repo evidence | Jev shape | Volume/day | Priority |
| ---: | --- | --- | --- | --- | --- | --- | ---: |
| 1 | ... | substitution / augmentation / new capability | ... | `path:line` | Choice + Noul | ~1k (derivation) | 24 |

The priority is a ranking aid, not measured return on investment.

## Value map

The value chain from step 1 of the workflow: step, who acts, the metric it moves, the judgments made there, and who or what makes them today (a model, a rule, first match or fixed order, a fixed cutoff, a default, a person, or nobody).

## Decision inventory

Every bounded decision confirmed in the code, including the ones not recommended:

| Location | What is decided | Decided today by | Output | Consumer | Volume hint | Candidate? |
| --- | --- | --- | --- | --- | --- | --- |

## Top opportunities

Repeat this section for each of the top three.

### 1. [Opportunity] ([family])

**Current behavior**
The existing workflow with file and symbol evidence. For a new capability: what the system does instead today, and where the needed data already lives.

**Business value thesis**
The lever (revenue or conversion, retention or experience, AI unit cost, operations throughput, latency, reliability or trust, differentiated capability), and the baseline to measure if the repository does not state it.

**Estimates**

```text
Volume: <decisions per day, order of magnitude> - <derivation>
Error costs: false yes = <cost, who pays>; false no = <cost, who pays>
Data sensitivity: none | internal | personal | regulated - <what the state contains>
Labels on hand: <source> | none
Evidence strength: observed failure | read in code | inferred - <citation>
Time to first shadow result: <days | weeks | months>
```

**Why Jev fits, and the challenge**
Why this is a repeated, bounded semantic decision. Then the challenge results: is the evidence captured at decision time, is the current design deliberate (cite any doc), which domain rules apply.

**Decision contract**

```text
Decision:
Unit:
Evidence:
Primitive:
Questions:
Consumer:
Unknown path:
Success check:
```

**Question pack**
The proposed Choice, Noul and Score questions with state, criteria and candidate meanings. JSON or pseudocode is fine. Label it as a proposal, not a recorded Jev result.

**Integration point**
The files, functions or services to change, and how the Jev result composes with existing code: thresholds, the unknown path, and the fallback on failure.

**Shadow-mode experiment**
The smallest replay and shadow test, the boundary cases, and the metrics. Current behavior is preserved while shadowing.

**Fallback and risk**
Low confidence, missing data, service failure, privacy, and the cost of a wrong decision.

## New capabilities

Every anchored new-capability candidate, including those outside the top three, in short form: value-chain step, unit and data source, integration point, why not today, primitive sketch, and risk. Then **Ideas to explore**: unanchored ideas, each with what would be needed to anchor it.

## Opportunity backlog

The next-best substitution and augmentation candidates, with evidence and why they ranked lower.

## Not a Jev fit

At least one to three tempting areas that should stay deterministic code or generative or reasoning-model work, and candidates dropped by the challenge, each with the reason.

## Incidental findings

Bugs or risks noticed along the way, with evidence. They were not filed anywhere; the user decides what to do with them.

## Measurements to collect

The baselines the ranking assumed but the repository does not state: call counts, latency, cost per decision, error and review rates, and downstream outcomes.

## Recommended first move

One experiment to run first, and why it has the best mix of value, Jev fit, a clear integration point, labels on hand, low data sensitivity and low rollout risk. Do not claim returns that have not been measured.

## Coverage notes

What was scanned and read, what was skipped (and why), scanner limits, whether git history was complete, and whether the live TypeSafe docs were reachable.
