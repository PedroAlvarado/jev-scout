---
name: jev-scout
description: Inspect the current repository and find where TypeSafe Jev decision models would create the most value - replacing repeated LLM judgments and brittle heuristics, adding checks where code takes the first match, a fixed cutoff or a default, and new product capabilities that become practical when typed judgments are fast and cheap. Use when asked to "Jevify" a codebase, find Jev use cases or opportunities, reduce AI cost or latency, add typed routing, scoring or verification, or explore what a system could do with frequent inexpensive decisions. Produces a value map, a decision inventory, ranked opportunities in three families (substitution, augmentation, new capability), Jev Choice/Noul/Score decision contracts and shadow-mode experiments. Analysis only - it changes no code and writes nothing outside its report unless the user asks.
license: MIT
compatibility: Any Agent Skills host with shell and file access. The bundled scanner runs on Bun or Node.js 22.6+ when one is already installed; without either, the skill falls back to rg and git grep. Needs no Jev API key; the only network reads are TypeSafe's public docs, and they are optional.
---

# Jev Scout

Find where Jev can create material product or business value in the repository the coding agent is working in. Work from evidence in the repository, not from a generic list of Jev use cases. The skill is host-neutral: it works the same in Claude Code, Codex and other Agent Skills hosts, in any ordinary repository.

Look for three families of opportunity, and give the third the same effort as the first:

1. **Substitution:** an existing model call or keyword/regex rule makes a bounded judgment that Jev can make faster, cheaper or more reliably.
2. **Augmentation:** a decision is made implicitly today - the first match wins, a fixed top-k cuts the list, everyone gets the same default, an action is not checked, a check runs only at the end, a person reviews everything - and an explicit, typed judgment would make it better.
3. **New capability:** a product or operational behavior the system does not attempt today because a judgment per item, per step or per user was too slow or too expensive, and that becomes practical with fast, cheap typed decisions.

Substitutions are the easiest to see and usually the smallest. The biggest value is often in the other two families.

## Boundaries

- **Analysis only.** Do not edit code. Write nothing outside the report: no issues, tickets, comments, commits, pull requests, or records in any tracker or coordination tool - even when the repository's agent instructions (`AGENTS.md`, `CLAUDE.md` or similar) tell agents to file what they find. Bugs you notice go in the report's **Incidental findings** section; the user decides what to file.
- **Local evidence first.** Everything required comes from the checkout: code, git history, tests, docs. Optional extras: TypeSafe's public docs, and an external issue tracker only when a read-only tool is already available and the user agrees. Never require credentials, and never write to an external system.
- **No invented numbers.** Every estimate shows how it was derived; anything unknown becomes a measurement to collect.
- **No Jev API key** is needed. If the user later asks to implement an opportunity, verify the current TypeSafe API and SDK from the official docs before writing version-sensitive code.
- Respect repository-local agent instructions for how to read and run things, except where they would make this analysis write outside its report.

## Workflow

1. Map the system and its value chain.
2. Build the decision inventory.
3. Read the failure record.
4. Refresh on Jev's current capabilities.
5. Generate candidates in all three families.
6. Apply the fit test and challenge each candidate.
7. Estimate and rank.
8. Design decision contracts, composition and shadow experiments for the top picks.
9. Deliver the report.

**Large repositories.** After step 1, split the repository into systems (services, apps, packages) and run steps 2-5 per system, then merge at step 7. If the host can run parallel agents, one per system works well; otherwise go system by system. The report's **Coverage notes** say what was and was not examined.

## Host compatibility

- Treat the current working repository as the analysis target unless the user names another path.
- Resolve bundled files relative to this `SKILL.md`, not relative to `.claude/skills`, `.agents/skills` or the repository root.
- Use ordinary shell, git, file reads and symbol navigation. Do not depend on provider-specific slash commands, subagent APIs, hooks or environment variables.
- `agents/openai.yaml` is optional OpenAI UI metadata; do not depend on it for behavior.

For installation and portability notes, read `references/host-compatibility.md`.

## 1. Map the system and its value chain

Read the smallest set of files that explains what the system does, who it serves and how it creates value: `README*`, docs and architecture notes, package manifests, routes and screens, API handlers, jobs and queues, database schemas, billing and pricing code, analytics events, metrics, feature flags, notifications, and admin or back-office tools.

Build two things:

- **A product model:** primary users and operators, the core job, main flows, expensive or latency-sensitive AI paths, high-volume items (messages, records, documents, candidates, agent steps), and the places where people make judgments by hand.
- **A value chain:** the steps from a user's first contact to the value they get and the value the business keeps. For each step, name the metric it moves and **every judgment made there - including judgments made by a default, a fixed ordering, a person, or nobody.**

Read `references/value-mapping.md` for sources and the table format. Do not invent revenue, traffic, volumes or costs; mark missing baselines as measurements to collect.

