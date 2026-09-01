/**
 * ============================================
 * くらしのつむぎ お問い合わせフォーム GAS
 * ============================================
 * 
 * 【機能】
 *   1. サイトのお問い合わせフォームからのPOST受信
 *   2. スプレッドシートへの自動記録
 *   3. お客様への自動返信メール送信
 *   4. 管理者への新着通知メール送信
 *   5. honeypot によるスパム対策
 * 
 * 【設定】
 *   下記の CONFIG セクションを編集してください
 * ============================================
 */


// ==============================
// ⚙️ 設定（ここを編集してください）
// ==============================
const CONFIG = {
  // 📊 記録先スプレッドシートID
  // (スプレッドシートURLの https://docs.google.com/spreadsheets/d/【この部分】/edit の【】部分)
  SPREADSHEET_ID: 'ここに スプレッドシートID を貼り付け',

  // 📊 記録するシート名（スプレッドシート下部のタブ名）
  SHEET_NAME: 'お問い合わせ',

  // 📧 管理者への新着通知メール宛先（複数可、カンマ区切り）
  ADMIN_EMAIL: 'info@ac-c.co.jp',

  // 📧 差出人の表示名（お客様に届くメールの「差出人」欄に表示される名前）
  FROM_NAME: 'くらしのつむぎ（Ac・Connect株式会社）',

  // 📧 返信先メールアドレス（お客様が「返信」を押したときの宛先）
  REPLY_TO: 'info@ac-c.co.jp',

  // 🌐 サイトURL（自動返信メール内で使用）
  SITE_URL: 'https://kurashinotsumugi.com/',

  // 🏢 会社情報（自動返信メール内で使用）
  COMPANY: {
    name: 'Ac・Connect株式会社',
    brand: 'くらしのつむぎ',
    tagline: 'これからのすまい、それからのすまい。',
    address: '〒331-0814 埼玉県さいたま市北区東大成町1丁目651-13 加藤ビル 1階',
    tel: '048-782-5920',
    hours: '平日 9:00 - 18:00（土日祝、事前予約制）'
  },

  // 🌐 CORS許可オリジン（サイトドメインのみ許可）
  ALLOWED_ORIGINS: [
    'https://kurashinotsumugi.com',
    'https://www.kurashinotsumugi.com'
    // ローカルテスト時に一時的に追加してもOK: 'http://localhost:8080'
  ],
};


// ==============================
// 📝 相談種類のマッピング
// ==============================
const INQUIRY_TYPES = {
  'korekara': '🏠 これからのすまい（家づくり）',
  'sorekara': '🌿 それからのすまい（空き家・実家）',
  'mieruka': '📐 家づくり見える化プラン',
  'shindan': '🩺 空き家負担ゼロ診断について',
  'other': '💬 その他のご相談',
  'tel': '📞 まずは電話で話したい'
};


// ==============================
// 🌐 メインエンドポイント
// ==============================

/**
 * POST リクエストの受信（サイトからのお問い合わせを受信）
 */
function doPost(e) {
  try {
    // ------ Bodyパース ------
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
    }

    // ------ honeypot（スパム対策） ------
    // 人間には見えない「website」欄に値が入っていたらスパム
    if (data.website && data.website.length > 0) {
      Logger.log('Spam blocked (honeypot triggered): ' + JSON.stringify(data));
      // スパムには成功レスポンスを返す(相手に対策を悟らせないため)
      return jsonResponse({ ok: true, message: '送信しました' });
    }

    // ------ バリデーション ------
    const validation = validate(data);
    if (!validation.ok) {
      return jsonResponse({ ok: false, error: validation.message }, 400);
    }

    // ------ 正規化 ------
    const record = normalize(data);

    // ------ スプレッドシートに記録 ------
    saveToSheet(record);

    // ------ 自動返信メール（お客様へ） ------
    sendAutoReply(record);

    // ------ 新着通知メール（管理者へ） ------
    sendAdminNotification(record);

    // ------ 成功レスポンス ------
    return jsonResponse({
      ok: true,
      message: 'お問い合わせありがとうございます。'
    });

  } catch (err) {
    Logger.log('ERROR: ' + err.toString());
    Logger.log(err.stack);
    return jsonResponse({
      ok: false,
      error: 'システムエラーが発生しました。時間をおいてもう一度お試しください。'
    }, 500);
  }
}


