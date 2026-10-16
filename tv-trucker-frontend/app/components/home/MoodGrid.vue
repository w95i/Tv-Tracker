<script setup lang="ts">
import { moods } from "~/data/landing";

const { t } = useI18n();
const { links } = useAppConfig();
</script>

<template>
  <div class="moods">
    <a v-for="m in moods" :key="m.key" class="md" :href="links.app" :style="{ '--h': m.hue }">
      <b>{{ t(`why.moods.${m.key}`) }}</b>
      <span aria-hidden="true">
        <i v-for="src in m.posters" :key="src" :style="{ backgroundImage: `url('${src}')` }" />
      </span>
    </a>
  </div>
</template>

<style scoped>
.moods{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.md{position:relative;height:104px;padding:12px 14px;border-radius:14px;overflow:hidden;text-align:start;background:linear-gradient(135deg,hsl(var(--h) 72% 46%),hsl(calc(var(--h) + 28) 70% 34%))}
.md b{position:relative;z-index:1;display:block;max-width:7em;font-size:14.5px;font-weight:800;line-height:1.15;color:#fff}
.md span{position:absolute;inset-inline-end:-6px;bottom:-16px;width:84px;height:80px}
.md i{position:absolute;bottom:0;width:46px;aspect-ratio:2/3;border-radius:6px;background:center/cover;box-shadow:0 8px 16px -6px rgba(0,0,0,.5)}
.md i:nth-child(1){inset-inline-end:30px;transform:rotate(-12deg)}.md i:nth-child(2){inset-inline-end:4px;bottom:6px;transform:rotate(9deg)}
@media (hover:hover){.md i{transition:transform .35s var(--ease)}.md:hover i:nth-child(1){transform:rotate(-16deg) translateY(-6px)}.md:hover i:nth-child(2){transform:rotate(13deg) translateY(-9px)}}
</style>
