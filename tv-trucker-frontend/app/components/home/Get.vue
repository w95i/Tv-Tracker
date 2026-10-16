<script setup lang="ts">
import { wallRows } from "~/data/landing";

// "One library. Every screen." and the sign-off. Where TVTracker runs (the live site's platforms: web, iPhone,
// iPad, Android; English and Arabic), what it doesn't ask of you, then the brand line from the kit —
// "Every episode. Every feeling." — under the Peek mark, which watches you back.
const { t } = useI18n();
const { links } = useAppConfig();

const plats = computed(() => [
  { k: "web", href: links.app },
  { k: "ios", href: links.appStore },
  { k: "android", href: links.googlePlay },
  { k: "lang", href: null },
]);
const posters = wallRows.flat().slice(0, 28);
</script>

<template>
  <section id="get" class="sec get" aria-labelledby="get-h">
    <div class="wrap">
      <div class="sec-h c rv">
        <span class="kick">{{ t("get.kick") }}</span>
        <h2 id="get-h">{{ t("get.titleLine") }}<br><em>{{ t("get.titleEm") }}</em></h2>
        <p>{{ t("get.lede") }}</p>
      </div>

      <ul class="plats" role="list">
        <li v-for="p in plats" :key="p.k" class="pl rv">
          <component :is="p.href ? 'a' : 'div'" :href="p.href ?? undefined" class="pc">
            <span class="ic" aria-hidden="true">
              <svg v-if="p.k === 'web'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="14" rx="2.5" /><path d="M2.5 8h19M6 6h.01M8.5 6h.01M8 21h8" /></svg>
              <svg v-else-if="p.k === 'ios'" viewBox="4.69 3.2 13.91 17.4" fill="currentColor"><path d="M16.4 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.6 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.2-.9-2.2-3.2zM14.3 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z" /></svg>
              <svg v-else-if="p.k === 'android'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10.5a7 7 0 0 1 14 0V17a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17z" /><path d="M7.5 5 6 3M16.5 5 18 3M9 9.5h.01M15 9.5h.01M5 13h14" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></svg>
            </span>
            <b>{{ t(`get.plats.${p.k}.title`) }}</b>
            <span class="tx">{{ t(`get.plats.${p.k}.text`) }}</span>
            <span v-if="p.k === 'lang'" class="langs"><span>English</span><span lang="ar">العربية</span></span>
            <span v-else class="go">
              {{ t(`get.plats.${p.k}.go`) }}
              <svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
            </span>
          </component>
        </li>
      </ul>

      <ul class="perks rv" role="list">
        <li v-for="k in ['free', 'noAds', 'import', 'data']" :key="k">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          {{ t(`get.perks.${k}`) }}
        </li>
      </ul>
    </div>

    <!-- the sign-off -->
    <div class="fin">
      <div class="mosaic" aria-hidden="true">
        <i v-for="(src, i) in posters" :key="i" :style="{ backgroundImage: `url('${src}')` }" />
      </div>
      <i class="fade" aria-hidden="true" />
      <div class="wrap fin-in rv">
        <SitePeek class="pk" :size="132" />
        <h2>{{ t("get.finLine") }}<br><em>{{ t("get.finEm") }}</em></h2>
        <p>{{ t("get.finText") }}</p>
        <div class="ctas">
          <a class="btn pri" :href="links.app">
            <span>{{ t("hero.cta") }}</span>
            <svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
          <UiStoreBadge store="apple" :href="links.appStore" :caption="t('hero.dlOn')" />
          <UiStoreBadge store="google" :href="links.googlePlay" :caption="t('hero.dlGet')" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.get{padding-bottom:0}