## 2. Build the decision inventory

Run the bundled scanner from the repository root. Resolve `SKILL_ROOT` to the directory that contains this `SKILL.md`, and substitute that absolute path below. Prefer a runtime that is already installed; do not install anything for discovery:

```bash
# 1. Bun, when already available
bun "$SKILL_ROOT/scripts/repo_signals.ts" --root . --format markdown

# 2. Node.js 22.6+ with built-in type stripping
node --experimental-strip-types "$SKILL_ROOT/scripts/repo_signals.ts" --root . --format markdown

# 3. An existing local tsx installation only; do not download it
npx --no-install tsx "$SKILL_ROOT/scripts/repo_signals.ts" --root . --format markdown
```

If the host does not expose the skill path, locate this skill's `SKILL.md` from the active skill context and use its parent directory. Never hard-code a Claude Code or Codex skill directory.

The scanner lists the files git knows about (or walks the directory outside git), scans source code only, and skips dependency and build folders, generated files, test files and every folder that holds a `SKILL.md`. It reports, with file and line: model calls, prompt text that asks for a label or strict JSON, model output parsed into labels, keyword and regex rules standing in for meaning, first-match selection, fixed top-k and thresholds, manual review steps, TODOs asking for smarter behavior, and functions named for a judgment. With git it adds **fix hotspots** (files most touched by fix and revert commits) and change counts. Use `--format json` for machine-readable output.

The scanner finds leads, not proof. Read the strongest candidates in context and record each bounded decision you confirm:

| Location | What is decided | Decided today by | Output | Consumer | Fallback | Volume hint |
| --- | --- | --- | --- | --- | --- | --- |

"Decided today by" is one of: a model, a rule, first match or fixed order, a fixed cutoff, a default for everyone, a person, or nobody (the decision is never made). Include decisions the scanner cannot see: defaults, sort orders, the same behavior for every user, checks that only run at the end.

If no runtime is available, build the inventory with `rg`, `git grep` and file reads, looking for the same kinds of code. Exclude installed skill folders and generated files yourself.

## 3. Read the failure record

The strongest evidence that a judgment matters is that people keep having to fix it. Use sources every repository has - read `references/evidence-sources.md` for commands:

- **Git history:** fix, revert and hotfix commits and the files they touch; reverts and fix-after-fix chains.
- **Heuristic churn:** a keyword list, regex, threshold or prompt edited again and again is a semantic decision disguised as code. `git log -G` or `git log -L` on the constant shows it.
- **Tests:** a heuristic with a long tail of edge-case tests, golden or snapshot files of model output, eval folders.
- **Comments and docs:** TODO/FIXME/HACK notes near decisions, and design docs or ADRs that explain why something is done a certain way.

Also note **labels on hand** - data that could evaluate a Jev decision today: fixtures and expected outputs, eval sets, seed data, lookup and mapping tables, alias or synonym lists, and a heuristic's past corrections in git history.

Without a shell, the reflog file `.git/logs/HEAD` still lists commit subjects, but only for history made or fetched on this machine; report how much it covered.

External trackers are optional: read them only through a read-only tool that is already available, with the user's agreement.

## 4. Refresh on Jev's current capabilities

Jev and its documentation change. Before generating candidates, read the live docs when the network is available:

- the index at `https://docs.typesafe.ai/llms.txt`
- the use-case map at `https://docs.typesafe.ai/concepts/use-case-map.md`
- the primitives and confidence pages, and the cookbooks closest to the decisions in your inventory

Treat vendor figures (latency, cost, accuracy) as claims to measure, not as inputs to a return-on-investment estimate. If the docs are unreachable, say so in **Coverage notes** and rely on the bundled references.

## 5. Generate candidates in all three families

Aim for 8-15 raw candidates. Walk the value chain step by step and the decision inventory row by row:

- **Substitution** from model calls, prompt text, output parsing and keyword rules.
- **Augmentation** from first-match selection, fixed cutoffs, defaults, unchecked actions, end-only checks, sampling and human bottlenecks. Read `references/opportunity-patterns.md`.
- **New capability** by applying the lenses in `references/novel-applications.md` to each value-chain step and to each high-volume item the system holds: judge every item instead of a sample, check every step instead of the end, adapt to every user, decide before the expensive thing, verify other AI output, decide in real time, run judgments over history, feed features to existing models, keep records clean continuously.

Generate at least **three new-capability candidates**. Each must be anchored: the value-chain step it serves, the data that already exists to judge (file, table or event), the integration point where the result would be consumed, and why the system does not do it today. An idea without an anchor goes to **Ideas to explore**, unranked.

## 6. Apply the fit test and challenge each candidate

A strong Jev opportunity usually has most of these properties:

