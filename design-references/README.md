# TVTracker design references

The source designs for everything we build in `tv-trucker-frontend`. They come from the systems and mobile apps already built for TVTracker.
The live product is **https://tvtracker.tv/app**.

**Rule:** when building a page, find its design here first and match it exactly — tokens, spacing, copy, motion. Don't invent UI that a reference already defines.

## Folders

```
design-references/
  originals/   the files exactly as received (open these in a browser, they're self-contained)
  readable/    the same files with embedded base64 images replaced by "[STRIPPED nKB]" — read/grep these
  specs/       notes pulled out of the designs: rules, motion, brand kit, live-site map
  serve.mjs    tiny static server for originals/
```

To view them: run `node design-references/serve.mjs` from `D:\TVTrucker`, or start the "design-references" entry in `.claude/launch.json`. Then open http://localhost:3200.
Many prototypes have a control bar at the top (title, state, theme) to switch between variants.

## Inventory

| File | What it is | Size |
|---|---|---|
| `tvtracker-landing_2.html` | **Landing page — the one built in `tv-trucker-frontend`.** Hero with a poster fan around the app screenshot, then "Why TVTracker" with three cards (Up next, Moods, Import). | 0.8 MB |
| `tvtracker-landing.html` | Landing variant: hero → "Bring your history from anywhere" (import) → "Trending this week" rail → "Browse by genre". **`tvtracker-landing_1.html` is a byte-identical copy.** | 2.2 MB |
| `tvtracker-landing (1).html` | Landing variant: hero with chips (No ads · English & العربية · Import from TV Time) → "TV Time closed. Your history doesn't have to." (import, pinned scroll story) → "Browse by genre". | 4.3 MB |
| `tvtracker-landing_8.html` | Landing variant: hero + chips → "Bring your history from anywhere" (from 6 apps: TV Time, Trakt, IMDb, Letterboxd, Bingers, notes) → "Browse by genre". | 3.6 MB |
| `tvtracker.html` | **Mobile app prototype** (402 × 874 phone + developer handoff panel). Tabs: Shows (My shows / Upcoming), Movies (Watchlist / Upcoming), Search (mood discovery), Profile. Rules and motion → `specs/app-my-shows-rules-and-motion.md`. | 4.6 MB |
| `tvtracker-web.html` | **Web app prototype** (desktop, responsive). Discover, Shows, Movies, Collections, Profile, Settings, lists, title, person and stats pages. | 6.8 MB |
| `tvtracker-series-web.html` / `-series-app.html` | Series (show) page, web / phone. Variant switches: Severance (Returning), Breaking Bad (Ended), 1899 (Canceled), Harry Potter (Upcoming); state Not added / Watchlist / Watching / Completed; logo or text title; dark / light. | 0.2 MB each |
| `tvtracker-movie-web.html` / `-movie-app.html` | Movie page, web / phone. Variants: The Odyssey, Project Hail Mary, Avengers: Doomsday; state Not added / Watchlist / Watched. | 2.5 MB each |
| `tvtracker-user-profile.html` | Someone else's profile (phone and website). Switches: public / private account, following / not, which sections they show (Stats, Lists, Shows, Fav shows, Movies, Fav movies, Watchlist, Characters, Actors). | 0.3 MB |
| `tvtracker-peek-figma-board-v5.8.svg` | **Brand kit v5.8 "Peek"** — new logo, colours, 12 feelings emoji, logo motion. → `specs/brand-kit-peek-v5.8.md` | 0.1 MB |

## Specs

- [specs/app-my-shows-rules-and-motion.md](specs/app-my-shows-rules-and-motion.md) — My shows / Upcoming logic (Watching now, Been a while, +N, FINALE/LATEST, ALL CAUGHT UP / SERIES COMPLETE, upcoming groups, grid view) and the mark-watched motion timeline.
- [specs/brand-kit-peek-v5.8.md](specs/brand-kit-peek-v5.8.md) — logo, palette, feelings emoji, Lottie keyframes.
- [specs/live-site-tvtracker-tv-app.md](specs/live-site-tvtracker-tv-app.md) — live routes, header, Discover sections, show page anatomy, live CSS tokens.

## Shared design language

**Fonts:** Figtree 400–800 (UI and body), Archivo 800 (display headings). Arabic: Readex Pro in the landing designs; the live site uses IBM Plex Sans Arabic (body) and Cairo (headings). The mobile prototype also loads JetBrains Mono for its dev panel only.

**Brand:** amber `#FFC42E` on black. Text on amber is ink `#1C1400` (≈ 11.5:1). In light theme amber stays a *fill* (buttons, bars, underlines, badges, the watched sweep) but amber *text and icons* turn near-black, because amber text fails contrast on white.

