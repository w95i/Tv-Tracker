<script setup lang="ts">
import { wallRows } from "~/data/landing";

// "Browse by genre" — the app's search tiles (each genre its hue, its line drawing, two posters) — then the
// sign-off: the brand line from the kit over a wall of posters, under the Peek mark, which watches you back
// (poke it: amused; keep poking: frustrated).
const { t } = useI18n();
const { links } = useAppConfig();

const plats = computed(() => [
  { k: "web", href: links.app },
  { k: "ios", href: links.appStore },
  { k: "android", href: links.googlePlay },
  { k: "lang", href: null },
]);
// hero-sized posters, 14 × 7
const posters = (() => {
  const a = wallRows.flat();
  return Array.from({ length: 98 }, (_, i) => a[(i * 5) % a.length]!);
})();

const W = (n: string) => `/images/posters/${n}.jpg`;
const T = (id: string) => `https://image.tmdb.org/t/p/w342/${id}.jpg`;
const genres = [
  { k: "action", h: 8, art: "action", wide: false, p: [W("wall-04"), W("wall-02")] },
  { k: "comedy", h: 44, art: "comedy", wide: false, p: [W("wall-27"), W("wall-03")] },
  { k: "drama", h: 350, art: "drama", wide: false, p: [W("wall-16"), W("wall-09")] },
  { k: "scifi", h: 200, art: "scifi", wide: false, p: [W("wall-01"), W("switch-08")] },
  { k: "thriller", h: 270, art: "thriller", wide: false, p: [W("wall-10"), W("wall-06")] },
  { k: "animation", h: 160, art: "animation", wide: false, p: [W("wall-36"), W("wall-23")] },
  { k: "mystery", h: 230, art: "mystery", wide: false, p: [W("wall-17"), W("wall-12")] },
  { k: "history", h: 28, art: "history", wide: false, p: [W("wall-07"), W("wall-05")] },
  { k: "adventure", h: 120, art: "adventure", wide: true, p: [W("wall-20"), W("wall-41")] },
  { k: "fantasy", h: 285, art: "fantasy", wide: true, p: [W("wall-26"), W("wall-30")] },
  { k: "romance", h: 330, art: "romance", wide: false, p: [W("switch-10"), W("wall-13")] },
  { k: "crime", h: 0, art: "crime", wide: false, p: [W("wall-19"), W("wall-37")] },
  { k: "family", h: 190, art: "family", wide: false, p: [W("wall-39"), W("wall-24")] },
  { k: "war", h: 70, art: "war", wide: false, p: [W("wall-18"), W("wall-11")] },
  { k: "western", h: 18, art: "western", wide: false, p: [T("bX2xnavhMYjWDoZp1VM6VnU1xwe"), T("ooqASvA7qxlTVKL3KwOzBwy57Dh")] },
  { k: "reality", h: 315, art: "reality", wide: false, p: [T("pLeSPrwEmxwaV1vqzdVfAgnUvXc"), T("toVhyqMT3ICfahE7Ad8obJvZHpX")] },
  { k: "soap", h: 345, art: "soap", wide: false, p: [T("vamznpYBCI9n7VhrI3mxuzff7XP"), T("ppdrvfUyukqtFkl1HY7x6qHd7st")] },
  { k: "music", h: 230, art: "music", wide: false, p: [T("dueFqKLvjftnELZaGYwY7xinfaI"), W("wall-15")] },
];

// the tiles rise in once the grid is in view
const gr = ref<HTMLElement | null>(null);
const seen = ref(false);
let gio: IntersectionObserver | null = null;
onMounted(() => {
  if (!("IntersectionObserver" in window) || !gr.value) return void (seen.value = true);
  gio = new IntersectionObserver(
    ([e]) => {
      if (e?.isIntersecting) {
        seen.value = true;
        gio?.disconnect();
      }
    },
    { threshold: 0.15 },
  );
  gio.observe(gr.value);
});
onBeforeUnmount(() => gio?.disconnect());

