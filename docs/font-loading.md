# Font delivery

The existing Noto Sans JP (400/500/700) and Zen Maru Gothic (500/700)
fonts, CSS family names, sizes and layout rules are unchanged. Their original
WOFF2 files and OFL licenses remain in `assets/fonts/` as the source of truth.

`build/subset-fonts.py` generates checked-in WOFF2 subsets and
`assets/fonts-local.css`. Each weight has a common-character subset shared by
all pages and disjoint Unicode ranges for the remaining characters. The union
of these ranges covers every character in the original font. New CMS articles
and names entered in the form can therefore use characters outside today's
common subset without rebuilding the fonts.

The generator checks every supported character's outline, horizontal and
vertical advance, and the global ascent/descent metrics after WOFF2 encoding.
It preserves hinting, OpenType layout features, names and license records.
Regeneration requires Python with FontTools 4.61.1 and Brotli 1.2.1; Netlify
only serves the committed output and has no new runtime dependency.

The HTML build preloads only the common Noto Sans JP 400/500 and Zen Maru
Gothic 500 subsets used for body text, navigation and headings. Other weights
and uncommon-character subsets load on demand. Content-hashed font files
receive one-year immutable caching; the font stylesheet must revalidate.

`font-display: block` briefly waits for the requested font instead of showing
the system font immediately. This uses the browser's bounded block period;
there is no site-wide JavaScript page-hiding gate. On very slow or failed connections
the browser can still show a fallback so the page remains readable. The
change reduces the normal font swap; it does not guarantee zero swaps on
every network. Do not replace it with an unbounded font-ready/visibility gate.

Checks before publishing: first use of the new font URLs, navigation between
pages, existing font sizes/line wrapping, current and uncommon CMS characters,
font cache headers, and preview GA4 exclusion. Keep real-device checks separate
from desktop browser checks. Production requires approval of the final preview.

The homepage entrance, separately requested by the owner, is one 1.2-second
opacity animation on the entire body (including the header, background and
footer). Its first frame is paused until fonts, first-view images and the initial
reviewed line-breaking pass settle, with a 2.5-second deadline. Releasing the
pause never recreates the animation. Opacity preserves layout measurements;
visibility is not toggled. Late readiness cannot hide or replay the page.
Reduced-motion users see the page immediately. Other pages do not use this gate.
Page and section titles share the existing upward fade without changing final
positions; the inquiry form and its body copy remain immediately visible.
