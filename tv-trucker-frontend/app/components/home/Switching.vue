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
  d: { W: 960, H: 600, a: [[0, 70, 1], [728, 30, 1], [0, 300, 1], [728, 260, 1]], p: [349, 6, 1] },
  m: { W: 360, H: 760, a: [[0, 0, 0.74], [188, 0, 0.74], [0, 140, 0.74], [188, 140, 0.74]], p: [80, 300, 0.76] },
};
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

let apps: HTMLElement[] = [], ph: HTMLElement | null = null, fps: HTMLElement[] = [], slots: HTMLElement[] = [], holes: HTMLElement[] = [];
let trail: SVGSVGElement | null = null, paths: SVGPathElement[] = [], nums: HTMLElement[] = [], pct: HTMLElement | null = null, bar: HTMLElement | null = null, done: HTMLElement | null = null;
let geo: { a: Box; b: Box }[] | null = null;
let sc = 1;
let raf = 0;
let progress = 0; // 0 = before, 1 = finished
let io: IntersectionObserver | null = null;
// The scene's 0→1 played over this long. The posters' own easing and stagger are the design's.
const DURATION = 5200;

const desk = () => matchMedia("(min-width:901px)").matches;
const isRtl = () => document.documentElement.dir === "rtl";

function layout() {
  const s = st.value, b = box.value;
  if (!s || !b || !ph || !trail) return;
  const M = desk() ? L.d : L.m, rtl = isRtl();
  s.style.width = M.W + "px";
  s.style.height = M.H + "px";
  apps.forEach((a, k) => {
    const c = M.a[k]!, x = rtl ? M.W - c[0]! - 232 * c[2]! : c[0]!;
    a.style.transform = `translate(${x}px,${c[1]}px) scale(${c[2]})`;
  });
  const px = rtl ? M.W - M.p[0]! - 262 * M.p[2]! : M.p[0]!;
  ph.style.transform = `translate(${px}px,${M.p[1]}px) scale(${M.p[2]})`;
  sc = Math.min(1.12, b.clientWidth / M.W, b.clientHeight / M.H);
  s.style.transform = `translate(-50%,-50%) scale(${sc})`;
  s.style.transformOrigin = "50% 50%";
  s.style.left = "50%";
  s.style.top = "50%";
  const sr = s.getBoundingClientRect();
  const f = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    return [(r.left - sr.left) / sc, (r.top - sr.top) / sc, r.width / sc, r.height / sc];
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
    const ax = fromLeft ? A[0] + A[2] : A[0], ay = A[1] + A[3] / 2, bx = fromLeft ? P[0] : P[0] + P[2], by = P[1] + P[3] * 0.55;
    const mx = (ax + bx) / 2, my = Math.min(ay, by) - 120;
    pa.setAttribute("d", `M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`);
  });
  geo = fps.map((_, i) => {
    const k = (i / 4) | 0, j = i % 4;
    return { a: f(holes[i]!), b: f(slots[j * 4 + k]!) };
  });
}

