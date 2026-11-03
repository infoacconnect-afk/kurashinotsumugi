#!/usr/bin/env python3
"""Lossless fast font shards, audited on the 22 public page templates.
Unseen/future CMS characters keep using the existing full-coverage shards.
Run after subset-fonts.py when regenerating the original font CSS.
"""
import importlib.util, json
from pathlib import Path
from io import BytesIO
from hashlib import sha256
from fontTools import subset
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('font_base',ROOT/'build/subset-fonts.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
usage=json.loads((ROOT/'docs/font-usage-20261103.json').read_text())
manifest=json.loads((ROOT/'assets/fonts/subsets-manifest.json').read_text())
cssfile=ROOT/'assets/fonts-local.css'
marker='/* Fast exact-outline subsets; full Unicode fallback remains above. */'
css=cssfile.read_text().split(marker)[0].rstrip()+'\n'+marker+'\n'
folder=ROOT/'assets/fonts/fast';folder.mkdir(exist_ok=True)
preloads=[];stats=[]
for family,weight,source,preload in base.FACES:
    if family=='Noto Sans JP' and weight==400:
        # The paragraph canvas also needs the original common body coverage.
        # Reuse that same file rather than download both a small and a fallback.
        core=next(f for f in manifest['faces'] if f['family']==family and f['weight']==weight)['subsets'][0]
        preloads.append('/assets/fonts/subsets/'+core['file'])
        stats.append({'family':family,'weight':weight,'bytes':core['bytes'],'file':core['file'],'sharedCore':True})
        continue
    chars=set('™✓▶▷◀←→↑↓✕×−＋●○■□0123456789（）「」【】※・〜—−、。！？：／')
    for key,text in usage.items():
        fam,w=key.split('|');w=int(w)
        mapped=(500 if w<=500 else 700) if family=='Zen Maru Gothic' else (400 if w==400 else 500 if w==500 else 700)
        if fam==family and mapped==weight:chars.update(text)
    # Canvas measures mixed-weight paragraph runs before the final wrappers.
    # Cover all audited page text for the body and bold fallback faces so these
    # transient runs cannot trigger the larger legacy core.
    if family=='Noto Sans JP' and weight in (400,700):
        for text in usage.values():chars.update(text)
    original=TTFont(ROOT/'assets/fonts'/source,recalcTimestamp=False)
    points=set(map(ord,chars))&set(original.getBestCmap())
    font=TTFont(ROOT/'assets/fonts'/source,recalcTimestamp=False)
    options=subset.Options();options.layout_features=['*'];options.name_IDs=['*'];options.name_legacy=True;options.name_languages=['*'];options.glyph_names=True;options.recalc_timestamp=False
    worker=subset.Subsetter(options=options);worker.populate(unicodes=points);worker.subset(font);font.flavor='woff2'
    out=BytesIO();font.save(out);payload=out.getvalue();base.verify(original,TTFont(BytesIO(payload)),points)
    filename=sha256(payload).hexdigest()[:20]+'.woff2';(folder/filename).write_bytes(payload)
    css+=f"@font-face {{\n  font-family: '{family}';\n  font-style: normal;\n  font-weight: {weight};\n  font-display: block;\n  src: url(fonts/fast/{filename}) format('woff2');\n  unicode-range: {base.unicode_ranges(points)};\n}}\n"
    if preload:preloads.append('/assets/fonts/fast/'+filename)
    stats.append({'family':family,'weight':weight,'bytes':len(payload),'file':filename,'characters':len(points)})
cssfile.write_text(css)
manifest['preloads']=preloads;manifest['fast']=stats
(ROOT/'assets/fonts/subsets-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(stats,ensure_ascii=False,indent=2))
