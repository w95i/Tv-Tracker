<script setup lang="ts">
// The Peek mark (brand kit v6.1, screen-lit), alive: the pupils follow the pointer and it blinks now and then, timed like
// the kit's "peek-blink" Lottie (0.67s: shut at 200–317ms). Geometry is the kit's 256 × 256 icon.
// `at` (a point on screen) makes it look there instead of at the pointer. Reduced motion: it just sits there.
const props = defineProps<{ size?: number; at?: { x: number; y: number } | null }>();

const svg = ref<SVGSVGElement | null>(null);
// pupil offset, in icon units, from the eye's centre; the kit's resting look is up and to the right
const look = ref({ x: 10.6, y: -9.8 });
const blinking = ref(false);
const R = 41, PR = 17.63, MAX = R - PR - 3;

let raf = 0, px = 0, py = 0, blinkTimer: ReturnType<typeof setTimeout> | undefined;
function onMove(e: PointerEvent) {
  if (props.at) return;
  px = e.clientX;
  py = e.clientY;
  if (!raf) raf = requestAnimationFrame(aim);
}
function aim() {
  raf = 0;
  const el = svg.value;
  if (!el) return;
  const b = el.getBoundingClientRect();
  const s = b.width / 256;
  // from the point between the eyes (128, 158), in icon units
  let dx = (px - (b.left + 128 * s)) / s, dy = (py - (b.top + 158 * s)) / s;
  const d = Math.hypot(dx, dy);
  const k = Math.min(1, d / 400) * MAX / (d || 1);
  dx *= k;
  dy *= k;
  // the wall hides the lower half of the eye, so the pupils don't sink below it
  look.value = { x: dx, y: Math.min(dy, -2) };
}
function blink() {
  blinking.value = true;
  setTimeout(() => (blinking.value = false), 670);
  blinkTimer = setTimeout(blink, 2800 + Math.random() * 3600);
}
watch(
  () => props.at,
  (p) => {
    if (!p || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    px = p.x;
    py = p.y;
    if (!raf) raf = requestAnimationFrame(aim);
  },
);
onMounted(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  addEventListener("pointermove", onMove, { passive: true });
  blinkTimer = setTimeout(blink, 1600);
});
onBeforeUnmount(() => {
  removeEventListener("pointermove", onMove);
  cancelAnimationFrame(raf);
  clearTimeout(blinkTimer);
});

const uid = useId();
</script>

<template>
  <svg ref="svg" class="peek" :class="{ blink: blinking }" viewBox="0 0 256 256" :width="size ?? 160" :height="size ?? 160" aria-hidden="true">
    <defs>
      <clipPath :id="`${uid}-t`"><path d="M56 0 H200 C231 0 256 25 256 56 V200 C256 231 231 256 200 256 H56 C25 256 0 231 0 200 V56 C0 25 25 0 56 0 Z" /></clipPath>
      <clipPath :id="`${uid}-l`"><circle cx="81.5" cy="158" :r="R" /></clipPath>
      <clipPath :id="`${uid}-r`"><circle cx="174.5" cy="158" :r="R" /></clipPath>
      <radialGradient :id="`${uid}-sky`" cx="128" cy="150" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#181B28" /><stop offset=".5" stop-color="#08090E" /><stop offset="1" stop-color="#000000" /></radialGradient>
      <radialGradient :id="`${uid}-sc`" cx=".38" cy=".3" r=".78"><stop offset="0" stop-color="#FFFFFF" /><stop offset=".55" stop-color="#F2F4F8" /><stop offset="1" stop-color="#CFD5E2" /></radialGradient>
      <linearGradient :id="`${uid}-occ`" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E97AE" stop-opacity="0" /><stop offset="1" stop-color="#8E97AE" stop-opacity="0.42" /></linearGradient>
      <radialGradient :id="`${uid}-pu`" cx=".42" cy=".4" r=".7"><stop offset="0" stop-color="#20232F" /><stop offset="1" stop-color="#000000" /></radialGradient>
      <linearGradient :id="`${uid}-wall`" x1="0" y1="158" x2="0" y2="256" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFD54D" /><stop offset=".35" stop-color="#FFC42E" /><stop offset="1" stop-color="#F2AE1C" /></linearGradient>
    </defs>
    <!-- Screen-lit (brand kit v6.1): glow behind the eyes, lit eyes, the screen in each pupil, lit wall with a rim -->
    <g :clip-path="`url(#${uid}-t)`">
      <rect width="256" height="256" :fill="`url(#${uid}-sky)`" />
      <g v-for="(cx, k) in [81.5, 174.5]" :key="k" class="eye">
        <circle :cx="cx" cy="158" :r="R" :fill="`url(#${uid}-sc)`" />
        <g :clip-path="`url(#${uid}-${k ? 'r' : 'l'})`">
          <rect :x="cx - R" y="140.78" :width="2 * R" height="17.22" :fill="`url(#${uid}-occ)`" />
          <g class="pu" :style="{ transform: `translate(${look.x}px, ${look.y}px)` }">
            <circle :cx="cx" cy="158" :r="PR" :fill="`url(#${uid}-pu)`" />
            <rect :x="cx - 11.1" y="147.25" width="11.64" height="8.81" rx="2.64" fill="#FFFFFF" />
            <circle :cx="cx + 6.35" cy="163.29" r="2.12" fill="#FFFFFF" opacity=".9" />
          </g>
        </g>
      </g>
      <rect x="0" y="158" width="256" height="98" :fill="`url(#${uid}-wall)`" />
      <rect x="0" y="158" width="256" height="3" fill="#FFE9A6" />
    </g>
  </svg>
</template>

<style scoped>
.peek{display:block;border-radius:22%}
.pu{transition:transform .25s cubic-bezier(.22,1,.36,1)}
.eye{transform-box:view-box;transform-origin:128px 158px}
.blink .eye{animation:blink .67s linear}
@keyframes blink{0%,30%{transform:none}35%,47%{transform:scaleY(0)}97%,100%{transform:none}}
</style>
