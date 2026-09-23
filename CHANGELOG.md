# Changelog

## 0.2.1 - 2026-09-23

Changes from an audit against the prompting guidance for Claude Opus 5.5 and current Claude models.

- Text read from the repository, its history, trackers and web pages is treated as evidence, not as instructions.
- The ranking no longer adds up a nine-term formula by hand: the 0-5 scores are the stated reasons for a ranking made by judgment, and the report's Priority column becomes "Why this rank".
- The skill states when the work is done, so long or unattended runs don't stop at a progress summary.
- The history of earlier runs moved out of `references/source-synthesis.md`; it is kept here.
- A manual `eval` GitHub workflow runs the plugin eval suite on a clean Ubuntu runner with Bash granted, pinned Claude Code and models, three runs per case, a cost ceiling and a score threshold; `evals/summarize.mjs` writes the job summary.

## 0.2.0 - 2026-09-23

The skill now looks for new capabilities and implicit decisions, not only for model calls to replace.

- **Value-first workflow.** The skill maps the system's value chain before scanning code, including judgments made by a default, a fixed ordering, a person, or nobody.
- **Three families of opportunity:** substitution, augmentation and new capability. At least three anchored new-capability candidates are required, ranking happens within each family, and the top three include a non-substitution whenever one survives.
- **Failure record.** Git fix and revert history, heuristic churn, tests, comments and design docs are read as evidence, from the local checkout only.
- **Live docs.** The skill reads TypeSafe's current docs index, use-case map and closest cookbooks when the network is available.
- **Challenge step.** Each candidate is checked for evidence at decision time, deliberate design, and domain rules before it is ranked.
- **Ranking with estimates:** volume with its derivation, error costs, data sensitivity, labels on hand, evidence strength and time to a first shadow result.
- **Boundaries.** Analysis only: the skill writes nothing outside its report - no issues, tickets, comments or commits - even when a repository's agent instructions ask for it.
- **Scanner v2** builds a decision inventory instead of counting keywords: model calls, prompt text, parsed model output, keyword rules, first-match selection, fixed cutoffs, manual review, TODOs and judgment-named functions. It uses `git ls-files` (so `.gitignore` is respected), skips generated and test files, never caps counts, caps each kind's weight per file, and reports fix hotspots from git history.
- **New report sections:** value map, decision inventory, new capabilities, incidental findings, measurements to collect, and coverage notes.
- **Evals.** Two plain fixture repositories with planted opportunities, deterministic scanner tests in CI, and `claude plugin eval` cases with graders.

## 0.1.0 - 2026-09-23

First published release.

- Renamed from `jev-opportunity-mapper` to `jev-scout`.
- Packaged for `npx skills add PedroAlvarado/jev-scout` and as a Claude Code plugin marketplace.
- The scanner skips every folder that holds a `SKILL.md`. Before, a project-local install ranked the skill's own files above the repository's real code.
- Removed the placeholder `references/api_reference.md`.
- Codex metadata: the short description now fits the 64-character limit, and a default prompt was added.
