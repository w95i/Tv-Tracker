<script setup lang="ts">
import { importTotals, switchApps, switchPosters } from "~/data/landing";

// "Switching?" — a port of the import scene in tvtracker-landing (1).html: posters fly from the old
// apps along amber trails into our phone, which counts up and ends on "All set". Two layouts
// (desktop / phone), mirrored for Arabic. The design drove it with scroll (a pinned section); here it
// plays once, on its own clock, when the scene comes into view. Reduced motion: the finished state.
const { t } = useI18n();
const { links } = useAppConfig();

const box = ref<HTMLElement | null>(null);
const st = ref<HTMLElement | null>(null);

type Box = [number, number, number, number];
// Scene geometry: W × H stage, app cards [x, y, scale], phone [x, y, scale].
// Desktop: the phone in the middle, TV Time + Letterboxd on the left, IMDb + Trakt on the right
// (the right column sits 40px higher, the design's stagger). Phones: the design's 2 × 2 above the phone.
const L = {
  d: {
    W: 1040,
    H: 660,
    a: [
      [0, 60, 1.3],
      [738, 20, 1.3],
      [0, 330, 1.3],
      [738, 290, 1.3],
    ],
    p: [370, 6, 1],
  },
  m: {
    W: 360,
    H: 820,
    a: [
      [0, 0, 0.77],
      [181, 0, 0.77],
      [0, 150, 0.77],
      [181, 150, 0.77],
    ],
    p: [66, 316, 0.76],
  },
};
const PHONE_W = 300; // .ph7's width
const ease = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

let apps: HTMLElement[] = [],
  ph: HTMLElement | null = null,
  fps: HTMLElement[] = [],
  slots: HTMLElement[] = [],
  holes: HTMLElement[] = [];
let trail: SVGSVGElement | null = null,
  paths: SVGPathElement[] = [],
  nums: HTMLElement[] = [],
  pct: HTMLElement | null = null,
  bar: HTMLElement | null = null,
  done: HTMLElement | null = null,
  dslot: HTMLElement | null = null;
let comets: HTMLElement[] = [],
  lastN: number[] = [];
let geo: { a: Box; b: Box }[] | null = null;
let sc = 1;
let raf = 0;
let progress = 0; // 0 = before, 1 = finished
let io: IntersectionObserver | null = null;
let ro: ResizeObserver | null = null;
// The scene's 0→1 played over this long. The posters' own easing and stagger are the design's.
const DURATION = 5200;

const desk = () => matchMedia("(min-width:901px)").matches;
const isRtl = () => document.documentElement.dir === "rtl";

function layout() {
  const s = st.value,
    b = box.value;
  if (!s || !b || !ph || !trail || !dslot) return;
  const M = desk() ? L.d : L.m,
    rtl = isRtl();
  s.style.width = M.W + "px";
  s.style.height = M.H + "px";
  apps.forEach((a, k) => {
    const c = M.a[k]!,
      x = rtl ? M.W - c[0]! - 232 * c[2]! : c[0]!;
    a.style.transform = `translate(${x}px,${c[1]}px) scale(${c[2]})`;
  });
  const px = rtl ? M.W - M.p[0]! - PHONE_W * M.p[2]! : M.p[0]!;
  ph.style.transform = `translate(${px}px,${M.p[1]}px) scale(${M.p[2]})`;
  // the button, in app units (the screen is 402 × 874 drawn 284px wide, inside an 8px frame):
  // 20px in from the sides, its bottom 14px above the 84px tab bar
  const ps = M.p[2]!,
    k = (284 / 402) * ps;
  dslot!.style.transform = `translate(${px + 8 * ps + 20 * k}px,${M.p[1]! + 8 * ps + (874 - 84 - 14 - 56) * k}px) scale(${k})`;
  sc = Math.min(1.12, b.clientWidth / M.W, b.clientHeight / M.H);
  if (!sc) return; // not laid out yet (no size): measuring now would give NaN paths
  s.style.transform = `translate(-50%,-50%) scale(${sc})`;
  s.style.transformOrigin = "50% 50%";
  s.style.left = "50%";
  s.style.top = "50%";
  const sr = s.getBoundingClientRect();
  const f = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    return [
      (r.left - sr.left) / sc,
      (r.top - sr.top) / sc,
      r.width / sc,
      r.height / sc,
    ];
  };
  const P = f(ph);
  trail.setAttribute("width", String(M.W));
  trail.setAttribute("height", String(M.H));
  // A trail leaves the card on the side facing the phone and enters the phone on that side.
  // Desktop has cards on both sides of the phone; on phones (cards above it) the design's rule stays.
  const both = M === L.d;
  paths.forEach((pa, k) => {
    const A = f(apps[k]!);
    const fromLeft = both ? A[0] + A[2] / 2 < P[0] + P[2] / 2 : !rtl;
    const ax = fromLeft ? A[0] + A[2] : A[0],
      ay = A[1] + A[3] / 2,
      bx = fromLeft ? P[0] : P[0] + P[2],
      by = P[1] + P[3] * 0.55;
    const mx = (ax + bx) / 2,
      my = Math.min(ay, by) - 120;
    pa.setAttribute("d", `M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`);
    if (comets[k])
      comets[k].style.offsetPath =
        `path("M${ax} ${ay} Q${mx} ${my} ${bx} ${by}")`;
  });
  geo = fps.map((_, i) => {
    const k = (i / 4) | 0,
      j = i % 4;
    return { a: f(holes[i]!), b: f(slots[j * 4 + k]!) };
  });
}

