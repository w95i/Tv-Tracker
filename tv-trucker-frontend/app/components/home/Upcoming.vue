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
const epLine = (it: UpcomingItem) => (it.season ? t("up.se", { s: fmt(it.season), e: fmt(it.episode ?? 1) }) : t("up.film"));

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
      setTimeout(() => (shown.value = true), 700);
    },
    { threshold: 0.35 },
  );
  io.observe(sec.value);
});
onBeforeUnmount(() => io?.disconnect());
</script>

<template>
  <section id="upcoming" ref="sec" class="sec up" aria-labelledby="up-h">
    <div class="wrap">
      <div class="up-top">
        <div class="sec-h rv">
          <span class="kick">{{ t("up.kick") }}</span>
          <h2 id="up-h">{{ t("up.titleLine") }}<br><em>{{ t("up.titleEm") }}</em></h2>
          <p>{{ t("up.lede") }}</p>
        </div>
        <!-- a push notification, as the app sends it -->
        <div v-if="note" class="note" :class="{ on: shown }" aria-hidden="true">
          <img src="/images/brand/peek-icon.svg" alt="" width="40" height="40">
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
        <div v-for="g in groups" :key="g.key" class="grp">
          <p class="gh"><i aria-hidden="true" />{{ t(`up.groups.${g.key}`) }}<span>{{ fmt(g.items.length) }}</span></p>
          <ul class="items" role="list">
            <li v-for="it in g.items" :key="`${it.kind}-${it.tmdbId}`" class="it">
              <div class="po" :style="it.poster ? { backgroundImage: `url('${it.poster}')` } : undefined">
                <span class="cd" :class="{ now: it.days <= 0 }">{{ countdown(it.days) }}</span>
                <span v-if="it.tag" class="tag">{{ t(`up.tags.${it.tag}`) }}</span>
              </div>
              <b class="tt">{{ title(it) }}</b>
              <span class="ln">{{ epLine(it) }}<template v-if="it.episodeName"> · {{ ar ? it.episodeName.ar : it.episodeName.en }}</template></span>
              <span class="ft">
                <span class="dt">{{ dateLabel(it.date) }}</span>
                <span v-if="it.provider" class="pv">{{ it.provider }}</span>
                <span v-else-if="it.kind === 'movie'" class="pv cin">{{ t("up.cinemas") }}</span>
              </span>
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
.rail{display:flex;gap:44px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding:6px max(var(--gut),calc((100vw - 1240px)/2 + var(--gut))) 18px;scroll-padding-inline:max(var(--gut),calc((100vw - 1240px)/2 + var(--gut)))}
.rail::-webkit-scrollbar{display:none}
.rail:focus-visible{outline-offset:-4px}
.grp{flex:none;scroll-snap-align:start}
/* the group label sits on a timeline */
.gh{position:relative;display:flex;align-items:center;gap:10px;padding-bottom:18px;margin-bottom:18px;font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--heading)}
:root[lang="ar"] .gh{letter-spacing:0;font-size:14px}
.gh::after{content:"";position:absolute;inset-inline:0 -44px;bottom:0;height:2px;background:var(--line)}
.gh i{position:absolute;inset-inline-start:0;bottom:-5px;z-index:1;width:12px;height:12px;border-radius:50%;background:var(--amber);box-shadow:0 0 0 4px var(--bg)}
.gh span{height:22px;min-width:22px;padding:0 7px;border-radius:7px;display:grid;place-items:center;font-size:12px;letter-spacing:0;color:var(--muted);background:rgba(var(--glass),.08)}
.items{list-style:none;margin:0;padding:0;display:flex;gap:16px}
.it{width:176px;display:flex;flex-direction:column;gap:4px}
.po{position:relative;aspect-ratio:2/3;margin-bottom:8px;border-radius:14px;background:var(--ph) center/cover no-repeat;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 20px 36px -20px rgba(0,0,0,.7);transition:transform .35s var(--ease)}
@media (hover:hover){.it:hover .po{transform:translateY(-4px)}}
.cd{position:absolute;top:10px;inset-inline-start:10px;height:26px;padding:0 9px;border-radius:8px;display:grid;place-items:center;font-size:12px;font-weight:800;letter-spacing:.03em;color:#fff;background:rgba(10,10,14,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);text-transform:uppercase}
:root[lang="ar"] .cd{letter-spacing:0}
.cd.now{color:#1c1400;background:#ffc42e}
.tag{position:absolute;bottom:10px;inset-inline-start:10px;height:22px;padding:0 8px;border-radius:7px;display:grid;place-items:center;font-size:11px;font-weight:900;letter-spacing:.08em;color:#1c1400;background:#fff}
:root[lang="ar"] .tag{letter-spacing:0}
.tt{font-size:15.5px;font-weight:800;color:var(--heading);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ln{font-size:13px;font-weight:600;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ft{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px}
.dt{font-size:12.5px;font-weight:700;color:var(--dim)}
.pv{height:22px;padding:0 8px;border-radius:7px;display:grid;place-items:center;font-size:11.5px;font-weight:800;color:var(--dim);background:rgba(var(--glass),.08);white-space:nowrap}
.pv.cin{color:var(--accent);background:rgba(255,196,46,.12)}

/* arrows, over the rail's ends */
.ra{position:absolute;top:calc(50% - 22px);z-index:2;width:44px;height:44px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--text);background:rgba(var(--glass),.1);box-shadow:inset 0 0 0 1px rgba(var(--glass),.14);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:opacity .2s,background .2s}
:root[data-theme="light"] .ra{background:rgba(255,255,255,.9)}
.ra svg{width:20px;height:20px}
.ra:disabled{opacity:0;pointer-events:none}
.ra.prev{inset-inline-start:max(10px,calc((100vw - 1240px)/2 - 10px))}
.ra.next{inset-inline-end:max(10px,calc((100vw - 1240px)/2 - 10px))}
:root[dir="rtl"] .ra svg{transform:scaleX(-1)}
@media (hover:hover){.ra:hover{background:rgba(var(--glass),.18)}}
.src{margin-top:14px;font-size:12.5px;color:var(--muted)}

@media (max-width:900px){.up-top{grid-template-columns:1fr;gap:28px}.note{width:min(100%,400px)}}
@media (max-width:640px){
  .rail{gap:30px}
  .gh::after{inset-inline-end:-30px}
  .it{width:142px}
  .ra{display:none}
}
</style>
