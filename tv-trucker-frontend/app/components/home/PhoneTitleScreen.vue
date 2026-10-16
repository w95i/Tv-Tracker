<script setup lang="ts">
import type { HeroTitle } from "~/data/hero-titles";

// The app's title page (tvtracker-movie-app.html / tvtracker-series-app.html, "Text" title,
// "Not added" state), drawn at the phone's native 402 × 874 and scaled to fit by the parent.
// Only the top of the page is ever visible in the hero (the fan's mask cuts it at ~708px),
// so it stops after "Details"; the tab bar is kept so the frame reads as the app.
const props = defineProps<{ title: HeroTitle }>();
// "busy" = someone is watching (sound on, or the pop-up open): the carousel shouldn't move on.
const emit = defineEmits<{ busy: [value: boolean] }>();
const { t, locale } = useI18n();
const { afterSplash } = useSplash();

const text = computed(() => (locale.value === "ar" ? props.title.ar : props.title.en));
const dir = computed(() => (locale.value === "ar" ? "rtl" : "ltr"));

// 478K / 2.7M, like the app's vote counts.
const compact = (n: number) => (n < 1000 ? String(n) : n < 1e6 ? `${Math.round(n / 1000)}K` : `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`);

const facts = computed(() => {
  const x = props.title;
  if (x.kind === "show") return x.endYear ? `${x.year}–${x.endYear}` : `${x.year}–`;
  if (!x.runtime) return String(x.year);
  return `${x.year} · ${t("phone.runtime", { h: Math.floor(x.runtime / 60), m: x.runtime % 60 })}`;
});

// Trailer. It autoplays: clear and muted as soon as the card shows (browsers don't allow sound
// before the visitor interacts), with a "Sound on" button. Tapping the cover goes back to the app's
// blurred loop behind "Tap to watch the trailer"; tapping again plays it from the start with sound.
// With reduced motion or data saving it doesn't autoplay; the cover stays a still until tapped.
const { data: trailer } = useTrailer(props.title.kind, props.title.tmdbId);
const playing = ref(false);
const muted = ref(false);
const preview = ref(false); // the muted loop may load
const frame = ref<HTMLIFrameElement | null>(null);

onMounted(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (still || saveData) return;
  // after the hero's entrance (and the intro splash), so the page paints first
  afterSplash(() => setTimeout(() => {
    preview.value = true;
    playing.value = true;
    soundBlocked.value = true;
    muted.value = true;
  }, 900));
});

const showFrame = computed(() => !!trailer.value && (preview.value || playing.value));
// Some browsers (iPhone Safari above all) refuse to start a video with sound. If the player hasn't
// started shortly after the tap, it restarts muted and the button offers "Sound on" instead.
const soundBlocked = ref(false);
const frameKey = computed(() => `${playing.value}-${soundBlocked.value}`);
// Rebuilt only when play starts or stops (or sound is refused); mute goes through the player API so the video doesn't restart.
const src = computed(() => {
  const k = trailer.value!.youtubeKey;
  const withSound = playing.value && !soundBlocked.value;
  const q = new URLSearchParams({ autoplay: "1", mute: withSound ? "0" : "1", controls: "0", loop: "1", playlist: k, playsinline: "1", modestbranding: "1", rel: "0", iv_load_policy: "3", disablekb: "1", enablejsapi: "1" });
  return `https://www.youtube-nocookie.com/embed/${k}?${q}`;
});

const YT_ORIGIN = "https://www.youtube-nocookie.com";
const send = (func: string, args: unknown[] = []) => frame.value?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), YT_ORIGIN);

