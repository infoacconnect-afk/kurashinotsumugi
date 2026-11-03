import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { enrichSearch, readOrganization } from '../build/enrich-search.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const origin = 'https://kurashinotsumugi.com';

test('visible company and page changes propagate to schema and sharing metadata', () => {
  const company = new JSDOM(read('company.html'));
  const d = company.window.document;
  const phone = [...d.querySelectorAll('.info-row')].find(row => row.querySelector('dt').textContent === '電話番号').querySelector('dd');
  phone.textContent = '048-000-1111';
  const organization = readOrganization(d, origin);
  const dom = new JSDOM(read('tsuginoakari.html'), { url: origin + '/tsuginoakari.html' });
  try {
    dom.window.document.querySelector('meta[name="description"]').content = '変更後の公開説明';
    enrichSearch(dom.window.document, { origin, organization });
    enrichSearch(dom.window.document, { origin, organization });
    const document = dom.window.document;
    assert.equal(document.querySelectorAll('script[data-search-graph]').length, 1);
    const graph = JSON.parse(document.querySelector('script[data-search-graph]').textContent)['@graph'];
    assert.equal(graph.find(x => x['@type'] === 'Organization').telephone, '048-000-1111');
    assert.equal(graph.find(x => x['@type'] === 'Service').description, '変更後の公開説明');
    assert.equal(document.querySelector('meta[property="og:description"]').content, '変更後の公開説明');
    assert.equal(document.querySelector('meta[property="og:url"]').content, origin + '/tsuginoakari.html');
    assert.equal(graph.find(x => x['@type'] === 'BreadcrumbList').itemListElement.at(-1).item, origin + '/tsuginoakari.html');
    assert(!JSON.stringify(graph).includes('aggregateRating'));
  } finally { dom.window.close(); company.window.close(); }
});

test('service links preselect the right consultation, without consent, events or requests', () => {
  for (const service of ['korekara', 'sorekara', 'tsuginoakari', 'mieruka', 'shindan', 'unknown', '<script>', '']) {
    const dom = new JSDOM(read('contact.html'), { url: origin + '/contact.html?service=' + encodeURIComponent(service), runScripts: 'outside-only' });
    try {
      const w = dom.window; let events = 0, requests = 0;
      w.tsumugiTrackFormStart = w.tsumugiTrackLead = () => { events++; };
      w.fetch = () => { requests++; throw new Error('No request permitted'); };
      w.eval(read('assets/contact-form.js'));
      const selected = [...w.document.querySelectorAll('input[name="inquiry"]:checked')].map(x => x.value);
      const valid = ['korekara', 'sorekara', 'tsuginoakari', 'mieruka', 'shindan'].includes(service);
      assert.deepEqual(selected, valid ? [service] : []);
      assert.equal(w.document.querySelectorAll('input[name^="agree"]:checked').length, 0);
      if (service === 'tsuginoakari') assert(w.document.querySelector('#appliedTermsList a[href="terms-tsuginoakari.html"]'));
      if (service === 'mieruka') assert(w.document.querySelector('#appliedTermsList a[href="terms-mieruka.html"]'));
      assert.equal(events, 0); assert.equal(requests, 0);
      // The visitor can change the selected subject; applicable terms follow it.
      if (service === 'tsuginoakari') {
        w.document.querySelector('input[value="tsuginoakari"]').checked = false;
        const field = w.document.querySelector('input[value="mieruka"]'); field.checked = true;
        field.dispatchEvent(new w.Event('change', { bubbles: true }));
        assert(!w.document.querySelector('#appliedTermsList a[href="terms-tsuginoakari.html"]'));
        assert(w.document.querySelector('#appliedTermsList a[href="terms-mieruka.html"]'));
        assert.equal(events, 0);
      }
    } finally { dom.window.close(); }
  }
});


test('FAQ answers and stable fragment URLs derive from visible copy without duplicating FAQ markup on service pages', () => {
  const company = new JSDOM(read('company.html'));
  const organization = readOrganization(company.window.document, origin);
  const dom = new JSDOM(read('faq.html'), { url: origin + '/faq.html' });
  try {
    enrichSearch(dom.window.document, { origin, organization });
    const d = dom.window.document;
    const graph = () => JSON.parse(d.querySelector('[data-search-graph]').textContent)['@graph'];
    const questions = graph().find(n => Array.isArray(n['@type']) && n['@type'].includes('FAQPage')).mainEntity;
    assert.equal(questions.length, d.querySelectorAll('.faq-item').length);
    const text = el => { const c = el.cloneNode(true); c.querySelectorAll('br').forEach(b => b.replaceWith(' ')); return c.textContent.replace(/\s+/g, ' ').trim(); };
    for (const q of questions) {
      const item = d.getElementById(new URL(q.url).hash.slice(1));
      assert(item);
      assert.equal(q.name, text(item.querySelector('.q-text')));
      assert.equal(q.acceptedAnswer.text, text(item.querySelector('.faq-a-inner')));
    }
    const ids = questions.map(q => q['@id']);
    d.querySelector('.faq-item').before(d.querySelector('.faq-item').cloneNode(true));
    d.querySelector('.faq-item').remove();
    enrichSearch(d, { origin, organization });
    assert.deepEqual(graph().find(n => n.mainEntity?.[0]?.['@type'] === 'Question').mainEntity.map(q => q['@id']), ids);
    const service = new JSDOM(read('sorekara.html'));
    enrichSearch(service.window.document, { origin, organization });
    assert(!service.window.document.querySelector('[data-search-graph]').textContent.includes('FAQPage'));
    service.window.close();
  } finally { company.window.close(); dom.window.close(); }
});

test('direct FAQ links reveal the matching category and answer without a click or network request', async () => {
  const dom = new JSDOM(read('faq.html'), { url: origin + '/faq.html#linked-answer', runScripts: 'outside-only' });
  const w = dom.window, d = w.document;
  try {
    await new Promise(resolve => d.addEventListener('DOMContentLoaded', resolve, { once: true }));
    const item = d.querySelectorAll('.faq-group')[3].querySelector('.faq-item');
    item.id = 'linked-answer';
    let scrolled = false;
    item.scrollIntoView = () => { scrolled = true; };
    w.requestAnimationFrame = fn => fn();
    w.IntersectionObserver = class { observe() {} };
    const script = read('assets/common.js').split('/* v7:')[0];
    w.eval(script);
    w.dispatchEvent(new w.HashChangeEvent('hashchange'));
    await Promise.resolve();
    assert(item.classList.contains('open'));
    assert(item.closest('.faq-group').classList.contains('active'));
    assert.equal(d.querySelectorAll('.faq-group.active').length, 1);
    assert.equal(d.querySelector('.faq-tab.active').dataset.cat, item.closest('.faq-group').dataset.cat);
    assert.equal(item.querySelector('.faq-q').getAttribute('aria-expanded'), 'true');
    assert.equal(item.querySelector('.faq-a').getAttribute('aria-hidden'), 'false');
    assert(scrolled);
    item.querySelector('.faq-q').click();
    assert.equal(item.querySelector('.faq-q').getAttribute('aria-expanded'), 'false');
  } finally { dom.window.close(); }
});
