<script setup lang="ts">
import { heroTitles } from "~/data/hero-titles";
import { watching, type WatchShow } from "~/data/watching";

// "Every episode, ticked off" — the app's Watching now list, for real: tick an episode and it plays the
// app's mark-watched motion (specs/app-my-shows-rules-and-motion.md):
//   press .88 → amber sweep in 420ms (.65,0,.35,1) → the ink badge pops on a spring, the check draws, "WATCHED"
//   → hold, the next episode goes in underneath → sweep out 460ms, the new episode enters from −28px (+110ms)
//   → the show moves to the top (500ms, (.2,0,0,1)).
// The last aired episode: ALL CAUGHT UP (still running, holds 1.4s) or SERIES COMPLETE (ended: "N episodes
// watched" and confetti, holds 2.6s); then the card fades and the list closes up. One card at a time.
const { t, locale } = useI18n();
const { links } = useAppConfig();

interface Card {
  show: WatchShow;
  title: { en: string; ar: string };
  poster: string;
  backdrop: string;
  at: number; // index into show.episodes
  phase: "" | "in" | "out";
  end: "" | "caught" | "complete";
}

const fresh = (): Card[] =>
  watching.map((show) => {
    const h = heroTitles.find((x) => x.id === show.id)!;
    return { show, title: { en: h.en.title, ar: h.ar.title }, poster: h.poster, backdrop: h.backdrop, at: 0, phase: "", end: "" };
  });
const cards = ref<Card[]>(fresh());
const busy = ref(false);

const ar = computed(() => locale.value === "ar");
const lastN = (c: Card) => c.show.episodes[c.show.episodes.length - 1]!.n;
const ep = (c: Card) => c.show.episodes[c.at]!;
const left = (c: Card) => lastN(c) - ep(c).n;
const pct = (c: Card) => {
  const total = c.show.before + lastN(c);
  return (c.show.before + ep(c).n - 1) / total;
};
const watchedCount = (c: Card) => c.show.before + lastN(c);
const tag = (c: Card) => (left(c) > 0 ? `+${left(c)}` : c.show.ended ? t("track.finale") : t("track.latest"));
const fmt = (n: number) => n.toLocaleString(ar.value ? "ar" : "en");

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const panel = ref<HTMLElement | null>(null);

async function mark(c: Card) {
  if (busy.value) return; // locked while a card animates
  busy.value = true;
  hint.value = false;
  const quick = still();
  const last = c.at === c.show.episodes.length - 1;
  c.phase = "in";
  if (last) {
    c.end = c.show.ended ? "complete" : "caught";
    await wait(quick ? 50 : 600);
    if (c.end === "complete" && panel.value) fireConfetti(panel.value);
    await wait(quick ? 600 : c.end === "complete" ? 2600 : 1400);
    cards.value = cards.value.filter((x) => x !== c); // fades out, the list closes up (TransitionGroup)
    await wait(quick ? 0 : 720);
    busy.value = false;
    return;
  }
  await wait(quick ? 50 : 1070);
  c.at++; // the next episode, under the panel
  c.phase = "out";
  await wait(quick ? 50 : 460);
  c.phase = "";
  await wait(quick ? 0 : 80);
  // the watched show becomes first in Watching now
  const i = cards.value.indexOf(c);
  if (i > 0) cards.value = [c, ...cards.value.filter((x) => x !== c)];
  await wait(quick ? 0 : 500);
  busy.value = false;
}

const reset = () => {
  cards.value = fresh();
};

// A nudge: once the list is on screen, the first ✓ pulses until someone uses it.
const hint = ref(false);
const root = ref<HTMLElement | null>(null);
let io: IntersectionObserver | null = null;
onMounted(() => {
  if (!("IntersectionObserver" in window) || !root.value) return;
  io = new IntersectionObserver(
    ([e]) => {
      if (!e?.isIntersecting) return;
      io?.disconnect();
      setTimeout(() => (hint.value = !busy.value), 900);
    },
    { threshold: 0.5 },
  );
  io.observe(root.value);
});
onBeforeUnmount(() => io?.disconnect());
</script>

