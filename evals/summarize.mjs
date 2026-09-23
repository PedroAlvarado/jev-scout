// Turns a `claude plugin eval --json` result into a Markdown summary, for a CI job
// summary or a terminal. Usage: node evals/summarize.mjs <results.json>
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node evals/summarize.mjs <results.json>");
  process.exit(2);
}

const result = JSON.parse(readFileSync(file, "utf8"));
const pct = (x) => (typeof x === "number" ? `${Math.round(x * 100)}%` : "-");
const delta = (x) => (typeof x === "number" ? `${x >= 0 ? "+" : ""}${Math.round(x * 100)} pts` : "-");
const passes = (runs, name) => {
  const graded = runs.map((run) => (run.graders ?? []).find((g) => g.name === name)).filter(Boolean);
  return graded.length ? `${graded.filter((g) => g.passed).length}/${graded.length}` : "-";
};

const lines = [];
const agg = result.aggregates ?? {};
lines.push(
  `**Suite:** ${pct(agg.overallScore)} with the skill, ${delta(agg.meanDelta)} against the no-plugin baseline. ` +
    `Claude Code ${result.claudeVersion ?? "?"}, ${result.durationSeconds ?? "?"} s, $${(result.costUsd ?? 0).toFixed(2)}` +
    (result.partial ? ". **Partial run** (cost ceiling or credential problem)." : "."),
  "",
  "| Case | Runs per arm | With skill | Without | Δ | Run errors |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
);

for (const c of result.cases ?? []) {
  const withRuns = c.arms?.with ?? [];
  const withoutRuns = c.arms?.without ?? [];
  const errors = [...withRuns, ...withoutRuns].filter((run) => run.error).length;
  const a = c.aggregates ?? {};
  lines.push(`| ${c.name} | ${withRuns.length} | ${pct(a.score)} | ${pct(a.scoreWithout)} | ${delta(a.delta)} | ${errors} |`);
}

for (const c of result.cases ?? []) {
  const withRuns = c.arms?.with ?? [];
  const withoutRuns = c.arms?.without ?? [];
  const names = [...new Set([...withRuns, ...withoutRuns].flatMap((run) => (run.graders ?? []).map((g) => g.name)))].sort();
  lines.push("", `### ${c.name}`, "", "| Grader | With skill | Without |", "| --- | ---: | ---: |");
  for (const name of names) lines.push(`| ${name} | ${passes(withRuns, name)} | ${passes(withoutRuns, name)} |`);
  const errors = [...withRuns, ...withoutRuns].map((run) => run.error).filter(Boolean);
  for (const error of [...new Set(errors)]) lines.push("", `Run error: ${String(error).slice(0, 300)}`);
}

console.log(lines.join("\n"));
