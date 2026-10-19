<script setup lang="ts">
// The "Peek" lockup from brand kit v5.8: eyes mark + tvtracker wordmark.
// It has a dark-theme and a light-theme file; CSS shows the right one.
const props = defineProps<{ height: number }>();
// The lockup's viewBox is 1026.14 × 256.
const width = Math.round((props.height * 1026.14) / 256);
</script>

<template>
  <a class="logo" href="#top" aria-label="TVTracker">
    <img class="d" src="/images/brand-v6/peek-logo-dark.svg" alt="TVTracker" :width="width" :height="height">
    <img class="l" src="/images/brand-v6/peek-logo-light.svg" alt="" :width="width" :height="height">
  </a>
</template>

<style scoped>
.logo{display:flex;align-items:center;height:44px}.logo img{height:30px;width:auto}
@media (max-width:640px){.logo img{height:26px}}
</style>
