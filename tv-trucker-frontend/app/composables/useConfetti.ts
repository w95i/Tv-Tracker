// The app's SERIES COMPLETE confetti (tvtracker.html): two cannons from the bottom corners, then ~2.5s of rain
// from the top. Paper pieces tumble in 3D (the flip shows a darker back), flutter sideways and fall with air drag.
// Drawn on a canvas laid over `host` (which must be positioned); never blocks taps; skipped with Reduce Motion.
const COLORS = ["#FFC42E", "#FF5C8A", "#4DA3FF", "#3DDC97", "#A66BFF", "#FF8A3D", "#FFFFFF"];

interface Bit {
  x: number; y: number; vx: number; vy: number;
  kind: "rect" | "ribbon" | "square" | "circle";
  c: string; back: string; w: number; h: number;
  rot: number; vr: number; flip: number; vf: number; sway: number; vs: number; amp: number; age: number;
}

export function fireConfetti(host: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = host.getBoundingClientRect();
  const d = devicePixelRatio || 1;
  const cv = document.createElement("canvas");
  cv.setAttribute("aria-hidden", "true");
  Object.assign(cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "20" });
  cv.width = box.width * d;
  cv.height = box.height * d;
  host.appendChild(cv);
  const g = cv.getContext("2d")!;
  g.setTransform(d, 0, 0, d, 0, 0);
  const w = box.width, h = box.height;
  const k = Math.min(1, w / 402); // the app's screen is 402pt wide: same-size pieces, same flight
  const rnd = (a: number, z: number) => a + Math.random() * (z - a);
  const shade = (hex: string, f: number) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (v: number) => Math.round(v * f);
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
  };
  const piece = (x: number, y: number, vx: number, vy: number): Bit => {
    const kind = Math.random() < 0.55 ? "rect" : Math.random() < 0.5 ? "ribbon" : Math.random() < 0.6 ? "square" : "circle";
    const c = COLORS[Math.floor(Math.random() * COLORS.length)]!;
    return {
      x, y, vx, vy, kind, c, back: shade(c, 0.62),
      w: k * (kind === "ribbon" ? rnd(12, 16) : kind === "rect" ? rnd(8, 11) : rnd(6, 8)),
      h: k * (kind === "ribbon" ? rnd(2.4, 3.2) : kind === "rect" ? rnd(4, 5.5) : 0),
      rot: rnd(0, 6.28), vr: rnd(-7, 7), flip: rnd(0, 6.28), vf: rnd(6, 14), sway: rnd(0, 6.28), vs: rnd(2, 4.5), amp: k * rnd(18, 46), age: 0,
    };
  };
  let bits: Bit[] = [];
  // the cannons
  for (const side of [0, 1]) {
    for (let i = 0; i < 80; i++) {
      const sp = k * rnd(700, 1350), up = rnd(1.05, 1.45), dir = side ? -1 : 1;
      bits.push(piece(side ? w + 6 : -6, h * 0.92, dir * Math.cos(up) * sp, -Math.sin(up) * sp));
    }
  }
  const rainRate = 70, rainUntil = performance.now() + 2500;
  const draw = (p: Bit) => {
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.rot);
    const f = Math.cos(p.flip);
    g.scale(1, Math.max(0.08, Math.abs(f)));
    g.fillStyle = f >= 0 ? p.c : p.back;
    if (p.kind === "circle") {
      g.beginPath();
      g.arc(0, 0, p.w / 2, 0, 6.29);
      g.fill();
    } else if (p.kind === "square") g.fillRect(-p.w / 2, -p.w / 2, p.w, p.w);
    else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    g.restore();
  };
  let last = performance.now();
  const tick = (t: number) => {
    const dt = Math.min(0.033, (t - last) / 1000);
    last = t;
    const now = performance.now();
    // the rain
    if (now < rainUntil) {
      let n = rainRate * dt;
      while (n > 0) {
        if (Math.random() < n) bits.push(piece(rnd(-10, w + 10), rnd(-40, -10), k * rnd(-30, 30), k * rnd(80, 190)));
        n -= 1;
      }
    }
    g.clearRect(0, 0, w, h);
    bits = bits.filter((p) => p.y < h + 30 && p.age < 7);
    for (const p of bits) {
      p.age += dt;
      p.vy += 980 * k * dt;
      p.vx *= Math.pow(0.25, dt);
      p.vy *= Math.pow(p.vy > 0 ? 0.12 : 0.7, dt);
      p.vy = Math.min(p.vy, k * 150 + p.w * 6);
      p.sway += p.vs * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      p.x += (p.vx + Math.sin(p.sway) * p.amp) * dt;
      p.y += p.vy * dt;
      g.globalAlpha = p.age > 5.5 ? Math.max(0, 1 - (p.age - 5.5) / 1.5) : 1;
      draw(p);
      g.globalAlpha = 1;
    }
    if (bits.length || now < rainUntil) requestAnimationFrame(tick);
    else cv.remove();
  };
  requestAnimationFrame(tick);
}
