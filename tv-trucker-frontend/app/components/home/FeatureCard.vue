<script setup lang="ts">
defineProps<{ title: string; text: string }>();
</script>

<template>
  <article class="card rv">
    <h3>{{ title }}</h3>
    <p>{{ text }}</p>
    <div class="vis"><slot /></div>
  </article>
</template>

<style scoped>
.card{display:flex;flex-direction:column;min-width:0;min-height:430px;padding:28px;border-radius:24px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.card h3{font-size:22px;line-height:1.15}
.card > p{margin-top:8px;font-size:15.5px;line-height:1.55;color:var(--muted)}
.vis{margin-top:auto;padding-top:26px}
@media (max-width:900px){.card{min-height:0}}
@media (max-width:640px){.card{padding:22px;border-radius:22px}}
</style>
