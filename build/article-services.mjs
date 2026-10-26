// A reviewed article-to-service map. New or retitled articles keep the neutral
// consultation links until their content has been reviewed; no keyword guessing.
export const reviewedArticleServices = {
  "jikka-itsukanohanashi": {
    "title": "いつか戻る家、子どもに残す家。実家のこれからを、少し先まで考える",
    "intent": "lease"
  },
  "casestudy02": {
    "title": "空き家を住資産として考える ケーススタディVol.2｜自分好みに手を入れて暮らす家へ",
    "intent": "lease"
  },
  "jikka-sorekara1": {
    "title": "古い実家、そのまま貸せる？リフォームを始める前に考えたいこと",
    "intent": "lease"
  },
  "akiya-selfcheck": {
    "title": "誰も住まなくなった実家。「大丈夫そう」で帰る前に｜空き家セルフチェック",
    "intent": "watch"
  },
  "casestudy01": {
    "title": "空き家を住資産として考える　ケーススタディVol.1　ペットと暮らす家へ",
    "intent": "lease"
  },
  "fusainishinai": {
    "title": "空き家を“負債”にしないために。維持費と選択肢を、わかりやすく比較",
    "intent": "lease"
  },
  "3000koujyo": {
    "title": "相続空き家の3,000万円控除、使うべき？やさしく解説",
    "intent": "sale"
  }
};

const destinations = {
  lease: { href: 'sorekara.html#lease-use', label: '借上げ・賃貸活用を見る' },
  sale: { href: 'sorekara.html#sale-consultation', label: '売却のご相談について' },
  watch: { href: 'tsuginoakari.html', label: '空き家の見守りを見る' }
};

export function addArticleServiceLink(document, article) {
  document.querySelectorAll('[data-contextual-service]').forEach(el => el.remove());
  const reviewed = reviewedArticleServices[article.slug];
  if (!reviewed || reviewed.title !== article.title) return;
  const buttons = document.querySelector('.contact-cta .contact-cta-buttons');
  if (!buttons) return;
  const target = destinations[reviewed.intent];
  const link = document.createElement('a');
  link.href = target.href; link.textContent = target.label;
  link.className = 'btn btn-outline btn-large';
  link.dataset.contextualService = reviewed.intent;
  buttons.insertBefore(link, buttons.querySelector('a[href^="contact"]'));
}
