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

// Top genres: each genre wears its colour from Browse by genre (the same hue as its tile)
const GH: Record<string, number> = { action: 8, comedy: 44, drama: 350, scifi: 200, thriller: 270, animation: 160, mystery: 230, history: 28, adventure: 120, fantasy: 285, romance: 330, crime: 0, family: 190, war: 70, western: 18, reality: 315, soap: 345, music: 230 };
const gCols = s.genres.map((g) => `hsl(${GH[g.k] ?? 44} 72% ${g.k === "crime" ? 40 : 52}%)`);
const gTot = s.genres.reduce((a, g) => a + g.pct, 0);
const gOff = s.genres.map((_, i) => s.genres.slice(0, i).reduce((a, g) => a + (g.pct / gTot) * 100, 0));
</script>

<template>
  <section id="stats" class="sec stats" aria-labelledby="st-h">
    <div class="wrap">
      <div class="sec-h st-h rv">
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
            <img :src="`/images/feelings-v6/${s.topFeeling}.svg`" alt="" class="fe" width="72" height="72">
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
            <div class="gd">
              <div class="dn">
                <svg viewBox="0 0 40 40" aria-hidden="true">
                  <circle v-for="(g, i) in s.genres" :key="g.k" r="15.9" cx="20" cy="20" fill="none" :stroke="gCols[i]" stroke-width="5" pathLength="100"
                    :stroke-dasharray="`${Math.max(0, (g.pct / gTot * 100 - 1.2) * p)} 100`" :stroke-dashoffset="-gOff[i]! * p" />
                </svg>
                <span><b>{{ t(`stats.g.${s.genres[0]!.k}`) }}</b><small>{{ t("stats.topGenre") }}</small></span>
              </div>
              <ul class="lg" role="list">
                <li v-for="(g, i) in s.genres" :key="g.k">
                  <i :style="{ background: gCols[i] }" />
                  <span class="gl">{{ t(`stats.g.${g.k}`) }}</span>
                  <b>{{ fmt(g.pct * p) }}%</b>
                </li>
              </ul>
            </div>
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

/* one screen: a split header and a two-row bento, so the whole story reads without scrolling */
.stats{padding-block:96px}
.st-h{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,400px);column-gap:48px;align-items:end}
.st-h .kick{grid-column:1 / -1}
.st-h h2{margin-top:12px;font-size:clamp(34px,4vw,52px)}
.st-h > p{margin:0;font-size:16px;line-height:1.55;color:var(--dim)}
.bento{margin-top:36px;gap:14px}
.c{padding:22px 24px;border-radius:24px}
.c-tot{grid-column:span 5}
.tots{gap:18px 20px;margin-top:16px}
.tot b{font-size:clamp(34px,3.4vw,46px)}
.tot span{margin-top:4px;font-size:14px}
.aside{padding-top:14px;font-size:13px}
.c-fav{grid-column:span 4;min-height:0;gap:14px}
.fp{width:72px;height:108px;border-radius:11px}
.fv{font-size:24px}
.fs{font-size:13px}
.c-feel{grid-column:span 3;min-height:0}
.fe{width:60px;height:60px;border-radius:17px}
.c-heat{grid-column:span 7;display:flex;flex-direction:column}
.heat{margin-block:auto 0;padding-top:16px;gap:3px}
.c-heat .legend{margin-bottom:auto}
.c-gen .gl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
:root[lang="ar"] .c-gen li{grid-template-columns:132px minmax(0,1fr) 40px}
.legend{margin-top:10px}
.c-gen{grid-column:span 5}
.c-gen ul{margin-top:16px;grid-template-columns:1fr;gap:12px}
.c-gen li{grid-template-columns:118px minmax(0,1fr) 40px;gap:14px}
.gb{grid-column:auto;height:8px}
.c-gen b{text-align:end}
@media (max-width:1100px){
.st-h{grid-template-columns:minmax(0,1fr) minmax(0,320px);column-gap:32px}
.st-h h2{font-size:clamp(30px,4vw,46px)}
.st-h > p{font-size:15px}
.tot b{font-size:clamp(28px,3.4vw,40px)}
.c{padding:20px}
.fp{width:60px;height:90px}
.fv{font-size:21px}
.c-gen li{grid-template-columns:122px minmax(0,1fr) 38px;gap:10px}
:root[lang="ar"] .c-gen li{grid-template-columns:150px minmax(0,1fr) 38px}
}
@media (max-width:820px){
.st-h{grid-template-columns:1fr;row-gap:14px}
.c-tot,.c-heat,.c-gen{grid-column:span 12}
.c-fav{grid-column:span 7;min-height:220px}
.c-feel{grid-column:span 5;min-height:220px}
.c-gen ul{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:28px}
}
@media (max-width:640px){
.stats{padding-block:72px}
.c{padding:20px}
.tots{grid-template-columns:repeat(4,auto);justify-content:space-between;gap:12px}
.tot b{font-size:26px}
.tot span{font-size:12px}
.c-fav,.c-feel{grid-column:span 12;min-height:180px}
.c-feel{min-height:0}
.c-feel .fe{margin-bottom:18px}
.c-gen ul{grid-template-columns:1fr}
.c-gen li{grid-template-columns:104px minmax(0,1fr) 38px}
}

/* Top genres: the app's donut + legend */
.gd{display:flex;align-items:center;gap:26px;margin-top:14px}
.dn{position:relative;flex:none;width:132px;height:132px;display:grid;place-items:center}
.dn svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
:root[dir="rtl"] .dn svg{transform:rotate(-90deg) scaleY(-1)}
.dn span{position:relative;display:flex;flex-direction:column;align-items:center;max-width:84px;text-align:center}
.dn b{font-family:var(--display);font-size:20px;font-weight:800;line-height:1.1;color:var(--heading)}
:root[lang="ar"] .dn b{font-weight:700}
.dn small{margin-top:2px;font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
:root[lang="ar"] .dn small{letter-spacing:0;font-size:11px}
.c-gen .lg{list-style:none;margin:0;padding:0;flex:1;min-width:0;display:flex;flex-direction:column;gap:11px}
.c-gen .lg li{display:flex;align-items:center;gap:10px;font-size:14.5px}
.c-gen .lg i{flex:none;width:10px;height:10px;border-radius:50%}
.c-gen .lg .gl{flex:1;min-width:0;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.c-gen .lg b{font-weight:800;color:var(--heading);font-variant-numeric:tabular-nums}
@media (max-width:640px){.gd{gap:18px}.dn{width:112px;height:112px}.dn b{font-size:17px}}
</style>
