<script setup lang="ts">
// "Say hello." — contact, as a letter: the address up top with Peek as the stamp, a perforated fold, then a short
// form that hands your message to your email app, ready to send (the site has no backend). Peek runs the show:
//  · it reads along — its eyes follow the caret as you type, and every few keystrokes a ripple says it's listening
//  · the focused field gets a slow amber edge running round it
//  · Send: the message folds into a paper plane that flies, leaving a dotted trail, into the address; the address
//    ripples, Peek is thrilled, then your email app opens
//  · Send with nothing written: the field shakes and Peek looks confused
//  · Copy: the address ripples letter by letter
// Reduced motion: no flight, no ripples; Send opens the email app straight away.
const { t } = useI18n();
const { links } = useAppConfig();
const chars = computed(() => [...links.email]);

const name = ref("");
const message = ref("");
const tried = ref(false);
const sent = ref(false);
const missing = computed(() => tried.value && !message.value.trim());
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const card = ref<HTMLElement | null>(null);
const ta = ref<HTMLTextAreaElement | null>(null);
const addr = ref<HTMLElement | null>(null);
const plane = ref<HTMLElement | null>(null);
const sheet = ref<HTMLElement | null>(null);

// ---- in view: the card plays its entrance once ----
const live = ref(false);
let io: IntersectionObserver | null = null;
onMounted(() => {
  if (!("IntersectionObserver" in window) || !card.value) return void (live.value = true);
  io = new IntersectionObserver(
    ([e]) => {
      if (!e?.isIntersecting) return;
      io?.disconnect();
      live.value = true;
    },
    { threshold: 0.15 },
  );
  io.observe(card.value);
});

// ---- Peek: where it looks, how it feels, its ripples ----
const look = ref<{ x: number; y: number } | null>(null);
const mood = ref<"thrilled" | "confused" | null>(null);
const moodN = ref(0);
let moodT: ReturnType<typeof setTimeout> | undefined;
function feel(f: "thrilled" | "confused", ms: number) {
  mood.value = f;
  moodN.value++;
  clearTimeout(moodT);
  moodT = setTimeout(() => (mood.value = null), ms);
}
const rings = ref<{ id: number; big: boolean }[]>([]);
let ringId = 0, lastRing = 0;
function ripple(big = false) {
  if (still()) return;
  const now = performance.now();
  if (!big && now - lastRing < 260) return;
  lastRing = now;
  rings.value.push({ id: ++ringId, big });
}
const ringDone = (id: number) => (rings.value = rings.value.filter((r) => r.id !== id));