function scene(p: number) {
  if (!geo) return;
  fps.forEach((el, i) => {
    const k = (i / 4) | 0, j = i % 4, order = j * 4 + k, s0 = 0.05 + order * 0.047, t = clamp01((p - s0) / 0.2), e = ease(t), g = geo![i]!;
    const x = g.a[0] + (g.b[0] - g.a[0]) * e, y = g.a[1] + (g.b[1] - g.a[1]) * e - Math.sin(Math.PI * e) * (90 + k * 18);
    const s = (g.a[2] + (g.b[2] - g.a[2]) * e) / 44, r = Math.sin(Math.PI * e) * (k % 2 ? 10 : -10);
    el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg) scale(${s.toFixed(3)})`;
    el.classList.toggle("air", t > 0 && t < 1);
  });
  apps.forEach((a, k) => {
    const first = 0.05 + k * 0.047, last = 0.05 + (12 + k) * 0.047 + 0.2;
    a.classList.toggle("done", p >= last);
    paths[k]!.classList.toggle("on", p > first && p < last);
  });
  const qe = ease(clamp01((p - 0.05) / 0.88));
  const lang = document.documentElement.lang === "ar" ? "ar" : "en";
  [importTotals.shows, importTotals.episodes, importTotals.movies].forEach((v, i) => {
    nums[i]!.textContent = Math.round(v * qe).toLocaleString(lang);
  });
  pct!.textContent = Math.round(qe * 100) + "%";
  bar!.style.setProperty("--k", qe.toFixed(3));
  done!.classList.toggle("on", p > 0.95);
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
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still || !("IntersectionObserver" in window)) progress = 1;
  addEventListener("resize", redraw);
  redraw();
  document.fonts?.ready.then(redraw);
  if (progress === 1) return;
  // Starts once most of the scene is on screen; never again after that.
  io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io?.disconnect();
      io = null;
      play();
    },
    { threshold: 0.45 },
  );
  io.observe(box.value!);
});
onBeforeUnmount(() => {
  removeEventListener("resize", redraw);
  io?.disconnect();
  if (raf) cancelAnimationFrame(raf);
});
// Switching language flips the layout (Arabic is mirrored) and the digits. The page's dir/lang attributes
// change a moment after the locale does, so watch them directly, as the design did.
let mo: MutationObserver | null = null;
onMounted(() => {
  mo = new MutationObserver(redraw);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["dir", "lang"] });
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
        <svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </a>
    </div>
    <div class="ipin">
      <div class="ist">
        <div class="wrap">
          <div ref="box" class="ibox" aria-hidden="true">
            <div ref="st" class="st7">
              <div v-for="a in switchApps" :key="a.key" class="app">
                <div class="ah">
                  <span class="bd" :style="{ background: a.badge.bg, color: a.badge.fg }">
                    <b v-if="a.badge.dots"><u v-for="c in a.badge.dots" :key="c" :style="{ background: c }" /></b>
                    <template v-else>{{ a.badge.text }}</template>
                  </span>
                  <span class="an"><b>{{ a.name }}</b><small>{{ t(`switching.apps.${a.key}`) }}</small></span>
                  <span class="ok">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    <span>{{ t("switching.done") }}</span>
                  </span>
                </div>
                <div class="th"><i /><i /><i /><i /></div>
                <div class="rw"><span /><span /></div>
              </div>
              <svg class="trail"><path /><path /><path /><path /></svg>
              <div class="ph7">
                <div class="ui7">
                  <span class="sb">9:41</span><span class="isl" />
                  <h4>{{ t("switching.phone.title") }}</h4>
                  <p class="su">{{ t("switching.phone.from") }}</p>
                  <div class="ct">
                    <div><b>0</b><small>{{ t("switching.phone.shows") }}</small></div>
                    <div><b>0</b><small>{{ t("switching.phone.episodes") }}</small></div>
                    <div><b>0</b><small>{{ t("switching.phone.movies") }}</small></div>
                  </div>
                  <div class="pb"><span><i /></span><em>0%</em></div>
                  <div class="grid7"><i v-for="n in 16" :key="n" /></div>
                  <div class="done7">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    <span>{{ t("switching.phone.finished") }}</span>
                  </div>
                </div>
              </div>
              <i v-for="src in switchPosters" :key="src" class="fp" :style="{ backgroundImage: `url('${src}')` }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ---------- IMPORT: the old apps hand their data over (tvtracker-landing (1).html) ---------- */
/* The design pinned this section for a scroll-driven scene, with the words beside it. Here it is its
   natural height, the scene plays once, and the words sit on top, centred like the other headers. */
#import{padding-top:40px}
.itx{text-align:center}
.itx .kick{justify-content:center}
.itx h2{margin:12px auto 0;max-width:16em;font-size:clamp(28px,3.2vw,42px);line-height:1.08}
.itx p{margin:16px auto 0;max-width:36em;font-size:17px;line-height:1.6;color:var(--muted)}
.itx .btn{margin-top:24px}
.ist{padding-block:24px 100px}
.ist .wrap{width:100%}
.ibox{position:relative;height:min(calc(100svh - 120px),640px);min-height:420px}
.st7{position:absolute;left:50%;top:50%;transform-origin:0 0;direction:ltr}
/* source apps */
.app{position:absolute;z-index:1;width:232px;padding:14px;border-radius:18px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow);transform-origin:0 0;transition:opacity .4s}
.app .ah{display:flex;align-items:center;gap:10px}
.app .bd{flex:none;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;font-size:11px;font-weight:900;letter-spacing:-.02em}
.app .bd b{display:flex;gap:2px}.app .bd u{display:block;width:6px;height:6px;border-radius:50%}
.app .an{min-width:0;line-height:1.2}
.app .an b{display:block;font-size:14px;font-weight:800;color:var(--heading)}
.app .an small{display:block;margin-top:2px;font-size:11.5px;font-weight:600;color:var(--muted);white-space:nowrap}
.app .ok{margin-inline-start:auto;height:22px;padding:0 7px;border-radius:7px;display:none;align-items:center;gap:4px;font-size:11px;font-weight:800;color:var(--ink);background:var(--amber)}
.app .ok svg{width:11px;height:11px}
.app.done{opacity:.55}.app.done .ok{display:inline-flex}
.app .th{display:flex;gap:8px;margin-top:12px}
.app .th i{flex:none;width:44px;height:66px;border-radius:7px;box-shadow:inset 0 0 0 1.5px rgba(var(--glass),.14)}
.app .rw{display:flex;flex-direction:column;gap:6px;margin-top:12px}
.app .rw span{display:block;height:6px;border-radius:3px;background:rgba(var(--glass),.09)}
.app .rw span:nth-child(1){width:86%}.app .rw span:nth-child(2){width:64%}
/* our phone, filling up */
.ph7{position:absolute;z-index:2;width:262px;padding:8px;border-radius:44px;background:#0e0f14;box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 50px 90px -30px rgba(0,0,0,.9);transform-origin:0 0}
:root[data-theme="light"] .ph7{box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 50px 90px -34px rgba(16,18,27,.45)}
.ui7{position:relative;height:552px;border-radius:37px;overflow:hidden;background:var(--bg);color:var(--text);padding:46px 16px 16px;direction:ltr}
:root[dir="rtl"] .ui7{direction:rtl}
.ui7 .sb{position:absolute;top:13px;left:26px;font-size:12px;font-weight:800}
.ui7 .isl{position:absolute;top:10px;left:50%;width:84px;height:24px;margin-left:-42px;border-radius:14px;background:#000}
:root[data-theme="light"] .ui7 .isl{background:#0e0f14}
.ui7 h4{margin:0;font-family:var(--display);font-size:18px;font-weight:800;color:var(--heading);letter-spacing:-.01em}
:root[lang="ar"] .ui7 h4{font-weight:700;letter-spacing:0}
.ui7 .su{margin-top:3px;font-size:11px;font-weight:600;color:var(--muted)}
.ct{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:14px}
.ct div{padding:9px 8px;border-radius:11px;background:rgba(var(--glass),.06)}
.ct b{display:block;font-family:var(--display);font-size:19px;font-weight:800;line-height:1.1;color:var(--heading);font-variant-numeric:tabular-nums}
.ct small{display:block;margin-top:2px;font-size:10px;font-weight:700;color:var(--muted)}
.pb{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:11px;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums}
.pb em{font-style:normal}
.pb span{flex:1;height:6px;border-radius:3px;background:rgba(var(--glass),.1);overflow:hidden}
.pb span i{display:block;height:100%;width:100%;border-radius:3px;background:var(--amber);transform-origin:left;transform:scaleX(var(--k,0))}
:root[dir="rtl"] .pb span i{transform-origin:right}
.grid7{display:grid;grid-template-columns:repeat(4,50px);gap:6px;margin-top:14px;justify-content:center}
.grid7 i{width:50px;height:75px;border-radius:7px;box-shadow:inset 0 0 0 1.5px rgba(var(--glass),.1);background:rgba(var(--glass),.03)}
.done7{position:absolute;left:16px;right:16px;bottom:16px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--amber);color:var(--ink);font-size:14px;font-weight:800;opacity:0;transform:translateY(14px);transition:opacity .4s var(--ease),transform .5s var(--ease)}
.done7 svg{width:18px;height:18px}
.done7.on{opacity:1;transform:none}
/* the data itself */
.fp{position:absolute;left:0;top:0;width:44px;height:66px;border-radius:7px;background:var(--ph) center/cover no-repeat;box-shadow:0 2px 6px rgba(0,0,0,.25);transform-origin:0 0;will-change:transform;z-index:5}
.fp.air{box-shadow:0 22px 34px -10px rgba(0,0,0,.6)}
.trail{position:absolute;left:0;top:0;z-index:0;pointer-events:none;overflow:visible}
.trail path{fill:none;stroke:var(--amber);stroke-width:2;stroke-linecap:round;stroke-dasharray:2 10;opacity:0;transition:opacity .45s var(--ease);animation:flow 1s linear infinite}
.trail path.on{opacity:.55}
@keyframes flow{to{stroke-dashoffset:-24}}

@media (max-width:900px){
  .ist{padding-block:16px 70px}
  .ibox{height:min(calc(100svh - 90px),820px)}
}
@media (prefers-reduced-motion:reduce){.trail{display:none}}
</style>
