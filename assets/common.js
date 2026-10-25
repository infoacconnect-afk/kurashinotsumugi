// くらしのつむぎ - 共通スクリプト
(function() {
  'use strict';

  // Header scroll effect
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navToggle.classList.remove('open');
      nav.classList.remove('open');
    }));
  }

  // Fade-up on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    const answer = item.querySelector('.faq-a');
    q.setAttribute('role', 'button');
    q.setAttribute('tabindex', '0');
    if (answer) {
      if (!answer.id) {
        let id = `faq-answer-${index + 1}`;
        while (document.getElementById(id)) id += '-a';
        answer.id = id;
      }
      q.setAttribute('aria-controls', answer.id);
    }
    const syncExpanded = () => {
      const open = item.classList.contains('open');
      q.setAttribute('aria-expanded', String(open));
      if (answer) answer.setAttribute('aria-hidden', String(!open));
    };
    const toggle = () => {
      item.classList.toggle('open');
      syncExpanded();
    };
    syncExpanded();
    q.addEventListener('click', toggle);
    q.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) toggle();
    });
  });
})();

;
/* v7: r9-approved reading and responsive layout; original handlers retained above. */

(function () {
 'use strict';
 if (window.KurashiReading) return;
 const state = window.KurashiReading = {version:'v7-r9',ready:null};
 const style=document.createElement('style');
 style.id='kurashi-reading-styles';
 style.textContent="/* Proposal only: font settings and approved phrases remain unchanged. */\nh1:not(.review-heading),h2:not(.review-heading),h3,h4,h5,h6,.al-title,.ra-title,.q-text,.group-title,.item-title { text-wrap: balance; }\np,.faq-a-inner,.legal-content li,.article-content li { text-wrap: pretty; }\n.site-footer a[href=\"privacy.html\"] { white-space: nowrap; }\n.reading-flow { min-width: 0; word-break: keep-all; overflow-wrap: normal; line-break: strict; }\n.reading-label { display: block; min-width: 0; }\n.btn { max-width: 100%; }\n.article-content img,.article-content video,.content-media img,.content-media video { max-width:100%; height:auto; }\n.article-content iframe,.content-media iframe { width:100%; max-width:100%; aspect-ratio:16 / 9; height:auto; }\n@media(max-width:700px){\n .price-table,.article-content table { display:block; max-width:100%; }\n .price-table thead,.price-table tbody,.article-content table thead,.article-content table tbody { display:block; }\n .price-table tr { display:grid; grid-template-columns:minmax(0,1fr) auto; }\n .article-content table tr { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }\n .price-table th,.price-table td,.article-content table th,.article-content table td { min-width:0; }\n .price-table th:nth-child(n+3),.price-table td:nth-child(n+3),.article-content table th:nth-child(n+3),.article-content table td:nth-child(n+3) { grid-column:1 / -1; }\n}\n\n/* Narrow form columns must not expand their parent grid. */\n.contact-layout { grid-template-columns: minmax(0,1.4fr) minmax(0,1fr); }\n.contact-layout > *, .form-inline-two > *, .checkbox-grid > *, .agree-check > span { min-width:0; }\n.form-inline-two { grid-template-columns: repeat(2,minmax(0,1fr)); }\n.checkbox-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }\n.checkbox-grid input[type=\"checkbox\"] { flex-shrink:0; }\n@media (min-width:901px) and (max-width:1100px) {\n .form-wrap .checkbox-grid,.form-wrap .form-inline-two { grid-template-columns:1fr; }\n}\n@media (max-width:900px) { .contact-layout { grid-template-columns:1fr; } }\n@media (max-width:640px) { .form-inline-two,.checkbox-grid { grid-template-columns:1fr; } }\n\n/* Keep cards within their grid, and let mobile text use the full card width. */\n.reason-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }\n.reason-card,.reason-card .r-body { min-width:0; }\n.reason-card .r-body { flex:1 1 0; }\n@media(max-width:800px){ .reason-grid { grid-template-columns:minmax(0,1fr); } }\n@media(max-width:640px){\n .reason-card { flex-direction:column; }\n .reason-card .r-body { width:100%; flex-basis:auto; }\n}\n.related-docs li a > .r8-related-label { flex:1 1 0; min-width:0; }\n.related-docs li a::before { flex-shrink:0; }\n\n/* r9: constrain only the three sections found by the full r8 scan. */\n.service-detail-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }\n.service-detail-card,.service-detail-card .sd-header { min-width:0; }\n.service-detail-card .sd-header h3 { min-width:0; flex:1 1 0; }\n@media(max-width:900px){\n .service-detail-card .sd-header { flex-direction:column; align-items:flex-start; }\n .service-detail-card .sd-header h3 { width:100%; flex-basis:auto; }\n}\n@media(max-width:700px){ .service-detail-grid { grid-template-columns:minmax(0,1fr); } }\n.price-sec .price-block { max-width:100%; }\n@media(max-width:640px){ .price-sec .price-block { padding-inline:24px; } }\n.terms-groups,.terms-group .terms-list { grid-template-columns:minmax(0,1fr); }\n.terms-group,.terms-group .group-header > div:last-child,.terms-group .terms-list > li { min-width:0; }\n.terms-group .group-header > div:last-child { flex:1 1 0; }\n.terms-group .group-icon { flex-shrink:0; }\n@media(max-width:640px){\n .terms-group .item-left { flex-direction:column; align-items:flex-start; }\n .terms-group .item-title { max-width:100%; }\n}\n";
 document.head.appendChild(style);
 if (typeof Intl.Segmenter !== 'function') return;
 /* Explicit phrase boundaries for the remaining r5 findings. Text stays exact. */
(function(){
 'use strict';
 const definitions=[
  {selector:'.reason-card h3',groups:[['提携設計事務所・'],['専門家との','連携で安心']]},
  {selector:'#heroBrand',groups:[['くらしの'],['つむぎ']]},
  {selector:'.contact-cta h2',groups:[['家づくり','見える化プランを、'],['お申し込み','いただけます。']]},
  {selector:'.legal-hero h1',groups:[['プライバシー','ポリシー']]},
  {selector:'.item-title',groups:[['Ac・Connect株式会社 '],['プライバシー','ポリシー']]},
  {selector:'.article-content h2',groups:[['Step 1｜'],['そもそも'],['「3,000万円控除」'],['って何？']]},
  {selector:'.article-content h2',groups:[['Step 4｜'],['古い家は、'],['解体しないと'],['使えない？']]},
  {selector:'.updated',groups:[['制定日：','2026年9月23日／'],['改定日：','2026年9月24日']]}
 ];
 function measure(el,text){
  const probe=document.createElement('span');probe.textContent=text;probe.style.whiteSpace='nowrap';probe.dataset.readingIgnore='';el.appendChild(probe);const width=probe.getBoundingClientRect().width;probe.remove();return width;
 }
 function capacity(el){const s=getComputedStyle(el);return Math.max(1,el.clientWidth-(parseFloat(s.paddingLeft)||0)-(parseFloat(s.paddingRight)||0));}
 function groupsFor(el,groups){const width=capacity(el);return groups.flatMap(parts=>measure(el,parts.join(''))<=width+0.5?[parts.join('')]:parts);}
 function make(text){const span=document.createElement('span');span.className='r6-phrase';span.style.whiteSpace='nowrap';span.textContent=text;return span;}
 function fragment(chunks){const f=document.createDocumentFragment();chunks.forEach((text,i)=>{if(i){const w=document.createElement('wbr');w.dataset.r6Break='';f.append(w);}f.append(make(text));});return f;}
 function apply(){
  document.querySelectorAll('wbr[data-reading-break],wbr[data-r6-break]').forEach(e=>e.remove());
  document.querySelectorAll('.r6-phrase,.r7-atomic').forEach(e=>{const p=e.parentNode;e.replaceWith(...e.childNodes);p.normalize();});
  let matched=0;const warnings=[];
  for(const def of definitions)for(const el of document.querySelectorAll(def.selector)){
   const expected=def.groups.flat().join('');if(el.textContent!==expected||!el.getClientRects().length)continue;
   // Do not replace pre-existing links, emphasis or approved phrase markup.
   if(el.children.length)continue;
   const chunks=groupsFor(el,def.groups);el.replaceChildren(fragment(chunks));
   if(el.textContent!==expected)throw Error('r6指定語句で原文が変わりました');matched++;
   if(chunks.some(t=>measure(el,t)>capacity(el)+1))warnings.push(expected);
  }
  for(const el of document.querySelectorAll('.hero-akiya h1')){
   const node=[...el.childNodes].find(n=>n.nodeType===3&&n.nodeValue==='いっしょに考える。');
   if(node){const before=el.textContent;const f=fragment(groupsFor(el,[['いっしょに','考える。']]));const boundary=document.createElement('wbr');boundary.dataset.r6Break='';f.prepend(boundary);node.replaceWith(f);if(el.textContent!==before)throw Error('診断見出しの原文が変わりました');matched++;}
  }
  for(const el of document.querySelectorAll('.legal-content li')){
   const suffix='従います 。',node=el.lastChild;
   if(node?.nodeType===3&&node.nodeValue.endsWith(suffix)){
    const tail=node.splitText(node.length-suffix.length);tail.replaceWith(make(suffix));matched++;
   }
  }
  for(const el of document.querySelectorAll('.mieruka-intro')){
   const ornament=el.querySelector('.ornament:last-child'),node=ornament?.previousSibling,tail='踏み込みたい方へ ';
   if(node?.nodeType!==3||!node.nodeValue.endsWith(tail))continue;
   const before=el.textContent,range=document.createRange();range.setStart(node,node.length-tail.length);range.setEndAfter(ornament);
   const span=document.createElement('span');span.className='r6-phrase';span.style.whiteSpace='nowrap';range.surroundContents(span);
   if(el.textContent!==before)throw Error('装飾付き文言の原文が変わりました');matched++;
  }
  // Keep all label content in one flex item, including the protected company name.
  for(const link of document.querySelectorAll('.related-docs li a')){
   if(link.childNodes.length===1&&link.firstChild.nodeType===1&&link.firstChild.classList.contains('r8-related-label'))continue;
   const text=link.textContent,label=document.createElement('span');label.className='reading-label r8-related-label';
   while(link.firstChild)label.append(link.firstChild);link.append(label);
   if(link.textContent!==text)throw Error('関連文書リンクの原文が変わりました');
  }
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),companyNodes=[];let node;
  while((node=walker.nextNode()))if(node.nodeValue.includes('Ac・Connect')&&node.parentElement.closest('.legal-content')&&!node.parentElement.closest('script,style,textarea,input,.r6-phrase'))companyNodes.push(node);
  for(const node of companyNodes){
   const original=node.nodeValue,f=document.createDocumentFragment();let at=0;
   for(const match of original.matchAll(/Ac・Connect(?:株式会社)?/g)){
    f.append(document.createTextNode(original.slice(at,match.index)));const span=document.createElement('span');span.className='r7-atomic';span.style.whiteSpace='nowrap';span.textContent=match[0];f.append(span);at=match.index+match[0].length;
   }
   f.append(document.createTextNode(original.slice(at)));if(f.textContent!==original)throw Error('社名保護で原文が変わりました');node.replaceWith(f);matched++;
  }
  return {matched,warnings};
 }
 window.TargetedReading={apply,definitions,groupsFor};
})();

/* BudouX: Copyright 2021 Google LLC, Apache-2.0. Modified integration 2026-10-19.
   The original license is included in this comparison and its source archive. */
(function(){
 'use strict';
 const model={"UW3":{"。":2927,"の":1892,"、":2285,"を":2562,"に":1846,"が":1948,"は":1984,"と":1588,"し":270,"る":1470,"も":1602,"な":1344,"で":1587,"た":1188,"い":987,"く":1291,"て":1233,"う":1105,"へ":1292,"ら":785,"や":1175,"？":1825,"?":1906,"っ":-327,"こ":34,"ぐ":1295,"ー":-115,"ん":563,"，":1899,"ば":1101,"］":1183,"り":561,"か":1026,"]":1525,"！":1800,"お":-585,"ぞ":1145,"ま":10,"ッ":-548,"．":1157,"つ":650,"空":721,"ス":-380,"ど":803,"…":1481,"イ":-308,"ン":-194,"・":500,"だ":608,"方":472,"「":-624,"）":1444,"部":321,"プ":-345,"ご":-381,"あ":570,"フ":-463,"♪":1332,"」":832,"ラ":-86,"☆":1295,"ず":902,"電":-402,"京":-315,"大":-271,"ろ":669,"ア":-307,"日":338,"手":-71,"ぬ":880,"０":-343,"す":643,"々":968,"以":-305,"笑":1486,"間":426,"１":-438,"観":-178,"度":590,"『":-335,"新":-236,"[":-316,"カ":-102,"的":295,"き":223,"ロ":-226,"分":475,"れ":233,"む":812,"じ":416,"ぁ":695,"ジ":-61,"品":40,"せ":290,"今":372,"ゃ":606,"都":-77,"後":594,"中":373,"ぶ":735,"え":464,"】":476,"シ":-201,"ド":-176,"変":324,"〜":332,"番":216,"不":-190,"然":621,"★":1043,"子":-141,"よ":188,"ち":259,"［":-237,"タ":-21,"説":81,"発":-151,"最":-147,"素":-149,"時":91,"年":179,"段":248,"代":-109,"意":-96,"び":17,"学":-74,"　":207,"味":281,"料":-81,"行":-131,"ニ":-63,"光":-39,"用":-107,"ｏ":-95,"体":358,"夜":536,"作":-85,"皆":417,"ト":-7,"人":76,"斤":434,"月":112,"選":-75,"２":-58,"”":363,"聞":-62,"：":130,"前":150,"外":73,"昔":699,"レ":-24,"超":450,"週":93,"５":-34,"水":58,"自":-22,"３":-29,"色":219,"』":227,"出":-24,"能":-12,"ビ":-19,"み":7,"開":-14,"テ":-12,"モ":-19,"バ":-9,"機":-7,"ね":90,"程":51,"題":18},"UW4":{"。":-2921,"の":-1829,"に":-1799,"が":-1557,"は":-1614,"、":-2878,"る":-2280,"で":-1295,"と":-1399,"て":-1522,"を":-1805,"っ":-2000,"か":-1271,"り":-1899,"う":-1061,"ま":-821,"し":-919,"た":-814,"い":-676,"お":416,"な":-906,"ら":-2069,"だ":-1191,"ち":-984,"す":-719,"れ":-1661,"ん":-1845,"き":-877,"そ":223,"ー":-1265,"や":-634,"」":-2633,"あ":79,"け":-1607,"も":-1204,"ぞ":-1147,"く":-1282,"ご":115,"さ":-874,"見":364,"？":-2257,"め":-1016,"み":-637,"よ":-627,"人":194,"「":1150,"私":801,"ッ":-646,"ぐ":-765,"ン":-591,"[":1560,"一":273,"思":304,"わ":-782,"?":-1830,"合":-827,"じ":-1102,"！":-2092,"，":-1995,"言":113,"何":399,"せ":-824,"場":130,"『":381,"行":159,"え":-920,"今":498,"』":-2279,"時":150,"広":186,"食":116,"京":115,"・":-730,"ろ":-1232,"日":91,"．":-1414,"空":439,"へ":-655,"ば":-1174,"つ":-611,"…":-1457,"べ":-1265,"]":-965,"１":526,"効":164,"大":150,"ル":-258,"サ":80,"リ":-277,"エ":110,"び":-775,"特":504,"使":548,"当":94,"ね":-1133,"（":1298,"煙":1199,"綺":1247,"ゆ":-457,"方":-171,"気":101,"ず":-945,"ど":-492,"ぶ":-832,"自":280,"２":318,"［":922,"ぁ":-814,"携":121,"ゃ":-1080,"最":277,"］":-414,"帯":-257,"来":55,"ょ":-821,"フ":-180,"間":-295,"笑":-1460,"ス":-53,"）":-1557,"こ":-226,"有":268,"新":128,"良":25,"タ":-78,"ぎ":-913,"用":-291,"ぜ":-825,"む":-488,"☆":-807,"制":350,"続":-264,"カ":101,"♪":-1026,"能":-219,"ざ":-429,"メ":37,"表":151,"３":242,"多":355,"イ":-59,"手":66,"〜":-834,"ュ":-195,"公":161,"操":52,"無":211,"ほ":-134,"書":273,"０":-120,"的":-273,"デ":120,"次":53,"取":-302,"げ":-451,"不":301,"ロ":-78,"(":402,"友":75,"僕":299,"づ":-539,"【":368,"　":-695,"小":244,"切":-192,"換":-239,"回":-380,"二":438,"込":-346,"バ":93,"ぬ":-173,"楽":174,"ｏ":-168,"本":-26,"水":123,"ぼ":-349,"街":232,"”":-927,"少":102,"機":-41,"品":-112,"ト":-61,"動":-14,"ク":-35,"入":54,"代":-128,"レ":-39,"コ":41,"海":163,"★":-456,"夏":213,"Ｓ":-50,"東":409,"年":-101,"ニ":-66,"美":118,"券":-250,"通":-77,"話":104,"前":-43,"祭":329,"参":227,"返":-112,"聞":85,"ふ":-118,"真":-116,"ビ":-58,"住":70,"四":194,"実":44,"全":48,"ぱ":-125,"＾":-197,"ぃ":-126,"グ":-20,"高":32,"彼":41,"姿":23,"誰":136,"ド":-33,"立":-82,"情":-14,"店":22,"臭":347,"式":-76,"態":-24,"安":52,"例":74,"ひ":49,"作":-19,"肌":6,"心":6,"旅":9,"移":-17,"足":17,"道":3,"物":-12,"甘":9,"三":4,"度":-4},"UW5":{"。":-674,"、":-346,"な":-317,"は":-336,"に":-271,"う":172,"っ":529,"そ":-621,"と":-276,"で":-289,"き":367,"を":-232,"る":172,"ま":-19,"す":-275,"え":248,"い":160,"の":-247,"べ":877,"ラ":186,"じ":322,"こ":49,"動":712,"れ":204,"も":-128,"た":4,"・":-282,"し":-123,"く":141,"め":184,"さ":-135,"」":-340,"供":203,"ル":-252,"あ":-212,"か":71,"帯":89,"力":137,"つ":443,"能":5,"ト":-132,"ン":-77,"へ":-320,"上":-300,"器":-87,"日":203,"思":-109,"が":-175,"ぼ":484,"り":93,"ざ":178,"ん":407,"ぶ":43,"だ":-93,"よ":-151,"け":-56,"］":-113,"わ":267,"ず":293,"ち":226,"回":300,"年":380,"[":-131,"！":-143,"．":-205,"ス":-67,"当":217,"て":84,"都":26,"利":346,"イ":77,"広":-175,"ろ":-71,"的":-90,"び":270,"ュ":-87,"丈":293,"葉":122,"大":-66,"ら":71,"電":-47,"景":147,"所":10,"１":-88,"言":-116,"開":103,"ど":-41,"寺":-104,"本":121,"体":-383,"革":-244,"ぎ":139,"作":104,"券":-65,"…":-59,"有":-41,"む":174,"ね":-52,"版":-41,"先":-251,"要":29,"グ":-23,"合":23,"一":-30,"改":-52,"々":51,"バ":-33,"？":-29,"使":-82,"２":-49,"軽":27,"行":-32,"期":32,"面":21,"ロ":9,"明":20,"ャ":3,"法":-15,"テ":-3},"UW2":{"。":-529,"の":-308,"を":-850,"、":-535,"し":117,"に":-356,"か":23,"も":-359,"が":-287,"と":-398,"っ":90,"で":-342,"れ":34,"そ":-238,"よ":-28,"お":-470,"ぞ":-457,"て":-289,"以":1111,"す":188,"ま":163,"人":184,"さ":308,"」":102,"つ":-181,"だ":161,"あ":-128,"め":65,"う":-203,"見":-171,"手":458,"く":-253,"少":316,"は":-346,"全":550,"一":524,"な":-223,"解":349,"き":-22,"け":99,"い":-42,"特":270,"法":546,"ど":-153,"良":150,"結":1020,"食":125,"ゆ":379,"ラ":-135,"毎":769,"随":939,"ひ":-1043,"ほ":257,"イ":-68,"境":-201,"り":-80,"る":-135,"同":397,"言":-95,"ん":82,"ぱ":113,"た":-83,"場":96,"取":-186,"作":-110,"子":-5,"わ":82,"や":-179,"多":240,"大":130,"能":138,"ぜ":424,"？":-207,"知":-113,"話":2,"目":-168,"題":125,"デ":-143,"「":-92,"サ":-136,"ぐ":-135,"］":-170,"ば":-93,"ご":-82,"ね":197,"関":739,"ー":94,"グ":-101,"新":-39,"Ｐ":-393,"０":95,"１":82,"]":-132,"落":-328,"＾":278,"本":215,"?":-122,"２":-106,"，":-125,"先":225,"［":-21,"ジ":-65,"み":-30,"味":113,"和":169,"生":117,"せ":16,"乗":-145,"素":-202,"家":47,"立":-216,"シ":-84,"世":-71,"水":123,"[":-1,"『":-101,"前":49,"ぶ":3,"ケ":-94,"電":94,"我":-206,"残":150,"券":-97,"今":12,"百":-105,"車":71,"増":-88,"振":-81,"案":107,"用":-31,"プ":-26,"直":159,"三":80,"ろ":-31,"バ":73,"着":-14,"冷":-22,"空":-11,"早":94,"実":50,"５":-43,"げ":40,"並":28,"追":-47,"高":9,"是":7,"変":-3,"フ":-1},"UW1":{"い":-85,"に":-141,"で":-122,"な":-109,"つ":209,"。":-24,"は":-65,"り":-105,"と":36,"が":-106,"こ":43,"そ":47,"ど":124,"う":21,"し":-27,"見":88,"だ":-97,"大":155,"て":68,"の":5,"上":-86,"ん":94,"お":15,"十":-92,"た":-30,"か":-72,"水":48,"知":38,"へ":-23,"始":130,"ッ":196,"プ":-268,"っ":87,"作":25,"く":44,"［":-168,"タ":26,"小":265,"ろ":134,"新":119,"も":10,"「":-110,"．":-184,"『":-146,"積":-240,"や":-89,"イ":-99,"行":-39,"京":-118,"メ":168,"ス":-53,"ち":81,"バ":110,"０":43,"間":106,"撮":-96,"え":-51,"れ":36,"何":93,"壊":-117,"自":113,"ざ":281,"ば":-43,"、":-17,"人":-30,"少":-45,"ら":10,"豊":69,"時":-41,"基":-99,"ー":5,"認":-96,"取":47,"使":-36,"ケ":-28,"」":-29,"機":17,"書":-13,"色":13,"生":-21,"オ":37,"す":6,"]":-17,"話":-6,"面":-14},"UW6":{"。":-91,"の":61,"が":121,"な":119,"さ":361,"を":40,"し":187,"で":51,"は":96,"う":53,"、":-15,"て":-14,"や":268,"に":102,"り":217,"せ":-165,"み":265,"あ":-70,"る":97,"い":114,"ど":175,"」":-94,"つ":238,"ー":-64,"と":25,"ぱ":445,"っ":192,"お":-114,"も":38,"グ":138,"性":11,"ビ":249,"コ":63,"か":132,"ま":175,"め":251,"場":-184,"付":42,"け":-30,"く":87,"供":-335,"人":-33,"画":232,"ク":-138,"ン":-62,"的":122,"ュ":117,"ぐ":23,"わ":138,"ん":138,"タ":93,"０":305,"・":-81,"れ":66,"遊":-229,"ば":120,"空":301,"通":-49,"ろ":102,"日":97,"そ":63,"寺":185,"ス":15,"見":-40,"学":-155,"電":135,"最":-121,"気":164,"地":163,"じ":164,"レ":61,"出":160,"ア":-31,"言":-139,"ず":-134,"ょ":-75,"シ":-42,"む":72,"こ":11,"カ":40,"ル":40,"す":3,"パ":-70,"広":-46,"込":57,"返":79,"公":-16,"ピ":124,"ら":8,"，":19,"よ":8,"：":131,"ゃ":-20,"水":69,"だ":-6,"Ｓ":-3,"合":12,"来":-6,"ち":1},"BW2":{"とこ":-713,"ない":-1317,"とい":121,"せく":2467,"とお":-1189,"です":-1081,"てい":-619,"へよ":1283,"ので":-545,"であ":-1440,"いよ":-1010,"たと":360,"のみ":-1007,"うご":673,"たい":-934,"など":-902,"てお":-1002,"にも":-636,"でも":-693,"たま":-658,"るよ":-359,"いた":-617,"くな":-746,"てく":-533,"、と":-465,"でき":-834,"はじ":-952,"には":-393,"徴エ":984,"とめ":-228,"本イ":1172,"でし":-729,"うど":-808,"帯電":-285,"もつ":-208,"のが":-425,"やす":-667,"いま":-362,"なく":-293,"い合":-354,"くだ":-593,"らゆ":-547,"いと":-336,"こそ":-489,"なか":-197,"いい":-390,"び上":1037,"うや":-350,"う映":519,"とも":-304,"いも":368,"たち":-345,"のも":-451,"てき":-732,"らな":-116,"てみ":-737,"のは":-394,"るで":-52,"の前":-649,"てあ":-944,"がし":174,"くし":-256,"どこ":-494,"い日":234,"もあ":-179,"うこ":-31,"もし":-273,"のい":108,"ると":-176,"ても":-269,"のか":-203,"すご":-658,"のだ":-210,"ども":-364,"かな":-243,"もう":-265,"く来":17,"とか":-408,"なぁ":-331,"いつ":-112,"とき":-288,"かし":-200,"いな":-242,"て行":-1104,"でな":-513,"ただ":-398,"はい":-246,"たよ":-194,"な場":151,"るな":-278,"そこ":-714,"たも":140,"なあ":-877,"はず":-387,"いし":-363,"しい":-183,"がっ":-239,"した":-143,"へと":-134,"てた":-150,"はあ":-235,"では":-198,"てこ":-73,"にし":-105,"ばな":-90,"りし":73,"るし":-197,"とは":-148,"たな":-153,"らい":-134,"たし":-200,"係な":503,"て欲":-457,"。と":91,"るか":-98,"つぶ":-56,"てや":-153,"夏休":-51,"りな":202,"うい":-97,"りも":-73,"いで":-88,"の方":54,"日本":-151,"ぶつ":-72,"なお":-213,"のご":-494,"たさ":-48,"人い":702,"い状":46,"日和":-113,"なし":-92,"・・":-82,"識こ":44,"のよ":-19,"いわ":-50,"」で":280,"とう":-13,"つい":-47,"れた":-25,"とと":-48,"、な":-59,"．５":-244,"にぎ":-77,"．９":-210,"て来":-192,"んど":-4,"でい":-17,"。笑":-155,"がの":31,"．ま":28},"BW1":{"しい":548,"から":720,"ない":579,"んに":-499,"いう":261,"よう":-378,"もは":-1402,"はや":93,"れた":431,"こそ":1262,"まま":1052,"こと":-614,"して":-81,"つな":-733,"」と":95,"その":-393,"のみ":1389,"たい":336,"白い":696,"るの":-448,"ても":250,"少し":730,"まも":-1330,"のは":359,"やく":435,"かも":-670,"とか":674,"たら":546,"たと":-552,"なぞ":-999,"でも":241,"った":70,"この":-461,"全部":387,"まと":-835,"んだ":342,"には":136,"では":-151,"うな":175,"んな":153,"ちが":-363,"とが":-597,"晶の":1358,"たの":-465,"以上":320,"がと":-435,"なら":638,"最近":1077,"ると":4,"んで":-224,"だん":114,"より":820,"もう":664,"もの":-266,"。・":1202,"いと":-155,"くれ":673,"思い":-809,"うに":-43,"おで":-1153,"よく":374,"かし":521,"にも":299,"知ら":-163,"青い":237,"れて":-176,"めて":78,"手順":450,"ぞな":-78,"同じ":339,"だけ":489,"すの":-259,"いの":-158,"きた":227,"すい":44,"まだ":263,"いい":-134,"使い":-565,"まり":243,"けど":434,"敵な":298,"ただ":418,"なぐ":404,"した":129,"とう":58,"なく":234,"が、":407,"りと":396,"いな":-82,"くて":332,"なぜ":1022,"人が":104,"とに":-164,"言い":-428,"問い":-316,"買い":-597,"れが":-308,"の間":715,"とき":826,"いで":-477,"舞う":443,"すが":-135,"など":487,"のが":262,"んて":220,"やら":461,"た．":409,"ので":96,"えば":231,"利な":187,"ては":-175,"的な":140,"は、":203,"ぱり":322,"うぞ":82,"もし":637,"とで":195,"しず":-351,"取り":-196,"うや":-118,"こう":-155,"現在":495,"大変":106,"ほぼ":387,"とも":-55,"いた":105,"待ち":-312,"との":95,"の後":495,"ここ":401,"うか":175,"空き":-161,"安に":-535,"、と":77,"てい":-110,"一番":65,"使う":173,"とは":-100,"あー":941,"普段":308,"いも":-343,"るに":-83,"うと":-101,"きな":64,"Ｈ．":-249,"橋に":52,"、今":324,"べき":568,"まあ":213,"とい":-36,"上に":28,"で、":71,"い」":165,"か、":-115,"い、":-24,"つぶ":-134,"てる":87,"ちら":-147,"らな":-208,"しか":22,"＾＾":102,"たり":71,"ため":380,"ぶん":328,"のも":48,"！！":38,"何か":46,"なか":72,"める":-23,"持て":-232,"是非":356,"ころ":190,"世の":-522,"と、":21,"法的":79,"作り":-39,"さり":103,"わけ":395,"気が":35,"てた":68,"いし":43,"０円":48,"ねー":248,"りは":-122,"すら":58,"ゃあ":173,"えて":-22,"せん":35,"ぜひ":57,"落と":-52,"んか":24,"じる":-28,"持つ":46,"かが":-28,"神社":71,"はも":-6,"三回":37,"だし":52,"まる":-15,"りに":4,"悪い":12},"TW1":{"よいよ":1543,"もはや":795,"ありが":-1015,"をもつ":778,"またま":1597,"こんに":-344,"で見る":-1323,"という":106,"んどん":728,"できる":167,"おって":1406,"が良い":318,"ました":-542,"ふだん":945,"甘えが":-639,"だんど":-806,"十分に":-359,"ていく":417,"すきと":-1293,"ような":446,"・・・":596,"かなり":1000,"。夕方":538,"やはり":917,"ことも":-211,"しかし":450,"ながら":576,"かなか":402,"たちの":64,"もなく":116,"困った":554,"ょっと":-146,"でかけ":-196,"とんど":606,"やすい":83,"なんと":-464,"持って":-346,"ょうど":484,"入れる":240,"っかり":414,"と思う":153,"ていて":218,"ければ":-48,"に人が":230,"かった":-24,"以上に":84,"そして":193,"『いい":-232,"として":95,"なって":-69,"たまた":-144,"くらい":79,"ういう":273,"のおも":-180,"おけば":121,"すごく":213,"その時":610,"、それ":408,"始まる":32,"ろいろ":128,"した．":155,"ない、":-234,"くては":-92,"ちろん":170,"だって":138,"ままに":78,"メール":8,"ように":-50,"らしき":117,"にして":-22,"くさん":54,"ひとつ":77,"ろそろ":62,"あまり":27,"まるで":23,"色から":11,"感じる":-9,"。そう":3,"用する":4},"TW2":{"いとこ":-1279,"してお":-715,"ちがう":-834,"ではな":-797,"分にあ":-1149,"そのま":-610,"うにな":-487,"どんど":-356,"気に入":-1868,"かもし":-123,"んでい":-798,"からし":361,"まるで":-346,"とがあ":-598,"からな":-431,"そもそ":-985,"ではあ":-865,"ともあ":-408,"その後":-608,"れるこ":251,"をもつ":-126,"でもあ":-714,"きとお":-5,"とにな":-244,"目の前":-321,"でもな":-443,"ようや":-146,"あるこ":287,"しかな":345,"とがで":-255,"てもい":-495,"らと言":-763,"ものす":-726,"ってこ":-146,"るにつ":-372,"いてあ":-122,"いい感":-342,"女の子":-759,"全くな":230,"してい":-26,"うとし":-40,"という":-19,"ような":-14,"までに":-20,"なるほ":-77,"したこ":-14,"にはな":14},"BW3":{"こと":458,"ちは":-232,"いい":375,"もの":1419,"いう":254,"その":814,"して":200,"はじ":1177,"でき":476,"おで":246,"ある":-151,"なる":249,"とき":1060,"これ":1032,"まと":955,"なっ":-195,"まま":-87,"この":990,"うま":1422,"そう":-889,"受け":369,"とい":-384,"分か":601,"上が":320,"当日":1142,"ちょ":865,"おり":-485,"子供":153,"そこ":245,"ゆる":-80,"機器":-974,"さん":-833,"もら":1253,"ぞう":541,"ころ":-229,"かっ":-405,"なん":99,"携帯":30,"たま":488,"こそ":-412,"とて":1132,"かな":193,"つな":694,"つぶ":242,"より":-512,"ぞな":-146,"・・":-715,"ため":593,"とっ":501,"なら":-190,"もう":1008,"知る":17,"でも":556,"メー":174,"しい":-366,"さい":-294,"と思":-255,"すぐ":706,"さあ":496,"よく":476,"かか":649,"まも":368,"から":-297,"です":-221,"よう":-126,"まし":-213,"いろ":155,"かけ":749,"こぼ":251,"つい":269,"すか":-218,"いて":-132,"電話":-68,"まだ":320,"とり":664,"みた":-369,"それ":148,"まぁ":609,"かも":-203,"した":347,"いか":335,"すご":747,"始ま":48,"なか":77,"どこ":385,"難し":147,"とつ":-226,"日が":210,"わか":330,"はま":424,"あと":558,"がん":588,"だけ":-176,"もん":186,"ただ":234,"出来":-367,"すき":193,"アプ":48,"けれ":-163,"うち":122,"入れ":110,"最近":237,"だろ":-314,"もと":409,"きる":-225,"だい":249,"物語":88,"問題":172,"なに":251,"みん":214,"大会":-128,"ます":-100,"もっ":272,"変え":385,"友人":89,"始め":-141,"で、":199,"しゃ":156,"まで":-187,"きま":-107,"頃で":-321,"入場":125,"書い":196,"べき":-93,"面白":78,"だし":136,"ませ":-89,"はる":338,"ずっ":182,"かわ":85,"とこ":88,"手に":50,"ごと":-247,"つけ":109,"ない":45,"以上":-58,"いた":-42,"歩く":73,"何で":71,"いま":70,"そく":-366,"うれ":108,"考え":52,"よし":93,"こだ":48,"どい":-30,"しく":-76,"なく":30,"ええ":163,"など":-51,"持っ":63,"いつ":12,"のっ":39,"使っ":22,"あふ":177,"ルー":27,"ちろ":-56,"にぎ":190,"みろ":181,"もつ":60,"通り":-39,"あて":47,"ここ":22,"ほど":-3,"祭り":26,"そし":34,"渡る":-6,"まさ":1},"TW4":{"ありが":1289,"なぞな":1250,"ような":-880,"もはや":1258,"ところ":1583,"ちがう":1001,"ように":-641,"いよい":589,"ある。":-133,"どのよ":2006,"可能性":1316,"とおり":901,"ようや":650,"ことが":-639,"プログ":741,"いっぱ":958,"くらい":862,"できた":906,"かなり":941,"ことに":-679,"ありま":-429,"ことで":161,"して人":-717,"おりに":-190,"しかし":967,"わけで":-292,"ことも":-579,"そのま":347,"うどん":792,"いけな":-320,"そうで":-374,"サービ":54,"した。":-398,"ようで":-380,"してお":277,"おりま":758,"かった":-235,"いろい":677,"まもな":2,"こと。":203,"いって":-270,"ないと":194,"したお":-228,"なんと":529,"ことを":122,"だった":-479,"どんど":313,"ことは":-206,"なんて":-410,"はじま":29,"これは":282,"なかな":210,"制度に":188,"あるい":-1252,"いくさ":-193,"いえば":263,"ひとつ":445,"ない。":58,"やって":87,"メール":27,"すきと":123,"なんか":132,"しゃべ":718,"京都に":156,"なくな":66,"いかな":64,"まって":-124,"はまっ":106,"みんな":1,"いまし":-114,"しない":80,"よりは":-74,"とこが":258,"とても":1,"きれい":27,"さらに":86,"だって":79,"おいし":28,"かわい":44,"手に入":15,"みたい":-25,"なんで":-7,"できる":-1},"TW3":{"のよう":-656,"という":381,"ている":-712,"のまま":-59,"の本は":-859,"へよう":10,"とした":-519,"になっ":-248,"てしま":-665,"らない":-472,"ること":-167,"のよい":289,"る方は":-598,"ところ":-217,"帯電話":-6,"くして":-456,"として":112,"ばいい":-594,"すこと":284,"てほし":-665,"であっ":-559,"ていう":428,"、そし":-1770,"ういう":-266,"ていく":-118,"である":-324,"と言っ":-594,"はまっ":-542,"と同時":-712,"、また":-382,"があっ":359,"はない":-123,"てない":-177,"にしか":-181,"くなっ":-61,"、ある":-182,"ておき":-278,"ばなら":-31,"はいえ":-116,"もある":-71,"たこと":-34,"にでも":-166,"といい":-214,"になら":61,"となっ":22,"たそう":-65,"もしか":-234,"もまた":-45,"るそう":-26,"かどう":-22,"にして":-7,"りした":6,"もいい":-15,"の先に":-21}};
 const base=-Object.values(model).reduce((a,g)=>a+Object.values(g).reduce((x,y)=>x+y,0),0)/2;
 const segmenter=new Intl.Segmenter('ja',{granularity:'word'}),cache=new Map();
 const hardTerms=['専門家','空き家','実家','相続','固定資産税','都市計画税','不動産','所有者','借上げ','転貸','家づくり','見える化','住資産','再生ラボ','セルフチェック','ケーススタディ','プライバシーポリシー','お問い合わせ','お申し込み','ありがとうございます','ございません','いただけます','いただきます','いたします','ください','できます','できません','ありません','なります','おります','思います','考えます','考える','考えたい','知っておきたい','使うべき','売ること','いっしょに考える','その他','全体像','可能性','急がない','取扱い','取引','個人情報','住宅ローン','設計事務所','司法書士','宅地建物取引業','反社会的勢力','利用規約','利用特則','免責','損害賠償','準拠法','不可抗力','電磁的方法','定期巡回','臨時巡回','郵便物転送','室内見守り','巡回表示看板','基本サービス','内観パース','外観パース','参考配置図','参考平面プラン','資金計画','3,000万円','3,000万円控除','3000万円','30秒','5つのステップ','Vol.1','Ac・Connect','Miqrova'];
 const excluded='script,style,noscript,textarea,input,select,option,svg,canvas,pre,code,[contenteditable="true"],[data-reading-ignore],.hp-field,.site-nav,.site-logo,.nav-toggle,.arrow,.ornament,.price-num';
 const protectedPhrase='.brand-trademark,.wrap-proposal,.pc-word,.review-phrase,.card-title-phrase,.reading-phrase,.semantic-review-phrase,.r6-phrase,.r7-atomic,[data-tail-guard]';
 let audit=[],summary={};
 function rawParse(text){
  const s=Array.from(text);if(!s.length)return [];const out=[s[0]],get=(g,t)=>model[g]?.[t]||0;
  for(let i=1;i<s.length;i++){
   let v=base;
   if(i>2)v+=get('UW1',s[i-3]);if(i>1)v+=get('UW2',s[i-2]);v+=get('UW3',s[i-1])+get('UW4',s[i]);
   if(i+1<s.length)v+=get('UW5',s[i+1]);if(i+2<s.length)v+=get('UW6',s[i+2]);
   if(i>1)v+=get('BW1',s.slice(i-2,i).join(''));v+=get('BW2',s.slice(i-1,i+1).join(''));if(i+1<s.length)v+=get('BW3',s.slice(i,i+2).join(''));
   if(i>2)v+=get('TW1',s.slice(i-3,i).join(''));if(i>1)v+=get('TW2',s.slice(i-2,i+1).join(''));if(i+1<s.length)v+=get('TW3',s.slice(i-1,i+2).join(''));if(i+2<s.length)v+=get('TW4',s.slice(i,i+3).join(''));
   if(v>0)out.push(s[i]);else out[out.length-1]+=s[i];
  }return out;
 }
 function protectedOffsets(text){const blocked=new Set();for(const term of hardTerms){let at=text.indexOf(term);while(at!==-1){for(let i=at+1;i<at+term.length;i++)blocked.add(i);at=text.indexOf(term,at+term.length);}}return blocked;}
 function permitted(text,at,blocked){
  if(blocked.has(at))return false;const a=text.slice(0,at),b=text.slice(at);
  if(/[（「『【〈《“‘]$/.test(a)||/^[、。，．！？!?：:；;））」』】〉》”’ーぁぃぅぇぉっゃゅょァィゥェォッャュョ]/.test(b))return false;
  const next=segmenter.segment(b)[Symbol.iterator]().next().value?.segment;
  if(['は','が','を','に','へ','と','で','も','の','や','か','ね','よ','だけ','まで','から','より','ほど','など'].includes(next))return false;
  return !/^(?:ます|ません|です|でした|ない|なかった|ください|いただ|ござい|いたし|する|され|ために|ことが|ことを|という)/.test(b);
 }
 function phrases(text){
  if(cache.has(text))return cache.get(text).slice();
  const blocked=protectedOffsets(text),bounds=new Set([...segmenter.segment(text)].map(s=>s.index)),out=[];let at=0,start=0;
  for(const part of rawParse(text).slice(0,-1)){at+=part.length;if(bounds.has(at)&&permitted(text,at,blocked)){out.push(text.slice(start,at));start=at;}}
  out.push(text.slice(start));
  if(out.length>1&&/^(?:ください|いただ|ござい|いたし|できます|できません|あります|ありません|なります|おります|ために|こと[。！？!?]?$)/.test(out.at(-1).trim()))out.splice(-2,2,out.at(-2)+out.at(-1));
  cache.set(text,out);return out.slice();
 }
 function splitLong(text,fits){
  if(fits(text))return [text];const blocked=protectedOffsets(text),bounds=[...segmenter.segment(text)].map(s=>s.index).filter(i=>i>0&&permitted(text,i,blocked));
  const out=[];let start=0;while(start<text.length){if(fits(text.slice(start))){out.push(text.slice(start));break;}const options=bounds.filter(i=>i>start),end=options.filter(i=>fits(text.slice(start,i))).at(-1)||options[0]||text.length;out.push(text.slice(start,end));start=end;}return out;
 }
 function wrapFlexLabels(){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];let n;
  while((n=walker.nextNode()))if(/[\u3040-\u9fff]/.test(n.nodeValue)&&!n.parentElement.closest(excluded+','+protectedPhrase))nodes.push(n);
  for(const node of nodes){if(!/^(inline-)?flex$/.test(getComputedStyle(node.parentElement).display))continue;const span=document.createElement('span');span.className='reading-label';node.replaceWith(span);span.append(node);}
 }
 function collectRuns(){
  const runs=[],displays=new Map();let active=null;
  const nearest=node=>{let el=node.parentElement;while(el&&el!==document.body){if(!displays.has(el))displays.set(el,/^(block|flow-root|list-item|table-cell|flex|grid|inline-block|inline-flex)$/.test(getComputedStyle(el).display));if(displays.get(el))return el;el=el.parentElement;}return null;};
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
  while((n=walker.nextNode())){
   if(n.nodeType===1){if(n.tagName==='BR')active=null;continue;}
   if(!n.nodeValue||n.parentElement.closest(excluded+','+protectedPhrase)){active=null;continue;}
   const root=nearest(n);if(!root||!root.getClientRects().length||getComputedStyle(root).visibility==='hidden'){active=null;continue;}
   if(!active||active.root!==root){active={root,nodes:[],text:''};runs.push(active);}active.nodes.push(n);active.text+=n.nodeValue;
  }return runs.filter(r=>/[\u3040-\u9fff]/.test(r.text));
 }
 function measureFor(root){
  const ctx=document.createElement('canvas').getContext('2d'),s=getComputedStyle(root);ctx.font=s.font||[s.fontStyle,s.fontWeight,s.fontSize,s.fontFamily].join(' ');const spacing=parseFloat(s.letterSpacing)||0;
  return text=>{const t=text.replace(/\s+/g,' ');return ctx.measureText(t).width+Array.from(t).length*spacing;};
 }
 function apply(){
  document.querySelectorAll('wbr[data-reading-break]').forEach(e=>e.remove());wrapFlexLabels();audit=[];let count=0,phraseCount=0,oversize=0;
  for(const {root,text,nodes} of collectRuns()){
   root.classList.add('reading-flow');const s=getComputedStyle(root),available=Math.max(1,root.clientWidth-(parseFloat(s.paddingLeft)||0)-(parseFloat(s.paddingRight)||0)),measure=measureFor(root),fits=t=>measure(t)<=available+0.75;
   const chunks=phrases(text).flatMap(t=>splitLong(t,fits));
   if(chunks.length>1){const last=chunks.at(-1),prior=chunks.at(-2);if(last.trim().replace(/[^\p{L}\p{N}]/gu,'').length<5&&!/[。！？!?]\s*$/.test(prior)&&fits(prior+last))chunks.splice(-2,2,prior+last);}
   const point=(at,end=false)=>{let total=0;for(const node of nodes){if(at<total+node.length||(end&&at===total+node.length))return {node,offset:at-total};total+=node.length;}return {node:nodes.at(-1),offset:nodes.at(-1).length};};
   const wordUnits=[];const ranges=new Set();const addWord=(start,end)=>{const key=start+':'+end;if(ranges.has(key))return;ranges.add(key);const a=point(start),b=point(end,true),range=document.createRange();range.setStart(a.node,a.offset);range.setEnd(b.node,b.offset);wordUnits.push({text:text.slice(start,end),range});};
   for(const seg of segmenter.segment(text))if(seg.isWordLike&&Array.from(seg.segment).length>1)addWord(seg.index,seg.index+seg.segment.length);
   for(const term of hardTerms){let at=text.indexOf(term);while(at>=0){addWord(at,at+term.length);at=text.indexOf(term,at+term.length);}}
   let offset=0;const boundaries=[],units=chunks.map((chunk,i)=>{const a=point(offset),b=point(offset+chunk.length,true),range=document.createRange();range.setStart(a.node,a.offset);range.setEnd(b.node,b.offset);offset+=chunk.length;if(i<chunks.length-1)boundaries.push(offset);return {text:chunk,range};});
   let nodeStart=0;const mapped=[];for(const node of nodes){const end=nodeStart+node.length;for(const at of boundaries)if(at>nodeStart&&at<=end)mapped.push({node,at:at-nodeStart});nodeStart=end;}
   for(const {node,at} of mapped.reverse()){const marker=document.createElement('wbr');marker.dataset.readingBreak='';if(at===node.length)node.after(marker);else node.splitText(at).before(marker);}
   const bad=chunks.filter(t=>t.trim()&&!fits(t));audit.push({root,text,chunks,units,wordUnits,available,oversize:bad});count++;phraseCount+=chunks.length;oversize+=bad.length;
  }
  summary={processedRuns:count,phraseCount,oversizePhrases:oversize,model:'BudouX 0.10.0 ja + domain terms + endings',semanticCorrectnessGuaranteed:false};return summary;
 }
 function crossesLine(unit){
  if(!unit.text.trim())return false;
  const rs=[...unit.range.getClientRects()].filter(r=>r.width>.1&&r.height>.1);
  return rs.length>1&&Math.max(...rs.map(r=>r.bottom))-Math.min(...rs.map(r=>r.bottom))>Math.max(...rs.map(r=>r.height))*.8;
 }
 function inspect(){
  const issues=[],phraseCandidates=[];
  for(const a of audit){
   const rootBox=a.root.getBoundingClientRect(),style=getComputedStyle(a.root),right=rootBox.right-(parseFloat(style.paddingRight)||0)-(parseFloat(style.borderRightWidth)||0),left=rootBox.left+(parseFloat(style.paddingLeft)||0)+(parseFloat(style.borderLeftWidth)||0);
   const oversize=a.units.filter(u=>a.oversize.includes(u.text)&&[...u.range.getClientRects()].some(r=>r.width>.1&&(r.right>right+1||r.left<left-1))).map(u=>u.text);
   if(oversize.length)issues.push({root:a.root,text:a.text,phrases:oversize,type:'語句の横はみ出し候補'});
   const words=[...new Set(a.wordUnits.filter(crossesLine).map(u=>u.text))];
   if(words.length)issues.push({root:a.root,text:a.text,phrases:words,type:'単語内の途中改行候補'});
   const phrases=a.units.filter(crossesLine).map(u=>u.text);
   if(phrases.length)phraseCandidates.push({text:a.text,phrases});
  }
  return {summary,issues,phraseCandidates};
 }
 function install(refresh){
  let timer,running=false;const callback=refresh||apply,observer=new MutationObserver(()=>schedule()),observe=()=>observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  const run=()=>{if(running)return;running=true;observer.disconnect();try{callback();}finally{running=false;observe();}},schedule=()=>{clearTimeout(timer);timer=setTimeout(run,150);};
  addEventListener('resize',schedule);document.addEventListener('click',schedule);document.fonts?.addEventListener?.('loadingdone',schedule);observe();schedule();
  return ()=>{clearTimeout(timer);observer.disconnect();removeEventListener('resize',schedule);document.removeEventListener('click',schedule);document.fonts?.removeEventListener?.('loadingdone',schedule);};
 }
 window.SiteReading={rawParse,phrases,splitLong,protectedOffsets,permitted,apply,inspect,install,hardTerms,crossesLine};
})();

