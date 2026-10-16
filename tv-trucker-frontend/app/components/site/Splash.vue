<script setup lang="ts">
import { splashCharacters } from "~/data/splash";

// The intro, on every visit — after the classic Marvel comic-flip intro, in our colours:
//  1. 18 characters flip past like comic pages, fast, smeared by motion blur (0 – 2.6s)
//  2. the tvtracker letters arrive with the same pages flipping inside them (2.35 – 3.0s)
//  3. the field turns amber, the letters go solid, the Peek mark and the slogan join (3.2 – 3.6s)
//  4. it holds ~3.5s, then fades into the page (gone at 7.5s)
// Smooth by construction: the amber tint, vignette and motion blur are baked into the images, so at run
// time the browser only moves pictures and changes opacity. Pure CSS from the first paint; the script only
// removes it at the end, or on Skip / Esc. Reduced motion: no intro.
const { t } = useI18n();
const { active } = useSplash();

const FLIP = 145; // ms per page
const OUT_AT = 7100; // ms: the brand card lifts away (keep in step with the CSS below)
const END = OUT_AT + 400;
const pages = splashCharacters.map((c, i) => ({ i, src: c.image, blur: c.blur }));

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
// The CSS ends with the "out" animation on the container; that's the cue to remove it.
// (scoped styles rename keyframes to "out-<hash>")
const onAnimEnd = (e: AnimationEvent) => {
  if (e.target === e.currentTarget && e.animationName.startsWith("out")) done();
};

onMounted(() => {
  if (!active.value) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  addEventListener("keydown", onKey);
  // In case the animation event never arrives (e.g. a background tab), never stay longer than the intro.
  fallback = setTimeout(done, Math.max(0, END + 400 - performance.now()));
});
onBeforeUnmount(() => {
  removeEventListener("keydown", onKey);
  clearTimeout(fallback);
});

