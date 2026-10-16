<script setup lang="ts">
import { wallRows } from "~/data/landing";

// The moving poster wall from tvtracker-landing (1).html, turned horizontal: rows drift
// left and right, alternating, at the original's speed (about 21, 17 and 15 px/s).
// Each row's posters are listed twice so translating by -50% loops seamlessly.
</script>

<template>
  <div class="wall" aria-hidden="true">
    <div v-for="(row, r) in wallRows" :key="r" class="lane">
      <div class="tk">
        <i v-for="(src, i) in [...row, ...row]" :key="i" :style="{ backgroundImage: `url('${src}')` }" />
      </div>
    </div>
  </div>
  <div class="veil" aria-hidden="true" />
</template>

<style scoped>
/* Always laid out left-to-right so the loop maths holds in Arabic too. */
.wall{--pw:150px;--gap:18px;position:absolute;z-index:-2;inset-inline:0;top:-40px;display:flex;flex-direction:column;gap:var(--gap);direction:ltr}
.lane{display:flex;overflow:visible}
.tk{display:flex;flex:none;gap:var(--gap);padding-right:var(--gap);animation:left 112s linear infinite;will-change:transform}
.lane:nth-child(2) .tk{animation-name:right;animation-duration:135s}
.lane:nth-child(3) .tk{animation-duration:155s}
.tk i{flex:none;display:block;width:var(--pw);aspect-ratio:2/3;border-radius:14px;background:var(--ph) center/cover no-repeat;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
@keyframes left{to{transform:translateX(-50%)}}
@keyframes right{from{transform:translateX(-50%)}to{transform:translateX(0)}}

/* Page colour fades over the wall: quiet behind the words, visible around them,
   gone before the phone and its poster fan. */
.veil{position:absolute;z-index:-1;inset:0;pointer-events:none;background:
  radial-gradient(ellipse 46% 30% at 50% 26%,var(--bg) 34%,rgba(var(--bg-rgb),.84) 64%,rgba(var(--bg-rgb),.52) 100%),
  linear-gradient(180deg,rgba(var(--bg-rgb),.72) 0,rgba(var(--bg-rgb),0) 13%,rgba(var(--bg-rgb),0) 27%,var(--bg) 49%)}
:root[data-theme="light"] .veil{background:
  radial-gradient(ellipse 46% 30% at 50% 26%,var(--bg) 38%,rgba(var(--bg-rgb),.88) 64%,rgba(var(--bg-rgb),.6) 100%),
  linear-gradient(180deg,rgba(var(--bg-rgb),.78) 0,rgba(var(--bg-rgb),0) 13%,rgba(var(--bg-rgb),0) 27%,var(--bg) 49%)}

@media (max-width:640px){
  .wall{--pw:104px;--gap:12px;top:-20px}
  .veil{background:linear-gradient(180deg,rgba(var(--bg-rgb),.72) 0,rgba(var(--bg-rgb),.86) 30%,rgba(var(--bg-rgb),.86) 50%,var(--bg) 66%)}
  :root[data-theme="light"] .veil{background:linear-gradient(180deg,rgba(var(--bg-rgb),.78) 0,rgba(var(--bg-rgb),.9) 30%,rgba(var(--bg-rgb),.9) 50%,var(--bg) 66%)}
}
</style>
