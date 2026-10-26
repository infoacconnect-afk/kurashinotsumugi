// Build HTML from the existing renderers. No browser, tracking scripts or network
// requests run here: only explicitly selected local renderers and local JSON.
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readOrganization, enrichSearch } from './enrich-search.mjs';
import { addArticleServiceLink } from './article-services.mjs';

export const ORIGIN = 'https://kurashinotsumugi.com';
const xml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const read = path => readFileSync(path, 'utf8');

export function validateArticles(articles) {
  const seen = new Set();
  for (const a of articles) {
    // Slugs are used in filesystem paths and Netlify query rules. Fail closed.
    if (!/^[A-Za-z0-9_-]+$/.test(a.slug || '') || seen.has(a.slug)) {
      throw new Error(`Invalid or duplicate article slug: ${a.slug}`);
    }
    if (!a.title?.trim() || !a.body?.trim()) throw new Error(`Missing title/body: ${a.slug}`);
    seen.add(a.slug);
  }
}

function metadata(document, selector, tag, attributes) {
  const el = document.querySelector(selector) || document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  if (!el.isConnected) document.head.append(el);
}

export async function renderSeo({ root, context = process.env.CONTEXT || 'production' }) {
  const out = join(root, 'dist');
  const data = JSON.parse(read(join(root, 'data/articles.json')));
  validateArticles(data.articles);
  const preview = context !== 'production';
  const companyDom = new JSDOM(read(join(root, 'company.html')));
  const organization = readOrganization(companyDom.window.document, ORIGIN);
  companyDom.window.close();
  const common = read(join(root, 'assets/common.js'));
  // Keep the exact reviewed image mapping as the single source of truth.
  const imageMarker = '/* Production: reuse reviewed image bytes without changing live CMS content. */';
  if (!common.includes(imageMarker)) throw new Error('Reviewed image mapping not found');
  const imageCode = common.slice(common.indexOf(imageMarker));
  const articlesBySlug = new Map(data.articles.map(a => [a.slug, a]));
  const urls = [];
  const excluded = new Set(['.git', 'node_modules', 'dist', 'build', 'tests',
    'package.json', 'package-lock.json', 'netlify.toml', 'fetch-lab.mjs', '.gitignore', 'AGENTS.md', 'docs']);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const entry of readdirSync(root)) {
    if (!excluded.has(entry)) cpSync(join(root, entry), join(out, entry), { recursive: true });
  }

  function page(html, url) {
    const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
    const w = dom.window;
    w.requestAnimationFrame = callback => { callback(); return 0; };
    w.scrollTo = () => {};
    w.fetch = async input => {
      const u = new URL(input, url);
      if (u.origin !== ORIGIN) throw new Error('Network access is forbidden during rendering');
      if (u.pathname === '/data/articles.json') return { ok: true, json: async () => data };
      const match = u.pathname.match(/^\/data\/articles\/([A-Za-z0-9_-]+)\.json$/);
      const article = match && articlesBySlug.get(match[1]);
      if (!article) throw new Error(`Unexpected renderer request: ${u.pathname}`);
      return { ok: true, json: async () => article };
    };
    w.eval(imageCode);
    return dom;
  }

  function finish(dom) {
    const d = dom.window.document;
    dom.window.eval(read(join(root, 'assets/partials.js')));
    enrichSearch(d, { origin: ORIGIN, organization });
    if (preview) metadata(d, 'meta[name="robots"]', 'meta', { name: 'robots', content: 'noindex, nofollow' });
    // Existing animations are kept for JS users; text remains readable without JS.
    const noscript = d.createElement('noscript');
    noscript.innerHTML = '<style>.fade-up{opacity:1!important;transform:none!important}.hero-brand,.hero-logo-mark,.hero-buttons{opacity:1!important;transform:none!important}</style>';
    d.body.append(noscript);
    return dom.serialize();
  }

  const template = read(join(root, 'lab-article.html'));
  const redirects = ['# Generated at build time. Preserve existing article URLs and analytics paths.'];
  mkdirSync(join(out, 'lab-rendered'), { recursive: true });
  for (const article of data.articles) {
    const url = `${ORIGIN}/lab-article.html?id=${encodeURIComponent(article.slug)}`;
    const dom = page(template, url);
    const d = dom.window.document;
    try {
      await dom.window.eval(read(join(root, 'assets/article-loader.js')));
      const body = d.querySelector('[data-article="body"]');
      if (!body?.textContent.trim() || d.querySelector('[data-article="title"]')?.textContent !== article.title) {
        throw new Error(`Article rendering failed: ${article.slug}`);
      }
      addArticleServiceLink(d, article);
      const description = (article.excerpt || body.textContent).replace(/\s+/g, ' ').trim().slice(0, 160);
      metadata(d, 'meta[name="description"]', 'meta', { name: 'description', content: description });
      metadata(d, 'link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
      for (const el of d.querySelectorAll('meta[name="robots"]')) el.remove();
      // A direct request for the backing file must resolve assets to the site root too.
      const base = d.createElement('base'); base.href = '/lab-article.html?id=' + encodeURIComponent(article.slug); d.head.prepend(base);
      d.documentElement.dataset.prerenderedArticle = article.slug;
      // The loader is intentionally skipped on these pages: no second body replacement.
      const schema = {
        '@context': 'https://schema.org', '@type': 'Article', headline: article.title,
        description, mainEntityOfPage: url,
        publisher: { '@type': 'Organization', name: 'Ac・Connect株式会社', url: ORIGIN + '/company.html' }
      };
      if (article.publishedAt) schema.datePublished = article.publishedAt;
      if (article.updatedAt) schema.dateModified = article.updatedAt;
      const author = d.querySelector('[data-article="author"]')?.textContent.trim();
      if (author) schema.author = { '@type': author === 'くらしのつむぎ編集部' ? 'Organization' : 'Person', name: author };
      if (article.eyecatch) schema.image = new URL(dom.window.KurashiArticleImage(article.eyecatch), ORIGIN).href;
      const jsonld = d.createElement('script'); jsonld.type = 'application/ld+json';
      jsonld.textContent = JSON.stringify(schema).replace(/</g, '\\u003c'); d.head.append(jsonld);
      writeFileSync(join(out, 'lab-rendered', article.slug + '.html'), finish(dom));
      for (const path of ['/lab-article.html', '/lab-article']) {
        redirects.push(`${path} id=${article.slug} /lab-rendered/${article.slug}.html 200!`);
      }
      urls.push({ url, lastmod: article.updatedAt || article.publishedAt });
    } finally { dom.window.close(); }
  }

  for (const filename of readdirSync(root).filter(f => f.endsWith('.html') && !f.startsWith('google') && f !== 'lab-article.html')) {
    const dom = page(read(join(root, filename)), `${ORIGIN}/${filename}`);
    try {
      if (filename === 'index.html') await dom.window.eval(read(join(root, 'assets/lab-home.js')));
      if (filename === 'lab.html') {
        await dom.window.eval(read(join(root, 'assets/lab-render.js')));
        // Pagination requires JS. Provide all published links to readers without JS.
        const noscript = dom.window.document.createElement('noscript');
        noscript.innerHTML = '<div class="container"><ul>' + data.articles.map(a =>
          `<li><a href="lab-article.html?id=${xml(a.slug)}">${xml(a.title)}</a></li>`).join('') + '</ul></div>';
        dom.window.document.querySelector('.article-list-sec')?.append(noscript);
      }
      const d = dom.window.document;
      const canonical = d.querySelector('link[rel="canonical"]')?.href;
      if (canonical && !d.querySelector('meta[name="robots"]')?.content.includes('noindex')) urls.push({ url: canonical });
      writeFileSync(join(out, filename), finish(dom));
    } finally { dom.window.close(); }
  }

  // Unknown/deleted article IDs must not return a sample article with HTTP 200.
  const notFound = '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, follow"><title>ページが見つかりません｜くらしのつむぎ</title><link rel="stylesheet" href="/assets/fonts-local.css"><link rel="stylesheet" href="/assets/common.css"></head><body><main class="container" style="padding-block:80px"><h1>お探しのページが見つかりませんでした。</h1><p><a href="/lab.html">記事一覧へ戻る</a></p><p><a href="/">トップページへ戻る</a></p></main></body></html>';
  writeFileSync(join(out, '404.html'), notFound);
  for (const path of ['/lab-article.html', '/lab-article']) {
    redirects.push(`${path} id=:id /404.html 404!`, `${path} /404.html 404!`);
  }
  writeFileSync(join(out, '_redirects'), redirects.join('\n') + '\n');
  const unique = [...new Map(urls.map(item => [item.url, item])).values()];
  writeFileSync(join(out, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + unique.map(item =>
    `  <url><loc>${xml(item.url)}</loc>${/^\d{4}-\d{2}-\d{2}$/.test(item.lastmod || '') ? `<lastmod>${item.lastmod}</lastmod>` : ''}</url>`).join('\n') + '\n</urlset>\n');
  writeFileSync(join(out, 'robots.txt'), preview
    ? 'User-agent: *\nDisallow: /\n'
    : 'User-agent: *\nAllow: /\n\nSitemap: ' + ORIGIN + '/sitemap.xml\n');
  writeFileSync(join(out, '_headers'), preview ? '/*\n  X-Robots-Tag: noindex, nofollow\n' : '');
  console.log(`[render-seo] ${data.articles.length} articles, ${unique.length} sitemap URLs; ${context}`);
  return { articles: data.articles.length, urls: unique.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await renderSeo({ root: resolve(process.argv[2] || join(fileURLToPath(new URL('.', import.meta.url)), '..')) });
}
