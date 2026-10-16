<script setup lang="ts">
import { upNext } from "~/data/landing";
</script>

<template>
  <ul class="up" aria-hidden="true">
    <li v-for="item in upNext" :key="item.title">
      <i :style="{ backgroundImage: `url('${item.poster}')` }" />
      <span><b>{{ item.title }}</b><small>{{ item.episode }}</small></span>
      <em :class="{ on: item.watched }"><UiIconCheck /></em>
    </li>
  </ul>
</template>

<style scoped>
.up{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.up li{display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;background:var(--surface-2)}
.up i{flex:none;width:40px;height:58px;border-radius:8px;background:var(--ph) center/cover}
.up span{flex:1;min-width:0;text-align:start}
.up b{display:block;font-size:15px;font-weight:800;color:var(--heading);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.up small{display:block;margin-top:2px;font-size:13px;font-weight:700;color:var(--accent)}
.up em{flex:none;width:36px;height:36px;border-radius:10px;display:grid;place-items:center;box-shadow:inset 0 0 0 2px rgba(var(--glass),.18);color:transparent}
.up em.on{background:var(--amber);box-shadow:none;color:var(--ink)}
.up em svg{width:18px;height:18px}
</style>
