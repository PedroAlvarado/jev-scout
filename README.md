# Jev Scout

Jev Scout is an [Agent Skill](https://agentskills.io) that reads your repository and tells you where [TypeSafe Jev](https://typesafe.ai) decision models would create the most value. It looks for three kinds of opportunity:

- **Substitution:** a model call or a keyword rule already makes a small, bounded judgment (a label, a yes/no, a score) that Jev can make faster, cheaper or more reliably.
- **Augmentation:** the code makes a decision without judging - it takes the first match, cuts the list at a fixed top-k, gives everyone the same default, never checks an action, or sends everything to a person - and a typed judgment would do better.
- **New capability:** something the product does not do today because a judgment on every item, step or user was too slow or too expensive, and that becomes practical when judgments are fast and cheap.

It ranks what it finds by business value and gives the top picks a decision contract and a shadow-mode experiment. It works in Claude Code, Codex, Cursor and any other agent that supports Agent Skills, on any ordinary repository. It only reads: it needs no Jev API key, changes no code, and writes nothing outside its report.

## Install

### Any agent

```bash
npx skills add PedroAlvarado/jev-scout
```

This installs the skill into the current project for the coding agents it finds. Add `-g` to install it for your user across all projects, or `-a claude-code` / `-a codex` to choose the agents. Update later with `npx skills update jev-scout`.

### Claude Code plugin

Inside Claude Code:

```text
/plugin marketplace add PedroAlvarado/jev-scout
/plugin install jev-scout@jev-scout
```

Or from a shell:

```bash
claude plugin marketplace add PedroAlvarado/jev-scout
claude plugin install jev-scout@jev-scout
```

Claude Code namespaces plugin skills, so this install is called `/jev-scout:jev-scout`.

### By hand

Copy `skills/jev-scout/` into `.claude/skills/` for Claude Code, or `.agents/skills/` for Codex and most other agents. Either works inside a project or in your home directory.

## Use

Open your agent at the root of the repository you want analyzed and ask in plain words:

- "Where could we use Jev in this repo?"
- "Jevify this codebase."
- "What could this product do if judgments on every item were cheap?"

Or call it by name: `/jev-scout` in Claude Code (`/jev-scout:jev-scout` for the plugin install), `$jev-scout` in Codex.

## How it works

1. **Value chain.** It maps what the system does and the steps where value is won or lost, and notes every judgment at each step - including the ones made by a default, a fixed order, a person, or nobody.
2. **Decision inventory.** A bundled scanner lists model calls, prompts that ask for labels or JSON, parsed model output, keyword rules, first-match picks, fixed cutoffs, manual review steps and related TODOs, with file and line.
3. **Failure record.** Git history shows which decisions keep breaking: fix and revert commits, and keyword lists or thresholds edited again and again. Tests, comments and design docs add context.
4. **Live docs.** It reads TypeSafe's current docs and use-case map when the network is available.
5. **Candidates** in all three families, with at least three new-capability ideas tied to real data and a real integration point.
6. **Challenge.** Each candidate is checked for evidence at decision time, deliberate design, and domain rules such as privacy.
7. **Ranking** with stated estimates: volume, error costs, data sensitivity, labels on hand, evidence strength and time to a first result.
8. **Designs** for the top three: decision contract, Choice/Noul/Score questions, integration point, fallback, and a shadow-mode experiment.

## What you get

A Jev Opportunity Map (the full template is in [`references/output-template.md`](skills/jev-scout/references/output-template.md)):

- an executive table of the ranked opportunities, each with its family, evidence and estimated volume
- the value map and the decision inventory
- full designs for the top three
- every anchored new-capability idea, plus unanchored ideas to explore
- a "Not a Jev fit" section, incidental findings (never filed anywhere), measurements to collect, a recommended first move, and coverage notes

Priority numbers are a ranking aid, not measured return on investment. Where the repository has no baseline (traffic, cost, latency), the skill lists it as something to measure.

## Requirements

Nothing is required. When Bun or Node.js 22.6 or later is already installed, the skill runs its scanner (`scripts/repo_signals.ts`, no dependencies); `git` adds history when present. Without them it uses `rg`, `git grep` and file reads. It never installs anything.

The scanner also runs on its own:

```bash
node --experimental-strip-types skills/jev-scout/scripts/repo_signals.ts --root /path/to/repo --format markdown
bun skills/jev-scout/scripts/repo_signals.ts --root /path/to/repo --format json
```

It scans the files git knows about (respecting `.gitignore`), and skips dependency and build folders, generated files, test files and any folder that holds a `SKILL.md`, so installed agent skills never show up as candidates.

## Evals

[`evals/`](evals/README.md) holds two small fixture repositories with planted opportunities of each kind and a git history. `node --test evals/scanner.test.mjs` checks the scanner against them (it runs in CI), and each fixture is also a [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals) case that grades a full run of the skill against a no-plugin baseline.

## Repository layout

```text
.claude-plugin/          Claude Code marketplace and plugin manifests
skills/jev-scout/        the skill; this folder is what gets installed
  SKILL.md               workflow and rules
  references/            value mapping, evidence sources, new capabilities, ranking,
                         decision design, patterns, output template, sources
  scripts/               repo_signals.ts scanner
  agents/openai.yaml     Codex display metadata
evals/                   fixture repositories, scanner tests, plugin eval cases
```

## Releasing

Claude Code offers an update only when the plugin version changes. For each release:

1. Bump `version` in `.claude-plugin/plugin.json`, following semantic versioning.
2. Add an entry to [`CHANGELOG.md`](CHANGELOG.md) (CI checks that the version has one).
3. Tag the commit: `git tag v0.2.0 && git push origin v0.2.0`.

`npx skills` installs follow the default branch, so they pick up changes with `npx skills update`.

## Credits

The workflow draws on TypeSafe's official skill and documentation and on several community Jev skills. [`references/source-synthesis.md`](skills/jev-scout/references/source-synthesis.md) lists them and what each contributed.

## License

[MIT](LICENSE)
