import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import matter from "gray-matter";
import { renderTemplate } from "./templateRenderer.js";

interface Config {
  contentDir: string;
  outputDir: string;
  baseUrl: string;
}

interface Section {
  dir: string;
  title: string;
}

const SECTIONS: Section[] = [
  { dir: "getting-started", title: "Getting Started" },
  { dir: "guides", title: "Advanced Users" },
  { dir: "types", title: "Type System" },
  { dir: "reference", title: "Reference" },
];

interface DocFile {
  relativePath: string;
  section: string;
  sectionTitle: string;
  title: string;
  description?: string;
  order: number;
  body: string;
  slug: string;
}

function loadConfig(): Config {
  const actionDir = path.dirname(new URL(import.meta.url).pathname);
  // actionDir is .github/actions/generate-llm-content/src — repo root is 4 levels up
  const repoRoot = path.resolve(actionDir, "../../../..");

  const outputDir = process.env.OUTPUT_DIR
    ? path.resolve(repoRoot, process.env.OUTPUT_DIR)
    : path.join(repoRoot, "public");

  const baseUrl = (process.env.BASE_URL || "https://luau.org").replace(
    /\/$/,
    "",
  );

  const contentDir = path.join(repoRoot, "src", "content", "docs");

  return { contentDir, outputDir, baseUrl };
}

function discoverFiles(contentDir: string): string[] {
  return glob.sync("**/*.md", { cwd: contentDir });
}

function parseFile(relativePath: string, contentDir: string): DocFile | null {
  const fullPath = path.join(contentDir, relativePath);
  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);

  const dir = relativePath.split("/")[0];
  const section = SECTIONS.find((s) => s.dir === dir);
  if (!section) return null;

  const slug = data.slug || relativePath.replace(/\.md$/, "");

  return {
    relativePath,
    section: section.dir,
    sectionTitle: section.title,
    title: data.title || slug,
    description: data.description,
    order: data.sidebar?.order ?? 999,
    body: content.trim(),
    slug,
  };
}

function groupAndSort(docs: DocFile[]): Map<string, DocFile[]> {
  const groups = new Map<string, DocFile[]>();

  for (const section of SECTIONS) {
    groups.set(section.title, []);
  }

  for (const doc of docs) {
    const group = groups.get(doc.sectionTitle);
    if (group) group.push(doc);
  }

  for (const [, files] of groups) {
    files.sort((a, b) => a.order - b.order);
  }

  return groups;
}

function generateLlmsTxt(
  groups: Map<string, DocFile[]>,
  config: Config,
): string {
  const sections = [];
  for (const [title, docs] of groups) {
    if (docs.length === 0) continue;
    sections.push({
      title,
      entries: docs.map((doc) => ({
        title: doc.title,
        url: `${config.baseUrl}/${doc.slug}/index.md`,
        description: doc.description,
      })),
    });
  }

  return renderTemplate("llms.txt.hbs", { baseUrl: config.baseUrl, sections });
}

function generateLlmsFullTxt(
  groups: Map<string, DocFile[]>,
  config: Config,
): string {
  const documents = [];
  for (const [, docs] of groups) {
    for (const doc of docs) {
      documents.push({
        url: `${config.baseUrl}/${doc.slug}/index.md`,
        escapedTitle: doc.title.replace(/"/g, "&quot;"),
        markdown: doc.body,
      });
    }
  }

  return renderTemplate("llms-full.txt.hbs", { documents });
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeRawMdFiles(docs: DocFile[], config: Config): void {
  for (const doc of docs) {
    const rawPath = path.join(config.contentDir, doc.relativePath);
    const raw = fs.readFileSync(rawPath, "utf-8");
    const outPath = path.join(config.outputDir, doc.slug, "index.md");
    ensureDir(outPath);
    fs.writeFileSync(outPath, raw, "utf-8");
  }
}

function writeCleanMdFiles(docs: DocFile[], config: Config): void {
  for (const doc of docs) {
    const outPath = path.join(config.outputDir, "llm", `${doc.slug}.md`);
    ensureDir(outPath);

    const siteUrl = `${config.baseUrl}/${doc.slug}`;
    const lines = [
      "---",
      `title: "${doc.title.replace(/"/g, '\\"')}"`,
      `url: ${siteUrl}`,
    ];
    if (doc.description) {
      lines.push(`description: "${doc.description.replace(/"/g, '\\"')}"`);
    }
    lines.push("---", "", "");

    fs.writeFileSync(outPath, lines.join("\n") + doc.body + "\n", "utf-8");
  }
}

function generateRobotsTxt(config: Config): string {
  return renderTemplate("robots.txt.hbs", { baseUrl: config.baseUrl });
}

function generateSitemapXml(docs: DocFile[], config: Config): string {
  const today = new Date().toISOString().split("T")[0];
  const urls = docs.map((doc) => ({
    loc: `${config.baseUrl}/${doc.slug}`,
    lastmod: today,
  }));
  return renderTemplate("sitemap.xml.hbs", { urls });
}

function main() {
  const config = loadConfig();

  console.log("=== Luau LLM Content Generator ===");
  console.log(`Content dir: ${config.contentDir}`);
  console.log(`Output dir: ${config.outputDir}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log("");

  // 1. Discover
  const files = discoverFiles(config.contentDir);
  console.log(`Discovered ${files.length} markdown files`);

  // 2. Parse
  const docs: DocFile[] = [];
  for (const file of files) {
    const parsed = parseFile(file, config.contentDir);
    if (parsed) docs.push(parsed);
  }
  console.log(`Parsed ${docs.length} documentation files`);

  // 3. Group and sort
  const groups = groupAndSort(docs);

  // 4. Write llms.txt
  const llmsTxt = generateLlmsTxt(groups, config);
  const llmsTxtPath = path.join(config.outputDir, "llms.txt");
  ensureDir(llmsTxtPath);
  fs.writeFileSync(llmsTxtPath, llmsTxt, "utf-8");
  console.log(
    `Written: llms.txt (${(Buffer.byteLength(llmsTxt) / 1024).toFixed(1)} KB)`,
  );

  // 5. Write llms-full.txt
  const llmsFullTxt = generateLlmsFullTxt(groups, config);
  const llmsFullTxtPath = path.join(config.outputDir, "llms-full.txt");
  fs.writeFileSync(llmsFullTxtPath, llmsFullTxt, "utf-8");
  console.log(
    `Written: llms-full.txt (${(Buffer.byteLength(llmsFullTxt) / 1024).toFixed(1)} KB)`,
  );

  // 6. Write individual .md files
  writeCleanMdFiles(docs, config);
  console.log(`Written: ${docs.length} files under llm/`);

  // 7. Write raw markdown files at /{slug}/index.md
  writeRawMdFiles(docs, config);
  console.log(`Written: ${docs.length} raw markdown files at {slug}/index.md`);

  // 8. Write robots.txt
  const robotsTxt = generateRobotsTxt(config);
  fs.writeFileSync(path.join(config.outputDir, "robots.txt"), robotsTxt, "utf-8");
  console.log("Written: robots.txt");

  // 9. Write sitemap.xml
  const sitemapXml = generateSitemapXml(docs, config);
  fs.writeFileSync(path.join(config.outputDir, "sitemap.xml"), sitemapXml, "utf-8");
  console.log(`Written: sitemap.xml (${docs.length} URLs)`);

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `file_count=${docs.length}\n`,
    );
  }

  console.log("");
  console.log("=== Done ===");
}

main();
