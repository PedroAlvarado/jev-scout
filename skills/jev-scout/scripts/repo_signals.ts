#!/usr/bin/env -S node --experimental-strip-types
/**
 * Build a decision inventory for a local repository: the places where a model, a
 * rule, a person or nobody makes a bounded judgment that a Jev decision model could
 * take over, check, or newly make.
 *
 * This is intentionally heuristic. It surfaces candidate files and lines for an
 * agent to inspect; it does not decide whether Jev is appropriate or estimate ROI.
 * It has no third-party dependencies, reads only local files and `git`, and never
 * sends repository data anywhere.
 *
 * - Inside a git work tree it scans `git ls-files` (tracked plus untracked files that
 *   are not ignored); elsewhere it walks the directory.
 * - It scans source code only, and skips dependency and build folders, generated
 *   files, lockfiles, minified bundles, and every folder that holds a SKILL.md
 *   (installed agent skills describe AI behavior, so they would outrank real code).
 * - Hit counts are never capped; only the listed examples are.
 * - With git, it also reads recent commit subjects to find the files most touched by
 *   fix and revert commits, and how often each file changes.
 *
 * Runtime options:
 *   bun repo_signals.ts --root . --format markdown
 *   node --experimental-strip-types repo_signals.ts --root . --format markdown
 *   npx --no-install tsx repo_signals.ts --root . --format markdown
 */

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import process from "node:process";

type OutputFormat = "markdown" | "json";

type Kind =
  | "model_call"
  | "prompt_literal"
  | "output_coercion"
  | "semantic_heuristic"
  | "first_match"
  | "fixed_cutoff"
  | "human_review"
  | "todo_semantic"
  | "decision_function";

type Hit = { path: string; line: number; excerpt: string };

type TopFile = {
  path: string;
  score: number;
  kinds: Partial<Record<Kind, number>>;
  fix_commits: number;
  commits: number;
};

type FixHotspot = { path: string; fix_commits: number; commits: number };

type ScanResult = {
  root: string;
  file_source: "git" | "walk";
  files_scanned: number;
  skipped: { generated: number; tests: number; skill_folders: number; too_large: number; not_code: number };
  git: { used: boolean; commits_read: number; shallow: boolean; note?: string };
  kind_counts: Partial<Record<Kind, number>>;
  top_files: TopFile[];
  hits: Partial<Record<Kind, Hit[]>>;
  fix_hotspots: FixHotspot[];
  note: string;
};

type Options = {
  root: string;
  format: OutputFormat;
  maxFiles: number;
  maxBytes: number;
  maxHitsPerKind: number;
  gitDepth: number;
  useGit: boolean;
};

const KIND_INFO: Record<Kind, { weight: number; label: string }> = {
  model_call: { weight: 3, label: "Calls to a language model (SDK or HTTP client)" },
  prompt_literal: { weight: 3, label: "Prompt text that asks for a label, a yes/no, a score or strict JSON" },
  output_coercion: { weight: 2, label: "Model output parsed or matched into a label, enum or JSON field" },
  semantic_heuristic: { weight: 2, label: "Keyword lists and regexes standing in for meaning" },
  first_match: { weight: 2, label: "The first match or first candidate taken without a judgment" },
  fixed_cutoff: { weight: 1, label: "Fixed top-k, limits and thresholds on ranked or retrieved candidates" },
  human_review: { weight: 1, label: "Manual review, approval, moderation and escalation steps" },
  todo_semantic: { weight: 2, label: "TODO/FIXME notes asking for smarter, fuzzier or semantic behavior" },
  decision_function: { weight: 1, label: "Functions named for a judgment (classify, triage, rank, detect, ...)" },
};

const KINDS = Object.keys(KIND_INFO) as Kind[];

const PER_KIND_CAP = 5;

const SKIP_DIRS = new Set([
  ".git", ".hg", ".svn", ".idea", ".vscode", ".next", ".nuxt", ".turbo", ".svelte-kit",
  "node_modules", "vendor", "third_party", "dist", "build", "out", "coverage", "target",
  ".venv", "venv", "__pycache__", ".cache", ".pytest_cache", ".mypy_cache", ".gradle",
  "tmp", "temp", "Pods", "DerivedData",
]);