/* Human-reviewed phrase boundaries for the eight existing article-card titles.
   Each array is one preferred phrase; its entries are the ONLY permitted
   fallback boundaries when the entire phrase exceeds the available width. */
(function(){
  'use strict';
  const definitions=[
    [['実家の片付け、'],['どこから','始める？'],['全部捨てなくてもいい'],['整理の進め方']],
    [['相続した実家、'],['どうする？'],['「売ること」に'],['罪悪感が','あるときに'],['考えたいこと']],
    [['誰も','住まなくなった','実家。'],['　　　　　　'],['「大丈夫そう」で'],['帰る前に｜'],['空き家','セルフチェック']],
    [['空き家を','“負債”に'],['しないために。'],['維持費と','選択肢を、'],['わかりやすく','比較']],
    [['空き家を','住資産として','考える'],['　'],['ケーススタディ','Vol.1'],['　'],['ペットと','暮らす家へ']],
    [['空き家を','放置すると'],['固定資産税が'],['「最大6倍」に？'],['知っておきたい'],['理由と、'],['今からできる','対策']],
    [['実家を','相続したら、'],['まず何から','始める？'],['やさしく','整理する'],['5つのステップ']],
    [['相続空き家の'],['3,000万円控除、'],['使うべき？'],['やさしく解説']]
  ];
  const selector='.al-title,.ra-title,.pickup-card h2,.pop-item h3,.article-title';
  const dictionary=new Map(definitions.map(groups=>[groups.flat().join(''),groups]));
  function apply(){
    let matched=0,overflow=0;
    for(const el of document.querySelectorAll(selector)){
      const text=el.textContent,groups=dictionary.get(text);
      if(!groups || !el.getClientRects().length)continue;
      const available=el.clientWidth;
      const fragment=document.createDocumentFragment();
      const append=part=>{
        if(!part.trim()){fragment.appendChild(document.createTextNode(part));return;}
        const span=document.createElement('span');span.className='semantic-review-phrase';
        span.style.whiteSpace='nowrap';span.textContent=part;fragment.appendChild(span);
        fragment.appendChild(document.createElement('wbr'));
      };
      // Measure text in the same inherited font; remove each probe immediately.
      const fits=part=>{
        const probe=document.createElement('span');probe.textContent=part;
        probe.style.whiteSpace='nowrap';el.appendChild(probe);
        markBrandTitleText(probe);
        const width=probe.getBoundingClientRect().width;probe.remove();return width<=available+0.5;
      };
      for(const group of groups){
        const phrase=group.join('');
        if(!phrase.trim() || fits(phrase))append(phrase);
        else for(const part of group){if(!fits(part))overflow++;append(part);}
      }
      el.replaceChildren(fragment);
      if(el.textContent!==text)throw Error('記事タイトルの文字内容が一致しません');
      matched++;
    }
    return {matched,overflow};
  }
  window.SemanticTitleReview={apply,definitions,selector};
})();


 /* Add display-only trademark marks to titles, keeping original text intact
    for the existing Japanese phrase matching and CMS title data. */
 function markBrandTitleText(root) {
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
  let node;
  while((node=walker.nextNode())){
   if(/つぎの明かり|住資産/.test(node.nodeValue)&&
      !node.parentElement.closest('.brand-trademark,script,style,svg,[data-reading-ignore]'))nodes.push(node);
  }
  for(const textNode of nodes){
   const text=textNode.nodeValue,fragment=document.createDocumentFragment();
   let at=0,changed=false;
   for(const match of text.matchAll(/(?:つぎの明かり|住資産)(?!™)/g)){
    fragment.append(document.createTextNode(text.slice(at,match.index)));
    const brand=document.createElement('span');
    brand.className='brand-trademark';
    brand.textContent=match[0];
    fragment.append(brand);
    at=match.index+match[0].length;
    changed=true;
   }
   if(changed){
    fragment.append(document.createTextNode(text.slice(at)));
    textNode.replaceWith(fragment);
   }
  }
 }
 function markBrandTitles() {
  for(const title of document.querySelectorAll('h1,h2,h3,h4,h5,h6,.article-title,.al-title,.ra-title')){
   if(!title.closest('.site-header,.site-footer,nav'))markBrandTitleText(title);
  }
 }

 function refresh() {
  window.TargetedReading.apply();
  window.SemanticTitleReview.apply();
  markBrandTitles();
  window.SiteReading.apply();
 }
 const domReady = document.readyState === 'loading'
  ? new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}))
  : Promise.resolve();
 state.ready=domReady.then(()=>document.fonts ? document.fonts.ready : undefined)
  .then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  .then(()=>{refresh();state.stop=window.SiteReading.install(refresh);});
 state.ready.catch(error=>console.error('くらしのつむぎ：改行調整を開始できませんでした。',error));
})();

