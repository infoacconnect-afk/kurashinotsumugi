(function () {
  'use strict';
  const questions = [
    { name: '所在地について', q: '気になっているお宅は、どちらにありますか？', options: [
      { label: '関東（埼玉県・東京都・神奈川県・千葉県・茨城県・栃木県・群馬県）', v: 'kanto' },
      { label: '関東以外の地域（所在地により個別にご相談）', v: 'outside_kanto' }
    ] },
    { name: '利用状況', q: '現在、お宅はどのように使われていますか？', options: [
      { label: '誰も住んでおらず、ほとんど利用していない', v: 'vacant' },
      { label: '帰省などで、ときどき利用している', v: 'sometimes' },
      { label: '自分や家族が住んでいる', v: 'occupied' },
      { label: '人に貸している', v: 'rent' },
      { label: '詳しくは分からない', v: 'unknown' }
    ] },
    { name: '建物の状態', q: '建物の状態を教えてください。', options: [
      { label: '大きな修繕をせずに住めそう', v: 'good' },
      { label: '一部に修繕が必要そう', v: 'repair' },
      { label: '傷みが大きく、そのまま住むのは難しそう', v: 'poor' },
      { label: '詳しくは分からない', v: 'unknown' }
    ] },
    { name: '維持・管理の負担', q: 'お宅の維持や管理に、どのくらい負担を感じていますか？',
      help: '固定資産税などの費用、掃除・草木の手入れ、見に行く手間などを含めてお考えください。', options: [
        { label: '大きな負担を感じている', v: 'heavy' },
        { label: '多少の負担を感じている', v: 'medium' },
        { label: 'あまり負担を感じていない', v: 'light' },
        { label: 'まだ把握できていない', v: 'unknown' }
      ] },
    { name: '今後の希望', q: 'お宅の今後について、今のお気持ちに近いものを教えてください。', options: [
      { label: '売却など、手放すことを考えたい', v: 'sell' },
      { label: '自分や家族で使いたい・残しておきたい', v: 'keep' },
      { label: '所有したまま、誰かに貸して活用したい', v: 'utilize' },
      { label: 'まだ決めていない・選択肢を知りたい', v: 'undecided' }
    ] }
  ];

  // The owner's wishes select the direction. Other answers qualify the next
  // checks; they never override the wish or imply financial/contract approval.
  function resultFor([loc, use, condition, burden, wish]) {
    let title, lead, reason, action;
    const checks = [];
    if (wish === 'utilize') {
      title = '当社の借上げで、負担ゼロを目指せるか確認しましょう';
      lead = '当社がお宅をお借りし、入居者へお貸しする「借上げ」が候補になります。借上げ条件によって、維持費の持ち出しや管理の手間をどこまで減らせるか、個別に確認します。';
      reason = '所有したまま、誰かに貸して活用したいというご希望を踏まえたご案内です。';
      action = '借上げと負担軽減について相談する';
      if (condition === 'unknown') {
        title = '借上げで負担ゼロを目指せるか、まず状態の確認から';
        checks.push('建物の状態が分かってから、借上げの可否と必要な費用を検討します。');
      } else if (condition === 'poor' || condition === 'repair') {
        title = '借上げで負担を減らせるか、修繕の確認から';
        checks.push('必要な修繕の内容・費用・負担者を確認します。改修すれば必ず借り上げられるという判定ではありません。');
      } else {
        checks.push('建物の状態と周辺の需要を調べ、借上げが可能かを確認します。');
      }
      checks.push('借上げ賃料と所有者に残る税金・保険料などを照らし合わせ、維持費の持ち出しをゼロにできるか確認します。');
      checks.push('管理・設備修繕・大規模修繕などの担当と費用分担、賃料の支払期間・条件を確認します。');
    } else if (wish === 'sell') {
      title = '手放すことで、維持負担をなくす道を検討しましょう';
      lead = '売却などで所有を終えることで、継続する維持・管理の負担をなくす方向が候補になります。売却までの費用や手続きに必要な費用も含めて確認します。';
      reason = '手放すことを考えたいというご希望を踏まえたご案内です。貸すことを前提にはしません。';
      action = '手放す方法と負担軽減について相談する';
      checks.push('売却の見通しと、売却までにかかる維持費・整理費用を確認します。', '所有関係や相続の状況を整理します。相続の専門的な手続きは、提携する司法書士・税理士と連携します。');
    } else if (wish === 'keep') {
      title = 'お宅を残しながら、減らせる負担を整理しましょう';
      lead = '自分や家族で使う予定を大切にしながら、維持費や管理の手間を減らす方法を検討します。持ち続けるために必要な費用もあるため、今の回答だけで負担ゼロとは判断できません。';
      reason = '自分や家族で使いたい・残しておきたいというご希望を踏まえたご案内です。';
      action = '残す方法と負担軽減について相談する';
      checks.push('自分や家族で利用する時期・頻度と、必要な管理を整理します。', '税金・保険料・光熱費など、続ける費用と見直せる費用を確認します。');
    } else {
      title = '負担ゼロを目指せる道を、一緒に比較しましょう';
      lead = '今は方針を決めなくても大丈夫です。持ち続ける・当社の借上げを検討する・手放す、それぞれで減らせる負担と残る費用を比較します。';
      reason = 'まだ決めていない・選択肢を知りたいというお気持ちを踏まえたご案内です。';
      action = '負担を減らす選択肢について相談する';
      checks.push('お宅への思いとご家族の希望を整理します。', '各方法の費用・手間・利用上の条件を比べ、無理のない方向性を検討します。');
    }
    if (wish !== 'utilize' && condition !== 'good') {
      checks.push(condition === 'unknown' ? '建物の状態を確認し、判断に必要な情報をそろえます。' : '傷みや必要な修繕の内容を確認してから、費用や進め方を検討します。');
    }
    const useChecks = {
      vacant: '使っていない間も続く管理や費用を確認します。',
      sometimes: '帰省などで使う予定と両立できるかを確認します。',
      occupied: '現在お住まいの方の意向と利用予定を優先して確認します。',
      rent: '現在の賃貸契約と入居状況を確認します。すぐに借上げへ切り替えられるという案内ではありません。',
      unknown: '現在の居住・利用状況を確認してから検討を進めます。'
    };
    checks.push(useChecks[use]);
    const burdens = {
      heavy: '負担が大きいとのことなので、特につらい費用や作業から優先して整理します。',
      medium: '気になっている費用や作業を具体的に伺い、減らせるものを整理します。',
      light: '今の負担感を踏まえ、急いで活用方法を決めず、今後必要になりそうな費用や管理を確認します。',
      unknown: '税金・保険料・管理費など、まず現在の負担を一緒に把握します。'
    };
    reason += burdens[burden];
    checks.push(loc === 'kanto' ? '関東を中心に、所在地や物件の状況に応じて対応方法をご案内します。' : '現時点では全国一律の対応をお約束するものではありませんが、まずは物件の所在地をお知らせください。');
    return { title, lead, reason, checks, action, direction: wish };
  }

  const byId = id => document.getElementById(id);
  let current = 0;
  let answers = [];
  let timer = null;
  function renderStep() {
    const q = questions[current];
    byId('simQuestion').textContent = q.q;
    byId('questionHelp').textContent = q.help || '';
    byId('questionHelp').hidden = !q.help;
    if (q.help) byId('simQuestion').setAttribute('aria-describedby', 'questionHelp');
    else byId('simQuestion').removeAttribute('aria-describedby');
    byId('stepNum').textContent = current + 1;
    byId('stepName').textContent = q.name;
    byId('progressBar').style.width = ((current + 1) / questions.length * 100) + '%';
    byId('simOptions').replaceChildren();
    q.options.forEach((option, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sim-option' + (answers[current] === i ? ' selected' : '');
      const letter = document.createElement('span');
      letter.className = 'opt-num'; letter.textContent = String.fromCharCode(65 + i);
      const label = document.createElement('span'); label.textContent = option.label;
      button.append(letter, label);
      button.addEventListener('click', () => {
        if (timer !== null) return;
        answers[current] = i;
        byId('simOptions').querySelectorAll('.selected').forEach(x => x.classList.remove('selected'));
        button.classList.add('selected');
        timer = setTimeout(() => {
          timer = null;
          if (current < questions.length - 1) { current++; renderStep(); }
          else showResult();
        }, 260);
      });
      byId('simOptions').append(button);
    });
    byId('simBack').disabled = current === 0;
  }
  function showResult() {
    const result = resultFor(questions.map((q, i) => q.options[answers[i]].v));
    byId('simBody').style.display = 'none';
    byId('simResult').classList.add('active');
    byId('progressBar').style.width = '100%';
    byId('resultTitle').textContent = result.title;
    byId('resultLead').textContent = result.lead;
    byId('resultReason').textContent = result.reason;
    byId('resultConsult').textContent = result.action + '（診断結果を添付）';
    byId('resultSuggestions').replaceChildren(...result.checks.map(text => {
      const li = document.createElement('li'); li.textContent = text; return li;
    }));
  }
  byId('resultConsult').addEventListener('click', event => {
    if (answers.length !== questions.length) return;
    const result = resultFor(questions.map((q, i) => q.options[answers[i]].v));
    const text = ['【空き家負担ゼロ診断】',
      ...questions.map((q, i) => `${i + 1}. ${q.q}\n回答：${q.options[answers[i]].label}`),
      '', '【診断結果】', result.title, result.lead, result.reason,
      '【確認すること】', ...result.checks.map(x => '・' + x),
      '', byId('simResult').querySelector('.result-note').textContent].join('\n');
    if (window.tsumugiDiagnosisTransfer?.save(text)) {
      byId('resultConsult').href = 'contact.html?service=shindan&diagnosis=1';
    } else {
      event.preventDefault();
      const error = byId('diagnosisTransferError');
      error.hidden = false;
      error.textContent = '診断結果を引き継げませんでした。ブラウザの保存設定をご確認いただくか、結果をコピーしてお問い合わせください。';
    }
  });
  byId('simBack').addEventListener('click', () => {
    if (timer === null && current > 0) { current--; renderStep(); }
  });
  byId('restart').addEventListener('click', () => {
    clearTimeout(timer); timer = null; current = 0; answers = [];
    window.tsumugiDiagnosisTransfer?.clear();
    byId('diagnosisTransferError').hidden = true;
    byId('resultConsult').href = 'contact.html?service=shindan';
    byId('simResult').classList.remove('active');
    byId('simBody').style.display = 'block'; renderStep();
  });
  renderStep();
})();
