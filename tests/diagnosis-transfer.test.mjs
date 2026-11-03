import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const key='tsumugi.diagnosis.v1';
const make=(page,query='')=>new JSDOM(read(page+'.html'),{url:'https://kurashinotsumugi.com/'+page+'.html'+query,runScripts:'outside-only'});
function setupForm(raw,query='?service=shindan&diagnosis=1') {
 const dom=make('contact',query),w=dom.window,d=w.document;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.eval(read('assets/diagnosis-transfer.js'));
 if(raw)w.sessionStorage.setItem(key,raw);
 const sent=[]; w.SITE_CONFIG={CONTACT_ENDPOINT:'https://example.test/contact'};
 w.fetch=async(_,args)=>{sent.push(JSON.parse(args.body));return {ok:true,json:async()=>({ok:true})};};
 w.eval(read('assets/contact-form.js'));
 const fill=()=>{for(const [name,value]of Object.entries({name:'テスト',furigana:'テスト',email:'test@example.test',message:'相談本文'}))d.querySelector(`[name="${name}"]`).value=value; for(const name of ['agreeTerms','agreePrivacy'])d.querySelector(`[name="${name}"]`).checked=true;};
 const submit=async()=>{d.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true}));await new Promise(r=>setImmediate(r));};
 return {dom,w,d,sent,fill,submit};
}
const payload=text=>JSON.stringify({version:1,createdAt:Date.now(),text});
test('only explicit result CTA saves all five answers and the rendered diagnosis; restart clears',()=>{
 const dom=make('akiya-shindan'),w=dom.window,d=w.document,queue=[];
 try {
 w.eval(read('assets/diagnosis-transfer.js'));w.setTimeout=fn=>{queue.push(fn);return queue.length;};
 w.eval(read('assets/diagnosis.js'));
 for(const i of [0,0,0,0,2]){d.querySelectorAll('.sim-option')[i].click();queue.shift()();assert.equal(w.sessionStorage.length,0);}
 d.querySelector('#resultConsult').addEventListener('click',e=>e.preventDefault());d.querySelector('#resultConsult').click();
 const saved=w.tsumugiDiagnosisTransfer.read();assert(saved);assert.match(saved.text,/5\. お宅の今後/);assert.match(saved.text,/当社の借上げ/);assert.match(saved.text,/費用や借上げ賃料を計算するものではありません/);assert(saved.text.length<4000);
 assert.equal(new URL(d.querySelector('#resultConsult').href).search,'?service=shindan&diagnosis=1');
 d.querySelector('#restart').click();assert.equal(w.sessionStorage.length,0);
 }finally{w.close();}
});
test('attachment is visible, consent remains unchecked, and actual request payload includes it exactly once',async()=>{
 const x=setupForm(payload('【診断結果】\n借上げの条件を確認'));try{
 assert.equal(x.d.querySelector('#diagnosisAttachment').hidden,false);assert.equal(x.sent.length,0);
 assert.equal(x.d.querySelectorAll('[name^="agree"]:checked').length,0);
 await x.submit();assert.equal(x.sent.length,0);
 x.fill();await x.submit();assert.equal(x.sent.length,1);assert.equal(x.sent[0].message,'相談本文\n\n【診断結果】\n借上げの条件を確認');assert.equal(x.w.sessionStorage.length,0);
 }finally{x.w.close();}
});
test('removing an attachment preserves user text and omits diagnosis on send',async()=>{
 const x=setupForm(payload('添付診断'));try{x.fill();x.d.querySelector('#removeDiagnosis').click();await x.submit();assert.equal(x.sent[0].message,'相談本文');assert.equal(x.w.sessionStorage.length,0);}finally{x.w.close();}
});
test('expiry at submit stops send, informs visitor and permits deliberate resend without attachment',async()=>{
 const x=setupForm(payload('添付診断'));try{x.fill();x.w.sessionStorage.clear();await x.submit();assert.equal(x.sent.length,0);assert.match(x.d.querySelector('#formError').textContent,/添付を解除/);await x.submit();assert.equal(x.sent[0].message,'相談本文');}finally{x.w.close();}
});
test('malformed, oversized, expired and future data are discarded; ordinary form never attaches stale data',()=>{
 for(const raw of ['{',payload('x'.repeat(4001)),JSON.stringify({version:1,createdAt:Date.now()-1800001,text:'old'}),JSON.stringify({version:1,createdAt:Date.now()+60000,text:'future'})]){
 const x=setupForm(raw);try{assert.equal(x.d.querySelector('#diagnosisAttachment').hidden,true);assert.equal(x.w.sessionStorage.length,0);}finally{x.w.close();}}
 const x=setupForm(payload('<img src=x onerror=alert(1)>'),'?service=shindan');try{assert.equal(x.d.querySelector('#diagnosisAttachment').hidden,true);}finally{x.w.close();}
 const y=setupForm(payload('<img src=x onerror=alert(1)>'));try{assert.equal(y.d.querySelector('#diagnosisAttachmentText img'),null);}finally{y.w.close();}
});
test('blocked storage reports an error without navigating away from the completed diagnosis',()=>{
 const dom=make('akiya-shindan'),w=dom.window,d=w.document,q=[];try{
 w.eval(read('assets/diagnosis-transfer.js'));Object.defineProperty(w,'sessionStorage',{get(){throw Error('blocked');}});w.setTimeout=f=>{q.push(f);return q.length;};w.eval(read('assets/diagnosis.js'));
 for(const i of [0,0,0,0,2]){d.querySelectorAll('.sim-option')[i].click();q.shift()();}
 const e=new w.MouseEvent('click',{cancelable:true});d.querySelector('#resultConsult').dispatchEvent(e);assert(e.defaultPrevented);assert.equal(d.querySelector('#diagnosisTransferError').hidden,false);
 }finally{w.close();}
});
