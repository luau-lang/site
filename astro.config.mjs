// @ts-check

import path from "node:path";

import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import tailwindcss from "@tailwindcss/vite";
import remarkLuauPlayground from "./src/plugins/remark-luau-playground";

// https://astro.build/config
export default defineConfig({
  site: 'https://luau.org',

  redirects: {},

  markdown: {
    remarkPlugins: [remarkLuauPlayground],
  },

  integrations: [
    {
      name: "luau-playground",
      hooks: {
        'astro:config:setup': function({ addWatchFile }) {
          const remarkPlugin = path.resolve("src", "plugins", "remark-luau-playground.ts");
          addWatchFile(remarkPlugin);
        }
      }
    },
    starlight({
      title: "Luau",
      favicon: "/favicon.svg",
      head: [
        { tag: "link", attrs: { rel: "alternate", type: "application/rss+xml", title: "Luau News", href: "https://luau.org/feed.xml" }}
      ],
      logo: {
        src: "./src/assets/images/luau-logo.svg",
        alt: "The official logo of the Luau programming language, a white square embedded in a blue square on a 15 degree tilt with the word Luau printed on it."
      },
      customCss: [
        // Path to your Tailwind base styles:
        './src/styles/global.css',
        './src/fonts/font-face.css'
      ],
      components: {
        Header: "./src/components/Header.astro",
        PageFrame: "./src/components/PageFrame.astro",
        ContentPanel: "./src/components/ContentPanel.astro",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/luau-lang/luau",
        },
        {
          icon: "rss",
          label: "RSS Feed",
          href: "./feed.xml",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
        {
          label: "Advanced Users",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Type System",
          autogenerate: { directory: "types" },
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
