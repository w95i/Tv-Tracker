<script setup lang="ts">
import { importedEpisodes } from "~/data/landing";

const { t } = useI18n();
</script>

<template>
  <div>
    <div class="logos" role="list">
      <span class="lg" role="listitem" title="TV Time"><svg viewBox="0 0 24 24" style="background:#000"><path fill="#FFD400" d="M0 0v24h24V0zm4.8 4.8h14.4v4.8h-4.8v9.6H9.6V9.6H4.8Z" /></svg></span>
      <span class="lg" role="listitem" title="Trakt"><svg viewBox="0 0 24 24" style="background:#fff"><path fill="#9F42C6" d="m15.082 15.107-.73-.73 9.578-9.583a4.499 4.499 0 0 0-.115-.575L13.662 14.382l1.08 1.08-.73.73-1.81-1.81L23.422 3.144c-.075-.15-.155-.3-.25-.44L11.508 14.377l2.154 2.155-.73.73-7.193-7.199.73-.73 4.309 4.31L22.546 1.86A5.618 5.618 0 0 0 18.362 0H5.635A5.637 5.637 0 0 0 0 5.634V18.37A5.632 5.632 0 0 0 5.635 24h12.732C21.477 24 24 21.48 24 18.37V6.19l-8.913 8.918zm-4.314-2.155L6.814 8.988l.73-.73 3.954 3.96zm1.075-1.084-3.954-3.96.73-.73 3.959 3.96zm9.853 5.688a4.141 4.141 0 0 1-4.14 4.14H6.438a4.144 4.144 0 0 1-4.139-4.14V6.438A4.141 4.141 0 0 1 6.44 2.3h10.387v1.04H6.438c-1.71 0-3.099 1.39-3.099 3.1V17.55c0 1.71 1.39 3.105 3.1 3.105h11.117c1.71 0 3.1-1.395 3.1-3.105v-1.754h1.04v1.754z" /></svg></span>
      <span class="lg" role="listitem" title="IMDb"><svg viewBox="0 0 24 24" style="background:#F5C518"><path fill="#000" d="M22.3781 0H1.6218C.7411.0583.0587.7437.0018 1.5953l-.001 20.783c.0585.8761.7125 1.543 1.5559 1.6191A.337.337 0 0 0 1.6016 24h20.7971a.4579.4579 0 0 0 .0437-.002c.8727-.0768 1.5568-.8271 1.5568-1.7085V1.7098c0-.8914-.696-1.6416-1.584-1.7078A.3294.3294 0 0 0 22.3781 0zm0 .496a1.2144 1.2144 0 0 1 1.1252 1.2139v20.5797c0 .6377-.4875 1.1602-1.1045 1.2145H1.6016c-.5967-.0543-1.0645-.5297-1.1053-1.1258V1.6284C.5371 1.0185 1.0184.5364 1.6217.496h20.7564zM4.7954 8.2603v7.3636H2.8899V8.2603h1.9055zm6.5367 0v7.3636H9.6707v-4.9704l-.6711 4.9704H7.813l-.6986-4.8618-.0066 4.8618h-1.668V8.2603h2.468c.0748.4476.1492.9694.2307 1.5734l.2712 1.8713.4407-3.4447h2.4817zm2.9772 1.3289c.0742.0404.122.108.1417.2034.0279.0953.0345.3118.0345.6442v2.8548c0 .4881-.0345.7867-.0955.8954-.0609.1152-.2304.1695-.5018.1695V9.5211c.204 0 .3457.0205.4211.0681zm-.0211 6.0347c.4543 0 .8006-.0265 1.0245-.0742.2304-.0477.4204-.1357.5694-.2648.1556-.1218.2642-.298.3251-.5219.0611-.2238.1021-.6648.1021-1.3224v-2.5832c0-.6986-.0271-1.1668-.0742-1.4039-.041-.237-.1431-.4543-.3126-.6437-.1695-.1973-.4198-.3324-.7456-.421-.3191-.0808-.8542-.1285-1.7694-.1285h-1.4244v7.3636h2.3051zm5.14-1.7827c0 .3523-.0199.5762-.0544.6708-.033.0947-.1894.1424-.3046.1424-.1086 0-.19-.0477-.2238-.1351-.041-.0887-.0609-.2986-.0609-.6238v-1.9469c0-.3324.0199-.5423.0543-.6237.0338-.0808.1086-.122.2171-.122.1153 0 .2709.0412.3114.1425.041.0947.0609.2986.0609.6032v1.8926zm-2.4747-5.5809v7.3636h1.7157l.1152-.4675c.1556.1894.3251.3324.5152.4271.1828.0881.4608.1357.678.1357.3047 0 .5629-.0748.7802-.237.2165-.1562.3589-.3462.4198-.5628.0543-.2173.0887-.543.0887-.9841v-2.0675c0-.4409-.0139-.7324-.0344-.8681-.0199-.1357-.0742-.2781-.1695-.4204-.1021-.1425-.2437-.251-.4272-.3325-.1834-.0742-.3999-.1152-.6576-.1152-.2172 0-.4952.0477-.6846.1285-.1835.0887-.353.2238-.5086.4007V8.2603h-1.8309z" /></svg></span>
      <span class="lg" role="listitem" title="Bingers"><img src="/images/logos/bingers.png" alt=""></span>
    </div>
    <div class="prog" aria-hidden="true">
      <div class="row9">
        <b>{{ importedEpisodes.toLocaleString("en") }}</b><span>{{ t("why.import.episodes") }}</span>
        <em><UiIconCheck /><span>{{ t("why.import.done") }}</span></em>
      </div>
      <div class="bar"><i /></div>
    </div>
  </div>
</template>

<style scoped>
.logos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.lg{aspect-ratio:1;border-radius:16px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--line)}
.lg svg,.lg img{width:100%;height:100%;display:block}
.prog{margin-top:12px;padding:14px 16px;border-radius:14px;background:var(--surface-2);text-align:start}
.prog .row9{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:var(--muted)}
.prog .row9 b{font-family:var(--display);font-size:20px;font-weight:800;color:var(--heading);font-variant-numeric:tabular-nums}
.prog .row9 em{margin-inline-start:auto;display:inline-flex;align-items:center;gap:6px;font-style:normal;color:var(--accent);font-weight:800}
.prog .row9 em svg{width:15px;height:15px}
.bar{margin-top:10px;height:6px;border-radius:3px;background:rgba(var(--glass),.1);overflow:hidden}
.bar i{display:block;height:100%;width:100%;border-radius:3px;background:var(--amber);transform-origin:0 50%}
:root[dir="rtl"] .bar i{transform-origin:100% 50%}
/* The bar fills when its card scrolls into view */
.js .card.rv .bar i{transform:scaleX(.08);transition:transform 1.6s .3s var(--ease)}.js .card.rv.in .bar i{transform:none}
@media (prefers-reduced-motion:reduce){.js .card.rv .bar i{transform:none}}
</style>
