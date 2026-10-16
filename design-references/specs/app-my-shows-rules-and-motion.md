# My shows / Upcoming: rules and motion (mobile app)

Copied from the "Developer handoff" panel in `originals/tvtracker.html` (tabs "Rules" and "Motion spec").
Show data in that prototype is real, from TVmaze (fetched 27 Sep 2026).

## Rules

- **Watching now** has shows watched in the last N days (default 30). The most recent one is the hero card.
- **Been a while** has shows with no progress for N+ days. Sorted with the chip ("Recently watched", …).
- **+N** is the number of aired episodes left after the current one. At 0 it shows **FINALE** if the series has ended, or **LATEST** if it's still running.
- **Last episode:** **ALL CAUGHT UP** if the show is still running (no confetti), **SERIES COMPLETE** if it has ended (confetti and "N episodes watched"). The show then leaves the list.
- A show from Been a while that you watch becomes the hero, and both counts update.
- Input is locked while a card animates, so double taps can't mark two episodes.
- **Upcoming groups:** Today · This week (1–7 days) · This month (8–31) · Later (32+).
- **List / Grid:** one amber icon on a slim row under the tabs (no logo bar; notifications need a new home). It shows the view you will switch to, changes the page whose tab is selected, and each page remembers its own choice. The icon updates when you swipe.
- **Grid** shows 3 posters per row with no hero, so about 9 shows fit on one screen.
- **Grid tile:** season/episode on the poster, ✓ bottom-right (44px touch area), FINALE or LATEST tag on the last aired episode, amber bar = episodes watched ÷ episodes aired. Upcoming tiles show a countdown (TODAY in amber) and a PREMIERE or FINALE tag. In grid view Upcoming is one continuous grid, soonest first (no date groups).
- Dev panel settings: "Been a while" total, "Been a while" threshold (days, default 30), "Today" date for countdowns. Episode labels: New episode · Season premiere · Series premiere · Season finale · Series finale.
- Device safe-area presets: iPhone Dynamic Island 59px · iPhone Pro 62px · Android punch-hole 40px.

## Motion: Mark watched (list)

| Step | Time | What moves |
|---|---|---|
| Press | 0 | Button scales to 0.88. Light haptic. |
| Sweep in | 0–420ms | Amber panel translateX(-100% → 0), cubic-bezier(.65,0,.35,1) |
| Confirm | 180–600ms | Badge pops 0→1 on a spring, then the check stroke draws on. "WATCHED" fades in from −8px. Success haptic. |
| Hold | 420–1070ms | Readable. The card swaps to the next episode underneath. Fire the API call. |
| Sweep out | 1070–1530ms | Panel exits right. New info enters from −28px (opacity 0→1, +110ms). |
| Promote | +80ms, 500ms | The card morphs into the hero, the old hero shrinks into row 1. cubic-bezier(.2,0,0,1) |
| From Been a while | 600ms | Same morph, longer because the card travels further. Sections reflow, counts update. |
| Last episode | hold 1.4s / 2.6s | ALL CAUGHT UP: amber card holds 1.4s, no confetti. SERIES COMPLETE: "N episodes watched" + multicolour confetti over the whole screen (two corner bursts + ~2.5s of rain), holds 2.6s. Then the card fades (220ms) and the list closes up (500ms). Reduce Motion: no confetti. |
| Swipe pages | native | Scroll-snap pager. The tab underline follows the finger 1:1. |

## Motion: Grid view

| Step | Time | What moves |
|---|---|---|
| Switch view | 260ms | Crossfade and settle: opacity 0→1, translateY 6px→0, scale .985→1. No layout shift; the switch lives in the top bar. |
| Mark watched | same as list | Amber panel sweeps over the poster, badge pops, "WATCHED". Next episode and progress bar update under the panel. |
| Reorder | 500ms | FLIP: every poster glides from its old cell to its new one, (.2,0,0,1). The watched show becomes first in Watching now. |
| Last episode | hold 2.6s / 1.4s | SERIES COMPLETE + confetti (ended) or ALL CAUGHT UP (running). The poster fades, the grid closes the gap. |

## Check badge

Dark circle, amber check. The ink circle (28px, 34px on the hero) pops in on a spring, then the amber check draws on — a clear "stamp", matching the Figma file.
Contrast: ink `#1C1400` on amber is about 11.5:1; the amber check on ink matches it.

## Motion tokens (from the prototype's `:root`)

```
--ease-in-out: cubic-bezier(.65,0,.35,1)   sweep in / out
--ease-out:    cubic-bezier(.22,1,.36,1)   content entering
--emph:        cubic-bezier(.2,0,0,1)      layout moves (Material "emphasized")
--spring:      cubic-bezier(.34,1.56,.64,1) check pop
--t-sweep-in: 420ms   --t-sweep-out: 460ms   --t-move: 500ms (600ms for Been a while → hero)
Reduced motion: --t-move: 1ms
```
