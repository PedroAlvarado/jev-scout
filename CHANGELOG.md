# Changelog

## 0.1.0 - 2026-09-23

First published release.

- Renamed from `jev-opportunity-mapper` to `jev-scout`.
- Packaged for `npx skills add PedroAlvarado/jev-scout` and as a Claude Code plugin marketplace.
- The scanner skips every folder that holds a `SKILL.md`. Before, a project-local install ranked the skill's own files above the repository's real code.
- Removed the placeholder `references/api_reference.md`.
- Codex metadata: the short description now fits the 64-character limit, and a default prompt was added.
