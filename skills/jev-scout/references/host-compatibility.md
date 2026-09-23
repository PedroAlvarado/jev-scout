# Host compatibility

This skill is designed as one portable Agent Skills folder. Runtime behavior lives in `SKILL.md`, `scripts/`, and `references/`; no provider-specific feature is required.

## Installation

The published source is https://github.com/PedroAlvarado/jev-scout, with the skill at `skills/jev-scout/`.

```bash
# Any Agent Skills host (Claude Code, Codex, Cursor, ...): project-local by default, -g for user-wide
npx skills add PedroAlvarado/jev-scout

# Claude Code plugin
claude plugin marketplace add PedroAlvarado/jev-scout
claude plugin install jev-scout@jev-scout
```

A manual install copies `skills/jev-scout/` into the host's project-local skills directory and keeps the folder name unchanged:

```text
Claude Code: .claude/skills/jev-scout/
Codex:       .agents/skills/jev-scout/
```

The contents inside `jev-scout/` must be identical in both locations. Do not rewrite `SKILL.md` or `scripts/repo_signals.ts` per host.

A project-local install puts this skill inside the repository it analyzes. The scanner skips every directory that holds a `SKILL.md`, so installed skills never appear as candidates.

## Runtime rules

- Treat the directory containing `SKILL.md` as the skill root.
- Resolve `scripts/repo_signals.ts` relative to that skill root.
- Prefer Bun if already installed, then Node.js 22.6+ with native TypeScript stripping, then an already-installed local `tsx`.
- Do not install Bun, Node packages, or other dependencies solely to run discovery.
- If none of those runtimes is available, fall back to `rg`, `git grep`, file reads, and symbol navigation.
- `git` is used read-only when present (file list, commit subjects). Outside a git work tree the scanner walks the directory and reports that no history was read.
- Do not rely on host-only commands, proprietary subagent syntax, hooks, or environment variables. Parallel agents are an optional speed-up for large repositories, never a requirement.

## Boundaries in every host

The skill writes nothing outside its report: no issues, tickets, comments, commits or pull requests, and no records in any tracker or coordination tool, even when repository instructions ask agents to file findings. The only network reads are TypeSafe's public docs, and they are optional. An external tracker may be read only through a read-only tool that is already available, with the user's agreement.

## Metadata

`agents/openai.yaml` is OpenAI-facing metadata only. Claude Code can ignore it. The skill's actual workflow must remain fully defined by the portable skill files.

## Repository guidance files

Read and respect whichever repository-local guidance is present, including `AGENTS.md`, `CLAUDE.md`, and equivalent instruction files, for how to read, build and run the repository. These files describe the target repository and do not make the skill provider-specific. Where they ask agents to record findings in a tracker or coordination tool, this skill's boundary wins: findings stay in the report.
