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
  const fonts = deferred(), image = deferred();
  Object.defineProperty(d, 'fonts', { value: { ready: fonts.promise } });
  for (const img of d.querySelectorAll('.home-opening img')) img.decode = () => image.promise;
  let deadline, duration, cleared = false;
  w.setTimeout = (fn, ms) => { deadline = fn; duration = ms; return 1; };
  w.clearTimeout = id => { assert.equal(id, 1); cleared = true; };
  const catchcopy = d.querySelector('#heroCatch').innerHTML;
  w.eval(d.querySelector('#home-entrance').textContent);
  const pending = () => d.documentElement.classList.contains('home-intro-pending');
  assert(pending(), 'hidden before DOM content becomes available');
  d.dispatchEvent(new w.Event('DOMContentLoaded'));
  return { dom, d, fonts, image, pending, catchcopy, deadline, duration, cleared: () => cleared };
}

test('home reveals only after fonts and hero images settle, without rewriting the catchcopy', async () => {
  const e = await entrance();
  try {
    e.fonts.resolve(); await flush();
    assert(e.pending(), 'fonts alone must not reveal incomplete imagery');
    e.image.resolve(); await flush();
    assert(!e.pending()); assert(e.cleared());
    assert.equal(e.d.querySelector('#heroCatch').innerHTML, e.catchcopy);
    assert(e.d.querySelector('.home-opening #site-header-host'));
    assert(e.d.querySelector('.home-opening #heroButtons'));
    assert(e.d.querySelector('.home-opening .hero-ai-note'));
  } finally { e.dom.window.close(); }
});

test('stalled resources cannot hide the first view indefinitely or trigger a second entrance', async () => {
  const e = await entrance();
  try {
    assert.equal(e.duration, 2500);
    e.deadline(); assert(!e.pending());
    e.fonts.resolve(); e.image.resolve(); await flush();
    assert(!e.pending(), 'late readiness never hides visible content again');
    assert.equal(e.d.querySelector('#heroCatch').innerHTML, e.catchcopy);
  } finally { e.dom.window.close(); }
});

test('failed image decoding still releases the entrance', async () => {
  const e = await entrance();
  try {
    e.image.reject(new Error('image unavailable')); e.fonts.resolve(); await flush();
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
