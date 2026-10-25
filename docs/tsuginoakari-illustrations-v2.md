# つぎの明かり 挿絵の更新記録

生成方法: 内蔵画像生成ツール（built-in）。

ユーザー提供の3点を順に郵便物転送・通風通水・巡回表示看板の内容参考とし、既存の臨時巡回イラストを共通の画風参考に使用。臨時巡回は元絵の構図を保ち、天候・光を調整。いずれもサービスのイメージであり、実際の作業写真・実物の看板仕様ではない。

1536×1024の生成画像を、構図・画素寸法を変えずWebP quality 82に変換。画像の編集自体は画像生成ツールで実施。

## mail

保存先: `assets/tsuginoakari/mail-v2.webp`

最終プロンプト:

```text
Website service-card illustration for Japanese home care brand くらしのつむぎ. Landscape 3:2. Match the supporting watercolor reference's refined hand-painted watercolor and fine pencil outlines, warm ivory paper, muted sage green, soft warm brown and beige. Detailed yet calm, natural everyday work, tasteful and believable, not a cartoon icon. No watermark, no UI, no border, no extra written text except where explicitly requested. Use case: style-transfer. Image 1 is the subject/action/composition reference. Image 2 is ONLY the watercolor/style/palette reference. Recreate the central scene from image 1 as an illustration: a female adult caretaker on the right leaning toward a small horizontal mailbox integrated into a low concrete masonry gate wall at the left, retrieving unopened ordinary letters, with a clipboard/document folder held against her body in the other arm. Preserve this practical mailbox-checking action, wall-mounted mailbox, spatial arrangement and residential setting. Render her clothing in muted dark sage/charcoal, do not make a glamour portrait. Include a few unopened plain envelopes in the hand at the mailbox to communicate postal collection. Never depict opened personal correspondence, readable addresses, names or logos. Do not substitute a freestanding wooden mailbox or a staged stack of tied letters.
```

## indoor

保存先: `assets/tsuginoakari/indoor-v2.webp`

最終プロンプト:

```text
Website service-card illustration for Japanese home care brand くらしのつむぎ. Landscape 3:2. Match the supporting watercolor reference's refined hand-painted watercolor and fine pencil outlines, warm ivory paper, muted sage green, soft warm brown and beige. Detailed yet calm, natural everyday work, tasteful and believable, not a cartoon icon. No watermark, no UI, no border, no extra written text except where explicitly requested. Use case: style-transfer. Image 1 is the subject/action layout reference: TWO complementary actions in one coherent illustration, opening a window on the LEFT and running water at a faucet on the RIGHT. Image 2 is ONLY the watercolor style/palette reference. Interpret the two demonstrative vignettes of image 1 in the same watercolor style as image 2. Left: adult caretaker in muted sage workwear opens a residential sliding window, curtains gently moving with fresh air. Right: another small vignette of caretaker in the same workwear turns on a normal kitchen or washbasin tap, a clearly visible modest stream of clean water flowing into the sink, holding a simple clipboard in the other arm. Show both ventilation and water flushing equally clearly within one landscape 3:2 image, separated naturally by soft ivory space, no hard panel borders. Preserve the reference's two-action concept and orientation. No speech bubbles, arrows, labels or unrelated activities. Natural hands and anatomically correct arms.
```

## sign

保存先: `assets/tsuginoakari/sign-v2.webp`

最終プロンプト:

```text
Website service-card illustration for Japanese home care brand くらしのつむぎ. Landscape 3:2. Match the supporting watercolor reference's refined hand-painted watercolor and fine pencil outlines, warm ivory paper, muted sage green, soft warm brown and beige. Detailed yet calm, natural everyday work, tasteful and believable, not a cartoon icon. No watermark, no UI, no border, no extra written text except where explicitly requested. Use case: style-transfer. Image 1 is the EXACT lettering/content reference for the notice sign. Image 2 is ONLY the watercolor/style/palette reference. Create a close, legible watercolor illustration of a modest rectangular white patrol notice sign secured to an existing residential entrance fence, with softly painted house and plants in the background. The sign is the main subject, nearly frontal, large enough to read easily at service-card size. Paint the EXACT Japanese text in two centered lines as the reference: first line 「巡回パトロール」 second line 「実施中」. Use strong muted indigo/navy blue lettering closely following the reference, all characters correct and readable. No company logos, telephone numbers or extra text. No freestanding wooden garden sign or blank notice board. The sign should look like a service-notice example, not an advertisement. Maintain gentle watercolor character while keeping the text sharp.
```

## visit

保存先: `assets/tsuginoakari/visit-v2.webp`

最終プロンプト:

```text
Use case: lighting-weather. Edit target: the supplied watercolor illustration. Change ONLY the weather and related illumination: make it slightly overcast with subdued gray-blue clouds, a very light drizzle, subtly damp stone path, reduced direct sunshine and softer shadows. This is mild bad weather, NOT a typhoon, storm, flood or dangerous conditions. Preserve the SAME house architecture, garden, composition, camera angle, adult caretaker seen from behind, sage clothing and cap, clipboard, pose, all objects and their positions. Preserve the existing detailed watercolor/pencil style and warm ivory/sage/brown palette, with modest cooler light; keep clear visibility and reassuring mood. No new people, umbrella, text or objects. Landscape 3:2; no crop.
```

## 追加の服装調整

郵便物転送は淡い緑の作業着、臨時巡回は同系色のカッパに変更。元画像の構図・動作・背景を維持する編集。保存先は上記の同名WebP。

### mail 最終編集プロンプト

```text
Use case: precise-object-edit. Image 1 is the EDIT TARGET: watercolor illustration of woman retrieving unopened letters from a wall mailbox. Image 2 is ONLY the workwear color/style reference. Change ONLY the woman's dark business jacket and trousers to a coordinated muted light sage-green practical work jacket and matching work trousers, like the caretaker workwear in image 2. Keep her exact identity, hair, face visibility, body pose, both hands, mailbox action, letters, clipboard, all surrounding houses, wall, plants, composition, lighting, watercolor/pencil textures and 3:2 framing unchanged. Natural work jacket with simple pockets, no logos. Do not add cap, gloves, new objects or other changes. Preserve every other aspect of image 1.
```

### visit 最終編集プロンプト

```text
Use case: precise-object-edit. Edit target: supplied watercolor illustration of caretaker inspecting a house in light rain. Change ONLY the caretaker's clothes to a muted sage-green lightweight rain suit (Japanese kappa): waterproof hooded rain jacket worn with the hood up and matching waterproof rain trousers, naturally draping on the same body. Hood covers the cap naturally, keep the man viewed from behind, identical body position, clipboard and hands. Keep the SAME house architecture, garden, path, weather (overcast slight rain), wet surfaces, lighting, object locations, camera angle, refined watercolor/pencil style and 3:2 composition. No umbrella, new people, text or objects. Preserve all other aspects of the supplied image exactly.
```
