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
const fmt2 = (n: number) => n.toLocaleString(ar.value ? "ar" : "en", { minimumIntegerDigits: 2 });

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
            <span>{{ t(`track.points.${k}.title`) }}</span>
          </li>
        </ul>
      </div>

      <!-- the list, as in the app -->
      <div ref="root" class="rv">
        <div ref="panel" class="panel">
          <div class="ph">
            <span class="pt">{{ t("track.watchingNow") }}</span>
            <span class="pc">{{ fmt(cards.length) }}</span>
          </div>

          <TransitionGroup tag="ul" name="row" class="rows" role="list">
            <li v-for="(c, i) in cards" :key="c.show.id" class="row" :class="[i === 0 ? 'hero' : 'line', c.phase && `ph-${c.phase}`, c.end && `end-${c.end}`]">
              <span class="bd" :style="{ backgroundImage: `url('${c.backdrop}')` }" aria-hidden="true" />
              <span class="sc" aria-hidden="true" />
              <span class="th" :style="{ backgroundImage: `url('${c.backdrop}')` }" aria-hidden="true" />
              <div class="info">
                <b class="ttl">{{ ar ? c.title.ar : c.title.en }}</b>
                <!-- re-keyed per episode, so the next one plays its entrance -->
                <span :key="c.at" class="ep" :class="{ next: c.at > 0 }">
                  <span class="code"><em>{{ t("track.se", { s: fmt2(c.show.season), e: fmt2(ep(c).n) }) }}</em><i class="tg" :class="{ fin: left(c) === 0 }">{{ tag(c) }}</i></span>
                  <span class="en">{{ ar ? ep(c).ar : ep(c).en }}</span>
                </span>
              </div>
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
            <img src="/images/feelings-v6/thrilled.svg" alt="" width="56" height="56">
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
.pts{list-style:none;margin:28px 0 0;padding:0;display:grid;gap:12px}
.pts li{display:flex;gap:12px;align-items:center;font-size:16px;font-weight:600;line-height:1.35;color:var(--heading)}
.pi{flex:none;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:rgba(255,196,46,.14);color:var(--amber)}
:root[data-theme="light"] .pi{background:rgba(255,196,46,.24);color:var(--accent)}
.pi svg{width:17px;height:17px}

/* the panel: the app's dark list on a surface card */
.panel{position:relative;overflow:hidden;padding:18px;border-radius:28px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow)}
.ph{position:relative;display:flex;align-items:center;gap:10px;min-height:58px;padding:4px 6px 14px}
.pt{align-self:baseline;font-family:var(--display);font-size:20px;font-weight:800;color:var(--heading);letter-spacing:-.01em}
:root[lang="ar"] .pt{font-weight:700;letter-spacing:0}
/* the count, as in the app: a quiet number beside the title */
.pc{align-self:baseline;font-size:15px;font-weight:700;color:var(--muted);font-variant-numeric:tabular-nums}
/* the hint stops short of Peek, who sits over the first card's ✓ */
.hint{margin-inline-start:auto;margin-inline-end:calc(var(--ck-x) + var(--pw) / 2 + 6px);font-size:13px;font-weight:700;color:var(--muted);transition:opacity .3s ease}
.hint.off{opacity:0}

/* Peek over anything (kit v6.1, "down"): the eyes' flat bottom sits exactly on the first card's top edge,
   centred over its ✓. Rises once the list is on screen, sinks after the first tap. */