.plats{list-style:none;margin:48px 0 0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.pl:nth-child(2){transition-delay:.06s}.pl:nth-child(3){transition-delay:.12s}.pl:nth-child(4){transition-delay:.18s}
.pc{height:100%;display:flex;flex-direction:column;padding:24px;border-radius:24px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);transition:transform .3s var(--ease),box-shadow .3s}
@media (hover:hover){a.pc:hover{transform:translateY(-4px);box-shadow:inset 0 0 0 1px rgba(255,196,46,.45)}a.pc:hover .go svg{transform:translateX(3px)}:root[dir="rtl"] a.pc:hover .go svg{transform:scaleX(-1) translateX(3px)}}
.ic{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:rgba(255,196,46,.14);color:var(--amber)}
:root[data-theme="light"] .ic{background:rgba(255,196,46,.24);color:var(--accent)}
.ic svg{width:23px;height:23px}
.pc b{margin-top:20px;font-family:var(--display);font-size:20px;line-height:1.15;color:var(--heading);letter-spacing:-.01em}
:root[lang="ar"] .pc b{font-weight:700;letter-spacing:0}
.tx{margin-top:8px;font-size:15px;line-height:1.55;color:var(--muted)}
.go{display:flex;align-items:center;gap:3px;margin-top:auto;padding-top:18px;font-size:14.5px;font-weight:700;color:var(--accent)}
.go svg{width:17px;height:17px;transition:transform .2s var(--ease)}
:root[dir="rtl"] .go svg.ar{transform:scaleX(-1)}
.langs{display:flex;gap:6px;margin-top:auto;padding-top:18px}
.langs span{height:30px;padding:0 12px;border-radius:9px;display:grid;place-items:center;font-size:13.5px;font-weight:700;color:var(--dim);background:rgba(var(--glass),.07);box-shadow:inset 0 0 0 1px rgba(var(--glass),.12)}
.langs span[lang="ar"]{font-family:"Readex Pro",sans-serif}

.perks{list-style:none;margin:28px 0 0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:10px 28px}
.perks li{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:var(--dim)}
.perks svg{width:18px;height:18px;color:var(--amber)}
:root[data-theme="light"] .perks svg{color:var(--accent)}

/* the sign-off: posters drifting behind the mark */
.fin{position:relative;overflow:hidden;margin-top:120px;padding-block:150px 160px;text-align:center;isolation:isolate}
.mosaic{position:absolute;z-index:-2;left:50%;top:50%;width:1600px;display:grid;grid-template-columns:repeat(7,1fr);gap:18px;transform:translate(-50%,-50%) rotate(-8deg);animation:drift 60s linear infinite alternate}
.mosaic i{aspect-ratio:2/3;border-radius:14px;background:var(--ph) center/cover no-repeat}
@keyframes drift{to{transform:translate(-50%,-56%) rotate(-8deg)}}
.fade{position:absolute;z-index:-1;inset:0;background:
  radial-gradient(ellipse 44% 48% at 50% 50%,rgba(var(--bg-rgb),.92) 0%,rgba(var(--bg-rgb),.86) 55%,rgba(var(--bg-rgb),.7) 100%),
  linear-gradient(180deg,var(--bg) 0%,rgba(var(--bg-rgb),0) 22%,rgba(var(--bg-rgb),0) 78%,var(--bg) 100%)}
.pk{margin:0 auto;box-shadow:0 30px 60px -20px rgba(255,196,46,.35)}
.fin h2{margin-top:34px;font-size:clamp(44px,6.4vw,92px);line-height:.98;letter-spacing:-.045em}
:root[lang="ar"] .fin h2{line-height:1.3;letter-spacing:0}
.fin h2 em{font-style:normal;color:var(--amber)}
:root[data-theme="light"] .fin h2 em{color:var(--heading);background:linear-gradient(transparent 62%,var(--amber) 62%,var(--amber) 92%,transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.fin p{margin:22px auto 0;max-width:30em;font-size:18px;line-height:1.6;color:var(--dim)}
.ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:32px}

@media (max-width:1000px){.plats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){
  .plats{grid-template-columns:1fr;gap:12px}
  .pc{padding:20px;border-radius:22px}
  .fin{margin-top:80px;padding-block:100px 110px}
  .mosaic{width:900px;gap:12px}
  .pk{width:104px;height:104px}
  .fin p{font-size:16.5px}
  .ctas .btn.pri{flex:1 1 100%;height:54px}
  .ctas .store{flex:1 1 calc(50% - 5px);justify-content:center}
}
</style>