// The caret's place on screen: a hidden copy of the field, laid out the same, with a marker where the caret is.
const COPY = ["boxSizing", "width", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent", "letterSpacing", "wordSpacing", "direction", "tabSize"] as const;
function caret(el: HTMLInputElement | HTMLTextAreaElement) {
  const cs = getComputedStyle(el), m = document.createElement("div");
  for (const k of COPY) m.style[k] = cs[k];
  Object.assign(m.style, { position: "absolute", visibility: "hidden", top: "0", left: "-9999px", overflow: "hidden", whiteSpace: el.tagName === "TEXTAREA" ? "pre-wrap" : "pre", overflowWrap: "break-word" });
  const at = el.selectionEnd ?? el.value.length;
  m.textContent = el.value.slice(0, at);
  const mark = document.createElement("span");
  mark.textContent = "​";
  m.appendChild(mark);
  document.body.appendChild(m);
  const r = el.getBoundingClientRect(), lh = parseFloat(cs.lineHeight) || 24;
  const x = r.left + mark.offsetLeft - el.scrollLeft, y = r.top + mark.offsetTop - el.scrollTop + lh / 2;
  m.remove();
  return { x: Math.min(r.right - 12, Math.max(r.left + 12, x)), y: Math.min(r.bottom - 8, Math.max(r.top + 8, y)) };
}
let caretRaf = 0;
function follow(e: Event) {
  const el = e.target as HTMLInputElement | HTMLTextAreaElement;
  cancelAnimationFrame(caretRaf);
  caretRaf = requestAnimationFrame(() => (look.value = caret(el)));
}
function typed(e: Event) {
  follow(e);
  ripple();
  if (missing.value && message.value.trim()) tried.value = false;
}
const unfocus = () => {
  if (!flying) look.value = null;
};

// ---- Copy: the address ripples ----
const copied = ref(false);
const wave = ref(false);
let copiedT: ReturnType<typeof setTimeout> | undefined;
function waveAddr() {
  wave.value = false;
  requestAnimationFrame(() => requestAnimationFrame(() => (wave.value = true)));
}
async function copy() {
  try {
    await navigator.clipboard.writeText(links.email);
  } catch {
    return;
  }
  copied.value = true;
  waveAddr();
  ripple(true);
  clearTimeout(copiedT);
  copiedT = setTimeout(() => (copied.value = false), 1800);
}

// ---- Send: fold, fly, land ----
const shaking = ref(false);
const sending = ref(false);
const dots = ref<{ x: number; y: number; d: number }[]>([]);
let flying = false;
const mailto = () => {
  const text = message.value.trim(), who = name.value.trim();
  const body = who ? `${text}\n\n— ${who}` : text;
  location.href = `mailto:${links.email}?subject=${encodeURIComponent("TVTracker")}&body=${encodeURIComponent(body)}`;
  sent.value = true;
};

async function send() {
  tried.value = true;
  if (!message.value.trim()) {
    shaking.value = false;
    requestAnimationFrame(() => requestAnimationFrame(() => (shaking.value = true)));
    if (ta.value) look.value = caret(ta.value);
    feel("confused", 1700);
    ta.value?.focus();
    return;
  }
  if (flying) return;
  if (still() || !card.value || !ta.value || !addr.value || !plane.value || !sheet.value) return mailto();
  flying = true;
  sending.value = true;
  const C = card.value.getBoundingClientRect(), T = ta.value.getBoundingClientRect(), A = addr.value.getBoundingClientRect();

  // 1 · the message folds into a sheet of paper
  const sh = sheet.value;
  Object.assign(sh.style, { left: `${T.left - C.left}px`, top: `${T.top - C.top}px`, width: `${T.width}px`, height: `${T.height}px` });
  const fw = 64, fh = 44;
  await sh.animate(
    [
      { opacity: 0, transform: "none", borderRadius: "14px" },
      { opacity: 1, transform: "none", borderRadius: "14px", offset: 0.2 },
      { opacity: 1, transform: `translate(${(T.width - fw) / 2}px,${(T.height - fh) / 2}px) scale(${fw / T.width},${fh / T.height})`, borderRadius: "4px" },
    ],
    { duration: 560, easing: "cubic-bezier(.6,0,.2,1)", fill: "forwards" },
  ).finished;

  // 2 · it becomes a plane and flies along a curve into the address, a dotted trail behind it
  const sx = T.left + T.width / 2 - C.left, sy = T.top + T.height / 2 - C.top;
  const ex = A.left + A.width / 2 - C.left, ey = A.top + A.height / 2 - C.top;
  const cx = (sx + ex) / 2, cy = Math.min(sy, ey) - Math.max(150, Math.abs(ex - sx) * 0.4);
  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const pt = (u: number) => ({ x: (1 - u) ** 2 * sx + 2 * (1 - u) * u * cx + u * u * ex, y: (1 - u) ** 2 * sy + 2 * (1 - u) * u * cy + u * u * ey });
  const ang = (u: number) => (Math.atan2(2 * (1 - u) * (cy - sy) + 2 * u * (ey - cy), 2 * (1 - u) * (cx - sx) + 2 * u * (ex - cx)) * 180) / Math.PI;
  const N = 30, DUR = 1100;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N, u = ease(f), p = pt(u);
    const s = f < 0.12 ? 0.55 + (f / 0.12) * 0.45 : 1 - (f - 0.12) * 0.5;
    frames.push({ offset: f, opacity: f > 0.9 ? (1 - f) * 10 : 1, transform: `translate(${p.x - 22}px,${p.y - 22}px) rotate(${ang(u)}deg) scale(${s})` });
  }
  dots.value = Array.from({ length: 16 }, (_, i) => {
    const f = (i + 1) / 18;
    return { ...pt(ease(f)), d: f * DUR };
  });
  sh.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
  ripple(true);
  const fl = plane.value.animate(frames, { duration: DUR, easing: "linear", fill: "forwards" });
  // Peek watches it come
  const watchIt = () => {
    if (!flying || !plane.value) return;
    const r = plane.value.getBoundingClientRect();
    look.value = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    requestAnimationFrame(watchIt);
  };
  requestAnimationFrame(watchIt);
  await fl.finished;

  // 3 · it lands: the address ripples, Peek is thrilled, the email app opens
  waveAddr();
  ripple(true);
  setTimeout(() => ripple(true), 160);
  feel("thrilled", 2000);
  look.value = null;
  flying = false;
  await wait(380);
  mailto();
  await wait(500);
  sending.value = false;
  fl.cancel();
  sh.getAnimations().forEach((a) => a.cancel());
  await wait(900);
  dots.value = [];
}

