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
    if (!data.agree) return '個人情報の取扱いへの同意が必要です';
    return null;
  };

  // ---------- Submit ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    // フォームデータを収集
    const fd = new FormData(form);
    const inquiryTypes = fd.getAll('inquiry');
    const data = {
      name: fd.get('name'),
      furigana: fd.get('furigana'),
      email: fd.get('email'),
      tel: fd.get('tel'),
      inquiryTypes: inquiryTypes,
      message: fd.get('message'),
      website: fd.get('website'), // honeypot
      agree: !!fd.get('agree'),
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
    if (!endpoint || endpoint.includes('ここに')) {
      showError('お問い合わせフォームの設定が完了していません。<br>お手数ですが、お電話 (048-782-5920) にてお問い合わせください。');
      console.warn('[contact-form] CONTACT_ENDPOINT is not configured in assets/config.js');
      return;
    }

    // 送信
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        // GASにはtext/plainで送るのがCORS的にスムーズ
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
      });

      let result = {};
      try { result = await res.json(); } catch (_) {}

      if (!res.ok || result.ok === false) {
        throw new Error(result.error || 'サーバーエラーが発生しました');
      }

      // 成功 → サンクス表示
      form.hidden = true;
      thanksView.hidden = false;
      thanksView.classList.add('in');
      window.scrollTo({ top: thanksView.offsetTop - 100, behavior: 'smooth' });

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
      window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
    });
  }
})();
