import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
const parser = new MarkdownIt();

export async function GET(context) {
  const news = await getCollection('news');
  const sorted = news.sort((a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf()).reverse();

  return rss({
    // `<title>` field in output xml
    title: 'Luau News',
    // `<description>` field in output xml
    description: 'A small, fast, and embeddable programming language based on Lua with a gradual type system.',
    site: "https://luau.org",
    // (optional) inject custom xml
    customData: `<language>en-us</language>`,
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/news/${post.id}`,
      content: sanitizeHtml(parser.render(post.body), { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img'])})
    })),
  });
}

// LU-wow
