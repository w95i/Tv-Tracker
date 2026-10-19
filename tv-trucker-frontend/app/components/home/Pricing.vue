<script setup lang="ts">
// "Free. All of it." — the pricing, as a section: there is one price, $0. The left panel is the old pricing
// sheet's design (Peek hops for joy, the infinity draws itself, a slow gold-and-dusk wash behind the glass);
// the right lists everything that's included — the features the page has just shown. Tap the price: confetti.
// Plays once, when it comes into view.
const { t } = useI18n();
const { links } = useAppConfig();

const features = ["track", "progress", "feel", "upcoming", "import", "stats", "devices", "lang"] as const;
const nos = ["plans", "trials", "card"] as const;

const card = ref<HTMLElement | null>(null);
const root = ref<HTMLElement | null>(null);
const live = ref(false);
let io: IntersectionObserver | null = null;
onMounted(() => {
  if (!("IntersectionObserver" in window) || !root.value) return void (live.value = true);
  io = new IntersectionObserver(
    ([e]) => {
      if (!e?.isIntersecting) return;
      io?.disconnect();
      live.value = true;
    },
    { threshold: 0.35 },
  );
  io.observe(root.value);
});
onBeforeUnmount(() => io?.disconnect());

let lastCheer = 0;
function cheer() {
  if (!card.value || Date.now() - lastCheer < 1500) return;
  lastCheer = Date.now();
  fireConfetti(card.value);
}
</script>

<template>
  <section id="pricing" class="sec pricing" aria-labelledby="pr-h">
    <div class="wrap">
      <div class="sec-h c rv">
        <h2 id="pr-h">{{ t("pricing.title") }} <em>{{ t("pricing.titleEm") }}</em></h2>
        <p>{{ t("pricing.lede") }}</p>
      </div>

      <!-- (the reveal adds a class to .rv, so the reactive class lives on the element inside it) -->
      <div ref="root" class="rv">
        <div ref="card" class="pc" :class="{ live }">
          <!-- the price -->
          <div class="pl">
            <i class="wash" aria-hidden="true" />
            <div class="pk"><span class="sh" aria-hidden="true" /><SitePeek class="joy" :size="104" /></div>
            <span class="tier">{{ t("pricing.tier") }}</span>
            <button type="button" class="price" :aria-label="t('pricing.cheer')" @click="cheer">
              <b dir="ltr">{{ t("pricing.price") }}</b><span>{{ t("pricing.forever") }}</span>
            </button>
            <div class="inf">
              <svg viewBox="0 0 120 60" fill="none" aria-hidden="true"><path pathLength="1" d="M60 30c-9-11-17-19-29-19a19 19 0 1 0 0 38c12 0 20-8 29-19s17-19 29-19a19 19 0 1 1 0 38c-12 0-20-8-29-19z" /></svg>
              <div><b>{{ t("pricing.unl") }}</b><span>{{ t("pricing.unlSub") }}</span></div>
            </div>
            <div class="ctas">
              <a class="btn pri" :href="links.app">
                <span>{{ t("pricing.cta") }}</span>
                <svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
              <UiStoreBadge compact store="apple" :href="links.appStore" :caption="t('hero.dlOn')" />
              <UiStoreBadge compact store="google" :href="links.googlePlay" :caption="t('hero.dlGet')" />
            </div>
          </div>

          <!-- what's included: all of it -->
          <div class="pr">
            <p class="ch">{{ t("pricing.incl") }}</p>
            <ul class="incl" role="list">
              <li v-for="(f, i) in features" :key="f" :style="{ '--i': i }">
                <span class="ck" aria-hidden="true"><UiIconCheck /></span>
                <span class="ft"><b>{{ t(`pricing.f.${f}.t`) }}</b><small>{{ t(`pricing.f.${f}.s`) }}</small></span>
              </li>
            </ul>
            <ul class="nos" role="list">
              <li v-for="(n, i) in nos" :key="n" :style="{ '--i': i }">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M6 18L18 6" /></svg>
                {{ t(`pricing.no.${n}`) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pc{position:relative;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);margin-top:52px;border-radius:32px;overflow:hidden;isolation:isolate;
  background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow)}

