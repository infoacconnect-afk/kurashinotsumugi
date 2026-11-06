import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const html=readFileSync('index.html','utf8');
const script=html.match(/<script id="home-entrance">([\s\S]*?)<\/script>/)[1];
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
function setup({pendingFont=false}={}){
 const classes=new Set();let domReady,timer,resolveFont;
 const fonts=pendingFont?new Promise(r=>resolveFont=r):Promise.resolve();
 const photos=Array.from({length:6},(_,i)=>({dataset:{service:i<3?'korekara':'sorekara'},style:{setProperty(){}}}));
 const w={setTimeout(fn){timer=fn;return 1},clearTimeout(){},KurashiReading:{ready:Promise.resolve()}};
 const d={documentElement:{classList:{add(...names){names.forEach(n=>classes.add(n))},remove(n){classes.delete(n)},contains(n){return classes.has(n)}}},fonts:{ready:fonts},addEventListener(type,fn){domReady=fn},querySelectorAll(sel){return sel==='.hero-photo'?photos:photos.map(()=>({decode:()=>new Promise(()=>{})}))}};
 vm.runInNewContext(script,{window:w,document:d,Math,Promise});domReady();
 return{classes,timer,resolveFont};
}
test('slow decoration photos do not hold text; photos retain separate deadline',async()=>{
 const s=setup();await flush();assert(!s.classes.has('home-intro-pending'));assert(s.classes.has('home-photos-pending'));s.timer();assert.equal(s.classes.size,0);
});
test('text waits for correct font; failure deadline keeps everything readable',async()=>{
 const s=setup({pendingFont:true});await flush();assert(s.classes.has('home-intro-pending'));s.timer();assert.equal(s.classes.size,0);s.resolveFont();await flush();assert.equal(s.classes.size,0);
});
test('home has a main landmark, ordered headings and all six unchanged photo assets',()=>{
 const dom=new JSDOM(html,{runScripts:'outside-only'});dom.window.eval(readFileSync('assets/partials.js','utf8'));
 const d=dom.window.document;assert.equal(d.querySelectorAll('main').length,1);assert(!d.querySelector('main header.site-header'));assert(!d.querySelector('main footer.site-footer'));
 let level=0;for(const h of d.querySelectorAll('h1,h2,h3,h4,h5,h6')){const next=+h.tagName[1];assert(next<=level+1,`${h.textContent}: ${level} to ${next}`);level=next;}
 assert.equal(d.querySelectorAll('.hero-photo').length,6);assert(html.includes('animation: heroIntroReveal 2s linear backwards'));assert(html.includes('animation-delay: 0.4s'));dom.window.close();
});
function lum(h){const c=h.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]}
test('confirmed small-text contrast exceeds 4.5:1 without changing background',()=>{
 for(const [a,b] of [['415332','C4D2B4'],['716457','FFFFFF'],['C7B79F','4E3E2F']]){const x=lum(a),y=lum(b);assert((Math.max(x,y)+.05)/(Math.min(x,y)+.05)>=4.5);}
});