const CODE_EXTENSIONS = new Set([
  ".py", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts", ".go", ".rs",
  ".java", ".kt", ".kts", ".rb", ".php", ".swift", ".cs", ".scala", ".ex", ".exs",
  ".vue", ".svelte", ".dart", ".lua",
]);

const GENERATED_PATH = new RegExp(
  [
    String.raw`\.d\.[cm]?ts$`, String.raw`\.min\.(js|css)$`, String.raw`\.bundle\.js$`,
    String.raw`_pb2(_grpc)?\.py$`, String.raw`\.pb\.(go|ts|js)$`, String.raw`\.g\.dart$`,
    String.raw`\.generated\.\w+$`, String.raw`(^|/)(generated|__generated__|gen)/`,
  ].join("|"),
  "i",
);

const TEST_PATH = /(^|\/)(tests?|__tests__|spec|specs|e2e|testdata|fixtures?)\/|\.(test|spec|e2e)\.\w+$|_test\.(go|py|rb|exs)$|(^|\/)test_\w+\.py$|Tests?\.(kt|java|cs|swift)$|Spec\.(kt|scala|rb)$/i;

const GENERATED_MARKER = /@generated|DO NOT EDIT|auto-?generated/i;

const FIX_SUBJECT = /\b(fix(es|ed)?|bug(fix)?|revert(s|ed)?|hotfix|regression|wrong|incorrect|broken|misclassif\w*|false (positive|negative)s?|edge case)\b/i;

