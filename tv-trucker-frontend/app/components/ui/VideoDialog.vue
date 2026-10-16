<script setup lang="ts">
// A YouTube video in a modal pop-up, styled like the web app's dialogs (tvtracker-web.html .lvdlg):
// dark panel, 22px corners, dimmed backdrop. Built on the native <dialog>, which traps focus, closes on Esc
// and gives focus back to the button that opened it. Teleported to <body> so no parent's mask or transform clips it.
// Playback carries over: it opens at `start` (seconds) and reports where it got to on close, so another
// player showing the same video can pick up from there.
const props = defineProps<{ youtubeKey: string; title: string; subtitle?: string; start?: number }>();
const open = defineModel<boolean>("open", { required: true });
const emit = defineEmits<{ closed: [time: number] }>();
const { t } = useI18n();

const YT_ORIGIN = "https://www.youtube-nocookie.com";
const dlg = ref<HTMLDialogElement | null>(null);
const frame = ref<HTMLIFrameElement | null>(null);
const startAt = ref(0); // fixed when it opens, so the iframe doesn't reload while playing
let time = 0; // where playback is, from the player's own reports

const src = computed(() => {
  // `start` only takes whole seconds; the exact point is set with seekTo once the player is ready.
  const q = new URLSearchParams({ autoplay: "1", rel: "0", playsinline: "1", modestbranding: "1", enablejsapi: "1", start: String(Math.floor(startAt.value)) });
  return `https://www.youtube-nocookie.com/embed/${props.youtubeKey}?${q}`;
});

const send = (func: string, args: unknown[] = []) => frame.value?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), YT_ORIGIN);
function onFrameLoad() {
  frame.value?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), YT_ORIGIN);
}
function onMessage(e: MessageEvent) {
  if (e.origin !== YT_ORIGIN || e.source !== frame.value?.contentWindow) return;
  try {
    const d = JSON.parse(e.data);
    if (d.event === "onReady" && startAt.value > 0) send("seekTo", [startAt.value, true]);
    if (typeof d.info?.currentTime === "number") time = d.info.currentTime;
  } catch {
    // not a player message
  }
}
onMounted(() => addEventListener("message", onMessage));
onBeforeUnmount(() => removeEventListener("message", onMessage));

// The page behind doesn't scroll while the pop-up is open.
const lockScroll = (on: boolean) => {
  document.documentElement.style.overflow = on ? "hidden" : "";
};

watch(open, async (v) => {
  if (v) {
    startAt.value = props.start ?? 0;
    time = startAt.value;
  }
  await nextTick();
  if (v && dlg.value && !dlg.value.open) {
    dlg.value.showModal();
    lockScroll(true);
  } else if (!v && dlg.value?.open) {
    dlg.value.close();
  }
});

function onClose() {
  lockScroll(false);
  emit("closed", time);
  open.value = false;
}
// A click on the backdrop (outside the panel) closes it.
function onClick(e: MouseEvent) {
  if (e.target === dlg.value) dlg.value?.close();
}
onBeforeUnmount(() => lockScroll(false));
</script>

<template>
  <Teleport to="body">
    <dialog v-if="open" ref="dlg" class="vd" :aria-label="title" @close="onClose" @click="onClick">
      <div class="panel">
        <header class="hd">
          <div class="tx">
            <h2>{{ title }}</h2>
            <p v-if="subtitle">{{ subtitle }}</p>
          </div>
          <button type="button" class="x" :aria-label="t('common.close')" autofocus @click="dlg?.close()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div class="vid">
          <iframe ref="frame" :src="src" :title="title" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen @load="onFrameLoad" />
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.vd{width:min(1100px,calc(100vw - 32px),calc((100dvh - 150px) * 16 / 9 + 48px));max-width:none;max-height:none;margin:auto;padding:0;border:0;background:none;color:var(--text);overflow:visible}
.vd::backdrop{background:rgba(0,0,0,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:fade .2s ease both}
:root[data-theme="light"] .vd::backdrop{background:rgba(20,22,30,.35)}
.panel{padding:24px;border-radius:22px;background:var(--surface);box-shadow:inset 0 0 0 1px rgba(var(--glass),.1),0 30px 60px rgba(0,0,0,.6);animation:pop .24s cubic-bezier(.2,0,0,1) both}
:root[data-theme="light"] .panel{box-shadow:inset 0 0 0 1px rgba(var(--glass),.1),0 20px 44.4px rgba(20,22,30,.16)}
.hd{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}
.tx{min-width:0}
.hd h2{margin:0;font-family:var(--display);font-size:22px;font-weight:800;line-height:1.15;color:var(--heading)}
:root[lang="ar"] .hd h2{font-weight:700}
.hd p{margin:4px 0 0;font-size:13px;color:var(--muted)}
.x{flex:none;width:36px;height:36px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:rgba(var(--glass),.08);color:var(--text);transition:background .2s}
.x svg{width:18px;height:18px}
@media (hover:hover){.x:hover{background:rgba(var(--glass),.14)}}
.vid{position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000}
.vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
@keyframes pop{from{opacity:0;transform:translateY(4%) scale(.98)}}
@keyframes fade{from{opacity:0}}
@media (max-width:640px){
  .vd{width:calc(100vw - 20px)}
  .panel{padding:16px;border-radius:18px}
  .hd h2{font-size:18px}
}
</style>
