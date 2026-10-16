// The app's SERIES COMPLETE confetti (specs/app-my-shows-rules-and-motion.md): two corner bursts, then about
// 2.5s of rain, multicolour. Drawn on a canvas laid over `host`; nothing with reduced motion.
const COLORS = ["#ffc42e", "#ff6b6b", "#3ddc84", "#9b7bff", "#3d9bff", "#f4f5f8"];

interface Bit { x: number; y: number; vx: number; vy: number; r: number; spin: number; w: number; h: number; c: string; life: number }

export function fireConfetti(host: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = host.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  Object.assign(cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "20" });
  cv.width = box.width * dpr;
  cv.height = box.height * dpr;
  host.appendChild(cv);
  const g = cv.getContext("2d")!;
  g.scale(dpr, dpr);
  const W = box.width, H = box.height;
  const bits: Bit[] = [];
  const add = (x: number, y: number, vx: number, vy: number) =>
    bits.push({ x, y, vx, vy, r: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.4, w: 6 + Math.random() * 6, h: 4 + Math.random() * 5, c: COLORS[(Math.random() * COLORS.length) | 0]!, life: 0 });
  // two bursts from the bottom corners
  for (let i = 0; i < 70; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.9, v = 9 + Math.random() * 8;
    add(0, H, Math.cos(a + 0.55) * v, Math.sin(a) * v);
    add(W, H, -Math.cos(a + 0.55) * v, Math.sin(a) * v);
  }
  const t0 = performance.now();
  let last = t0;
  const frame = (now: number) => {
    const dt = Math.min(2, (now - last) / 16.7);
    last = now;
    // the rain, for 2.5s
    if (now - t0 < 2500) for (let i = 0; i < 3; i++) add(Math.random() * W, -10, (Math.random() - 0.5) * 2, 1 + Math.random() * 2);
    g.clearRect(0, 0, W, H);
    for (const b of bits) {
      b.vy += 0.28 * dt;
      b.vx *= 0.99;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.r += b.spin * dt;
      b.life += dt;
      g.save();
      g.translate(b.x, b.y);
      g.rotate(b.r);
      g.scale(1, Math.cos(b.life * 0.2));
      g.fillStyle = b.c;
      g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      g.restore();
    }
    for (let i = bits.length - 1; i >= 0; i--) if (bits[i]!.y > H + 30) bits.splice(i, 1);
    if (bits.length || now - t0 < 2500) requestAnimationFrame(frame);
    else cv.remove();
  };
  requestAnimationFrame(frame);
}
