// ============================================
// トップページの「住資産再生ラボ」セクション用
// data/articles.json から最新3件を読み込んで表示
// ============================================
(async function() {
  'use strict';

  const container = document.querySelector('[data-lab-home="latest"]');
  if (!container) return;

  // ---------- Fetch ----------
  let data;
  try {
    const res = await fetch('data/articles.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
  } catch (e) {
    console.error('[lab-home] 記事データの読み込みに失敗:', e);
    // エラー時はセクションを非表示
    const section = container.closest('.lab-sec');
    if (section) section.style.display = 'none';
    return;
  }

  const { categories = [], articles = [] } = data;
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // ---------- Helpers ----------
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00+09:00');
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  const articleUrl = (a) => `lab-article.html?id=${encodeURIComponent(a.slug)}`;

  // フォールバックSVG（アイキャッチが未設定の場合）
  const catStyle = {
    green:  { bg: '#EEF2E5', accent: '#9CAF88' },
    brown:  { bg: '#F3ECE0', accent: '#B99A78' },
    orange: { bg: '#FBF0DC', accent: '#E89B5B' },
  };

  const fallbackThumb = (article) => {
    const cat = catMap[article.category] || categories[0] || { color: 'brown' };
    const s = catStyle[cat.color] || catStyle.brown;
    const seed = [...(article.slug || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
    const variant = seed % 4;
    const variants = [
      // 家モチーフ
      `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><path d="M60 220 Q140 180 220 210 T380 200" stroke="${s.accent}" stroke-width="2" fill="none" opacity="0.5"/><rect x="140" y="120" width="130" height="90" fill="#fff" stroke="#8B6F4E" stroke-width="2"/><path d="M120 120 L205 60 L290 120" fill="#B85C3E" stroke="#8B6F4E" stroke-width="2"/><rect x="180" y="150" width="40" height="60" fill="#E89B5B"/><line x1="200" y1="150" x2="200" y2="210" stroke="#8B6F4E" stroke-width="1.2"/><line x1="180" y1="180" x2="220" y2="180" stroke="#8B6F4E" stroke-width="1.2"/></svg>`,
      // 葉モチーフ
      `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><circle cx="200" cy="125" r="70" fill="${s.accent}" opacity="0.35"/><path d="M170 155 Q200 90 230 155 Q220 185 200 185 Q180 185 170 155Z" fill="${s.accent}"/><line x1="200" y1="150" x2="200" y2="185" stroke="#fff" stroke-width="1.5"/></svg>`,
      // ドキュメント
      `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><rect x="80" y="60" width="240" height="140" fill="#fff" stroke="#8B6F4E" stroke-width="2" rx="8"/><rect x="110" y="88" width="180" height="10" fill="${s.accent}" opacity="0.7" rx="2"/><line x1="110" y1="118" x2="270" y2="118" stroke="#8B6F4E" stroke-width="1.4" opacity="0.35"/><line x1="110" y1="140" x2="250" y2="140" stroke="#8B6F4E" stroke-width="1.4" opacity="0.35"/><line x1="110" y1="162" x2="220" y2="162" stroke="#8B6F4E" stroke-width="1.4" opacity="0.35"/></svg>`,
      // コイン
      `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><rect x="100" y="70" width="200" height="140" fill="#fff" stroke="#8B6F4E" stroke-width="2" rx="8"/><circle cx="200" cy="140" r="40" fill="${s.accent}" opacity="0.5"/><text x="200" y="152" text-anchor="middle" font-size="34" fill="#8B6F4E" font-family="serif">¥</text></svg>`,
    ];
    return variants[variant];
  };

  const thumbHtml = (article) => {
    if (article.eyecatch) {
      const alt = article.eyecatchAlt || article.title || '';
      return `<img src="${escapeHtml(article.eyecatch)}" alt="${escapeHtml(alt)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">`;
    }
    return fallbackThumb(article);
  };

  // ---------- Sort and pick latest 3 ----------
  const sorted = [...articles].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  const latest = sorted.slice(0, 3);

  // ---------- Render ----------
  if (latest.length === 0) {
    // 記事0件時：セクション自体を非表示（トップページはやさしく黙る）
    const section = container.closest('.lab-sec');
    if (section) section.style.display = 'none';
    return;
  }

  container.innerHTML = latest.map((a, i) => {
    const cat = catMap[a.category];
    return `
      <a href="${articleUrl(a)}" class="article-card lab-home-appear" style="animation-delay:${i * 0.08}s">
        <div class="article-thumb">${thumbHtml(a)}</div>
        <div class="article-body">
          <div class="article-meta">
            <span class="cat">${escapeHtml(cat ? cat.name : '')}</span>
            <span class="date">${formatDate(a.publishedAt)}</span>
          </div>
          <div class="article-title">${escapeHtml(a.title)}</div>
        </div>
      </a>
    `;
  }).join('');
})();
