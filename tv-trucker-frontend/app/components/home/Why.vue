<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <section id="why" class="why" aria-labelledby="w-h">
    <div class="wrap">
      <div class="why-h rv">
        <span class="kick">{{ t("why.kick") }}</span>
        <h2 id="w-h">{{ t("why.title") }}</h2>
      </div>
      <div class="bento">
        <HomeFeatureCard :title="t('why.upNext.title')" :text="t('why.upNext.text')">
          <HomeUpNextList />
        </HomeFeatureCard>
        <HomeFeatureCard :title="t('why.moods.title')" :text="t('why.moods.text')">
          <HomeMoodGrid />
        </HomeFeatureCard>
        <HomeFeatureCard :title="t('why.import.title')" :text="t('why.import.text')">
          <HomeImportProgress />
        </HomeFeatureCard>
      </div>
    </div>
  </section>
</template>

<style scoped>
.why{padding-block:24px 110px}
.why-h{text-align:center;margin-bottom:34px}
.why-h h2{margin-top:12px;font-size:clamp(28px,3.2vw,42px);line-height:1.08}
.bento{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
@media (max-width:900px){
  .bento{grid-template-columns:1fr;max-width:520px;margin:0 auto}
}
@media (max-width:640px){
  .why{padding-bottom:70px}
  .bento{display:flex;max-width:none;margin-inline:calc(var(--gut)*-1);padding-inline:var(--gut);gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;scroll-padding-inline:var(--gut)}
  .bento::-webkit-scrollbar{display:none}
  .bento .card{flex:0 0 84%;scroll-snap-align:start}
}
</style>
