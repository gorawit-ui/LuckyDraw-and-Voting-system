/** เอฟเฟกต์ฝั่งเบราว์เซอร์: เสียงติ๊ก (Web Audio) + พลุ (Canvas) — ไม่โหลดไฟล์ภายนอก */

let actx: AudioContext | null = null;

/** square wave 1500→380 Hz ~55ms (ตาม SPEC) */
export function playTick() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!actx) actx = new AC();
    if (actx.state === 'suspended') void actx.resume();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(1500, t);
    o.frequency.exponentialRampToValueAtTime(380, t + 0.04);
    g.gain.setValueAtTime(0.075, t);
    g.gain.exponentialRampToValueAtTime(0.0006, t + 0.055);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + 0.07);
  } catch {
    /* เบราว์เซอร์ไม่รองรับเสียง — ข้ามไป */
  }
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CONF_COLORS = ['#FFD23F', '#E8262B', '#3BB54A', '#5BC8F0', '#FF8A1F', '#FFF6E0', '#1A1414'];
type P = { x: number; y: number; vx: number; vy: number; w: number; h: number; rot: number; vr: number; c: string; life: number };
let parts: P[] = [];
let running = false;
let cv: HTMLCanvasElement | null = null;

function ensureCanvas() {
  if (cv && document.body.contains(cv)) return cv;
  cv = document.createElement('canvas');
  Object.assign(cv.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2000' });
  document.body.appendChild(cv);
  const fit = () => {
    const d = window.devicePixelRatio || 1;
    cv!.width = innerWidth * d; cv!.height = innerHeight * d;
    cv!.style.width = innerWidth + 'px'; cv!.style.height = innerHeight + 'px';
    cv!.getContext('2d')!.setTransform(d, 0, 0, d, 0, 0);
  };
  fit();
  addEventListener('resize', fit);
  return cv;
}

/** พลุกระดาษ — n = จำนวนชิ้น */
export function burst(n = 110, origin?: { x: number; y: number }) {
  if (prefersReducedMotion()) return;
  const c = ensureCanvas().getContext('2d')!;
  const ox = origin?.x ?? innerWidth / 2, oy = origin?.y ?? innerHeight * 0.42;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9;
    parts.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, w: 6 + Math.random() * 7, h: 9 + Math.random() * 10,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35, c: CONF_COLORS[i % CONF_COLORS.length], life: 150 + Math.random() * 80 });
  }
  if (running) return;
  running = true;
  const tick = () => {
    c.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 60);
    for (const p of parts) {
      p.vy += 0.22; p.vx *= 0.995; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.c;
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      c.restore();
    }
    if (parts.length) requestAnimationFrame(tick);
    else { running = false; c.clearRect(0, 0, innerWidth, innerHeight); }
  };
  requestAnimationFrame(tick);
}