onBeforeUnmount(() => {
  io?.disconnect();
  clearTimeout(copiedT);
  clearTimeout(moodT);
  cancelAnimationFrame(caretRaf);
  flying = false;
});
</script>

<template>
  <section id="contact" class="sec contact" aria-labelledby="ct-h">
    <div class="wrap">
      <div class="sec-h c rv">
        <span class="kick">{{ t("contact.kick") }}</span>
        <h2 id="ct-h">{{ t("contact.titleLine") }}<br><em>{{ t("contact.titleEm") }}</em></h2>
        <p>{{ t("contact.lede") }}</p>
      </div>

      <!-- (the reveal adds a class to .rv, so the reactive classes live on the card inside it) -->
      <div class="rv">
        <div ref="card" class="cc" :class="{ live, sending }">
          <i class="wash" aria-hidden="true" />
          <!-- the head of the letter: who it goes to, and Peek as the stamp -->
          <div class="head">
            <div class="to">
              <span class="ch">{{ t("contact.mailTitle") }}</span>
              <a ref="addr" class="addr" :class="{ wave }" :href="`mailto:${links.email}`" dir="ltr" :aria-label="links.email">
                <span v-for="(c, i) in chars" :key="i" :style="{ '--i': i }" aria-hidden="true">{{ c }}</span>
              </a>
              <button type="button" class="cp" :class="{ done: copied }" :aria-label="t('contact.copy')" @click="copy">
                <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></svg>
                <UiIconCheck v-else />
                <span>{{ copied ? t("contact.copied") : t("contact.copyShort") }}</span>
              </button>
            </div>
            <div class="pkw">
              <i class="idle" aria-hidden="true" /><i class="idle i2" aria-hidden="true" />
              <i v-for="r in rings" :key="r.id" class="ring" :class="{ big: r.big }" aria-hidden="true" @animationend="ringDone(r.id)" />
              <!-- the postmark, stamped over the corner -->
              <svg class="pm" :class="{ thump: wave }" viewBox="0 0 120 64" fill="none" aria-hidden="true">
                <circle cx="32" cy="32" r="26" stroke-dasharray="3 4" />
                <circle cx="32" cy="32" r="19" />
                <path d="M62 18c8-5 14 5 22 0s14 5 22 0s10 3 12 2M62 32c8-5 14 5 22 0s14 5 22 0s10 3 12 2M62 46c8-5 14 5 22 0s14 5 22 0s10 3 12 2" />
              </svg>
              <div class="pkin" :class="{ hide: mood }">
                <span class="stamp">
                  <SitePeek class="pk" :size="76" :at="look" />
                  <img v-if="mood" :key="moodN" class="mood" :class="`m-${mood}`" :src="`/images/feelings-v6/${mood}.svg`" alt="" width="76" height="76">
                </span>
              </div>
            </div>
          </div>

          <!-- the fold -->
          <i class="fold" aria-hidden="true" />

          <!-- the letter -->
          <form class="form" novalidate @submit.prevent="send">
            <label class="fld">
              <span class="lb">{{ t("contact.name") }} <small>{{ t("contact.optional") }}</small></span>
              <span class="fx">
                <input v-model="name" type="text" name="name" autocomplete="name" @input="typed" @click="follow" @keyup="follow" @focus="follow" @blur="unfocus">
              </span>
            </label>
            <label class="fld grow">
              <span class="lb">{{ t("contact.message") }}</span>
              <span class="fx grow" :class="{ shake: shaking }">
                <textarea
                  ref="ta"
                  v-model="message"
                  name="message"
                  rows="6"
                  required
                  :aria-invalid="missing"
                  :aria-describedby="missing ? 'ct-err' : undefined"
                  @input="typed"
                  @click="follow"
                  @keyup="follow"
                  @focus="follow"
                  @blur="unfocus"
                />
              </span>
              <small v-if="missing" id="ct-err" class="err">{{ t("contact.needMessage") }}</small>
            </label>
            <div class="send">
              <button type="submit" class="btn pri" :disabled="sending">
                <span>{{ t("contact.send") }}</span>
                <svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 3L10.5 13.5" /><path d="M21 3l-6.5 18-4-7.5L3 9.5z" /></svg>
              </button>
              <p class="note" aria-live="polite">{{ sent ? t("contact.sent", { email: links.email }) : t("contact.note") }}</p>
            </div>
          </form>

          <!-- the flight: the folded message, the plane, the trail -->
          <div ref="sheet" class="sheet" aria-hidden="true" />
          <svg class="trail" aria-hidden="true">
            <circle v-for="(d, i) in dots" :key="i" class="dot" :cx="d.x" :cy="d.y" r="2.6" :style="{ animationDelay: `${d.d}ms` }" />
          </svg>
          <div ref="plane" class="plane" aria-hidden="true">
            <svg viewBox="0 0 44 44"><path class="pw" d="M4 22L40 6 30 38 21 26z" /><path class="pf" d="M40 6L21 26l-2 11 6-8" /><path class="pe" d="M40 6L21 26" /></svg>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* one card, a letter: who it goes to and the stamp up top, a fold, then the letter itself */
