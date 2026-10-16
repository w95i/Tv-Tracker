<script setup lang="ts">
const { t, locale, setLocale } = useI18n();
const { toggleTheme } = useTheme();
const { links } = useAppConfig();

// The bar turns solid once you scroll.
const solid = ref(false);
const onScroll = () => {
  solid.value = scrollY > 30;
};
onMounted(() => {
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});
onBeforeUnmount(() => removeEventListener("scroll", onScroll));

const toggleLang = () => setLocale(locale.value === "ar" ? "en" : "ar");

// The nav, as in the web app's header (tvtracker-series-web.html .w-nav): centred, icon + label, and the
// current one in amber with an underline. On this one-page site "current" is the section in view.
const routes = [
  { id: "about", label: "nav.about" },
  { id: "import", label: "nav.import" },
  { id: "why", label: "nav.features" },
] as const;
const current = ref<string | null>(null);
let spy: IntersectionObserver | null = null;
onMounted(() => {
  const sections = routes.map((r) => document.getElementById(r.id)).filter((s): s is HTMLElement => !!s);
  if (!sections.length || !("IntersectionObserver" in window)) return;
  // A section is current while it crosses the band just above the middle of the screen.
  spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) current.value = e.target.id;
      if (scrollY < 200) current.value = null; // up in the hero: none
    },
    { rootMargin: "-40% 0px -55% 0px" },
  );
  sections.forEach((s) => spy!.observe(s));
});
onBeforeUnmount(() => spy?.disconnect());
</script>

<template>
  <header class="hd" :class="{ solid }">
    <div class="wrap">
      <SiteLogo :height="30" />
      <nav class="nav" :aria-label="t('nav.main')">
        <a
          v-for="r in routes"
          :key="r.id"
          :href="`#${r.id}`"
          :class="{ cur: current === r.id }"
          :aria-current="current === r.id ? 'location' : undefined"
        >
          <svg v-if="r.id === 'about'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.2" /></svg>
          <svg v-else-if="r.id === 'import'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5" /><path d="M4 15.5v2.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.4 5.6 6.1.5-4.6 4 1.4 5.9L12 15.9 6.7 19l1.4-5.9-4.6-4 6.1-.5z" /></svg>
          <span>{{ t(r.label) }}</span>
        </a>
      </nav>
      <div class="hd-r">
        <button type="button" class="ib lang" @click="toggleLang">{{ t("header.langBtn") }}</button>
        <button type="button" class="ib th" :aria-label="t('header.theme')" @click="toggleTheme">
          <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
          <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>
        </button>
        <a class="login" :href="links.app">{{ t("header.login") }}</a>
        <a class="btn pri sm" :href="links.app">{{ t("header.signup") }}</a>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hd{position:fixed;top:0;left:0;right:0;z-index:50;transition:background .3s,box-shadow .3s}
.hd.solid{background:rgba(var(--bg-rgb),.8);-webkit-backdrop-filter:saturate(1.6) blur(18px);backdrop-filter:saturate(1.6) blur(18px);box-shadow:0 1px 0 var(--line)}
.hd .wrap{position:relative;height:68px;display:flex;align-items:center;gap:32px}
/* nav: centred in the bar, the web app's .w-nav */
.nav{position:absolute;left:50%;top:0;height:100%;transform:translateX(-50%);display:flex}
.nav a{position:relative;display:flex;align-items:center;gap:8px;height:100%;padding:0 14px;font-size:15px;font-weight:500;color:var(--muted);white-space:nowrap;transition:color .15s}
.nav a svg{width:21px;height:21px;flex:none}
.nav a.cur{color:var(--accent);font-weight:700}
.nav a.cur::after{content:"";position:absolute;left:14px;right:14px;bottom:10px;height:2px;border-radius:2px;background:var(--amber)}
@media (hover:hover){.nav a:not(.cur):hover{color:var(--text)}}
/* below this the centred nav would run into the buttons on the right (the Arabic labels are wider):
   it sits after the logo, without icons */
@media (max-width:1240px){
  .nav{position:static;transform:none;height:100%}
  .nav a{padding:0 10px}
  .nav a svg{display:none}
  .nav a.cur::after{left:10px;right:10px}
}
.hd-r{margin-inline-start:auto;display:flex;align-items:center;gap:8px}
.ib{height:40px;min-width:40px;padding:0 11px;border:0;border-radius:11px;display:grid;place-items:center;background:rgba(var(--glass),.08);color:var(--text);cursor:pointer;font-size:14px;font-weight:700}
.ib svg{width:19px;height:19px}
:root:not([lang="ar"]) .ib.lang{font-family:"Readex Pro",sans-serif;font-weight:600}
.ib .sun{display:none}:root[data-theme="light"] .ib .sun{display:block}:root[data-theme="light"] .ib .moon{display:none}
.login{font-size:15px;font-weight:700;color:var(--dim);padding:10px 8px;white-space:nowrap}
@media (max-width:900px){.nav{display:none}}
@media (max-width:640px){
  .login,.hd-r .ib.th{display:none}
  .hd .wrap{height:60px;gap:12px}
}
</style>
