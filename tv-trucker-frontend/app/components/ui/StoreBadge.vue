<script setup lang="ts">
defineProps<{ store: "apple" | "google"; href: string; caption: string }>();
</script>

<template>
  <a class="store" :href="href">
    <svg v-if="store === 'apple'" viewBox="4.69 3.2 13.91 17.4" fill="currentColor" aria-hidden="true"><path d="M16.4 12.8c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.6 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.2-.9-2.2-3.2zM14.3 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 2-.5 2.6-1.2z" /></svg>
    <svg v-else viewBox="1.7 0.05 21.29 23.9" fill="currentColor" aria-hidden="true"><path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202c1.302.65 1.302 2.293 0 2.594zM17.089 7.36L4.723.243C4.155-.088 3.492.037 3.024.393l10.056 9.993 4.009-3.026zM3.024 23.607c.468.356 1.131.481 1.699.15l12.366-7.117-4.009-3.026L3.024 23.607zM2.16 1.052C1.878 1.406 1.7 1.89 1.7 2.48v19.04c0 .59.178 1.074.46 1.428l10.774-10.71L2.16 1.052z" /></svg>
    <span><small>{{ caption }}</small><b>{{ store === "apple" ? "App Store" : "Google Play" }}</b></span>
  </a>
</template>

<style scoped>
.store{display:inline-flex;align-items:center;gap:10px;height:52px;padding:0 18px 0 14px;border-radius:12px;background:rgba(var(--glass),.07);box-shadow:inset 0 0 0 1px rgba(var(--glass),.12);line-height:1.1;text-align:start}
.store svg{width:21px;height:21px;flex:none}
.store small{display:block;font-size:10.5px;font-weight:600;color:var(--muted)}
.store b{display:block;font-size:15px;font-weight:800}
@media (hover:hover){.store:hover{background:rgba(var(--glass),.12)}}
</style>