.cc{position:relative;max-width:780px;margin:52px auto 0;border-radius:30px;overflow:hidden;isolation:isolate;
  background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow)}
.wash{position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(46% 60% at var(--ax,85%) 0%,rgba(255,196,46,.2),rgba(255,196,46,0) 100%),radial-gradient(50% 40% at var(--bx,10%) 100%,rgba(91,108,255,.1),rgba(91,108,255,0) 100%);
  animation:drift 14s ease-in-out infinite alternate}
:root[data-theme="light"] .wash{background:radial-gradient(46% 60% at var(--ax,85%) 0%,rgba(255,196,46,.28),rgba(255,196,46,0) 100%),radial-gradient(50% 40% at var(--bx,10%) 100%,rgba(120,150,255,.1),rgba(120,150,255,0) 100%)}
:root[dir="rtl"] .wash{transform:scaleX(-1)}
@property --ax{syntax:"<percentage>";inherits:false;initial-value:85%}
@property --bx{syntax:"<percentage>";inherits:false;initial-value:10%}
@keyframes drift{0%{--ax:92%;--bx:6%}100%{--ax:70%;--bx:30%}}

/* ---- the head: who it goes to, and the stamp ---- */
.head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:38px 44px 30px}
.to{flex:1;min-width:0}
.ch{display:block;font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
:root[lang="ar"] .ch{letter-spacing:0;font-size:14px}
.to .ch{opacity:0}
.live .to .ch{animation:up .6s var(--ease) .2s forwards}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

/* the address, letter by letter: rises in, lifts on hover, ripples on copy and when the plane lands */
.addr{display:flex;flex-wrap:wrap;justify-content:flex-start;margin-top:10px;font-family:var(--display);font-size:clamp(26px,3.4vw,38px);font-weight:800;line-height:1.15;letter-spacing:-.025em;color:var(--heading)}
:root[dir="rtl"] .addr{justify-content:flex-end}
.addr span{display:inline-block;white-space:pre;opacity:0;transform:translateY(.6em);transition:transform .3s cubic-bezier(.34,1.56,.64,1),color .3s;transition-delay:calc(var(--i) * 14ms)}
.live .addr span{animation:letter .6s cubic-bezier(.34,1.56,.64,1) calc(.3s + var(--i) * 28ms) forwards}
@keyframes letter{to{opacity:1;transform:none}}
@media (hover:hover){.live .addr:hover span{transform:translateY(-3px);color:var(--accent)}}
.live .addr.wave span{opacity:1;animation:wave .7s ease calc(var(--i) * 30ms)}
@keyframes wave{0%,100%{transform:none;color:var(--heading)}35%{transform:translateY(-9px) scale(1.12);color:var(--amber)}}
:root[data-theme="light"] .addr.wave span{animation-name:waveL}
@keyframes waveL{0%,100%{transform:none;color:var(--heading)}35%{transform:translateY(-9px) scale(1.12);color:var(--accent)}}

.cp{display:inline-flex;align-items:center;gap:7px;height:38px;margin-top:16px;padding:0 14px;border:0;border-radius:11px;cursor:pointer;font-size:14px;font-weight:800;opacity:0;
  color:var(--text);background:rgba(var(--glass),.08);box-shadow:inset 0 0 0 1px var(--line);transition:background .25s,color .25s,transform .15s}
.live .cp{animation:up .6s var(--ease) .85s forwards}
.cp:active{transform:scale(.94)}
.cp svg{width:16px;height:16px}
.cp.done{color:var(--ink);background:var(--amber);box-shadow:none}
.cp.done svg{animation:tick .4s cubic-bezier(.34,1.56,.64,1)}
@keyframes tick{from{transform:scale(0) rotate(-30deg)}}
@media (hover:hover){.cp:not(.done):hover{background:rgba(var(--glass),.14)}}

/* Peek, the stamp: perforated paper, a little crooked, slapped on; its ripples, its moods, and a postmark */
.pkw{position:relative;flex:none;width:96px;height:96px;margin-top:-4px}
.pkin{position:relative;z-index:2;opacity:0;transform:translateY(-30px) rotate(-14deg) scale(1.4)}
.live .pkin{animation:stampIn .7s cubic-bezier(.34,1.56,.64,1) .15s forwards}
@keyframes stampIn{to{opacity:1;transform:rotate(4deg)}}
:root[dir="rtl"] .live .pkin{animation-name:stampInR}
@keyframes stampInR{to{opacity:1;transform:rotate(-4deg)}}
.stamp{position:relative;display:block;width:96px;height:96px;padding:5px;border:5px dotted var(--surface);border-radius:4px;background:#f6efdf;
  box-shadow:0 14px 26px -14px rgba(0,0,0,.6)}
:root[data-theme="light"] .stamp{box-shadow:0 14px 26px -14px rgba(16,18,27,.4)}
.pk{border-radius:6px;transition:opacity .15s,transform .25s}
.pkin.hide .pk{opacity:0;transform:scale(.85)}
.mood{position:absolute;left:5px;top:5px;z-index:3;width:76px;height:76px;border-radius:6px;pointer-events:none}
.m-thrilled{animation:yay .8s cubic-bezier(.34,1.56,.64,1)}
.m-confused{animation:huh .5s ease-in-out 2}
@keyframes yay{0%{transform:scale(.6) rotate(-10deg)}50%{transform:scale(1.15) rotate(6deg) translateY(-8px)}100%{transform:none}}
@keyframes huh{0%,100%{transform:none}25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}
.pm{position:absolute;z-index:3;top:46px;inset-inline-end:58px;width:120px;height:64px;pointer-events:none;stroke:var(--amber);stroke-width:2;stroke-linecap:round;opacity:0;transform:rotate(-12deg) scale(1.5)}
:root[dir="rtl"] .pm{transform:scaleX(-1) rotate(-12deg) scale(1.5)}
.live .pm{animation:pmIn .35s cubic-bezier(.5,0,.75,0) .85s forwards}
@keyframes pmIn{to{opacity:.55;transform:rotate(-12deg)}}
:root[dir="rtl"] .live .pm{animation-name:pmInR}
@keyframes pmInR{to{opacity:.55;transform:scaleX(-1) rotate(-12deg)}}
.live .pm.thump{opacity:.55;animation:pmThump .5s ease}
@keyframes pmThump{0%{opacity:.55;transform:rotate(-12deg)}40%{opacity:.95;transform:rotate(-12deg) scale(1.12)}100%{opacity:.55;transform:rotate(-12deg)}}
:root[dir="rtl"] .live .pm.thump{animation-name:pmThumpR}
@keyframes pmThumpR{0%{opacity:.55;transform:scaleX(-1) rotate(-12deg)}40%{opacity:.95;transform:scaleX(-1) rotate(-12deg) scale(1.12)}100%{opacity:.55;transform:scaleX(-1) rotate(-12deg)}}
/* listening: two slow rings when idle, a quick amber one on every few keystrokes */
.idle,.ring{position:absolute;z-index:1;left:50%;top:50%;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:14px;pointer-events:none}
.idle{box-shadow:0 0 0 1px rgba(255,196,46,.35);opacity:0}
.live .idle{animation:idle 4.2s ease-out 1.2s infinite}
.live .idle.i2{animation-delay:3.3s}
@keyframes idle{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.8)}}
.ring{box-shadow:0 0 0 2px rgba(255,196,46,.7);animation:ring .9s cubic-bezier(.2,.7,.3,1) forwards}
.ring.big{box-shadow:0 0 0 3px var(--amber);animation-name:ringBig;animation-duration:1.2s}
@keyframes ring{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.7)}}
@keyframes ringBig{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.3)}}

