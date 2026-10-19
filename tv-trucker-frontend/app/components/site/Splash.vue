<script setup lang="ts">
// The intro, once per browser session (first open of a tab, not on reload). Timeline (ms):
//  0–2700     a montage of the library: one hero per frame (public/images/hero), cut faster and faster, in amber
//  2700       the name zooms in, huge, with the montage still playing inside its letters
//  3950       the letters take the wordmark's own colours; Peek rises (4050), glances, blinks; the slogan (4300)
//  4300       the black room opens onto the page underneath (the hero's poster wall, under its own veil)
//  6400       the mark and the name fly into the header logo, then the page's content rises
// Only transform and opacity animate (the montage is drawn on canvas). Skip / Esc end it; reduced motion: no intro.
const { t } = useI18n();
const { active } = useSplash();

const SEEN_KEY = "tvt_splash"; // sessionStorage: this tab has seen the intro
const FLIP = 190;
const OUT_AT = 6400; // ms: the logo flies to the header
const END = OUT_AT + 950;

// the montage's stills, each cropped so the hero sits on the centre line: 1600px wide in /images/hero,
// 800px in /images/hero-sm for phones (the canvas is never wider than the screen × 2)
const HERO = ["01-peaky-blinders", "02-logan", "04-empire-strikes-back", "05-the-dark-knight", "06-the-mandalorian", "07-dune-part-two", "08-joker", "09-gladiator", "10-john-wick", "11-the-batman", "12-wednesday", "13-breaking-bad", "14-oppenheimer", "15-raiders", "16-iron-man", "17-interstellar", "18-top-gun-maverick", "19-pirates", "20-the-godfather", "21-the-last-of-us", "22-house-of-the-dragon", "23-terminator-2", "24-lotr-rotk", "25-mad-max-fury-road", "26-blade-runner-2049", "27-squid-game", "28-no-country", "29-taxi-driver", "30-sherlock", "31-severance", "32-batman-begins", "33-black-panther", "34-andor", "35-shogun", "36-better-call-saul", "37-vikings", "38-thor-ragnarok", "39-cap-winter-soldier", "40-avatar", "42-harry-potter-dh2", "44-stranger-things"];

const leaving = ref(false);
let fallback: ReturnType<typeof setTimeout> | undefined;

function done() {
  active.value = false;
}
function skip() {
  if (leaving.value) return;
  leaving.value = true;
  setTimeout(done, 300);
}
const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
let flyT: ReturnType<typeof setTimeout> | undefined, openT: ReturnType<typeof setTimeout> | undefined, mraf = 0;

// ---- the montage: cut faster and faster ----
//  0–2.7s full screen · 2.7s the name zooms in with the cuts still running inside its letters ·
//  3.95s the letters take the wordmark's own colours
const T1 = 2700, TW = 3950, MEND = 4400;
interface Clip { t: number; d: number; im: HTMLImageElement; dir: number }
let clips: Clip[] = [];
function buildClips() {
  // The head script (below) has already shuffled the stills and started the first few, when the intro is
  // going to play; pick those up so nothing is fetched twice.
  const early = (window as unknown as { __splash?: { dir: string; order: string[]; imgs: HTMLImageElement[] } }).__splash;
  const dir = early?.dir ?? (innerWidth * Math.min(2, devicePixelRatio || 1) <= 1100 ? "hero-sm" : "hero");
  const order = early?.order ?? shuffle(HERO.slice());
  const imgs = order.map((n, k) => {
    if (early?.imgs[k]) return early.imgs[k]!;
    const im = new Image();
    im.decoding = "async";
    im.src = `/images/${dir}/${n}.jpg`;
    return im;
  });
  clips = [];
  let t0 = 0, d = 430, i = 0;
  while (t0 < MEND) {
    clips.push({ t: t0, d, im: imgs[i % imgs.length]!, dir: i % 2 });
    t0 += d;
    d = Math.max(58, d * 0.86);
    i++;
  }
}
// a new order on every visit (Fisher–Yates)
function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
const at = (time: number) => {
  let i = 0;
  while (i < clips.length - 1 && clips[i + 1]!.t <= time) i++;
  return i;
};
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
let grain: HTMLCanvasElement | null = null;

function cover(g: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number, z: number) {
  if (!im.complete || !im.naturalWidth) return false;
  const iw = im.naturalWidth, ih = im.naturalHeight, cov = Math.max(w / iw, h / ih);
  // pulled back: the whole frame shows on wide screens; on tall screens it is not blown up past ~1.7× the width,
  // and a soft, dark copy of the same still fills above and below
  const s = Math.min(cov, Math.max((w / iw) * 1.7, w / iw)) * z, dw = iw * s, dh = ih * s;
  if (dh < h - 1 || dw < w - 1) {
    g.save();
    g.filter = "blur(28px) brightness(.45)";
    g.drawImage(im, x + (w - iw * cov * 1.1) / 2, y + (h - ih * cov * 1.1) / 2, iw * cov * 1.1, ih * cov * 1.1);
    g.restore();
  }
  g.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  return true;
}
// one frame of the film into g, over the screen rect (0,0,W,H), offset by (ox,oy), k canvas px per screen px
function film(g: CanvasRenderingContext2D, time: number, W: number, H: number, ox: number, oy: number, k: number) {
  const i = at(time), c = clips[i]!, z = 1 + ((time - c.t) / 1000) * 0.025;
  g.fillStyle = "#000";
  g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  const X = -ox * k, Y = -oy * k, w = W * k, h = H * k;
  const fd = Math.min(170, c.d * 0.55), fp = (time - c.t) / fd;
  if (i > 0 && c.d >= 90 && fp < 1) {
    // the new still swings in over the last one
    const pr = clips[i - 1]!;
    cover(g, pr.im, X, Y, w, h, 1 + ((time - pr.t) / 1000) * 0.025);
    const e = eio(clamp(fp));
    g.save();
    g.translate(c.dir ? X : X + w * (1 - e), Y);
    g.transform(e, c.dir ? -0.12 * (1 - e) : 0.12 * (1 - e), 0, 1, 0, 0);
    g.translate(-X, -Y);
    cover(g, c.im, X, Y, w, h, z);
    g.fillStyle = `rgba(0,0,0,${(1 - e) * 0.6})`;
    g.fillRect(X, Y, w, h);
    g.restore();
  } else cover(g, c.im, X, Y, w, h, z);
  // the brand's amber over every frame: black-and-amber, like the app's own tint
  {
    const CW = g.canvas.width, CH = g.canvas.height;
    g.save();
    g.globalCompositeOperation = "saturation";
    g.fillStyle = "rgba(128,128,128,.85)";
    g.fillRect(0, 0, CW, CH);
    g.globalCompositeOperation = "multiply";
    g.fillStyle = "#ffc42e";
    g.fillRect(0, 0, CW, CH);
    g.globalCompositeOperation = "soft-light";
    g.fillStyle = "rgba(255,213,77,.35)";
    g.fillRect(0, 0, CW, CH);
    g.restore();
  }
  const vg = g.createRadialGradient(X + w / 2, Y + h / 2, h * 0.35, X + w / 2, Y + h / 2, Math.max(w, h) * 0.62);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,.6)");
  g.fillStyle = vg;
  g.fillRect(X, Y, w, h);
  if (grain) {
    g.save();
    g.globalAlpha = 0.06;
    g.translate(-Math.random() * 160, -Math.random() * 160);
    g.fillStyle = g.createPattern(grain, "repeat")!;
    g.fillRect(0, 0, g.canvas.width + 160, g.canvas.height + 160);
    g.restore();
  }
  if (time < 260) {
    g.fillStyle = `rgba(0,0,0,${1 - time / 260})`;
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  }
}
function runMontage(el: HTMLElement) {
  const mc = el.querySelector<HTMLCanvasElement>(".mont"), wc = el.querySelector<HTMLCanvasElement>(".wcv");
  if (!mc || !wc) return;
  grain = document.createElement("canvas");
  grain.width = grain.height = 160;
  {
    const gg = grain.getContext("2d")!, d = gg.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    gg.putImageData(d, 0, 0);
  }
  const dpr = Math.min(2, devicePixelRatio || 1), mg = mc.getContext("2d")!, wg = wc.getContext("2d")!;
  const size = () => {
    mc.width = innerWidth * dpr;
    mc.height = innerHeight * dpr;
    wc.width = wc.offsetWidth * dpr * 2;
    wc.height = wc.offsetHeight * dpr * 2;
  };
  size();
  addEventListener("resize", size);
  const t0 = performance.now();
  const tick = (now: number) => {
    const time = now - t0, W = innerWidth, H = innerHeight;
    // the full-screen film until the name lands, then black behind the name
    if (time < T1 + 240) {
      film(mg, time, W, H, 0, 0, dpr);
      if (time > T1) {
        mg.fillStyle = `rgba(0,0,0,${(time - T1) / 240})`;
        mg.fillRect(0, 0, mc.width, mc.height);
      }
    } else {
      mg.fillStyle = "#000";
      mg.fillRect(0, 0, mc.width, mc.height);
    }
    // inside the letters: the same film, lined up with the screen
    if (time >= T1 - 50 && time < TW + 500) {
      const r = wc.getBoundingClientRect();
      if (r.width) film(wg, time, W, H, r.left, r.top, wc.width / r.width);
    }
    if (time < MEND && !leaving.value) mraf = requestAnimationFrame(tick);
    else removeEventListener("resize", size);
  };
  mraf = requestAnimationFrame(tick);
}

