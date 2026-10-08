export type Locale = "en" | "pt-br";

export const ui = {
  en: {
    home: "Home",
    about: "About",
    navigation: "Primary navigation",
    switchLanguage: "Mudar para português",
    source: "Source code",
    privacy: "No analytics or tracking scripts.",
    lightMode: "Switch to light mode",
    darkMode: "Switch to dark mode",
    stars: "GitHub stars",
    contributions: "Merged pull requests",
    distribution: "Repository language distribution",
    other: "Other",
  },
  "pt-br": {
    home: "Início",
    about: "Sobre",
    navigation: "Navegação principal",
    switchLanguage: "Switch to English",
    source: "Código-fonte",
    privacy: "Sem scripts de análise ou rastreamento.",
    lightMode: "Ativar tema claro",
    darkMode: "Ativar tema escuro",
    stars: "estrelas no GitHub",
    contributions: "Pull requests incorporados",
    distribution: "Distribuição das linguagens do repositório",
    other: "Outras",
  },
} satisfies Record<Locale, Record<string, string>>;
