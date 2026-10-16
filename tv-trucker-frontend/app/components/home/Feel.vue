<script setup lang="ts">
import { heroTitles } from "~/data/hero-titles";
import { feelEpisodes, feelingKeys, type Feeling } from "~/data/feelings";

// "How did it make you feel?" — the Peek feelings from brand kit v5.8, on an episode everyone remembers.
// Pick a feeling and see how everyone else felt (your vote counts). The emoji grid follows the kit: a Surface
// #15161C card, radius 22, 4 × 3 tiles of 54px, Figtree Bold 14 #C9CDDA labels; "never change the emoji's
// black — change the background".
const { t, locale } = useI18n();
const ar = computed(() => locale.value === "ar");
const fmt = (n: number) => n.toLocaleString(ar.value ? "ar" : "en");

const epIndex = ref(0);
const ep = computed(() => feelEpisodes[epIndex.value]!);
const show = computed(() => heroTitles.find((h) => h.id === ep.value.show)!);
// your feeling, per episode
const picks = ref<Record<string, Feeling | undefined>>({});
const pick = computed(() => picks.value[ep.value.id]);

function choose(f: Feeling) {
  picks.value = { ...picks.value, [ep.value.id]: picks.value[ep.value.id] === f ? undefined : f };
}

// How everyone felt, with your vote added: the top four, plus yours if it isn't among them.
const results = computed(() => {
  const e = ep.value, mine = pick.value;
  const total = e.votes + (mine ? 1 : 0);
  const counts = feelingKeys.map((k) => ({ k, n: Math.round(((e.share[k] ?? 0) / 100) * e.votes) + (k === mine ? 1 : 0) }));
  counts.sort((a, b) => b.n - a.n);
  const top = counts.slice(0, 4);
  if (mine && !top.some((x) => x.k === mine)) top.push(counts.find((x) => x.k === mine)!);
  const max = counts[0]!.n || 1;
  return { total, rows: top.map((x) => ({ ...x, pct: Math.round((x.n / total) * 100), w: x.n / max })) };
});

// Arrow keys move between the 12 tiles (one tab stop for the grid).
const grid = ref<HTMLElement | null>(null);
function onKey(e: KeyboardEvent, i: number) {
  const rtl = document.documentElement.dir === "rtl";
  const step: Record<string, number> = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 4, ArrowUp: -4 };
  const d = step[e.key];
  if (d === undefined) return;
  e.preventDefault();
  const j = (i + d + 12) % 12;
  grid.value?.querySelectorAll<HTMLElement>("button")[j]?.focus();
}
const tabIndexOf = (i: number) => {
  const sel = pick.value ? feelingKeys.indexOf(pick.value) : 0;
  return i === sel ? 0 : -1;
};
</script>

