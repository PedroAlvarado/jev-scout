// Copies each run's transcript (the `tracePath` of every run in a `claude plugin eval
// --json` result) to <out>/<case>/<arm>-<n>.jsonl, so CI can upload the transcripts
// without the rest of each run's kept sandbox, parts of which are sealed and unreadable.
// Usage: node evals/collect-traces.mjs <results.json> <out dir>
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const [file, outDir] = process.argv.slice(2);
if (!file || !outDir) {
  console.error("usage: node evals/collect-traces.mjs <results.json> <out dir>");
  process.exit(2);
}

const result = JSON.parse(readFileSync(file, "utf8"));
let copied = 0;
let skipped = 0;
for (const c of result.cases ?? []) {
  for (const [arm, runs] of Object.entries(c.arms ?? {})) {
    runs.forEach((run, i) => {
      if (!run.tracePath) return;
      const dir = join(outDir, c.name);
      try {
        mkdirSync(dir, { recursive: true });
        copyFileSync(run.tracePath, join(dir, `${arm}-${i + 1}.jsonl`));
        copied += 1;
      } catch (error) {
        skipped += 1;
        console.warn(`skipped ${run.tracePath}: ${error.code ?? error.message}`);
      }
    });
  }
}
console.log(`copied ${copied} transcripts${skipped ? `, skipped ${skipped}` : ""} to ${outDir}`);
