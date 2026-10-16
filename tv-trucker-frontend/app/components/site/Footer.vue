<script setup lang="ts">
const { t } = useI18n();
const { links } = useAppConfig();
</script>

<template>
  <footer class="ft">
    <div class="wrap">
      <div class="ft-g">
        <SiteLogo :height="30" />
        <nav :aria-label="t('nav.footer')">
          <a :href="links.app">{{ t("footer.open") }}</a>
          <a :href="links.privacy">{{ t("footer.privacy") }}</a>
          <a :href="links.terms">{{ t("footer.terms") }}</a>
          <a :href="`mailto:${links.email}`">{{ links.email }}</a>
        </nav>
      </div>
      <p class="att">{{ t("footer.attribution") }}</p>
    </div>
  </footer>
</template>

<style scoped>
.ft{padding:40px 0 52px;border-top:1px solid var(--line);font-size:14px;color:var(--muted)}
.ft-g{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px}
.ft nav{display:flex;flex-wrap:wrap;gap:4px 22px}
.ft nav a{display:inline-block;padding:8px 0;font-weight:600;color:var(--dim)}
.ft .att{margin-top:22px;font-size:12.5px;line-height:1.6;max-width:62em}
@media (max-width:640px){.ft-g{flex-direction:column;align-items:flex-start}}
</style>
