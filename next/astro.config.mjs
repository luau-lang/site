// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  redirects: {},

  integrations: [
    starlight({
      title: "Luau",
      favicon: "./src/assets/images/luau-logo.svg",
      logo: {
        src: "./src/assets/images/luau-logo.svg",
        alt: "The official logo of the Luau programming language, a white square embedded in a blue square on a 15 degree tilt with the word Luau printed on it."
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