/* the price: the old sheet, glass over a slow wash of gold (up top) and dusk (below) */
.pl{position:relative;z-index:0;display:flex;flex-direction:column;align-items:center;padding:40px 36px 36px;text-align:center;
  background:rgba(var(--glass),.03);box-shadow:inset -1px 0 0 var(--line)}
:root[dir="rtl"] .pl{box-shadow:inset 1px 0 0 var(--line)}
.wash{position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(52% 40% at var(--ax,18%) var(--ay,8%),rgba(255,196,46,.3),rgba(255,196,46,0) 100%),radial-gradient(58% 44% at var(--bx,88%) var(--by,96%),rgba(91,108,255,.22),rgba(91,108,255,0) 100%);
  animation:drift 18s ease-in-out infinite alternate}
:root[data-theme="light"] .wash{background:radial-gradient(52% 40% at var(--ax,18%) var(--ay,8%),rgba(255,196,46,.36),rgba(255,196,46,0) 100%),radial-gradient(58% 44% at var(--bx,88%) var(--by,96%),rgba(120,150,255,.22),rgba(120,150,255,0) 100%)}
@property --ax{syntax:"<percentage>";inherits:false;initial-value:18%}
@property --ay{syntax:"<percentage>";inherits:false;initial-value:8%}
@property --bx{syntax:"<percentage>";inherits:false;initial-value:88%}
@property --by{syntax:"<percentage>";inherits:false;initial-value:96%}
@keyframes drift{to{--ax:70%;--ay:22%;--bx:30%;--by:78%}}

/* Peek jumps for joy (once in view) */
.pk{position:relative;width:104px;height:124px}
.joy{position:absolute;left:0;top:0;border-radius:26px;transform-origin:50% 100%;opacity:0}
.sh{position:absolute;left:16px;right:16px;bottom:0;height:10px;border-radius:50%;background:rgba(0,0,0,.35);filter:blur(4px);opacity:0}
:root[data-theme="light"] .sh{background:rgba(16,18,27,.18)}
.live .joy{animation:pkIn .9s cubic-bezier(.34,1.56,.64,1) both,pkHop 2.6s ease-in-out .9s infinite}
.live .sh{opacity:1;animation:pkSh 2.6s ease-in-out .9s infinite}
@keyframes pkIn{0%{opacity:0;transform:translateY(40px) scale(.4) rotate(-12deg)}55%{opacity:1;transform:translateY(-22px) scale(1.08,.96) rotate(5deg)}75%{opacity:1;transform:translateY(0) scale(1.06,.9) rotate(-2deg)}100%{opacity:1;transform:none}}
@keyframes pkHop{0%,55%,100%{opacity:1;transform:none}65%{opacity:1;transform:translateY(0) scale(1.06,.92)}75%{opacity:1;transform:translateY(-18px) scale(.96,1.05) rotate(-6deg)}85%{opacity:1;transform:translateY(-18px) rotate(6deg)}93%{opacity:1;transform:translateY(0) scale(1.05,.94)}}
@keyframes pkSh{0%,55%,93%,100%{transform:none;opacity:1}75%,85%{transform:scaleX(.7);opacity:.55}}

.tier{margin-top:18px;display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:9px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
  color:var(--ink);background:var(--amber)}