.peek{position:absolute;bottom:0;inset-inline-end:calc(var(--ck-x) - var(--pw) / 2);width:var(--pw);height:calc(var(--pw) * 40 / 88);overflow:hidden;pointer-events:none}
.peek img{position:absolute;left:0;bottom:0;width:100%;height:100%;transform:translateY(100%);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.peek.up img{transform:none;animation:bob 2.4s 1s ease-in-out infinite}
@keyframes bob{0%,100%{transform:none}50%{transform:translateY(3px)}}
.pe-l{display:none}
:root[data-theme="light"] .pe-d{display:none}
:root[data-theme="light"] .pe-l{display:block}

/* the list, as the app draws Watching now: the latest show is the hero (its backdrop, full bleed);
   the rest are rows — a floating 16:9 still on its own blurred backdrop */
.panel{--ck-x:60px;--pw:116px}
.rows{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.row{position:relative;overflow:hidden;isolation:isolate;display:flex;align-items:center;gap:16px;border-radius:20px;background:var(--surface-2);transition:height .5s var(--emph)}
.bd{position:absolute;z-index:-2;inset:0;background:center 30%/cover no-repeat;transition:filter .5s var(--emph),opacity .5s var(--emph),inset .5s var(--emph)}
.sc{position:absolute;z-index:-1;inset:0;transition:opacity .5s var(--emph)}
.th{flex:none;border-radius:12px;background:var(--ph) center/cover no-repeat;box-shadow:0 4px 12px rgba(0,0,0,.3);transition:width .5s var(--emph),opacity .3s ease}
.info{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.ttl{font-family:var(--display);font-weight:800;color:var(--heading);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
:root[lang="ar"] .ttl{font-weight:700;letter-spacing:0}
.ep{display:flex;flex-direction:column;gap:2px;min-width:0}
.code{display:flex;align-items:baseline;gap:8px}
.code em{font-style:normal;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums;letter-spacing:.01em}
.tg{direction:ltr;unicode-bidi:isolate;font-style:normal;font-size:14px;font-weight:600;color:var(--muted);font-variant-numeric:tabular-nums}
.tg.fin{font-size:12px;font-weight:800;letter-spacing:.1em;color:var(--accent)}
:root[lang="ar"] .tg.fin{letter-spacing:0;font-size:13px}
.en{font-size:14px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* hero */
.row.hero{height:232px;align-items:flex-end;padding:0 36px 22px 24px}
:root[dir="rtl"] .row.hero{padding:0 24px 22px 36px}
.hero .bd{filter:none;opacity:1}
.hero .sc{background:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.86))}
.hero .th{width:0;margin-inline-end:-16px;opacity:0}
.hero .ttl{font-size:22px;color:#fff}
.hero .code em,.hero .tg.fin{color:#ffc42e}
.hero .code em{font-size:18px}
.hero .tg{color:rgba(255,255,255,.7)}
.hero .en{color:rgba(255,255,255,.8)}

/* rows */
.row.line{height:104px;padding:0 36px 0 8px}
:root[dir="rtl"] .row.line{padding:0 8px 0 36px}
.line .bd{inset:-24px -16px;filter:blur(6px);opacity:.3}
.line .sc{background:linear-gradient(90deg,rgba(17,18,23,.15),rgba(17,18,23,.45))}
:root[dir="rtl"] .line .sc{background:linear-gradient(270deg,rgba(17,18,23,.15),rgba(17,18,23,.45))}
:root[data-theme="light"] .line .sc{background:linear-gradient(90deg,rgba(255,255,255,.42),rgba(255,255,255,.5) 35%,rgba(255,255,255,.62))}
:root[data-theme="light"][dir="rtl"] .line .sc{background:linear-gradient(270deg,rgba(255,255,255,.42),rgba(255,255,255,.5) 35%,rgba(255,255,255,.62))}
/* light: the same bright, saturated poster blur as the Upcoming cards */
:root[data-theme="light"] .line .bd{filter:blur(5px) saturate(1.6) brightness(1.2);opacity:.6}
.line .th{width:156px;height:88px}
.line .ttl{font-size:17px}
.line .code em{font-size:16px}

/* the ✓: the app's glass circle */
.ck{position:relative;flex:none;width:48px;height:48px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#fff;
  background:rgba(0,0,0,.32);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.55);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);transition:transform .15s var(--ease),background .2s,box-shadow .2s}
.ck svg{width:22px;height:22px}
.ck:active{transform:scale(.88)}
.ck:disabled{cursor:default}
.hero .ck{margin-bottom:2px}
:root[data-theme="light"] .line .ck{color:var(--heading);background:rgba(255,255,255,.6);box-shadow:inset 0 0 0 1.5px rgba(16,18,27,.22)}
@media (hover:hover){.ck:not(:disabled):hover{background:rgba(255,196,46,.24);box-shadow:inset 0 0 0 1.5px rgba(255,196,46,.8)}}
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
/* light mode: the watched sweep is the app's green, white tick and text */
:root[data-theme="light"] .sw{background:#61C169;color:#fff}
:root[data-theme="light"] .badge{background:#fff;color:#61C169}
:root[data-theme="light"] .sl small{opacity:.9}

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
.panel{padding:12px;border-radius:22px;--ck-x:46px;--pw:88px}
.ph{min-height:50px}
.hint{display:none}
.row.hero{height:196px;padding:0 24px 16px 16px}
:root[dir="rtl"] .row.hero{padding:0 16px 16px 24px}
.row.line{height:84px;gap:12px;padding:0 24px 0 6px}
:root[dir="rtl"] .row.line{padding:0 6px 0 24px}
.line .th{width:112px;height:63px;border-radius:10px}
.hero .th{margin-inline-end:-12px}
.hero .ttl{font-size:19px}
.hero .code em{font-size:16px}
.line .ttl{font-size:15px}
.line .code em{font-size:14px}
.tg{font-size:12.5px}
.en{font-size:12.5px}
.ck{width:44px;height:44px}
}
@media (prefers-reduced-motion:reduce){.ck.pulse::after{display:none}}
</style>