// While it plays the page behind doesn't scroll and the hero holds its entrance (main.css).
// The stills are requested first thing and decoded before their page flips (a tiny inline script in <head>),
// so no page shows up late.
const sources = [...pages.map((p) => p.src), ...pages.map((p) => p.blur)];
useHead({
  htmlAttrs: { class: computed(() => (active.value ? "splashing" : "")) },
  link: computed(() =>
    active.value ? pages.map((p, i) => ({ rel: "preload", as: "image", href: p.src, fetchpriority: i < 6 ? "high" : "auto" })) : [],
  ),
  script: computed(() =>
    active.value
      ? [{ key: "splash-decode", tagPosition: "head", innerHTML: `window.__splash=${JSON.stringify(sources)}.map(function(s){var i=new Image();i.src=s;i.decode&&i.decode().catch(function(){});return i})` }]
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
    <!-- 1. the deck: each page flips in over the last; its blurred copy fades as it lands -->
    <div class="deck" aria-hidden="true">
      <div v-for="p in pages" :key="p.i" class="pg" :style="{ '--i': p.i, zIndex: p.i + 1 }">
        <img :src="p.src" alt="" decoding="sync">
        <img class="mb" :src="p.blur" alt="" decoding="sync">
      </div>
      <i class="dim" />
    </div>

    <!-- 3. the amber field -->
    <i class="field" aria-hidden="true" />

    <!-- 2 + 3. the name: the same pages flipping inside the letters, then solid -->
    <div class="lockup">
      <img class="mark" src="/images/brand/peek-icon.svg" alt="" width="96" height="96">
      <div class="word" role="img" aria-label="tvtracker">
        <div class="word-deck">
          <img v-for="p in pages" :key="p.i" class="wpg" :src="p.src" alt="" :style="{ '--i': p.i, zIndex: p.i + 1 }">
        </div>
        <i class="word-ink" />
      </div>
      <p class="tag">{{ t("splash.taglineA") }} {{ t("splash.taglineB") }}</p>
    </div>

    <button type="button" class="sk" :aria-label="t('splash.skipLabel')" @click="skip">
      {{ t("splash.skip") }}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5l7 7-7 7M13 5l7 7-7 7" /></svg>
    </button>
  </div>
</template>

<style scoped>
/* Timeline (ms): flips 0–2610 · letters in 2350–2950 · amber 3200–3550 · mark 3450 · slogan 3600 ·
   hold to 7100 · out 7100–7500. Only transform and opacity animate. */
.splash{position:fixed;inset:0;z-index:200;overflow:hidden;background:#000;color:#fff;
  animation:out .4s 7.1s ease forwards}
.splash.leaving{animation:out .3s ease forwards}
@keyframes out{to{opacity:0;visibility:hidden}}

/* 1 · the deck. A page swings in from the right like a turning comic page and lands; the motion-blurred
   copy on top fades out as it lands. The next page lands on top. */
/* explicit layers: the deck (with its own 18 stacked pages) under the field, the name above both */
.deck{position:absolute;z-index:0;inset:0;perspective:1400px}
.pg{position:absolute;inset:0;opacity:0;transform-origin:0 50%;will-change:transform,opacity;
  animation:flip calc(var(--flip) * 1.6) calc(var(--flip) * var(--i)) cubic-bezier(.2,.7,.2,1) forwards}
.pg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pg .mb{animation:unblur calc(var(--flip) * 1.2) calc(var(--flip) * var(--i)) ease-out forwards}
@keyframes flip{
  0%{opacity:1;transform:translateX(55%) rotateY(-38deg) scaleX(1.25)}
  100%{opacity:1;transform:none}}
@keyframes unblur{0%{opacity:1}100%{opacity:0}}
.dim{position:absolute;inset:0;z-index:30;background:#000;opacity:0;animation:fade-to .6s 2.4s ease forwards}
@keyframes fade-to{to{opacity:.6}}

/* 3 · the amber field, with a vignette like the stills */
.field{position:absolute;z-index:1;inset:0;opacity:0;background:radial-gradient(ellipse at center,#ffc42e 0%,#f2a900 58%,#a85f00 100%);
  animation:fade .35s 3.2s ease forwards}
@keyframes fade{to{opacity:1}}

/* 2 + 3 · the name. The letters are a mask (the brand kit's wordmark); behind it, first the same flipping
   pages, then solid ink. The mark sits above, the slogan below, so the word stays centred. */
.lockup{position:absolute;z-index:2;left:50%;top:50%;width:min(80vw,820px);transform:translate(-50%,-50%)}
.word{position:relative;width:100%;aspect-ratio:704/120;opacity:0;
  -webkit-mask:url("/images/brand/peek-wordmark.svg") center/contain no-repeat;mask:url("/images/brand/peek-wordmark.svg") center/contain no-repeat;
  animation:word-in .6s 2.35s cubic-bezier(.22,1,.36,1) forwards}
@keyframes word-in{from{opacity:0;transform:scale(1.3)}to{opacity:1;transform:none}}
.word-deck{position:absolute;inset:-60% -10%;animation:pan 1.6s 2.35s linear forwards}
.wpg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;
  animation:show 1ms calc(var(--flip) * var(--i)) forwards}
@keyframes show{to{opacity:1}}
@keyframes pan{from{transform:translateX(-5%) scale(1.1)}to{transform:translateX(5%) scale(1.1)}}
.word-ink{position:absolute;inset:0;background:#120d02;opacity:0;animation:fade .35s 3.25s ease forwards}

.mark{position:absolute;left:50%;bottom:calc(100% + clamp(18px,3vw,30px));width:clamp(56px,7vw,96px);height:auto;border-radius:22%;opacity:0;transform:translateX(-50%);
  animation:pop .55s 3.45s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes pop{from{opacity:0;transform:translateX(-50%) scale(.5)}to{opacity:1;transform:translateX(-50%) scale(1)}}
.tag{position:absolute;left:0;right:0;top:calc(100% + clamp(16px,2.6vw,28px));margin:0;text-align:center;opacity:0;
  font-family:var(--display);font-size:clamp(18px,2.6vw,34px);font-weight:800;letter-spacing:-.02em;color:#120d02;
  animation:rise .5s 3.6s cubic-bezier(.22,1,.36,1) forwards}
:root[lang="ar"] .tag{font-weight:700;letter-spacing:0}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

/* skip: small glass, readable on the dark deck and on the amber field */
.sk{position:absolute;z-index:5;top:18px;inset-inline-end:var(--gut);display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px 0 14px;border:0;border-radius:11px;cursor:pointer;
  font-size:13px;font-weight:700;color:#fff;background:rgba(0,0,0,.35);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.sk svg{width:15px;height:15px}
:root[dir="rtl"] .sk svg{transform:scaleX(-1)}
@media (hover:hover){.sk:hover{background:rgba(0,0,0,.5)}}

@media (max-width:640px){
  .lockup{width:86vw}
  .sk{top:14px;inset-inline-end:16px}
}
/* reduced motion: no intro (the script ends it at once; this stops it flashing first) */
@media (prefers-reduced-motion:reduce){.splash{display:none}}
</style>