// The room = the hero's own background: copy the veil's gradients onto the field (same box as the hero), and put
// the veil's quiet oval behind the logo. As the logo flies, the oval glides back up to where the headline will be.
let spotDy = 0;
function room(el: HTMLElement) {
  const f = el.querySelector<HTMLElement>(".field"), sp = el.querySelector<HTMLElement>(".sp-v"), ss = el.querySelector<HTMLElement>(".sp-s");
  const hero = document.querySelector<HTMLElement>(".hero"), veil = hero?.querySelector<HTMLElement>(".veil");
  if (!f || !sp || !ss || !hero || !veil) return;
  const HB = hero.getBoundingClientRect(), W = HB.width, h = HB.height;
  f.style.top = HB.top + "px";
  f.style.height = h + "px";
  // split the veil's background-image into its layers
  const parts: string[] = [], src = getComputedStyle(veil).backgroundImage;
  let d = 0, a = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "(") d++;
    else if (c === ")") d--;
    else if (c === "," && !d) {
      parts.push(src.slice(a, i).trim());
      a = i + 1;
    }
  }
  parts.push(src.slice(a).trim());
  const ri = parts.findIndex((x) => x.startsWith("radial"));
  // the quiet oval sits behind the name and the slogan only, flattened into a wide shelf, so the black tile
  // above it keeps its edge against the posters (the kit: never the black tile on pure black)
  const wd = el.querySelector<HTMLElement>(".word")!, tg = el.querySelector<HTMLElement>(".tag");
  const rw = wd.getBoundingClientRect(), rt = (tg || wd).getBoundingClientRect();
  const cy = (rw.top + rt.bottom) / 2 - HB.top, half = (rt.bottom - rw.top) / 2, rs = half / 0.48;
  const m = ri < 0 ? null : parts[ri]!.match(/^radial-gradient\((?:ellipse )?([\d.]+)% ([\d.]+)% at ([\d.]+)% ([\d.]+)%/);
  const rgb = getComputedStyle(document.documentElement).getPropertyValue("--bg-rgb").trim() || "0,0,0";
  if (!m) {
    // phones: the page's veil is an even fade; here the wall stays a little brighter, with the shelf behind the name
    f.style.backgroundImage = `linear-gradient(180deg,rgba(${rgb},.6) 0,rgba(${rgb},.5) 30%,rgba(${rgb},.62) 58%,rgb(${rgb}) 82%)`;
    ss.style.top = cy - h + "px";
    ss.style.height = 2 * h + "px";
    ss.style.backgroundImage = `radial-gradient(${W * 0.86}px ${rs}px at 50% 50%,rgb(${rgb}) 34%,rgba(${rgb},.84) 64%,rgba(${rgb},0) 100%)`;
    sp.style.display = "none";
    spotDy = 0;
    return;
  }
  f.style.backgroundImage = parts.filter((_, i) => i !== ri).join(",");
  const ry = (h * +m[2]!) / 100, home = (h * +m[4]!) / 100, k = Math.min(1, rs / ry), hb = (2 * h) / k;
  const g = parts[ri]!.replace(m[0], `radial-gradient(${(W * +m[1]!) / 100}px ${ry}px at ${m[3]}% 50%`);
  // while the logo rests, the wall around the shelf stays brighter than the page's veil (so the black tile has an
  // edge); as it flies, this cross-fades into the veil's own oval
  for (const n of [sp, ss]) {
    n.style.top = cy - hb / 2 + "px";
    n.style.height = hb + "px";
    n.style.transform = `scaleY(${k})`;
  }
  sp.style.backgroundImage = g;
  ss.style.backgroundImage = `radial-gradient(${(W * +m[1]!) / 100}px ${ry}px at ${m[3]}% 50%,rgb(${rgb}) 34%,rgba(${rgb},.8) 62%,rgba(${rgb},.3) 100%)`;
  spotDy = home - cy;
}

// The name flies into the header logo: the splash's word lands exactly on the logo's word (logo file:
// 1026.14 × 256, mark at 0,0 (256 square), word at 322.54, 71.79 (704 × 120)), then the real logo takes over.
function fly() {
  if (leaving.value) return;
  const el = document.querySelector<HTMLElement>(".splash"), word = el?.querySelector<HTMLElement>(".word"), mark = el?.querySelector<SVGSVGElement>(".mark");
  const logo = [...document.querySelectorAll<HTMLElement>(".hd .logo img")].find((i) => getComputedStyle(i).display !== "none");
  if (!el || !word || !logo) return;
  const logoA = logo.closest<HTMLElement>(".logo")!;
  el.classList.add("flying");
  requestAnimationFrame(() => {
    for (const n of el.querySelectorAll<HTMLElement>(".spot")) n.style.transform = `translateY(${spotDy}px) scaleY(1)`;
  });
  // freeze both at their resting place, then measure
  for (const n of [word, mark]) {
    if (!n) continue;
    n.style.animation = "none";
    n.style.opacity = "1";
    n.style.transformOrigin = "0 0";
  }
  if (mark) mark.style.transform = "none";
  const rw = word.getBoundingClientRect(), rm = mark ? mark.getBoundingClientRect() : null;
  const D = 700, t0 = performance.now();
  let landed = false;
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / D), e = eio(p), L = logo.getBoundingClientRect(), s = L.height / 256;
    const kw = (704 * s) / rw.width, wx = L.left + 322.54 * s - rw.left, wy = L.top + 71.79 * s - rw.top;
    word.style.transform = `translate(${wx * e}px,${wy * e}px) scale(${1 + (kw - 1) * e})`;
    if (rm && mark) {
      const km = (256 * s) / rm.width, mx = L.left - rm.left, my = L.top - rm.top;
      mark.style.transform = `translate(${mx * e}px,${my * e}px) scale(${1 + (km - 1) * e})`;
    }
    if (!landed && p >= 1) {
      landed = true;
      // the real logo takes over, then the rest of the page rises in
      logoA.style.transition = "none";
      logoA.style.opacity = "1";
      el.classList.add("landed");
      document.documentElement.classList.remove("splashing");
      requestAnimationFrame(() => {
        for (const n of [word, mark]) if (n) n.style.opacity = "0";
      });
      setTimeout(() => {
        logoA.style.transition = "";
        logoA.style.opacity = "";
        done();
      }, 820);
      return;
    }
    requestAnimationFrame(step);
  };
  step(t0);
}

// Skip ends with the "out" animation on the container; that's the cue to remove it.
// (scoped styles rename keyframes to "out-<hash>")
const onAnimEnd = (e: AnimationEvent) => {
  if (e.target === e.currentTarget && e.animationName.startsWith("out")) done();
};

onMounted(() => {
  if (!active.value) return;
  if (document.documentElement.dataset.splash === "seen") return done();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  addEventListener("keydown", onKey);
  buildClips();
  // the clock starts once the first stills are decoded (at most 1.5s), so the opening cuts are sharp
  let started = false;
  const go = () => {
    if (started || !active.value) return;
    started = true;
    const el = document.querySelector<HTMLElement>(".splash");
    if (!el) return;
    el.classList.add("go");
    fallback = setTimeout(done, END + 400);
    flyT = setTimeout(fly, OUT_AT);
    runMontage(el);
    openT = setTimeout(() => {
      room(el);
      el.classList.add("open");
    }, 4300);
  };
  Promise.all(clips.slice(0, 3).map((c) => c.im.decode().catch(() => {}))).then(go);
  setTimeout(go, 1500);
});
onBeforeUnmount(() => {
  removeEventListener("keydown", onKey);
  clearTimeout(fallback);
  clearTimeout(flyT);
  clearTimeout(openT);
  cancelAnimationFrame(mraf);
});

