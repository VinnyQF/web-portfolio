import { defineConfig } from "astro/config";

export default defineConfig({
  build: {
    inlineStylesheets: "always",
  },
  i18n: {
    locales: ["en", "pt-br"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
