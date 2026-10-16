<script setup lang="ts">
import { heroTitles } from "~/data/hero-titles";
import { importTotals } from "~/data/landing";
import { statsSample } from "~/data/stats";

// "Stats that earn themselves" — a year of watching, as the app's profile stats show it: totals that count
// up, a year of days, top genres, the feeling you felt most, your most-watched show. The totals are the
// library the Switching section imports. Plays once, when it comes into view.
const { t, locale } = useI18n();
const ar = computed(() => locale.value === "ar");
const fmt = (n: number) => Math.round(n).toLocaleString(ar.value ? "ar" : "en");

const s = statsSample;
const fav = heroTitles.find((h) => h.id === s.favourite.show)!;
const totals = [
  { k: "hours", v: s.hours },
  { k: "episodes", v: importTotals.episodes },
  { k: "shows", v: importTotals.shows },
  { k: "movies", v: importTotals.movies },
] as const;

// a year of days, 7 rows (weeks run across): 0–4 = how much was watched; the same pattern every render
const days = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 7 * 52 }, (_, i) => {
    const week = Math.floor(i / 7), dow = i % 7;
    const weekend = dow >= 5 ? 0.25 : 0;
    const season = Math.sin((week / 52) * Math.PI * 2 + 1) * 0.15; // busier in winter
    const v = rnd() + weekend + season;
    return v < 0.42 ? 0 : v < 0.62 ? 1 : v < 0.8 ? 2 : v < 0.95 ? 3 : 4;
  });
})();

// count up once in view
const p = ref(0);
const root = ref<HTMLElement | null>(null);
let io: IntersectionObserver | null = null;
onMounted(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return void (p.value = 1);
  io = new IntersectionObserver(
    ([e]) => {
      if (!e?.isIntersecting) return;
      io?.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const x = Math.min(1, (now - t0) / 1800);
        p.value = 1 - Math.pow(1 - x, 4);
        if (x < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { threshold: 0.3 },
  );
  if (root.value) io.observe(root.value);
});
onBeforeUnmount(() => io?.disconnect());
</script>

<template>
  <section id="stats" class="sec stats" aria-labelledby="st-h">
    <div class="wrap">
      <div class="sec-h c rv">
        <span class="kick">{{ t("stats.kick") }}</span>
        <h2 id="st-h">{{ t("stats.titleLine") }}<br><em>{{ t("stats.titleEm") }}</em></h2>
        <p>{{ t("stats.lede") }}</p>
      </div>

      <!-- (the reveal adds a class to .rv, so the reactive class lives on the element inside it) -->
      <div ref="root" class="rv">
        <div class="bento" :class="{ go: p > 0 }">
          <!-- the year, in numbers -->
          <div class="c c-tot">
            <p class="ch">{{ t("stats.year") }}</p>
            <div class="tots">
              <div v-for="x in totals" :key="x.k" class="tot">
                <b>{{ fmt(x.v * p) }}</b>
                <span>{{ t(`stats.totals.${x.k}`) }}</span>
              </div>
            </div>
            <p class="aside">{{ t("stats.daysOf", { n: fmt(s.hours / 24) }) }}</p>
          </div>
  
          <!-- most watched -->
          <div class="c c-fav">
            <span class="bd" :style="{ backgroundImage: `url('${fav.backdrop}')` }" aria-hidden="true" />
            <img :src="fav.poster" alt="" class="fp" loading="lazy">
            <div>
              <p class="ch on-art">{{ t("stats.favourite") }}</p>
              <b class="fv">{{ ar ? fav.ar.title : fav.en.title }}</b>
              <span class="fs">{{ t("stats.favEpisodes", { n: fmt(s.favourite.episodes), h: fmt(s.favourite.hours) }) }}</span>
            </div>
          </div>
  
          <!-- the feeling you felt most -->
          <div class="c c-feel">
            <img :src="`/images/feelings/${s.topFeeling}.svg`" alt="" class="fe" width="72" height="72">
            <p class="ch">{{ t("stats.feltMost") }}</p>
            <b class="fv">{{ t(`feel.f.${s.topFeeling}`) }}</b>
            <span class="fs">{{ t("stats.feltCount", { n: fmt(s.topFeelingCount * p) }) }}</span>
          </div>
  
          <!-- a year of days -->
          <div class="c c-heat">
            <div class="hh">
              <p class="ch">{{ t("stats.everyDay") }}</p>
              <span class="streak"><b>{{ fmt(s.streak * p) }}</b> {{ t("stats.streak") }}</span>
            </div>
            <div class="heat" aria-hidden="true">
              <i v-for="(v, i) in days" :key="i" :class="`l${v}`" :style="{ transitionDelay: `${Math.floor(i / 7) * 14}ms` }" />
            </div>
            <div class="legend" aria-hidden="true">
              <span>{{ t("stats.less") }}</span><i class="l0" /><i class="l1" /><i class="l2" /><i class="l3" /><i class="l4" /><span>{{ t("stats.more") }}</span>
            </div>
          </div>
  
          <!-- genres -->
          <div class="c c-gen">
            <p class="ch">{{ t("stats.genres") }}</p>
            <ul role="list">
              <li v-for="g in s.genres" :key="g.k">
                <span class="gl">{{ t(`stats.g.${g.k}`) }}</span>
                <span class="gb"><i :style="{ transform: `scaleX(${(g.pct / s.genres[0]!.pct) * p})` }" /></span>
                <b>{{ fmt(g.pct * p) }}%</b>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bento{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px;margin-top:44px}
.c{position:relative;overflow:hidden;padding:26px;border-radius:26px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);isolation:isolate}
.ch{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
:root[lang="ar"] .ch{letter-spacing:0;font-size:14px}

.c-tot{grid-column:span 7;display:flex;flex-direction:column}
.tots{display:grid;grid-template-columns:repeat(2,1fr);gap:26px 20px;margin-top:22px}
.tot b{display:block;font-family:var(--display);font-size:clamp(40px,4.6vw,62px);line-height:1;font-weight:800;letter-spacing:-.04em;color:var(--heading);font-variant-numeric:tabular-nums}
.tot:first-child b{color:var(--amber)}
:root[data-theme="light"] .tot:first-child b{color:var(--accent)}
:root[lang="ar"] .tot b{letter-spacing:0}
.tot span{display:block;margin-top:6px;font-size:15px;font-weight:700;color:var(--dim)}
.aside{margin-top:auto;padding-top:22px;font-size:14px;font-weight:600;color:var(--muted)}

.c-fav{grid-column:span 5;display:flex;align-items:flex-end;gap:18px;min-height:300px;color:#fff;background:#000}
.c-fav .bd{position:absolute;inset:0;z-index:-1;background:center/cover no-repeat}
.c-fav .bd::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.88))}
.fp{width:92px;height:138px;border-radius:12px;object-fit:cover;box-shadow:0 18px 30px -12px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.12)}
.on-art{color:rgba(255,255,255,.7)}
.fv{display:block;margin-top:6px;font-family:var(--display);font-size:28px;line-height:1.1;font-weight:800;letter-spacing:-.02em}
:root[lang="ar"] .fv{letter-spacing:0;font-weight:700}
.fs{display:block;margin-top:6px;font-size:14px;font-weight:600;opacity:.8}

