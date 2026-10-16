# Live site — https://tvtracker.tv/app

Looked at on 15 Oct 2026, signed out. This is the production web app; the prototypes in `originals/` are its design source.

## Tech

- Vite single-page app (`/app/assets/index-*.js`), installable PWA (`registerSW.js`), Cloudflare in front.
- `<html lang="en" dir="ltr">`, dark by default.
- Fonts: body **"Figtree Variable", "IBM Plex Sans Arabic"**; headings **"Archivo Variable", "Cairo Variable"**.
  (The landing designs use Readex Pro for Arabic instead. Pick one family per role before building Arabic pages.)
- Data: TMDB (films/TV/images), JustWatch (where to watch), news feeds (Polygon, etc.).
- **Public API** (no key, CORS-free from the shell): `https://tvtracker.tv/api/v1/media/shows/{tmdbId}?lang=en|ar` and `/movies/{tmdbId}`, returning `{ success, data }`. `data` has title/name, tagline, overview, genres, poster/backdrop/logo (TMDB URLs by size), cast, ratings `{ app, app_count, imdb, imdb_votes, rotten_tomatoes, metacritic }`, omdb (awards, rated), status, content_rating / certification, runtime, seasons, providers, videos, similar. `lang=ar` gives Arabic text. Seasons: `/shows/{id}/seasons/{n}?page=1`. Used to generate `tv-trucker-frontend/app/data/hero-titles.ts`.

## The live landing page (https://tvtracker.tv/)

Separate from `/app`; a landing in the live site's navy style, with the Peek tagline as its title ("TVTracker — Every episode. Every feeling."). Sections: hero · tagline · features · screens · platforms · apps. Its copy is the official product voice and is used in `tv-trucker-frontend`'s About section:
- Hero: "Your watchlist, evolved" / "Every episode. Every feeling." / "Track what you watch, rate every episode, and share the moments that hit — with the people who get it." / "Free to use. Works in the browser — no install needed."
- Tagline: "Lights down. Gold up." / "One place for the films and shows you have finished, the ones you are halfway through, and the ones you keep meaning to start."
- Features ("What it does — Built for people who finish things"): Every episode, ticked off · Rate it, and say how it felt · Stats that earn themselves · Bring your history with you (IMDb, Letterboxd, Trakt, TV Time, CSV) · Never miss a return · And where to watch it (JustWatch).
- Screens ("Real screens. No mockups."), platforms ("One library. Every screen." — Web, iPhone, iPad, Android).
- Footer: "Designed & developed by Alphabet", "Film and show data and artwork by TMDB and TheTVDB. Watch data by JustWatch.", Roadmap → https://github.com/Alphabet-iq/tvtracker-roadmap

## Header

Logo: 30px rounded icon (`/app/brand/tvt-icon-rounded.svg`: amber "T" glyph on navy `#0B0D18` with amber and blue glows, box-shadow `0 3px 12px #ffc42e2e`; **not** the Peek eyes) + 165×18 "TVTracker" wordmark (`tvtracker-wordmark-dark.svg` / `-light.svg`, shown from the lg breakpoint up) · Discover · Shows · Movies · Collections · News · More ▾ · search "Search titles, people, watchers ⌘K" · Sign in.
More: People · Top 250 · Awards · Streaming · Leaderboard · Challenges.
Signed-out visitors get a "Join TVTracker — Track everything you watch · Sign in" toast in the bottom right.

## Routes

| Path | Page |
|---|---|
| `/app` | Discover (home) |
| `/app/shows`, `/app/movies` | My shows / My movies |
| `/app/collections`, `/app/collections/:id` | TVTracker collections |
| `/app/news`, `/app/news/:id` | News |
| `/app/search` | Search |
| `/app/show/:id`, `/app/movie/:id` | Title pages (TMDB ids) |
| `/app/person/:id`, `/app/people` | People |
| `/app/box-office` | Box office |
| `/app/discover/trending`, `/hot`, `/acclaimed`, `/popular`, `/trending-episodes`, `/browse`, `/genre/:id` | Discover lists |
| `/app/top-250/movies`, `/app/top-250/shows` | Top 250 |
| `/app/streaming` | Streaming services |
| `/app/awards`, `/app/awards/:id` | Awards |
| `/app/leaderboard`, `/app/challenges` | Gamification |

## Discover sections (in order)

Latest news hero + More headlines · Hot news · Box Office (US domestic, ranked 1–10 with big outlined numbers, NEW / ▼N badges, weekend gross, week, total) · Trending episodes · Hot now · Trending movies · Critically acclaimed · Most trending actors · Top 250 Movies / Shows · Popular shows · Streaming services · TVTracker Collections · Awards · Browse by genre.

## Show page (`/app/show/:id`)

Poster left, backdrop right · network logo · title logo art · rating badge (TV-14) · year · seasons · episodes · genres · status pill (RETURNING) · TVT score · "Reveal synopsis (spoilers)" · Trailer · Add to watchlist · ⋯.
Next up / Latest episode cards · Episodes (season tabs with watched count, legend Finished / Watching / Not started, Reveal titles, Mark season watched, per-episode ✓ and "Watched up to here") · Cast · Created by · Gallery · Videos · More like this · Details · Keywords · Production companies · Networks.

## Design tokens (computed from the live CSS)

Note: the live palette has moved on from the prototypes — navy-tinted background, translucent surfaces, extra accent colours.

```
--bg: #07080f            --bg-1: #0b0d18           --stage: #11142a
--surface: #ffffff0e     --surface-raised: #ffffff17   --line: #ffffff17
--text: #f4f6ff          --text-dim: #9aa3bd       --text-faint: #5d6580
--gold: #ffc42e  --gold-hover: #ffcf3d  --gold-pressed: #f0ac00  --gold-bright: #ffda2b
--gold-text: #ffcf3d  --gold-ink: #4a3600  --gold-soft: #ffc42e24  --gold-border: #ffc42e80
--blue: #3e6df0  --blue-text: #8fb0ff  --blue-soft: #3e6df029  --blue-border: #5e87ff66
--violet: #a97bff  --mint: #3ed598 (--mint-ink #052b1f)  --live: #ff4d5e
--state-watching: #f7d448  --state-waiting: #80c83b  --state-completed: #743ee4
--glass-edge: #ffffff29  --glass-hi: #ffffff1a  --glass-lo: #ffffff0a  --glass-spec: #ffffff24
--overlay: #04050c73  --overlay-strong: #04050ca6  --scrim: #0009  --scrim-heavy: #000000e6
--on-art: #f4f6ff  --on-art-dim: #b9c0d4  --on-art-gold: #ffcf3d  --line-on-art: #ffffff26
--brand-tvtime: #ffd54f  --brand-trakt: #ed1c24
```
