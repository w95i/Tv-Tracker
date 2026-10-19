<script setup lang="ts">
import type { UpcomingItem } from "~~/server/utils/upcoming";

// "Never miss a return" — the app's Upcoming tab, live: what's next for well-known shows and films, from the
// TVTracker API through /api/upcoming (cached 6h). Grouped as in the app (specs/app-my-shows-rules-and-motion.md):
// Today · This week (1–7 days) · This month (8–31) · Later (32+); countdown on the poster (TODAY in amber),
// PREMIERE / FINALE tags, and where to watch. A notification for today's return slides in once.
const { t, locale } = useI18n();
const ar = computed(() => locale.value === "ar");

const { data } = await useFetch<UpcomingItem[]>("/api/upcoming", { key: "upcoming", default: () => [] });
// one "today" for the server render and the browser, so the groups match
const today = useState("upcoming-today", () => new Date().toISOString().slice(0, 10));

const DAY = 86_400_000;
const daysTo = (d: string) => Math.round((Date.parse(d) - Date.parse(today.value)) / DAY);
type Group = "today" | "week" | "month" | "later";
const groupOf = (n: number): Group => (n <= 0 ? "today" : n <= 7 ? "week" : n <= 31 ? "month" : "later");

const groups = computed(() => {
  const out: { key: Group; items: (UpcomingItem & { days: number })[] }[] = [];
  for (const it of data.value ?? []) {
    const days = daysTo(it.date);
    if (days < 0) continue;
    const key = groupOf(days);
    let g = out.find((x) => x.key === key);
    if (!g) out.push((g = { key, items: [] }));
    g.items.push({ ...it, days });
  }
  return out;
});

const fmt = (n: number) => n.toLocaleString(ar.value ? "ar" : "en");
// Arabic counts change form with the number (يومين، ٣ أيام، ١١ يوماً)
function countdown(days: number) {
  if (days <= 0) return t("up.today");
  if (days === 1) return t("up.tomorrow");
  if (days <= 31) {
    if (!ar.value) return t("up.inDays", { n: days });
    return days === 2 ? "بعد يومين" : days <= 10 ? `بعد ${fmt(days)} أيام` : `بعد ${fmt(days)} يوماً`;
  }
  const m = Math.round(days / 30.4);
  if (!ar.value) return m === 1 ? t("up.inMonth") : t("up.inMonths", { n: m });
  return m === 1 ? "بعد شهر" : m === 2 ? "بعد شهرين" : m <= 10 ? `بعد ${fmt(m)} أشهر` : `بعد ${fmt(m)} شهراً`;
}
const dateLabel = (d: string) =>
  new Intl.DateTimeFormat(ar.value ? "ar" : "en", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(d));
const title = (it: UpcomingItem) => (ar.value ? it.title.ar : it.title.en);
const fmt2 = (n: number) => n.toLocaleString(ar.value ? "ar" : "en", { minimumIntegerDigits: 2 });
const epLine = (it: UpcomingItem) => (it.season ? t("up.se", { s: fmt2(it.season), e: fmt2(it.episode ?? 1) }) : t("up.film"));
// "day" / "days" under the countdown number (Arabic: يوم، يومان، أيام، يوماً)
const dayWord = (n: number) =>
  !ar.value ? (n === 1 ? t("up.day") : t("up.days")) : n === 1 ? "يوم" : n === 2 ? "يومان" : n <= 10 ? "أيام" : "يوماً";

// the notification: today's first return
const note = computed(() => groups.value.find((g) => g.key === "today")?.items[0] ?? groups.value[0]?.items[0] ?? null);
const noteText = computed(() => {
  const it = note.value;
  if (!it) return "";
  // mid-sentence: "is out today", "starts in 3 days"
  const c = countdown(it.days);
  const when = ar.value ? c : c.charAt(0).toLowerCase() + c.slice(1);
  if (it.kind === "movie") return t(it.days <= 0 ? "up.noteFilmToday" : "up.noteFilm", { title: title(it), when });
  if (it.tag === "premiere") return t("up.notePremiere", { title: title(it), s: fmt(it.season ?? 1), when });
  return t("up.noteEpisode", { title: title(it), se: epLine(it), when });
});

// the rail: arrows scroll it a screen at a time
const rail = ref<HTMLElement | null>(null);
const atStart = ref(true);
const atEnd = ref(false);
function edges() {
  const r = rail.value;
  if (!r) return;
  const x = Math.abs(r.scrollLeft); // negative in RTL
  atStart.value = x < 8;
  atEnd.value = x + r.clientWidth >= r.scrollWidth - 8;
}
function page(dir: 1 | -1) {
  const r = rail.value;
  if (!r) return;
  const rtl = document.documentElement.dir === "rtl";
  r.scrollBy({ left: dir * (rtl ? -1 : 1) * r.clientWidth * 0.8, behavior: "smooth" });
}

