// Delivery-only changes: keep the approved DOM, artwork and animation rules.
const photoSizes = {
  family: '(max-width:600px) 120px, (max-width:1200px) 145px, 270px',
  'new-house': '(max-width:600px) 100px, (max-width:1200px) 110px, 218px',
  living: '(max-width:600px) 60px, (max-width:1200px) 72px, 120px',
  'existing-house': '(max-width:600px) 80px, (max-width:1200px) 98px, 180px',
  engawa: '(max-width:600px) 66px, (max-width:1200px) 76px, 150px',
  keys: '(max-width:600px) 115px, (max-width:1200px) 155px, 285px'
};
const originalWidths = {family:640, 'new-house':640, living:480, 'existing-house':480, engawa:640, keys:480};
export function optimizeDelivery(d) {
  // Analytics still executes before DOMContentLoaded, but no longer stops the
  // parser before it can discover stylesheets, fonts and the first-view images.
  d.querySelectorAll('script[src$="assets/analytics.js"]').forEach(s=>s.defer=true);
  for(const img of d.querySelectorAll('.hero-photo-field img')) {
    const match=img.getAttribute('src')?.match(/^assets\/fv-photos\/([^/]+)\.webp$/);
    const name=match?.[1]; if(!photoSizes[name]) continue;
    const src=img.getAttribute('src');
    img.setAttribute('srcset', `assets/fv-photos/${name}-320.webp 320w, ${src} ${originalWidths[name]}w`);
    img.setAttribute('sizes',photoSizes[name]);
    const preload=d.createElement('link');preload.rel='preload';preload.as='image';preload.type='image/webp';
    preload.href=src;preload.setAttribute('imagesrcset',img.getAttribute('srcset'));preload.setAttribute('imagesizes',photoSizes[name]);d.head.append(preload);
  }
  for(const name of ['korekara-hero','sorekara-hero']) {
    const src=`assets/hero/${name}.webp`;
    const source=d.querySelector(`source[srcset="${src}"]`); if(!source)continue;
    const sizes='(max-width:900px) calc(100vw - 48px), 600px';
    const srcset=`assets/hero/${name}-800.webp 800w, ${src} 1600w`;
    source.setAttribute('srcset',srcset);source.setAttribute('sizes',sizes);
    const preload=d.querySelector(`link[rel="preload"][href="${src}"]`);
    if(preload){preload.setAttribute('imagesrcset',srcset);preload.setAttribute('imagesizes',sizes);}
  }
  for(const img of d.querySelectorAll('img')) {
    if(!img.hasAttribute('decoding'))img.setAttribute('decoding','async');
    const firstView=img.closest('.site-header,.hero,.page-hero,.hero-akiya,.article-hero,.akari-hero');
    if(!firstView&&!img.hasAttribute('loading'))img.setAttribute('loading','lazy');
    if(img.closest('.site-header'))img.setAttribute('fetchpriority','high');
  }
}
