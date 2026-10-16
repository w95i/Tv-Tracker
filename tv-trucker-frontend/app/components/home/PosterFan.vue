<script setup lang="ts">
import { fanSlots } from "~/data/landing";
import { heroTitles } from "~/data/hero-titles";

// The phone inside a fan of posters, which turns like a carousel: pick a poster (or use the
// arrows, arrow keys or a swipe) and the fan rotates it behind the phone while the phone
// switches to that title's page. It opens on the title that starts behind the phone.
// Always laid out left-to-right, even in Arabic.
const { t, locale } = useI18n();
const { afterSplash } = useSplash();

const N = heroTitles.length; // 11: five each side + one behind the phone
const focus = ref(Math.floor(N / 2));
const ready = ref(false); // entrance animation finished; from here on posters move by transition
const jumping = ref(new Set<number>());
const dirSign = ref(1);

// Place of title i relative to the phone: 0 = behind it, -5…-1 left, 1…5 right.
const placeOf = (i: number, f = focus.value) => {
  let r = (((i - f) % N) + N) % N;
  if (r > N / 2) r -= N;
  return r;
};

const posters = computed(() =>
  heroTitles.map((x, i) => {
    const r = placeOf(i);
    const s = r === 0 ? null : fanSlots[Math.abs(r) - 1];
    const side = r < 0 ? -1 : 1;
    return {
      i,
      r,
      depth: s ? Math.abs(r) - 1 : -1,
      label: t("carousel.show", { title: locale.value === "ar" ? x.ar.title : x.en.title }),
      style: {
        "--x": `${s ? side * s.x : 0}px`,
        "--y": `${s ? s.y : 60}px`,
        "--r": `${s ? side * s.rotate : 0}deg`,
        "--s": s ? s.scale : 0.8,
        "--d": `${s ? s.delay : 0}s`,
        backgroundImage: `url('${x.poster}')`,
      },
    };
  }),
);

const current = computed(() => heroTitles[focus.value]!);
const currentName = computed(() => (locale.value === "ar" ? current.value.ar.title : current.value.en.title));

// Posters that wrap round the outer edge jump there and fade in, instead of flying across the fan.
watch(focus, (f, old) => {
  const wrapped = new Set<number>();
  heroTitles.forEach((_, i) => {
    if (Math.abs(placeOf(i, f) - placeOf(i, old)) > N / 2) wrapped.add(i);
  });
  jumping.value = wrapped;
  requestAnimationFrame(() => requestAnimationFrame(() => (jumping.value = new Set())));
});

function go(i: number) {
  ready.value = true;
  const r = placeOf(i);
  if (r === 0) return;
  dirSign.value = r < 0 ? -1 : 1;
  focus.value = i;
  userMoved();
}

function step(d: 1 | -1, byUser = true) {
  ready.value = true;
  dirSign.value = d;
  focus.value = (focus.value + d + N) % N;
  if (byUser) userMoved();
}

// Auto-advance: the next title every 10s. It waits while the pointer or keyboard is in the fan, while
// someone is watching (sound on or the pop-up open), while the fan is off screen (no trailers loading
// unseen) and while the tab is hidden; reduced motion turns it off. A manual change restarts the count.
const AUTO_MS = 10_000;
let auto: ReturnType<typeof setTimeout> | undefined;
let autoOff = false;
const hovering = ref(false);
const focused = ref(false);
const inView = ref(false);
const screenBusy = ref(false);
// Screen readers hear the changes you make, not the automatic ones.
const live = ref<"polite" | "off">("off");

const canAuto = () => !hovering.value && !focused.value && inView.value && !screenBusy.value && !document.hidden;
function schedule() {
  clearTimeout(auto);
  if (autoOff) return;
  auto = setTimeout(() => {
    if (canAuto()) {
      live.value = "off";
      step(1, false);
    }
    schedule();
  }, AUTO_MS);
}
function userMoved() {
  live.value = "polite";
  schedule();
}

const fanEl = ref<HTMLElement | null>(null);
let seen: IntersectionObserver | null = null;
onMounted(() => {
  autoOff = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && fanEl.value) {
    seen = new IntersectionObserver(([e]) => (inView.value = !!e?.isIntersecting), { threshold: 0.4 });
    seen.observe(fanEl.value);
  } else {
    inView.value = true;
  }
  afterSplash(schedule);
});
onBeforeUnmount(() => {
  clearTimeout(auto);
  seen?.disconnect();
});

// Swipe: left shows the next title, right the previous one.
let x0: number | null = null;
let swiped = false;
function down(e: PointerEvent) {
  x0 = e.clientX;
  swiped = false;
}
function up(e: PointerEvent) {
  if (x0 === null) return;
  const dx = e.clientX - x0;
  x0 = null;
  if (Math.abs(dx) < 40) return;
  swiped = true;
  step(dx < 0 ? 1 : -1);
  setTimeout(() => (swiped = false));
}
function cancel() {
  x0 = null;
}
// The click that ends a swipe must not also pick a poster or start a trailer.
function swallowAfterSwipe(e: MouseEvent) {
  if (!swiped) return;
  e.stopPropagation();
  e.preventDefault();
}

// the entrance runs once the intro splash is over (it waits paused behind it)
onMounted(() => afterSplash(() => setTimeout(() => (ready.value = true), 1800)));
</script>