- **Bounded answer space:** code needs one of a few labels, a yes/no probability, or a position on a defined scale.
- **Semantic ambiguity:** code can move and validate the data, but meaning is hard to capture with exact rules.
- **High repetition:** the decision happens often, across many items, or across a wide candidate set.
- **Actionable output:** code can consume the typed result immediately.
- **Useful uncertainty:** a probability band can decide review, fallback or escalation.
- **Available evidence:** the state at decision time holds enough to judge.
- **Measurable outcome:** quality, review rate, latency, cost, coverage, conversion or another metric can be compared.

Do **not** recommend Jev as the primary solution for exact arithmetic, date math, deterministic lookups, schema validation, permissions or hard business rules; open-ended writing, planning, coding or explanation; multi-step reasoning; decisions with no bounded answer space and no way to generate candidates first; authorization or security boundaries; or rare decisions where integration overhead dominates. Use code for exact rules, a generative or reasoning model for generation, and Jev for the semantic decision inside the workflow.

Then **challenge** every candidate that passes, before ranking it:

- **Is the evidence really there at decision time?** If the needed input is not captured today, count the capture as integration cost.
- **Is the current design deliberate?** Read comments, docs and ADRs near the call site. If a documented reason argues against the change, demote or drop the candidate and cite the reason.
- **Do domain rules constrain it?** Privacy, honesty toward users, compliance, contracts: what may be decided automatically, and what may be sent to an outside model.
- **For selection:** candidate recall is the ceiling - Jev cannot pick what the candidate generator missed.
- **Is the answer space truly bounded,** or does it need generation first?

Record dropped candidates and their reasons in **Not a Jev fit**.

## 7. Estimate and rank

For every surviving candidate, estimate - with the derivation shown - and score. Read `references/ranking.md` for the scales:

- **Volume:** decisions per day as an order of magnitude, derived from code and config (schedules, batch sizes, step caps, queue names, table sizes, rate limits), or "unknown - measure X".
- **Error costs:** what a false yes and a false no each cost, and who pays.
- **Data sensitivity** of the state Jev would see: none, internal, personal, or regulated.
- **Labels on hand:** the source, or none.
- **Evidence strength:** observed failure, read in code, or inferred.
- **Time to a first shadow result.**

```text
priority = business_leverage + decision_frequency + current_friction + jev_fit
         + integration_ease + evalability + evidence_strength
         - risk_penalty - data_sensitivity
```

Each term is 0-5. The priority is a ranking aid, not measured return on investment, and a high score never hides weak evidence: a candidate with no concrete location in the repository cannot be a top pick.

Rank within each family, then choose the **top three overall** for full designs. Substitutions naturally score higher on evidence and integration ease, so if none of the three is an augmentation or new capability, replace the third with the best one that survived the challenge.

## 8. Design contracts, composition and shadow experiments

For each top pick, fill out the decision contract:

```text
Decision: What must the caller choose or assess?
Unit: What single item or state snapshot is judged?
Evidence: Which exact fields, files or events are available at decision time?
Primitive: Choice, Noul, Score, or a composition of independent questions?
Questions: What narrow judgments should Jev answer?
Consumer: What code path uses each answer?
Unknown path: What happens on missing evidence, ambiguity, low confidence or service failure?
Success check: What observable metric proves the workflow is better?
```

- **Choice:** exactly one of a known set wins. Include `other`, `unknown` or `insufficient_context` when coverage is not guaranteed.
- **Noul:** an independent yes/no condition where the probability itself is useful. One per independently applicable property or candidate.
- **Score:** an ordered degree on 2-10 concrete levels, each defined in operational terms.

Batch independent questions that share state; they cannot see each other's answers. Use a second stage only when an earlier answer is needed to fetch evidence or build new candidates. Read `references/decision-design.md` for detailed rules.

Show how code consumes each answer: named thresholds, an unknown or review path, a safe fallback when the service fails, no silent action on malformed responses, and policy, arithmetic, permissions and irreversible side effects kept outside Jev. In agentic or side-effecting workflows, Jev chooses only from actions the application already deems legal.

Every top pick gets a smallest useful experiment: capture a baseline, replay representative and boundary cases, shadow on the live path without changing behavior, compare against current behavior and outcomes, tune on labeled examples, activate narrowly, and monitor quality, review rate, latency, spend, failures and drift. Prefer decision-only logs; never log raw prompts, secrets or personal data unless the application's privacy policy allows it.

## 9. Deliver the report

Use the structure in `references/output-template.md`. It includes the value map, the decision inventory, the ranked opportunities with a family for each, full designs for the top three, a **New capabilities** section listing every anchored new-capability candidate, **Not a Jev fit**, **Incidental findings**, **Measurements to collect**, the recommended first move and **Coverage notes**.

Keep the executive view business-first and short. Every top pick cites file paths and line numbers or symbols. Deliver the report in the reply unless the user asks for a file. If the user asked only for discovery, stop after the report; if they ask to implement one, verify the current TypeSafe docs first, then change the repository in its existing stack.