/* Production: reuse reviewed image bytes without changing live CMS content. */
(function () {
  const images = new Map([
  [
    "https://images.microcms-assets.io/assets/3b2f8142aa584ad6a4d88f06a0b20e16/3fa10875ebd643698d6e492e708a8ed2/%E5%AE%9F%E5%AE%B6%E3%81%AE%E7%89%87%E4%BB%98%E3%81%91.png",
    "assets/article-media/56a28c7c7c22a96aa307.webp"
  ],
  [
    "https://images.microcms-assets.io/assets/3b2f8142aa584ad6a4d88f06a0b20e16/72542ead2eaf4d1d8afcc714bc6bd790/%E7%A9%BA%E3%81%8D%E5%AE%B6%E3%81%AE%E3%82%BB%E3%83%AB%E3%83%95%E3%83%81%E3%82%A7%E3%83%83%E3%82%AF.png",
    "assets/article-media/9e7473dfd65298198ed6.webp"
  ],
  [
    "https://images.microcms-assets.io/assets/3b2f8142aa584ad6a4d88f06a0b20e16/970032cdb5614b0681517d5ea30607f2/%E5%AE%9F%E5%AE%B6%E3%82%92%E6%80%9D%E3%81%86.png",
    "assets/article-media/aad712b63e1159f7167a.webp"
  ],
  [
    "https://images.microcms-assets.io/assets/3b2f8142aa584ad6a4d88f06a0b20e16/109d8dba09cc474fb39f67be11fe66c5/%E3%83%9A%E3%83%83%E3%83%88%E3%81%A8%E6%9A%AE%E3%82%89%E3%81%99%E5%AE%B6%E3%81%B8.png",
    "assets/article-media/28d3243c9a45d07dfeec.webp"
  ],
  [
    "https://images.microcms-assets.io/assets/3b2f8142aa584ad6a4d88f06a0b20e16/50b2380e9bae4330b322b8ca4fe3feb7/Gemini_Generated_Image_6j9ao66j9ao66j9a.jpeg",
    "assets/article-media/62c85a7c0fd1757fe6f4.jpeg"
  ],
  [
    "https://images.microcms-assets.io/assets/3b2f8142aa584ad6a4d88f06a0b20e16/7386a3b613a94ed7be641cfe13da617c/Gemini_Generated_Image_2a75q52a75q52a75.jpeg",
    "assets/article-media/68a870895840b87e6967.jpeg"
  ],
  [
    "https://images.microcms-assets.io/assets/3b2f8142aa584ad6a4d88f06a0b20e16/4db06ecdac714c13a1ad9b6d92d13261/%E7%A9%BA%E3%81%8D%E5%AE%B6%E3%81%AE%E8%B2%A0%E6%8B%85.png",
    "assets/article-media/955c72481297ce0ff7d0.webp"
  ],
  [
    "https://images.microcms-assets.io/assets/3b2f8142aa584ad6a4d88f06a0b20e16/3366f398e9824e67b1ba512802c83361/3000%E4%B8%87%E5%86%86%E6%8E%A7%E9%99%A4.png",
    "assets/article-media/065434777fc9650445e5.webp"
  ]
]);
  window.KurashiArticleImage = url => images.get(url) || url;
})();