// While it plays the page behind doesn't scroll, the header waits and the hero holds its entrance (main.css).
useHead({
  htmlAttrs: { class: computed(() => (active.value ? "splashing" : "")) },
  // Once per browser session: the first load of a tab plays it and notes that in sessionStorage; reloads
  // (and other pages) in that tab find the note and hide the splash before the first paint. If storage is
  // blocked it plays every time.
  script: computed(() =>
    active.value
      ? [{
          key: "splash-seen",
          tagPosition: "head",
          // ...and when it will play, shuffles the stills and starts the first four right away (phone-sized on small screens).
          innerHTML: `(function(){try{if(sessionStorage.getItem(${JSON.stringify(SEEN_KEY)})){document.documentElement.setAttribute("data-splash","seen");return}sessionStorage.setItem(${JSON.stringify(SEEN_KEY)},"1")}catch(e){}if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var o=${JSON.stringify(HERO)},d=innerWidth*Math.min(2,devicePixelRatio||1)<=1100?"hero-sm":"hero";for(var i=o.length-1;i>0;i--){var j=Math.random()*(i+1)|0,x=o[i];o[i]=o[j];o[j]=x}window.__splash={dir:d,order:o,imgs:o.slice(0,4).map(function(n){var m=new Image();m.decoding="async";m.fetchPriority="high";m.src="/images/"+d+"/"+n+".jpg";return m})}})()`,
        }]
      : [],
  ),
});
</script>

<template>
  <div
    v-if="active"
    class="splash"
    :class="{ leaving }"
    :style="{ '--flip': `${FLIP}ms` }"
    role="region"
    :aria-label="t('splash.label')"
    @animationend="onAnimEnd"
  >
    <!-- 1. the montage: cuts from the whole library, faster and faster -->
    <canvas class="mont" aria-hidden="true" />
    <!-- 3. the room: the splash opens onto the page itself (its poster wall), evenly dimmed -->
    <div class="field" aria-hidden="true"><i class="spot sp-s" /><i class="spot sp-v" /></div>

    <!-- 2 + 3. the name: the same pages inside the letters, then the wordmark in its own colours; Peek above -->
    <div class="lockup">
      <svg class="mark" viewBox="0 0 256 256" aria-hidden="true">
        <defs>
          <clipPath id="spk-t"><path d="M56 0 H200 C231 0 256 25 256 56 V200 C256 231 231 256 200 256 H56 C25 256 0 231 0 200 V56 C0 25 25 0 56 0 Z" /></clipPath>
          <radialGradient id="spk-sky" cx="128" cy="150" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#181B28" /><stop offset=".5" stop-color="#08090E" /><stop offset="1" stop-color="#000000" /></radialGradient>
          <radialGradient id="spk-sc" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#FFFFFF" /><stop offset=".55" stop-color="#F2F4F8" /><stop offset="1" stop-color="#CFD5E2" /></radialGradient>
          <linearGradient id="spk-occ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E97AE" stop-opacity="0" /><stop offset="1" stop-color="#8E97AE" stop-opacity="0.42" /></linearGradient>
          <linearGradient id="spk-wall" x1="0" y1="158" x2="0" y2="256" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFD54D" /><stop offset=".35" stop-color="#FFC42E" /><stop offset="1" stop-color="#F2AE1C" /></linearGradient>
          <radialGradient id="spk-pu" cx=".42" cy=".4" r=".7"><stop offset="0" stop-color="#20232F" /><stop offset="1" stop-color="#000000" /></radialGradient>
          <clipPath id="spk-c0"><circle cx="81.5" cy="158" r="41" /></clipPath><clipPath id="spk-c1"><circle cx="174.5" cy="158" r="41" /></clipPath>
        </defs>
        <!-- Screen-lit Peek (brand kit v6.1): glow behind the eyes, lit eyes, screen catchlights, lit wall with a rim -->
        <g clip-path="url(#spk-t)">
          <rect width="256" height="256" fill="url(#spk-sky)" />
          <g class="eyes">
            <circle cx="81.5" cy="158" r="41" fill="url(#spk-sc)" />
            <g clip-path="url(#spk-c0)"><rect x="40.5" y="140.78" width="82" height="17.22" fill="url(#spk-occ)" /></g>
            <g clip-path="url(#spk-c0)"><g class="pupils"><circle cx="92.09" cy="148.22" r="17.63" fill="url(#spk-pu)" /><rect x="80.99" y="137.47" width="11.64" height="8.81" rx="2.64" fill="#FFFFFF" /><circle cx="98.44" cy="153.51" r="2.12" fill="#FFFFFF" opacity=".9" /></g></g>
            <circle cx="174.5" cy="158" r="41" fill="url(#spk-sc)" />
            <g clip-path="url(#spk-c1)"><rect x="133.5" y="140.78" width="82" height="17.22" fill="url(#spk-occ)" /></g>
            <g clip-path="url(#spk-c1)"><g class="pupils"><circle cx="185.09" cy="148.22" r="17.63" fill="url(#spk-pu)" /><rect x="173.99" y="137.47" width="11.64" height="8.81" rx="2.64" fill="#FFFFFF" /><circle cx="191.44" cy="153.51" r="2.12" fill="#FFFFFF" opacity=".9" /></g></g>
            <rect class="lid" x="0" y="113" width="256" height="45" fill="#05060A" />
          </g>
          <rect x="0" y="158" width="256" height="98" fill="url(#spk-wall)" />
          <rect x="0" y="158" width="256" height="3" fill="#FFE9A6" />
        </g>
      </svg>
      <div class="word" role="img" aria-label="tvtracker">
        <canvas class="wcv" aria-hidden="true" />
        <img class="word-ink wi-d" src="/images/brand-v6/peek-logo-dark.svg" alt=""><img class="word-ink wi-l" src="/images/brand-v6/peek-logo-light.svg" alt="">
      </div>
      <p class="tag"><span>{{ t("splash.taglineA") }}</span> <em>{{ t("splash.taglineB") }}</em></p>
    </div>

    <button type="button" class="sk" :aria-label="t('splash.skipLabel')" @click="skip">
      {{ t("splash.skip") }}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5l7 7-7 7M13 5l7 7-7 7" /></svg>
    </button>
  </div>
</template>

<style scoped>
/* Timeline v3 (ms): montage of the library 0–2700, cuts speeding up · the name zooms in 2700 with the cuts inside its letters · wordmark colours 3950 · room 4350 ·
   Peek rises 1850, glances 2350, blinks 2800 · slogan 2000 · 4400 the logo and the name fly into the header logo (JS), then the page's content rises · gone 4950.
   Pages are luminance-matched (mean 63–81 of 255) so the deck does not strobe. Only transform and opacity animate. */
.splash{position:fixed;inset:0;z-index:200;overflow:hidden;background:#000;color:#fff;
  animation:open .5s 4.35s ease forwards}
/* (no CSS fade-out here: an opacity animation on this layer would stop the frosted glass below from seeing the page;
   the script ends the splash, with a timed fallback) */
/* 1.75s: the black room opens onto the page underneath (the same poster wall the page keeps) */
@keyframes open{to{background-color:transparent}}
.deck{animation:gone .5s 1.75s ease forwards}
@keyframes gone{to{opacity:0;visibility:hidden}}
.splash.leaving{animation:out .3s ease forwards}
.splash.flying{animation:none;background:transparent}
@keyframes out{to{opacity:0;visibility:hidden}}
.deck{position:absolute;z-index:1;inset:0;perspective:1400px}
.pg{position:absolute;inset:0;opacity:0;transform-origin:var(--o);will-change:transform,opacity;
  animation:flip calc(var(--flip) * 1.6) calc(var(--flip) * var(--i)) cubic-bezier(.2,.7,.2,1) forwards}
