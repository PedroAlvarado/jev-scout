# Required output: Jev Opportunity Map

Use this structure for a discovery/audit request. Adapt labels slightly when the repository context makes another name clearer, but keep all sections.

# Jev Opportunity Map for [repository/product]

## Executive view

One short paragraph explaining where Jev has the strongest leverage in this product and why.

| Rank | Opportunity | Business lever | Repo evidence | Jev shape | Priority |
| ---: | --- | --- | --- | --- | ---: |
| 1 | ... | ... | `path:line` | Choice + Noul | 24 |

The priority is a heuristic, not measured ROI.

## 1. [Top opportunity]

**Current behavior**  
Describe the actual existing workflow with file/symbol evidence.

**Business value thesis**  
Name the lever: revenue/conversion, retention/UX, AI unit economics, operations throughput, latency, reliability/trust, or differentiated capability. State which baseline must be measured if not present in the repo.

**Why Jev fits**  
Explain why this is a repeated bounded semantic decision rather than exact code or open-ended reasoning.

**Decision contract**

```text
Decision:
Unit:
Evidence:
Primitive:
Consumer:
Unknown path:
Success check:
```

**Question pack**  
Provide the exact proposed Choice/Noul/Score questions, criteria, and candidate meanings. Pseudocode/JSON is fine. Clearly label it as a proposal, not a recorded Jev result.

**Integration point**  
Name the likely files/functions/services to change and how the Jev result composes with existing code.

**Shadow-mode experiment**  
Give the smallest replay + shadow test, boundary cases, and metrics. Preserve current behavior while shadowing.

**Fallback and risk**  
Describe low-confidence, missing-data, service-failure, privacy, and wrong-decision handling.

Repeat this complete section for the top 3 opportunities. For ranks 4-5, a shorter version is acceptable unless the user asks for full designs.

## Opportunity backlog

Briefly list the next-best ideas, including evidence and why they ranked below the top group.

## Not a Jev fit

Name 1-3 tempting areas in this repo that should stay deterministic code or generative/reasoning-model work, and explain why.

## Recommended first move

Choose one experiment to run first. Explain why it has the best combination of business leverage, Jev fit, clear integration point, and low rollout risk. Do not claim ROI that has not been measured.
