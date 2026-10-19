<script setup lang="ts">
import { heroTitles } from "~/data/hero-titles";
import { feelEpisodes, feelingKeys, type Feeling } from "~/data/feelings";

// "How did it make you feel?" — the Peek feelings from brand kit v6, on an episode everyone remembers.
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

const stage = ref<HTMLElement | null>(null);

function choose(f: Feeling, _e?: Event) {
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

// Once you choose, every feeling shows its share (your vote counted).
const pctOf = computed(() => {
  const e = ep.value, mine = pick.value, total = e.votes + (mine ? 1 : 0);
  const out = {} as Record<Feeling, number>;
  for (const k of feelingKeys) out[k] = Math.round((((e.share[k] ?? 0) / 100) * e.votes + (k === mine ? 1 : 0)) / total * 100);
  return out;
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
      </div>

      <!-- one screen: the episode fills it, the feelings float over it on glass -->
      <div class="rv">
      <div ref="stage" class="stage" :class="{ picked: !!pick }">
        <div class="bg" aria-hidden="true">
          <Transition name="fade">
            <img :key="ep.id" :src="ep.still" alt="" class="im">
          </Transition>
          <i class="shade" />
        </div>

        <div class="left">
          <Transition name="rise" mode="out-in">
            <div :key="ep.id" class="meta">
              <span class="sh">{{ ar ? show.ar.title : show.en.title }}</span>
              <h3>{{ ar ? ep.name.ar : ep.name.en }}</h3>
              <span class="se">
                {{ t("feel.se", { s: fmt(ep.season), e: fmt(ep.episode) }) }}
                <i aria-hidden="true">·</i>
                <span class="imdb">IMDb</span> <b>{{ fmt(ep.imdb) }}</b>
              </span>
            </div>
          </Transition>

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
              :style="{ '--i': i }"
              :aria-checked="pick === f"
              :tabindex="tabIndexOf(i)"
              @click="choose(f, $event)"
              @keydown="onKey($event, i)"
            >
              <span class="em"><img :src="`/images/feelings-v6/${f}.svg`" alt="" width="54" height="54"></span>
              <span class="lb">{{ t(`feel.f.${f}`) }}</span>
              <!-- as in the app: once you choose, every feeling shows how many felt it -->
              <small class="fp" :class="{ hid: !pick }">{{ pick ? `${fmt(pctOf[f])}${ar ? "٪" : "%"}` : "0%" }}</small>
            </button>
          </div>
        </div>

      </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* episode tabs: a pill slides under the chosen one */
.eps{position:relative;display:flex;justify-content:center;flex-wrap:wrap;gap:8px;width:fit-content;max-width:100%;margin:36px auto 0;padding:6px;border-radius:22px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.ind{position:absolute;z-index:0;left:0;top:0;border-radius:16px;background:var(--surface-2);box-shadow:inset 0 0 0 1px rgba(var(--glass),.1),0 6px 16px -8px rgba(0,0,0,.5);transition:transform .55s cubic-bezier(.34,1.3,.64,1),width .55s cubic-bezier(.34,1.3,.64,1);pointer-events:none}
:root[data-theme="light"] .ind{background:#fff;box-shadow:0 1px 2px rgba(20,22,30,.08),0 6px 16px -8px rgba(20,22,30,.25)}
.et{position:relative;z-index:1;display:flex;align-items:center;gap:10px;height:58px;padding:6px 16px 6px 6px;border:0;border-radius:16px;cursor:pointer;text-align:start;background:transparent;transition:opacity .25s}
:root[dir="rtl"] .et{padding:6px 6px 6px 16px}
.et img{width:76px;height:46px;border-radius:11px;object-fit:cover;transition:transform .5s cubic-bezier(.34,1.56,.64,1)}
.et.on img{transform:scale(1.04)}
.et span{display:flex;flex-direction:column;line-height:1.2}
.et b{font-size:12px;font-weight:700;color:var(--muted)}
.et small{font-size:14.5px;font-weight:800;color:var(--heading)}
.et:not(.on){opacity:.62}
@media (hover:hover){.et:not(.on):hover{opacity:1}}

/* the stage: one cinematic frame. The still fills it (slow Ken Burns); the feelings sit on glass at the end side */
.stage{position:relative;overflow:hidden;isolation:isolate;margin-top:32px;min-height:0;height:clamp(440px,calc(100vh - 300px),600px);padding:28px;border-radius:32px;background:#000;display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:28px;box-shadow:0 40px 80px -40px rgba(0,0,0,.8)}
:root[data-theme="light"] .stage{box-shadow:0 40px 80px -44px rgba(16,18,27,.55)}
.bg{position:absolute;inset:0;z-index:-1}
.im{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:kb 22s ease-in-out infinite alternate;will-change:transform}
@keyframes kb{from{transform:scale(1.04) translate(0,0)}to{transform:scale(1.16) translate(-2.5%,-1.5%)}}
.fade-enter-active,.fade-leave-active{transition:opacity .9s var(--ease)}
.fade-leave-active{position:absolute}
.fade-enter-from,.fade-leave-to{opacity:0}
.shade{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,0) 32%,rgba(0,0,0,0) 52%,rgba(0,0,0,.85) 100%),
  linear-gradient(90deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,0) 45%,rgba(0,0,0,0) 100%)}
:root[dir="rtl"] .shade{background:
  linear-gradient(180deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,0) 32%,rgba(0,0,0,0) 52%,rgba(0,0,0,.85) 100%),
  linear-gradient(270deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,0) 45%,rgba(0,0,0,0) 100%)}
.left{min-width:0;display:flex;flex-direction:column;justify-content:flex-end;gap:28px;color:#fff}
.meta{padding:0 4px 6px}
.meta .sh{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#ffc42e}
:root[lang="ar"] .meta .sh{letter-spacing:0}
.meta h3{margin-top:6px;font-size:clamp(28px,3.2vw,44px);line-height:1.05;letter-spacing:-.02em;color:#fff;text-wrap:balance}
:root[lang="ar"] .meta h3{line-height:1.3;letter-spacing:0}
.se{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px;font-weight:700;color:rgba(255,255,255,.82)}
.se i{font-style:normal;opacity:.5}
.imdb{height:19px;padding:0 5px;border-radius:4px;display:inline-grid;place-items:center;font-size:11px;font-weight:900;color:#000;background:#f5c518}
.se b{color:#fff}
/* the title changes with a lift: out up, in from below */
.rise-enter-active{transition:opacity .45s var(--ease),transform .6s var(--ease)}
.rise-leave-active{transition:opacity .2s ease,transform .25s ease}
.rise-enter-from{opacity:0;transform:translateY(16px)}
.rise-leave-to{opacity:0;transform:translateY(-10px)}

/* how everyone felt: glass, bars grow one after another, the numbers count up */
.res{max-width:600px;padding:18px 20px;border-radius:22px;color:#fff;background:rgba(14,15,20,.5);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);-webkit-backdrop-filter:blur(20px) saturate(1.4);backdrop-filter:blur(20px) saturate(1.4)}
.rh{font-size:14px;font-weight:700;color:rgba(255,255,255,.88)}
.res ul{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:10px}
.res li{display:grid;grid-template-columns:28px 124px minmax(0,1fr) 48px;align-items:center;gap:12px;transition:opacity .4s,transform .5s var(--ease);transition-delay:var(--d)}
.res:not(.on) li{opacity:.32}
.res.on li{animation:row-in .5s var(--ease) both;animation-delay:var(--d)}
@keyframes row-in{from{opacity:0;transform:translateY(8px)}}
.res li img{width:28px;height:28px;border-radius:8px}
.rl{font-size:14px;font-weight:700;white-space:nowrap}
.rl small{margin-inline-start:6px;padding:1px 6px;border-radius:6px;font-size:11px;font-weight:800;color:#1c1400;background:#ffc42e}
.rb{height:8px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}
.rb i{display:block;height:100%;border-radius:4px;background:rgba(255,255,255,.78);transform-origin:left;transition:transform 1.1s cubic-bezier(.2,.9,.2,1);transition-delay:var(--d)}
:root[dir="rtl"] .rb i{transform-origin:right}
.res li.me .rb i{background:#ffc42e}
@property --n{syntax:"<integer>";inherits:false;initial-value:0}
.pct{--n:0;font-size:14px;font-weight:800;text-align:end;font-variant-numeric:tabular-nums;counter-reset:n var(--n);transition:--n 1.1s cubic-bezier(.2,.9,.2,1);transition-delay:var(--d)}
.res.on .pct::after{content:counter(n) "%"}
:root[lang="ar"] .res.on .pct::after{content:counter(n, arabic-indic) "٪"}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}

/* the feelings: dark glass over the still, in both themes */
/* frosted glass: the episode still shows through, blurred */
.card{display:flex;flex-direction:column;padding:24px;border-radius:26px;background:rgba(22,24,32,.32);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);-webkit-backdrop-filter:blur(60px) saturate(1.8) brightness(1.2);backdrop-filter:blur(60px) saturate(1.8) brightness(1.2)}
.q{font-family:var(--display);font-size:21px;font-weight:800;color:#f4f6ff;letter-spacing:-.01em}
:root[lang="ar"] .q{font-weight:700;letter-spacing:0}
.grid{flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:8px 6px;margin-top:18px;align-content:center}
.tile{display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 2px;border:0;border-radius:16px;background:transparent;cursor:pointer;transition:background .2s,opacity .35s}
.em{width:54px;height:54px;border-radius:15px;transition:transform .45s cubic-bezier(.34,1.56,.64,1),box-shadow .2s}
.em img{width:100%;height:100%;display:block}
/* before you choose, the faces bob in a slow wave, asking */
.stage:not(.picked) .em{animation:bob 3.6s ease-in-out infinite;animation-delay:calc(var(--i) * -.3s)}
@keyframes bob{0%,100%{transform:none}50%{transform:translateY(-4px)}}
.lb{font-family:"Figtree",var(--font);font-size:14px;font-weight:700;color:#c9cdda}
:root[lang="ar"] .lb{font-family:var(--font);font-size:13px}
.tile.on{background:rgba(255,196,46,.16)}
.tile.on .em{animation:pick .6s cubic-bezier(.34,1.56,.64,1) forwards;box-shadow:0 0 0 3px #ffc42e}
@keyframes pick{0%{transform:scale(1)}35%{transform:scale(.82) rotate(-6deg)}70%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1.12)}}
.tile.on .lb{color:#ffc42e}
.fp{margin-top:-4px;font-size:12.5px;font-weight:700;color:#9aa3bd;font-variant-numeric:tabular-nums;transition:opacity .25s}
.fp.hid{visibility:hidden}
.tile.on .fp{color:#ffc42e}
.tile.dim{opacity:.62}
.tile:focus-visible{outline-offset:0}
@media (hover:hover){.tile:hover{background:rgba(255,255,255,.07)}.tile:not(.on):hover .em{animation:none;transform:translateY(-4px) rotate(-5deg)}.tile.dim:hover{opacity:.9}}

/* reactions: copies of the chosen face float up across the frame (driven by the script) */
.fx{position:absolute;inset:0;z-index:4;overflow:hidden;pointer-events:none}
.feel .fx img{position:absolute;left:0;top:0;width:44px;height:44px;will-change:transform,opacity}

@media (max-width:1000px){
.stage{grid-template-columns:1fr;min-height:0}
.left{min-height:420px}
.card{max-width:560px;width:100%;margin-inline:auto}
}
@media (max-width:640px){
.eps{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;width:auto;margin-inline:calc(var(--gut)*-1);padding:6px var(--gut);border-radius:0;background:none;box-shadow:none;scrollbar-width:none}
.eps::-webkit-scrollbar{display:none}
.et{flex:none}
.stage{padding:14px;gap:14px;border-radius:24px}
.left{min-height:400px;gap:18px}
.meta{padding:6px 6px 0}
.res{padding:14px}
.res li{grid-template-columns:24px 92px minmax(0,1fr) 40px;gap:9px}
.res li img{width:24px;height:24px}
.rl{font-size:13px}
.card{padding:18px;border-radius:22px}
.em{width:48px;height:48px}
.lb{font-size:12.5px}
}
@media (prefers-reduced-motion:reduce){.im,.stage:not(.picked) .em{animation:none}}
/* one screen: on shorter windows the stage and the feelings tighten so the whole section fits */
@media (min-width:901px) and (max-height:860px){
.stage{padding:20px;gap:20px}
.card{padding:18px 18px 14px}
.grid{margin-top:12px;gap:4px 4px}
.tile{padding:4px 2px;gap:6px}
.em{width:44px;height:44px;border-radius:13px}
.lb{font-size:13px}
.fp{font-size:12px}
}
@media (max-width:900px){.stage{height:auto}}
</style>