function scene(p: number) {
  if (!geo) return;
  fps.forEach((el, i) => {
    const k = (i / 4) | 0,
      j = i % 4,
      order = j * 4 + k,
      s0 = 0.05 + order * 0.047,
      t = clamp01((p - s0) / 0.2),
      e = ease(t),
      g = geo![i]!;
    const x = g.a[0] + (g.b[0] - g.a[0]) * e,
      y =
        g.a[1] + (g.b[1] - g.a[1]) * e - Math.sin(Math.PI * e) * (90 + k * 18);
    const s = (g.a[2] + (g.b[2] - g.a[2]) * e) / 44,
      r = Math.sin(Math.PI * e) * (k % 2 ? 10 : -10);
    el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg) scale(${s.toFixed(3)})`;
    el.classList.toggle("air", t > 0 && t < 1);
  });
  apps.forEach((a, k) => {
    const first = 0.05 + k * 0.047,
      last = 0.05 + (12 + k) * 0.047 + 0.2;
    a.classList.toggle("done", p >= last);
    paths[k]!.classList.toggle("on", p > first && p < last);
  });
  const qe = ease(clamp01((p - 0.05) / 0.88));
  const lang = document.documentElement.lang === "ar" ? "ar" : "en";
  [importTotals.shows, importTotals.episodes, importTotals.movies].forEach(
    (v, i) => {
      const n = Math.round(v * qe);
      if (n !== lastN[i]) {
        nums[i]!.textContent = n.toLocaleString(lang);
        lastN[i] = n;
      }
    },
  );
  pct!.textContent = Math.round(qe * 100) + "%";
  bar!.style.setProperty("--k", qe.toFixed(3));
  done!.classList.toggle("on", p > 0.95);
  // finished: the app's confetti over the phone screen
  if (p > 0.95 && !complete.value && raf) {
    const host = ph!.querySelector<HTMLElement>(".scrbox");
    if (host) fireConfetti(host);
  }
  st.value?.classList.toggle("run", p > 0.04 && p < 0.95);
  complete.value = p > 0.95;
}
// the phone's heading turns from "Importing…" to "Import complete" with the button
const complete = ref(false);

// The scene assembles first, then the data starts to move.
function enter(then: () => void) {
  st.value?.classList.add("in");
  then();
}
// "Play it again"
function replay() {
  if (raf) return;
  lastN = [];
  progress = 0;
  complete.value = false;
  ph?.classList.remove("fin");
  scene(0);
  play();
}
// Plays the scene once, from 0 to 1.
function play() {
  const t0 = performance.now();
  const frame = (now: number) => {
    progress = clamp01((now - t0) / DURATION);
    scene(progress);
    raf = progress < 1 ? requestAnimationFrame(frame) : 0;
  };
  raf = requestAnimationFrame(frame);
}
const redraw = () => {
  layout();
  scene(progress);
};

onMounted(() => {
  const s = st.value!;
  apps = [...s.querySelectorAll<HTMLElement>(".app")];
  ph = s.querySelector(".ph7");
  fps = [...s.querySelectorAll<HTMLElement>(".fp")];
  slots = [...s.querySelectorAll<HTMLElement>(".grid7 i")];
  holes = [...s.querySelectorAll<HTMLElement>(".app .th i")];
  trail = s.querySelector(".trail");
  paths = [...s.querySelectorAll<SVGPathElement>(".trail path")];
  nums = [...s.querySelectorAll<HTMLElement>(".ct b")];
  pct = s.querySelector(".pb em");
  bar = s.querySelector(".pb");
  done = s.querySelector(".done7");
  dslot = s.querySelector(".dslot");
  comets = [...s.querySelectorAll<HTMLElement>(".comet")];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still || !("IntersectionObserver" in window)) {
    progress = 1;
    s.classList.add("in");
  }
  addEventListener("resize", redraw);
  // and whenever the scene's box changes size (it can have none for a moment, e.g. while the language switches)
  if ("ResizeObserver" in window) {
    ro = new ResizeObserver(redraw);
    ro.observe(box.value!);
  }
  redraw();
  document.fonts?.ready.then(redraw);
  if (progress === 1) return;
  // Starts once most of the scene is on screen; never again after that.
  io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io?.disconnect();
      io = null;
      enter(play);
    },
    { threshold: 0.45 },
  );
  io.observe(box.value!);
});
onBeforeUnmount(() => {
  removeEventListener("resize", redraw);
  ro?.disconnect();
  io?.disconnect();
  if (raf) cancelAnimationFrame(raf);
});
// Switching language flips the layout (Arabic is mirrored) and the digits. The page's dir/lang attributes
// change a moment after the locale does, so watch them directly, as the design did.
let mo: MutationObserver | null = null;
onMounted(() => {
  mo = new MutationObserver(redraw);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["dir", "lang"],
  });
});
onBeforeUnmount(() => mo?.disconnect());
</script>

<template>
  <section id="import" aria-labelledby="imp-h">
    <!-- the words on top, centred like the other section headers; the scene underneath -->
    <div class="wrap itx rv">
      <span class="kick">{{ t("switching.kick") }}</span>
      <h2 id="imp-h">{{ t("switching.title") }}</h2>
      <p>{{ t("switching.text") }}</p>
      <a class="btn ghost" :href="links.app">
        <span>{{ t("switching.cta") }}</span>
        <svg
          class="ar"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </div>
    <div class="ipin">
      <div class="ist">
        <div class="wrap">
          <div ref="box" class="ibox" aria-hidden="true">
            <div ref="st" class="st7">
              <div v-for="a in switchApps" :key="a.key" class="app">
                <div class="ah">
                  <span
                    class="bd"
                    :style="{ background: a.badge.bg, color: a.badge.fg }"
                  >
                    <img v-if="a.badge.img" :src="a.badge.img" alt="" />
                    <b v-else-if="a.badge.dots"
                      ><u
                        v-for="c in a.badge.dots"
                        :key="c"
                        :style="{ background: c }"
                    /></b>
                    <template v-else>{{ a.badge.text }}</template>
                  </span>
                  <span class="an"
                    ><b>{{ a.name }}</b
                    ><small>{{ t(`switching.apps.${a.key}`) }}</small></span
                  >
                  <span class="ok">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    <span>{{ t("switching.done") }}</span>
                  </span>
                </div>
                <div class="th"><i /><i /><i /><i /></div>
                <div class="rw"><span /><span /></div>
              </div>
              <svg class="trail" style="display: none">
                <path />
                <path />
                <path />
                <path />
              </svg>
              <i v-for="n in 4" :key="`c${n}`" class="comet" />
              <!-- the same phone as the hero's: the app drawn at 402 × 874, scaled into the frame -->
              <div class="ph7">
                <span class="sz" />
                <div class="scrbox">
                  <div class="ui7">
                    <h4>
                      {{
                        complete
                          ? t("switching.phone.complete")
                          : t("switching.phone.title")
                      }}
                    </h4>
                    <p class="su">{{ t("switching.phone.from") }}</p>
                    <div class="ct">
                      <div>
                        <b>0</b><small>{{ t("switching.phone.shows") }}</small>
                      </div>
                      <div>
                        <b>0</b
                        ><small>{{ t("switching.phone.episodes") }}</small>
                      </div>
                      <div>
                        <b>0</b><small>{{ t("switching.phone.movies") }}</small>
                      </div>
                    </div>
                    <div class="pb">
                      <span><i /><u /></span><em>0%</em>
                    </div>
                    <div class="grid7"><i v-for="n in 16" :key="n" /></div>
                    <!-- chrome, as in the hero phone: tab bar and home indicator (no status bar) -->
                    <div class="nav" dir="ltr">
                      <span
                        ><svg
                          viewBox="26.6 0 24 24"
                          fill="none"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke="currentColor"
                          stroke-width="1.7"
                        >
                          <path
                            d="M46.6 7H30.6C29.5 7 28.6 7.9 28.6 9V20C28.6 21.1 29.5 22 30.6 22H46.6C47.7 22 48.6 21.1 48.6 20V9C48.6 7.9 47.7 7 46.6 7Z"
                          />
                          <path d="M43.6 2L38.6 7L33.6 2" /></svg
                      ></span>
                      <span
                        ><svg
                          viewBox="26.6 0 24 24"
                          fill="none"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke="currentColor"
                          stroke-width="1.7"
                        >
                          <path
                            d="M45.6 3H31.6C30.5 3 29.6 3.9 29.6 5V19C29.6 20.1 30.5 21 31.6 21H45.6C46.7 21 47.6 20.1 47.6 19V5C47.6 3.9 46.7 3 45.6 3Z"
                          />
                          <path d="M33.6 3V21" />
                          <path d="M29.6 7.5H33.6" />
                          <path d="M29.6 12H47.6" />
                          <path d="M29.6 16.5H33.6" />
                          <path d="M43.6 3V21" />
                          <path d="M43.6 7.5H47.6" />
                          <path d="M43.6 16.5H47.6" /></svg
                      ></span>
                      <span
                        ><svg
                          viewBox="26.6 0 24 24"
                          fill="none"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke="currentColor"
                          stroke-width="1.7"
                        >
                          <path
                            d="M37.6 19C42.02 19 45.6 15.42 45.6 11C45.6 6.58 42.02 3 37.6 3C33.18 3 29.6 6.58 29.6 11C29.6 15.42 33.18 19 37.6 19Z"
                          />
                          <path d="M47.6 21L43.3 16.7" /></svg
                      ></span>
                      <span><b class="av">K</b></span>
                    </div>
                    <i class="home" />
                  </div>
                </div>
              </div>
              <i
                v-for="src in switchPosters"
                :key="src"
                class="fp"
                :style="{ backgroundImage: `url('${src}')` }"
              />
              <div class="dslot" style="display: none">
                <div class="done7">
                  <span>{{ t("switching.phone.finished") }}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="again"
            :class="{ on: complete }"
            :tabindex="complete ? 0 : -1"
            @click="replay"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            {{ t("switching.replay") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- IMPORT: the old apps hand their data over (tvtracker-landing (1).html) ---------- */
/* The design pinned this section for a scroll-driven scene, with the words beside it. Here it is its
   natural height, the scene plays once, and the words sit on top, centred like the other headers. */
#import {
  padding-top: 40px;
}
.itx {
  text-align: center;
}
.itx .kick {
  justify-content: center;
}
.itx h2 {
  margin: 12px auto 0;
  max-width: 20em;
  font-size: clamp(28px, 3.2vw, 42px);
  line-height: 1.08;
}
.itx p {
  margin: 16px auto 0;
  max-width: 36em;
  font-size: 17px;
  line-height: 1.6;
  color: var(--muted);
}
.itx .btn {
  margin-top: 24px;
}
.ist {
  padding-block: 20px 100px;
}
.ist .wrap {
  width: 100%;
}
.ibox {
  position: relative;
  height: clamp(360px, calc(100svh - 370px), 640px);
}
.st7 {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: 0 0;
  direction: ltr;
}
/* source apps */
.app {
  position: absolute;
  z-index: 1;
  width: 232px;
  padding: 14px;
  border-radius: 18px;
  background: var(--surface);
  box-shadow:
    inset 0 0 0 1px var(--line),
    var(--shadow);
  transform-origin: 0 0;
  transition: opacity 0.4s;
}
.app .ah {
  display: flex;
  align-items: center;
  gap: 10px;
}
.app .bd {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.app .bd img {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
  display: block;
}
.app .bd b {
  display: flex;
  gap: 2px;
}
.app .bd u {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.app .an {
  min-width: 0;
  line-height: 1.2;
}
.app .an b {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: var(--heading);
}
.app .an small {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
}
.app .ok {
  margin-inline-start: auto;
  height: 22px;
  padding: 0 7px;
  border-radius: 7px;
  display: none;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 800;
  color: var(--ink);
  background: var(--amber);
}
.app .ok svg {
  width: 11px;
  height: 11px;
}
.app.done {
  opacity: 0.55;
}
.app.done .ok {
  display: inline-flex;
}
.app .th {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.app .th i {
  flex: none;
  width: 44px;
  height: 66px;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1.5px rgba(var(--glass), 0.14);
}
.app .rw {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
}
.app .rw span {
  display: block;
  height: 6px;
  border-radius: 3px;
  background: rgba(var(--glass), 0.09);
}
.app .rw span:nth-child(1) {
  width: 86%;
}
.app .rw span:nth-child(2) {
  width: 64%;
}
/* our phone, filling up: the hero phone's frame (PosterFan .ph9) and screen (PhoneTitleScreen .scr) */
.ph7 {
  position: absolute;
  z-index: 2;
  width: 300px;
  padding: 8px;
  border-radius: 50px;
  background: #0e0f14;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.14),
    0 40px 80px -30px rgba(0, 0, 0, 0.9);
  transform-origin: 0 0;
}
:root[data-theme="light"] .ph7 {
  box-shadow: 0 40px 80px -34px rgba(16, 18, 27, 0.5);
}
.ph7 .sz {
  display: block;
  width: 100%;
  aspect-ratio: 402/874;
  border-radius: 42px;
}
.scrbox {
  position: absolute;
  inset: 8px;
  border-radius: 42px;
  overflow: hidden;
  background: #000;
}
:root[data-theme="light"] .scrbox {
  background: #f5f5f7;
}
/* the screen at the app's own size, 402 × 874, scaled to the 284px screen */
.ui7 {
  --bg: #000;
  --heading: #f4f6ff;
  --txt: #f4f5f8;
  --muted: #9aa3bd;
  --acc: #ffc42e;
  --cell: rgba(255, 255, 255, 0.07);
  --slot: rgba(255, 255, 255, 0.1);
  --line: rgba(255, 255, 255, 0.08);
  position: relative;
  width: 402px;
  height: 874px;
  padding: 40px 20px 0;
  overflow: hidden;
  background: var(--bg);
  color: var(--txt);
  direction: ltr;
  transform: scale(calc(284 / 402));
  transform-origin: 0 0;
}
:root[data-theme="light"] .ui7 {
  --bg: #f5f5f7;
  --heading: #0e0f14;
  --txt: #15161c;
  --muted: #5e6476;
  --acc: #8a5d00;
  --cell: #fff;
  --slot: rgba(16, 18, 27, 0.12);
  --line: rgba(16, 18, 27, 0.08);
}
:root[dir="rtl"] .ui7 {
  direction: rtl;
}
.ui7 h4 {
  margin: 0;
  font-family: var(--display);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--heading);
  letter-spacing: -0.015em;
}
:root[lang="ar"] .ui7 h4 {
  font-weight: 700;
  letter-spacing: 0;
}
.ui7 .su {
  margin: 4px 0 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--muted);
}
.ct {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 14px;
}
.ct div {
  padding: 12px;
  border-radius: 14px;
  background: var(--cell);
}
:root[data-theme="light"] .ct div {
  box-shadow:
    0 1px 2px rgba(20, 22, 30, 0.06),
    0 0 0 1px rgba(16, 18, 27, 0.08);
}
.ct b {
  display: block;
  font-family: var(--display);
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--heading);
  font-variant-numeric: tabular-nums;
}
.ct small {
  display: block;
  margin-top: 3px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}
.pb {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  font-size: 14px;
  font-weight: 800;
  color: var(--acc);
  font-variant-numeric: tabular-nums;
}
.pb em {
  font-style: normal;
}
.pb span {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--slot);
  overflow: hidden;
}
.pb span i {
  display: block;
  height: 100%;
  width: 100%;
  border-radius: 4px;
  background: #ffc42e;
  transform-origin: left;
  transform: scaleX(var(--k, 0));
}
:root[dir="rtl"] .pb span i {
  transform-origin: right;
}
.grid7 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 14px;
}
.grid7 i {
  aspect-ratio: 2/3;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1.5px var(--slot);
}
/* the hero phone's chrome */
.sbar {
  position: absolute;
  z-index: 30;
  inset: 0 0 auto;
  height: 56px;
  color: var(--txt);
  font-size: 17px;
  font-weight: 600;
  font-family: "Figtree", system-ui, sans-serif;
}
.sbar svg {
  display: block;
}
.tm {
  position: absolute;
  left: 48px;
  top: 18px;
  line-height: 20px;
}
.cam {
  position: absolute;
  left: 139px;
  top: 11px;
  width: 124px;
  height: 36px;
  border-radius: 20px;
  background: #000;
}
.ic {
  position: absolute;
  right: 30px;
  top: 22px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav {
  position: absolute;
  z-index: 25;
  inset: auto 0 0;
  height: 84px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 0 8px 34px;
  background: var(--bg);
  border-top: 1px solid var(--line);
  color: var(--txt);
}
.nav span {
  display: grid;
  place-items: center;
  height: 50px;
}
.nav svg {
  width: 26px;
  height: 26px;
}
.av {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #ffc42e;
  color: #1c1400;
  font-size: 12px;
  font-weight: 800;
}
.home {
  position: absolute;
  z-index: 26;
  left: 134px;
  bottom: 8px;
  width: 134px;
  height: 5px;
  border-radius: 3px;
  background: var(--txt);
}
/* the button floats over the last row of posters, just above the tab bar (app units, scaled like the screen) */
.dslot {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 6;
  width: 362px;
  transform-origin: 0 0;
  pointer-events: none;
}
:root[dir="rtl"] .dslot {
  direction: rtl;
}
.done7 {
  height: 56px;
  box-shadow: 0 16px 34px -10px rgba(0, 0, 0, 0.65);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #ffc42e;
  color: #1c1400;
  font-size: 19px;
  font-weight: 800;
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity 0.4s var(--ease),
    transform 0.5s var(--ease);
}
.done7 svg {
  width: 22px;
  height: 22px;
}
.done7.on {
  opacity: 1;
  transform: none;
}
/* the data itself */
.fp {
  position: absolute;
  left: 0;
  top: 0;
  width: 44px;
  height: 66px;
  border-radius: 7px;
  background: var(--ph) center/cover no-repeat;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transform-origin: 0 0;
  will-change: transform;
  z-index: 5;
}
.fp.air {
  box-shadow: 0 22px 34px -10px rgba(0, 0, 0, 0.6);
}
.trail {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  pointer-events: none;
  overflow: visible;
}
.trail path {
  fill: none;
  stroke: var(--amber);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 2 10;
  opacity: 0;
  transition: opacity 0.45s var(--ease);
  animation: flow 1s linear infinite;
}
.trail path.on {
  opacity: 0.55;
}
@keyframes flow {
  to {
    stroke-dashoffset: -24;
  }
}
@media (max-width: 900px) {
  .ist {
    padding-block: 16px 70px;
  }
  .ibox {
    height: min(calc(100svh - 90px), 820px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .trail {
    display: none;
  }
}

/* calm: the posters travel to the phone, nothing else moves */
.comet,
.trail,
.dslot {
  display: none;
}
/* replay */
.again {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px auto 0;
  height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: var(--dim);
  background: rgba(var(--glass), 0.07);
  box-shadow: inset 0 0 0 1px rgba(var(--glass), 0.12);
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition:
    opacity 0.4s var(--ease) 0.6s,
    transform 0.5s var(--ease) 0.6s,
    background 0.2s;
}
.again.on {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
.again svg {
  width: 16px;
  height: 16px;
}
@media (hover: hover) {
  .again:hover {
    background: rgba(var(--glass), 0.12);
  }
}
@media (prefers-reduced-motion: reduce) {
  .app,
  .ph7,
  .fp {
    opacity: 1;
    translate: none;
    scale: none;
  }
  .comet {
    display: none;
  }
}
</style>
