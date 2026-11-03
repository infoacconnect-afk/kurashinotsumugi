import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
function setup() {
  const dom = new JSDOM(read('akiya-shindan.html'), { runScripts: 'outside-only' });
  const queue = [];
  dom.window.setTimeout = fn => { queue.push(fn); return queue.length; };
  dom.window.clearTimeout = () => {};
  dom.window.fetch = () => { throw Error('No diagnosis request allowed'); };
  dom.window.eval(read('assets/diagnosis.js').replace('  renderStep();\n})();', '  window.testDiagnosis = { questions, resultFor };\n  renderStep();\n})();'));
  return { dom, queue, ...dom.window.testDiagnosis };
}
test('all 640 diagnosis combinations respect wishes and qualify burden-zero guidance', () => {
  const { dom, questions, resultFor } = setup();
  try {
    let cases = [[]];
    for (const q of questions) cases = cases.flatMap(a => q.options.map(o => [...a, o.v]));
    assert.equal(cases.length, 640);
    for (const values of cases) {
      const result = resultFor(values);
      assert.equal(result.direction, values[4]);
      assert(result.title && result.lead && result.reason && result.action);
      assert(result.checks.length >= 4 && result.checks.every(Boolean));
      if (values[4] === 'utilize') {
        assert.match(result.action, /借上げ/);
        assert(result.checks.some(x => /持ち出しをゼロにできるか確認/.test(x)));
        if (values[2] === 'unknown') assert.match(result.title, /まず状態の確認/);
        if (['poor', 'repair'].includes(values[2])) assert.match(result.title, /修繕の確認/);
        if (values[1] === 'rent') assert(result.checks.some(x => /現在の賃貸契約/.test(x)));
      } else if (values[4] === 'sell') {
        assert.match(result.action, /手放す/);
        assert.doesNotMatch(result.action, /借上げ/);
      } else if (values[4] === 'keep') {
        assert.match(result.action, /残す/);
        assert.doesNotMatch(result.action, /借上げ/);
      }
      assert.doesNotMatch(JSON.stringify(result), /ゼロになります|ゼロにできます|借上げできます|賃貸活用がおすすめ/);
      assert.match(result.checks.at(-1), values[0] === 'kanto' ? /関東を中心/ : /全国一律の対応をお約束するものではありません/);
    }
  } finally { dom.window.close(); }
});
test('diagnosis buttons, back, clarification, results and restart work without storing or sending answers', () => {
  const { dom, queue } = setup();
  const d = dom.window.document;
  const click = index => { d.querySelectorAll('.sim-option')[index].click(); queue.shift()(); };
  try {
    assert.equal(d.querySelectorAll('.sim-option').length, 2);
    click(0); assert.match(d.querySelector('#simQuestion').textContent, /どのように使われ/);
    click(0); assert.equal(d.querySelector('#simQuestion').textContent, '建物の状態を教えてください。');
    d.querySelector('#simBack').click(); assert.equal(d.querySelector('#stepNum').textContent, '2');
    click(3); click(3);
    assert.equal(d.querySelector('#questionHelp').hidden, false);
    assert.match(d.querySelector('#questionHelp').textContent, /固定資産税/);
    click(0); click(2);
    assert(d.querySelector('#simResult').classList.contains('active'));
    assert.match(d.querySelector('#resultTitle').textContent, /まず状態の確認/);
    assert.match(d.querySelector('#resultSuggestions').textContent, /現在の賃貸契約/);
    assert.equal(d.querySelector('#resultConsult').getAttribute('href'), 'contact.html?service=shindan');
    assert.match(d.querySelector('.result-note').textContent, /費用や借上げ賃料を計算するものではありません/);
    d.querySelector('#restart').click();
    assert.equal(d.querySelector('#stepNum').textContent, '1');
    assert.equal(d.querySelector('.sim-option.selected'), null);
    assert.equal(d.querySelector('#simResult').classList.contains('active'), false);
    assert.doesNotMatch(read('assets/diagnosis.js'), /localStorage|sessionStorage|fetch\(|sendBeacon|XMLHttpRequest/);
  } finally { dom.window.close(); }
});