.pg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pg .mb{animation:unblur calc(var(--flip) * 1.2) calc(var(--flip) * var(--i)) ease-out forwards}
@keyframes flip{
0%{opacity:1;transform:translate(var(--tx),var(--ty)) rotateX(var(--rx)) rotateY(var(--ry)) scale(var(--s))}
100%{opacity:1;transform:none}}
@keyframes unblur{0%{opacity:1}100%{opacity:0}}
/* the photo behind the letters steps right back, so the name reads */
.dim{position:absolute;inset:0;z-index:30;background:#000;opacity:0;animation:fade-to .45s 1.3s ease forwards}
@keyframes fade-to{to{opacity:.84}}
/* 3 · the room: the hero poster wall (dimmed) + a Surface pool behind the lockup */
.field{position:absolute;z-index:0;left:0;right:0;top:0;height:100%;overflow:hidden;pointer-events:none;visibility:hidden}
.splash.open .field{visibility:visible}
/* no pool: the room is the page's own background — the poster wall under the hero's own veil. The veil's quiet
   centre (the dark, or light, oval the headline sits in) is moved down behind the logo; as the logo flies to the
   header it glides back up to where the headline will be, and the page's veil takes over (the same pixels). */
.spot{position:absolute;left:0;right:0;will-change:transform}

@keyframes fade{to{opacity:1}}
/* 2 + 3 · the stacked lockup in the kit's proportions: mark = .408 × word width, gap = .106 × word width */
.lockup{position:absolute;z-index:2;left:50%;top:50%;width:min(58vw,560px);transform:translate(-50%,-38%)}
.word{position:relative;width:100%;aspect-ratio:704/120;opacity:0;
  -webkit-mask:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjIgLTExOCA3MDQgMTIwIj48cGF0aCBkPSJNNDQuNjg4IDIuMDE2UTI5LjczNiAyLjAxNiAyMi40MjggLTUuMTI0MDAwMDAwMDAwMDAwNlExNS4xMjAwMDAwMDAwMDAwMDEgLTEyLjI2NDAwMDAwMDAwMDAwMSAxNS4xMjAwMDAwMDAwMDAwMDEgLTI1LjUzNlYtNjEuOTkyMDAwMDAwMDAwMDA0SDIuMDE2Vi04NC4wSDE1LjEyMDAwMDAwMDAwMDAwMVYtMTEwLjIwODAwMDAwMDAwMDAxSDQxLjMyOFYtODQuMEg2MC40ODAwMDAwMDAwMDAwMDRWLTYxLjk5MjAwMDAwMDAwMDAwNEg0MS4zMjhWLTMyLjA4OFE0MS4zMjggLTI3LjA0ODAwMDAwMDAwMDAwMiA0My4xNzYgLTI0LjY5NlE0NS4wMjQgLTIyLjM0NCA0OC44ODgwMDAwMDAwMDAwMDUgLTIyLjM0NFE1MC40MDAwMDAwMDAwMDAwMDYgLTIyLjM0NCA1Mi40MTYwMDAwMDAwMDAwMDQgLTIzLjFRNTQuNDMyIC0yMy44NTYgNTYuMTEyIC0yNS4wMzJMNjUuMTg0IC01Ljg4MDAwMDAwMDAwMDAwMVE2MS4xNTIgLTIuNTIgNTUuNTI0IC0wLjI1MlE0OS44OTYgMi4wMTYgNDQuNjg4IDIuMDE2WiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0xMDEuMzA0IDAuMCA2Ny4yIC04NC4wSDk0LjI0OEwxMTQuNDA4MDAwMDAwMDAwMDIgLTI5LjkwNDAwMDAwMDAwMDAwM0wxMzQuNCAtODQuMEgxNjEuNDQ4TDEyNy4zNDQwMDAwMDAwMDAwMSAwLjBaIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTIwMy43ODQgMi4wMTZRMTg4LjgzMiAyLjAxNiAxODEuNTI0IC01LjEyNDAwMDAwMDAwMDAwMDZRMTc0LjIxNiAtMTIuMjY0MDAwMDAwMDAwMDAxIDE3NC4yMTYgLTI1LjUzNlYtNjEuOTkyMDAwMDAwMDAwMDA0SDE2MS4xMTJWLTg0LjBIMTc0LjIxNlYtMTEwLjIwODAwMDAwMDAwMDAxSDIwMC40MjRWLTg0LjBIMjE5LjU3NjAwMDAwMDAwMDAyVi02MS45OTIwMDAwMDAwMDAwMDRIMjAwLjQyNFYtMzIuMDg4UTIwMC40MjQgLTI3LjA0ODAwMDAwMDAwMDAwMiAyMDIuMjcyIC0yNC42OTZRMjA0LjEyIC0yMi4zNDQgMjA3Ljk4NCAtMjIuMzQ0UTIwOS40OTYgLTIyLjM0NCAyMTEuNTEyIC0yMy4xUTIxMy41MjgwMDAwMDAwMDAwMiAtMjMuODU2IDIxNS4yMDggLTI1LjAzMkwyMjQuMjggLTUuODgwMDAwMDAwMDAwMDAxUTIyMC4yNDggLTIuNTIgMjE0LjYyIC0wLjI1MlEyMDguOTkyMDAwMDAwMDAwMDIgMi4wMTYgMjAzLjc4NCAyLjAxNloiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjMzLjg1NjAwMDAwMDAwMDAyIDAuMFYtODQuMEgyNjAuMDY0Vi02OC4zNzZRMjY1LjI3MiAtNzYuMjcyIDI3My4zMzYgLTgwLjMwNFEyODEuNDAwMDAwMDAwMDAwMDMgLTg0LjMzNiAyODkuOCAtODQuMzM2Vi01OC44MDAwMDAwMDAwMDAwMDRRMjgyLjA3MiAtNTguODAwMDAwMDAwMDAwMDA0IDI3NS4yNjgwMDAwMDAwMDAwMyAtNTcuMTIwMDAwMDAwMDAwMDA1UTI2OC40NjQgLTU1LjQ0MDAwMDAwMDAwMDAwNSAyNjQuMjY0IC01MS45OTZRMjYwLjA2NCAtNDguNTUyIDI2MC4wNjQgLTQzLjE3NlYwLjBaIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTMyNC40MDggMi4wMTZRMzA5LjQ1NiAyLjAxNiAzMDEuMjI0MDAwMDAwMDAwMDUgLTQuNzA0MDAwMDAwMDAwMDAxUTI5Mi45OTIgLTExLjQyNDAwMDAwMDAwMDAwMSAyOTIuOTkyIC0yMy42ODgwMDAwMDAwMDAwMDJRMjkyLjk5MiAtMzYuOTYgMzAxLjU2MDAwMDAwMDAwMDA2IC00My41MTJRMzEwLjEyODAwMDAwMDAwMDA0IC01MC4wNjQgMzI1LjU4NDAwMDAwMDAwMDA2IC01MC4wNjRIMzQ2LjA4MDAwMDAwMDAwMDA0UTM0NS4yNCAtNTYuNzg0MDAwMDAwMDAwMDA2IDM0Mi4xMzIwMDAwMDAwMDAwNiAtNjAuNTY0MDAwMDAwMDAwMDFRMzM5LjAyNDAwMDAwMDAwMDA2IC02NC4zNDQwMDAwMDAwMDAwMSAzMzIuMTM2IC02NC4zNDQwMDAwMDAwMDAwMVEzMjcuNDMyIC02NC4zNDQwMDAwMDAwMDAwMSAzMjMuOTA0IC02Mi4xNjAwMDAwMDAwMDAwMVEzMjAuMzc2MDAwMDAwMDAwMDMgLTU5Ljk3NjAwMDAwMDAwMDAwNiAzMTcuODU2MDAwMDAwMDAwMDUgLTU2LjExMkwyOTUuMDA4MDAwMDAwMDAwMDQgLTYzLjY3MjAwMDAwMDAwMDAwNFEyOTcuODY0MDAwMDAwMDAwMDMgLTY5Ljg4OCAzMDIuODIwMDAwMDAwMDAwMDUgLTc0LjkyOFEzMDcuNzc2IC03OS45NjggMzE1LjAgLTgyLjk5MlEzMjIuMjI0MDAwMDAwMDAwMDUgLTg2LjAxNiAzMzEuOCAtODYuMDE2UTM0NC45MDQwMDAwMDAwMDAwNSAtODYuMDE2IDM1My45NzYgLTgxLjE0NFEzNjMuMDQ4IC03Ni4yNzIgMzY3LjU4NCAtNjcuNTM2UTM3Mi4xMiAtNTguODAwMDAwMDAwMDAwMDA0IDM3Mi4xMiAtNDYuODcyTDM3MS43ODQwMDAwMDAwMDAwNSAwLjBIMzQ3LjI1NjAwMDAwMDAwMDAzTDM0Ni45MiAtOC41NjgwMDAwMDAwMDAwMDFRMzQzLjU2MDAwMDAwMDAwMDA2IC0zLjM2MDAwMDAwMDAwMDAwMDMgMzM3Ljg0ODAwMDAwMDAwMDA3IC0wLjY3MjAwMDAwMDAwMDAwMDJRMzMyLjEzNiAyLjAxNiAzMjQuNDA4IDIuMDE2Wk0zMzAuMTIgLTE3LjgwOFEzMzQuOTkyIC0xNy44MDggMzM4LjY4OCAtMTkuODIzOTk5OTk5OTk5OTk4UTM0Mi4zODQgLTIxLjg0IDM0NC40ODQwMDAwMDAwMDAwNCAtMjUuMjg0UTM0Ni41ODQwMDAwMDAwMDAwNiAtMjguNzI4IDM0Ni41ODQwMDAwMDAwMDAwNiAtMzIuNzYwMDAwMDAwMDAwMDA1Vi0zMy4yNjRIMzM1LjQ5NjAwMDAwMDAwMDA0UTMyNy4wOTYgLTMzLjI2NCAzMjMuNCAtMzAuOTEyMDAwMDAwMDAwMDAzUTMxOS43MDQgLTI4LjU2MDAwMDAwMDAwMDAwMiAzMTkuNzA0IC0yNC4zNjAwMDAwMDAwMDAwMDNRMzE5LjcwNCAtMjEuMzM2MDAwMDAwMDAwMDAyIDMyMi40NzYgLTE5LjU3MjAwMDAwMDAwMDAwM1EzMjUuMjQ4MDAwMDAwMDAwMDUgLTE3LjgwOCAzMzAuMTIgLTE3LjgwOFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNNDI2LjU1MiAyLjAxNlE0MTMuMTEyIDIuMDE2IDQwMi42MTIgLTMuNjEyUTM5Mi4xMTIgLTkuMjQgMzg2LjIzMiAtMTkuMjM2UTM4MC4zNTIwMDAwMDAwMDAwMyAtMjkuMjMyMDAwMDAwMDAwMDAzIDM4MC4zNTIwMDAwMDAwMDAwMyAtNDIuMFEzODAuMzUyMDAwMDAwMDAwMDMgLTU0LjkzNiAzODYuMjMyIC02NC44NDhRMzkyLjExMiAtNzQuNzYgNDAyLjQ0NDAwMDAwMDAwMDEgLTgwLjM4OFE0MTIuNzc2MDAwMDAwMDAwMDcgLTg2LjAxNiA0MjYuMjE2MDAwMDAwMDAwMDcgLTg2LjAxNlE0MzkuMTUyMDAwMDAwMDAwMDQgLTg2LjAxNiA0NDkuOTA0MDAwMDAwMDAwMDUgLTc5LjQ2NFE0NjAuNjU2MDAwMDAwMDAwMDYgLTcyLjkxMiA0NjUuMzYwMDAwMDAwMDAwMDcgLTYwLjQ4MDAwMDAwMDAwMDAwNEw0NDAuNDk2MDAwMDAwMDAwMDQgLTUyLjA4MDAwMDAwMDAwMDAwNVE0MzguNjQ4IC01Ni4xMTIgNDM0LjM2NDAwMDAwMDAwMDAzIC01OC43MTZRNDMwLjA4MDAwMDAwMDAwMDA0IC02MS4zMiA0MjQuODcyMDAwMDAwMDAwMDcgLTYxLjMyUTQxOS42NjQwMDAwMDAwMDAwNCAtNjEuMzIgNDE1LjcxNiAtNTguODg0UTQxMS43NjgwMDAwMDAwMDAwMyAtNTYuNDQ4IDQwOS41IC01Mi4wOFE0MDcuMjMyIC00Ny43MTIgNDA3LjIzMiAtNDIuMFE0MDcuMjMyIC0zNi4yODgwMDAwMDAwMDAwMDQgNDA5LjUgLTMyLjAwNDAwMDAwMDAwMDAwNVE0MTEuNzY4MDAwMDAwMDAwMDMgLTI3LjcyMDAwMDAwMDAwMDAwMiA0MTUuODg0IC0yNS4yMDAwMDAwMDAwMDAwMDNRNDIwLjAwMDAwMDAwMDAwMDA2IC0yMi42OCA0MjUuMjA4IC0yMi42OFE0MzAuNDE2MDAwMDAwMDAwMDUgLTIyLjY4IDQzNC42MTYwMDAwMDAwMDAwNCAtMjUuMzY4MDAwMDAwMDAwMDAyUTQzOC44MTYwMDAwMDAwMDAwMyAtMjguMDU2IDQ0MC44MzIwMDAwMDAwMDAwNSAtMzIuNDI0TDQ2NS42OTYgLTI0LjAyNFE0NjAuODI0MDAwMDAwMDAwMDcgLTExLjQyNDAwMDAwMDAwMDAwMSA0NTAuMTU2MDAwMDAwMDAwMDYgLTQuNzA0MDAwMDAwMDAwMDAxUTQzOS40ODgwMDAwMDAwMDAwNiAyLjAxNiA0MjYuNTUyIDIuMDE2WiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik00NzMuNDI0MDAwMDAwMDAwMDQgMC4wVi0xMTcuNjAwMDAwMDAwMDAwMDFINDk5LjYzMjAwMDAwMDAwMDA2Vi01NS43NzZMNTI1LjAgLTg0LjBINTU1Ljc0NEw1MjMuOTkyMDAwMDAwMDAwMSAtNDcuNzEyTDU1Ny45MjgwMDAwMDAwMDAxIDAuMEg1MjcuNTIwMDAwMDAwMDAwMUw1MDcuMzYwMDAwMDAwMDAwMDcgLTI4LjcyOEw0OTkuNjMyMDAwMDAwMDAwMDYgLTIwLjE2VjAuMFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNNTk5LjI1NjAwMDAwMDAwMDEgMi4wMTZRNTg2LjE1MiAyLjAxNiA1NzYuMDcyMDAwMDAwMDAwMSAtMy42MTJRNTY1Ljk5MjAwMDAwMDAwMDEgLTkuMjQgNTYwLjI4MDAwMDAwMDAwMDEgLTE5LjE1MlE1NTQuNTY4MDAwMDAwMDAwMSAtMjkuMDY0IDU1NC41NjgwMDAwMDAwMDAxIC00Mi4wUTU1NC41NjgwMDAwMDAwMDAxIC01NS4xMDQwMDAwMDAwMDAwMDYgNTYwLjM2NCAtNjUuMDE2UTU2Ni4xNjAwMDAwMDAwMDAxIC03NC45MjgwMDAwMDAwMDAwMSA1NzYuMjQgLTgwLjQ3MjAwMDAwMDAwMDAxUTU4Ni4zMiAtODYuMDE2IDU5OS41OTIwMDAwMDAwMDAxIC04Ni4wMTZRNjExLjUyMDAwMDAwMDAwMDEgLTg2LjAxNiA2MjEuMDk2IC04MC4zMDRRNjMwLjY3MiAtNzQuNTkyIDYzNi4zMDAwMDAwMDAwMDAxIC02My4zMzZRNjQxLjkyODAwMDAwMDAwMDEgLTUyLjA4MDAwMDAwMDAwMDAwNSA2NDEuOTI4MDAwMDAwMDAwMSAtMzUuMjhINTgxLjc4NDAwMDAwMDAwMDFRNTgyLjYyNCAtMjguMDU2IDU4Ny43NDggLTIzLjc3MlE1OTIuODcyMDAwMDAwMDAwMSAtMTkuNDg4IDU5OS45MjgwMDAwMDAwMDAxIC0xOS40ODhRNjA2LjE0NCAtMTkuNDg4IDYxMC40MjgwMDAwMDAwMDAxIC0yMi4yNTk5OTk5OTk5OTk5OThRNjE0LjcxMjAwMDAwMDAwMDEgLTI1LjAzMiA2MTYuMzkyIC0yOS4yMzIwMDAwMDAwMDAwMDNMNjM5LjU3NiAtMjEuMzM2MDAwMDAwMDAwMDAyUTYzNi4yMTYgLTEzLjQ0MDAwMDAwMDAwMDAwMSA2MzAuMDg0MDAwMDAwMDAwMSAtOC4yMzIwMDAwMDAwMDAwMDFRNjIzLjk1MiAtMy4wMjQgNjE2LjA1NiAtMC41MDRRNjA4LjE2MDAwMDAwMDAwMDEgMi4wMTYgNTk5LjI1NjAwMDAwMDAwMDEgMi4wMTZaTTU4Mi40NTYgLTUyLjc1Mkg2MTQuNTQ0MDAwMDAwMDAwMVE2MTMuODcyMDAwMDAwMDAwMSAtNTcuNzkyIDYxMS4zNTIwMDAwMDAwMDAxIC02MC43MzJRNjA4LjgzMjAwMDAwMDAwMDEgLTYzLjY3MjAwMDAwMDAwMDAwNCA2MDUuNDcyMDAwMDAwMDAwMSAtNjQuOTMyUTYwMi4xMTIwMDAwMDAwMDAxIC02Ni4xOTIwMDAwMDAwMDAwMSA1OTguNzUyMDAwMDAwMDAwMSAtNjYuMTkyMDAwMDAwMDAwMDFRNTk1LjU2MDAwMDAwMDAwMDEgLTY2LjE5MjAwMDAwMDAwMDAxIDU5Mi4wMzIgLTY0LjkzMlE1ODguNTA0IC02My42NzIwMDAwMDAwMDAwMDQgNTg1LjkwMDAwMDAwMDAwMDEgLTYwLjczMlE1ODMuMjk2IC01Ny43OTIgNTgyLjQ1NiAtNTIuNzUyWiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik02NDkuNjU2MDAwMDAwMDAwMSAwLjBWLTg0LjBINjc1Ljg2NFYtNjguMzc2UTY4MS4wNzIwMDAwMDAwMDAxIC03Ni4yNzIgNjg5LjEzNjAwMDAwMDAwMDEgLTgwLjMwNFE2OTcuMiAtODQuMzM2IDcwNS42MDAwMDAwMDAwMDAxIC04NC4zMzZWLTU4LjgwMDAwMDAwMDAwMDAwNFE2OTcuODcyMDAwMDAwMDAwMSAtNTguODAwMDAwMDAwMDAwMDA0IDY5MS4wNjgwMDAwMDAwMDAxIC01Ny4xMjAwMDAwMDAwMDAwMDVRNjg0LjI2NDAwMDAwMDAwMDEgLTU1LjQ0MDAwMDAwMDAwMDAwNSA2ODAuMDY0MDAwMDAwMDAwMSAtNTEuOTk2UTY3NS44NjQgLTQ4LjU1MiA2NzUuODY0IC00My4xNzZWMC4wWiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg0K") center/contain no-repeat;mask:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjIgLTExOCA3MDQgMTIwIj48cGF0aCBkPSJNNDQuNjg4IDIuMDE2UTI5LjczNiAyLjAxNiAyMi40MjggLTUuMTI0MDAwMDAwMDAwMDAwNlExNS4xMjAwMDAwMDAwMDAwMDEgLTEyLjI2NDAwMDAwMDAwMDAwMSAxNS4xMjAwMDAwMDAwMDAwMDEgLTI1LjUzNlYtNjEuOTkyMDAwMDAwMDAwMDA0SDIuMDE2Vi04NC4wSDE1LjEyMDAwMDAwMDAwMDAwMVYtMTEwLjIwODAwMDAwMDAwMDAxSDQxLjMyOFYtODQuMEg2MC40ODAwMDAwMDAwMDAwMDRWLTYxLjk5MjAwMDAwMDAwMDAwNEg0MS4zMjhWLTMyLjA4OFE0MS4zMjggLTI3LjA0ODAwMDAwMDAwMDAwMiA0My4xNzYgLTI0LjY5NlE0NS4wMjQgLTIyLjM0NCA0OC44ODgwMDAwMDAwMDAwMDUgLTIyLjM0NFE1MC40MDAwMDAwMDAwMDAwMDYgLTIyLjM0NCA1Mi40MTYwMDAwMDAwMDAwMDQgLTIzLjFRNTQuNDMyIC0yMy44NTYgNTYuMTEyIC0yNS4wMzJMNjUuMTg0IC01Ljg4MDAwMDAwMDAwMDAwMVE2MS4xNTIgLTIuNTIgNTUuNTI0IC0wLjI1MlE0OS44OTYgMi4wMTYgNDQuNjg4IDIuMDE2WiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0xMDEuMzA0IDAuMCA2Ny4yIC04NC4wSDk0LjI0OEwxMTQuNDA4MDAwMDAwMDAwMDIgLTI5LjkwNDAwMDAwMDAwMDAwM0wxMzQuNCAtODQuMEgxNjEuNDQ4TDEyNy4zNDQwMDAwMDAwMDAwMSAwLjBaIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTIwMy43ODQgMi4wMTZRMTg4LjgzMiAyLjAxNiAxODEuNTI0IC01LjEyNDAwMDAwMDAwMDAwMDZRMTc0LjIxNiAtMTIuMjY0MDAwMDAwMDAwMDAxIDE3NC4yMTYgLTI1LjUzNlYtNjEuOTkyMDAwMDAwMDAwMDA0SDE2MS4xMTJWLTg0LjBIMTc0LjIxNlYtMTEwLjIwODAwMDAwMDAwMDAxSDIwMC40MjRWLTg0LjBIMjE5LjU3NjAwMDAwMDAwMDAyVi02MS45OTIwMDAwMDAwMDAwMDRIMjAwLjQyNFYtMzIuMDg4UTIwMC40MjQgLTI3LjA0ODAwMDAwMDAwMDAwMiAyMDIuMjcyIC0yNC42OTZRMjA0LjEyIC0yMi4zNDQgMjA3Ljk4NCAtMjIuMzQ0UTIwOS40OTYgLTIyLjM0NCAyMTEuNTEyIC0yMy4xUTIxMy41MjgwMDAwMDAwMDAwMiAtMjMuODU2IDIxNS4yMDggLTI1LjAzMkwyMjQuMjggLTUuODgwMDAwMDAwMDAwMDAxUTIyMC4yNDggLTIuNTIgMjE0LjYyIC0wLjI1MlEyMDguOTkyMDAwMDAwMDAwMDIgMi4wMTYgMjAzLjc4NCAyLjAxNloiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjMzLjg1NjAwMDAwMDAwMDAyIDAuMFYtODQuMEgyNjAuMDY0Vi02OC4zNzZRMjY1LjI3MiAtNzYuMjcyIDI3My4zMzYgLTgwLjMwNFEyODEuNDAwMDAwMDAwMDAwMDMgLTg0LjMzNiAyODkuOCAtODQuMzM2Vi01OC44MDAwMDAwMDAwMDAwMDRRMjgyLjA3MiAtNTguODAwMDAwMDAwMDAwMDA0IDI3NS4yNjgwMDAwMDAwMDAwMyAtNTcuMTIwMDAwMDAwMDAwMDA1UTI2OC40NjQgLTU1LjQ0MDAwMDAwMDAwMDAwNSAyNjQuMjY0IC01MS45OTZRMjYwLjA2NCAtNDguNTUyIDI2MC4wNjQgLTQzLjE3NlYwLjBaIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTMyNC40MDggMi4wMTZRMzA5LjQ1NiAyLjAxNiAzMDEuMjI0MDAwMDAwMDAwMDUgLTQuNzA0MDAwMDAwMDAwMDAxUTI5Mi45OTIgLTExLjQyNDAwMDAwMDAwMDAwMSAyOTIuOTkyIC0yMy42ODgwMDAwMDAwMDAwMDJRMjkyLjk5MiAtMzYuOTYgMzAxLjU2MDAwMDAwMDAwMDA2IC00My41MTJRMzEwLjEyODAwMDAwMDAwMDA0IC01MC4wNjQgMzI1LjU4NDAwMDAwMDAwMDA2IC01MC4wNjRIMzQ2LjA4MDAwMDAwMDAwMDA0UTM0NS4yNCAtNTYuNzg0MDAwMDAwMDAwMDA2IDM0Mi4xMzIwMDAwMDAwMDAwNiAtNjAuNTY0MDAwMDAwMDAwMDFRMzM5LjAyNDAwMDAwMDAwMDA2IC02NC4zNDQwMDAwMDAwMDAwMSAzMzIuMTM2IC02NC4zNDQwMDAwMDAwMDAwMVEzMjcuNDMyIC02NC4zNDQwMDAwMDAwMDAwMSAzMjMuOTA0IC02Mi4xNjAwMDAwMDAwMDAwMVEzMjAuMzc2MDAwMDAwMDAwMDMgLTU5Ljk3NjAwMDAwMDAwMDAwNiAzMTcuODU2MDAwMDAwMDAwMDUgLTU2LjExMkwyOTUuMDA4MDAwMDAwMDAwMDQgLTYzLjY3MjAwMDAwMDAwMDAwNFEyOTcuODY0MDAwMDAwMDAwMDMgLTY5Ljg4OCAzMDIuODIwMDAwMDAwMDAwMDUgLTc0LjkyOFEzMDcuNzc2IC03OS45NjggMzE1LjAgLTgyLjk5MlEzMjIuMjI0MDAwMDAwMDAwMDUgLTg2LjAxNiAzMzEuOCAtODYuMDE2UTM0NC45MDQwMDAwMDAwMDAwNSAtODYuMDE2IDM1My45NzYgLTgxLjE0NFEzNjMuMDQ4IC03Ni4yNzIgMzY3LjU4NCAtNjcuNTM2UTM3Mi4xMiAtNTguODAwMDAwMDAwMDAwMDA0IDM3Mi4xMiAtNDYuODcyTDM3MS43ODQwMDAwMDAwMDAwNSAwLjBIMzQ3LjI1NjAwMDAwMDAwMDAzTDM0Ni45MiAtOC41NjgwMDAwMDAwMDAwMDFRMzQzLjU2MDAwMDAwMDAwMDA2IC0zLjM2MDAwMDAwMDAwMDAwMDMgMzM3Ljg0ODAwMDAwMDAwMDA3IC0wLjY3MjAwMDAwMDAwMDAwMDJRMzMyLjEzNiAyLjAxNiAzMjQuNDA4IDIuMDE2Wk0zMzAuMTIgLTE3LjgwOFEzMzQuOTkyIC0xNy44MDggMzM4LjY4OCAtMTkuODIzOTk5OTk5OTk5OTk4UTM0Mi4zODQgLTIxLjg0IDM0NC40ODQwMDAwMDAwMDAwNCAtMjUuMjg0UTM0Ni41ODQwMDAwMDAwMDAwNiAtMjguNzI4IDM0Ni41ODQwMDAwMDAwMDAwNiAtMzIuNzYwMDAwMDAwMDAwMDA1Vi0zMy4yNjRIMzM1LjQ5NjAwMDAwMDAwMDA0UTMyNy4wOTYgLTMzLjI2NCAzMjMuNCAtMzAuOTEyMDAwMDAwMDAwMDAzUTMxOS43MDQgLTI4LjU2MDAwMDAwMDAwMDAwMiAzMTkuNzA0IC0yNC4zNjAwMDAwMDAwMDAwMDNRMzE5LjcwNCAtMjEuMzM2MDAwMDAwMDAwMDAyIDMyMi40NzYgLTE5LjU3MjAwMDAwMDAwMDAwM1EzMjUuMjQ4MDAwMDAwMDAwMDUgLTE3LjgwOCAzMzAuMTIgLTE3LjgwOFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNNDI2LjU1MiAyLjAxNlE0MTMuMTEyIDIuMDE2IDQwMi42MTIgLTMuNjEyUTM5Mi4xMTIgLTkuMjQgMzg2LjIzMiAtMTkuMjM2UTM4MC4zNTIwMDAwMDAwMDAwMyAtMjkuMjMyMDAwMDAwMDAwMDAzIDM4MC4zNTIwMDAwMDAwMDAwMyAtNDIuMFEzODAuMzUyMDAwMDAwMDAwMDMgLTU0LjkzNiAzODYuMjMyIC02NC44NDhRMzkyLjExMiAtNzQuNzYgNDAyLjQ0NDAwMDAwMDAwMDEgLTgwLjM4OFE0MTIuNzc2MDAwMDAwMDAwMDcgLTg2LjAxNiA0MjYuMjE2MDAwMDAwMDAwMDcgLTg2LjAxNlE0MzkuMTUyMDAwMDAwMDAwMDQgLTg2LjAxNiA0NDkuOTA0MDAwMDAwMDAwMDUgLTc5LjQ2NFE0NjAuNjU2MDAwMDAwMDAwMDYgLTcyLjkxMiA0NjUuMzYwMDAwMDAwMDAwMDcgLTYwLjQ4MDAwMDAwMDAwMDAwNEw0NDAuNDk2MDAwMDAwMDAwMDQgLTUyLjA4MDAwMDAwMDAwMDAwNVE0MzguNjQ4IC01Ni4xMTIgNDM0LjM2NDAwMDAwMDAwMDAzIC01OC43MTZRNDMwLjA4MDAwMDAwMDAwMDA0IC02MS4zMiA0MjQuODcyMDAwMDAwMDAwMDcgLTYxLjMyUTQxOS42NjQwMDAwMDAwMDAwNCAtNjEuMzIgNDE1LjcxNiAtNTguODg0UTQxMS43NjgwMDAwMDAwMDAwMyAtNTYuNDQ4IDQwOS41IC01Mi4wOFE0MDcuMjMyIC00Ny43MTIgNDA3LjIzMiAtNDIuMFE0MDcuMjMyIC0zNi4yODgwMDAwMDAwMDAwMDQgNDA5LjUgLTMyLjAwNDAwMDAwMDAwMDAwNVE0MTEuNzY4MDAwMDAwMDAwMDMgLTI3LjcyMDAwMDAwMDAwMDAwMiA0MTUuODg0IC0yNS4yMDAwMDAwMDAwMDAwMDNRNDIwLjAwMDAwMDAwMDAwMDA2IC0yMi42OCA0MjUuMjA4IC0yMi42OFE0MzAuNDE2MDAwMDAwMDAwMDUgLTIyLjY4IDQzNC42MTYwMDAwMDAwMDAwNCAtMjUuMzY4MDAwMDAwMDAwMDAyUTQzOC44MTYwMDAwMDAwMDAwMyAtMjguMDU2IDQ0MC44MzIwMDAwMDAwMDAwNSAtMzIuNDI0TDQ2NS42OTYgLTI0LjAyNFE0NjAuODI0MDAwMDAwMDAwMDcgLTExLjQyNDAwMDAwMDAwMDAwMSA0NTAuMTU2MDAwMDAwMDAwMDYgLTQuNzA0MDAwMDAwMDAwMDAxUTQzOS40ODgwMDAwMDAwMDAwNiAyLjAxNiA0MjYuNTUyIDIuMDE2WiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik00NzMuNDI0MDAwMDAwMDAwMDQgMC4wVi0xMTcuNjAwMDAwMDAwMDAwMDFINDk5LjYzMjAwMDAwMDAwMDA2Vi01NS43NzZMNTI1LjAgLTg0LjBINTU1Ljc0NEw1MjMuOTkyMDAwMDAwMDAwMSAtNDcuNzEyTDU1Ny45MjgwMDAwMDAwMDAxIDAuMEg1MjcuNTIwMDAwMDAwMDAwMUw1MDcuMzYwMDAwMDAwMDAwMDcgLTI4LjcyOEw0OTkuNjMyMDAwMDAwMDAwMDYgLTIwLjE2VjAuMFoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNNTk5LjI1NjAwMDAwMDAwMDEgMi4wMTZRNTg2LjE1MiAyLjAxNiA1NzYuMDcyMDAwMDAwMDAwMSAtMy42MTJRNTY1Ljk5MjAwMDAwMDAwMDEgLTkuMjQgNTYwLjI4MDAwMDAwMDAwMDEgLTE5LjE1MlE1NTQuNTY4MDAwMDAwMDAwMSAtMjkuMDY0IDU1NC41NjgwMDAwMDAwMDAxIC00Mi4wUTU1NC41NjgwMDAwMDAwMDAxIC01NS4xMDQwMDAwMDAwMDAwMDYgNTYwLjM2NCAtNjUuMDE2UTU2Ni4xNjAwMDAwMDAwMDAxIC03NC45MjgwMDAwMDAwMDAwMSA1NzYuMjQgLTgwLjQ3MjAwMDAwMDAwMDAxUTU4Ni4zMiAtODYuMDE2IDU5OS41OTIwMDAwMDAwMDAxIC04Ni4wMTZRNjExLjUyMDAwMDAwMDAwMDEgLTg2LjAxNiA2MjEuMDk2IC04MC4zMDRRNjMwLjY3MiAtNzQuNTkyIDYzNi4zMDAwMDAwMDAwMDAxIC02My4zMzZRNjQxLjkyODAwMDAwMDAwMDEgLTUyLjA4MDAwMDAwMDAwMDAwNSA2NDEuOTI4MDAwMDAwMDAwMSAtMzUuMjhINTgxLjc4NDAwMDAwMDAwMDFRNTgyLjYyNCAtMjguMDU2IDU4Ny43NDggLTIzLjc3MlE1OTIuODcyMDAwMDAwMDAwMSAtMTkuNDg4IDU5OS45MjgwMDAwMDAwMDAxIC0xOS40ODhRNjA2LjE0NCAtMTkuNDg4IDYxMC40MjgwMDAwMDAwMDAxIC0yMi4yNTk5OTk5OTk5OTk5OThRNjE0LjcxMjAwMDAwMDAwMDEgLTI1LjAzMiA2MTYuMzkyIC0yOS4yMzIwMDAwMDAwMDAwMDNMNjM5LjU3NiAtMjEuMzM2MDAwMDAwMDAwMDAyUTYzNi4yMTYgLTEzLjQ0MDAwMDAwMDAwMDAwMSA2MzAuMDg0MDAwMDAwMDAwMSAtOC4yMzIwMDAwMDAwMDAwMDFRNjIzLjk1MiAtMy4wMjQgNjE2LjA1NiAtMC41MDRRNjA4LjE2MDAwMDAwMDAwMDEgMi4wMTYgNTk5LjI1NjAwMDAwMDAwMDEgMi4wMTZaTTU4Mi40NTYgLTUyLjc1Mkg2MTQuNTQ0MDAwMDAwMDAwMVE2MTMuODcyMDAwMDAwMDAwMSAtNTcuNzkyIDYxMS4zNTIwMDAwMDAwMDAxIC02MC43MzJRNjA4LjgzMjAwMDAwMDAwMDEgLTYzLjY3MjAwMDAwMDAwMDAwNCA2MDUuNDcyMDAwMDAwMDAwMSAtNjQuOTMyUTYwMi4xMTIwMDAwMDAwMDAxIC02Ni4xOTIwMDAwMDAwMDAwMSA1OTguNzUyMDAwMDAwMDAwMSAtNjYuMTkyMDAwMDAwMDAwMDFRNTk1LjU2MDAwMDAwMDAwMDEgLTY2LjE5MjAwMDAwMDAwMDAxIDU5Mi4wMzIgLTY0LjkzMlE1ODguNTA0IC02My42NzIwMDAwMDAwMDAwMDQgNTg1LjkwMDAwMDAwMDAwMDEgLTYwLjczMlE1ODMuMjk2IC01Ny43OTIgNTgyLjQ1NiAtNTIuNzUyWiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik02NDkuNjU2MDAwMDAwMDAwMSAwLjBWLTg0LjBINjc1Ljg2NFYtNjguMzc2UTY4MS4wNzIwMDAwMDAwMDAxIC03Ni4yNzIgNjg5LjEzNjAwMDAwMDAwMDEgLTgwLjMwNFE2OTcuMiAtODQuMzM2IDcwNS42MDAwMDAwMDAwMDAxIC04NC4zMzZWLTU4LjgwMDAwMDAwMDAwMDAwNFE2OTcuODcyMDAwMDAwMDAwMSAtNTguODAwMDAwMDAwMDAwMDA0IDY5MS4wNjgwMDAwMDAwMDAxIC01Ny4xMjAwMDAwMDAwMDAwMDVRNjg0LjI2NDAwMDAwMDAwMDEgLTU1LjQ0MDAwMDAwMDAwMDAwNSA2ODAuMDY0MDAwMDAwMDAwMSAtNTEuOTk2UTY3NS44NjQgLTQ4LjU1MiA2NzUuODY0IC00My4xNzZWMC4wWiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg0K") center/contain no-repeat;
  animation:word-in 1.25s 2.7s cubic-bezier(.16,1,.3,1) forwards}
