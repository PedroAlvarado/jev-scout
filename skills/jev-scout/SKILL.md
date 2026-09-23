---
name: jev-scout
description: Inspect the current local software repository and propose the highest-business-value opportunities to apply TypeSafe Jev decision models. Use when asked to "Jevify" a codebase, find Jev use cases, replace repeated semantic LLM judgments, reduce AI cost or latency, add fast typed routing/scoring/checking, improve agent/retrieval workflows, or discover new product capabilities enabled by frequent inexpensive decisions. Produce repo-grounded opportunities, ranked business cases, Jev Choice/Noul/Score decision contracts, integration points, fallbacks, and a shadow-mode experiment. Default to analysis and proposals rather than editing code unless implementation is explicitly requested.
license: MIT
compatibility: Any Agent Skills host with shell and file access. The bundled scanner runs on Bun or Node.js 22.6+ when one is already installed; without either, the skill falls back to rg and git grep. Discovery needs no network access and no Jev API key.
---

# Jev Scout

Find where Jev can create material product or business leverage in the current local repository the coding agent is operating in. Work from actual repo evidence, not a generic Jev use-case list. Keep the workflow host-neutral so the same skill works in Claude Code, Codex, and other Agent Skills-compatible coding agents.

The central question is not only "can Jev replace an LLM call?" Also ask whether cheap, fast, typed judgments make a better product behavior practical: wider candidate pools, checks on every interaction, continuous QA, lower-latency routing, more personalization, or a safer uncertain-tail escalation path.

## Workflow

1. Understand the product and business surface.
2. Scan for decision hotspots.
3. Inspect the strongest candidates in context.
4. Separate Jev-shaped decisions from code, generation, and deep reasoning.
5. Rank opportunities by business value and evidence.
6. Design implementation-ready decision contracts for the top opportunities.
7. Propose a shadow-mode experiment before production activation.
8. Deliver the opportunity map using the required output structure.

Do not require a Jev API key for discovery. Repository analysis is local. If the user asks to implement a Jev integration, verify current TypeSafe API/SDK details from official docs before writing version-sensitive code.

## Host compatibility

Keep all execution and file references provider-neutral:

- Treat the current working repository as the analysis target unless the user names another path.
- Resolve bundled files relative to this `SKILL.md`, not relative to `.claude/skills`, `.agents/skills`, or the repository root.
- Use ordinary shell, Git, file reads, and symbol navigation. Do not depend on provider-specific slash commands, subagent APIs, hooks, or environment variables.
- Respect repository-local agent instructions such as `CLAUDE.md`, `AGENTS.md`, or equivalent host guidance when present.
- Keep `agents/openai.yaml` as optional OpenAI UI metadata; do not depend on it for runtime behavior.

For installation conventions and portability notes, read `references/host-compatibility.md` when packaging or installing this skill.

## 1. Understand the product before proposing Jev

Read the smallest set of files that explains what the product does and how it makes money or creates value. Start with likely sources such as `README*`, `CLAUDE.md`, `AGENTS.md`, package manifests, app routes, product docs, architecture docs, pricing/billing code, user-facing copy, and high-level service entry points.

Write a compact internal product model:

- primary user or operator
- core job to be done
- main user flows
- expensive or latency-sensitive AI paths
- high-volume queues, records, messages, retrieval candidates, or agent steps
- existing human-review points
- obvious business levers: revenue/conversion, retention/UX, AI unit economics, operations throughput, latency, reliability/trust, or differentiated capability

Do not invent revenue, traffic, token volume, conversion rates, or costs that are not in the repo. Mark missing baselines as measurements to collect.

## 2. Scan for decision hotspots

Run the bundled TypeScript scanner from the repository root. Resolve `SKILL_ROOT` to the directory that contains this `SKILL.md`; do not assume `.claude`, `.agents`, a host-provided environment variable, or any provider-specific install path. Substitute that resolved absolute path in the commands below.

Prefer the project's existing runtime and do not install a new runtime or dependency just for discovery. Try these in order:

