# Portfolio — Cédric Jaupitre (v2)

Static site: no build step, no framework. Open `index.html` in a browser to preview.

| File | What it is |
| --- | --- |
| `index.html` | Page structure + styles. Each experience is an `<article class="chapter">` |
| `assets/content.js` | **All texts** in English / 日本語 / Français |
| `assets/scenes.js` | Hand-drawn animated backgrounds (circuit, tokyo, waves, road, muji, fuji, paris…) |
| `assets/app.js` | Globe, language switch, interactions |
| `assets/game.js` | Closing mini-game (table tennis) |
| `assets/globe-data.js` | Land dots for the globe (don't edit) |
| `assets/logos/` | Logos — they appear automatically when the file exists |
| `assets/photos/` | Photos — same |

## Logos (PNG, ideally square, any background: they sit on a white tile)
`samsung.png` `uniqlo.png` `swisslife.png` `stellantis.png` `muji.png` `essec.png` `edhec.png` `cuhk.png`

## Photos (JPG, landscape, ~1600px wide)
`samsung.jpg` `uniqlo.jpg` `swisslife.jpg` `stellantis.jpg` `muji.jpg` (experiences) · `essec.jpg` `edhec.jpg` `cuhk.jpg` (schools) · `portrait.jpg` (profile card, top-left)

## Direct link to a language
`https://your-site/?lang=ja` (or `#ja`) · `?lang=en` · `?lang=fr`

## Deploy
Push this folder to GitHub, import the repo in Vercel (Framework preset: "Other").

## Photo galleries
Listed in `assets/photos.js` (ch1…ch5 = experiences, eg1…eg5 = commitments).

## Leadership section
Links: `ENGAGE_LINKS` at the top of `assets/content.js`.

## Language
The site opens in the visitor's browser language: French → FR, Japanese → 日本語, anything else → EN.
