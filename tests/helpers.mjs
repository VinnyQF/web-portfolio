import { readFile } from 'node:fs/promises';

export const pages = [
  { route: '/', file: 'index.html', lang: 'en', alternate: '/pt-br/', active: '/', heading: 'Projects' },
  { route: '/about/', file: 'about/index.html', lang: 'en', alternate: '/pt-br/sobre', active: '/about', heading: 'Technologies' },
  { route: '/pt-br/', file: 'pt-br/index.html', lang: 'pt-BR', alternate: '/', active: '/pt-br/', heading: 'Projetos' },
  { route: '/pt-br/sobre/', file: 'pt-br/sobre/index.html', lang: 'pt-BR', alternate: '/about', active: '/pt-br/sobre', heading: 'Tecnologias' },
];

export function readPage(page) {
  return readFile(new URL(`../dist/${page.file}`, import.meta.url), 'utf8');
}

// These helpers inspect Astro's generated HTML; they are not a general DOM parser.
export function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

export function tagWithClass(html, tag, className) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))]
    .map(([value]) => value)
    .find(value => attribute(value, 'class')?.split(/\s+/).includes(className));
}
