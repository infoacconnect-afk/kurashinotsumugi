#!/usr/bin/env node
// =============================================================
// microCMS → data/articles.json ビルドスクリプト
// -------------------------------------------------------------
// 【使い方】
//   1. 環境変数を設定:
//      export MICROCMS_SERVICE_DOMAIN=your-service       (xxx.microcms.io の xxx部分)
//      export MICROCMS_API_KEY=your-get-api-key          (GET権限のみのキー推奨)
//   2. 実行:
//      node build/fetch-lab.mjs
//   3. `data/articles.json` が更新されます。
//
// 【microCMS側のスキーマ想定（ステップ1で正式に固めます）】
//   API名: articles
//   フィールド:
//     - title       (テキスト、必須)
//     - slug        (テキスト、必須、URL用ID)
//     - category    (セレクト or 参照フィールド。値: akiya / souzoku / jirei / torikumi / kensaku)
//     - excerpt     (テキストエリア)
//     - body        (リッチエディタ / HTML)
//     - eyecatch    (画像)
//     - author      (テキスト)
//     - isPickup    (真偽値)
//     - isPopular   (真偽値)
//     - views       (数値・任意)
//
// 【自動化】
//   Netlify / Vercel / Cloudflare Pages の
//   "Build Command" にこのスクリプトを入れておき、
//   microCMS 側の Webhook で公開時にビルドをトリガーすると、
//   記事公開後 2〜3分で本番サイトに反映されます。
// =============================================================

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');
const OUT_PATH   = resolve(ROOT, 'data/articles.json');

const SERVICE = process.env.MICROCMS_SERVICE_DOMAIN;
const APIKEY  = process.env.MICROCMS_API_KEY;
const ENDPOINT = process.env.MICROCMS_ENDPOINT || 'articles';
const LIMIT    = 100;

// ------ カテゴリ定義（サイト側で使う表示名の対応表） ------
const CATEGORIES = [
  { id: 'akiya',    name: '空き家情報',               slug: 'akiya',    color: 'green'  },
  { id: 'souzoku',  name: '相続・税金・管理・活用',   slug: 'souzoku',  color: 'brown'  },
  { id: 'jirei',    name: '再生・活用事例',           slug: 'jirei',    color: 'orange' },
  { id: 'torikumi', name: '取組紹介',                 slug: 'torikumi', color: 'green'  },
  { id: 'kensaku',  name: '活用物件検索',             slug: 'kensaku',  color: 'brown'  },
];

const validCategoryIds = new Set(CATEGORIES.map(c => c.id));

// ------ CLIヘルパー ------
const log = (...a) => console.log('[fetch-lab]', ...a);
const die = (msg) => { console.error('[fetch-lab] ERROR:', msg); process.exit(1); };

if (!SERVICE || !APIKEY) {
  die([
    'Missing environment variables.',
    '  MICROCMS_SERVICE_DOMAIN=' + (SERVICE || '(unset)'),
    '  MICROCMS_API_KEY=' + (APIKEY ? '(set)' : '(unset)'),
    '',
    'Example:',
    '  export MICROCMS_SERVICE_DOMAIN=your-service',
    '  export MICROCMS_API_KEY=xxxxxxxx',
    '  node build/fetch-lab.mjs',
  ].join('\n'));
}

// ------ microCMS 取得 ------
const fetchArticles = async () => {
  let all = [];
  let offset = 0;
  while (true) {
    const url = `https://${SERVICE}.microcms.io/api/v1/${ENDPOINT}?limit=${LIMIT}&offset=${offset}&orders=-publishedAt`;
    log('GET', url);
    const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': APIKEY } });
    if (!res.ok) {
      const body = await res.text();
      die(`microCMS API returned ${res.status}\n${body}`);
    }
    const json = await res.json();
    all = all.concat(json.contents || []);
    if ((json.totalCount || 0) <= all.length) break;
    offset += LIMIT;
  }
  return all;
};

// ------ 正規化 ------
// microCMSの記事オブジェクトを、サイトが使う形に整形します。
const normalizeArticle = (a) => {
  // category は「セレクトフィールド（配列）」または「参照フィールド」の可能性があるので両対応
  let categoryId = null;
  if (Array.isArray(a.category)) {
    categoryId = a.category[0];
  } else if (typeof a.category === 'string') {
    categoryId = a.category;
  } else if (a.category && typeof a.category === 'object') {
    categoryId = a.category.id || a.category.slug || null;
  }
  if (!validCategoryIds.has(categoryId)) {
    console.warn('[fetch-lab] Unknown category, defaulting to "akiya":', categoryId, 'in', a.title);
    categoryId = 'akiya';
  }

  const dateOnly = (iso) => (iso || '').slice(0, 10);

  return {
    id: a.id || a.slug,
    slug: a.slug || a.id,
    title: a.title || '(無題)',
    excerpt: a.excerpt || '',
    body: a.body || '',  // 記事詳細ページで使用
    category: categoryId,
    publishedAt: dateOnly(a.publishedAt || a.createdAt),
    updatedAt:   dateOnly(a.revisedAt   || a.updatedAt || a.publishedAt),
    author: a.author || 'くらしのつむぎ編集部',
    isPickup:  !!a.isPickup,
    isPopular: !!a.isPopular,
    views: typeof a.views === 'number' ? a.views : 0,
    eyecatch: a.eyecatch && a.eyecatch.url ? a.eyecatch.url : null,
    eyecatchAlt: a.eyecatchAlt || a.title || '',
  };
};

// ------ Main ------
(async () => {
  log('Fetching from microCMS service:', SERVICE);
  const raw = await fetchArticles();
  log(`Received ${raw.length} article(s).`);

  const articles = raw.map(normalizeArticle);

  const output = {
    generatedAt: new Date().toISOString(),
    categories: CATEGORIES,
    articles,
  };

  // dataディレクトリを作成
  const outDir = dirname(OUT_PATH);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  log('Wrote:', OUT_PATH);

  // ---- 記事詳細ページ用に、記事本文を個別JSONにも書き出す（オプション） ----
  const detailDir = resolve(ROOT, 'data/articles');
  if (!existsSync(detailDir)) mkdirSync(detailDir, { recursive: true });
  for (const a of articles) {
    if (!a.slug) continue;
    writeFileSync(
      resolve(detailDir, `${a.slug}.json`),
      JSON.stringify(a, null, 2),
      'utf8'
    );
  }
  log(`Wrote ${articles.length} detail JSON(s) to data/articles/`);

  log('Done ✓');
})().catch(err => die(err.stack || err.message));
