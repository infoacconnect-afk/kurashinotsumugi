import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {optimizeDelivery} from '../build/optimize-delivery.mjs';

test('delivery optimization preserves content and entrance code, with matching responsive preloads',()=>{
 const dom=new JSDOM(readFileSync('index.html','utf8'));const d=dom.window.document;
 const text=d.body.textContent,entrance=d.querySelector('#home-entrance').textContent;
 const styles=[...d.querySelectorAll('style')].map(e=>e.textContent);
 optimizeDelivery(d);
 assert.equal(d.body.textContent,text);assert.equal(d.querySelector('#home-entrance').textContent,entrance);
 assert.deepEqual([...d.querySelectorAll('style')].map(e=>e.textContent),styles);
 assert(d.querySelector('script[src="assets/analytics.js"]').defer);
 for(const img of d.querySelectorAll('.hero-photo-field img')){
  assert.equal(img.getAttribute('loading'),'eager');
  const link=d.querySelector(`link[rel="preload"][href="${img.getAttribute('src')}"]`);
  assert.equal(link.getAttribute('imagesrcset'),img.getAttribute('srcset'));
  assert.equal(link.getAttribute('imagesizes'),img.getAttribute('sizes'));
  for(const candidate of img.getAttribute('srcset').split(','))assert(existsSync(candidate.trim().split(' ')[0]));
 }
 assert.equal(d.querySelector('.fs-icon img').getAttribute('loading'),'lazy');dom.window.close();
});
test('service-page responsive image preloads use exactly the picture candidates',()=>{
 for(const name of ['korekara','sorekara']){
  const dom=new JSDOM(readFileSync(`${name}.html`,'utf8'));const d=dom.window.document;
  optimizeDelivery(d);const source=d.querySelector('.page-hero picture source');
  const preload=d.querySelector(`link[rel="preload"][href="assets/hero/${name}-hero.webp"]`);
  assert.equal(source.getAttribute('srcset'),preload.getAttribute('imagesrcset'));
  assert.equal(source.getAttribute('sizes'),preload.getAttribute('imagesizes'));dom.window.close();
 }
});
