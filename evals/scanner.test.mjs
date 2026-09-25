// Deterministic checks for scripts/repo_signals.ts against the eval fixtures.
// Run: node --test evals/   (Node 22.6+; the scanner runs with type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const scanner = join(here, "..", "skills", "jev-scout", "scripts", "repo_signals.ts");

function build(fixture) {
  const dir = mkdtempSync(join(tmpdir(), `jev-scout-${fixture}-`));
  execFileSync("bash", [join(here, fixture, "fixture.sh")], { cwd: dir, stdio: "ignore" });
  return dir;
}

function scan(dir, ...extra) {
  const out = execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", scanner, "--root", dir, "--format", "json", ...extra], { encoding: "utf8" });
  return JSON.parse(out);
}

const kindsOf = (result, path) => result.top_files.find((f) => f.path === path)?.kinds ?? {};

test("support-desk: inventory finds each planted decision", (t) => {
  const dir = build("support-desk");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const result = scan(dir);

  assert.equal(result.file_source, "git");
  const router = kindsOf(result, "src/triage/router.ts");
  for (const kind of ["model_call", "prompt_literal", "output_coercion"]) assert.ok(router[kind], `router.ts: ${kind}`);
  assert.ok(kindsOf(result, "src/triage/urgency.ts").semantic_heuristic, "urgency.ts: semantic_heuristic");
  const suggest = kindsOf(result, "src/kb/suggest.ts");
  assert.ok(suggest.first_match && suggest.fixed_cutoff, "suggest.ts: first_match and fixed_cutoff");
  assert.ok(kindsOf(result, "src/refunds/approve.ts").human_review, "approve.ts: human_review");
  assert.equal(result.top_files[0].path, "src/triage/router.ts");
});

test("support-desk: git history marks the patched keyword heuristic", (t) => {
  const dir = build("support-desk");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const result = scan(dir);

  const hotspot = result.fix_hotspots.find((h) => h.path === "src/triage/urgency.ts");
  assert.ok(hotspot, "urgency.ts is a fix hotspot");
  assert.equal(hotspot.fix_commits, 4);
});

test("support-desk: skips generated, ignored and installed-skill files", (t) => {
  const dir = build("support-desk");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const result = scan(dir);

  const paths = Object.values(result.hits).flat().map((h) => h.path);
  assert.ok(!paths.some((p) => p.startsWith(".agents/")), "no hits inside .agents/skills");
  assert.ok(!paths.some((p) => p.endsWith(".d.ts")), "no hits in .d.ts files");
  assert.ok(!paths.some((p) => p.startsWith("tmp/")), "no hits in gitignored tmp/");
  assert.equal(result.skipped.generated, 1);
  assert.equal(result.skipped.skill_folders, 2);
});

test("support-desk: works without git", (t) => {
  const dir = build("support-desk");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const result = scan(dir, "--no-git");

  assert.equal(result.file_source, "walk");
  assert.equal(result.git.used, false);
  assert.ok(kindsOf(result, "src/triage/router.ts").model_call);
  assert.ok(!Object.values(result.hits).flat().some((h) => h.path.startsWith(".agents/")));
});

test("shop-catalog: inventory and history for a Python service", (t) => {
  const dir = build("shop-catalog");
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const result = scan(dir);

  const categorize = kindsOf(result, "catalog/categorize.py");
  for (const kind of ["model_call", "prompt_literal", "output_coercion"]) assert.ok(categorize[kind], `categorize.py: ${kind}`);
  const moderation = kindsOf(result, "catalog/moderation.py");
  assert.ok(moderation.semantic_heuristic && moderation.human_review, "moderation.py: heuristic and review queue");
  assert.ok(kindsOf(result, "search/rank.py").fixed_cutoff, "rank.py: fixed_cutoff");
  assert.ok(kindsOf(result, "search/variants.py").first_match, "variants.py: first_match");
  assert.equal(result.fix_hotspots.find((h) => h.path === "catalog/moderation.py")?.fix_commits, 3);
});

test("free-text rules, raw HTTP calls, build folders, bundles and globs", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "jev-scout-rules-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const files = {
    "src/signals.ts": 'export const vague = (tasks) => tasks.filter((task) => !/done when|verification/i.test(task.description ?? ""));\n',
    "src/check.ts": "export function sameOption(actual: string, target: string) {\n  const a = actual.toLowerCase();\n  const t = target.toLowerCase();\n  return a.includes(t) || t.includes(a);\n}\n",
    "src/format.ts": "export const isEmail = (email: string) => /^[^\\s@]+@[^\\s@]+$/.test(email);\n",
    "src/raw.ts": 'export const ask = (text: string) => fetch("https://api.openai.com/v1/chat/completions", { method: "POST", body: JSON.stringify({ model: "m", messages: [{ role: "user", content: text }] }) });\n',
    "py/tasks.py": 'import re\n\ndef has_done_when(task):\n    return bool(re.search(r"done when|acceptance criteria", task.description))\n\ndef same(a, t):\n    return t in a or a in t\n',
    ".alchemy/state.ts": 'generateText({ prompt: "x" });\n',
    "public/app.js": 'generateText({ prompt: "x" });\n//# sourceMappingURL=app.js.map\n',
    "assets/chunk.js": "var a=1;".repeat(1000) + 'generateText({ prompt: "x" });\n',
  };
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, dirname(path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }

  const result = scan(dir, "--no-git");
  const kinds = (path) => kindsOf(result, path);
  assert.ok(kinds("src/signals.ts").semantic_heuristic, "regex tested on a task description");
  assert.ok(kinds("src/check.ts").semantic_heuristic, "two-way includes");
  assert.equal(kinds("src/format.ts").semantic_heuristic, undefined, "a format check is not a semantic heuristic");
  assert.ok(kinds("src/raw.ts").model_call, "raw HTTP call to a model provider");
  assert.ok((kinds("py/tasks.py").semantic_heuristic ?? 0) >= 2, "Python regex on free text and two-way `in`");
  const paths = Object.values(result.hits).flat().map((h) => h.path);
  assert.ok(!paths.some((p) => p.startsWith(".alchemy/")), "build-state folder skipped");
  assert.ok(!paths.some((p) => p.startsWith("public/") || p.startsWith("assets/")), "bundles skipped");
  assert.equal(result.skipped.generated, 2);

  const narrowed = scan(dir, "--no-git", "--include", "src/**", "--exclude", "**/raw.ts");
  const narrowedPaths = Object.values(narrowed.hits).flat().map((h) => h.path);
  assert.ok(narrowedPaths.length > 0 && narrowedPaths.every((p) => p.startsWith("src/") && p !== "src/raw.ts"));
  assert.ok(narrowed.skipped.excluded >= 4);
});

test("rejects bad arguments", () => {
  assert.throws(() => execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", scanner, "--bogus"], { stdio: "pipe" }));
});
