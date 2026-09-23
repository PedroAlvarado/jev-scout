# Jev opportunity patterns

Use these as lenses while inspecting a repository. They are starting points, not a checklist to force onto every codebase. Patterns 1-10 mostly produce **substitution** and **augmentation** candidates; pattern 11 and `novel-applications.md` produce **new capabilities**. The augmentation signals at the end list decisions that are made implicitly today. For current examples by industry and task, read the live use-case map at `https://docs.typesafe.ai/concepts/use-case-map.md`.

## 1. Replace a generative router

**Signal:** An LLM prompt returns one handler, intent, category, model tier, tool, workflow, or queue.

**Jev shape:** Choice over concrete destinations. Add an independent complexity Score or evidence-sufficiency Noul when the consumer needs them.

**Business lever:** Lower latency/cost on every request; reserve reasoning models for cases that need them.

**Good integration:** Preserve the current router as fallback, shadow decisions first, and escalate low-confidence/unknown cases.

## 2. Widen retrieval or memory selection

**Signal:** The app retrieves many passages, memories, files, search hits, tools, or candidates, then spends a large-model call or hard cutoff to decide what is useful.

**Jev shape:** Noul per candidate when several may be useful; comparable Score per candidate for graded utility. Batch candidates sharing the same query/state.

**Business lever:** Inspect a wider candidate pool without filling the reasoning model's context or latency budget. Can improve recall and reduce expensive-context tokens.

**Guardrail:** Code owns source IDs, diversity, context budget, and exact retrieval. Jev judges relevance only.

## 3. Continuous quality checks

**Signal:** Generated text/code/content is reviewed only at the end, or multiple rubric checks are performed by a reasoning model.

**Jev shape:** Independent Nouls for named defects plus Scores for separate quality dimensions. Generator revises only flagged work.

**Business lever:** Make checks cheap enough to run on every artifact, every revision, or every user interaction.

**Guardrail:** Keep defect definitions narrow. Evaluate false positives and missed defects separately.

## 4. Triage high-volume queues

**Signal:** Tickets, leads, messages, logs, alerts, reviews, jobs, or events are manually sorted or routed with brittle rules.

**Jev shape:** Choice for lane/owner, Nouls for independently applicable flags, Score for severity/priority/value.

**Business lever:** Reduce manual review, improve response time, or reserve expensive analysis for the subset that deserves it.

**Guardrail:** Human review for unknown/low-confidence/high-consequence cases. Do not treat Jev as payment, legal, or access authorization.

## 5. Semantic guard or verifier

**Signal:** The system checks whether a claim is supported, whether an extraction is valid, whether content violates a named policy, or whether a diff matches an intent.

**Jev shape:** Noul per condition or Choice such as supported / contradicted / not established.

**Business lever:** Cheap verification at scale; send only failures/uncertain cases to a stronger model or person.

**Guardrail:** "Supported by source" is not the same as "universally true." Keep hard security controls deterministic.

## 6. Extract by selection, not generation

**Signal:** Code or a parser can generate candidate values/spans, but choosing the intended candidate is semantic.

**Jev shape:** Choice among candidate IDs plus missing/ambiguous. For multiple applicable candidates, use independent Nouls.

**Business lever:** Avoid free-form extraction and retries while keeping exact source values and provenance.

**Guardrail:** Candidate recall is the ceiling. Jev cannot select a value the candidate generator omitted.

## 7. Interactive next action

**Signal:** Browser, desktop, game, workflow, or agent loops repeatedly choose among a bounded set of legal actions.

**Jev shape:** Choice over safe action IDs from fresh state; optional Nouls for blocked/success conditions.

**Business lever:** Low-latency reflex decisions without spending frontier-model reasoning on every tiny step.

**Guardrail:** The application constructs the allowed action table. Jev never creates permissions or arbitrary actions. Failures should reobserve or escalate.

## 8. Reusable semantic features

**Signal:** A ranking/personalization/recommendation depends on several subjective qualities that are repeatedly re-evaluated.

**Jev shape:** Independent Scores for stable properties. Code changes weights, thresholds, and views without rerunning unchanged judgments.

**Business lever:** Personalization, reranking, or operational scoring becomes cheaper and more tunable.

**Guardrail:** Non-compensating hard requirements remain separate boolean rules.

## 9. Model / tool / skill selection

**Signal:** An expensive model is used to decide which model, tool, skill, or workflow should handle a request.

**Jev shape:** Choice for bounded destination; Score for complexity; Noul for whether enough evidence exists to route.

**Business lever:** Lower orchestration cost and latency; keep high-capability models focused on the actual task.

**Guardrail:** Preserve explicit user choices. Risk-sensitive tasks should not be auto-routed to weaker/cheaper paths solely on Jev's judgment.

## 10. Semantic heuristics replacement

**Signal:** Long keyword lists, regexes, string-contains logic, or nested conditions are approximating intent, relevance, spam, urgency, quality, or another semantic concept.

**Jev shape:** Noul for a crisp condition, Choice for mutually exclusive labels, or Score for a real ordered dimension.

**Business lever:** Fewer brittle edge cases and less rule maintenance while retaining typed behavior.

**Guardrail:** Keep exact patterns that encode contractual/business rules. Only replace the semantic portion.

## 11. New product behaviors enabled by decision economics

Do not stop at substitution. Look for behaviors a product may not currently attempt because a reasoning-model call would be too slow or expensive:

- judge every retrieved candidate instead of only the top few
- run a quality/risk check after every edit instead of only before publish
- adapt routing or personalization every interaction
- preclassify every queue item and deeply analyze only the important tail
- let users change weights over precomputed semantic features without rerunning inference
- make context selection a continuous background operation inside an agent loop

The business case for these can exceed simple model-cost savings.

## Augmentation signals

These are decisions the code makes implicitly. The scanner flags several of them (`first_match`, `fixed_cutoff`, `human_review`); others only show up in the value chain.

| Signal in code | Implicit decision | Jev shape | Guardrail |
| --- | --- | --- | --- |
| `results[0]`, `.find(...)`, `FIRST_ORDERED_NODE_TYPE`, `LIMIT 1` on a fuzzy match | "The first match is the right one" | Choice over the matches + `none_matches`, called only when there are two or more | Candidate recall is the ceiling; keep the single-match path deterministic |
| `TOP_K = 5`, `.slice(0, 10)`, a similarity threshold | "Nothing past rank k matters" | Noul or comparable Score per candidate over a wider pool | Code keeps the context budget and the final order |
| The same order, message or option for every user | "One size fits all" | Choice or Score per user from their own state | Explicit user choices always win |
| An action or tool call that is sent and never checked | "It worked" | Noul: did the result match the intent? | Failures re-observe or escalate; they never invent a new action |
| A check that runs only at publish, checkout or the end of a run | "Problems can wait" | Nouls for named defects on every step | Keep defect definitions narrow; measure false alarms |
| A random sample or the first page is reviewed | "The rest is fine" | Noul per item over everything, people see the uncertain slice | Sampled audits continue as ground truth |
| Every item goes to a review queue | "A person must look at all of them" | Noul or Score to sort the queue; clear cases fast-tracked only after shadowing | Policy, money and permissions stay with code and people |
| A silent fallback (`?? "other"`, `except: pass`, a default label) | "When unsure, pretend" | An explicit `unknown` answer with a review path | Log the unknowns; never coerce them into an action |
