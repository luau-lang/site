import { defineCollection, z} from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

import { glob, type Loader, type LoaderContext } from 'astro/loaders';

export type StarlightCollection = 'docs' | 'i18n' | 'news';

/**
 * We still rely on the content collection folder structure to be fixed for now:
 *
 * - At build time, if the feature is enabled, we get all the last commit dates for each file in
 *   the docs folder ahead of time. In the current approach, we cannot know at this time the
 *   user-defined content folder path in the integration context as this would only be available
 *   from the loader. A potential solution could be to do that from a custom loader re-implementing
 *   the glob loader or built on top of it. Although, we don't have access to the Starlight
 *   configuration from the loader to even know we should do that.
 * - Remark plugins get passed down an absolute path to a content file and we need to figure out
 *   the language from that path. Without knowing the content folder path, we cannot reliably do
 *   so.
 *
 * Below are various functions to easily get paths to these collections and avoid having to
 * hardcode them throughout the codebase. When user-defined content folder locations are supported,
 * these helper functions should be updated to reflect that in one place.
 */

export function getCollectionUrl(collection: StarlightCollection, srcDir: URL) {
	return new URL(`content/${collection}/`, srcDir);
}

export function getCollectionPathFromRoot(
	collection: StarlightCollection,
	{ root, srcDir }: { root: URL | string; srcDir: URL | string }
) {
	return (
		(typeof srcDir === 'string' ? srcDir : srcDir.pathname).replace(
			typeof root === 'string' ? root : root.pathname,
			''
		) +
		'content/' +
		collection
	);
}


// https://github.com/withastro/astro/blob/main/packages/astro/src/core/constants.ts#L87
// https://github.com/withastro/astro/blob/main/packages/integrations/mdx/src/index.ts#L59
const docsExtensions = ['markdown', 'mdown', 'mkdn', 'mkd', 'mdwn', 'md', 'mdx'];
const i18nExtensions = ['json', 'yml', 'yaml'];

type GlobOptions = Parameters<typeof glob>[0];
type GenerateIdFunction = NonNullable<GlobOptions['generateId']>;

function newsLoader({
	generateId,
}: {
	/**
	 * Function that generates an ID for an entry. Default implementation generates a slug from the entry path.
	 * @returns The ID of the entry. Must be unique per collection.
	 **/
	generateId?: GenerateIdFunction;
} = {}): Loader {
	return {
		name: 'starlight-news-loader',
		load: createGlobLoadFn('news', generateId),
	};
}

function createGlobLoadFn(
	collection: StarlightCollection,
	generateId?: GenerateIdFunction
): Loader['load'] {
	return (context: LoaderContext) => {
		const extensions = collection === 'news' ? docsExtensions : i18nExtensions;

		if (
			collection === 'news' &&
			context.config.integrations.find(({ name }) => name === '@astrojs/markdoc')
		) {
			// https://github.com/withastro/astro/blob/main/packages/integrations/markdoc/src/content-entry-type.ts#L28
			extensions.push('mdoc');
		}

		const options: GlobOptions = {
			base: getCollectionPathFromRoot(collection, context.config),
			pattern: `**/[^_]*.{${extensions.join(',')}}`,
		};
		if (generateId) options.generateId = generateId;

		return glob(options).load(context);
	};
}

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	news: defineCollection({ loader: newsLoader(), schema: docsSchema({
  	extend: z.object({
    	date: z.date()
  	})
	}) }),
};
