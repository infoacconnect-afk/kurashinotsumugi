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

  // ---- Related (同一カテゴリの新着3件を差し込み) ----
  try {
    const sameCat = allArticles
      .filter(a => a.category === article.category && a.slug !== article.slug)
      .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
      .slice(0, 3);
    const related = document.querySelector('[data-article="related"]');
    if (related && sameCat.length > 0) {
      related.innerHTML = sameCat.map((a, i) => {
        const c = categoriesMap[a.category];
        return `
          <a href="lab-article.html?id=${encodeURIComponent(a.slug)}" class="ra-card fade-up d${i+1}">
            <div class="ra-thumb"><svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="#F5E8D0"/><rect x="130" y="80" width="140" height="110" fill="#fff" stroke="#8B6F4E" stroke-width="2"/><path d="M110 80 L200 30 L290 80" fill="#B85C3E" stroke="#8B6F4E" stroke-width="2"/><rect x="180" y="120" width="40" height="70" fill="#E89B5B"/></svg></div>
            <div class="ra-body">
              <div class="ra-meta"><span class="cat">${escapeHtml(c ? c.name : '')}</span><span class="date">${(a.publishedAt||'').replace(/-/g,'.')}</span></div>
              <div class="ra-title">${escapeHtml(a.title)}</div>
            </div>
          </a>
        `;
      }).join('');
    }
  } catch (_) { /* noop */ }
})();