<template>
  <section id="track" class="sec track" aria-labelledby="tr-h">
    <div class="wrap tr-g">
      <div class="sec-h rv">
        <span class="kick">{{ t("track.kick") }}</span>
        <h2 id="tr-h">{{ t("track.titleLine") }}<br><em>{{ t("track.titleEm") }}</em></h2>
        <p>{{ t("track.lede") }}</p>
        <ul class="pts" role="list">
          <li v-for="k in ['left', 'end', 'sync']" :key="k">
            <span class="pi" aria-hidden="true">
              <svg v-if="k === 'left'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M4 12h16M4 18h7" /></svg>
              <svg v-else-if="k === 'end'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-14.2 5M4 12a8 8 0 0 1 14.2-5" /><path d="M18.5 3v4h-4M5.5 21v-4h4" /></svg>
            </span>
            <span><b>{{ t(`track.points.${k}.title`) }}</b>{{ t(`track.points.${k}.text`) }}</span>
          </li>
        </ul>
      </div>

      <!-- the list, as in the app -->
      <div ref="root" class="rv">
        <div ref="panel" class="panel">
          <div class="ph">
            <span class="pt">{{ t("track.watchingNow") }}</span>
            <span class="pc">{{ fmt(cards.length) }}</span>
            <span class="hint">{{ t("track.tryIt") }}</span>
          </div>

          <TransitionGroup tag="ul" name="row" class="rows" role="list">
            <li v-for="(c, i) in cards" :key="c.show.id" class="row" :class="[{ top: i === 0 }, c.phase && `ph-${c.phase}`, c.end && `end-${c.end}`]">
              <span class="bd" :style="{ backgroundImage: `url('${c.backdrop}')` }" aria-hidden="true" />
              <img class="po" :src="c.poster" alt="" loading="lazy">
              <div class="info">
                <b class="ttl">{{ ar ? c.title.ar : c.title.en }}</b>
                <!-- re-keyed per episode, so the next one plays its entrance -->
                <span :key="c.at" class="ep" :class="{ next: c.at > 0 }">
                  <em>{{ t("track.se", { s: fmt(c.show.season), e: fmt(ep(c).n) }) }}</em>
                  <span>{{ ar ? ep(c).ar : ep(c).en }}</span>
                </span>
                <span class="bar" aria-hidden="true"><i :style="{ transform: `scaleX(${pct(c)})` }" /></span>
              </div>
              <span class="tg" :class="{ fin: left(c) === 0 }">{{ tag(c) }}</span>
              <button
                type="button"
                class="ck"
                :class="{ pulse: hint && i === 0 }"
                :disabled="busy"
                :aria-label="t('track.markLabel', { title: ar ? c.title.ar : c.title.en, s: c.show.season, e: ep(c).n })"
                @click="mark(c)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </button>

              <!-- the amber sweep -->
              <div v-if="c.phase" class="sw" aria-hidden="true">
                <span class="badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                <span class="sl">
                  <b>{{ c.end === "complete" ? t("track.complete") : c.end === "caught" ? t("track.caught") : t("track.watched") }}</b>
                  <small v-if="c.end === 'complete'">{{ t("track.watchedCount", { n: fmt(watchedCount(c)) }) }}</small>
                </span>
              </div>
            </li>
          </TransitionGroup>

          <div v-if="!cards.length" class="empty">
            <img src="/images/feelings/thrilled.svg" alt="" width="56" height="56">
            <b>{{ t("track.allDone") }}</b>
            <button type="button" class="btn sm ghost" @click="reset">{{ t("track.again") }}</button>
          </div>
          <p class="sr" aria-live="polite">{{ cards.length ? "" : t("track.allDone") }}</p>
        </div>
        <a class="more" :href="links.app">
          {{ t("track.cta") }}
          <svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.track{--io:cubic-bezier(.65,0,.35,1);--emph:cubic-bezier(.2,0,0,1);--spring:cubic-bezier(.34,1.56,.64,1)}
.tr-g{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:72px;align-items:center}

