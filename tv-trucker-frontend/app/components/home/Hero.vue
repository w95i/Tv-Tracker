<script setup lang="ts">
const { t } = useI18n();
const { links } = useAppConfig();
</script>

<template>
  <section id="top" class="hero" aria-labelledby="h1">
    <HomePosterWall />
    <div class="wrap">
      <span class="kick rise">{{ t("hero.kick") }}</span>
      <h1 id="h1" class="rise r2">{{ t("hero.titleLine") }}<br><em>{{ t("hero.titleEm") }}</em></h1>
      <p class="lede rise r3">{{ t("hero.lede") }}</p>
      <div class="ctas rise r4">
        <a class="btn pri" :href="links.app">
          <span>{{ t("hero.cta") }}</span>
          <svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
        <UiStoreBadge store="apple" :href="links.appStore" :caption="t('hero.dlOn')" />
        <UiStoreBadge store="google" :href="links.googlePlay" :caption="t('hero.dlGet')" />
      </div>
    </div>
    <HomePosterFan />
  </section>
</template>

<style scoped>
.hero{position:relative;isolation:isolate;padding-block:128px 0;text-align:center;overflow:hidden}
.hero .kick{justify-content:center}
.hero h1{margin:18px auto 0;font-size:clamp(42px,6.2vw,84px);line-height:.98;letter-spacing:-.045em;max-width:12em}
:root[lang="ar"] .hero h1{line-height:1.3;letter-spacing:0}
.hero h1 em{font-style:normal;color:var(--amber)}
:root[data-theme="light"] .hero h1 em{color:var(--heading);background:linear-gradient(transparent 62%,var(--amber) 62%,var(--amber) 92%,transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.lede{margin:22px auto 0;max-width:32em;font-size:18.5px;line-height:1.6;color:var(--dim)}
.ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:30px}
@media (max-width:640px){
  .hero{padding-top:104px}
  .lede{font-size:16.5px}
  .ctas .btn.pri{flex:1 1 100%;height:54px}
  .ctas .store{flex:1 1 calc(50% - 5px);justify-content:center}
}
</style>
