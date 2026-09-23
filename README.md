# Jev Scout

Jev Scout is an [Agent Skill](https://agentskills.io) that reads your repository and tells you where [TypeSafe Jev](https://typesafe.ai) decision models would pay off. It looks for repeated judgments in your code, such as routing, triage, ranking and checks, that could become fast, typed Jev calls. It ranks them by business value and gives the top ones a decision contract and a shadow-mode experiment.

It works in Claude Code, Codex, Cursor and any other agent that supports Agent Skills. It only reads your code: it needs no Jev API key and sends nothing anywhere.

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
- "Which of our LLM calls could become cheap typed decisions?"

Or call it by name: `/jev-scout` in Claude Code (`/jev-scout:jev-scout` for the plugin install), `$jev-scout` in Codex.

The skill proposes; it does not change your code unless you ask it to implement one of its proposals.

## What you get

A Jev Opportunity Map (the full template is in [`references/output-template.md`](skills/jev-scout/references/output-template.md)):

- a ranked table of 5 to 10 opportunities, each tied to file paths and line numbers
- for the top three: current behavior, business case, decision contract (Choice, Noul and Score questions), integration point, shadow-mode experiment, fallback and risk
- a "Not a Jev fit" section naming parts of the repository that should stay ordinary code or go to a larger model
- one recommended first experiment

Priority numbers are a ranking aid, not measured return on investment. Where the repository has no baseline (traffic, cost, latency), the skill lists it as something to measure.

## Requirements

Nothing is required. When Bun or Node.js 22.6 or later is already installed, the skill runs a bundled scanner (`scripts/repo_signals.ts`, no dependencies) to find candidate files faster. Without either, it uses `rg` and `git grep`. It never installs anything.

The scanner also runs on its own:

```bash
node --experimental-strip-types skills/jev-scout/scripts/repo_signals.ts --root /path/to/repo --format markdown
bun skills/jev-scout/scripts/repo_signals.ts --root /path/to/repo --format json
```

It skips dependency and build folders, and any folder that holds a `SKILL.md`, so installed agent skills never show up as candidates.

## Repository layout

```text
.claude-plugin/          Claude Code marketplace and plugin manifests
skills/jev-scout/        the skill; this folder is what gets installed
  SKILL.md               workflow and rules
  references/            decision design, opportunity patterns, output template, sources
  scripts/               repo_signals.ts scanner
  agents/openai.yaml     Codex display metadata
```

## Releasing

Claude Code offers an update only when the plugin version changes. For each release:

1. Bump `version` in `.claude-plugin/plugin.json`, following semantic versioning.
2. Add an entry to [`CHANGELOG.md`](CHANGELOG.md).
3. Tag the commit: `git tag v0.2.0 && git push origin v0.2.0`.

`npx skills` installs follow the default branch, so they pick up changes with `npx skills update`.

## Credits

The workflow draws on TypeSafe's official skill and several community Jev skills. [`references/source-synthesis.md`](skills/jev-scout/references/source-synthesis.md) lists them and what each contributed.

## License

[MIT](LICENSE)