.pts{list-style:none;margin:30px 0 0;padding:0;display:grid;gap:18px}
.pts li{display:flex;gap:14px;align-items:flex-start;font-size:15.5px;line-height:1.55;color:var(--muted)}
.pts b{display:block;font-size:16px;color:var(--heading)}
.pi{flex:none;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:rgba(255,196,46,.14);color:var(--amber)}
:root[data-theme="light"] .pi{background:rgba(255,196,46,.24);color:var(--accent)}
.pi svg{width:19px;height:19px}

/* the panel: the app's dark list on a surface card */
.panel{position:relative;overflow:hidden;padding:18px;border-radius:28px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow)}
.ph{display:flex;align-items:center;gap:10px;padding:4px 6px 14px}
.pt{font-family:var(--display);font-size:20px;font-weight:800;color:var(--heading);letter-spacing:-.01em}
:root[lang="ar"] .pt{font-weight:700;letter-spacing:0}
.pc{min-width:26px;height:24px;padding:0 8px;border-radius:8px;display:grid;place-items:center;font-size:13px;font-weight:800;color:var(--ink);background:var(--amber)}
.hint{margin-inline-start:auto;font-size:13px;font-weight:700;color:var(--muted)}

.rows{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.row{position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:14px;padding:12px 14px 12px 12px;border-radius:18px;background:var(--surface-2);isolation:isolate}
:root[dir="rtl"] .row{padding:12px 12px 12px 14px}
/* the top card is the "hero": its backdrop shows through */
.bd{position:absolute;inset:0;z-index:-1;background:center 30%/cover no-repeat;opacity:0;transition:opacity .5s var(--emph)}
.bd::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,14,.94) 30%,rgba(10,10,14,.55))}
:root[dir="rtl"] .bd::after{background:linear-gradient(270deg,rgba(10,10,14,.94) 30%,rgba(10,10,14,.55))}
.row.top{padding-block:18px}
.row.top .bd{opacity:1}
.row.top .ttl,.row.top .ep span{color:#fff}
.row.top .ep em{color:#ffc42e}
.row.top .tg{color:#fff;background:rgba(255,255,255,.14)}
.row.top .bar{background:rgba(255,255,255,.18)}
.po{width:58px;height:87px;border-radius:10px;object-fit:cover;background:var(--ph);box-shadow:0 0 0 1px rgba(255,255,255,.08);transition:width .5s var(--emph),height .5s var(--emph)}
.row.top .po{width:74px;height:111px}
.info{min-width:0;display:flex;flex-direction:column;gap:5px}
.ttl{font-family:var(--display);font-size:17px;font-weight:800;color:var(--heading);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
:root[lang="ar"] .ttl{font-weight:700;letter-spacing:0}
.ep{display:flex;gap:7px;min-width:0;font-size:14px;font-weight:600;color:var(--dim)}
.ep em{flex:none;font-style:normal;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums}
.ep span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{display:block;height:5px;margin-top:5px;border-radius:3px;background:rgba(var(--glass),.1);overflow:hidden}
.bar i{display:block;height:100%;border-radius:3px;background:var(--amber);transform-origin:left;transition:transform .6s var(--emph)}
:root[dir="rtl"] .bar i{transform-origin:right}
.tg{height:26px;padding:0 9px;border-radius:8px;display:grid;place-items:center;font-size:12px;font-weight:800;letter-spacing:.02em;color:var(--dim);background:rgba(var(--glass),.08);font-variant-numeric:tabular-nums}
.tg.fin{color:var(--ink)!important;background:var(--amber)!important}
/* the ✓: an outlined circle; 44px to touch */
.ck{position:relative;width:44px;height:44px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--amber);background:rgba(255,196,46,.12);box-shadow:inset 0 0 0 2px rgba(255,196,46,.55);transition:transform .15s var(--ease),background .2s}
:root[data-theme="light"] .ck{color:var(--accent);background:rgba(255,196,46,.2);box-shadow:inset 0 0 0 2px rgba(200,140,0,.5)}
.row.top .ck{color:#ffc42e;background:rgba(255,196,46,.16);box-shadow:inset 0 0 0 2px rgba(255,196,46,.7)}
.ck svg{width:22px;height:22px}
.ck:active{transform:scale(.88)}
.ck:disabled{cursor:default}
@media (hover:hover){.ck:not(:disabled):hover{background:rgba(255,196,46,.24)}}
.ck.pulse::after{content:"";position:absolute;inset:-2px;border-radius:50%;box-shadow:0 0 0 2px #ffc42e;animation:pulse 1.6s var(--ease) infinite}
@keyframes pulse{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(1.6)}}

/* the sweep: amber panel in from the start side, badge pops, check draws, label fades in; out to the end side */
.sw{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;gap:12px;background:#ffc42e;color:#1c1400;transform:translateX(-100%)}
:root[dir="rtl"] .sw{transform:translateX(100%)}
.ph-in .sw{animation:sw-in .42s var(--io) forwards}
.ph-out .sw{transform:none;animation:sw-out .46s var(--io) forwards}
@keyframes sw-in{to{transform:none}}
@keyframes sw-out{to{transform:translateX(100%)}}
:root[dir="rtl"] .ph-out .sw{animation-name:sw-out-r}
@keyframes sw-out-r{to{transform:translateX(-100%)}}
.badge{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#1c1400;color:#ffc42e;transform:scale(0);animation:pop .42s .18s var(--spring) forwards}
.badge svg{width:20px;height:20px;stroke-dasharray:24;stroke-dashoffset:24;animation:draw .3s .38s var(--ease) forwards}
@keyframes pop{to{transform:scale(1)}}
@keyframes draw{to{stroke-dashoffset:0}}
.sl{display:flex;flex-direction:column;line-height:1.15;opacity:0;transform:translateY(-8px);animation:lab .3s .3s var(--ease) forwards}
.sl b{font-size:16px;font-weight:900;letter-spacing:.08em}
:root[lang="ar"] .sl b{letter-spacing:0}
.sl small{font-size:13px;font-weight:700;opacity:.75}
@keyframes lab{to{opacity:1;transform:none}}
.ph-out .badge,.ph-out .sl{transform:none;opacity:1;animation:none}
.ph-out .badge svg{stroke-dashoffset:0;animation:none}

/* the next episode enters from −28px, 110ms after the sweep starts out */
.ep.next{animation:ep-in .45s .11s var(--ease) backwards}
@keyframes ep-in{from{opacity:0;transform:translateX(-28px)}}
:root[dir="rtl"] .ep.next{animation-name:ep-in-r}
@keyframes ep-in-r{from{opacity:0;transform:translateX(28px)}}

/* reorder (FLIP), and a finished show leaving: fade 220ms, then the list closes up 500ms */
.row-move{transition:transform .5s var(--emph)}
.row-leave-active{transition:opacity .22s ease;position:absolute;left:0;right:0}
.row-leave-to{opacity:0}

.empty{display:flex;flex-direction:column;align-items:center;gap:14px;padding:36px 10px 28px;text-align:center}
.empty img{width:56px;height:56px;border-radius:16px}
.empty b{font-family:var(--display);font-size:20px;color:var(--heading)}
.sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0)}

.more{display:flex;width:fit-content;align-items:center;gap:3px;height:40px;margin:14px auto 0;font-size:15px;font-weight:700;color:var(--accent)}
.more svg{width:17px;height:17px;transition:transform .2s var(--ease)}
:root[dir="rtl"] .more svg.ar{transform:scaleX(-1)}

@media (max-width:1000px){.tr-g{grid-template-columns:1fr;gap:48px}.tr-g > .rv:last-child{max-width:640px;width:100%;margin-inline:auto}}
@media (max-width:640px){
  .panel{padding:12px;border-radius:22px}
  .hint{display:none}
  .row{gap:10px;padding:10px}
  :root[dir="rtl"] .row{padding:10px}
  .po{width:48px;height:72px}
  .row.top .po{width:60px;height:90px}
  .ttl{font-size:15.5px}
  .ep{font-size:13px}
  .tg{height:24px;padding:0 7px;font-size:11px}
}
@media (prefers-reduced-motion:reduce){.ck.pulse::after{display:none}}
</style>
