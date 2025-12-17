/**
 * Remark plugin that transforms luau/lua code blocks into interactive playground embeds
 *
 * Supports multi-file definitions using the --!file directive:
 *
 * ```luau
 * --!file main.luau
 * local helper = require("./helper")
 * print(helper.greet("World"))
 *
 * --!file helper.luau
 * local M = {}
 * function M.greet(name: string): string
 *     return "Hello, " .. name
 * end
 * return M
 * ```
 */

import type { Root, Code } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { PLAYGROUND_URL, buildPlaygroundUrl, calculateHeight } from '../lib/luau-playground';

interface PluginOptions {
  /** Theme: "light" | "dark" | "auto" (default: "auto") */
  theme?: 'light' | 'dark' | 'auto';
  /** Override the playground URL */
  baseUrl?: string;
  /** Type solver to use */
  solver?: 'old' | 'new';
  /** Typechecking mode */
  mode?: 'nocheck' | 'nonstrict' | 'strict';
}

/**
 * Parse code content for multi-file definitions using --!file directive
 */
function parseFiles(code: string): Record<string, string> {
  const files: Record<string, string> = {};
  const lines = code.split('\n');

  let currentFile = 'main.luau';
  let currentContent: string[] = [];
  let hasFileDirective = false;

  for (const line of lines) {
    if (line.startsWith("--!hidden"))
      continue;

    const match = line.match(/^--!file\s+(.+)$/);
    if (match) {
      // Save previous file content if any
      if (hasFileDirective && currentContent.length > 0) {
        files[currentFile] = currentContent.join('\n').trim();
      }
      currentFile = match[1].trim();
      currentContent = [];
      hasFileDirective = true;
    } else {
      currentContent.push(line);
    }
  }

  // Save the last file's content
  const content = currentContent.join('\n').trim();
  if (hasFileDirective) {
    files[currentFile] = content;
  } else {
    // No --!file directives, treat entire content as main.luau
    files['main.luau'] = code.trim();
  }

  return files;
}

function parseHidden(code: string): ['old' | 'new' | null, 'nocheck' | 'nonstrict' | 'strict' | null] {
  console.log("HERE WE ARE")
  const lines = code.split('\n');

  let mode = null;
  let solver = null;

  for (const line of lines) {
    if (!solver) {
      const match = line.match(/^--!hidden solver=(new|old)$/);
      if (match) {
        solver = match[1].trim();
      }
    }

    if (!mode) {
      const match = line.match(/^--!hidden mode=(nocheck|nonstrict|strict)$/);
      if (match) {
        mode = match[1].trim();
      }
    }
  }

  // people claim TypeScript is better at this, but it also falls flat on its face with singletons :)
  return [solver as any, mode as any]
}


/**
 * Generate iframe HTML for the playground embed
 */
function generateIframeHtml(
  files: Record<string, string>,
  options: Required<PluginOptions>
): string {
  const src = buildPlaygroundUrl(files, options);
  const height = calculateHeight(files);

  return `<iframe
  src="${src}"
  style="width: 100%; height: ${height}; border: 1px solid var(--sl-color-gray-5);"
  loading="lazy"
  allowfullscreen
  allow="clipboard-write"
  title="Luau Playground"
></iframe>`;
}

/**
 * Remark plugin to transform luau/lua code blocks into playground embeds
 */
const remarkLuauPlayground: Plugin<[PluginOptions?], Root> = (options = {}) => {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      // Only process lua and luau code blocks
      if (!node.lang || !['lua', 'luau'].includes(node.lang)) {
        return;
      }

      if (index === undefined || !parent) {
        return;
      }

      // Parse the code for multi-file definitions
      const files = parseFiles(node.value);

      const [solver, mode] = parseHidden(node.value);

      const opts: Required<PluginOptions> = {
        theme: options.theme ?? 'auto',
        baseUrl: options.baseUrl ?? PLAYGROUND_URL,
        solver: solver ?? 'new',
        mode: mode ?? 'strict',
      };

      // Generate the iframe HTML
      const html = generateIframeHtml(files, opts);

      // Replace the code node with an HTML node
      (parent.children as any[])[index] = {
        type: 'html',
        value: html,
      };
    });
  };
};

export default remarkLuauPlayground;
export { remarkLuauPlayground, parseFiles };
