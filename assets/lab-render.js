// ============================================
// 住資産再生ラボ - 記事レンダラー
// data/articles.json を読み込んで、一覧を組み立てます
// ============================================
(async function() {
  'use strict';

  const dataUrl = 'data/articles.json';
  let data;
  try {
    const res = await fetch(dataUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
  } catch (e) {
    console.error('記事データの読み込みに失敗しました:', e);
    return;
  }

  const { categories, articles } = data;

  // ---------- Utility ----------
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00+09:00');
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  };

  // カテゴリごとの色パレット
  const catStyle = {
    green:  { bg: '#EEF2E5', accent: '#9CAF88', hex: '#7A9068' },
    brown:  { bg: '#F3ECE0', accent: '#B99A78', hex: '#8B6F4E' },
    orange: { bg: '#FBF0DC', accent: '#E89B5B', hex: '#D07E3E' },
  };

  // フォールバックサムネイル（画像がないときの装飾SVG）
  const fallbackThumb = (article) => {
    const cat = catMap[article.category] || categories[0];
    const s = catStyle[cat.color] || catStyle.brown;
    // slugのハッシュから軽くバリエーションを出す
    const seed = [...article.slug].reduce((a,c) => a + c.charCodeAt(0), 0);
    const variant = seed % 4;
    const variants = [
      // 家モチーフ
      `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><path d="M60 220 Q140 180 220 210 T380 200" stroke="${s.accent}" stroke-width="2" fill="none" opacity="0.5"/><rect x="140" y="120" width="130" height="90" fill="#fff" stroke="#8B6F4E" stroke-width="2"/><path d="M120 120 L205 60 L290 120" fill="#B85C3E" stroke="#8B6F4E" stroke-width="2"/><rect x="180" y="150" width="40" height="60" fill="#E89B5B"/><line x1="200" y1="150" x2="200" y2="210" stroke="#8B6F4E" stroke-width="1.2"/><line x1="180" y1="180" x2="220" y2="180" stroke="#8B6F4E" stroke-width="1.2"/><ellipse cx="80" cy="90" rx="10" ry="5" fill="${s.accent}" opacity="0.7" transform="rotate(-30 80 90)"/><ellipse cx="340" cy="80" rx="10" ry="5" fill="${s.accent}" opacity="0.7" transform="rotate(30 340 80)"/></svg>`,
      // 葉モチーフ
      `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><circle cx="200" cy="125" r="70" fill="${s.accent}" opacity="0.35"/><path d="M170 155 Q200 90 230 155 Q220 185 200 185 Q180 185 170 155Z" fill="${s.accent}"/><line x1="200" y1="150" x2="200" y2="185" stroke="#fff" stroke-width="1.5"/><circle cx="90" cy="50" r="8" fill="${s.accent}" opacity="0.5"/><circle cx="310" cy="200" r="10" fill="${s.accent}" opacity="0.4"/></svg>`,
      // ドキュメント/表モチーフ
      `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><rect x="80" y="60" width="240" height="140" fill="#fff" stroke="#8B6F4E" stroke-width="2" rx="8"/><rect x="110" y="88" width="180" height="10" fill="${s.accent}" opacity="0.7" rx="2"/><line x1="110" y1="118" x2="270" y2="118" stroke="#8B6F4E" stroke-width="1.4" opacity="0.35"/><line x1="110" y1="140" x2="250" y2="140" stroke="#8B6F4E" stroke-width="1.4" opacity="0.35"/><line x1="110" y1="162" x2="220" y2="162" stroke="#8B6F4E" stroke-width="1.4" opacity="0.35"/><rect x="240" y="172" width="40" height="10" fill="${s.accent}" opacity="0.5" rx="2"/></svg>`,
      // 円/コインモチーフ
      `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="250" fill="${s.bg}"/><rect x="100" y="70" width="200" height="140" fill="#fff" stroke="#8B6F4E" stroke-width="2" rx="8"/><circle cx="200" cy="140" r="40" fill="${s.accent}" opacity="0.5"/><text x="200" y="152" text-anchor="middle" font-size="34" fill="#8B6F4E" font-family="serif">¥</text><circle cx="80" cy="200" r="10" fill="${s.accent}" opacity="0.6"/><circle cx="330" cy="60" r="8" fill="${s.accent}" opacity="0.6"/></svg>`,
    ];
    return variants[variant];
  };

  const thumbHtml = (article) => {
    if (article.eyecatch) {
      const alt = article.eyecatchAlt || article.title;
      return `<img src="${article.eyecatch}" alt="${escapeHtml(alt)}" loading="lazy">`;
    }
    return fallbackThumb(article);
  };

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const articleUrl = (article) => `lab-article.html?id=${encodeURIComponent(article.slug)}`;

  // ---------- Sort ----------
  const sorted = [...articles].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  // ---------- Pickup（トップに固定・isPickup: true の最新1件） ----------
  const pickupEl = document.querySelector('[data-lab="pickup"]');
  if (pickupEl) {
    const pickup = sorted.find(a => a.isPickup) || sorted[0];
    const cat = catMap[pickup.category];
    pickupEl.innerHTML = `
      <div class="pu-thumb">${thumbHtml(pickup)}</div>
      <div>
        <span class="pickup-badge">PICKUP</span>
        <h2>${escapeHtml(pickup.title)}</h2>
        <div class="pu-meta">
          <span class="cat">${escapeHtml(cat ? cat.name : '')}</span>
          <span class="date">${formatDate(pickup.publishedAt)}</span>
        </div>
        <p class="pu-excerpt">${escapeHtml(pickup.excerpt)}</p>
        <a href="${articleUrl(pickup)}" class="btn btn-outline">記事を読む <span class="arrow">→</span></a>
      </div>
    `;
  }

  // ---------- Category tabs ----------
  const tabsEl = document.querySelector('[data-lab="cat-tabs"]');
  if (tabsEl) {
    const tabs = [
      `<button class="cat-tab active" data-cat="all">すべて</button>`,
      ...categories.map(c => `<button class="cat-tab" data-cat="${c.id}">${escapeHtml(c.name)}</button>`)
    ];
    tabsEl.innerHTML = tabs.join('');
  }

  // ---------- Article list ----------
  const PAGE_SIZE = 6;
  let currentCat = 'all';
  let currentPage = 1;

  const listEl = document.querySelector('[data-lab="list"]');
  const pagerEl = document.querySelector('[data-lab="pager"]');
  const emptyEl = document.querySelector('[data-lab="empty"]');

  const renderList = () => {
    const filtered = currentCat === 'all'
      ? sorted
      : sorted.filter(a => a.category === currentCat);

    if (!listEl) return;

    if (filtered.length === 0) {
      listEl.innerHTML = '';
      if (pagerEl) pagerEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = 1;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    listEl.innerHTML = pageItems.map((a, i) => {
      const cat = catMap[a.category];
      return `
        <a href="${articleUrl(a)}" class="al-card lab-appear" style="animation-delay:${(i % 3) * 0.08}s">
          <div class="al-thumb">${thumbHtml(a)}</div>
          <div class="al-body">
            <div class="al-meta">
              <span class="cat">${escapeHtml(cat ? cat.name : '')}</span>
              <span class="date">${formatDate(a.publishedAt)}</span>
            </div>
            <div class="al-title">${escapeHtml(a.title)}</div>
          </div>
        </a>
      `;
    }).join('');

    // Pager
    if (pagerEl) {
      if (totalPages <= 1) {
        pagerEl.innerHTML = '';
      } else {
        const pages = [];
        for (let p = 1; p <= totalPages; p++) {
          pages.push(`<a href="#" class="${p === currentPage ? 'current' : ''}" data-page="${p}">${p}</a>`);
        }
        if (currentPage < totalPages) {
          pages.push(`<a href="#" data-page="${currentPage + 1}">→</a>`);
        }
        pagerEl.innerHTML = pages.join('');
        pagerEl.querySelectorAll('a').forEach(a => {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            const p = parseInt(a.dataset.page, 10);
            if (!isNaN(p)) { currentPage = p; renderList(); scrollToList(); }
          });
        });
      }
    }

    // Fade-up の再バインド
    listEl.querySelectorAll('.fade-up').forEach(el => {
      requestAnimationFrame(() => el.classList.add('in'));
    });
  };

  const scrollToList = () => {
    const sec = document.querySelector('.article-list-sec');
    if (sec) window.scrollTo({ top: sec.offsetTop - 80, behavior: 'smooth' });
  };

  // Bind category tabs
  if (tabsEl) {
    tabsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-tab');
      if (!btn) return;
      tabsEl.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      currentPage = 1;
      renderList();
    });
  }

  renderList();

  // ---------- Popular ----------
  const popularEl = document.querySelector('[data-lab="popular"]');
  if (popularEl) {
    const popular = articles
      .filter(a => a.isPopular)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
    if (popular.length === 0) {
      // フォールバック：閲覧数上位
      popular.push(...[...articles].sort((a,b) => (b.views||0)-(a.views||0)).slice(0,5));
    }
    popularEl.innerHTML = popular.map((a, i) => {
      const cat = catMap[a.category];
      return `
        <a href="${articleUrl(a)}" class="pop-item lab-appear" style="animation-delay:${i * 0.05}s">
          <div class="pop-num">${String(i + 1).padStart(2, '0')}</div>
          <div>
            <h3>${escapeHtml(a.title)}</h3>
            <div class="pop-meta">${escapeHtml(cat ? cat.name : '')}｜${formatDate(a.publishedAt)}</div>
          </div>
        </a>
      `;
    }).join('');
  }

  // Trigger fade-up for freshly injected elements
  requestAnimationFrame(() => {
    document.querySelectorAll('[data-lab] .fade-up, .article-list-sec .fade-up').forEach(el => {
      // Reuse IntersectionObserver from common.js by dispatching
      el.classList.add('in');
    });
  });

  // ---------- Last generated timestamp (optional display) ----------
  const stampEl = document.querySelector('[data-lab="generated-at"]');
  if (stampEl && data.generatedAt) {
    const d = new Date(data.generatedAt);
    stampEl.textContent = `最終更新: ${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  }
})();
