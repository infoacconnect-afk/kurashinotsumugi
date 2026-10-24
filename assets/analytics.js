// GA4 funnel. Only fixed metadata is collected; never read contact field values.
(function () {
  'use strict';
  if (window.__tsumugiAnalyticsLoaded) return;
  window.__tsumugiAnalyticsLoaded = true;
  var measurementId = 'G-ZE6KQJMWLZ';
  var internalKey = 'tsumugi.analytics.internal.v1';
  var testKey = 'tsumugi.analytics.test.v1';
  var production = /^(www\.)?kurashinotsumugi\.com$/.test(window.location.hostname);
  var settingsPage = /^\/measurement-settings(?:\.html)?\/?$/.test(window.location.pathname);
  var pages = ['index', 'sorekara', 'korekara', 'contact', 'company', 'faq', 'lab',
    'lab-article', 'mieruka-plan', 'akiya-shindan', 'privacy', 'privacy-kurashinotsumugi',
    'sitemap', 'terms', 'terms-common', 'terms-korekara', 'terms-kurashinotsumugi',
    'terms-lab', 'terms-mieruka', 'terms-sorekara', 'terms-tsuginoakari', 'tokushoho'];

  function stored(kind, key) {
    try { return window[kind].getItem(key) === '1'; } catch (error) { return false; }
  }
  function mode() {
    if (settingsPage) return 'settings';
    if (stored('sessionStorage', testKey)) return 'test';
    if (stored('localStorage', internalKey)) return 'internal';
    return production ? 'external' : 'preview';
  }
  // A loaded tab never resumes GA4 after being muted; reload to return to normal.
  var muted = mode() !== 'external';
  window['ga-disable-' + measurementId] = muted;
  function pageName(path) {
    var name = path.replace(/^\//, '').replace(/\/$/, '').replace(/\.html$/, '') || 'index';
    return pages.indexOf(name) !== -1 ? name : 'other';
  }
  var page = pageName(window.location.pathname);
  function safePath(path) {
    return pageName(path) === 'other' ? '/other' : path;
  }
  // Explicit campaign allowlist. New campaigns must be reviewed before adding.
  // Unknown queries, fragments, click IDs, names, email and search text are omitted.
  var allowedQuery = {
    utm_source: ['an', 'fb', 'ig', 'facebook', 'instagram', 'google', 'bing', 'newsletter', 'flyer'],
    utm_medium: ['paid', 'paid_social', 'cpc', 'social', 'email', 'referral', 'offline'],
    utm_campaign: ['120256999058330367'],
    utm_id: ['120256999058330367'],
    utm_content: ['120256999058350367', '120256999147230367'],
    utm_term: ['120256999058340367', '120256999147220367']
  };
  function safeLocation() {
    var source = new URL(window.location.href);
    var clean = new URL(source.origin + safePath(source.pathname));
    Object.keys(allowedQuery).forEach(function (key) {
      var value = source.searchParams.get(key);
      if (allowedQuery[key].indexOf(value) !== -1) clean.searchParams.set(key, value);
    });
    return clean.href;
  }
  function safeReferrer() {
    try {
      var ref = new URL(document.referrer);
      if (!/^https?:$/.test(ref.protocol)) return '';
      // Keep external referral domains, but never their path, query, credentials or fragment.
      return ref.origin + (/^(www\.)?kurashinotsumugi\.com$/.test(ref.hostname) ? safePath(ref.pathname) : '/');
    } catch (error) { return ''; }
  }
  var context = {
    page_location: safeLocation(),
    page_referrer: safeReferrer(),
    page_title: 'くらしのつむぎ | ' + page,
    page_group: page
  };
  // Diagnostic entries stay in memory on this page only, with fixed metadata.
  window.tsumugiMeasurement = { getMode: mode, events: [] };
  function note(name, params) {
    if (window.tsumugiMeasurement.events.length >= 50) window.tsumugiMeasurement.events.shift();
    window.tsumugiMeasurement.events.push({ event: name, mode: mode(), params: params });
    var status = document.getElementById('tsumugi-measurement-status');
    if (status) status.textContent = '直近の確認：' + name + '（GA4には送信していません）';
  }
  function send(name, extra) {
    try {
      var params = Object.assign({ send_to: measurementId }, context, extra || {});
      if (muted || mode() !== 'external') { note(name, params); return; }
      window.gtag('event', name, params);
    } catch (error) { /* Measurement must not interrupt navigation or form submission. */ }
  }
  if (!muted) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('set', context);
    // One automatic page_view; no second manual page_view is sent.
    window.gtag('config', measurementId, context);
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(script);
  }

  var started = false;
  var completed = false;
  window.tsumugiTrackFormStart = function () {
    if (started || completed) return;
    started = true;
    send('contact_form_start', { form_id: 'contactForm' });
  };
  // Called ONLY by the existing server-success branch (or explicitly muted mock).
  window.tsumugiTrackLead = function () {
    if (completed) return;
    completed = true;
    send('generate_lead', { form_id: 'contactForm' });
  };
  window.tsumugiResetFunnel = function () { started = false; completed = false; };
  function position(link) {
    if (link.closest('header')) return 'header';
    if (link.closest('footer')) return 'footer';
    if (link.closest('.contact-cta')) return 'contact_section';
    return 'body';
  }
  document.addEventListener('click', function (event) {
    try {
      if (event.defaultPrevented || (event.button != null && event.button !== 0)) return;
      var target = event.target;
      var link = target && typeof target.closest === 'function' ? target.closest('a[href]') : null;
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') return;
      if (/^tel:/i.test(href)) { send('phone_click', { cta_position: position(link) }); return; }
      var destination = new URL(href, window.location.href);
      if (destination.origin === window.location.origin && /^\/contact(?:\.html)?\/?$/.test(destination.pathname)) {
        send('consultation_click', { cta_position: position(link), destination_page: 'contact' });
      }
    } catch (error) { /* No raw link label, URL or telephone number is sent. */ }
  });

  function showBanner() {
    if (!muted || settingsPage || document.getElementById('tsumugi-measurement-banner')) return;
    var banner = document.createElement('aside');
    banner.id = 'tsumugi-measurement-banner';
    banner.setAttribute('aria-label', '計測確認モード');
    banner.style.cssText = 'position:relative;z-index:99999;background:#fff3cd;color:#332600;padding:14px;font:16px/1.6 sans-serif;border:2px solid #a87000;';
    var label = production && mode() === 'internal' ? '社内確認：GA4計測を停止中。フォームは実際に送信されます。' :
      '送信テスト／試用環境：GA4計測を停止中。フォームは模擬送信で、メールは届きません。';
    banner.textContent = label + ' この表示は確認用ブラウザだけに出ます。';
    var status = document.createElement('div');
    status.id = 'tsumugi-measurement-status';
    status.setAttribute('aria-live', 'polite');
    banner.appendChild(status);
    var link = document.createElement('a');
    link.href = '/measurement-settings.html';
    link.textContent = '確認モードを変更する';
    banner.appendChild(link);
    document.body.appendChild(banner);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBanner);
  else showBanner();
  window.addEventListener('storage', function (event) {
    if (event.key === internalKey && stored('localStorage', internalKey)) {
      muted = true;
      window['ga-disable-' + measurementId] = true;
      showBanner();
    }
  });
})();
