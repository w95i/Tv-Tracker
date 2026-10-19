<script setup lang="ts">
const { t, locale } = useI18n();
// lang/dir on <html>, plus the canonical link, hreflang alternates (en, ar, x-default) and og:locale tags
const localeHead = useLocaleHead({ seo: true });
const { theme } = useTheme();
const { links } = useAppConfig();
const site = useRuntimeConfig().public.siteUrl;

const url = computed(() => (locale.value === "ar" ? `${site}/ar` : `${site}/`));
const ogImage = computed(() => `${site}/og/og-${locale.value === "ar" ? "ar" : "en"}.jpg`);

useHead({
  htmlAttrs: {
    lang: () => localeHead.value.htmlAttrs.lang,
    dir: () => localeHead.value.htmlAttrs.dir,
    "data-theme": theme,
  },
  link: () => localeHead.value.link,
  meta: () => [
    ...localeHead.value.meta,
    { name: "theme-color", content: theme.value === "light" ? "#f5f0f0" : "#000000" },
  ],
  // Marks the page as scripted before first paint, so reveal-on-scroll elements start hidden.
  script: [{ innerHTML: "document.documentElement.classList.add('js')", tagPosition: "head" }],
});

useSeoMeta({
  title: () => t("meta.title"),
  description: () => t("meta.description"),
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  applicationName: "TVTracker",
  appleMobileWebAppTitle: "TVTracker",
  // iPhone and iPad Safari show the App Store banner for the app
  appleItunesApp: "app-id=6797001715",
  ogType: "website",
  ogSiteName: "TVTracker",
  ogUrl: () => url.value,
  ogTitle: () => t("meta.title"),
  ogDescription: () => t("meta.description"),
  ogImage: () => ogImage.value,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: "image/jpeg",
  ogImageAlt: () => t("meta.imageAlt"),
  twitterCard: "summary_large_image",
  twitterTitle: () => t("meta.title"),
  twitterDescription: () => t("meta.description"),
  twitterImage: () => ogImage.value,
  twitterImageAlt: () => t("meta.imageAlt"),
});

// Structured data: the site, who makes it, and the app itself (free, on iPhone, Android and the web).
useHead({
  script: [
    {
      key: "ld-json",
      type: "application/ld+json",
      innerHTML: () =>
        JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${site}/#org`,
              name: "Alphabet",
              url: links.alphabet,
            },
            {
              "@type": "WebSite",
              "@id": `${site}/#website`,
              url: `${site}/`,
              name: "TVTracker",
              inLanguage: ["en", "ar"],
              publisher: { "@id": `${site}/#org` },
            },
            {
              "@type": "WebPage",
              "@id": `${url.value}#page`,
              url: url.value,
              name: t("meta.title"),
              description: t("meta.description"),
              inLanguage: locale.value === "ar" ? "ar" : "en",
              isPartOf: { "@id": `${site}/#website` },
              about: { "@id": `${site}/#app` },
              primaryImageOfPage: ogImage.value,
            },
            {
              "@type": "SoftwareApplication",
              "@id": `${site}/#app`,
              name: "TVTracker",
              description: t("meta.description"),
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "iOS, Android, Web",
              url: `${site}/`,
              image: ogImage.value,
              inLanguage: ["en", "ar"],
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              installUrl: [links.appStore, links.googlePlay],
              sameAs: [links.appStore, links.googlePlay, links.app],
              publisher: { "@id": `${site}/#org` },
            },
          ],
        }),
    },
  ],
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