/* the name arrives huge — the montage still playing inside its letters — and settles */
@keyframes word-in{from{opacity:1;transform:scale(7)}to{opacity:1;transform:none}}
/* everything waits (paused) until the first stills are ready */
.splash:not(.go),.splash:not(.go) *{animation-play-state:paused!important}
.mont{position:absolute;inset:0;z-index:1;width:100%;height:100%;display:block}
.splash.open .mont{opacity:0;transition:opacity .4s ease}
.wcv{position:absolute;inset:0;width:100%;height:100%;display:block}
.word-deck{position:absolute;inset:-60% -10%;animation:pan 1.2s 1.35s linear forwards}
.wpg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;filter:brightness(1.55) contrast(1.08) saturate(1.1);
  animation:show 1ms calc(var(--flip) * var(--i)) forwards}
@keyframes show{to{opacity:1;visibility:visible}}
@keyframes pan{from{transform:translateX(-5%) scale(1.1)}to{transform:translateX(5%) scale(1.1)}}
/* the letters settle into the wordmark's own colours: "tv" Amber, "tracker" White (the dark logo file, cropped to its word) */
.word-ink{position:absolute;top:-59.825%;left:-45.815%;width:145.758%;max-width:none;height:auto;opacity:0;
  animation:fade .45s 3.95s ease forwards}
