/**
 * Canvas wheel engine — พอร์ตจากต้นแบบที่ผู้ใช้อนุมัติแล้ว
 * กฎสำคัญ (SPEC §3): ease-out quartic · หมุน 4–6 รอบ · หยุดแล้วหยุดเลย ไม่เด้ง/ไม่ไหลกลับ
 * จอด "เลยแนวบนไปทางขวาเสมอ" (0.07 + rand*0.32)*seg · เข็มเป็น SVG นิ่งด้านบน (อยู่ใน component)
 * ❌ ห้ามเพิ่ม: ผ้าคลุมวงล้อ, หมุดรอบวง, เข็มดีด, จังหวะค้างคาหมุด
 */
import { wrapLabel } from './thai-wrap';

// สีช่อง — ธีม Spicy Snack Pack (ลำดับสลับร้อน/เย็นให้ช่องติดกันตัดกันชัด)
export const WHEEL_COLORS = ['#FFD23F', '#2C6FD1', '#2E9A3E', '#B3121B', '#5BC8F0', '#FF8A1F'];
const INK = '#1A1414';
const CREAM = '#FFF6E0';
const MUSTARD = '#FFD23F';

/** พื้นสว่างใช้ตัวหนังสือเข้ม อ่านออกจากหลังห้อง */
export function inkOn(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 138 ? INK : '#FFFFFF';
}

type Label = { fs: number; lines: string[]; maxW: number };

export class WheelEngine {
  private ctx: CanvasRenderingContext2D;
  private rot = -Math.PI / 2;
  private items: string[] = [];
  private labels: Label[] = [];
  private bgs: string[] = [];
  private W = 300;
  private lastPeg: number | null = null;
  private spinning = false;
  private free = false;
  private speed = 0.4;
  private raf = 0;
  private dead = false;

  constructor(
    private cv: HTMLCanvasElement,
    private opts: { font: () => string; onTick?: () => void; reduceMotion?: () => boolean },
  ) {
    this.ctx = cv.getContext('2d')!;
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
  }

  setItems(items: string[]) {
    this.items = items;
    this.layout();
    this.draw();
  }

  size() {
    const r = this.cv.getBoundingClientRect();
    const d = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    this.cv.width = r.width * d;
    this.cv.height = r.width * d;
    this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.W = r.width || 300;
    this.layout();
    this.draw();
  }

  /** คำนวณ layout ป้ายครั้งเดียวตอน setItems/resize ไม่คำนวณทุกเฟรม */
  layout() {
    const c = this.ctx, W = this.W, R = W / 2 - 10, n = this.items.length;
    if (!n) { this.labels = []; return; }
    const seg = (Math.PI * 2) / n, hub = W * 0.085, maxw = R - hub - 26;
    const base = Math.max(11, Math.min(20, W / 16 - Math.max(0, n - 10) * 0.3));
    const fam = this.opts.font();
    this.labels = this.items.map((t) => {
      const room = seg * R * 0.56;
      const tryAt = (size: number, wordsOnly: boolean) => {
        c.font = `700 ${size}px ${fam}`;
        const maxLines = Math.max(1, Math.min(3, Math.floor(room / (size * 1.18))));
        return wrapLabel(c, t, maxw, maxLines, { wordsOnly });
      };
      // 1) ลดขนาดตัวอักษรก่อน โดยตัดบรรทัดเฉพาะรอยต่อคำ (ไม่ต่ำกว่า 70% ของขนาดปกติ ป้ายจะได้ไม่เล็กต่างกันมาก)
      const floorWords = Math.max(11, Math.round(base * 0.7));
      let fs = base;
      let wr = tryAt(fs, true);
      while (!wr.fits && fs > floorWords) wr = tryAt(--fs, true);
      // 2) ไม่ได้จริงๆ ค่อยยอมตัดกลางคำ แล้วลดต่อได้ถึง 11px
      if (!wr.fits) {
        fs = base;
        for (;;) {
          wr = tryAt(fs, false);
          if (wr.fits || fs <= 11) break;
          fs -= 1;
        }
      }
      c.font = `700 ${fs}px ${fam}`;
      return { fs, lines: wr.lines, maxW: Math.max(...wr.lines.map((l) => c.measureText(l).width)) };
    });
    this.bgs = this.items.map((_, i) =>
      n % WHEEL_COLORS.length === 1 && i === n - 1 ? WHEEL_COLORS[2] : WHEEL_COLORS[i % WHEEL_COLORS.length],
    );
  }

