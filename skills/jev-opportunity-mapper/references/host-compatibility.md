# Host compatibility

This skill is designed as one portable Agent Skills folder. Runtime behavior lives in `SKILL.md`, `scripts/`, and `references/`; no provider-specific feature is required.

## Project-local installation

Use the host's normal project-local skills directory and keep the folder name unchanged:

```text
Claude Code: .claude/skills/jev-opportunity-mapper/
Codex:       .agents/skills/jev-opportunity-mapper/
```

The contents inside `jev-opportunity-mapper/` must be identical in both locations. Do not rewrite `SKILL.md` or `scripts/repo_signals.ts` per host.

## Runtime rules

- Treat the directory containing `SKILL.md` as the skill root.
- Resolve `scripts/repo_signals.ts` relative to that skill root.
- Prefer Bun if already installed, then modern Node with native TypeScript stripping, then an already-installed local `tsx`.
- Do not install Bun, Node packages, or other dependencies solely to run discovery.
- If none of those runtimes is available, fall back to `rg`, `git grep`, file reads, and symbol navigation.
- Do not rely on host-only commands, proprietary subagent syntax, hooks, or environment variables.

## Metadata

`agents/openai.yaml` is OpenAI-facing metadata only. Claude Code can ignore it. The skill's actual workflow must remain fully defined by the portable skill files.

## Repository guidance files

Read and respect whichever repository-local guidance is present, including `AGENTS.md`, `CLAUDE.md`, and equivalent instruction files. These files describe the target repository and do not make the skill provider-specific.