.wi-l{display:none}
:root[data-theme="light"] .wi-d{display:none} :root[data-theme="light"] .wi-l{display:block}
.mark{position:absolute;left:50%;bottom:calc(100% + 62.2%);width:40.8%;height:auto;display:block;border-radius:22%;opacity:0;transform:translateX(-50%);
  animation:pop .5s 4.05s cubic-bezier(.22,1,.36,1) forwards}
:root[dir="rtl"] .mark{direction:ltr}
.word{margin-top:0}
@keyframes pop{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%)}}
/* Peek (Screen-lit, kit v6.1): eyes rise from behind the wall, glance, blink ("peek-splash-once", compressed) */
.mark .eyes{transform:translateY(49px);animation:eyes .45s 4.15s cubic-bezier(.2,.8,.2,1) forwards}
.mark .pupils{animation:look .7s 4.6s ease-in-out both}
.mark .lid{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0);animation:blink .2s 5.05s linear both}
@keyframes eyes{to{transform:none}}
@keyframes look{0%,100%{transform:none}35%,65%{transform:translate(-23.22px,4.69px)}}
@keyframes blink{0%,100%{transform:scaleY(0)}45%,55%{transform:scaleY(1)}}
.tag{position:absolute;left:0;right:0;top:calc(100% + clamp(18px,2.4vw,28px));margin:0;text-align:center;opacity:0;
  font-family:var(--display);font-size:clamp(17px,2vw,26px);font-weight:800;letter-spacing:-.01em;color:#f4f5f8;
  animation:rise .5s 4.3s cubic-bezier(.22,1,.36,1) forwards}
