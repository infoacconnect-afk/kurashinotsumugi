import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { renderSeo, validateArticles } from '../build/render-seo.mjs';

const source = new URL('../', import.meta.url);
const article = { slug: 'sample_1', title: '実家の「これから」 & 暮らし', excerpt: '見守りの説明「全文」。',
  body: '<h2>確認すること</h2><p>確定済みの本文 &amp; 写真を変えません。</p><img src="assets/sample.webp" alt="写真">',
  category: 'akiya', publishedAt: '2026-10-22', updatedAt: '2026-10-25', author: 'くらしのつむぎ編集部' };

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tsumugi-seo-test-'));
  mkdirSync(join(root, 'assets')); mkdirSync(join(root, 'data'));
  for (const name of readdirSync(source)) if (name.endsWith('.html')) copyFileSync(new URL(name, source), join(root, name));
  for (const name of ['common.js', 'partials.js', 'article-loader.js', 'lab-render.js', 'lab-home.js']) {
    copyFileSync(new URL('assets/' + name, source), join(root, 'assets', name));
  }
  writeFileSync(join(root, 'data/articles.json'), JSON.stringify({ categories: [{ id: 'akiya', name: '空き家情報', color: 'green' }], articles: [article] }));
  return root;
}

test('published HTML contains article text without JS, preserves URLs and excludes control pages', async () => {
  const root = fixture();
  try {
    await renderSeo({ root, context: 'production' });
    const html = readFileSync(join(root, 'dist/lab-rendered/sample_1.html'), 'utf8');
    const dom = new JSDOM(html); // Scripts deliberately disabled: crawler-visible HTML.
    const d = dom.window.document;
    assert.equal(d.querySelector('[data-article="title"]').textContent, article.title);
    assert.equal(d.querySelector('[data-article="body"] p').textContent, '確定済みの本文 & 写真を変えません。');
    assert.equal(d.querySelector('meta[name="description"]').content, article.excerpt);
    assert.equal(d.querySelector('link[rel="canonical"]').getAttribute('href'), 'https://kurashinotsumugi.com/lab-article.html?id=sample_1');
    assert.equal(d.querySelector('base').getAttribute('href'), '/lab-article.html?id=sample_1');
    assert.equal(d.querySelectorAll('script[src="assets/analytics.js"]').length, 1);
    assert.equal(d.querySelectorAll('.site-header').length, 1);
    assert.equal(d.querySelector('meta[name="robots"]'), null);
    assert.equal(JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent).headline, article.title);
    assert.equal(d.querySelector('#toc a').getAttribute('href'), '#sec-1');
    dom.window.close();
    const sitemap = readFileSync(join(root, 'dist/sitemap.xml'), 'utf8');
    const xml = new JSDOM(sitemap, { contentType: 'application/xml' });
    const locations = [...xml.window.document.querySelectorAll('loc')].map(el => el.textContent);
    assert(locations.includes('https://kurashinotsumugi.com/lab-article.html?id=sample_1'));
    assert(!locations.some(u => /measurement-settings|google447|lab-rendered|%20/.test(u)));
    assert.equal(locations.length, new Set(locations).size);
    xml.window.close();
    assert.match(readFileSync(join(root, 'dist/_redirects'), 'utf8'), /\/lab-article\.html id=sample_1 \/lab-rendered\/sample_1\.html 200!/);
    assert.match(readFileSync(join(root, 'dist/_redirects'), 'utf8'), /id=:id \/404\.html 404!/);
    assert(!readFileSync(join(root, 'dist/_headers'), 'utf8').includes('noindex'));
    assert.match(readFileSync(join(root, 'dist/lab.html'), 'utf8'), /href="lab-article.html\?id=sample_1"/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('preview is noindex; rebuilding removes deleted articles and never publishes template placeholders', async () => {
  const root = fixture();
  try {
    await renderSeo({ root, context: 'deploy-preview' });
    assert.match(readFileSync(join(root, 'dist/_headers'), 'utf8'), /X-Robots-Tag: noindex/);
    assert.match(readFileSync(join(root, 'dist/robots.txt'), 'utf8'), /Disallow: \//);
    assert.match(readFileSync(join(root, 'dist/lab-rendered/sample_1.html'), 'utf8'), /content="noindex, nofollow"/);
    writeFileSync(join(root, 'data/articles.json'), JSON.stringify({ categories: [], articles: [] }));
    await renderSeo({ root, context: 'production' });
    assert(!existsSync(join(root, 'dist/lab-rendered/sample_1.html')));
    assert(!readFileSync(join(root, 'dist/sitemap.xml'), 'utf8').includes('sample_1'));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('unsafe paths, duplicate slugs and missing article bodies fail the build', () => {
  assert.throws(() => validateArticles([{ ...article, slug: '../outside' }]));
  assert.throws(() => validateArticles([article, article]));
  assert.throws(() => validateArticles([{ ...article, body: '' }]));
});

test('all source descriptions parse as one complete content attribute', () => {
  for (const filename of readdirSync(source).filter(f => f.endsWith('.html') && !f.startsWith('google'))) {
    const dom = new JSDOM(readFileSync(new URL(filename, source), 'utf8'));
    const meta = dom.window.document.querySelector('meta[name="description"]');
    if (meta) {
      assert.equal(meta.attributes.length, 2, filename);
      assert(meta.content.length > 10, filename);
    }
    dom.window.close();
  }
});
