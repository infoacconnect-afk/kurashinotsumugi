// つる・葉のSVG装飾を提供する共通スクリプト
window.KurashiDeco = {
  // 波打つつるの装飾線（水平方向）
  vineWave: (opts = {}) => {
    const w = opts.width || 300;
    const h = opts.height || 60;
    const color = opts.color || '#8B6F4E';
    const green = opts.green || '#9CAF88';
    return `
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <path d="M0,${h/2} Q${w*0.15},${h*0.1} ${w*0.3},${h/2} T${w*0.6},${h/2} T${w*0.9},${h/2} T${w},${h/2}"
            fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      <path d="M0,${h/2 + 6} Q${w*0.15},${h*0.85} ${w*0.3},${h/2 + 6} T${w*0.6},${h/2 + 6} T${w*0.9},${h/2 + 6} T${w},${h/2 + 6}"
            fill="none" stroke="${green}" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>
      <!-- little leaves -->
      <ellipse cx="${w*0.2}" cy="${h*0.28}" rx="5" ry="2.5" fill="${green}" opacity="0.7" transform="rotate(-30 ${w*0.2} ${h*0.28})"/>
      <ellipse cx="${w*0.5}" cy="${h*0.7}" rx="5" ry="2.5" fill="${green}" opacity="0.7" transform="rotate(20 ${w*0.5} ${h*0.7})"/>
      <ellipse cx="${w*0.8}" cy="${h*0.28}" rx="5" ry="2.5" fill="${green}" opacity="0.7" transform="rotate(-30 ${w*0.8} ${h*0.28})"/>
    </svg>`;
  },

  // 縦向きのつる（コーナー装飾用）
  vineCorner: (color = '#9CAF88', size = 180) => `
    <svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" opacity="0.6">
        <path d="M20,180 Q40,140 30,110 Q20,80 50,60 Q80,40 70,20"/>
        <path d="M60,60 Q80,50 90,30" stroke-width="1.2"/>
        <path d="M35,120 Q55,110 70,90" stroke-width="1.2"/>
      </g>
      <g fill="${color}" opacity="0.7">
        <ellipse cx="30" cy="110" rx="8" ry="4" transform="rotate(-40 30 110)"/>
        <ellipse cx="70" cy="90" rx="7" ry="3.5" transform="rotate(30 70 90)"/>
        <ellipse cx="50" cy="60" rx="8" ry="4" transform="rotate(-60 50 60)"/>
        <ellipse cx="90" cy="30" rx="7" ry="3.5" transform="rotate(20 90 30)"/>
        <ellipse cx="70" cy="20" rx="6" ry="3" transform="rotate(-30 70 20)"/>
      </g>
    </svg>`,

  // 小さな葉
  leaf: (color = '#9CAF88', size = 24) => `
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 C 6 4, 3 10, 6 18 C 8 20, 10 22, 12 22 C 14 22, 16 20, 18 18 C 21 10, 18 4, 12 2 Z"
            fill="${color}" opacity="0.7"/>
      <path d="M12 4 L 12 20" stroke="#fff" stroke-width="0.8" opacity="0.5"/>
    </svg>`,

  // 小さな家
  house: (size = 32) => `
    <svg viewBox="0 0 40 40" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 20 L20 8 L34 20 L34 34 L6 34 Z" fill="#fff" stroke="#8B6F4E" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M4 20 L20 6 L36 20" fill="#B85C3E" stroke="#8B6F4E" stroke-width="1.8" stroke-linejoin="round"/>
      <rect x="16" y="20" width="8" height="8" fill="#E89B5B" stroke="#8B6F4E" stroke-width="1.2"/>
      <line x1="20" y1="20" x2="20" y2="28" stroke="#8B6F4E" stroke-width="0.8"/>
      <line x1="16" y1="24" x2="24" y2="24" stroke="#8B6F4E" stroke-width="0.8"/>
    </svg>`,
};

// 装飾を data-deco 属性を持つ要素に自動挿入
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-deco]').forEach(el => {
    const kind = el.dataset.deco;
    if (kind === 'vine-wave') el.innerHTML = KurashiDeco.vineWave({ width: 400, height: 60 });
    else if (kind === 'vine-corner') el.innerHTML = KurashiDeco.vineCorner('#9CAF88', 180);
    else if (kind === 'vine-corner-brown') el.innerHTML = KurashiDeco.vineCorner('#B99A78', 180);
    else if (kind === 'leaf') el.innerHTML = KurashiDeco.leaf();
    else if (kind === 'house') el.innerHTML = KurashiDeco.house();
  });
});
