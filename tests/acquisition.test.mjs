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


test('article service guidance follows the reviewed topic, never a blanket watch promotion', async () => {
  const { addArticleServiceLink, reviewedArticleServices } = await import('../build/article-services.mjs');
  for (const [slug, rule] of Object.entries(reviewedArticleServices)) {
    const dom = new JSDOM(read('lab-article.html'));
    try {
      const d = dom.window.document;
      addArticleServiceLink(d, { slug, title: rule.title });
      addArticleServiceLink(d, { slug, title: rule.title });
      assert.equal(d.querySelectorAll('[data-contextual-service]').length, 1);
      const link = d.querySelector('[data-contextual-service]');
      assert.equal(link.dataset.contextualService, rule.intent);
      if (rule.intent === 'lease') assert.equal(link.getAttribute('href'), 'sorekara.html#lease-use');
      if (rule.intent === 'sale') assert.equal(link.getAttribute('href'), 'sorekara.html#sale-consultation');
      assert(d.querySelector('.contact-cta a[href="sorekara.html"]'));
      assert(d.querySelector('.contact-cta a[href="contact.html"]'));
      addArticleServiceLink(d, { slug, title: '内容が変更された未確認の記事' });
      assert.equal(d.querySelectorAll('[data-contextual-service]').length, 0);
      addArticleServiceLink(d, { slug: 'unknown', title: rule.title });
      assert.equal(d.querySelectorAll('[data-contextual-service]').length, 0);
    } finally { dom.window.close(); }
  }
});
