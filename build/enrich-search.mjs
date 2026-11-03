import { createHash } from 'node:crypto';
// Derive machine-readable information from the visible source, not a second
// manually maintained copy of company facts, service terms or article content.
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const visibleText = element => {
  if (!element) return '';
  const copy = element.cloneNode(true);
  copy.querySelectorAll('br').forEach(br => br.replaceWith(' '));
  return clean(copy.textContent);
};
const absolute = (path, origin) => new URL(path, origin + '/').href;

export function readOrganization(document, origin) {
  const facts = new Map([...document.querySelectorAll('.info-row')].map(row =>
    [clean(row.querySelector('dt')?.textContent), visibleText(row.querySelector('dd'))]));
  if (!facts.get('会社名') || !facts.get('所在地') || !facts.get('電話番号')) {
    throw new Error('Company name, address and telephone must be visible in company.html');
  }
  return {
    '@type': 'Organization', '@id': origin + '/#organization',
    name: facts.get('会社名'), url: origin + '/company.html',
    address: facts.get('所在地'), telephone: facts.get('電話番号'),
    brand: { '@id': origin + '/#brand' },
    contactPoint: { '@type': 'ContactPoint', telephone: facts.get('電話番号'),
      contactType: 'お問い合わせ', url: origin + '/contact.html' }
  };
}

function meta(document, property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.append(el); }
  el.content = content;
}

export function enrichSearch(document, { origin, organization }) {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  if (!canonical || document.querySelector('meta[name="robots"]')?.content.includes('noindex')) return;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const name = clean(document.querySelector('h1')?.textContent) || document.title;
  const article = Boolean(document.documentElement.dataset.prerenderedArticle);
  meta(document, 'og:title', document.title);
  meta(document, 'og:description', description);
  meta(document, 'og:url', canonical);
  meta(document, 'og:type', article ? 'article' : 'website');
  meta(document, 'og:site_name', 'くらしのつむぎ');
  meta(document, 'og:locale', 'ja_JP');
  const articleImage = document.querySelector('[data-article="eyecatch"] img')?.getAttribute('src');
  const image = articleImage || document.querySelector('meta[property="og:image"]')?.content;
  if (image) meta(document, 'og:image', absolute(image, origin));

  const graph = [organization, {
    '@type': 'WebSite', '@id': origin + '/#website', name: 'くらしのつむぎ',
    url: origin + '/', publisher: { '@id': organization['@id'] }, inLanguage: 'ja'
  }, {
    '@type': 'WebPage', '@id': canonical + '#webpage', url: canonical,
    name: document.title, description, inLanguage: 'ja',
    isPartOf: { '@id': origin + '/#website' }, publisher: { '@id': organization['@id'] }
  }];
  const pageNode = graph[2];
  const path = new URL(canonical).pathname;
  if (article) pageNode.mainEntity = { '@id': canonical + '#article' };
  const brand = { '@type': 'Brand', '@id': origin + '/#brand', name: 'くらしのつむぎ', url: origin + '/' };
  const logo = document.querySelector('.site-header img')?.getAttribute('src');
  if (logo) brand.logo = absolute(logo, origin);
  graph.push(brand);
  if (path === '/company.html') {
    pageNode['@type'] = ['WebPage', 'AboutPage'];
    pageNode.mainEntity = { '@id': organization['@id'] };
  } else if (path === '/contact.html') {
    pageNode['@type'] = ['WebPage', 'ContactPage'];
    pageNode.about = { '@id': organization['@id'] };
  } else if (path === '/lab.html') {
    pageNode['@type'] = ['WebPage', 'CollectionPage'];
  }
  // Mark up the dedicated FAQ only; repeated service FAQs remain ordinary HTML.
  // Every answer is taken verbatim from the visible, expandable answer.
  if (path === '/faq.html') {
    const questions = [...document.querySelectorAll('.faq-item')].map(item => {
      const question = visibleText(item.querySelector('.q-text'));
      const answer = visibleText(item.querySelector('.faq-a-inner'));
      if (!question || !answer) return null;
      if (!item.id) item.id = 'faq-' + createHash('sha256').update(question).digest('hex').slice(0, 12);
      return { '@type': 'Question', '@id': canonical + '#' + item.id, url: canonical + '#' + item.id,
        name: question, acceptedAnswer: { '@type': 'Answer', text: answer } };
    }).filter(Boolean);
    if (questions.length) {
      pageNode['@type'] = ['WebPage', 'FAQPage'];
      pageNode.mainEntity = questions;
    }
  }
  const services = new Set(['/sorekara.html', '/korekara.html', '/tsuginoakari.html', '/mieruka-plan.html', '/akiya-shindan.html']);
  if (services.has(new URL(canonical).pathname)) {
    graph.push({ '@type': 'Service', '@id': canonical + '#service', name,
      description, url: canonical, brand: { '@id': origin + '/#brand' }, provider: { '@id': organization['@id'] } });
    graph[2].mainEntity = { '@id': canonical + '#service' };
  }
  const crumbs = [...document.querySelectorAll('.breadcrumb-inner a')].map(a => ({
    name: clean(a.textContent), item: absolute(a.getAttribute('href'), origin).replace(/\/index\.html$/, '/')
  }));
  if (crumbs.length) {
    // The last item describes this page, not an unlinked category label.
    if (crumbs.at(-1).item !== canonical) crumbs.push({ name, item: canonical });
    if (crumbs.length >= 2) graph.push({ '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((item, i) => ({ '@type': 'ListItem', position: i + 1, ...item })) });
  }
  document.querySelector('script[data-search-graph]')?.remove();
  const script = document.createElement('script');
  script.type = 'application/ld+json'; script.dataset.searchGraph = '';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  document.head.append(script);
}