```bash
# 1. Bun, when already available
bun "$SKILL_ROOT/scripts/repo_signals.ts" --root . --format markdown

# 2. Modern Node with built-in type stripping
node --experimental-strip-types "$SKILL_ROOT/scripts/repo_signals.ts" --root . --format markdown

# 3. An existing local tsx installation only; do not download it automatically
npx --no-install tsx "$SKILL_ROOT/scripts/repo_signals.ts" --root . --format markdown
```

If the host does not expose the loaded skill path directly, locate this skill's `SKILL.md` from the active skill context and use its parent directory as `SKILL_ROOT`. Never hard-code a Claude Code or Codex skill directory inside the workflow.

If none of those runtimes are already available, do not block the analysis. Fall back to normal repository tools such as `rg`, `git grep`, file reads, and symbol navigation using the hotspot patterns below.

Use `--format json` if you want machine-readable output. The scanner has no third-party dependencies and is a lead generator, not proof. It looks for places likely to contain repeated semantic decisions, LLM routing, retrieval, scoring, moderation/verification, agent loops, and brittle keyword heuristics across TypeScript, JavaScript, Python, Go, Rust, Java, and other common source formats. It skips dependency and build directories and every directory that holds a `SKILL.md`, so installed agent skills, including this one, never show up as candidates; exclude them yourself when you fall back to `rg` or `git grep`.

Then use normal repo tools (`rg`, `git grep`, file reads, symbol navigation) to investigate the strongest signals. Prefer concrete call sites and control-flow boundaries over comments that merely mention AI concepts.

Pay special attention to:

- LLM calls whose result is parsed into a small enum, boolean, score, or structured routing object
- prompts that classify, triage, rank, gate, verify, select, or decide next actions
- semantic keyword/regex heuristics standing in for intent or meaning
- retrieval/memory systems where many candidates are narrowed before an expensive model reads them
- support, inbox, log, event, job, alert, lead, moderation, or fraud queues
- agent/tool loops choosing among a bounded set of legal next actions
- quality checks that happen only at the end because checking every item is expensive
- human-review queues where clear cases could be separated from ambiguous ones
- model routing or fallback logic
- repeated semantic judgments inside batch or high-frequency paths

## 3. Use the Jev fit test

A strong Jev opportunity usually has most of these properties:

- **Bounded answer space:** software ultimately needs one of a few labels, a yes/no probability, or a score on a defined scale.
- **Semantic ambiguity:** ordinary code can move and validate the data, but meaning is hard to express reliably with exact rules.
- **High repetition:** the decision happens frequently, across many items, or across a wide candidate set.
- **Actionable output:** code can immediately consume the typed result.
- **Useful uncertainty:** a confidence/probability band can determine review, fallback, or escalation.
- **Available evidence:** the decision-time state contains enough context to make the judgment.
- **Measurable outcome:** quality, review rate, latency, cost, coverage, conversion, or another downstream metric can be compared.

Do **not** recommend Jev as the primary solution for:

- exact arithmetic, date math, deterministic lookups, schema validation, permissions, or hard business rules
- open-ended writing, synthesis, planning, coding, or explanations
- tasks whose answer requires multi-step reasoning rather than a fast judgment
- decisions with no bounded answer space and no way to generate candidates first
- authorization or security boundaries where a wrong answer directly grants dangerous capability
- low-frequency decisions where integration overhead dominates

Use code for exact rules and policy. Use a generative/reasoning model for generation and deep reasoning. Use Jev for the semantic decision inside the workflow.

Read `references/opportunity-patterns.md` when mapping hotspots to concrete Jev architectures.

## 4. Rank by business value, not novelty

Create 5-10 candidate opportunities, then rank them. For each candidate assign 0-5 on the dimensions below. Treat the numbers as a prioritization heuristic, not measured ROI.

- **Business leverage:** plausible effect on revenue/conversion, retention/UX, unit economics, operations throughput, latency, reliability/trust, or differentiated capability.
- **Decision frequency:** how often or across how many items the decision likely occurs, using repo evidence where possible.
- **Current friction:** expensive LLM calls, manual review, slow loops, brittle heuristics, missed coverage, or user-visible latency.
- **Jev fit:** how cleanly the decision maps to Choice, Noul, or Score with available state.
- **Integration ease:** whether there is a clear call site and contained consumer of the result.
- **Evalability:** whether labeled/replayed cases and downstream metrics can test it.
- **Risk penalty:** consequence of a wrong judgment, irreversibility, or security/compliance sensitivity.

