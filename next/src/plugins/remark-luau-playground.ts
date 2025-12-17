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
import LZString from 'lz-string';

const PLAYGROUND_URL = 'https://play.luau.org';

interface ShareState {
  files: Record<string, string>;
  active: string;
  v: number;
}

interface PluginOptions {
  /** Theme: "light" | "dark" | "auto" (default: "auto") */
  theme?: 'light' | 'dark' | 'auto';
  /** Override the playground URL */
  baseUrl?: string;
}

/**
 * Calculate iframe height based on number of lines in the active file
 * 
 * Layout breakdown:
 * - 44px: top bar
 * - 12px: top padding
 * - 19.6px per line (14px font * 1.4 line height)
 * - 12px: bottom padding
 * - 2px: fudge factor for sub-pixel rounding
 */
function calculateHeight(files: Record<string, string>): string {
  const activeFile = Object.keys(files)[0] || 'main.luau';
  const content = files[activeFile] || '';
  const lineCount = content.split('\n').length;
  
  const topBar = 44;
  const verticalPadding = 12 * 2; // top + bottom
  const lineHeight = 19.6;
  const fudge = 2;
  
  const height = topBar + verticalPadding + (lineCount * lineHeight) + fudge;
  return `${Math.ceil(height)}px`;
}

/**
 * Encode files to URL-safe format (same as main playground)
 */
function encodeFiles(files: Record<string, string>, activeFile: string): string {
  const state: ShareState = {
    files,
    active: activeFile,
    v: 1,
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(state));
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

/**
 * Generate iframe HTML for the playground embed
 */
function generateIframeHtml(
  files: Record<string, string>,
  options: Required<PluginOptions>
): string {
  const activeFile = Object.keys(files)[0] || 'main.luau';
  const encoded = encodeFiles(files, activeFile);
  const src = `${options.baseUrl}/?embed=true&theme=${options.theme}#code=${encoded}`;
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
  const opts: Required<PluginOptions> = {
    theme: options.theme ?? 'auto',
    baseUrl: options.baseUrl ?? PLAYGROUND_URL,
  };

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
export { remarkLuauPlayground, parseFiles, encodeFiles };

