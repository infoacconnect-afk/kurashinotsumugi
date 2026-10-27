import test from 'node:test';
import assert from 'node:assert/strict';
import { articleCopy, housingCopy } from '../build/editorial-copy.mjs';

test('article wording preserves service names, links, images and HTML structure', () => {
  assert.equal(housingCopy('実家の「これから」と、これからのすまい。これからも。'), '実家の「未来」と、これからのすまい。今後も。');
  const source = {slug:'jikka-itsukanohanashi', title:'実家のこれから', excerpt:'これからどうする？', eyecatch:'https://example.com/これから.png', eyecatchAlt:'家のこれから', body:'<h2 id="keep">実家の&quot;これから&quot;</h2><p>これからのすまいへ<a href="/これから">これから考える</a><img src="/これから.png" alt="家のこれから"></p>'};
  const result = articleCopy(source);
  assert.equal(source.title,'実家のこれから');
  assert.equal(result.title,'実家の未来');
  assert.equal(result.excerpt,'今後どうする？');
  assert.equal(result.eyecatch,source.eyecatch);
  assert.equal(result.slug,source.slug);
  assert.equal(result.body,'<h2 id="keep">実家の"未来"</h2><p>これからのすまいへ<a href="/これから">今後考える</a><img src="/これから.png" alt="家の未来"></p>');
  assert.deepEqual(articleCopy(result),result);
});


test('new service-related content is not subject to the empty-house wording migration', () => {
  const article = {slug:'korekara-plan',title:'これから家を建てる方へ',excerpt:'これからのすまいで相談',body:'<p>これからの家づくりを考える。</p>'};
  assert.deepEqual(articleCopy(article), article);
});
