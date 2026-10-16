<script setup lang="ts">
const { t } = useI18n();
const localeHead = useLocaleHead();
const { theme } = useTheme();

useHead({
  htmlAttrs: {
    lang: () => localeHead.value.htmlAttrs.lang,
    dir: () => localeHead.value.htmlAttrs.dir,
    "data-theme": theme,
  },
  title: () => t("meta.title"),
  meta: [
    { name: "description", content: () => t("meta.description") },
    { name: "theme-color", content: () => (theme.value === "light" ? "#f5f5f7" : "#000000") },
  ],
  // Marks the page as scripted before first paint, so reveal-on-scroll elements start hidden.
  script: [{ innerHTML: "document.documentElement.classList.add('js')", tagPosition: "head" }],
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
