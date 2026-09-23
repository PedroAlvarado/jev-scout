#!/usr/bin/env -S node --experimental-strip-types
/**
 * Scan a local repository for likely Jev decision-model opportunity signals.
 *
 * This is intentionally heuristic. It surfaces candidate files and lines for an
 * agent to inspect; it does not decide whether Jev is appropriate or estimate ROI.
 * It has no third-party dependencies and never sends repository data anywhere.
 *
 * Runtime options:
 *   bun repo_signals.ts --root . --format markdown
 *   node --experimental-strip-types repo_signals.ts --root . --format markdown
 *   npx --no-install tsx repo_signals.ts --root . --format markdown
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, relative, resolve, basename } from "node:path";
import process from "node:process";

type OutputFormat = "markdown" | "json";

type Hit = {
  path: string;
  line: number;
  excerpt: string;
};

type TopFile = {
  path: string;
  signal_score: number;
  categories: string[];
};

type ScanResult = {
  root: string;
  files_scanned: number;
  category_counts: Record<string, number>;
  top_files: TopFile[];
  hits: Record<string, Hit[]>;
  note: string;
};

type Options = {
  root: string;
  format: OutputFormat;
  maxFiles: number;
  maxBytes: number;
  maxHitsPerCategory: number;
};

const SKIP_DIRS = new Set([
  ".git", ".hg", ".svn", ".idea", ".vscode", ".next", ".nuxt", ".turbo",
  "node_modules", "vendor", "dist", "build", "coverage", "target", ".venv",
  "venv", "__pycache__", ".cache", ".pytest_cache", ".mypy_cache", "tmp", "temp",
]);

const TEXT_EXTENSIONS = new Set([
  ".py", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".go", ".rs", ".java",
  ".kt", ".kts", ".rb", ".php", ".swift", ".cs", ".scala", ".sh", ".bash",
  ".md", ".mdx", ".txt", ".json", ".jsonl", ".yaml", ".yml", ".toml", ".sql",
]);

const SPECIAL_FILENAMES = new Set([
  "dockerfile", "makefile", "procfile", "gemfile", "rakefile", "claude.md", "agents.md",
]);

const PATTERNS: Record<string, RegExp[]> = {
  llm_decision: [
    /\b(openai|anthropic|claude|bedrock|litellm|langchain|pydantic[_-]?ai|@ai-sdk|generateObject|generateText|chat\.completions|responses\.create)\b/i,
    /\b(response_format|json_schema|structured[_ ]?output|tool_choice|function_call)\b/i,
  ],
  routing_triage: [
    /\b(classif(?:y|ier|ication)|triage|intent|route|routing|category|categorize|dispatch|handler|queue|lane)\b/i,
  ],
  scoring_ranking: [
    /\b(score|scoring|rank|ranking|priority|prioritize|severity|relevance|confidence|quality)\b/i,
  ],
  retrieval_context: [
    /\b(retriev(?:e|al)|rerank|embedding|vector|semantic search|memory|memories|context[_ -]?window|top[_-]?k|similarity)\b/i,
  ],
  verification_guard: [
    /\b(verify|verification|validate|validator|moderation|guardrail|policy check|supported|hallucination|review|human[_ -]?review|escalat(?:e|ion))\b/i,
  ],
  agent_action_loop: [
    /\b(next[_ -]?action|choose[_ -]?action|tool[_ -]?routing|tool[_ -]?selection|retry|reobserve|planner|agent loop|computer use|browser use)\b/i,
  ],
  semantic_heuristic: [
    /\b(keywords?|regex|regexp|contains|includes|startsWith|endsWith|match\(|re\.search|re\.match)\b/i,
    /\b(spam|urgent|fraud|risk|sentiment|toxicity|intent|relevance|priority|severity|refund)\b/i,
  ],
  high_volume_surface: [
    /\b(ticket|tickets|message|messages|inbox|email|emails|log|logs|event|events|alert|alerts|lead|leads|job|jobs|record|records|batch|queue|stream)\b/i,
  ],
  fallback_uncertainty: [
    /\b(fallback|unknown|uncertain|low[_ -]?confidence|human[_ -]?review|manual[_ -]?review|retry|timeout|rate[_ -]?limit)\b/i,
  ],
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
    maxFiles: 4000,
    maxBytes: 1_000_000,
    maxHitsPerCategory: 120,
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
      case "--max-hits-per-category":
        options.maxHitsPerCategory = parseInteger(argv[++i], "--max-hits-per-category");
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
  process.stdout.write(`Find repo signals for potential Jev decision-model opportunities.\n\n` +
    `Usage: repo_signals.ts [options]\n\n` +
    `Options:\n` +
    `  --root <path>                     Repository root (default: .)\n` +
    `  --format <markdown|json>          Output format (default: markdown)\n` +
    `  --max-files <n>                   Maximum text-like files to scan (default: 4000)\n` +
    `  --max-bytes <n>                   Skip files larger than this (default: 1000000)\n` +
    `  --max-hits-per-category <n>       Cap stored hits per category (default: 120)\n`);
}

function isProbablyText(path: string): boolean {
  return TEXT_EXTENSIONS.has(extname(path).toLowerCase()) || SPECIAL_FILENAMES.has(basename(path).toLowerCase());
}

function listTextFiles(root: string, maxFiles: number, maxBytes: number): string[] {
  const files: string[] = [];
  const stack = [root];

  while (stack.length > 0 && files.length < maxFiles) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".git")) stack.push(path);
        continue;
      }
      if (!entry.isFile() || !isProbablyText(path)) continue;
      try {
        if (statSync(path).size <= maxBytes) files.push(path);
      } catch {
        // Ignore files that disappear or become unreadable during traversal.
      }
    }
  }

  return files;
}

function lineHits(line: string): string[] {
  const categories: string[] = [];
  for (const [category, regexes] of Object.entries(PATTERNS)) {
    if (category === "semantic_heuristic") {
      if (regexes[0]!.test(line) && regexes[1]!.test(line)) categories.push(category);
    } else if (regexes.some((regex) => regex.test(line))) {
      categories.push(category);
    }
  }
  return categories;
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

  const hits = new Map<string, Hit[]>();
  const files = listTextFiles(root, options.maxFiles, options.maxBytes);

  for (const path of files) {
    let text: string;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }

    const rel = relative(root, path) || basename(path);
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]!;
      const categories = lineHits(line);
      if (categories.length === 0) continue;
      const excerpt = line.trim().replace(/\s+/g, " ").slice(0, 240);
      for (const category of categories) {
        const bucket = hits.get(category) ?? [];
        if (bucket.length < options.maxHitsPerCategory) {
          bucket.push({ path: rel, line: i + 1, excerpt });
          hits.set(category, bucket);
        }
      }
    }
  }

  const fileScores = new Map<string, number>();
  const fileCategories = new Map<string, Set<string>>();
  const highWeight = new Set(["llm_decision", "semantic_heuristic", "routing_triage", "agent_action_loop"]);

  for (const [category, items] of hits.entries()) {
    const weight = highWeight.has(category) ? 2 : 1;
    for (const item of items) {
      fileScores.set(item.path, (fileScores.get(item.path) ?? 0) + weight);
      const categories = fileCategories.get(item.path) ?? new Set<string>();
      categories.add(category);
      fileCategories.set(item.path, categories);
    }
  }

  const topFiles: TopFile[] = [...fileScores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 25)
    .map(([path, score]) => ({
      path,
      signal_score: score,
      categories: [...(fileCategories.get(path) ?? new Set())].sort(),
    }));

  const sortedCategories = [...hits.keys()].sort();
  const sortedHits: Record<string, Hit[]> = {};
  const categoryCounts: Record<string, number> = {};
  for (const category of sortedCategories) {
    const items = hits.get(category) ?? [];
    sortedHits[category] = items;
    categoryCounts[category] = items.length;
  }

  return {
    root,
    files_scanned: files.length,
    category_counts: categoryCounts,
    top_files: topFiles,
    hits: sortedHits,
    note: "Heuristic lead generator only. Inspect candidate files in context before proposing Jev.",
  };
}

function renderMarkdown(data: ScanResult): string {
  const lines = [
    "# Repository decision signals",
    "",
    `Scanned **${data.files_scanned}** text-like files.`,
    "",
    "> Heuristic lead generator only. Inspect candidate files in context before proposing Jev.",
    "",
    "## Top candidate files",
    "",
    "| File | Signal score | Categories |",
    "| --- | ---: | --- |",
  ];

  for (const item of data.top_files) {
    lines.push(`| \`${item.path}\` | ${item.signal_score} | ${item.categories.join(", ")} |`);
  }

  lines.push("", "## Category counts", "");
  for (const [category, count] of Object.entries(data.category_counts)) {
    lines.push(`- **${category}:** ${count}`);
  }

  for (const [category, items] of Object.entries(data.hits)) {
    lines.push("", `## ${category}`, "");
    for (const item of items.slice(0, 30)) {
      const excerpt = item.excerpt.replaceAll("|", "\\|");
      lines.push(`- \`${item.path}:${item.line}\` - ${excerpt}`);
    }
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
