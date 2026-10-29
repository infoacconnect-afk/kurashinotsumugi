import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

async function entrance() {
  // No resources or analytics execute; only the entrance script is evaluated.
  const dom = new JSDOM(html, { runScripts: 'outside-only' });
  const { window: w } = dom;
  const d = w.document;
  await new Promise(resolve => d.addEventListener('DOMContentLoaded', resolve, { once: true }));
  const fonts = deferred(), image = deferred(), reading = deferred();
  w.KurashiReading = { ready: reading.promise };
  Object.defineProperty(d, 'fonts', { value: { ready: fonts.promise } });
  for (const img of d.querySelectorAll('.site-header img, .hero img')) img.decode = () => image.promise;
  let deadline, duration, cleared = false;
  w.setTimeout = (fn, ms) => { deadline = fn; duration = ms; return 1; };
  w.clearTimeout = id => { assert.equal(id, 1); cleared = true; };
  const catchcopy = d.querySelector('#heroCatch').innerHTML;
  w.eval(d.querySelector('#home-entrance').textContent);
  const pending = () => d.documentElement.classList.contains('home-intro-pending');
  assert(pending(), 'hidden before DOM content becomes available');
  d.dispatchEvent(new w.Event('DOMContentLoaded'));
  return { dom, d, fonts, image, reading, pending, catchcopy, deadline, duration, cleared: () => cleared };
}

test('whole-page fade waits for fonts, first-view images and line breaking without rewriting the catchcopy', async () => {
  const e = await entrance();
  try {
    e.fonts.resolve(); await flush();
    assert(e.pending(), 'fonts alone must not reveal incomplete imagery');
    e.image.resolve(); await flush();
    assert(e.pending(), 'the initial line-breaking pass must settle before revealing');
    e.reading.resolve(); await flush();
    assert(!e.pending()); assert(e.cleared());
    assert.equal(e.d.querySelector('#heroCatch').innerHTML, e.catchcopy);
    assert.equal(e.d.querySelector('.home-opening'), null, 'no partial-page animation wrapper');
    const css = e.d.querySelector('style').textContent;
    assert.match(css, /body\[data-page="home"\]\s*\{\s*animation: homeReveal/);
    assert.match(css, /html\.home-intro-pending body\[data-page="home"\]\s*\{\s*animation-play-state: paused;\s*\}/);
    assert(!css.includes('visibility: hidden'), 'line breaking can measure all initial text');
  } finally { e.dom.window.close(); }
});

test('stalled resources cannot hide the first view indefinitely or trigger a second entrance', async () => {
  const e = await entrance();
  try {
    assert.equal(e.duration, 2500);
    e.deadline(); assert(!e.pending());
    e.fonts.resolve(); e.image.resolve(); e.reading.resolve(); await flush();
    assert(!e.pending(), 'late readiness never hides visible content again');
    assert.equal(e.d.querySelector('#heroCatch').innerHTML, e.catchcopy);
  } finally { e.dom.window.close(); }
});

test('failed image decoding still releases the entrance', async () => {
  const e = await entrance();
  try {
    e.image.reject(new Error('image unavailable')); e.fonts.resolve(); e.reading.reject(new Error('line breaking unavailable')); await flush();
    assert(!e.pending()); assert(e.cleared());
  } finally { e.dom.window.close(); }
});

test('without JavaScript, the homepage keeps its content and has no pending visibility class', () => {
  const dom = new JSDOM(html);
  try {
    const d = dom.window.document;
    assert(!d.documentElement.classList.contains('home-intro-pending'));
    assert.match(d.querySelector('#heroCatch').textContent, /これからのすまい、それからのすまい。/);
    assert.equal(d.querySelectorAll('#heroButtons a').length, 2);
  } finally { dom.window.close(); }
});

// These are page/section titles, not card labels or legal/article body headings.
test('public page and section titles share the upward entrance, including contact and Tsuginoakari', () => {
  const files = ['index.html', 'korekara.html', 'sorekara.html', 'tsuginoakari.html',
    'mieruka-plan.html', 'akiya-shindan.html', 'contact.html', 'company.html',
    'faq.html', 'lab.html', 'lab-article.html', 'sitemap.html'];
  for (const filename of files) {
    const dom = new JSDOM(readFileSync(new URL('../' + filename, import.meta.url), 'utf8'));
    try {
      const d = dom.window.document;
      for (const title of d.querySelectorAll('h1, h2, .section-eyebrow, .eyebrow')) {
        if (title.closest('.hero, .article-content, [hidden]')) continue;
        assert(title.closest('.fade-up'), filename + ': ' + title.textContent);
      }
      if (filename === 'contact.html') {
        assert(!d.querySelector('#contactForm').closest('.fade-up'));
        assert.equal(d.querySelectorAll('#contactForm .fade-up:not(h2), .hero-contact .lead.fade-up').length, 0);
        assert(d.querySelector('#thanksView').hidden);
      }
    } finally { dom.window.close(); }
  }
});
