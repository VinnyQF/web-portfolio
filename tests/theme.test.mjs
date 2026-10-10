import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { pages, readPage, attribute } from './helpers.mjs';

async function startTheme(page, { saved = null, light = false, storageFails = false } = {}) {
  const html = await readPage(page);
  const script = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)[1];
  const tag = html.match(/<button\b[^>]*id="theme-toggle"[^>]*>/)[0];
  const root = { dataset: {} };
  const listeners = {};
  const button = {
    dataset: { lightLabel: attribute(tag, 'data-light-label'), darkLabel: attribute(tag, 'data-dark-label') },
    hidden: true,
    setAttribute(name, value) { this[name] = value; },
    addEventListener(name, handler) { listeners[name] = handler; },
  };
  let systemChange;
  let stored = saved;
  runInNewContext(script, {
    document: {
      documentElement: root,
      getElementById: () => button,
      addEventListener(name, handler) { listeners[name] = handler; },
    },
    window: { matchMedia: () => ({ matches: light, addEventListener(name, handler) { systemChange = handler; } }) },
    localStorage: {
      getItem() { if (storageFails) throw new Error('Storage unavailable'); return stored; },
      setItem(key, value) { if (storageFails) throw new Error('Storage unavailable'); stored = value; },
    },
  });
  listeners.DOMContentLoaded();
  return { root, button, click: () => listeners.click(), system: matches => systemChange({ matches }), stored: () => stored };
}

for (const page of [pages[0], pages[2]]) {
  test(`${page.lang}: theme toggle persists preference and updates its accessible label`, async () => {
    const theme = await startTheme(page, { saved: 'dark', light: true });
    assert.equal(theme.root.dataset.theme, 'dark');
    assert.equal(theme.button.hidden, false);
    assert.equal(theme.button['aria-label'], theme.button.dataset.lightLabel);
    theme.click();
    assert.equal(theme.root.dataset.theme, 'light');
    assert.equal(theme.stored(), 'light');
    assert.equal(theme.button['aria-label'], theme.button.dataset.darkLabel);
    theme.system(false);
    assert.equal(theme.root.dataset.theme, 'light');
    const nextPage = await startTheme(page, { saved: theme.stored() });
    assert.equal(nextPage.root.dataset.theme, 'light');
  });
}

test('Invalid preference follows system changes until the user chooses a theme', async () => {
  const theme = await startTheme(pages[0], { saved: 'invalid', light: true });
  assert.equal(theme.root.dataset.theme, 'light');
  theme.system(false);
  assert.equal(theme.root.dataset.theme, 'dark');
  theme.click();
  theme.system(false);
  assert.equal(theme.root.dataset.theme, 'light');
});

test('Theme toggle works when browser storage is unavailable', async () => {
  const theme = await startTheme(pages[0], { storageFails: true });
  assert.equal(theme.root.dataset.theme, 'dark');
  assert.doesNotThrow(() => theme.click());
  assert.equal(theme.root.dataset.theme, 'light');
});