  draw() {
    const c = this.ctx, W = this.W, R = W / 2 - 10, mid = W / 2, n = this.items.length;
    const fam = this.opts.font();
    c.clearRect(0, 0, W, W);
    c.save();
    c.translate(mid, mid);
    // ขอบนอก: หมึกหนา + วงมัสตาร์ด (สไตล์สติกเกอร์)
    c.beginPath(); c.arc(0, 0, R + 8, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
    c.beginPath(); c.arc(0, 0, R + 3.5, 0, Math.PI * 2); c.strokeStyle = MUSTARD; c.lineWidth = 3; c.stroke();
    if (!n) {
      c.fillStyle = CREAM; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; c.font = `700 ${Math.max(14, W / 18)}px ${fam}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('หมดแล้ว 🎉', 0, -W * 0.18);
      c.restore();
      this.drawHub();
      return;
    }
    c.rotate(this.rot);
    const seg = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, i * seg, (i + 1) * seg); c.closePath();
      c.fillStyle = this.bgs[i]; c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      const lb = this.labels[i];
      if (lb) {
        const abs = this.rot + i * seg + seg / 2;
        const flip = Math.cos(abs) < 0; // ครึ่งวงซ้ายพลิก 180° ไม่ให้อ่านกลับหัว
        c.save();
        c.rotate(i * seg + seg / 2 + (flip ? Math.PI : 0));
        c.textAlign = 'center'; c.textBaseline = 'middle'; // ทุกบรรทัดกึ่งกลางกันเอง
        c.font = `700 ${lb.fs}px ${fam}`;
        c.fillStyle = inkOn(this.bgs[i]);
        // หลังหมุนเพิ่ม π แกน y ของครึ่งซ้ายตั้งตรงอยู่แล้ว → ไม่ต้องกลับลำดับบรรทัด
        // (ต้นแบบเดิมคูณ -1 ทำให้ป้ายหลายบรรทัดฝั่งซ้ายเรียงกลับหัวกลับหาง)
        const m = R - 18 - lb.maxW / 2, x = flip ? -m : m, lh = lb.fs * 1.18;
        lb.lines.forEach((ln, k) => c.fillText(ln, x, (k - (lb.lines.length - 1) / 2) * lh));
        c.restore();
      }
    }
    c.restore();
    this.drawHub();
    this.trackPegs();
  }

  private drawHub() {
    const c = this.ctx, W = this.W, mid = W / 2;
    c.beginPath(); c.arc(mid, mid, W * 0.085, 0, Math.PI * 2); c.fillStyle = CREAM; c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.arc(mid, mid, W * 0.034, 0, Math.PI * 2); c.fillStyle = '#E8262B'; c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  }

  /** เสียงติ๊กทุกครั้งที่ช่องข้ามเข็ม */
  private trackPegs() {
    const n = this.items.length;
    if (!n) return;
    const idx = Math.floor((-Math.PI / 2 - this.rot) / ((Math.PI * 2) / n));
    if (this.lastPeg === null) { this.lastPeg = idx; return; }
    if (idx !== this.lastPeg) {
      this.lastPeg = idx;
      if (this.spinning) this.opts.onTick?.();
    }
  }

  /** หมุนค้างไปเรื่อยๆ จนกว่าจะสั่งหยุด (วงของขวัญ) */
  spinFree(speed = 0.42) {
    this.free = true; this.spinning = true; this.speed = speed;
    if (this.opts.reduceMotion?.()) return;
    let last = performance.now();
    const step = (now: number) => {
      if (!this.free || this.dead) return;
      const dt = Math.min(60, now - last);
      last = now;
      this.rot += (this.speed * dt) / 16.7;
      this.draw();
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  /** หน่วงลงจนหยุดที่ช่อง index — จบตรงไหนคือตรงนั้น */
  stopAt(index: number, duration: number): Promise<void> {
    this.free = false; this.spinning = true;
    cancelAnimationFrame(this.raf);
    const n = this.items.length, seg = (Math.PI * 2) / n;
    const from = this.rot, turns = 4 + Math.floor(Math.random() * 3);
    let to = -Math.PI / 2 - (index + 0.5) * seg + (0.07 + Math.random() * 0.32) * seg;
    while (to < from + turns * Math.PI * 2) to += Math.PI * 2;
    const t0 = performance.now();
    return new Promise((res) => {
      if (this.opts.reduceMotion?.()) {
        this.rot = to; this.spinning = false; this.draw(); res(); return;
      }
      const step = (now: number) => {
        if (this.dead) return res();
        const p = Math.min(1, (now - t0) / duration);
        this.rot = from + (to - from) * (1 - Math.pow(1 - p, 4)); // ease-out quartic
        this.draw();
        if (p < 1) this.raf = requestAnimationFrame(step);
        else { this.rot = to; this.spinning = false; this.draw(); res(); }
      };
      this.raf = requestAnimationFrame(step);
    });
  }
}
