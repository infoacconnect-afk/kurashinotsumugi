# SEO / AI search preparation (preview)

This change repairs metadata and makes the existing CMS content available in the initial HTML. It does not promise rankings, indexing or AI citations.

## Build and publication

- `npm ci && npm run build` fetches published articles using the existing microCMS environment variables, then writes `dist/`. Missing credentials or invalid article data fail the build rather than publishing sample content.
- `netlify.toml` uses the same pipeline for production and previews; only an approved merge to the production branch publishes it to production.
- Both previous entry points (`node build/fetch-lab.mjs` and `node fetch-lab.mjs`) now invoke that pipeline.
- The source HTML, existing renderers and reviewed image mapping remain authoritative. jsdom runs only selected local renderers, with no resource loading and no analytics execution.
- The existing `lab-article.html?id=...` URLs are preserved with Netlify query rewrites. Their HTML includes the article title, dates, body, image, table of contents and related links. Unknown/deleted IDs return HTTP 404.
- CMS rebuilds regenerate article HTML and the XML sitemap. Generated files are not committed. Removed articles are removed from the next build output.
- All canonical URLs refer to `https://kurashinotsumugi.com/`. The article backing files have the same canonical as the original query URL.
- Production robots.txt allows crawling and announces the XML sitemap. Preview/branch contexts receive robots disallow plus HTML and HTTP noindex controls.
- Header/footer links and the initial home/lab article cards are included in HTML. Existing client interactions still run; the article loader skips the already-rendered body.
- No fonts, CSS, images, visible source copy, GA4 loader or inquiry submission code are changed.

## Validation

`npm test` covers existing analytics behavior and SEO build behavior: initial HTML without JS, canonical URLs, complete descriptions, XML parsing, duplicate/unsafe slugs, missing content, preview exclusion and article deletion/rebuild.

For an offline check using a copy of public article JSON, run `CONTEXT=deploy-preview node build/render-seo.mjs /path/to/disposable/site-copy`. This does not fetch microCMS or change the production site. Never commit that downloaded snapshot as the CMS source.

Deploy-preview checks must verify the actual Netlify query rewrites (including extra campaign parameters and unknown IDs), noindex headers, canonical values, sitemap contents, unchanged visual output, and no GA4 requests. Do not submit the inquiry form.

## Scope limits

Structured data is limited to facts present in the articles. Company/service schema expansion, Search Console URL inspection, Core Web Vitals and actual AI citations are separate work. Do not submit preview URLs to search engines.
