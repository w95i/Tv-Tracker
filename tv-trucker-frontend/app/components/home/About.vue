<script setup lang="ts">
import { aboutFacts } from "~/data/landing";

// "About us". No reference design has one, so it is built only from pieces already in the system:
// the section kicker, the hero's amber second line, the Why cards, the app's amber icon tile
// (the "…" sheet's .sic) and its amber "Details ›" link. Copy is the live site's (tvtracker.tv).
const { t } = useI18n();
const { links } = useAppConfig();
const chip = (c: string) => (c.startsWith("t:") ? t(c.slice(2)) : c);
// Arabic chips (e.g. "العربية" on the English page) get the Arabic font.
const isArabic = (s: string) => [...s].some((ch) => ch.charCodeAt(0) >= 0x600 && ch.charCodeAt(0) <= 0x6ff);
const chipLang = (c: string) => (isArabic(chip(c)) ? "ar" : undefined);
</script>

<template>
  <section id="about" class="about" aria-labelledby="ab-h">
    <div class="wrap ab-g">
      <div class="ab-tx rv">
        <span class="kick">{{ t("about.kick") }}</span>
        <h2 id="ab-h">{{ t("about.titleLine") }}<br><em>{{ t("about.titleEm") }}</em></h2>
        <p class="lede">{{ t("about.lede") }}</p>
        <p class="built">{{ t("about.built") }}</p>

        <div class="credit">
          <img src="/images/brand/peek-icon.svg" alt="" width="44" height="44">
          <span><small>{{ t("about.madeBy") }}</small><b>Alphabet</b></span>
        </div>
        <a class="road" :href="links.roadmap" target="_blank" rel="noopener">
          <span>{{ t("about.roadmap") }}</span>
          <svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
        </a>
      </div>

      <ul class="facts" role="list">
        <li v-for="f in aboutFacts" :key="f.key" class="fact rv">
          <span class="ic" aria-hidden="true">
            <svg v-if="f.key === 'screens'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="14" height="10" rx="2" /><path d="M6.5 18h6M9.5 14v4" /><rect x="16.5" y="9" width="5" height="10" rx="1.5" /></svg>
            <svg v-else-if="f.key === 'free'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 3.5 8 4.5 9.5 8 12 8zm0 0s1.5-4.5 4-3.5S14.5 8 12 8z" /></svg>
            <svg v-else-if="f.key === 'languages'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6z" /><path d="M8.8 12.2l2.2 2.2 4.4-4.6" /></svg>
          </span>
          <h3>{{ t(`about.facts.${f.key}.title`) }}</h3>
          <p>{{ t(`about.facts.${f.key}.text`) }}</p>
          <ul v-if="f.chips.length" class="chips" role="list">
            <li v-for="c in f.chips" :key="c" :lang="chipLang(c)">{{ chip(c) }}</li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.about{padding-block:10px 120px}
.ab-g{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:56px;align-items:center}

/* text: kicker + headline like the hero (amber second line; a highlighter stroke in light theme) */
.ab-tx h2{margin-top:14px;font-size:clamp(36px,4.6vw,60px);line-height:1;letter-spacing:-.04em}
:root[lang="ar"] .ab-tx h2{line-height:1.3;letter-spacing:0}
.ab-tx h2 em{font-style:normal;color:var(--amber)}
:root[data-theme="light"] .ab-tx h2 em{color:var(--heading);background:linear-gradient(transparent 62%,var(--amber) 62%,var(--amber) 92%,transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.lede{margin-top:20px;max-width:30em;font-size:18px;line-height:1.6;color:var(--dim)}
.built{margin-top:12px;font-size:16px;font-weight:700;color:var(--heading)}

/* who makes it: a small surface card, like the Why cards' inner rows */
.credit{display:inline-flex;align-items:center;gap:12px;margin-top:28px;padding:10px 18px 10px 10px;border-radius:16px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
:root[dir="rtl"] .credit{padding:10px 10px 10px 18px}
.credit img{width:44px;height:44px;border-radius:12px;flex:none}
.credit span{display:flex;flex-direction:column;line-height:1.2}
.credit small{font-size:12.5px;font-weight:600;color:var(--muted)}
.credit b{margin-top:2px;font-family:var(--display);font-size:17px;font-weight:800;color:var(--heading)}
/* the app's amber "Details ›" link */
.road{display:flex;width:fit-content;align-items:center;gap:3px;height:36px;margin-top:14px;font-size:15px;font-weight:700;color:var(--accent)}
.road svg{width:17px;height:17px;transition:transform .2s var(--ease)}
:root[dir="rtl"] .road svg.ar{transform:scaleX(-1)}
@media (hover:hover){.road:hover svg{transform:translateX(3px)}:root[dir="rtl"] .road:hover svg.ar{transform:scaleX(-1) translateX(3px)}}

/* facts: the Why cards, smaller */
.facts{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.fact{display:flex;flex-direction:column;min-width:0;padding:24px;border-radius:24px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(255,196,46,.14);color:var(--amber)}
:root[data-theme="light"] .ic{background:rgba(255,196,46,.22);color:var(--accent)}
.ic svg{width:21px;height:21px}
.fact h3{margin-top:18px;font-size:19px;line-height:1.2}
.fact > p{margin-top:6px;font-size:15px;line-height:1.55;color:var(--muted)}
.chips{list-style:none;margin:auto 0 0;padding:16px 0 0;display:flex;flex-wrap:wrap;gap:6px}
.chips li{display:inline-flex;align-items:center;height:28px;padding:0 11px;border-radius:9px;font-size:12.5px;font-weight:700;color:var(--dim);background:rgba(var(--glass),.07);box-shadow:inset 0 0 0 1px rgba(var(--glass),.12)}
.chips li[lang="ar"]{font-family:"Readex Pro",sans-serif}

@media (max-width:900px){
  .ab-g{grid-template-columns:1fr;gap:40px}
  .facts{max-width:640px}
}
@media (max-width:640px){
  .about{padding-bottom:80px}
  .facts{grid-template-columns:1fr;gap:12px}
  .fact{padding:22px;border-radius:22px}
  .lede{font-size:16.5px}
}
</style>