Use this heuristic:

```text
priority = business_leverage
         + decision_frequency
         + current_friction
         + jev_fit
         + integration_ease
         + evalability
         - risk_penalty
```

Do not let a high score hide weak evidence. A candidate with no concrete repo location cannot be a top recommendation.

For the top 3-5, explicitly identify the business lever and the baseline that must be measured. Favor opportunities that either:

1. replace expensive repeated semantic reasoning, **or**
2. unlock a better user/product behavior that would be uneconomical or too slow with a frontier model on every decision.

## 5. Design the Jev decision contract

For each top opportunity, fill out this contract before proposing implementation:

```text
Decision: What must the caller choose or assess?
Unit: What single item or state snapshot is being judged?
Evidence: Which exact fields/files/events are available at decision time?
Primitive: Choice, Noul, Score, or a composition of independent questions?
Questions: What narrow judgments should Jev answer?
Consumer: What code path uses each answer?
Unknown path: What happens on missing evidence, ambiguity, low confidence, or service failure?
Success check: What observable metric proves the workflow is better?
```

### Primitive selection

- **Choice**: exactly one of a known set should win. Include `other`, `unknown`, or `insufficient_context` when coverage is not guaranteed.
- **Noul**: an independent yes/no condition where the probability itself is useful. Use one per independently applicable property or candidate.
- **Score**: an ordered degree on 2-10 concrete levels. Define each level in operational terms; do not use vague scales such as "bad / okay / good" without definitions.

Questions sharing the same state should be batched when they are independent. Questions in one request cannot see each other's answers. Use a second stage only when an earlier answer is needed to fetch evidence or construct new candidates.

State should contain the relevant evidence and short domain context. Instructions define the judgment. Criteria define answer boundaries. Give each question a complete meaning; do not rely on the question ID to carry semantics.

Read `references/decision-design.md` for detailed design rules and `references/source-synthesis.md` for the repository-derived principles behind them.

## 6. Compose answers in code

For each proposal, show how application code consumes the decision. The composition should include:

- named thresholds or explicit decision policy
- `unknown` / `review` path
- current or safe fallback on API failure
- no silent action on malformed responses
- original policy, arithmetic, permissions, and irreversible side effects enforced outside Jev

For agentic or side-effecting workflows, Jev may only choose from an action table the application has already deemed legal. Low confidence, timeouts, or API errors should normally reobserve, escalate, or preserve the existing behavior rather than invent a new action.

## 7. Start with shadow mode

Every top opportunity should include a smallest useful experiment:

1. **Baseline:** capture current decision/output, latency, cost where available, and downstream outcome.
2. **Replay:** run representative historical or synthetic boundary cases through the proposed Jev questions.
3. **Shadow:** call Jev on the live path, log the typed decision and confidence, but do not change behavior.
4. **Compare:** measure agreement and disagreements against current behavior and human/downstream outcomes.
5. **Tune:** adjust state, question boundaries, and thresholds using labeled examples. Do not lower thresholds merely to hide failures.
6. **Activate narrowly:** start with low-risk clear cases; preserve review/fallback for uncertain cases.
7. **Monitor:** track quality, review rate, latency, spend, failure rate, and drift in the decision distribution.

Prefer decision-only logs. Avoid logging raw prompts, secrets, or customer data unless the application's existing privacy policy explicitly permits it.

## 8. Required output

Use the structure in `references/output-template.md`. Keep the executive section business-first and concise. Every top opportunity must include repository evidence with file paths and line numbers or symbols when available.

Always include a **Not a Jev fit** section naming at least 1-3 tempting areas in this repo that should remain deterministic code or generative/reasoning-model work. This proves the analysis is selective rather than Jev-everywhere advocacy.

If the user asks only for discovery, stop after the opportunity map and experiment designs. If the user explicitly asks to implement one, verify current official TypeSafe docs/API/SDK details first, then modify the repository in its existing stack.