// One entry per kind; a line may hit several kinds.
const MATCHERS: Record<Kind, (line: string) => boolean> = {
  model_call: (line) =>
    /\b(generateText|generateObject|streamText|streamObject)\s*\(/.test(line) ||
    /\b(messages|chat\.completions|completions|responses)\.(create|stream|parse)\s*\(/.test(line) ||
    /\.AI\.run\s*\(|\b(invoke_model|invokeModel|converse|ConverseCommand|InvokeModelCommand)\b/.test(line) ||
    /\b(createChatCompletion|chatCompletion|ChatCompletion\.create|generate_content|generateContent)\s*\(/.test(line) ||
    /\bollama\.(chat|generate)\s*\(|\bnew ToolLoopAgent\s*\(|\bdspy\.(Predict|ChainOfThought)\b|\bLLMChain\b/.test(line) ||
    /\b(llm|lm|chatModel|chat_model|chatClient|chain|LLM)\w*\.(generate|invoke|ainvoke|complete|predict|prompt|chat)\s*\(/.test(line),
  prompt_literal: (line) =>
    /(answer with (exactly )?(one|a single) (word|label|number|letter)|respond (only )?with (one|a single|exactly|json|yes|true|the)|reply (only )?(with )?(strict )?json|return (only|strictly) (valid )?json|return (a )?valid json|output (only|exactly|a single)|classify (this|the|each)|categori[sz]e (this|the)|one of the following|yes or no|true or false|on a scale (of|from)|you are (a|an|the) [\w -]{0,40}(judge|classifier|router|grader|moderator|reviewer|evaluator|detector))/i.test(line),
  output_coercion: (line) =>
    /\.(find|filter|some)\(\s*\(?\w+\)?\s*=>\s*\w+\.startsWith\(/.test(line) ||
    (/\b(answer|response|resp|res|reply|completion|verdict|output)\w*\b|\.content\[0\]|choices\[0\]/i.test(line) &&
      /\.(startsWith|toLowerCase|toUpperCase|lower|upper)\(|\b(json\.loads?|JSON\.parse|decodeFromString|valueOf|entries\.first\w*)\b/.test(line)),
  semantic_heuristic: (line) => {
    const semanticWord = /\b(spam|urgent|urgency|fraud|risk|sentiment|toxic\w*|intent|relevan\w*|refund|complain\w*|angry|abuse|profan\w*|counterfeit|banned|cancel\w*|churn|frustrat\w*|offensive|scam|phishing|legit\w*)\b/i.test(line);
    // free text checked for words: `body.toLowerCase().includes("refund")`, `re.search(URGENT, text)`
    const textMatch =
      /\b(text|body|message|msg|content|title|description|desc|subject|comment|query|input|note|reason|summary|transcript|review|feedback|email)\w*(\.(toLowerCase|toLocaleLowerCase|lower|trim|strip)\(\))*\.(includes|contains|match|startsWith|endsWith|search)\(/i.test(line) ||
      /\.(toLowerCase|lower)\(\)\.(includes|contains|startsWith|endsWith|match)\(/.test(line) ||
      /\bre\.(search|match|findall|fullmatch)\(|\w*(_RE|Regex|REGEX|Pattern|PATTERN)\.(test|search|match|matcher)\(/.test(line);
    const literalWord = /\.(includes|contains|startsWith|endsWith)\(\s*["'][a-z][a-z' ]{2,}["']\s*\)/.test(line);
    return (
      (textMatch && (semanticWord || literalWord)) ||
      // word lists: `URGENT_KEYWORDS = [...]`, `banned_words = {...}`, `SPAM_RE = re.compile(...)`
      /\b(\w*(KEYWORDS?|STOP_?WORDS|PHRASES|SYNONYMS|BLOCK_?LIST|DENY_?LIST|BAD_?WORDS|PROFANITY|BANNED\w*|TRIGGER_?WORDS)|keywords|stop_?words|phrases|synonyms|trigger_?words|banned_?words)\b(\s*:\s*[\w<>\[\], ]+)?\s*[:=]\s*(\[|\{|new Set\(|set\(|frozenset\(|re\.compile\(|new RegExp\(|\/|listOf\(|setOf\(|arrayOf\(|List\.of\(|Set\.of\()/i.test(line) ||
      // a regex of three or more lowercase words: /\b(refund|chargeback|dispute)\b/
      /[/"'][^/"'\n]*\\b\(?[a-z]{3,}\|[a-z]{3,}\|[a-z]{3,}/.test(line) ||
      /\(\?i\)[^"'\n]*[a-z]{3,}\|[a-z]{3,}\|[a-z]{3,}/.test(line)
    );
  },
  first_match: (line) =>
    /FIRST_ORDERED_NODE_TYPE/.test(line) ||
    /\b(candidates?|matches|options|results|elements|choices|hits|suggestions|variants)\b\s*(\[0\]|\.first\(\)|\.firstOrNull\(\)|\.head\b|\.get\(0\))/.test(line) ||
    /\.(find|first|firstOrNull)\s*[({][^)}]*\.(includes|contains|startsWith|test|match)\(/.test(line),
  fixed_cutoff: (line) =>
    /\b(TOP_?K|SHORTLIST_\w+|MAX_(RESULTS|CANDIDATES|DOCS|DOCUMENTS|CHUNKS|MATCHES|SUGGESTIONS|HITS)|similarity_top_k|n_results|SIMILARITY_THRESHOLD|MIN_SCORE|SCORE_THRESHOLD)\b/.test(line) ||
    /\b(top_?k|topK)\s*[:=]\s*\d+/.test(line) ||
    (/(\.slice\(0,\s*\d+\)|\.take\(\d+\)|\[:\s*\d+\]|\.limit\(\d+\)|\bLIMIT \d+)/.test(line) &&
      /(rank|score|similar|relevan|candidate|retriev|embedding|shortlist|rerank)/i.test(line)),
  human_review: (line) =>
    /(manual[_ -]?review|human[_ -]?review|needs?[_ -]?review|pending[_ -]?review|review[_ -]?queue|moderation[_ -]?queue|awaiting[_ -]?approval|requires?[_ -]?approval|flag(ged)?[_ -]?for[_ -]?review|escalat(e|es|ion|ions))\b/i.test(line),
  todo_semantic: (line) =>
    /\b(TODO|FIXME|HACK|XXX)\b.*\b(fuzzy|semantic|heuristic|smarter|better (match|matching|detection|ranking)|classif\w*|dedup\w*|duplicates?|intent|relevan\w*|similar\w*|guess\w*|nlp|llm|machine learning|ml|ai)\b/i.test(line),
  decision_function: (line) =>
    /\b(function|def|fun|fn|func)\s+\w*(classif|triage|categori|prioriti|rerank|rank|score|dedup|moderat|detect|guess|infer|choose|pick|decide|judge)\w*/i.test(line) ||
    /\b(const|let|val|var)\s+\w*(classif|triage|categori|prioriti|rerank|dedup|moderat|detect|guess|infer|choose|pick|decide|judge)\w*\s*=\s*(async\s*)?(\(|function)/i.test(line),
};

function parseInteger(value: string | undefined, flag: string): number {
  if (!value) throw new Error(`Missing value for ${flag}`);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`Invalid positive integer for ${flag}: ${value}`);
  return parsed;
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    root: ".",
    format: "markdown",
    maxFiles: 100_000,
    maxBytes: 1_000_000,
    maxHitsPerKind: 25,
    gitDepth: 2000,
    useGit: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--root":
        options.root = argv[++i] ?? "";
        if (!options.root) throw new Error("Missing value for --root");
        break;
      case "--format": {
        const format = argv[++i];
        if (format !== "markdown" && format !== "json") throw new Error(`Invalid --format: ${format ?? ""}`);
        options.format = format;
        break;
      }
      case "--max-files":
        options.maxFiles = parseInteger(argv[++i], "--max-files");
        break;
      case "--max-bytes":
        options.maxBytes = parseInteger(argv[++i], "--max-bytes");
        break;
      case "--max-hits-per-kind":
        options.maxHitsPerKind = parseInteger(argv[++i], "--max-hits-per-kind");
        break;
      case "--git-depth":
        options.gitDepth = parseInteger(argv[++i], "--git-depth");
        break;
      case "--no-git":
        options.useGit = false;
        break;
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp(): void {
  process.stdout.write(`Build a decision inventory for Jev opportunity discovery.\n\n` +
    `Usage: repo_signals.ts [options]\n\n` +
    `Options:\n` +
    `  --root <path>                 Repository root (default: .)\n` +
    `  --format <markdown|json>      Output format (default: markdown)\n` +
    `  --max-files <n>               Maximum source files to scan (default: 100000)\n` +
    `  --max-bytes <n>               Skip files larger than this (default: 1000000)\n` +
    `  --max-hits-per-kind <n>       Example lines listed per kind; counts are never capped (default: 25)\n` +
    `  --git-depth <n>               Recent commits read for fix and change history (default: 2000)\n` +
    `  --no-git                      Walk the directory and skip git history\n`);
}

function git(root: string, args: string[]): string | null {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
  if (result.error || result.status !== 0) return null;
  return result.stdout;
}

function toPosix(path: string): string {
  return sep === "/" ? path : path.split(sep).join("/");
}

function inSkippedDir(relPath: string): boolean {
  return relPath.split("/").slice(0, -1).some((segment) => SKIP_DIRS.has(segment));
}

/** Candidate files as root-relative POSIX paths, and where the list came from. */
function listCandidates(root: string, useGit: boolean): { files: string[]; source: "git" | "walk" } {
  if (useGit && git(root, ["rev-parse", "--is-inside-work-tree"])?.trim() === "true") {
    const out = git(root, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
    if (out !== null) return { files: [...new Set(out.split("\0").filter(Boolean))], source: "git" };
  }

  const files: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push(path);
      } else if (entry.isFile()) {
        files.push(toPosix(relative(root, path)));
      }
    }
  }
  return { files, source: "walk" };
}

/** Folders (other than the root) that hold a SKILL.md: installed agent skills. */
function skillFolders(files: string[]): string[] {
  return files
    .filter((file) => basename(file) === "SKILL.md" && dirname(file) !== ".")
    .map((file) => `${dirname(file)}/`);
}

function readGitHistory(root: string, depth: number): {
  commits: Map<string, number>;
  fixes: Map<string, number>;
  read: number;
  shallow: boolean;
} {
  const commits = new Map<string, number>();
  const fixes = new Map<string, number>();
  const prefix = git(root, ["rev-parse", "--show-prefix"])?.trim() ?? "";
  const shallow = git(root, ["rev-parse", "--is-shallow-repository"])?.trim() === "true";
  const log = git(root, ["log", "--no-merges", `-n${depth}`, "--format=%x1e%s", "--name-only", "--", "."]);
  if (log === null) return { commits, fixes, read: 0, shallow };

  let read = 0;
  for (const record of log.split("\x1e")) {
    const lines = record.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    read += 1;
    const isFix = FIX_SUBJECT.test(lines[0]!) || /^revert\b/i.test(lines[0]!);
    for (const topLevelPath of lines.slice(1)) {
      if (prefix && !topLevelPath.startsWith(prefix)) continue;
      const path = topLevelPath.slice(prefix.length);
      commits.set(path, (commits.get(path) ?? 0) + 1);
      if (isFix) fixes.set(path, (fixes.get(path) ?? 0) + 1);
    }
  }
  return { commits, fixes, read, shallow };
}

function scan(options: Options): ScanResult {
  const root = resolve(options.root);
  let rootStat;
  try {
    rootStat = statSync(root);
  } catch {
    throw new Error(`Not a directory: ${root}`);
  }
  if (!rootStat.isDirectory()) throw new Error(`Not a directory: ${root}`);

  const { files: candidates, source } = listCandidates(root, options.useGit);
  const skills = skillFolders(candidates);
  const skipped = { generated: 0, tests: 0, skill_folders: 0, too_large: 0, not_code: 0 };

  const counts = new Map<string, Map<Kind, number>>();
  const hits = new Map<Kind, Hit[]>();
  const kindCounts: Partial<Record<Kind, number>> = {};
  let scanned = 0;

  for (const rel of candidates.sort()) {
    if (scanned >= options.maxFiles) break;
    if (skills.some((folder) => rel.startsWith(folder))) {
      skipped.skill_folders += 1;
      continue;
    }
    if (inSkippedDir(rel) || !CODE_EXTENSIONS.has(extname(rel).toLowerCase())) {
      skipped.not_code += 1;
      continue;
    }
    if (GENERATED_PATH.test(rel)) {
      skipped.generated += 1;
      continue;
    }
    if (TEST_PATH.test(rel)) {
      skipped.tests += 1;
      continue;
    }

    const path = resolve(root, rel);
    let text: string;
    try {
      const stat = statSync(path);
      if (!stat.isFile()) continue;
      if (stat.size > options.maxBytes) {
        skipped.too_large += 1;
        continue;
      }
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    if (GENERATED_MARKER.test(text.slice(0, 600))) {
      skipped.generated += 1;
      continue;
    }
    scanned += 1;

    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]!;
      if (line.length > 2000) continue;
      for (const kind of KINDS) {
        if (!MATCHERS[kind](line)) continue;
        kindCounts[kind] = (kindCounts[kind] ?? 0) + 1;
        const perFile = counts.get(rel) ?? new Map<Kind, number>();
        perFile.set(kind, (perFile.get(kind) ?? 0) + 1);
        counts.set(rel, perFile);
        const bucket = hits.get(kind) ?? [];
        bucket.push({ path: rel, line: i + 1, excerpt: line.trim().replace(/\s+/g, " ").slice(0, 200) });
        hits.set(kind, bucket);
      }
    }
  }

  const history = options.useGit && source === "git"
    ? readGitHistory(root, options.gitDepth)
    : { commits: new Map<string, number>(), fixes: new Map<string, number>(), read: 0, shallow: false };

  const score = new Map<string, number>();
  for (const [path, perFile] of counts) {
    let total = 0;
    // A kind counts at most PER_KIND_CAP times per file, so one file repeating a word
    // cannot outrank a file with several different kinds of decision.
    for (const [kind, n] of perFile) total += KIND_INFO[kind].weight * Math.min(n, PER_KIND_CAP);
    total += Math.min(history.fixes.get(path) ?? 0, 10);
    score.set(path, total);
  }

  const topFiles: TopFile[] = [...score.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([path, total]) => ({
      path,
      score: total,
      kinds: Object.fromEntries([...(counts.get(path) ?? new Map())].sort()) as Partial<Record<Kind, number>>,
      fix_commits: history.fixes.get(path) ?? 0,
      commits: history.commits.get(path) ?? 0,
    }));

  // Examples per kind: strongest files first, so the capped list stays representative.
  const listed: Partial<Record<Kind, Hit[]>> = {};
  for (const kind of KINDS) {
    const bucket = hits.get(kind);
    if (!bucket) continue;
    listed[kind] = [...bucket]
      .sort((a, b) => (score.get(b.path) ?? 0) - (score.get(a.path) ?? 0) || a.path.localeCompare(b.path) || a.line - b.line)
      .slice(0, options.maxHitsPerKind);
  }

  const fixHotspots: FixHotspot[] = [...history.fixes.entries()]
    .filter(([path]) => CODE_EXTENSIONS.has(extname(path).toLowerCase()) && !GENERATED_PATH.test(path) && !TEST_PATH.test(path) && !inSkippedDir(path))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([path, fixes]) => ({ path, fix_commits: fixes, commits: history.commits.get(path) ?? 0 }));

  let gitNote: string | undefined;
  if (!options.useGit) gitNote = "git disabled with --no-git";
  else if (source !== "git") gitNote = "not a git work tree: no history read";
  else if (history.shallow) gitNote = "shallow clone: history is partial";

  return {
    root,
    file_source: source,
    files_scanned: scanned,
    skipped,
    git: { used: source === "git" && options.useGit, commits_read: history.read, shallow: history.shallow, ...(gitNote ? { note: gitNote } : {}) },
    kind_counts: kindCounts,
    top_files: topFiles,
    hits: listed,
    fix_hotspots: fixHotspots,
    note: "Leads only. Read each candidate in context, and look for decisions this scan cannot see (defaults, fixed orderings, people's manual work).",
  };
}

function renderMarkdown(data: ScanResult): string {
  const escape = (text: string) => text.replaceAll("|", "\\|");
  const lines = [
    "# Decision inventory signals",
    "",
    `Scanned **${data.files_scanned}** source files (list from ${data.file_source === "git" ? "`git ls-files`" : "a directory walk"}). ` +
      `Skipped: ${data.skipped.tests} test files (read them as evidence, not as candidates), ${data.skipped.generated} generated, ${data.skipped.skill_folders} in installed skill folders, ${data.skipped.too_large} too large.`,
    "",
    data.git.used
      ? `Git: read the last ${data.git.commits_read} commits${data.git.shallow ? " (shallow clone: history is partial)" : ""}.`
      : `Git: ${data.git.note ?? "not used"}.`,
    "",
    `> ${data.note}`,
    "",
    "## Top files",
    "",
    "| File | Score | Kinds | Fix commits | Commits |",
    "| --- | ---: | --- | ---: | ---: |",
  ];

  for (const item of data.top_files) {
    const kinds = Object.entries(item.kinds).map(([kind, n]) => `${kind} ${n}`).join(", ");
    lines.push(`| \`${escape(item.path)}\` | ${item.score} | ${kinds} | ${item.fix_commits} | ${item.commits} |`);
  }

  lines.push("", "## Kind counts", "");
  for (const kind of KINDS) {
    const n = data.kind_counts[kind];
    if (n) lines.push(`- **${kind}** (${KIND_INFO[kind].label}): ${n}`);
  }

  for (const kind of KINDS) {
    const items = data.hits[kind];
    if (!items?.length) continue;
    lines.push("", `## ${kind}`, "", `${KIND_INFO[kind].label}.`, "");
    for (const item of items) lines.push(`- \`${escape(item.path)}:${item.line}\` - ${escape(item.excerpt)}`);
  }

  if (data.fix_hotspots.length > 0) {
    lines.push("", "## Fix hotspots", "", "Source files most touched by commits whose subject mentions a fix, bug, revert or regression.", "",
      "| File | Fix commits | Commits |", "| --- | ---: | ---: |");
    for (const item of data.fix_hotspots) lines.push(`| \`${escape(item.path)}\` | ${item.fix_commits} | ${item.commits} |`);
  }

  return `${lines.join("\n")}\n`;
}

function main(): void {
  try {
    const options = parseArgs(process.argv.slice(2));
    const data = scan(options);
    process.stdout.write(options.format === "json" ? `${JSON.stringify(data, null, 2)}\n` : renderMarkdown(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`repo_signals: ${message}\n`);
    process.stderr.write("Use --help for usage.\n");
    process.exitCode = 2;
  }
}

main();
