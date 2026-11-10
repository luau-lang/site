import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, "templates");
const cache = new Map<string, HandlebarsTemplateDelegate>();

export function renderTemplate(
  name: string,
  data: Record<string, unknown>,
): string {
  if (!cache.has(name)) {
    const templatePath = path.join(TEMPLATES_DIR, name);
    const raw = fs.readFileSync(templatePath, "utf-8");
    cache.set(name, Handlebars.compile(raw, { noEscape: true }));
  }
  return cache.get(name)!(data).trim() + "\n";
}
