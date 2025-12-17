/**
 * Shared utilities for Luau playground embeds
 */
import LZString from 'lz-string';

export const PLAYGROUND_URL = 'https://play.luau.org';

export interface ShareState {
  files: Record<string, string>;
  active: string;
  v: number;
}

/**
 * Encode files to URL-safe format (same as main playground)
 */
export function encodeFiles(files: Record<string, string>, activeFile: string): string {
  const state: ShareState = {
    files,
    active: activeFile,
    v: 1,
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(state));
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
export function calculateHeight(files: Record<string, string>): string {
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
 * Build the full iframe src URL for a playground embed
 */
export function buildPlaygroundUrl(
  files: Record<string, string>,
  options: { theme?: 'light' | 'dark' | 'auto'; baseUrl?: string } = {}
): string {
  const { theme = 'auto', baseUrl = PLAYGROUND_URL } = options;
  const activeFile = Object.keys(files)[0] || 'main.luau';
  const encoded = encodeFiles(files, activeFile);
  return `${baseUrl}/?embed=true&theme=${theme}#code=${encoded}`;
}