:root[lang="ar"] .tier{letter-spacing:0;font-size:13px}
.price{display:flex;align-items:baseline;justify-content:center;gap:10px;margin-top:14px;padding:0;border:0;background:none;cursor:pointer;color:inherit}
.price b{font-family:var(--display);font-size:clamp(84px,9vw,120px);font-weight:900;line-height:.9;letter-spacing:-.05em;color:var(--heading);font-variant-numeric:tabular-nums;transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
.price span{font-size:17px;font-weight:700;color:var(--muted)}
.price:active b{transform:scale(.94)}
@media (hover:hover){.price:hover b{transform:rotate(-3deg) scale(1.04)}}

.inf{display:flex;align-items:center;gap:16px;width:100%;margin-top:26px;padding:16px 18px;border-radius:20px;text-align:start;background:rgba(255,196,46,.08);box-shadow:inset 0 0 0 1px rgba(255,196,46,.22)}
:root[data-theme="light"] .inf{background:rgba(255,196,46,.14);box-shadow:inset 0 0 0 1px rgba(214,150,0,.28)}
.inf svg{flex:none;width:72px;height:36px;overflow:visible}
.inf path{stroke:#ffc42e;stroke-width:9;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1}
.live .inf path{animation:draw 1.3s cubic-bezier(.65,0,.35,1) .35s forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.inf div{min-width:0}
.inf b{display:block;font-family:var(--display);font-size:18px;font-weight:800;line-height:1.2;letter-spacing:-.01em;color:var(--heading)}
:root[lang="ar"] .inf b{letter-spacing:0;font-weight:700}
.inf span{display:block;margin-top:4px;font-size:14px;line-height:1.45;font-weight:500;color:var(--dim)}

.ctas{display:flex;gap:10px;width:100%;margin-top:22px}
.ctas .btn{flex:1 1 auto;min-width:0}
.ctas .store{flex:none}

/* what's included */
.pr{display:flex;flex-direction:column;padding:40px 44px 36px}
.ch{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
:root[lang="ar"] .ch{letter-spacing:0;font-size:14px}
.incl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 28px;margin:24px 0 0;padding:0;list-style:none}
.incl li{display:flex;align-items:flex-start;gap:14px;opacity:0;transform:translateY(12px);transition:opacity .6s var(--ease),transform .6s var(--ease);transition-delay:calc(var(--i) * 60ms + .2s)}
.live .incl li{opacity:1;transform:none}
.ck{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:11px;color:var(--ink);background:var(--amber);box-shadow:0 6px 16px -8px rgba(255,196,46,.8)}
.ck svg{width:17px;height:17px}
.ft{min-width:0;padding-top:1px}
.ft b{display:block;font-family:var(--display);font-size:16.5px;font-weight:800;line-height:1.3;letter-spacing:-.01em;color:var(--heading)}
:root[lang="ar"] .ft b{letter-spacing:0;font-weight:700}
.ft small{display:block;margin-top:3px;font-size:14px;line-height:1.45;color:var(--muted)}

.nos{display:flex;flex-wrap:wrap;gap:8px;margin:auto 0 0;padding:30px 0 0;list-style:none;border-top:0}
.nos li{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 14px 0 12px;border-radius:11px;font-size:14px;font-weight:700;color:var(--dim);
  background:rgba(var(--glass),.06);box-shadow:inset 0 0 0 1px var(--line);opacity:0;transition:opacity .5s var(--ease);transition-delay:calc(var(--i) * 80ms + .75s)}
.live .nos li{opacity:1}
.nos svg{width:17px;height:17px;color:var(--muted)}

@media (max-width:1000px){
  .pr{padding:34px 30px 30px}
  .incl{gap:20px 20px}
}
@media (max-width:900px){
  .pc{grid-template-columns:1fr;margin-top:40px}
  .pl,:root[dir="rtl"] .pl{box-shadow:inset 0 -1px 0 var(--line)}
}
@media (max-width:640px){
  .pc{border-radius:26px}
  .pl{padding:32px 20px 24px}
  .pr{padding:28px 20px 24px}
  .incl{grid-template-columns:1fr;gap:16px}
  .ctas .btn{height:54px}
  .ctas .store{width:54px;height:54px}
}
@media (prefers-reduced-motion:reduce){
  .joy,.sh,.incl li,.nos li{opacity:1;transform:none}
  .inf path{stroke-dashoffset:0}
}
</style>
