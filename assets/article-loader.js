// ============================================
// 記事詳細ページのローダー
//  ?id=<slug> を読み取り、
//  data/articles/<slug>.json から本文を読み込んで反映します。
// microCMS未接続の間は、テンプレートのプレビュー用ダミーが表示されます。
// ============================================
(async function() {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('id');
  if (!slug) return; // ID指定なしならプレビュー表示のまま

  // 一括で並列取得（categoriesMap と 記事本体）
  let categoriesMap = {};
  let article;
  let allArticles = [];
  try {
    const [listRes, detailRes] = await Promise.all([
      fetch('data/articles.json', { cache: 'no-cache' }),
      fetch(`data/articles/${slug}.json`, { cache: 'no-cache' }),
    ]);
    if (listRes.ok) {
      const listJson = await listRes.json();
      categoriesMap = Object.fromEntries((listJson.categories || []).map(c => [c.id, c]));
      allArticles = listJson.articles || [];
    }
    if (!detailRes.ok) throw new Error('HTTP ' + detailRes.status);
    article = await detailRes.json();
  } catch (e) {
    console.error('記事が見つかりませんでした:', slug, e);
    const main = document.querySelector('.article-body-sec .article-content');
    if (main) main.innerHTML = `<p style="text-align:center;color:var(--text-mute);padding:60px 0;">お探しの記事が見つかりませんでした。<br><a href="lab.html" style="color:var(--orange-deep);text-decoration:underline">記事一覧へ戻る</a></p>`;
    return;
  }

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatDateJa = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00+09:00');
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  };

  // ---- Title ----
  document.title = `${article.title}｜住資産再生ラボ`;
  const titleEl = document.querySelector('[data-article="title"]');
  if (titleEl) titleEl.textContent = article.title;

  // ---- Category ----
  const cat = categoriesMap[article.category];
  const catName = cat ? cat.name : (article.category || '');
  document.querySelectorAll('[data-article="category"], [data-article="category-link"]').forEach(el => {
    el.textContent = catName;
  });

  // ---- Dates ----
  const pub = document.querySelector('[data-article="published-at"]');
  if (pub) pub.textContent = formatDateJa(article.publishedAt);
  const upd = document.querySelector('[data-article="updated-at"]');
  if (upd) upd.textContent = formatDateJa(article.updatedAt);

  // ---- Author ----
  document.querySelectorAll('[data-article="author"], [data-article="author-name"]').forEach(el => {
    el.textContent = article.author || 'くらしのつむぎ編集部';
  });

  // ---- Eyecatch ----
  const eye = document.querySelector('[data-article="eyecatch"]');
  if (eye && article.eyecatch) {
    eye.innerHTML = `<img src="${article.eyecatch}" alt="${escapeHtml(article.eyecatchAlt || article.title)}">`;
  }

  // ---- Body ----
  const body = document.querySelector('[data-article="body"]');
  if (body && article.body) {
    // microCMSのリッチエディタはHTMLで届くのでそのまま流し込みます
    body.innerHTML = article.body;

    // 目次を自動生成（本文内の h2 から）
    const tocList = document.querySelector('#toc');
    if (tocList) {
      const h2s = body.querySelectorAll('h2');
      if (h2s.length > 0) {
        tocList.innerHTML = [...h2s].map((h, i) => {
          if (!h.id) h.id = 'sec-' + (i + 1);
          return `<li><a href="#${h.id}">${escapeHtml(h.textContent)}</a></li>`;
        }).join('');
      }
    }
  }

  // ---- Related (同カテゴリ優先 → 不足分は他カテゴリで埋める) ----
  try {
    const related = document.querySelector('[data-article="related"]');
    if (!related) return;

    // 現在の記事を除外し、公開日の新しい順にソート
    const sortedOthers = allArticles
      .filter(a => a.slug !== article.slug)
      .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

    // 優先: 同一カテゴリの新着記事
    const sameCat = sortedOthers.filter(a => a.category === article.category);
    // 補完: 別カテゴリの新着記事
    const otherCat = sortedOthers.filter(a => a.category !== article.category);

    // 同一カテゴリを優先しつつ、合計3件になるように結合
    const relatedArticles = [...sameCat, ...otherCat].slice(0, 3);

    if (relatedArticles.length === 0) {
      // 他に記事が1件もない: セクション自体を非表示
      const section = related.closest('.related-articles-sec');
      if (section) section.style.display = 'none';
      return;
    }

    // フォールバックSVG（アイキャッチが未設定の場合）
    const catStyle = {
      green:  { bg: '#EEF2E5', accent: '#9CAF88' },
      brown:  { bg: '#F3ECE0', accent: '#B99A78' },
      orange: { bg: '#FBF0DC', accent: '#E89B5B' },
    };
    const fallbackThumb = (a) => {
      const c = categoriesMap[a.category] || { color: 'brown' };
      const s = catStyle[c.color] || catStyle.brown;
      const seed = [...(a.slug || '')].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const variants = [
        `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><rect x="130" y="80" width="140" height="110" fill="#fff" stroke="#8B6F4E" stroke-width="2"/><path d="M110 80 L200 30 L290 80" fill="#B85C3E" stroke="#8B6F4E" stroke-width="2"/><rect x="180" y="120" width="40" height="70" fill="#E89B5B"/></svg>`,
        `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><circle cx="200" cy="125" r="70" fill="${s.accent}" opacity="0.35"/><path d="M170 155 Q200 90 230 155 Q220 185 200 185 Q180 185 170 155Z" fill="${s.accent}"/></svg>`,
        `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><rect x="80" y="60" width="240" height="140" fill="#fff" stroke="#8B6F4E" stroke-width="2" rx="8"/><rect x="110" y="88" width="180" height="10" fill="${s.accent}" opacity="0.7" rx="2"/><line x1="110" y1="118" x2="270" y2="118" stroke="#8B6F4E" stroke-width="1.4" opacity="0.35"/><line x1="110" y1="140" x2="250" y2="140" stroke="#8B6F4E" stroke-width="1.4" opacity="0.35"/></svg>`,
        `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><rect x="100" y="70" width="200" height="140" fill="#fff" stroke="#8B6F4E" stroke-width="2" rx="8"/><circle cx="200" cy="140" r="40" fill="${s.accent}" opacity="0.5"/><text x="200" y="152" text-anchor="middle" font-size="34" fill="#8B6F4E" font-family="serif">¥</text></svg>`,
      ];
      return variants[seed % 4];
    };
    const thumbHtml = (a) => a.eyecatch
      ? `<img src="${escapeHtml(a.eyecatch)}" alt="${escapeHtml(a.eyecatchAlt || a.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">`
      : fallbackThumb(a);

    related.innerHTML = relatedArticles.map((a, i) => {
      const c = categoriesMap[a.category];
      return `
        <a href="lab-article.html?id=${encodeURIComponent(a.slug)}" class="ra-card fade-up d${i+1}">
          <div class="ra-thumb">${thumbHtml(a)}</div>
          <div class="ra-body">
            <div class="ra-meta"><span class="cat">${escapeHtml(c ? c.name : '')}</span><span class="date">${(a.publishedAt||'').replace(/-/g,'.')}</span></div>
            <div class="ra-title">${escapeHtml(a.title)}</div>
          </div>
        </a>
      `;
    }).join('');

    // fade-upを即座に有効化
    requestAnimationFrame(() => {
      related.querySelectorAll('.fade-up').forEach(el => el.classList.add('in'));
    });
  } catch (e) {
    console.error('[article-loader] Related articles render failed:', e);
  }
})();
