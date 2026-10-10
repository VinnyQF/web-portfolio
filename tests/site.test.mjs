import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { pages, readPage, attribute, tagWithClass } from './helpers.mjs';

for (const page of pages) {
  test(`${page.route}: page styles are embedded in the head`, async () => {
    const html = await readPage(page);
    const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
    assert.ok(head);
    const styles = [...head.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
      .map(([, css]) => css).join('\n');
    assert.match(styles, /\.site-header\b/);
    assert.match(styles, /--color-background\s*:/);
    const externalStyles = [...html.matchAll(/<link\b[^>]*>/g)]
      .filter(([tag]) => attribute(tag, 'rel') === 'stylesheet');
    assert.equal(externalStyles.length, 0, 'Page styles should not require another request');
  });

  test(`${page.route}: locale, metadata, navigation and language switch`, async () => {
    const html = await readPage(page);
    assert.equal(attribute(html.match(/<html\b[^>]*>/)[0], 'lang'), page.lang);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
    assert.ok(html.includes(page.heading));
    const navigation = html.match(/<nav\b[^>]*class="primary-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
    const current = [...navigation.matchAll(/<a\b[^>]*>/g)]
      .map(([tag]) => tag).filter(tag => attribute(tag, 'aria-current') === 'page');
    assert.equal(current.length, 1);
    assert.equal(attribute(current[0], 'href'), page.active);
    const languageSwitch = tagWithClass(html, 'a', 'language-switch');
    assert.equal(attribute(languageSwitch, 'href'), page.alternate);
    assert.ok(attribute(languageSwitch, 'aria-label'));
  });

  test(`${page.route}: local links and assets resolve in the static build`, async () => {
    const html = await readPage(page);
    const urls = new Set([...html.matchAll(/\b(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)]
      .map(([, url]) => url));
    assert.ok(urls.size > 0);
    for (const url of urls) {
      const filename = /\.[a-z0-9]+$/i.test(url) ? url : `${url.replace(/\/$/, '')}/index.html`;
      await assert.doesNotReject(access(new URL(`../dist${filename}`, import.meta.url)), `Missing: ${url}`);
    }
    assert.doesNotMatch(html, /<astro-island\b/);
    assert.doesNotMatch(html, /<script\b[^>]*src="https?:/);
  });
}

test('Both home pages show the same repositories and valid language distributions', async () => {
  const homePages = [pages[0], pages[2]];
  const links = [];
  for (const page of homePages) {
    const html = await readPage(page);
    links.push([...html.matchAll(/<a\b[^>]*class="repo-card__title-link"[^>]*>/g)]
      .map(([tag]) => attribute(tag, 'href')));
    assert.ok(links.at(-1).length > 0);
    const legends = [...html.matchAll(/<ul\b[^>]*class="language-legend"[^>]*>([\s\S]*?)<\/ul>/g)];
    assert.equal(legends.length, links.at(-1).length);
    for (const [, legend] of legends) {
      const percentages = [...legend.matchAll(/(\d+[.,]\d)%/g)].map(([, value]) => Number(value.replace(',', '.')));
      assert.ok(percentages.length > 0 && percentages.length <= 5);
      assert.ok(percentages.every(value => value >= 0 && value <= 100));
      assert.ok(Math.abs(percentages.reduce((sum, value) => sum + value, 0) - 100) <= 0.3);
    }
  }
  assert.deepEqual(links[0], links[1]);
});
