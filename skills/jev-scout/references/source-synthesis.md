# Source synthesis and provenance

This skill is a synthesis of reusable ideas observed across the Jev ecosystem. It intentionally focuses on principles rather than copying any repository's skill text.

## TypeSafe official skill

Source: https://github.com/typesafe-ai/skills

Most valuable principles:

- work backward from the application behavior and code consumer
- use typed judgments as programming primitives
- keep exact rules/calculations/execution in code
- Choice for one defined alternative, Noul for independent yes/no conditions, Score for ordered dimensions
- batch independent questions over shared state
- validate uncertainty thresholds on target-domain data
- verify live docs before version-sensitive implementation

## altryne/jevify

Source: https://github.com/altryne/jevify

Most valuable principles:

- proactively discover Jev opportunities inside normal product/code work
- distinguish ordinary execution from explicit "Jevify this" product discovery
- preserve source evidence and inspect selected originals rather than trusting a rank alone
- produce an opportunity map, question pack, composition plan, evidence, and smallest useful experiment
- look for product capabilities enabled by frequent inexpensive decisions, not only direct LLM replacement
- inspect low-ranked/uncertain samples when evaluating retrieval-style uses

## dbreunig/building-with-jev-skill

Source: https://github.com/dbreunig/building-with-jev-skill

Most valuable principles:

- Jev is for snap judgments, not step-by-step reasoning or prose generation
- split broad prompts into narrow judgments that code can compose
- list the branches/thresholds/rankings the program actually needs before writing questions
- test labeled examples and revise state/questions rather than blindly tuning thresholds

## wuyoscar/jev-skill

Source: https://github.com/wuyoscar/jev-skill

Most valuable principles:

- context-first decisions: every call must include enough relevant evidence because Jev does not inherit host-agent context
- parallel independent judgments by default
- use a compact decision contract: decision, evidence/unit, questions, consumer, unknown path, success check
- keep Jev advisory; do not make it a security or authorization boundary
- preserve explicit unknown/failure behavior

## kerpopule/hermes-jev-skills

Source: https://github.com/kerpopule/hermes-jev-skills

Most valuable principles:

- start in shadow mode: decide and log before changing behavior
- fail open/safe: on key/service/confidence problems, preserve current behavior or reobserve rather than blocking the system
- safe action tables: decision models may choose among legal actions, not invent permissions
- local deterministic guards should remain in place around risk-sensitive flows
- privacy minimization and decision-only logs are operationally valuable
- measure on real traffic/replays before trusting cost or quality claims

## FrancoisChastel/jev-code

Source: https://github.com/FrancoisChastel/jev-code

Most valuable principles:

- recognize coding-agent decisions such as classifying failures, ranking files, checking diffs, or selecting candidates
- use first-class typed tools when available; keep tool contracts bounded and locally validated
- keep skill instructions compact and push deeper implementation detail into references

## TypeSafe documentation

Source: https://docs.typesafe.ai (index at https://docs.typesafe.ai/llms.txt)

Most valuable principles:

- the use-case map's categories - background automation without a human co-pilot, real-time decisions, map-reduce over large datasets, universal verification of other AI, and harness engineering - are lenses for new capabilities, not only for substitution
- decision shapes (classification, detection, scoring, routing, search, retrieval, ranking, verification, feature extraction, structured extraction) map onto Choice, Noul and Score
- read the live docs and the closest cookbook; treat demo thresholds and vendor figures as things to evaluate

## Lessons from live runs

A first run of version 0.1 on a large production monorepo found real opportunities but almost all of them were substitutions of existing model calls, and its keyword scanner ranked generated type files and documentation above real decision code. Version 0.2 responds with:

- a value chain before the code scan, so decisions made by defaults, people or nobody are visible
- a decision inventory from the scanner instead of keyword counts, with git fix history and heuristic churn as evidence
- three families of candidates, a minimum of anchored new-capability ideas, and ranking within families so new capabilities are not crowded out
- a challenge step that reads design docs and domain rules before recommending a change
- explicit boundaries: analysis only, nothing written outside the report, evidence from the local checkout

## Resulting design stance

The skill therefore prioritizes this sequence:

1. map the system and its value chain, including unmade decisions
2. build a decision inventory grounded in code and git history
3. generate substitution, augmentation and new-capability candidates
4. filter by Jev fit, then challenge against evidence, deliberate design and domain rules
5. rank with stated estimates, within and across families
6. design typed decision contracts, composed with deterministic code and explicit fallback
7. validate in replay and shadow mode, and activate only where measured behavior supports it