/**
 * GETリクエストへの応答（動作確認用）
 */
function doGet(e) {
  return jsonResponse({
    ok: true,
    service: 'くらしのつむぎ お問い合わせフォーム',
    version: '1.0',
    time: new Date().toISOString()
  });
}


// ==============================
// 🛡️ バリデーション
// ==============================
function validate(data) {
  if (!data.name || data.name.trim().length === 0) {
    return { ok: false, message: 'お名前が入力されていません' };
  }
  if (data.name.length > 100) {
    return { ok: false, message: 'お名前が長すぎます' };
  }
  if (!data.email || !isValidEmail(data.email)) {
    return { ok: false, message: 'メールアドレスの形式が正しくありません' };
  }
  if (data.tel && !/^[\d\-\+\(\)\s]+$/.test(data.tel)) {
    return { ok: false, message: '電話番号の形式が正しくありません' };
  }
  if (data.message && data.message.length > 5000) {
    return { ok: false, message: 'メッセージが長すぎます（5000文字以内）' };
  }
  if (!data.agree) {
    return { ok: false, message: '個人情報の取扱いに同意してください' };
  }
  return { ok: true };
}


function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}


// ==============================
// 📋 データ正規化
// ==============================
function normalize(data) {
  const now = new Date();
  const inquiryTypes = Array.isArray(data.inquiryTypes)
    ? data.inquiryTypes.map(t => INQUIRY_TYPES[t] || t).join(' / ')
    : '';

  return {
    submittedAt: now,
    name: (data.name || '').trim(),
    furigana: (data.furigana || '').trim(),
    email: (data.email || '').trim(),
    tel: (data.tel || '').trim(),
    inquiryTypes: inquiryTypes,
    inquiryTypesRaw: data.inquiryTypes || [],
    message: (data.message || '').trim(),
    userAgent: data.userAgent || '',
    referrer: data.referrer || '',
  };
}


// ==============================
// 📊 スプレッドシートに記録
// ==============================
function saveToSheet(record) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  // シートが存在しなければ作成
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    initSheet(sheet);
  }

  // ヘッダーがなければ初期化
  if (sheet.getLastRow() === 0) {
    initSheet(sheet);
  }

  // 行を追加
  sheet.appendRow([
    record.submittedAt,             // A: 受信日時
    record.name,                    // B: お名前
    record.furigana,                // C: フリガナ
    record.email,                   // D: メール
    record.tel,                     // E: 電話番号
    record.inquiryTypes,            // F: 相談種類
    record.message,                 // G: 内容
    '未対応',                        // H: 対応状況（担当者が更新）
    '',                             // I: 担当者
    '',                             // J: 対応メモ
    record.referrer,                // K: 参照元
    record.userAgent                // L: UA
  ]);

  // 最新行を色付け（未対応=薄オレンジ）
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 8).setBackground('#FFF6E9');
}


/**
 * シート初期化（ヘッダー行の作成）
 */