<template>
  <section id="feel" class="sec feel" aria-labelledby="fe-h">
    <div class="wrap">
      <div class="sec-h c rv">
        <span class="kick">{{ t("feel.kick") }}</span>
        <h2 id="fe-h">{{ t("feel.titleLine") }}<br><em>{{ t("feel.titleEm") }}</em></h2>
        <p>{{ t("feel.lede") }}</p>
      </div>

      <!-- three episodes to choose from -->
      <div class="eps rv" role="tablist" :aria-label="t('feel.episodes')">
        <button
          v-for="(e, i) in feelEpisodes"
          :key="e.id"
          type="button"
          role="tab"
          class="et"
          :class="{ on: i === epIndex }"
          :aria-selected="i === epIndex"
          @click="epIndex = i"
        >
          <img :src="e.still" alt="" loading="lazy">
          <span>
            <b>{{ ar ? heroTitles.find((h) => h.id === e.show)!.ar.title : heroTitles.find((h) => h.id === e.show)!.en.title }}</b>
            <small>{{ ar ? e.name.ar : e.name.en }}</small>
          </span>
        </button>
      </div>

      <div class="stage rv">
        <!-- the episode -->
        <div class="still">
          <Transition name="fade">
            <img :key="ep.id" :src="ep.still" alt="" class="im">
          </Transition>
          <i class="shade" aria-hidden="true" />
          <div class="meta">
            <span class="sh">{{ ar ? show.ar.title : show.en.title }}</span>
            <h3>{{ ar ? ep.name.ar : ep.name.en }}</h3>
            <span class="se">
              {{ t("feel.se", { s: fmt(ep.season), e: fmt(ep.episode) }) }}
              <i aria-hidden="true">·</i>
              <span class="imdb">IMDb</span> <b>{{ fmt(ep.imdb) }}</b>
            </span>
          </div>

          <!-- how everyone felt -->
          <div class="res" :class="{ on: pick }" aria-live="polite">
            <p class="rh">
              <template v-if="pick">{{ t("feel.everyone", { n: fmt(results.total) }) }}</template>
              <template v-else>{{ t("feel.pickFirst") }}</template>
            </p>
            <ul role="list">
              <li v-for="r in results.rows" :key="r.k" :class="{ me: r.k === pick }">
                <img :src="`/images/feelings/${r.k}.svg`" alt="" width="28" height="28">
                <span class="rl">{{ t(`feel.f.${r.k}`) }}<small v-if="r.k === pick">{{ t("feel.you") }}</small></span>
                <span class="rb"><i :style="{ transform: `scaleX(${pick ? r.w : 0})` }" /></span>
                <b>{{ pick ? `${fmt(r.pct)}%` : "" }}</b>
              </li>
            </ul>
          </div>
        </div>

        <!-- the feelings, as in the app -->
        <div class="card">
          <p class="q">{{ t("feel.question") }}</p>
          <div ref="grid" class="grid" role="radiogroup" :aria-label="t('feel.question')">
            <button
              v-for="(f, i) in feelingKeys"
              :key="f"
              type="button"
              role="radio"
              class="tile"
              :class="{ on: pick === f, dim: pick && pick !== f }"
              :aria-checked="pick === f"
              :tabindex="tabIndexOf(i)"
              @click="choose(f)"
              @keydown="onKey($event, i)"
            >
              <span class="em"><img :src="`/images/feelings/${f}.svg`" alt="" width="54" height="54"></span>
              <span class="lb">{{ t(`feel.f.${f}`) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* episode tabs */
.eps{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:36px}
.et{display:flex;align-items:center;gap:10px;height:58px;padding:6px 16px 6px 6px;border:0;border-radius:16px;cursor:pointer;text-align:start;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);transition:box-shadow .2s,background .2s}
:root[dir="rtl"] .et{padding:6px 6px 6px 16px}
.et img{width:76px;height:46px;border-radius:11px;object-fit:cover}
.et span{display:flex;flex-direction:column;line-height:1.2}
.et b{font-size:12px;font-weight:700;color:var(--muted)}
.et small{font-size:14.5px;font-weight:800;color:var(--heading)}
.et.on{box-shadow:inset 0 0 0 2px var(--amber);background:rgba(255,196,46,.08)}
@media (hover:hover){.et:not(.on):hover{box-shadow:inset 0 0 0 1px rgba(var(--glass),.25)}}

.stage{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:20px;margin-top:28px;align-items:stretch}

/* the episode still, with how everyone felt over it */
.still{position:relative;overflow:hidden;min-height:470px;border-radius:28px;background:#000;isolation:isolate}
.im{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fade-enter-active,.fade-leave-active{transition:opacity .6s var(--ease)}
.fade-enter-from,.fade-leave-to{opacity:0}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,.25) 55%,rgba(0,0,0,.92) 100%)}
.meta{position:absolute;top:26px;inset-inline-start:28px;inset-inline-end:28px;color:#fff}
.meta .sh{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#ffc42e}
:root[lang="ar"] .meta .sh{letter-spacing:0}
.meta h3{margin-top:6px;font-size:clamp(26px,2.8vw,36px);line-height:1.08;color:#fff}
.se{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:14px;font-weight:700;color:rgba(255,255,255,.8)}
.se i{font-style:normal;opacity:.5}
.imdb{height:19px;padding:0 5px;border-radius:4px;display:inline-grid;place-items:center;font-size:11px;font-weight:900;color:#000;background:#f5c518}
.se b{color:#fff}

.res{position:absolute;inset-inline:20px;bottom:20px;padding:18px 20px;border-radius:20px;color:#fff;background:rgba(14,15,20,.62);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);-webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3)}
.rh{font-size:14px;font-weight:700;color:rgba(255,255,255,.85)}
.res ul{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:9px}
.res li{display:grid;grid-template-columns:28px 120px minmax(0,1fr) 44px;align-items:center;gap:12px;transition:opacity .4s}
.res:not(.on) li{opacity:.35}
.res li img{width:28px;height:28px;border-radius:8px}
.rl{font-size:14px;font-weight:700;white-space:nowrap}
.rl small{margin-inline-start:6px;padding:1px 6px;border-radius:6px;font-size:11px;font-weight:800;color:#1c1400;background:#ffc42e}
.rb{height:8px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}
.rb i{display:block;height:100%;border-radius:4px;background:rgba(255,255,255,.75);transform-origin:left;transition:transform .9s var(--ease)}
:root[dir="rtl"] .rb i{transform-origin:right}
.res li.me .rb i{background:#ffc42e}
.res li b{font-size:14px;font-weight:800;text-align:end;font-variant-numeric:tabular-nums}

/* the feelings card: always the kit's dark Surface, in both themes */
.card{display:flex;flex-direction:column;padding:24px;border-radius:28px;background:#15161c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),var(--shadow)}
.q{font-family:var(--display);font-size:21px;font-weight:800;color:#f4f6ff;letter-spacing:-.01em}
:root[lang="ar"] .q{font-weight:700;letter-spacing:0}
.grid{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:8px 6px;margin-top:18px;align-content:center}
.tile{display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 2px;border:0;border-radius:16px;background:transparent;cursor:pointer;transition:background .2s,opacity .3s}
.em{width:54px;height:54px;border-radius:15px;transition:transform .35s cubic-bezier(.34,1.56,.64,1),box-shadow .2s}
.em img{width:100%;height:100%}
.lb{font-family:"Figtree",var(--font);font-size:14px;font-weight:700;color:#c9cdda}
:root[lang="ar"] .lb{font-family:var(--font);font-size:13px}
.tile.on{background:rgba(255,196,46,.16)}
.tile.on .em{transform:scale(1.12);box-shadow:0 0 0 3px #ffc42e}
.tile.on .lb{color:#ffc42e}
.tile.dim{opacity:.55}
.tile:focus-visible{outline-offset:0}
@media (hover:hover){.tile:hover{background:rgba(255,255,255,.06)}.tile:not(.on):hover .em{transform:translateY(-3px) rotate(-4deg)}}

@media (max-width:1000px){
  .stage{grid-template-columns:1fr}
  .card{max-width:520px;width:100%;margin-inline:auto}
}
@media (max-width:640px){
  .eps{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;margin-inline:calc(var(--gut)*-1);padding-inline:var(--gut);scrollbar-width:none}
  .eps::-webkit-scrollbar{display:none}
  .et{flex:none}
  .still{min-height:440px;border-radius:22px}
  .meta{top:20px;inset-inline:20px}
  .res{inset-inline:12px;bottom:12px;padding:14px}
  .res li{grid-template-columns:24px 92px minmax(0,1fr) 38px;gap:9px}
  .res li img{width:24px;height:24px}
  .rl{font-size:13px}
  .card{padding:18px;border-radius:22px}
  .em{width:48px;height:48px}
  .lb{font-size:12.5px}
}
</style>
