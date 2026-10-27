// Reviewed empty-house article wording approved on 2026-10-27.
// General use of これから is allowed in content about これからのすまい.
// Do not apply this migration indiscriminately to future articles.
// microCMS remains the article source. Apply this presentation policy once,
// before producing list/detail JSON, HTML and search metadata, on every build.
// Service names, URLs, images, IDs and other article fields remain untouched.
import { JSDOM } from 'jsdom';

export function housingCopy(text) {
  return text
    .replace(/((?:ご実家|実家|空き家|その家|家)の[「"“]?)(これから)(?!のすまい)/g, '$1未来')
    .replace(/これから(?!のすまい)/g, '今後');
}

// Only the ten articles included in the approved preview are migrated.
const reviewedSlugs = new Set([
  'jikka-itsukanohanashi', 'jikka-sorekara1', 'jikka-kataduke',
  'akiya-selfcheck', 'akiya_kimochi', 'casestudy01', 'souzoku5step',
  'koteishisan', 'fusainishinai', '3000koujyo',
]);

export function articleCopy(article) {
  if (!reviewedSlugs.has(article.slug)) return { ...article };
  const result = { ...article };
  for (const field of ['title', 'excerpt', 'eyecatchAlt']) {
    if (typeof result[field] === 'string') result[field] = housingCopy(result[field]);
  }
  if (typeof result.body === 'string' && /これから(?!のすまい)/.test(result.body)) {
    const fragment = JSDOM.fragment(result.body);
    const walker = fragment.ownerDocument.createTreeWalker(fragment, 4);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.parentElement?.closest('script, style, code, pre')) node.textContent = housingCopy(node.textContent);
    }
    for (const el of fragment.querySelectorAll('[alt], [title]')) {
      for (const attr of ['alt', 'title']) {
        if (el.hasAttribute(attr)) el.setAttribute(attr, housingCopy(el.getAttribute(attr)));
      }
    }
    const container = fragment.ownerDocument.createElement('div');
    container.append(fragment);
    result.body = container.innerHTML;
  }
  return result;
}