const shown = ref(false);
const sec = ref<HTMLElement | null>(null);
let io: IntersectionObserver | null = null;
onMounted(() => {
  edges();
  if (!("IntersectionObserver" in window) || !sec.value) return void (shown.value = true);
  io = new IntersectionObserver(
    ([e]) => {
      if (!e?.isIntersecting) return;
      io?.disconnect();
      setTimeout(() => (shown.value = true), 250);
    },
    { threshold: 0.2 },
  );
  io.observe(sec.value);
});
onBeforeUnmount(() => io?.disconnect());
</script>

<template>
  <section id="upcoming" ref="sec" class="sec up" :class="{ seen: shown }" aria-labelledby="up-h">
    <div class="wrap">
      <div class="up-top">
        <div class="sec-h rv">
          <span class="kick">{{ t("up.kick") }}</span>
          <h2 id="up-h">{{ t("up.titleLine") }}<br><em>{{ t("up.titleEm") }}</em></h2>
          <p>{{ t("up.lede") }}</p>
        </div>
        <!-- a push notification, as the app sends it -->
        <div v-if="note" class="note" :class="{ on: shown }" aria-hidden="true">
          <img src="/images/brand-v6/peek-app-icon.svg" alt="" width="40" height="40">
          <span class="nt">
            <span class="nh"><b>TVTracker</b><small>{{ t("up.now") }}</small></span>
            <span class="nb">{{ noteText }}</span>
          </span>
          <img v-if="note.poster" class="np" :src="note.poster" alt="">
        </div>
      </div>
    </div>

    <div class="rail-w rv">
      <div ref="rail" class="rail" tabindex="0" :aria-label="t('up.railLabel')" @scroll.passive="edges">
        <div v-for="(g, gi) in groups" :key="g.key" class="grp">
          <h3 class="gh">{{ t(`up.groups.${g.key}`) }}<span>{{ fmt(g.items.length) }}</span></h3>
          <ul class="items" role="list">
            <!-- the app's Upcoming card: a floating 2:3 poster on its own blurred poster, the countdown at the end -->
            <li v-for="(it, i) in g.items" :key="`${it.kind}-${it.tmdbId}`" class="uc" :class="{ today: it.days <= 0 }" :style="{ '--i': gi * 2 + i }">
              <span class="bd" :style="it.poster ? { backgroundImage: `url('${it.poster}')` } : undefined" aria-hidden="true" />
              <span class="sc" aria-hidden="true" />
              <span class="po" :style="it.poster ? { backgroundImage: `url('${it.poster}')` } : undefined" aria-hidden="true" />
              <div class="ui">
                <div class="meta">
                  <span>{{ dateLabel(it.date) }}<template v-if="it.provider"> · {{ it.provider }}</template><template v-else-if="it.kind === 'movie'"> · {{ t("up.cinemas") }}</template></span>
                  <span v-if="it.tag" class="ub">{{ t(`up.badge.${it.tag}`) }}</span>
                </div>
                <b class="ut">{{ title(it) }}</b>
                <span class="ep"><span class="code">{{ epLine(it) }}</span></span>
                <span class="us">{{ it.episodeName ? (ar ? it.episodeName.ar : it.episodeName.en) : "" }}</span>
              </div>
              <div class="cdn" :class="{ now: it.days <= 0 }">
                <template v-if="it.days <= 0"><small>{{ t("up.airs") }}</small><b>{{ t("up.today") }}</b></template>
                <template v-else><b>{{ fmt(it.days) }}</b><small>{{ dayWord(it.days) }}</small></template>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <button type="button" class="ra prev" :disabled="atStart" :aria-label="t('up.prev')" @click="page(-1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <button type="button" class="ra next" :disabled="atEnd" :aria-label="t('up.next')" @click="page(1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
    <p class="wrap src">{{ t("up.source") }}</p>
  </section>
</template>

<style scoped>
.up-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:40px;align-items:end}

/* the notification */
.note{display:flex;align-items:center;gap:12px;width:380px;padding:12px 14px 12px 12px;border-radius:22px;background:rgba(var(--glass),.08);box-shadow:inset 0 0 0 1px rgba(var(--glass),.12),0 24px 50px -24px rgba(0,0,0,.7);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);
  opacity:0;transform:translateY(-18px) scale(.96);transition:opacity .6s var(--ease),transform .7s cubic-bezier(.34,1.56,.64,1)}
