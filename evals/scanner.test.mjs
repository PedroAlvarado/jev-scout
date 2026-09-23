// Deterministic checks for scripts/repo_signals.ts against the eval fixtures.
// Run: node --test evals/   (Node 22.6+; the scanner runs with type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
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

test("rejects bad arguments", () => {
  assert.throws(() => execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", scanner, "--bogus"], { stdio: "pipe" }));
});