.c-feel{grid-column:span 4;display:flex;flex-direction:column;justify-content:flex-end;min-height:280px;background:#15161c;color:#f4f6ff}
.c-feel .ch{color:#9aa3bd}
.fe{width:72px;height:72px;margin-bottom:auto;border-radius:20px;transform:rotate(-6deg);box-shadow:0 0 0 4px rgba(255,196,46,.25)}

.c-heat{grid-column:span 8}
.hh{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.streak{font-size:14px;font-weight:700;color:var(--dim)}
.streak b{font-family:var(--display);font-size:22px;color:var(--heading);font-variant-numeric:tabular-nums}
.heat{display:grid;grid-template-rows:repeat(7,1fr);grid-auto-flow:column;grid-auto-columns:1fr;gap:3px;margin-top:20px;direction:ltr}
.heat i{aspect-ratio:1;border-radius:3px;background:rgba(var(--glass),.07);transform:scale(.4);opacity:0;transition:transform .5s var(--ease),opacity .5s var(--ease)}
.go .heat i{transform:none;opacity:1}
.heat i.l1,.legend i.l1{background:rgba(255,196,46,.25)}
.heat i.l2,.legend i.l2{background:rgba(255,196,46,.5)}
.heat i.l3,.legend i.l3{background:rgba(255,196,46,.78)}
.heat i.l4,.legend i.l4{background:#ffc42e}
.legend{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:12px;font-size:12px;font-weight:600;color:var(--muted)}
.legend i{width:11px;height:11px;border-radius:3px;background:rgba(var(--glass),.07)}
.legend span{margin-inline:4px}

.c-gen{grid-column:span 12}
.c-gen ul{list-style:none;margin:18px 0 0;padding:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px 26px}
.c-gen li{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px}
.gl{font-size:14.5px;font-weight:700;color:var(--heading)}
.c-gen b{font-size:14px;font-weight:800;color:var(--dim);font-variant-numeric:tabular-nums}
.gb{grid-column:1 / -1;height:8px;border-radius:4px;background:rgba(var(--glass),.08);overflow:hidden}
.gb i{display:block;height:100%;border-radius:4px;background:var(--amber);transform-origin:left}
:root[dir="rtl"] .gb i{transform-origin:right}

@media (max-width:1000px){
  .c-tot,.c-fav,.c-feel,.c-heat{grid-column:span 12}
  .c-feel{min-height:220px}
  .c-gen ul{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:640px){
  .bento{gap:12px}
  .c{padding:20px;border-radius:22px}
  .heat{grid-template-rows:repeat(7,1fr);gap:2px}
  .c-gen ul{grid-template-columns:1fr}
}
</style>
