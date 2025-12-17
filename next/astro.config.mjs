// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightBlog from 'starlight-blog';

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  redirects: {},

  integrations: [
    starlight({
	//   plugins: [starlightBlog()],
      title: "Luau",
      favicon: "/favicon.svg",
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
        // Override the default `Header` component.
        Header: "./src/components/Header.astro",
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
