import type { Root, Code } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/**
 * Remark plugin to automatically set code blocks to highlight as Luau
 */
const remarkLuauCodeBlocks: Plugin<[], Root> = (options = {}) => {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code) => {
      if (!node.lang)
        node.lang = "luau";
    });
  };
};

export default remarkLuauCodeBlocks;
