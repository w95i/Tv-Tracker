// (the project has no Node typings; the config runs in Node)
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;

// Where the site lives — canonical links, hreflang, the sitemap and social cards are built on it.
// Override per deployment with NUXT_PUBLIC_SITE_URL (and NUXT_PUBLIC_I18N_BASE_URL, the same value).
const SITE_URL = (env.NUXT_PUBLIC_SITE_URL || "https://tvtracker.tv").replace(/\/$/, "");

export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  // A public landing page: rendered on the server so search engines and link previews see the content.
  ssr: true,
  // `npm run share` builds into its own folder, so it can run while `npm run dev` is up.
  buildDir: env.NUXT_BUILD_DIR || ".nuxt",
  devtools: { enabled: false },
  modules: ["@nuxtjs/i18n"],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: { siteUrl: SITE_URL },
  },
  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width,initial-scale=1,viewport-fit=cover" },
        { name: "color-scheme", content: "dark light" },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/images/brand-v6/peek-icon.svg" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/icons/icon-192.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon.png" },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "preconnect", href: "https://image.tmdb.org", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=Figtree:wght@400;500;600;700;800;900&family=Readex+Pro:wght@400;500;600;700&family=Tajawal:wght@400;500;700;800;900&display=swap",
        },
      ],
    },
  },
  // Static pictures don't change often: let browsers and CDNs keep them for a week, then revalidate.
  routeRules: {
    "/images/**": { headers: { "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } },
    "/icons/**": { headers: { "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } },
  },
  i18n: {
    locales: [
      { code: "en", language: "en-US", dir: "ltr", name: "English", file: "en.json" },
      { code: "ar", language: "ar", dir: "rtl", name: "العربية", file: "ar.json" },
    ],
    defaultLocale: "en",
    // Each language has its own address (English at /, Arabic at /ar), so search engines can index both
    // and link them with hreflang. The language button moves between them.
    strategy: "prefix_except_default",
    baseUrl: SITE_URL,
    detectBrowserLanguage: { useCookie: true, cookieKey: "tvt_locale", redirectOn: "root", fallbackLocale: "en" },
  },
});
