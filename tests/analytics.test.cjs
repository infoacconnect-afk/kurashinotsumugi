const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..') + '/';
const analytics = fs.readFileSync(root+'assets/analytics.js','utf8');
const contact = fs.readFileSync(root+'assets/contact-form.js','utf8');
function analyticsEnv(host) {
  const scripts=[], listeners={};
  const ctx={window:{location:{hostname:host}},document:{head:{appendChild:s=>scripts.push(s)},createElement:()=>({}),addEventListener:(n,f)=>listeners[n]=f}};
  vm.createContext(ctx); vm.runInContext(analytics,ctx);
  return {ctx,scripts,listeners};
}
(async()=>{
 for (const host of ['localhost','example.netlify.app','kurashinotsumugi.com.example.org']) {
  const a=analyticsEnv(host); assert.equal(a.scripts.length,0); assert.equal(a.ctx.window.gtag,undefined);
 }
 for (const host of ['kurashinotsumugi.com','www.kurashinotsumugi.com']) {
  const a=analyticsEnv(host); vm.runInContext(analytics,a.ctx);
  assert.equal(a.scripts.length,1); assert.equal(a.ctx.window.dataLayer.length,2);
  a.ctx.window.tsumugiTrackLead();
  a.listeners.click({target:{closest:()=>({getAttribute:()=> 'tel:0487825920'})}});
  a.listeners.click({target:{closest:()=>({getAttribute:()=> '/contact'})}});
  const events=Array.from(a.ctx.window.dataLayer).map(x=>Array.from(x));
  assert.equal(events.filter(x=>x[1]==='generate_lead').length,1);
  assert.equal(events.filter(x=>x[1]==='phone_click').length,1);
  assert(!JSON.stringify(events).includes('0487825920'));
 }
 async function scenario(mode) {
  let fetches=0, leads=0, pixels=0, submit, reset;
  const noop=()=>{};
  const el=()=>({hidden:false,disabled:false,classList:{add:noop,remove:noop},scrollIntoView:noop,offsetTop:0});
  const form=el(); form.querySelectorAll=()=>[]; form.addEventListener=(n,f)=>submit=f; form.reset=noop;
  const btn=el();btn.querySelector=()=>el();
  const thanks=el();thanks.hidden=true;
  const error=el();error.hidden=true;
  const resetBtn=el();resetBtn.addEventListener=(n,f)=>reset=f;
  const els={contactForm:form,submitBtn:btn,thanksView:thanks,formError:error,resetForm:resetBtn};
  const vals={name:mode==='invalid'?'':'Test',furigana:'テスト',email:'test@example.com',agreeTerms:'on',agreePrivacy:'on',message:'PRIVATE_MESSAGE',tel:'09012345678'};
  const ctx={console:{warn:noop,error:noop},navigator:{userAgent:'test'},document:{getElementById:id=>els[id]||null,querySelectorAll:()=>[],referrer:''},window:{SITE_CONFIG:{CONTACT_ENDPOINT:'https://example.invalid/test'},scrollTo:noop,oaiq:()=>pixels++},FormData:class{get(k){return vals[k]||''}getAll(){return ['other']}},fetch:async()=>{fetches++; if(mode==='network')throw Error();return{ok:mode!=='http',json:async()=>({ok:mode!=='rejected'})}}};
  if(mode!=='blocked') ctx.window.tsumugiTrackLead=()=>{if(mode==='throws')throw Error();leads++};
  vm.createContext(ctx);vm.runInContext(contact,ctx);
  await Promise.all([submit({preventDefault:noop}),submit({preventDefault:noop})]);
  if(['success','blocked','throws'].includes(mode)) {
    assert.equal(fetches,1,mode);assert.equal(thanks.hidden,false,mode);assert.equal(form.hidden,true,mode);
    assert.equal(pixels,1,mode);assert.equal(leads,mode==='success'?1:0,mode);
    await submit({preventDefault:noop});assert.equal(fetches,1,mode);
    reset();await submit({preventDefault:noop});assert.equal(fetches,2,mode);
  } else {assert.equal(leads,0,mode);assert.equal(thanks.hidden,true,mode);assert.equal(error.hidden,false,mode);}
 }
 for(const mode of ['success','blocked','throws','invalid','rejected','http','network'])await scenario(mode);
 console.log('PASS: production host restriction, single initialization, separate phone clicks, no phone value in analytics, successful enquiries only, duplicate submission guard, retry after reset, validation/HTTP/application/network failures, blocked or throwing analytics preserves form success. No real enquiries sent.');
})();
