// ============================================
// お問い合わせフォーム送信スクリプト
// GAS Webhook 経由でGoogleスプレッドシートに送信
// ============================================
(function() {
  'use strict';

  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const btnLabel = submitBtn.querySelector('.btn-label');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const errorEl = document.getElementById('formError');
  const thanksView = document.getElementById('thanksView');
  const resetBtn = document.getElementById('resetForm');

  // Only genuine edits/selections start the funnel; focus, prefills and honeypot do not.
  const startFields = new Set(['name', 'furigana', 'email', 'tel', 'message', 'inquiry']);
  const trackStart = (event) => {
    const field = event.target;
    if (!event.isTrusted || form.hidden || !field || field.disabled ||
        !startFields.has(field.name) || field.type === 'hidden') return;
    try {
      if (typeof window.tsumugiTrackFormStart === 'function') window.tsumugiTrackFormStart();
    } catch (error) { /* Analytics cannot break editing. */ }
  };
  form.addEventListener('input', trackStart);
  form.addEventListener('change', trackStart);
  const isMockSubmission = () => {
    // Preview hosts never send real enquiries, even when analytics is blocked.
    if (!/^(www\.)?kurashinotsumugi\.com$/.test(window.location.hostname)) return true;
    if (window.tsumugiMeasurement && window.tsumugiMeasurement.getMode() === 'test') return true;
    try { return window.sessionStorage.getItem('tsumugi.analytics.test.v1') === '1'; }
    catch (error) { return false; }
  };

  // ============================================
  // 適用規約リンクの動的表示
  // ============================================
  // 各サービスに適用される規約を定義
  const TERMS_MATRIX = {
    korekara: [
      { href: 'terms-common.html', title: 'Ac・Connect株式会社 共通利用規約' },
      { href: 'terms-kurashinotsumugi.html', title: 'くらしのつむぎ 利用規約' },
      { href: 'terms-korekara.html', title: 'これからのすまい 利用特則' },
    ],
    mieruka: [
      { href: 'terms-common.html', title: 'Ac・Connect株式会社 共通利用規約' },
      { href: 'terms-kurashinotsumugi.html', title: 'くらしのつむぎ 利用規約' },
      { href: 'terms-korekara.html', title: 'これからのすまい 利用特則' },
      { href: 'terms-mieruka.html', title: '家づくり見える化プラン 特則' },
    ],
    sorekara: [
      { href: 'terms-common.html', title: 'Ac・Connect株式会社 共通利用規約' },
      { href: 'terms-kurashinotsumugi.html', title: 'くらしのつむぎ 利用規約' },
      { href: 'terms-sorekara.html', title: 'それからのすまい 利用特則' },
    ],
    tsuginoakari: [
      { href: 'terms-common.html', title: 'Ac・Connect株式会社 共通利用規約' },
      { href: 'terms-kurashinotsumugi.html', title: 'くらしのつむぎ 利用規約' },
      { href: 'terms-sorekara.html', title: 'それからのすまい 利用特則' },
      { href: 'terms-tsuginoakari.html', title: 'つぎの明かり 利用規約' },
    ],
    shindan: [
      { href: 'terms-common.html', title: 'Ac・Connect株式会社 共通利用規約' },
      { href: 'terms-kurashinotsumugi.html', title: 'くらしのつむぎ 利用規約' },
      { href: 'terms-sorekara.html', title: 'それからのすまい 利用特則' },
    ],
    other: [
      { href: 'terms-common.html', title: 'Ac・Connect株式会社 共通利用規約' },
      { href: 'terms-kurashinotsumugi.html', title: 'くらしのつむぎ 利用規約' },
    ],
    tel: [
      { href: 'terms-common.html', title: 'Ac・Connect株式会社 共通利用規約' },
      { href: 'terms-kurashinotsumugi.html', title: 'くらしのつむぎ 利用規約' },
    ],
  };

  // どのサービス選択で第三者提供同意欄を表示するか
  const THIRD_PARTY_SERVICES = new Set(['korekara', 'mieruka', 'sorekara', 'tsuginoakari', 'shindan']);

  const appliedTermsList = document.getElementById('appliedTermsList');
  const thirdPartyBox = document.getElementById('thirdPartyAgreementBox');
  const agreeThirdParty = document.getElementById('agreeThirdParty');

  function updateAppliedTerms() {
    if (!appliedTermsList) return;
    const checked = Array.from(form.querySelectorAll('input[name="inquiry"]:checked')).map(i => i.value);
    // 重複を排除しつつマージ
    const seen = new Set();
    const merged = [];
    // 選択された項目に対応する規約を全て集約（未選択時はデフォルトのcommon+kurashinotsumugi）
    const services = checked.length ? checked : ['other'];
    services.forEach(s => {
      (TERMS_MATRIX[s] || []).forEach(t => {
        if (!seen.has(t.href)) {
          seen.add(t.href);
          merged.push(t);
        }
      });
    });
    // プライバシー系は個人情報同意ブロックで扱うため規約リストには含めない
    appliedTermsList.innerHTML = merged.map(t =>
      `<li><a href="${t.href}" target="_blank" rel="noopener">${t.title}</a></li>`
    ).join('');

    // 第三者提供同意欄の表示切替
    const showThirdParty = checked.some(s => THIRD_PARTY_SERVICES.has(s));
    if (thirdPartyBox) {
      thirdPartyBox.hidden = !showThirdParty;
      if (!showThirdParty && agreeThirdParty) agreeThirdParty.checked = false;
    }
  }

  // 初期表示 & チェック変更時
  updateAppliedTerms();
  form.querySelectorAll('input[name="inquiry"]').forEach(el => {
    el.addEventListener('change', updateAppliedTerms);
  });

  // ---------- Helpers ----------
  const showError = (msg) => {
    errorEl.innerHTML = `<strong>入力内容をご確認ください</strong><br>${msg}`;
    errorEl.hidden = false;
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const clearError = () => {
    errorEl.hidden = true;
    errorEl.textContent = '';
    document.querySelectorAll('.form-field.error').forEach(el => el.classList.remove('error'));
  };

  const setLoading = (loading) => {
    submitBtn.disabled = loading;
    btnLabel.hidden = loading;
    btnLoading.hidden = !loading;
  };

  const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  // ---------- クライアント側バリデーション ----------
  const validate = (data) => {
    if (!data.name || !data.name.trim()) return 'お名前をご入力ください';
    if (!data.furigana || !data.furigana.trim()) return 'ふりがなをご入力ください';
    if (!data.email || !isValidEmail(data.email)) return 'メールアドレスの形式が正しくありません';
    if (data.tel && !/^[\d\-\+\(\)\s]+$/.test(data.tel)) return '電話番号の形式が正しくありません';
    if (data.message && data.message.length > 5000) return 'ご相談内容は5000文字以内でご入力ください';
    if (!data.agreeTerms) return '利用規約への同意が必要です';
    if (!data.agreePrivacy) return '個人情報の取扱いへの同意が必要です';
    return null;
  };

  // ---------- Submit ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Ignore repeated submissions while sending or showing a completed enquiry.
    if (submitBtn.disabled || form.hidden) return;
    clearError();

    // フォームデータを収集
    const fd = new FormData(form);
    const inquiryTypes = fd.getAll('inquiry');
    // 適用規約リスト（同意履歴の記録用）
    const appliedTermsSet = new Set();
    const services = inquiryTypes.length ? inquiryTypes : ['other'];
    services.forEach(s => {
      (TERMS_MATRIX[s] || []).forEach(t => appliedTermsSet.add(t.title));
    });
    const data = {
      name: fd.get('name'),
      furigana: fd.get('furigana'),
      email: fd.get('email'),
      tel: fd.get('tel'),
      // Keep existing service codes; send the new service as a readable label for the current receiver.
      inquiryTypes: inquiryTypes.map(type => type === 'tsuginoakari' ? 'つぎの明かり（空き家の見守り）' : type),
      message: fd.get('message'),
      website: fd.get('website'), // honeypot
      // 同意情報
      agreeTerms: !!fd.get('agreeTerms'),
      agreePrivacy: !!fd.get('agreePrivacy'),
      // 既存GASが受け取る同意項目。両方の必須同意がある場合のみtrue。
      agree: !!fd.get('agreeTerms') && !!fd.get('agreePrivacy'),
      agreeThirdParty: !!fd.get('agreeThirdParty'),
      appliedTerms: Array.from(appliedTermsSet),
      consentedAt: new Date().toISOString(),
      termsVersion: '2026-08-18',
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    };

    // バリデーション
    const errMsg = validate(data);
    if (errMsg) {
      showError(errMsg);
      return;
    }

    // 送信先URLチェック
    const endpoint = (window.SITE_CONFIG && window.SITE_CONFIG.CONTACT_ENDPOINT) || '';
    const mockSubmission = isMockSubmission();
    if (!mockSubmission && (!endpoint || endpoint.includes('ここに'))) {
      showError('お問い合わせフォームの設定が完了していません。<br>お手数ですが、お電話 (048-782-5920) にてお問い合わせください。');
      console.warn('[contact-form] CONTACT_ENDPOINT is not configured in assets/config.js');
      return;
    }

    // 送信
    setLoading(true);

    try {
      const res = mockSubmission ? { ok: true, json: async () => ({ ok: true }) } : await fetch(endpoint, {
        method: 'POST',
        // GASにはtext/plainで送るのがCORS的にスムーズ
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok || !result || result.ok !== true) {
        throw new Error((result && result.error) || 'サーバーエラーが発生しました');
      }

      // 成功 → サンクス表示
      form.hidden = true;
      thanksView.hidden = false;
      thanksView.classList.add('in');
      if (mockSubmission) {
        const heading = thanksView.querySelector('h2');
        if (heading) heading.textContent = '送信テストが完了しました';
        thanksView.querySelectorAll('p').forEach((p, index) => {
          p.textContent = index === 0 ? '模擬送信です。お問い合わせの受付・メール送信・GA4への送信は行っていません。' : '';
        });
      }
      window.scrollTo({ top: thanksView.offsetTop - 100, behavior: 'smooth' });

      // GA4: count only the server-acknowledged successful enquiry.
      try {
        if (typeof window.tsumugiTrackLead === 'function') {
          window.tsumugiTrackLead();
        }
      } catch (e) {
        console.warn('[analytics] lead measurement failed');
      }

      // OpenAI Q コンバージョン計測: 問い合わせ完了
      try {
        if (!mockSubmission && typeof window.oaiq === 'function') {
          window.oaiq('measure', 'registration_completed', { type: 'customer_action' });
        }
      } catch (e) {
        console.warn('[oaiq] measure failed:', e);
      }

    } catch (err) {
      console.error('[contact-form] Submit failed:', err);
      showError(
        '送信中にエラーが発生しました。<br>' +
        'お手数ですが、時間をおいて再度お試しいただくか、<br>' +
        'お電話 (048-782-5920) にてお問い合わせください。'
      );
      setLoading(false);
    }
  });

  // ---------- 「もう一度お問い合わせする」ボタン ----------
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      form.hidden = false;
      thanksView.hidden = true;
      setLoading(false);
      clearError();
      try {
        if (typeof window.tsumugiResetFunnel === 'function') window.tsumugiResetFunnel();
      } catch (error) { /* Reset must work even if analytics is unavailable. */ }
      window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
    });
  }
})();


