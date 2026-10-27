// くらしのつむぎ - ヘッダー/フッター共通パーツ生成
(function() {
  const currentPage = document.body.dataset.page || '';

  const headerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a href="index.html" class="site-logo" aria-label="くらしのつむぎ トップへ">
          <img src="assets/logo-header-tm.svg" alt="くらしのつむぎ">
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
            <img src="assets/logo-header-tm.svg" alt="くらしのつむぎ">
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
              <li><a href="tsuginoakari.html">つぎの明かり（空き家の見守り）</a></li>
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
              <li><a href="terms.html">利用規約・各種規定</a></li>
              <li><a href="privacy.html">プライバシーポリシー</a></li>
              <li><a href="tokushoho.html">特定商取引法に基づく表記</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <div>© Ac・Connect Co., Ltd. All rights reserved.</div>

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

