# Evals

Two layers check the skill.

## 1. Scanner tests (deterministic, run in CI)

`scanner.test.mjs` builds each fixture repository in a temporary folder and checks that `scripts/repo_signals.ts` finds every planted decision, reads the git fix history, and skips generated files, gitignored files and installed skill folders.

```bash
node --test evals/scanner.test.mjs      # Node.js 22.6 or later
```

## 2. Skill evals (model runs, on demand)

### In GitHub Actions (recommended)

The [`eval` workflow](../.github/workflows/eval.yml) runs the suite on a clean Ubuntu runner with Bash granted, so the skill's scanner and git history are exercised. It pins the Claude Code version, the agent model and the judge model so scores stay comparable, runs each case three times per arm by default, installs and tests the sandbox before any model call is paid for, stops at a cost ceiling, and fails when a case scores below the threshold. The job summary shows each case's score with and without the skill and every grader's pass count; the JSON result, the HTML report and each run's transcript are uploaded as an artifact.

It runs only when started by hand, because every run is a paid model call. Once, add a repository secret for the model provider. Through [OpenRouter](https://openrouter.ai/docs/cookbook/coding-agents/claude-code-integration):

```bash
gh secret set OPENROUTER_API_KEY -R PedroAlvarado/jev-scout
```

The workflow then points Claude Code at OpenRouter's Anthropic-compatible endpoint (`ANTHROPIC_BASE_URL=https://openrouter.ai/api`, the key in `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY` empty) and names the models the OpenRouter way (`anthropic/claude-opus-5.5`, `anthropic/claude-haiku-4.5`). Two settings on the OpenRouter side matter:

- **A credit limit on the key.** The eval's `--max-cost-usd` is a list-price estimate made by Claude Code, so the key's limit is the real ceiling. The workflow reads the key's limit and remaining credit (a free call) before any paid run, and warns when there is no limit.
- **Anthropic as the first provider** in the account's provider preferences. OpenRouter only guarantees Claude Code with Anthropic's own endpoint, and one provider keeps runs comparable.

To call Anthropic directly instead, set `ANTHROPIC_API_KEY`; when both secrets exist, OpenRouter is used.

Then start a run, from the Actions tab or the command line:

```bash
gh workflow run eval.yml -R PedroAlvarado/jev-scout -f runs=3
gh run watch -R PedroAlvarado/jev-scout
```

Inputs: `runs`, `case` (a name glob), `model` and `judge_model` (empty picks Claude Opus 5.5 and Claude Haiku 4.5 in the provider's naming), `max_cost_usd` and `threshold`. Three runs of both cases, with the no-plugin baseline, cost roughly $5-10 at the default models; set `max_cost_usd` to what you are willing to spend.

### On your machine

Each case folder is a [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals) case. Its `fixture.sh` builds a small, plain repository with a git history in an empty workspace; the prompt asks, in a user's words, where Jev could help; the graders check the report.

```bash
claude plugin eval . --scaffold --allow-tools Bash "WebFetch(domain:docs.typesafe.ai)" Write Edit --no-publish --runs 1 --max-cost-usd 5
```

- `--scaffold` runs the case's `fixture.sh` (bash from this repository) to build the workspace.
- `--allow-tools Bash` lets the skill run its scanner and read git history; without it the skill falls back to file reads. `WebFetch(domain:docs.typesafe.ai)` lets it read TypeSafe's docs and nothing else. `Write` and `Edit` are granted so the "no edits" and "no new files" graders can catch a skill that writes; without them those graders pass trivially.
- `--no-publish` keeps the HTML report local; by default Claude Code publishes it to claude.ai.
- Every run and every `llm` grader is a real model call on your account. Start with `--runs 1` and a cost ceiling.
- Each case also runs without the plugin as a baseline, so the report shows what the skill adds.

### What each fixture plants

| Fixture | Substitution | Augmentation | New-capability anchors | Not a fit |
| --- | --- | --- | --- | --- |
| `support-desk` (TypeScript) | LLM ticket router matched by prefix (`src/triage/router.ts`); keyword urgency rule with three fixes and a revert (`src/triage/urgency.ts`) | first search hit behind a fixed `TOP_K` (`src/kb/suggest.ts`); every refund to a manual review queue (`src/refunds/approve.ts`) | ticket bodies, the `csat_submitted` event, drafted replies | reply drafting, SLA date math, refund amount policy |
| `shop-catalog` (Python) | LLM categorizer parsing JSON (`catalog/categorize.py`); banned-terms regex with three fixes (`catalog/moderation.py`) | fixed `TOP_K` then a re-sort by price (`search/rank.py`); first substring match for variants (`search/variants.py`) | listing titles and descriptions, review text, the disputes metric | commission math, review summaries |

Each case grades: the skill fired; the substitution; the heuristic with its fix history as evidence; an augmentation; an anchored new capability (weighted double); the non-fits; and that nothing was edited, created, committed or filed.

### Results

| Date | Version | Setup | With skill | Without | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-09-23 | 0.2.1 | no Bash, 1 run per arm | 1.00, 1.00 | 0.56, 0.78 | Same setup after the Opus 5.5 prompting audit: no regression, $1.40 instead of $1.99; the tightened new-capability grader now fails a no-plugin run. |
| 2026-09-23 | 0.2.0 | no Bash, 1 run per arm | 1.00, 1.00 | 0.67, 0.78 | Scanner and `git log` not exercised; the skill read commit subjects from `.git/logs/HEAD`. Before this run, the new-capability grader also passed without the plugin, and Write/Edit were not granted; both have since been tightened. |

### Adding a case

Keep fixtures small, plain and free of anything company-specific. Plant at least one opportunity per family and one tempting non-fit, give heuristics a git history of fixes, and write graders as concrete PASS/FAIL conditions that do not depend on formatting.
