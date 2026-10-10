import test from 'node:test';
import assert from 'node:assert/strict';
import { pages, attribute } from './helpers.mjs';

const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4321');
function request(path, options = {}) {
  return fetch(new URL(path, base), { signal: AbortSignal.timeout(5000), ...options });
}

for (const page of pages) {
  test(`${page.route}: Nginx serves localized HTML with revalidation and security headers`, async () => {
    const response = await request(page.route);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.ok((await response.text()).includes(`lang="${page.lang}"`));
  });
}

for (const route of ['/about', '/pt-br', '/pt-br/sobre']) {
  test(`${route}: redirect preserves the external origin and port`, async () => {
    const response = await request(route, { redirect: 'manual' });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), `${route}/`);
    const followed = await request(route);
    assert.equal(followed.status, 200);
    assert.equal(new URL(followed.url).origin, base.origin);
  });
}

test('Health check and missing routes return the appropriate status', async () => {
  const health = await request('/healthz');
  assert.equal(health.status, 200);
  assert.equal((await health.text()).trim(), 'ok');
  assert.equal((await request('/not-a-real-page')).status, 404);
  assert.equal((await request('/_astro/not-a-real-asset.css')).status, 404);
});

test('Generated favicon has immutable caching and supports conditional requests', async () => {
  const html = await (await request('/')).text();
  const icon = html.match(/<link\b[^>]*rel="icon"[^>]*>/)?.[0];
  assert.ok(icon, 'A favicon must be linked');
  const asset = attribute(icon, 'href');
  assert.ok(asset?.startsWith('/_astro/'), 'The favicon must be a generated asset');
  const response = await request(asset);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /immutable/);
  assert.match(response.headers.get('cache-control'), /max-age=31536000/);
  const etag = response.headers.get('etag');
  assert.ok(etag);
  const conditional = await request(asset, { headers: { 'If-None-Match': etag } });
  assert.equal(conditional.status, 304);
});