<template>
  <div
    ref="fanEl"
    class="fan"
    :class="{ ready }"
    role="group"
    :aria-roledescription="t('carousel.roledescription')"
    :aria-label="t('carousel.label')"
    :style="{ '--sx': `${dirSign * 28}px` }"
    @keydown.left.prevent="step(-1)"
    @keydown.right.prevent="step(1)"
    @pointerdown="down"
    @pointerup="up"
    @pointercancel="cancel"
    @click.capture="swallowAfterSwipe"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <button
      v-for="p in posters"
      :key="p.i"
      type="button"
      tabindex="-1"
      class="pf"
      :class="[p.depth >= 0 ? `k${p.depth}` : 'hid', { jump: jumping.has(p.i) }]"
      :style="p.style"
      :aria-label="p.label"
      :aria-hidden="p.r === 0"
      @click="go(p.i)"
    />

    <div class="ph9">
      <span class="sz" />
      <Transition name="scr">
        <div :key="focus" class="scrbox">
          <div class="fit"><HomePhoneTitleScreen :title="current" @busy="screenBusy = $event" /></div>
        </div>
      </Transition>
    </div>

    <button type="button" class="nb prev" :aria-label="t('carousel.prev')" @click="step(-1)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
    </button>
    <button type="button" class="nb next" :aria-label="t('carousel.next')" @click="step(1)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
    </button>

    <p class="sr" :aria-live="live">{{ t("carousel.showing", { title: currentName }) }}</p>
  </div>
</template>

<style scoped>
.fan{--u:1;position:relative;height:500px;margin-top:156px;direction:ltr;touch-action:pan-y;
  -webkit-mask:linear-gradient(90deg,transparent 0,#000 14%,#000 86%,transparent 100%),linear-gradient(180deg,#000 62%,transparent 100%);-webkit-mask-composite:source-in;
  mask:linear-gradient(90deg,transparent 0,#000 14%,#000 86%,transparent 100%) intersect,linear-gradient(180deg,#000 62%,transparent 100%)}
.pf{--lift:0px;position:absolute;left:50%;top:0;width:150px;height:225px;margin-left:-75px;padding:0;border:0;border-radius:14px;background:var(--ph) center/cover no-repeat;cursor:pointer;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 24px 40px -18px rgba(0,0,0,.6);
  transform:translate(calc(var(--x)*var(--u)),calc((var(--y) + var(--lift))*var(--u))) rotate(var(--r)) scale(calc(var(--s)*var(--u)));
  animation:fan 1.3s var(--d) var(--ease) both;
  transition:transform .7s var(--ease),opacity .45s var(--ease)}
:root[data-theme="light"] .pf{box-shadow:0 22px 36px -18px rgba(16,18,27,.35)}
@keyframes fan{from{opacity:0;transform:translate(0,calc(60px*var(--u))) rotate(0) scale(calc(.8*var(--u)))}}
/* after the entrance, posters move by transition */
.fan.ready .pf{animation:none}
.pf.hid{opacity:0;pointer-events:none}
.pf.jump{transition:none;opacity:0}
@media (hover:hover){.pf:not(.hid):hover{--lift:-10px}}

.ph9{position:absolute;z-index:2;left:50%;top:0;width:calc(300px*var(--u));margin-left:calc(-150px*var(--u));padding:calc(8px*var(--u));border-radius:calc(50px*var(--u));background:#0e0f14;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 40px 80px -30px rgba(0,0,0,.9);animation:rise9 1.1s .05s var(--ease) both}
:root[data-theme="light"] .ph9{box-shadow:0 40px 80px -34px rgba(16,18,27,.5)}
/* the screen's size: the app is drawn at 402 × 874 */
.sz{display:block;width:100%;aspect-ratio:402/874;border-radius:calc(42px*var(--u))}
@keyframes rise9{from{opacity:0;transform:translateY(50px)}}

/* the title page sits exactly over the screenshot: 402 × 874 scaled to the 284px screen */
.scrbox{position:absolute;inset:calc(8px*var(--u));border-radius:calc(42px*var(--u));overflow:hidden;background:#000}
:root[data-theme="light"] .scrbox{background:#f5f5f7}
.fit{width:402px;height:874px;transform:scale(calc(var(--u)*284/402));transform-origin:0 0}
.scr-enter-active,.scr-leave-active{transition:opacity .45s var(--ease),transform .45s var(--ease)}
.scr-enter-from{opacity:0;transform:translateX(var(--sx))}
.scr-leave-to{opacity:0}

/* prev / next: glass buttons beside the phone, under the nearest posters */
.nb{position:absolute;z-index:3;top:calc(296px*var(--u));width:44px;height:44px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--text);
  background:rgba(var(--glass),.08);box-shadow:inset 0 0 0 1px rgba(var(--glass),.14);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  animation:rise9 1.1s .3s var(--ease) both;transition:background .2s,transform .15s}
.nb svg{width:20px;height:20px}
.nb:active{transform:scale(.94)}
.nb.prev{left:calc(50% - 150px*var(--u) - 58px)}
.nb.next{left:calc(50% + 150px*var(--u) + 14px)}
@media (hover:hover){.nb:hover{background:rgba(var(--glass),.14)}}

.sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

@media (max-width:1100px){.fan{--u:.86}}
@media (max-width:900px){.fan{--u:.72;height:380px;margin-top:44px}}
@media (max-width:640px){
  .fan{--u:.6;height:320px;margin-top:36px}
  .pf.k3,.pf.k4{display:none}
  .nb{width:40px;height:40px}
  .nb.prev{left:calc(50% - 150px*var(--u) - 52px)}
  .nb.next{left:calc(50% + 150px*var(--u) + 12px)}
}
</style>
