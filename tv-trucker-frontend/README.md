# tv-trucker-frontend

The TVTracker website. Nuxt 4 with server rendering, English and Arabic (RTL), dark and light themes.
The landing page is a component-by-component port of `tvtracker-landing_2.html`.

## Run

```bash
npm install
npm run dev     # http://localhost:3100
npm run build   # production build in .output/
```

Needs Node 22.21 or newer (Nuxt warns on older versions).

## Layout

```
app/
  app.vue                 page <head>: lang, dir, theme, title
  app.config.ts           every outbound link (app, stores, privacy, terms, email)
  assets/css/main.css     design tokens, base styles, buttons, reveal animation
  components/
    site/                 Header, Footer, Logo, Splash (intro on every visit, Marvel comic-flip style, pure CSS)
    home/                 landing sections: Hero (PosterWall behind; PosterFan below, a carousel that
                          switches the phone to PhoneTitleScreen), About, Switching (import scene,
                          plays once on entering view), Why and its three cards
    ui/                   small reusable pieces: StoreBadge, IconCheck, VideoDialog (YouTube pop-up)
  composables/
    useTheme.ts           dark/light, kept in the tvt_theme cookie
    useReveal.ts          fades .rv elements in on scroll
    useSplash.ts          intro state; afterSplash() delays hero timers until it ends
    useTrailer.ts         a title's trailer (via services/trailers.ts), resolved on the server too
  data/landing.ts         placeholder content: fan slots, wall posters, About facts, import apps/posters/totals, up-next, moods
  data/hero-titles.ts     the 11 carousel titles (en + ar), generated from tvtracker.tv/api/v1/media
  data/splash.ts          the intro's six characters (stills in public/images/splash)
  data/trailers.ts        hard-coded YouTube trailer per title (temporary, until the backend serves them)
  services/trailers.ts    getTrailer(): the one place trailers come from — swap its body for the backend call
  layouts/default.vue     header + main + footer
  pages/index.vue         the landing page
  plugins/hash-prefs.client.ts   /#ar, /#en, /#light, /#dark force a language or theme
i18n/locales/             en.json, ar.json — every visible string
public/images/            brand (Peek logo + favicon), posters, titles/<id>/backdrop.jpg, import logos
```

## Changing content

- Text: `i18n/locales/en.json` and `ar.json` (same keys in both).
- Pictures: replace files in `public/images/`, or point `app/data/landing.ts` at new ones.
- Carousel titles: `app/data/hero-titles.ts`. Each needs a poster, a backdrop and English + Arabic text; keep an odd count (one sits behind the phone, the rest split evenly left and right).
- Trailers: `app/data/trailers.ts` for now. To use the backend, change only `getTrailer()` in `app/services/trailers.ts` (a sketch of the call is in the file).
- Links (app, stores, privacy, terms, email, roadmap): `app/app.config.ts`.
- Colours and fonts: the tokens at the top of `app/assets/css/main.css`.

The language is saved in the `tvt_locale` cookie and the theme in `tvt_theme`, so the server renders the visitor's choice with no flash.