### Tokens — landing (`tvtracker-landing*.html`, used in `tv-trucker-frontend`)

```
dark:  --bg #000  --surface #111217  --surface-2 #1a1b22  --line rgba(255,255,255,.08)
       --text #f4f5f8  --heading #f6f7fb  --muted #8e96ad  --dim #c3c8d6
       --amber #ffc42e  --ink #1c1400  --accent #ffc42e  --ph #1d1e25
light: --bg #f5f5f7  --surface #fff  --surface-2 #ececf0  --line rgba(16,18,27,.09)
       --text #15161c  --heading #0e0f14  --muted #5e6476  --dim #3f4557  --accent #8a5d00  --ph #e2e3e9
--gut clamp(20px,5vw,64px)   max width 1240px   --ease cubic-bezier(.22,1,.36,1)
```

### Tokens — app and web prototypes (`tvtracker.html`, `tvtracker-web.html`, title and profile pages)

```
dark:  --bg #000  --surface #15161C  --surface-2 #1f2029  --line rgba(255,255,255,.08)
       --text #F4F5F8  --heading #F4F6FF  --muted #9AA3BD  --muted-2 #8790a8  --dim #C9CEDC
       --amber #FFC42E  --ink #1C1400  --accent-fg var(--amber)  --ph #22232b  --menu/--sheet #111217  --toast #1d1e26
       --green #3DDC84  --purple #9B7BFF  --red #FF453A  --toggle-off #39393d  notification dot #FF4D5E
light: --bg #f5f5f7  --surface #fff  --surface-2 #ececf0  --line rgba(16,18,27,.09)
       --text #15161c  --heading #0e0f14  --muted #5e6476  --muted-2 #6b7183  --dim #3f4557
       --accent-fg #15161c  --ph #e2e3e9  --menu #fff  --green-fg #10813D  --purple-fg #6D48E0  --red #E5242B
radius: card 16px · row 14px · poster 12px
web layout: --maxw 1600px  --gut clamp(20px,5vw,80px) → 24px ≤1100px → 16px on phones; sticky 64px header with blur
motion: --ease-out cubic-bezier(.2,0,0,1) (web) / (.22,1,.36,1) (app)  --ease-io (.65,0,.35,1)  --spring (.34,1.56,.64,1)
ambient: amber radial "glow" top-left, rgba(255,178,41,.05–.07)
```

The **live site** has moved further: navy-tinted `--bg #07080f`, translucent surfaces, gold/blue/violet/mint accents, watch-state colours. See the live-site spec.

## Screen map

**Mobile app** (`tvtracker.html`): bottom tab bar Shows · Movies · Search · Profile (avatar).
- Shows → My shows (Watching now with hero card, Been a while, Returning, Completed) | Upcoming (Today / This week / This month / Later). List ↔ grid toggle.
- Movies → Watchlist (poster grid, sort chip "Recently added") | Upcoming.
- Search → search field + "What to watch tonight?" mood tiles (Surprise me, Make me laugh, Edge of my seat, Feel good, Mind-bending, Something epic, A good cry).
- Profile → cover, avatar with level badge, followers/following/comments, show time / movie time / counts, My lists, Shows, Movies, favourites, levels, badges, XP, stats stories.

**Web app** (`tvtracker-web.html`): header Discover · Shows · Movies · Collections, search (⌘K), notifications, avatar menu (Profile, Settings, News, Sign out).
- Discover: mood picker ("What to watch tonight?"), Trending movies, Trending episodes, Box office, Because you watched…, TVTracker Collections, Charts, Streaming services, Popular people, Complete the collection, Awards.
- Shows: My shows / Upcoming tabs; Watching now (3 wide cards), Been a while, Returning, Completed.
- Movies: Watchlist / Upcoming.
- Profile, Settings (Account · Privacy · Appearance · Notifications · Data · Support · Subscription · Sign out), list pages, title pages, person pages, stats.

**Title pages:** poster + backdrop, network, title logo, meta row, IMDb / TVT ratings, Start watching / Trailer / watchlist / ⋯, Episodes (season tabs, mark season, hide titles), Cast, Where to watch, Gallery, Videos, More like this, Details, Keywords, Production companies, Comments.

## Decisions

- **Logo (16 Oct 2026):** use the **Peek** lockup from brand kit v5.8 (eyes mark + `tvtracker` wordmark) everywhere, even though the landing HTML shows the old wordmark and the live site uses a different "T" icon. Files: `tv-trucker-frontend/public/images/brand/peek-*.svg`.

## Open questions
- **Arabic fonts:** Readex Pro (landing) or IBM Plex Sans Arabic + Cairo (live site)?
- **Palette:** pure black prototypes, or the navy-tinted live palette?