// The player reports its state once we say we're listening. 1 = playing.
// YouTube draws its own title and controls over the first ~3s of playback, even with controls=0,
// so the video stays hidden (the backdrop shows) until it has played 4s.
let playerState = -1;
let phoneTime = 0; // seconds into the trailer, from the player's reports
const revealed = ref(false);
function onFrameLoad() {
  playerState = -1;
  revealed.value = false;
  frame.value?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), YT_ORIGIN);
}
function onMessage(e: MessageEvent) {
  if (e.origin !== YT_ORIGIN || e.source !== frame.value?.contentWindow) return;
  try {
    const info = JSON.parse(e.data)?.info;
    if (typeof info?.playerState === "number") playerState = info.playerState;
    if (typeof info?.currentTime === "number") {
      phoneTime = info.currentTime;
      if (info.currentTime >= 4) revealed.value = true;
    }
  } catch {
    // not a player message
  }
}
onMounted(() => addEventListener("message", onMessage));
onBeforeUnmount(() => removeEventListener("message", onMessage));

let check: ReturnType<typeof setTimeout> | undefined;
function togglePlay() {
  playing.value = !playing.value;
  muted.value = false;
  soundBlocked.value = false;
  clearTimeout(check);
  if (!playing.value) return;
  check = setTimeout(() => {
    if (playing.value && playerState !== 1) {
      soundBlocked.value = true;
      muted.value = true;
    }
  }, 2500);
}
onBeforeUnmount(() => clearTimeout(check));

function toggleMute() {
  muted.value = !muted.value;
  send(muted.value ? "mute" : "unMute");
}

// Full screen: the trailer in a pop-up, with sound and YouTube's controls. The phone's copy pauses meanwhile,
// and playback carries across both ways: the pop-up starts where the phone was, and the phone picks up
// where the pop-up stopped.
const fullOpen = ref(false);
const busy = computed(() => fullOpen.value || (playing.value && !muted.value));
watch(busy, (v) => emit("busy", v));
onBeforeUnmount(() => emit("busy", false));
const fullStart = ref(0);
function openFull() {
  send("pauseVideo");
  fullStart.value = phoneTime;
  fullOpen.value = true;
}
function onFullClosed(time: number) {
  if (!showFrame.value) return;
  phoneTime = time;
  send("seekTo", [time, true]);
  send("playVideo");
}
</script>