.tag em{font-style:normal;color:#ffc42e}
:root[data-theme="light"] .tag{color:#15161c} :root[data-theme="light"] .tag em{color:#9a6700}
:root[lang="ar"] .tag{font-weight:800;letter-spacing:0}
@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
/* exit: the room fades, the name flies into the header logo */
.flying .field{visibility:visible;transition:opacity .8s ease}
.sp-v{opacity:0}
.flying .spot{transition:transform .7s cubic-bezier(.65,0,.35,1),opacity .7s ease}
.flying .sp-v{opacity:1}
.flying .sp-s{opacity:0}
.landed .field{opacity:0}
.flying .tag{transition:opacity .2s ease;opacity:0!important;animation:none}
.flying .sk{opacity:0;transition:opacity .2s}

/* skip: small glass, readable on the dark deck and on the amber field */
.sk{position:absolute;z-index:5;top:calc(18px + env(safe-area-inset-top,0px));inset-inline-end:var(--gut);display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px 0 14px;border:0;border-radius:11px;cursor:pointer;
  font-size:13px;font-weight:700;color:#fff;background:rgba(0,0,0,.35);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.sk svg{width:15px;height:15px}
:root[dir="rtl"] .sk svg{transform:scaleX(-1)}
@media (hover:hover){.sk:hover{background:rgba(0,0,0,.5)}}
@media (max-width:640px){
.lockup{width:78vw}
.sk{top:14px;inset-inline-end:16px}
}
/* reduced motion: no intro (the script ends it at once; this stops it flashing first) */
@media (prefers-reduced-motion:reduce){.splash{display:none}}
/* already seen in this tab (set by the head script before the first paint) */
:root[data-splash="seen"] .splash{display:none}
</style>
