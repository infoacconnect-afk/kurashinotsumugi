// くらしのつむぎ - ヘッダー/フッター共通パーツ生成
(function() {
  const currentPage = document.body.dataset.page || '';

  const headerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a href="index.html" class="site-logo" aria-label="くらしのつむぎ トップへ">
          <img src="assets/logo-transparent.png" alt="くらしのつむぎ">
        </a>
        <button class="nav-toggle" aria-label="メニュー">
          <span></span><span></span><span></span>
        </button>
        <nav class="site-nav" aria-label="メインナビゲーション">
          <a href="korekara.html">これからのすまい</a>
          <a href="sorekara.html">それからのすまい</a>
          <a href="lab.html">住資産再生ラボ</a>
          <a href="company.html">会社概要</a>
          <a href="faq.html">よくある質問</a>
          <a href="contact.html" class="header-cta">ご相談はこちら</a>
        </nav>
      </div>
    </header>
  `;

  const footerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <img src="assets/logo-transparent.png" alt="くらしのつむぎ">
            <div class="company">
              Ac・Connect株式会社<br>
              〒331-0814<br>
              埼玉県さいたま市北区<br>
              東大成町1丁目651-13<br>
              加藤ビル 1階
            </div>
          </div>
          <div class="footer-col">
            <h4>サービス</h4>
            <ul>
              <li><a href="korekara.html">これからのすまい</a></li>
              <li><a href="mieruka-plan.html">家づくり見える化プラン</a></li>
              <li><a href="sorekara.html">それからのすまい</a></li>
              <li><a href="akiya-shindan.html">空き家負担ゼロ診断</a></li>
              <li><a href="lab.html">住資産再生ラボ</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>会社情報</h4>
            <ul>
              <li><a href="company.html">会社概要</a></li>
              <li><a href="faq.html">よくある質問</a></li>
              <li><a href="contact.html">お問い合わせ</a></li>
              <li><a href="sitemap.html">サイトマップ</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>規約</h4>
            <ul>
              <li><a href="privacy.html">プライバシーポリシー</a></li>
              <li><a href="tokushoho.html">特定商取引法に基づく表記</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <div>© Ac・Connect Co., Ltd. All rights reserved.</div>
          <div class="footer-sns">
            <a href="#" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor"/></svg>
            </a>
            <a href="#" aria-label="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="X">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `;

  // Insert
  const headerHost = document.getElementById('site-header-host');
  const footerHost = document.getElementById('site-footer-host');
  if (headerHost) headerHost.outerHTML = headerHTML;
  if (footerHost) footerHost.outerHTML = footerHTML;
})();