<template>
  <!-- Only the trailer buttons are for assistive tech; the rest of the screen is a picture of the app. -->
  <div class="scr" :dir="dir">
    <div class="cover" :class="{ play: playing }">
      <div class="bd" :style="{ backgroundImage: `url('${title.backdrop}')` }" />
      <div v-if="showFrame" class="ytw">
        <iframe
          ref="frame"
          :key="frameKey"
          class="yt"
          :class="{ on: revealed }"
          :src="src"
          tabindex="-1"
          :title="t('phone.trailerOf', { title: text.title })"
          allow="autoplay; encrypted-media"
          @load="onFrameLoad"
        />
      </div>
      <div class="sh" />
      <button v-if="trailer" type="button" class="hit" :aria-label="playing ? t('phone.stop') : t('phone.play')" :aria-pressed="playing" @click="togglePlay" />
      <span v-if="trailer && !playing" class="trh" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.8v14.4L19 12z" /></svg>{{ t("phone.trailer") }}
      </span>
      <button v-if="playing" type="button" class="ctl mute":aria-label="muted ? t('phone.unmute') : t('phone.mute')" @click="toggleMute">
        <svg v-if="muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.6a7.6 7.6 0 0 1 0 10.8" /></svg>
      </button>
      <button v-if="trailer" type="button" class="ctl full" :aria-label="t('phone.fullscreen')" @click="openFull">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
      </button>
    </div>
    <UiVideoDialog
      v-if="trailer"
      v-model:open="fullOpen"
      :youtube-key="trailer.youtubeKey"
      :title="text.title"
      :subtitle="trailer.name"
      :start="fullStart"
      @closed="onFullClosed"
    />

    <div class="head" aria-hidden="true">
      <span class="po" :style="{ backgroundImage: `url('${title.poster}')` }" />
      <div class="in">
        <h3 class="ttl">{{ text.title }}</h3>
        <p class="hm">
          <span v-if="title.certification" class="cert">{{ title.certification }}</span><span dir="ltr">{{ facts }}</span>
        </p>
        <p class="hg">{{ text.genres.join(" · ") }}</p>
        <p v-if="title.kind === 'movie' && title.wins" class="aw">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5.5" /><path d="M8.6 13.3 7.5 21l4.5-2.6 4.5 2.6-1.1-7.7" /></svg>
          <b>{{ t("phone.wins", { n: title.wins.toLocaleString("en") }) }}</b>
        </p>
        <div v-if="title.kind === 'show' && title.status" class="hr">
          <span class="st" :class="title.status"><i />{{ t(`phone.status.${title.status}`) }}</span>
        </div>
      </div>
    </div>

    <div v-if="title.kind === 'show'" class="tabs" aria-hidden="true">
      <span class="on">{{ t("phone.overview") }}</span><span>{{ t("phone.episodes") }}</span><i />
    </div>

    <div class="body" aria-hidden="true">
      <div class="acts">
        <span v-if="title.kind === 'movie'" class="main">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
          <span>{{ t("phone.markWatched") }}</span>
        </span>
        <span class="main">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6.5 3.5h11v17L12 16.6 6.5 20.5z" /></svg>
          <span>{{ t("phone.addWatchlist") }}</span>
        </span>
      </div>

      <div class="rr" dir="ltr">
        <span v-if="title.ratings.app" class="r"><img src="/images/brand/tvt-rating.png" alt=""><b>{{ title.ratings.app.toFixed(1) }}</b><small v-if="title.ratings.appCount">({{ compact(title.ratings.appCount) }})</small></span>
        <span v-if="title.ratings.imdb" class="r">
          <svg class="imdb" viewBox="0 0 38 18"><rect width="38" height="18" rx="4" fill="#F5C518" /><text x="19" y="13.4" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="11.5" fill="#000">IMDb</text></svg>
          <b>{{ title.ratings.imdb.toFixed(1) }}</b><small v-if="title.ratings.imdbVotes">({{ compact(title.ratings.imdbVotes) }})</small>
        </span>
        <span v-if="title.ratings.rottenTomatoes" class="r">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="13.6" r="8.6" fill="#FA320A" /><path d="M8.2 4.4c1.6.2 2.6 1 3.1 2 .6-1.3 1.8-2 3.6-2-.7 1.1-1.5 1.8-2.6 2.2 1.4-.2 2.6.1 3.6.9-1.5.5-3 .6-4.4.1-.8 1-2 1.5-3.6 1.2.8-.7 1.3-1.4 1.6-2.2-1-.4-1.6-1.2-1.3-2.2z" fill="#00912D" /></svg>
          <b>{{ title.ratings.rottenTomatoes }}%</b>
        </span>
        <span v-if="title.ratings.metacritic" class="r">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.2" fill="#000" stroke="#ffcc34" stroke-width="1.8" /><text x="12" y="16.4" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="12" fill="#fff">m</text></svg>
          <b>{{ title.ratings.metacritic }}</b>
        </span>
      </div>

      <p v-if="text.tagline" class="tag">{{ text.tagline }}</p>
      <div class="ov"><p>{{ text.overview }}</p></div>
      <span class="dt">
        <span>{{ t("phone.details") }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 6l6 6-6 6" /></svg>
      </span>
    </div>

    <!-- chrome: top buttons, status bar, tab bar -->
    <div class="top" aria-hidden="true">
      <span class="ib"><svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
      <span class="rt">
        <span class="ib"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M16.8 2.9c-1.9 0-3.6.9-4.8 2.4-1.2-1.5-2.9-2.4-4.8-2.4C3.9 2.9 1.5 5.6 1.5 9c0 3.9 3.1 6.6 6.4 9.5.6.5 1.2 1 1.7 1.5l1.1.9c.8.6 1.8.6 2.6 0 1.1-.9 2.1-1.7 2.9-2.5 3.2-2.8 6.3-5.5 6.3-9.4 0-3.4-2.4-6.1-5.7-6.1z" /></svg></span>
        <span class="ib"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="18.5" cy="12" r="1.9" /></svg></span>
      </span>
    </div>
    <div class="sbar" dir="ltr" aria-hidden="true">
      <span class="tm">9:41</span><i class="cam" />
      <span class="ic">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.1-1.1A10 10 0 0 0 8 .6 10 10 0 0 0 .9 3.5L2 4.6a8.4 8.4 0 0 1 6-2.4zm0 3.2c1.4 0 2.7.5 3.7 1.4l1.1-1.1A7 7 0 0 0 8 3.8a7 7 0 0 0-4.8 1.9l1.1 1.1c1-.9 2.3-1.4 3.7-1.4zm0 3.2c.6 0 1.1.2 1.5.6L8 10.7 6.5 9.2c.4-.4.9-.6 1.5-.6z" /></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor" /><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity=".45" /></svg>
      </span>
    </div>
    <div class="nav" dir="ltr" aria-hidden="true">
      <span><svg viewBox="26.6 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor" stroke-width="1.7"><path d="M46.6 7H30.6C29.5 7 28.6 7.9 28.6 9V20C28.6 21.1 29.5 22 30.6 22H46.6C47.7 22 48.6 21.1 48.6 20V9C48.6 7.9 47.7 7 46.6 7Z" /><path d="M43.6 2L38.6 7L33.6 2" /></svg></span>
      <span><svg viewBox="26.6 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor" stroke-width="1.7"><path d="M45.6 3H31.6C30.5 3 29.6 3.9 29.6 5V19C29.6 20.1 30.5 21 31.6 21H45.6C46.7 21 47.6 20.1 47.6 19V5C47.6 3.9 46.7 3 45.6 3Z" /><path d="M33.6 3V21" /><path d="M29.6 7.5H33.6" /><path d="M29.6 12H47.6" /><path d="M29.6 16.5H33.6" /><path d="M43.6 3V21" /><path d="M43.6 7.5H47.6" /><path d="M43.6 16.5H47.6" /></svg></span>
      <span><svg viewBox="26.6 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor" stroke-width="1.7"><path d="M37.6 19C42.02 19 45.6 15.42 45.6 11C45.6 6.58 42.02 3 37.6 3C33.18 3 29.6 6.58 29.6 11C29.6 15.42 33.18 19 37.6 19Z" /><path d="M47.6 21L43.3 16.7" /></svg></span>
      <span><b class="av">K</b></span>
    </div>
    <i class="home" aria-hidden="true" />
  </div>
</template>

<style scoped>
/* Values are the prototype's computed styles at 402 × 874. */
.scr{--bg:#000;--ph:#22232b;--heading:#f4f6ff;--txt:#f4f5f8;--dim:#c9cedc;--muted:#9aa3bd;--acc:#ffc42e;--btn:rgba(255,255,255,.09);--btn-sh:none;--ring:rgba(255,255,255,.14);--cert:rgba(255,255,255,.32);--line:rgba(255,255,255,.08);--fade:0,0,0;
  position:relative;width:402px;height:874px;overflow:hidden;background:var(--bg);color:var(--txt);font-family:var(--font);font-size:16px;line-height:normal;text-align:start}
:root[data-theme="light"] .scr{--bg:#f5f5f7;--ph:#e2e3e9;--heading:#0e0f14;--txt:#15161c;--dim:#4a5063;--muted:#5e6476;--acc:#8a5d00;--btn:#fff;--btn-sh:0 1px 2px rgba(20,22,30,.06),0 0 0 1px rgba(16,18,27,.08);--ring:rgba(16,18,27,.14);--cert:rgba(16,18,27,.32);--line:rgba(16,18,27,.08);--fade:245,245,247}
.scr svg{display:block;flex:none}

.cover{position:relative;height:262px;overflow:hidden}
.bd{position:absolute;inset:0;background:var(--ph) center/cover no-repeat}
/* The YouTube player is its own compositing layer and can end up drawn above the .sh fade, leaving the
   video's bottom edge as a bright line. So the video fades itself out (a mask on its wrapper, in the
   cover's coordinates, matching .sh), and the layers are ordered explicitly. */
.ytw{position:absolute;z-index:0;inset:0;overflow:hidden;pointer-events:none;
  -webkit-mask-image:linear-gradient(#000 0%,#000 58%,rgba(0,0,0,.1) 86%,transparent 99%);mask-image:linear-gradient(#000 0%,#000 58%,rgba(0,0,0,.1) 86%,transparent 99%)}
.sh{z-index:1}
.yt{position:absolute;left:50%;top:0;height:100%;aspect-ratio:16/9;border:0;transform:translateX(-50%) scale(1.35);pointer-events:none}
.bd,.yt{transition:filter .5s var(--ease),opacity .6s var(--ease)}
.yt:not(.on){opacity:0}
.cover:not(.play) .bd,.cover:not(.play) .yt{filter:blur(14px) saturate(1.1)}
.cover:not(.play) .bd{transform:scale(1.12)}
/* the whole cover is the play / stop button, as in the app */
.hit{position:absolute;z-index:2;inset:0;padding:0;border:0;background:none;cursor:pointer}
.hit:focus-visible{outline:3px solid #ffc42e;outline-offset:-6px;border-radius:0}
/* glass buttons on the cover (the app's mute button). The phone is drawn scaled down, so on smaller
   screens they're drawn bigger here to stay about 28px on screen; ::before widens the touch area. */
.scr{--ctl:40px}
@media (max-width:900px){.scr{--ctl:56px}}
@media (max-width:640px){.scr{--ctl:66px}}
.ctl{position:absolute;z-index:3;bottom:62px;width:var(--ctl);height:var(--ctl);padding:0;border:0;border-radius:calc(var(--ctl) * .3);display:grid;place-items:center;cursor:pointer;color:#fff;
  background:rgba(10,10,14,.45);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
.ctl::before{content:"";position:absolute;inset:calc(var(--ctl) * -.2)}
.ctl svg{width:50%;height:50%}
.ctl:focus-visible{outline:3px solid #ffc42e;outline-offset:2px}
.full{inset-inline-end:16px}
.mute{inset-inline-end:calc(16px + var(--ctl) + 10px)}
.sh{position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.42) 0%,rgba(0,0,0,0) 26%,rgba(var(--fade),.35) 58%,rgba(var(--fade),.9) 86%,rgb(var(--fade)) 100%)}
.trh{position:absolute;z-index:3;pointer-events:none;top:126px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:7px;height:34px;padding:0 14px 0 11px;border-radius:11px;white-space:nowrap;
  background:rgba(10,10,14,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);font-size:13px;font-weight:700;color:#fff}
.trh svg{width:14px;height:14px}

.head{position:relative;z-index:2;display:flex;gap:16px;margin-top:-62px;padding:0 20px}
.po{flex:none;width:146px;height:219px;border-radius:14px;background:var(--ph) center/cover no-repeat;box-shadow:0 18px 40px -14px rgba(0,0,0,.75),0 0 0 1px var(--ring)}
.in{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;padding-bottom:2px}
.ttl{margin:0;font-family:var(--display);font-size:21px;font-weight:800;line-height:1.12;letter-spacing:-.015em;color:var(--heading);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
:root[lang="ar"] .ttl{font-weight:700;letter-spacing:0;line-height:1.3}
.hm{margin:2px 0 0;display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--dim)}
.cert{display:flex;align-items:center;height:21px;padding:0 6px;border-radius:5px;font-size:11.5px;font-weight:800;letter-spacing:.02em;box-shadow:inset 0 0 0 1.2px var(--cert)}
.hg{margin:0;font-size:13px;font-weight:600;line-height:1.35;color:var(--muted)}
.aw{margin:0;display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--muted)}
.aw svg{width:16px;height:16px;color:var(--acc)}
.aw b{font-weight:700;color:var(--acc)}
.hr{margin-top:2px;display:flex;gap:8px 12px}
.st{display:flex;align-items:center;gap:7px;height:28px;padding:0 11px;border-radius:9px;font-size:12.5px;font-weight:700}
.st i{width:7px;height:7px;border-radius:50%;background:currentColor}
.st.returning,.st.inProduction{color:#3ddc84;background:rgba(61,220,132,.12)}
.st.ended{color:#9b7bff;background:rgba(155,123,255,.14)}
.st.canceled{color:#ff6b6b;background:rgba(255,107,107,.12)}
:root[data-theme="light"] .st.returning,:root[data-theme="light"] .st.inProduction{color:#10813d}
:root[data-theme="light"] .st.ended{color:#6d48e0}
:root[data-theme="light"] .st.canceled{color:#d43c3c}

.tabs{position:relative;display:grid;grid-template-columns:1fr 1fr;margin:20px 20px 0;border-bottom:1px solid var(--line)}
.tabs span{height:40px;display:grid;place-items:center;font-size:15px;font-weight:500;color:var(--muted)}
.tabs span.on{font-weight:700;color:var(--acc)}
.tabs i{position:absolute;bottom:-1px;inset-inline-start:0;width:50%;height:2px;border-radius:2px;background:#ffc42e}

.body{padding:20px 20px 0}
.acts{display:flex;gap:10px}
.main{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 16px;border-radius:12px;background:var(--btn);box-shadow:var(--btn-sh);font-size:15.5px;font-weight:700;white-space:nowrap}
.main svg{width:20px;height:20px;color:var(--acc)}
.rr{display:flex;align-items:center;gap:16px;height:20px;margin:18px 0 0}
:root[dir="rtl"] .rr{justify-content:flex-end}
.r{display:flex;align-items:center;gap:6px}
.r img{width:20px;height:20px;border-radius:5px}
.r svg{width:17px;height:17px}
.r svg.imdb{width:36px;height:17px}
.r b{font-size:15px;font-weight:700;color:var(--heading)}
.r small{margin-left:-2px;font-size:13.5px;font-weight:500;color:var(--muted)}
.tag{margin:20px 0 6px;font-size:15px;font-weight:700;color:var(--acc)}
.ov{max-height:76px;overflow:hidden;-webkit-mask-image:linear-gradient(#000 calc(100% - 38.4px),rgba(0,0,0,.35) calc(100% - 14.4px),transparent);mask-image:linear-gradient(#000 calc(100% - 38.4px),rgba(0,0,0,.35) calc(100% - 14.4px),transparent)}
.ov p{margin:0;font-size:16px;line-height:1.55;color:var(--dim)}
.dt{display:inline-flex;align-items:center;gap:3px;height:36px;margin-top:8px;font-size:15px;font-weight:700;color:var(--acc)}
.dt svg{width:17px;height:17px}
:root[dir="rtl"] .dt svg,:root[dir="rtl"] .top .ib:first-child svg{transform:scaleX(-1)}

.top{position:absolute;z-index:20;pointer-events:none;inset:0 0 auto;height:104px;display:grid;grid-template-columns:44px 1fr 88px;align-items:center;padding:56px 10px 0;color:#fff}
.top .rt{grid-column:3;display:flex;justify-content:flex-end}
.ib{width:44px;height:44px;display:grid;place-items:center;filter:drop-shadow(0 1px 3px rgba(0,0,0,.55))}
.ib svg{width:24px;height:24px}
.sbar{position:absolute;z-index:30;pointer-events:none;inset:0 0 auto;height:56px;color:#fff;font-size:17px;font-weight:600;font-family:"Figtree",system-ui,sans-serif}
.tm{position:absolute;left:48px;top:18px;line-height:20px}
.cam{position:absolute;left:139px;top:11px;width:124px;height:36px;border-radius:20px;background:#000}
.ic{position:absolute;right:30px;top:22px;display:flex;align-items:center;gap:6px}
.nav{position:absolute;z-index:25;inset:auto 0 0;height:84px;display:grid;grid-template-columns:repeat(4,1fr);padding:0 8px 34px;background:var(--bg);border-top:1px solid var(--line);color:var(--txt)}
.nav span{display:grid;place-items:center;height:50px}
.nav svg{width:26px;height:26px}
.av{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#ffc42e;color:#1c1400;font-size:12px;font-weight:800}
.home{position:absolute;z-index:26;left:134px;bottom:8px;width:134px;height:5px;border-radius:3px;background:var(--txt)}
</style>
