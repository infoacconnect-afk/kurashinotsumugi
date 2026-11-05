import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const common = readFileSync('assets/common.js', 'utf8');
test('empty, invalid and FAQ anchors preserve safe navigation and FAQ opening', async () => {
  for (const hash of ['', '#missing', '#%broken', '#answer']) {
    const dom = new JSDOM('<div class="faq-group" data-cat="home"><div id="answer" class="faq-item"><div class="faq-q">Question</div><div class="faq-a">Answer</div></div></div>', {url:'https://example.test/'+hash, runScripts:'outside-only'});
    const w = dom.window, errors = [];
    w.addEventListener('error', e => errors.push(e.error));
    w.IntersectionObserver = class { observe() {} unobserve() {} };
    w.requestAnimationFrame = fn => fn();
    w.HTMLElement.prototype.scrollIntoView = function () {};
    w.eval(common.slice(0, common.indexOf('/* v7:')));
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    await Promise.resolve();
    assert.equal(errors.length, 0, hash);
    assert.equal(w.document.querySelector('.faq-item').classList.contains('open'), hash === '#answer');
    dom.window.close();
  }
});
test('new CMS thumbnails use WebP without cropping; reviewed/local/unsupported images retain their path', () => {
  const dom = new JSDOM('', {runScripts:'outside-only'});
  const begin = common.indexOf('/* Production: reuse reviewed image bytes');
  dom.window.eval(common.slice(begin, common.indexOf('/* Desktop mouse only', begin)));
  const image = dom.window.KurashiArticleImage;
  const source = 'https://images.microcms-assets.io/assets/new/photo.png';
  const optimized = new URL(image(source, 800));
  assert.equal(optimized.pathname, new URL(source).pathname);
  assert.equal(optimized.searchParams.get('w'), '800');
  assert.equal(optimized.searchParams.get('fm'), 'webp');
  assert.equal(optimized.searchParams.has('h'), false);
  assert.equal(optimized.searchParams.has('fit'), false);
  for (const path of ['assets/local.webp', 'https://other.example/photo.png', 'https://images.microcms-assets.io/a.svg', 'https://images.microcms-assets.io/a.gif']) assert.equal(image(path,800),path);
  dom.window.close();
});
