export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  // A public landing page: rendered on the server so search engines and link previews see the content.
  ssr: true,
  devtools: { enabled: false },
  modules: ["@nuxtjs/i18n"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      meta: [
        { name: "viewport", content: "width=device-width,initial-scale=1,viewport-fit=cover" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/images/brand/peek-icon.svg" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=Figtree:wght@400;500;600;700;800&family=Readex+Pro:wght@400;500;600;700&display=swap",
        },
      ],
    },
  },
  i18n: {
    locales: [
      { code: "en", language: "en", dir: "ltr", name: "English", file: "en.json" },
      { code: "ar", language: "ar", dir: "rtl", name: "العربية", file: "ar.json" },
    ],
    defaultLocale: "en",
    strategy: "no_prefix",
    detectBrowserLanguage: { useCookie: true, cookieKey: "tvt_locale", redirectOn: "root", fallbackLocale: "en" },
  },
});
