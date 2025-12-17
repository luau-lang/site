// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightBlog from 'starlight-blog';

// https://astro.build/config
export default defineConfig({
  redirects: {},

  integrations: [
    starlight({
	//   plugins: [starlightBlog()],
      title: "Luau",
      logo: {
        src: "./src/assets/images/luau-logo.svg",
      },
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
});
