<script setup lang="ts">
// The Peek mark (brand kit v5.8), alive: the pupils follow the pointer and it blinks now and then, timed like
// the kit's "peek-blink" Lottie (0.67s: shut at 200–317ms). Geometry is the kit's 256 × 256 icon.
// Reduced motion: it just sits there, as the static mark.
defineProps<{ size?: number }>();

const svg = ref<SVGSVGElement | null>(null);
// pupil offset, in icon units, from the eye's centre; the kit's resting look is up and to the right
const look = ref({ x: 10.6, y: -9.8 });
const blinking = ref(false);
const R = 41, PR = 17.63, MAX = R - PR - 3;

let raf = 0, px = 0, py = 0, blinkTimer: ReturnType<typeof setTimeout> | undefined;
function onMove(e: PointerEvent) {
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
    </defs>
    <g :clip-path="`url(#${uid}-t)`">
      <rect width="256" height="256" fill="#000" />
      <g class="eye">
        <circle cx="81.5" cy="158" :r="R" fill="#F4F5F8" />
        <g :clip-path="`url(#${uid}-l)`"><circle class="pu" :cx="81.5 + look.x" :cy="158 + look.y" :r="PR" fill="#000" /></g>
      </g>
      <g class="eye">
        <circle cx="174.5" cy="158" :r="R" fill="#F4F5F8" />
        <g :clip-path="`url(#${uid}-r)`"><circle class="pu" :cx="174.5 + look.x" :cy="158 + look.y" :r="PR" fill="#000" /></g>
      </g>
      <rect x="0" y="158" width="256" height="98" fill="#FFC42E" />
    </g>
  </svg>
</template>

<style scoped>
.peek{display:block;border-radius:22%}
.pu{transition:cx .25s cubic-bezier(.22,1,.36,1),cy .25s cubic-bezier(.22,1,.36,1)}
.eye{transform-box:view-box;transform-origin:128px 158px}
.blink .eye{animation:blink .67s linear}
@keyframes blink{0%,30%{transform:none}35%,47%{transform:scaleY(0)}97%,100%{transform:none}}
</style>
