import { defineConfig } from "astro/config";

export default defineConfig({
  i18n: {
    locales: ["en", "pt-br"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
