# Reading the failure record

The strongest evidence that a judgment matters is that people keep having to correct it. Every repository keeps some of that record locally. Use it before ranking, and cite it in the report.

Everything on this page is read-only. Do not create issues, comments, commits or any other record anywhere.

## Git history

Without a shell, `.git/logs/HEAD` (the reflog) can be read as a file: it lists the subjects of commits made, pulled or checked out on this machine. In a fresh clone it holds little more than the clone itself, so say how much history it covered in **Coverage notes**, and do not read its absence as "no fixes".

Check first whether history is complete:

```bash
git rev-parse --is-shallow-repository   # "true" means history is partial; say so in Coverage notes
```

Files most touched by fix and revert commits (the scanner's **Fix hotspots** does this for the last 2000 commits):

```bash
git log --no-merges -n 2000 --format='@@%s' --name-only \
  | awk '/^@@/{fix = ($0 ~ /[Ff]ix|[Bb]ug|[Rr]evert|[Hh]otfix|[Rr]egression|[Ww]rong|[Ii]ncorrect|false (positive|negative)/); next} fix && NF {print}' \
  | sort | uniq -c | sort -rn | head -20
```

Reverts and fix-after-fix chains:

```bash
git log --no-merges --format='%h %ad %s' --date=short -n 300 | grep -iE 'revert|fix' | head -50
git log --format='%h %ad %s' --date=short -- path/to/file | head -30
```

## Heuristic churn

A keyword list, regex, threshold or prompt that is edited again and again is a semantic decision disguised as code. Each edit usually fixes one case and breaks another.

```bash
# every commit that changed a line mentioning the constant (-G matches changed lines;
# -S would only catch commits that change how many times the string appears)
git log --format='%h %ad %s' --date=short -G'URGENT_KEYWORDS' -- src/

# the history of a block of lines
git log --format='%h %ad %s' --date=short -L '/URGENT_KEYWORDS/,+5:src/triage/urgency.ts'
```

Read the commit subjects: "false positive on …", "missed …", "treat X as …" describe exactly the boundary cases a Jev question must get right. They are ready-made evaluation examples.

## Tests

- A heuristic function with a long tail of edge-case tests, or a parametrized table of inputs and expected labels, shows a decision people keep correcting. The table is also labeled data.
- Golden or snapshot files of model output show what the team expects a model to produce.
- Eval folders (`evals/`, `benchmarks/`, `fixtures/`, `testdata/`) and grader code show how the team already judges quality.

## Comments and docs

```bash
rg -n --no-heading -i '\b(TODO|FIXME|HACK|XXX)\b.*\b(fuzzy|semantic|heuristic|smarter|classif|dedup|duplicate|intent|relevan|similar|guess)' .
rg -n --no-heading -i 'for now|temporary|good enough|best effort|rough heuristic' .
```

Design docs, ADRs (`docs/adr/`, `decisions/`), RFCs, postmortems and `CHANGELOG` entries explain deliberate choices. Read the ones near a candidate before recommending a change to it: a documented reason can make a tempting opportunity a bad one.

## Labels on hand

Note any data that could evaluate a Jev decision without new labeling work:

- test fixtures with expected outputs
- eval sets and graders
- seed data and sample records
- lookup and mapping tables that turn free text into categories
- alias, synonym, allow and deny lists
- a heuristic's past corrections in git history (each fix commit is a labeled boundary case)
- records whose status was corrected by a person (reclassified, reopened, merged as duplicate), when that history is stored in the code's database schema

## Optional: external trackers

If a read-only tool for the project's issue tracker is already installed and authenticated, and the user agrees, searching it can add evidence, for example:

```bash
gh issue list --state all --search "misclassified OR false positive OR wrong category" --limit 50
```

Never require a tracker, never ask for credentials, and never create, edit or comment on anything.