// each tile leans toward the pointer; its drawing and posters drift at different depths
let fine = false;
onMounted(() => (fine = matchMedia("(hover:hover) and (pointer:fine)").matches));
function lean(e: PointerEvent) {
  if (!fine) return;
  const el = e.currentTarget as HTMLElement, r = el.getBoundingClientRect();
  el.classList.add("lean");
  el.style.setProperty("--lx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
  el.style.setProperty("--ly", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
}
function unlean(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement;
  el.style.setProperty("--lx", "0");
  el.style.setProperty("--ly", "0");
  setTimeout(() => el.classList.remove("lean"), 250);
}

// Peek, poked
const mood = ref<"amused" | "frustrated" | null>(null);
const bump = ref(0);
let taps: number[] = [], moodT: ReturnType<typeof setTimeout> | undefined;
const poke = () => {
  const now = Date.now();
  taps = taps.filter((x) => now - x < 2500);
  taps.push(now);
  clearTimeout(moodT);
  bump.value++;
  if (taps.length >= 5) {
    mood.value = "frustrated";
    navigator.vibrate?.([30, 40, 30]);
    moodT = setTimeout(() => {
      mood.value = null;
      taps = [];
    }, 2600);
  } else {
    mood.value = "amused";
    navigator.vibrate?.(12);
    moodT = setTimeout(() => (mood.value = null), 1500);
  }
};
</script>

<template>
  <section id="get" class="sec get" aria-labelledby="get-h">
    <div class="wrap">
      <div class="sec-h c rv">
        <span class="kick">{{ t("genres.kick") }}</span>
        <h2 id="get-h">{{ t("genres.titleLine") }}<br><em>{{ t("genres.titleEm") }}</em></h2>
        <p>{{ t("genres.lede") }}</p>
      </div>
    </div>

    <!-- Browse by genre, edge to edge like the Upcoming rail -->
    <div class="gen-bleed">
      <!-- Browse by genre, as in the app's search: each genre its own colour, its own line drawing, two posters -->
      <div ref="gr" class="genres" :class="{ seen }" role="list">
        <a
          v-for="(g, i) in genres"
          :key="g.k"
          role="listitem"
          class="gen"
          :class="{ wide: g.wide }"
          :href="links.app"
          :style="{ '--h': g.h, '--i': i }"
          @pointermove="lean($event)"
          @pointerleave="unlean($event)"
        >
          <i class="ga" :style="{ '--m': `url('/images/genres/art-${g.art}.png')` }" aria-hidden="true" />
          <b>{{ t(`genres.g.${g.k}`) }}</b>
          <span class="gp" aria-hidden="true">
            <i :style="{ backgroundImage: `url('${g.p[1]}')` }" />
            <i :style="{ backgroundImage: `url('${g.p[0]}')` }" />
          </span>
        </a>
      </div>
    </div>

    <!-- the sign-off -->
    <div class="fin">
      <div class="mosaic" aria-hidden="true">
        <i v-for="(src, i) in posters" :key="i" :style="{ backgroundImage: `url('${src}')` }" />
      </div>
      <i class="fade" aria-hidden="true" />
      <div class="wrap fin-in rv">
        <!-- tap Peek: amused; keep tapping and it gets frustrated -->
        <button type="button" class="pkb" :class="mood ? `m-${mood}` : ''" :aria-label="t('get.poke')" @click="poke">
          <SitePeek class="pk" :size="132" />
          <img :key="bump" class="pkf" :src="`/images/feelings-v6/${mood || 'amused'}.svg`" alt="" width="132" height="132">
        </button>
        <h2>{{ t("get.finLine") }}<br><em>{{ t("get.finEm") }}</em></h2>
        <p>{{ t("get.finText") }}</p>
        <div class="ctas">
          <a class="btn pri" :href="links.app">
            <span>{{ t("get.cta") }}</span>
            <svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
          <UiStoreBadge compact store="apple" :href="links.appStore" :caption="t('hero.dlOn')" />
          <UiStoreBadge compact store="google" :href="links.googlePlay" :caption="t('hero.dlGet')" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.get{padding-bottom:0}
.gen-bleed{padding-inline:16px}
.genres{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-flow:dense;gap:14px;margin-top:48px}
@media (max-width:1280px){.genres{grid-template-columns:repeat(4,minmax(0,1fr))}}
.gen{--lx:0;--ly:0;position:relative;height:210px;padding:22px;border-radius:24px;overflow:hidden;isolation:isolate;display:flex;align-items:flex-start;text-decoration:none;
  background:linear-gradient(135deg,hsl(var(--h) 70% 42%),hsl(calc(var(--h) + 28) 64% 24%));
  opacity:0;transform:translateY(26px) scale(.97);transition:opacity .6s var(--ease),transform .8s cubic-bezier(.34,1.3,.64,1);transition-delay:calc(var(--i) * 45ms)}
.gen.wide{grid-column:span 2}
.genres.seen .gen{opacity:1;transform:perspective(900px) rotateX(calc(var(--ly) * -5deg)) rotateY(calc(var(--lx) * 6deg))}
.genres.seen .gen.lean{transition:opacity .6s var(--ease),transform .25s ease-out}
.gen b{position:relative;z-index:2;font-family:var(--display);font-size:26px;font-weight:800;color:#fff;letter-spacing:-.01em;text-shadow:0 1px 8px rgba(0,0,0,.3)}
:root[lang="ar"] .gen b{font-weight:700;letter-spacing:0}
/* the line drawing (a mask in the genre's own darker colour; white on light theme) — it drifts against the pointer */
.ga{position:absolute;z-index:0;inset-inline-start:7%;top:28%;width:52%;height:80%;pointer-events:none;background:#000;opacity:.3;
  -webkit-mask:var(--m) left top/contain no-repeat;mask:var(--m) left top/contain no-repeat;transform:translate(calc(var(--lx) * -10px),calc(var(--ly) * -8px));transition:transform .3s ease-out}
:root[dir="rtl"] .ga{-webkit-mask-position:right top;mask-position:right top}
:root[data-theme="light"] .ga{background:#fff;opacity:.55}
.gen.wide .ga{inset-inline-start:5%;top:16%;width:42%;height:96%}
/* two posters, fanned at the corner; they lift on hover */
.gp{position:absolute;z-index:1;inset-inline-end:-8px;bottom:-40px;width:190px;height:200px;transform:translate(calc(var(--lx) * 8px),calc(var(--ly) * 6px));transition:transform .3s ease-out}
.gp i{position:absolute;width:118px;aspect-ratio:2/3;border-radius:11px;background:#222 center/cover no-repeat;box-shadow:0 10px 24px rgba(0,0,0,.45);transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
.gp i:nth-child(1){inset-inline-end:66px;bottom:14px;transform:rotate(-14deg)}
.gp i:nth-child(2){inset-inline-end:2px;bottom:0;transform:rotate(11deg)}
:root[dir="rtl"] .gp i:nth-child(1){transform:rotate(14deg)}
:root[dir="rtl"] .gp i:nth-child(2){transform:rotate(-11deg)}
@media (hover:hover){
.gen:hover .gp i:nth-child(1){transform:rotate(-20deg) translateY(-14px)}
.gen:hover .gp i:nth-child(2){transform:rotate(17deg) translateY(-18px)}
:root[dir="rtl"] .gen:hover .gp i:nth-child(1){transform:rotate(20deg) translateY(-14px)}
:root[dir="rtl"] .gen:hover .gp i:nth-child(2){transform:rotate(-17deg) translateY(-18px)}
}
.gen:active{scale:.98}
@media (max-width:1100px){.genres{grid-template-columns:repeat(3,minmax(0,1fr))}.gen.wide{grid-column:auto}}
@media (max-width:760px){
.genres{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:36px}
.gen{height:124px;padding:14px;border-radius:18px}
.gen b{font-size:17px}
.ga,.gen.wide .ga{inset-inline-start:8%;top:30%;width:50%;height:78%}
.gp{width:110px;height:120px;bottom:-26px}
.gp i{width:70px;border-radius:8px}
.gp i:nth-child(1){inset-inline-end:38px;bottom:8px}
}
@media (prefers-reduced-motion:reduce){.gen{opacity:1;transform:none}}

/* the sign-off: posters drifting behind the mark */
.fin{position:relative;overflow:hidden;margin-top:120px;padding-block:150px 160px;text-align:center;isolation:isolate}
.mosaic{position:absolute;z-index:-2;left:50%;top:50%;display:grid;grid-template-columns:repeat(14,150px);gap:18px;transform:translate(-50%,-50%) rotate(-8deg);animation:drift 60s linear infinite alternate}
.mosaic i{aspect-ratio:2/3;border-radius:14px;background:var(--ph) center/cover no-repeat}
@keyframes drift{to{transform:translate(-50%,-56%) rotate(-8deg)}}
.fade{position:absolute;z-index:-1;inset:0;background:
  radial-gradient(ellipse 44% 48% at 50% 50%,rgba(var(--bg-rgb),.92) 0%,rgba(var(--bg-rgb),.86) 55%,rgba(var(--bg-rgb),.7) 100%),
  linear-gradient(180deg,var(--bg) 0%,rgba(var(--bg-rgb),0) 22%,rgba(var(--bg-rgb),0) 78%,var(--bg) 100%)}
.pk{display:block;box-shadow:0 30px 60px -20px rgba(255,196,46,.35);transition:opacity .18s,transform .3s cubic-bezier(.34,1.56,.64,1)}
.pkb{position:relative;display:block;width:132px;height:132px;margin:0 auto;padding:0;border:0;border-radius:34px;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.pkb:active .pk{transform:scale(.94)}
.pkf{position:absolute;inset:0;width:100%;height:100%;border-radius:30px;opacity:0;pointer-events:none;transform:scale(.85);transition:opacity .18s,transform .3s}
.m-amused .pk,.m-frustrated .pk{opacity:0}
.m-amused .pkf{opacity:1;transform:none;animation:pkHa .7s cubic-bezier(.34,1.56,.64,1)}
.m-frustrated .pkf{opacity:1;transform:none;animation:pkAn .55s ease-in-out 3}
@keyframes pkHa{0%{transform:scale(.85) rotate(0)}35%{transform:translateY(-16px) scale(1.06) rotate(-8deg)}60%{transform:translateY(0) scale(1.04,.94) rotate(4deg)}100%{transform:none}}
@keyframes pkAn{0%,100%{transform:none}20%{transform:translateX(-9px) rotate(-4deg)}40%{transform:translateX(9px) rotate(4deg)}60%{transform:translateX(-6px) rotate(-2deg) scale(1.04)}80%{transform:translateX(6px) rotate(2deg)}}
@media (prefers-reduced-motion:reduce){.pkf{animation:none!important}}
.fin h2{margin-top:34px;font-size:clamp(44px,6.4vw,92px);line-height:.98;letter-spacing:-.045em}
:root[lang="ar"] .fin h2{line-height:1.3;letter-spacing:0}
.fin h2 em{font-style:normal;color:var(--amber)}
:root[data-theme="light"] .fin h2 em{color:var(--heading);background:linear-gradient(transparent 62%,var(--amber) 62%,var(--amber) 92%,transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone}
.fin p{margin:22px auto 0;max-width:30em;font-size:18px;line-height:1.6;color:var(--dim)}
.ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:32px}
@media (max-width:640px){
.fin{margin-top:80px;padding-block:100px 110px}
.mosaic{grid-template-columns:repeat(10,104px);gap:12px}
.pk,.pkb{width:104px;height:104px}
.fin p{font-size:16.5px}
.ctas{flex-wrap:nowrap}
.ctas .btn.pri{flex:1 1 0;min-width:0;height:54px}
.ctas .store{flex:none;width:54px;height:54px}
}
</style>