function initSheet(sheet) {
  const headers = [
    '受信日時', 'お名前', 'フリガナ', 'メール', '電話番号',
    '相談種類', 'お問い合わせ内容',
    '対応状況', '担当者', '対応メモ',
    '参照元', 'UA'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // ヘッダーのスタイル
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#8B6F4E');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');

  // 列幅の調整
  sheet.setColumnWidth(1, 130);  // 受信日時
  sheet.setColumnWidth(2, 120);  // お名前
  sheet.setColumnWidth(3, 120);  // フリガナ
  sheet.setColumnWidth(4, 200);  // メール
  sheet.setColumnWidth(5, 120);  // 電話番号
  sheet.setColumnWidth(6, 250);  // 相談種類
  sheet.setColumnWidth(7, 400);  // 内容
  sheet.setColumnWidth(8, 90);   // 対応状況
  sheet.setColumnWidth(9, 100);  // 担当者
  sheet.setColumnWidth(10, 300); // メモ
  sheet.setColumnWidth(11, 200); // 参照元
  sheet.setColumnWidth(12, 200); // UA

  // 1行目を固定
  sheet.setFrozenRows(1);

  // 対応状況列にプルダウン設定
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['未対応', '対応中', '対応済', '不要', '保留'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 8, 1000, 1).setDataValidation(rule);

  // 折返し表示
  sheet.getRange(1, 7, 1000, 1).setWrap(true);
}


// ==============================
// 📧 自動返信メール（お客様へ）
// ==============================
function sendAutoReply(record) {
  const subject = `【${CONFIG.COMPANY.brand}】お問い合わせありがとうございます`;

  const textBody = buildAutoReplyText(record);
  const htmlBody = buildAutoReplyHtml(record);

  MailApp.sendEmail({
    to: record.email,
    subject: subject,
    body: textBody,
    htmlBody: htmlBody,
    name: CONFIG.FROM_NAME,
    replyTo: CONFIG.REPLY_TO
  });
}


function buildAutoReplyText(record) {
  const c = CONFIG.COMPANY;
  return `${record.name} 様

このたびは、${c.brand}にお問い合わせいただき、
まことにありがとうございます。

以下の内容でお問い合わせを受け付けいたしました。
担当者より2営業日以内にご連絡いたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【お名前】
${record.name}${record.furigana ? '（' + record.furigana + '）' : ''}

【メールアドレス】
${record.email}

${record.tel ? '【電話番号】\n' + record.tel + '\n' : ''}
${record.inquiryTypes ? '【ご相談の内容】\n' + record.inquiryTypes + '\n' : ''}
【ご相談内容の詳細】
${record.message || '（未入力）'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ご相談は無料です。急かすことはありません。
どうぞ、ゆっくりとお待ちください。

もしお急ぎの場合や、直接お話ししたい場合は、
お電話でもご相談を承っております。

📞 お電話: ${c.tel}
   受付時間: ${c.hours}

このメールに心当たりがない場合、恐れ入りますが、
このまま破棄していただけますようお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${c.brand}
${c.tagline}

${c.name}
${c.address}
TEL: ${c.tel}
Web: ${CONFIG.SITE_URL}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}


function buildAutoReplyHtml(record) {
  const c = CONFIG.COMPANY;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>お問い合わせありがとうございます</title></head>
<body style="margin:0;padding:0;background:#FBF7F0;font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;color:#3D3227;line-height:1.9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7F0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(139,111,78,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#F5E8D0 0%,#EEF2E5 100%);padding:40px 40px 32px;text-align:center;">
              <div style="font-size:12px;letter-spacing:0.24em;color:#7A9068;font-weight:600;margin-bottom:12px;">— THANK YOU —</div>
              <h1 style="margin:0;font-size:22px;color:#6B5238;letter-spacing:0.04em;line-height:1.5;font-weight:500;">
                お問い合わせありがとうございます
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 8px;">
              <p style="margin:0 0 12px;font-size:16px;color:#6B5238;font-weight:500;">
                ${esc(record.name)} 様
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:2;color:#3D3227;">
                このたびは、<strong style="color:#6B5238;">${esc(c.brand)}</strong>にお問い合わせいただき、まことにありがとうございます。
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:2;color:#3D3227;">
                以下の内容でお問い合わせを受け付けいたしました。<br>
                担当者より<strong style="background:linear-gradient(transparent 65%,rgba(232,155,91,0.28) 65%);padding:0 2px;">2営業日以内</strong>にご連絡いたします。
              </p>
            </td>
          </tr>

          <!-- Received Content -->
          <tr>
            <td style="padding:8px 40px 32px;">
              <div style="background:#FBF7F0;border-radius:14px;padding:24px 28px;border-left:4px solid #E89B5B;">
                <div style="font-size:13px;color:#9A8E80;letter-spacing:0.12em;margin-bottom:12px;">受付内容</div>

                <div style="margin-bottom:14px;">
                  <div style="font-size:12px;color:#6B5238;font-weight:600;margin-bottom:4px;">お名前</div>
                  <div style="font-size:15px;color:#3D3227;">${esc(record.name)}${record.furigana ? '（' + esc(record.furigana) + '）' : ''}</div>
                </div>

                <div style="margin-bottom:14px;">
                  <div style="font-size:12px;color:#6B5238;font-weight:600;margin-bottom:4px;">メールアドレス</div>
                  <div style="font-size:15px;color:#3D3227;">${esc(record.email)}</div>
                </div>

                ${record.tel ? `
                <div style="margin-bottom:14px;">
                  <div style="font-size:12px;color:#6B5238;font-weight:600;margin-bottom:4px;">電話番号</div>
                  <div style="font-size:15px;color:#3D3227;">${esc(record.tel)}</div>
                </div>` : ''}

                ${record.inquiryTypes ? `
                <div style="margin-bottom:14px;">
                  <div style="font-size:12px;color:#6B5238;font-weight:600;margin-bottom:4px;">ご相談の内容</div>
                  <div style="font-size:14px;color:#3D3227;">${esc(record.inquiryTypes)}</div>
                </div>` : ''}

                <div style="margin-bottom:0;">
                  <div style="font-size:12px;color:#6B5238;font-weight:600;margin-bottom:4px;">ご相談内容の詳細</div>
                  <div style="font-size:14px;color:#3D3227;line-height:1.9;white-space:pre-wrap;">${esc(record.message || '（未入力）')}</div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:linear-gradient(135deg,#EEF2E5 0%,#DDE7CE 100%);border-radius:14px;padding:24px 28px;">
                <p style="margin:0 0 12px;font-size:15px;color:#6B5238;font-weight:600;">🌱 ご相談は無料です。急かすことはありません。</p>
                <p style="margin:0;font-size:14px;line-height:1.9;color:#3D3227;">
                  どうぞ、ゆっくりとお待ちください。<br>
                  お急ぎの場合や、直接お話ししたい場合は、お電話でもご相談を承っております。
                </p>
              </div>
            </td>
          </tr>

          <!-- Tel -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <div style="display:inline-block;background:#ffffff;border:1.5px solid #A88A6A;border-radius:999px;padding:16px 32px;">
                <div style="font-size:11px;color:#9A8E80;margin-bottom:2px;">📞 お電話でのご相談</div>
                <div style="font-size:20px;font-weight:700;color:#6B5238;letter-spacing:0.04em;">${esc(c.tel)}</div>
                <div style="font-size:11px;color:#9A8E80;margin-top:2px;">${esc(c.hours)}</div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#4E3E2F;padding:32px 40px;text-align:center;color:#D9CDB6;">
              <div style="font-size:16px;font-weight:600;color:#ffffff;margin-bottom:4px;letter-spacing:0.06em;">${esc(c.brand)}</div>
              <div style="font-size:12px;color:#A89880;margin-bottom:16px;letter-spacing:0.08em;">${esc(c.tagline)}</div>
              <div style="font-size:11px;color:#A89880;line-height:1.8;">
                ${esc(c.name)}<br>
                ${esc(c.address)}<br>
                TEL: ${esc(c.tel)}<br>
                <a href="${esc(CONFIG.SITE_URL)}" style="color:#D9CDB6;text-decoration:underline;">${esc(CONFIG.SITE_URL)}</a>
              </div>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding:16px 40px 0;text-align:center;">
              <div style="font-size:11px;color:#9A8E80;line-height:1.8;">
                このメールは自動送信です。<br>
                心当たりがない場合は、恐れ入りますがこのまま破棄してください。
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


// ==============================
// 📧 新着通知メール（管理者へ）
// ==============================
function sendAdminNotification(record) {
  const subject = `【新着お問い合わせ】${record.name} 様｜${CONFIG.COMPANY.brand}`;

  const textBody = buildAdminNotificationText(record);
  const htmlBody = buildAdminNotificationHtml(record);

  MailApp.sendEmail({
    to: CONFIG.ADMIN_EMAIL,
    subject: subject,
    body: textBody,
    htmlBody: htmlBody,
    name: CONFIG.COMPANY.brand + ' フォーム通知',
    replyTo: record.email  // 返信するとお客様に直接届く
  });
}


function buildAdminNotificationText(record) {
  const formatted = Utilities.formatDate(record.submittedAt, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
  return `【新着お問い合わせ】

▼ 受信日時
${formatted}

▼ お名前
${record.name}${record.furigana ? '（' + record.furigana + '）' : ''}

▼ メールアドレス
${record.email}

▼ 電話番号
${record.tel || '（未入力）'}

▼ ご相談の内容
${record.inquiryTypes || '（未選択）'}

▼ ご相談内容の詳細
${record.message || '（未入力）'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 スプレッドシートを開く:
https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit

このメールに「返信」すると、そのままお客様に返信できます。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}


function buildAdminNotificationHtml(record) {
  const formatted = Utilities.formatDate(record.submittedAt, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}/edit`;

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FBF7F0;font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;color:#3D3227;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7F0;padding:30px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#E89B5B;padding:24px 32px;">
              <div style="color:#ffffff;font-size:12px;letter-spacing:0.16em;margin-bottom:6px;font-weight:600;">📬 NEW INQUIRY</div>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">新着お問い合わせがあります</h1>
            </td>
          </tr>

          <!-- Meta -->
          <tr>
            <td style="padding:20px 32px 0;">
              <div style="font-size:12px;color:#9A8E80;margin-bottom:16px;">
                📅 受信日時：<strong style="color:#3D3227;">${esc(formatted)}</strong>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:8px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                ${row('お名前', esc(record.name) + (record.furigana ? '（' + esc(record.furigana) + '）' : ''))}
                ${row('メール', `<a href="mailto:${esc(record.email)}" style="color:#D07E3E;">${esc(record.email)}</a>`)}
                ${row('電話番号', record.tel ? `<a href="tel:${esc(record.tel)}" style="color:#D07E3E;">${esc(record.tel)}</a>` : '<span style="color:#9A8E80;">（未入力）</span>')}
                ${row('ご相談内容', esc(record.inquiryTypes) || '<span style="color:#9A8E80;">（未選択）</span>')}
              </table>

              <div style="margin-top:20px;background:#FBF7F0;border-left:4px solid #E89B5B;border-radius:0 12px 12px 0;padding:18px 22px;">
                <div style="font-size:12px;color:#6B5238;font-weight:600;margin-bottom:8px;">ご相談内容の詳細</div>
                <div style="font-size:14px;line-height:1.9;color:#3D3227;white-space:pre-wrap;">${esc(record.message || '（未入力）')}</div>
              </div>
            </td>
          </tr>

          <!-- Actions -->
          <tr>
            <td style="padding:8px 32px 32px;text-align:center;">
              <a href="${sheetUrl}" style="display:inline-block;background:#8B6F4E;color:#ffffff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:600;">
                📋 スプレッドシートを開く
              </a>
              <div style="margin-top:14px;font-size:12px;color:#9A8E80;line-height:1.8;">
                このメールに「返信」すると、<br>そのままお客様に返信できます。
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(label, value) {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #F0E7D5;width:100px;font-size:12px;color:#6B5238;font-weight:600;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid #F0E7D5;font-size:14px;color:#3D3227;">${value}</td>
  </tr>`;
}


// ==============================
// 🔧 ユーティリティ
// ==============================
function jsonResponse(obj, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ==============================
// 🧪 テスト関数（GASエディタで手動実行して動作確認）
// ==============================
function testSubmission() {
  const mockData = {
    postData: {
      contents: JSON.stringify({
        name: 'テスト太郎',
        furigana: 'テストタロウ',
        email: 'test@example.com',
        tel: '048-782-5920',
        inquiryTypes: ['korekara', 'mieruka'],
        message: 'テスト送信です。\n改行のテスト。\n\n・箇条書き\n・のテスト',
        agree: true,
        website: '' // honeypot
      })
    }
  };

  const result = doPost(mockData);
  Logger.log(result.getContent());
}


function testSpamBlock() {
  const mockData = {
    postData: {
      contents: JSON.stringify({
        name: 'スパム',
        email: 'spam@example.com',
        message: 'buy cheap medication',
        agree: true,
        website: 'http://spam.example.com' // honeypotに引っかかる
      })
    }
  };

  const result = doPost(mockData);
  Logger.log('スパムブロック結果: ' + result.getContent());
  Logger.log('※スパムには成功レスポンスが返るのが正しい動作です');
}
