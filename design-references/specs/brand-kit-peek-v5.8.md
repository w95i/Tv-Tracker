# Brand kit v5.8 — "Peek"

Source: `originals/tvtracker-peek-figma-board-v5.8.svg` (Figma board export, 2400 × 4340).

Tagline on the board: **Every episode. Every feeling.**
Idea: two eyes peeking over the couch — the moment you can't look away.

## Logo

- **Mark:** a rounded black square, an amber "wall" across the bottom half, and two white eyes with black pupils peeking over it.
- **Wordmark:** lowercase `tvtracker`. On dark: "tv" amber, "tracker" white. On light: all ink `#15161C`.
- On dark surfaces (`#15161C`) the mark keeps its black.
- Mark variants: Primary · Amber · Light · Black (one colour) · White (one colour).
- App icons: Rounded (default) · Circle (Android) · Light · Amber (marketing) · Mono (one colour) · Micro (32 px and below).

> **Decision (16 Oct 2026): new pages use the Peek lockup.** `tv-trucker-frontend` already does: `public/images/brand/peek-logo-dark.svg`, `peek-logo-light.svg` (horizontal lockup, viewBox 1026.14 × 256) and `peek-icon.svg` (favicon), all cut straight from this board.
> The landing HTML designs still show the older "TVTracker" wordmark PNG. The live site at tvtracker.tv/app uses a *different* icon (an amber "T" glyph on a navy gradient, `/app/brand/tvt-icon-rounded.svg`) next to the "TVTracker" wordmark — not Peek.

## Colour

| Name | Hex | Use |
|---|---|---|
| Amber | `#FFC42E` | the wall, "tv" |
| Black | `#000000` | logo sky, pupils |
| Surface | `#15161C` | dark backgrounds |
| White | `#F4F5F8` | the eyes |
| Muted | `#9AA3BD` | captions |
| Light ground | `#F5F5F7` | light theme |
| Ink | `#15161C` | logo on light |
| Amber ink | `#1C1400` | text on amber |
| Emoji blue | `#3D9BFF` | the tear (Sad) |

Font on the board: Figtree.

## Feelings — "How did it make you feel?"

12 Peek emoji: Shocked · Frustrated · Sad · Reflective · Touched · Amused · Scared · Bored · Understood · Thrilled · Confused · Tense.

In the app:
- The section sits on Surface `#15161C` so the black tiles read. 390 pt wide.
- Emoji tiles 54 × 54 pt (48 pt PNGs scale cleanly).
- Card: Surface `#15161C`, radius 22, 4 columns × 3 rows.
- Labels: Figtree Bold 14, `#C9CDDA`.
- **Never change the emoji's black — change the background.**

## Motion — four Lottie files

| Name | File | Length | Keyframes |
|---|---|---|---|
| Blink | `peek-blink` | 0.67 s | 0 · 200 · 233 · 317 · 650 ms |
| Wink | `peek-wink` | 1.1 s | 0 · 183 · 367 · 600 ms · 1.1 s |
| Eye roll | `peek-eye-roll` | 1.53 s | 0 · 233 · 500 · 783 ms · 1.1 · 1.53 s |
| Pupils dilate | `peek-pupils-dilate` | 1.6 s | 0 · 217 · 450 ms · 1.15 · 1.6 s |

The Lottie/GIF files themselves are **not** in this folder. Ask for them when an animated logo is needed.