:root[data-theme="light"] .note{background:#fff;box-shadow:0 0 0 1px rgba(16,18,27,.06),0 24px 50px -24px rgba(16,18,27,.35)}
.note.on{opacity:1;transform:none}
.note > img:first-child{width:40px;height:40px;border-radius:11px;flex:none}
.nt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.nh{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.nh b{font-size:13.5px;font-weight:800;color:var(--heading)}
.nh small{font-size:12px;font-weight:600;color:var(--muted)}
.nb{font-size:14px;line-height:1.35;font-weight:600;color:var(--dim)}
.np{width:34px;height:51px;border-radius:7px;object-fit:cover;flex:none}

/* the rail: full width, lined up with the content on the start side */
.rail-w{position:relative;margin-top:44px}
/* edge to edge: the rail runs the full width of the screen, no inset */
.rail{display:flex;gap:40px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding:6px 16px 24px;scroll-padding-inline:16px}
.rail::-webkit-scrollbar{display:none}
.rail:focus-visible{outline-offset:-4px}
.grp{flex:none;scroll-snap-align:start}
/* the group heading, as in the app: the word, then a quiet count */
.gh{display:flex;align-items:baseline;gap:8px;margin:0 0 14px;font-family:var(--display);font-size:22px;font-weight:800;letter-spacing:-.01em;color:var(--heading)}
:root[lang="ar"] .gh{font-weight:700;letter-spacing:0}
.gh span{font-size:14px;font-weight:700;color:var(--muted);letter-spacing:0;font-variant-numeric:tabular-nums}
.items{list-style:none;margin:0;padding:0;display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,auto);gap:14px}

/* the card */
.uc{position:relative;width:420px;height:140px;display:flex;align-items:center;border-radius:20px;overflow:hidden;isolation:isolate;background:var(--surface);
}
:root[data-theme="light"] .uc{box-shadow:0 1px 2px rgba(20,22,30,.06),0 0 0 1px rgba(16,18,27,.06)}
.uc .bd{position:absolute;inset:-8px -16px;z-index:-2;background:center/cover no-repeat;filter:blur(6px);opacity:.3;transition:opacity .4s,transform 6s ease-out}
.uc .sc{position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(17,18,23,.82),rgba(17,18,23,.62) 26%,rgba(17,18,23,.82))}
:root[data-theme="light"] .uc .sc{background:linear-gradient(90deg,rgba(255,255,255,.42),rgba(255,255,255,.5) 35%,rgba(255,255,255,.62))}
/* light: the same bright, saturated poster blur as the web app's Upcoming cards */
:root[data-theme="light"] .uc .bd{filter:blur(5px) saturate(1.6) brightness(1.2);opacity:.6}
.uc .po{flex:none;width:82px;height:123px;margin-inline-start:9px;border-radius:11px;background:var(--ph) center/cover no-repeat;box-shadow:0 6px 16px rgba(0,0,0,.35);transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
.ui{flex:1;min-width:0;align-self:stretch;display:flex;flex-direction:column;padding:13px 16px 13px 16px}
.meta{display:flex;justify-content:space-between;gap:8px;font-size:11.5px;font-weight:600;color:var(--muted);letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
.meta > span:first-child{overflow:hidden;text-overflow:ellipsis}
:root[lang="ar"] .meta{letter-spacing:0;font-size:12.5px}
.ub{flex:none;color:var(--accent);font-weight:800;letter-spacing:.02em;text-transform:none;font-size:12.5px}
.ut{margin-top:auto;font-family:var(--display);font-size:17px;font-weight:800;line-height:1.22;color:var(--heading);padding-inline-end:88px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
:root[lang="ar"] .ut{font-weight:700}
.ep{margin-top:2px}
.code{font-size:14.5px;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums}
.us{margin-top:1px;padding-inline-end:88px;font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* the countdown */
.cdn{position:absolute;inset-inline-end:18px;bottom:14px;display:flex;flex-direction:column;align-items:flex-end;line-height:1}
.cdn b{font-family:var(--display);font-size:36px;font-weight:800;letter-spacing:-.03em;color:var(--heading);font-variant-numeric:tabular-nums}
.cdn small{margin-top:4px;font-size:12px;font-weight:600;color:var(--muted)}
.cdn.now{flex-direction:column}
.cdn.now small{margin:0 0 4px}
.cdn.now b{font-size:28px;color:var(--accent)}

/* arrows, over the rail's ends */
.ra{position:absolute;top:calc(50% - 22px);z-index:2;width:44px;height:44px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--text);background:rgba(var(--glass),.1);box-shadow:inset 0 0 0 1px rgba(var(--glass),.14);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:opacity .2s,background .2s}
:root[data-theme="light"] .ra{background:rgba(255,255,255,.9)}
.ra svg{width:20px;height:20px}
.ra:disabled{opacity:0;pointer-events:none}
.ra.prev{inset-inline-start:24px}
.ra.next{inset-inline-end:24px}
:root[dir="rtl"] .ra svg{transform:scaleX(-1)}
@media (hover:hover){.ra:hover{background:rgba(var(--glass),.18)}}
.src{margin-top:14px;font-size:12.5px;color:var(--muted)}
@media (max-width:900px){.up-top{grid-template-columns:1fr;gap:28px}.note{width:min(100%,400px)}}
@media (max-width:640px){
.rail{gap:28px}
.uc{width:min(340px,calc(100vw - 2 * var(--gut) - 24px));height:128px}
.uc .po{width:72px;height:108px}
.ut{font-size:15.5px;padding-inline-end:72px}
.us{padding-inline-end:72px}
.cdn b{font-size:30px}
.cdn.now b{font-size:24px}
.ra{display:none}
}
</style>