/* the fold: a perforated line that draws itself across */
.fold{display:block;height:2px;margin:0 44px;background:repeating-linear-gradient(90deg,var(--line) 0 8px,transparent 8px 14px);transform:scaleX(0);transform-origin:0 50%}
:root[dir="rtl"] .fold{transform-origin:100% 50%}
:root[data-theme="light"] .fold{background:repeating-linear-gradient(90deg,rgba(16,18,27,.16) 0 8px,transparent 8px 14px)}
.live .fold{animation:fold .8s var(--ease) .45s forwards}
@keyframes fold{to{transform:none}}

/* ---- the form ---- */
.form{position:relative;z-index:1;display:flex;flex-direction:column;gap:18px;padding:30px 44px 38px}
.form > *{opacity:0}
.live .form > *{animation:up .6s var(--ease) forwards}
.live .form > :nth-child(1){animation-delay:.6s}
.live .form > :nth-child(2){animation-delay:.68s}
.live .form > :nth-child(3){animation-delay:.76s}
.lb{display:block;margin-bottom:8px;font-size:14px;font-weight:700;color:var(--dim);transition:color .2s}
.fld:focus-within .lb{color:var(--accent)}
.lb small{font-weight:500;color:var(--muted)}
.fld{display:flex;flex-direction:column}
.grow{flex:1;display:flex;flex-direction:column}
/* the focused field: an amber light runs round its edge */
.fx{position:relative;display:block;border-radius:14px}
.fx::before{content:"";position:absolute;inset:-2px;z-index:1;border-radius:16px;padding:2px;pointer-events:none;opacity:0;
  background:conic-gradient(from var(--a),rgba(255,196,46,0) 0 55%,rgba(255,196,46,.9) 78%,#fff1bf 86%,rgba(255,196,46,0) 94%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;
  transition:opacity .35s;animation:spin 2.6s linear infinite;animation-play-state:paused}
.fx:focus-within::before{opacity:1;animation-play-state:running}
@property --a{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes spin{to{--a:360deg}}
.fx input,.fx textarea{display:block;width:100%;padding:14px 16px;border:0;border-radius:14px;font:inherit;font-size:16px;line-height:1.5;color:var(--text);
  background:rgba(var(--glass),.05);box-shadow:inset 0 0 0 1px var(--line);transition:box-shadow .25s,background .25s,color .3s}
.fx textarea{flex:1;min-height:170px;resize:vertical;
  background-image:linear-gradient(transparent calc(100% - 1px),rgba(var(--glass),.09) 0);background-size:100% 24px;background-position:0 14px;background-attachment:local}
.fx input:focus,.fx textarea:focus{outline:none;background:rgba(var(--glass),.07);box-shadow:inset 0 0 0 1px rgba(255,196,46,.35)}
:root[data-theme="light"] .fx input,:root[data-theme="light"] .fx textarea{background:var(--bg)}
.fx textarea[aria-invalid="true"]{box-shadow:inset 0 0 0 2px #ff5c5c}
.shake{animation:shake .5s cubic-bezier(.36,.07,.19,.97)}
@keyframes shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-8px)}40%,60%{transform:translateX(8px)}}
.err{display:block;margin-top:8px;font-size:13.5px;font-weight:700;color:#ff6b6b;animation:up .35s var(--ease)}
:root[data-theme="light"] .err{color:#c62828}
/* while the message folds away, the words fade out of the field */
.sending .fx textarea{color:transparent}

.send{display:flex;align-items:center;flex-wrap:wrap;gap:12px 18px}
.send .btn{overflow:hidden}
.send .btn:disabled{cursor:default}
.pl{width:18px;height:18px;transition:transform .35s cubic-bezier(.34,1.56,.64,1)}
:root[dir="rtl"] .pl{transform:scaleX(-1)}
@media (hover:hover){
  .send .btn:not(:disabled):hover .pl{animation:hover 1.1s ease-in-out infinite}
  :root[dir="rtl"] .send .btn:not(:disabled):hover .pl{animation-name:hoverR}
}
@keyframes hover{0%,100%{transform:none}50%{transform:translate(3px,-3px) rotate(-6deg)}}
@keyframes hoverR{0%,100%{transform:scaleX(-1)}50%{transform:scaleX(-1) translate(3px,-3px) rotate(-6deg)}}
.sending .pl{animation:takeoff .5s cubic-bezier(.5,0,.75,0) forwards}
:root[dir="rtl"] .sending .pl{animation-name:takeoffR}
@keyframes takeoff{to{transform:translate(28px,-28px);opacity:0}}
@keyframes takeoffR{to{transform:scaleX(-1) translate(28px,-28px);opacity:0}}
.note{flex:1 1 200px;font-size:13.5px;line-height:1.5;color:var(--muted)}

/* ---- the flight ---- */
.sheet{position:absolute;z-index:5;left:0;top:0;opacity:0;pointer-events:none;transform-origin:0 0;
  background:linear-gradient(160deg,#fff 0 48%,#eceef4 50%,#fff 52%);box-shadow:0 10px 26px -10px rgba(0,0,0,.5)}
.trail{position:absolute;z-index:4;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.dot{fill:var(--amber);opacity:0;transform-box:fill-box;transform-origin:center;animation:dot 1.3s ease-out forwards}
@keyframes dot{0%{opacity:0;transform:scale(0)}10%{opacity:1;transform:scale(1.3)}25%{transform:scale(1)}60%{opacity:.9}100%{opacity:0;transform:scale(.6)}}
.plane{position:absolute;z-index:6;left:0;top:0;width:44px;height:44px;opacity:0;pointer-events:none;filter:drop-shadow(0 8px 10px rgba(0,0,0,.35))}
.plane svg{display:block;width:100%;height:100%;overflow:visible}
.pw{fill:#fff;stroke:#d6dae6;stroke-width:1;stroke-linejoin:round}
.pf{fill:#e4e7ef;stroke:#d6dae6;stroke-width:1;stroke-linejoin:round}
.pe{fill:none;stroke:#c3c8d6;stroke-width:1}

@media (max-width:900px){
  .cc{margin-top:40px}
}
@media (max-width:640px){
  .cc{border-radius:26px}
  /* the stamp goes up into the corner, the address gets the whole line */
  .head{flex-wrap:wrap;padding:24px 20px 22px;gap:4px}
  .pkw{order:-1;margin:0 0 -6px;margin-inline-start:auto;width:77px;height:77px}
  .pkin{transform-origin:0 0}
  .stamp{transform:scale(.8);transform-origin:0 0}
  .idle,.ring{width:77px;height:77px;margin:-38px 0 0 -38px}
  .to{flex-basis:100%}
  .addr{flex-wrap:nowrap;font-size:clamp(22px,7vw,28px)}
  .pm{display:none}
  .fold{margin:0 20px}
  .form{padding:22px 20px 24px}
  .send .btn{width:100%;height:54px}
}
@media (prefers-reduced-motion:reduce){
  .pkin{opacity:1;transform:rotate(4deg)}
  .to .ch,.addr span,.cp,.form > *{opacity:1;transform:none}
  .fold{transform:none}
  .pm{opacity:.55;transform:rotate(-12deg)}
  .idle,.fx::before{display:none}
}
</style>
