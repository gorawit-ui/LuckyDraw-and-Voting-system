/**
 * ตัดบรรทัดข้อความบนวงล้อ รองรับภาษาไทยที่ไม่มีช่องว่าง
 * พอร์ตจากต้นแบบ (docs/handoff/lucky-wheel-gacha/SPEC.md §3 "ป้ายข้อความบนวงล้อ") — อย่าเปลี่ยนพฤติกรรม
 */
type Ctx = CanvasRenderingContext2D;

const THAI_COMBINING = /[ัิ-ฺ็-๎]/;
const THAI_LEAD = /[เ-ไ]/;

function breakOK(prev: string | undefined, next: string): boolean {
  if (!prev) return false;
  if (THAI_COMBINING.test(next)) return false; // ห้ามแยกสระบน-ล่าง/วรรณยุกต์ออกจากพยัญชนะ
  if (THAI_LEAD.test(prev)) return false; // ห้ามทิ้ง เ แ โ ใ ไ ไว้ท้ายบรรทัด
  if (next === 'ำ') return false; // ไม่แยก ำ
  if (/[(\["'“]/.test(prev)) return false; // ไม่ทิ้งวงเล็บ/เครื่องหมายคำพูดเปิดไว้ท้ายบรรทัด
  if (/[)\]"'”,.!?:]/.test(next)) return false; // ไม่ขึ้นบรรทัดใหม่ด้วยวงเล็บปิด/เครื่องหมาย
  return true;
}

function splitLong(c: Ctx, word: string, maxw: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const ch of word) {
    if (cur && c.measureText(cur + ch).width > maxw && breakOK(cur[cur.length - 1], ch)) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/** หาชุดจุดตัดที่ทำให้ทุกบรรทัดยาวใกล้เคียงกันที่สุด (DP ลด squared slack) */
function bestSplit(t: string, pts: number[], lines: number, maxw: number, wOf: (a: number, b: number) => number) {
  const INF = Infinity;
  const M = pts.length;
  let prev = new Array<number>(M).fill(INF);
  prev[0] = 0;
  const trail: number[][] = [];
  for (let l = 1; l <= lines; l++) {
    const row = new Array<number>(M).fill(INF);
    const bk = new Array<number>(M).fill(-1);
    for (let j = 1; j < M; j++) {
      for (let i = 0; i < j; i++) {
        if (prev[i] === INF) continue;
        const w = wOf(pts[i], pts[j]);
        if (w > maxw || w === 0) continue;
        let cost = (maxw - w) * (maxw - w);
        if (t[pts[j] - 1] === ' ' || t[pts[j]] === ' ') cost *= 0.35; // ช่องว่างที่ผู้ใช้พิมพ์เอง = จุดตัดดีที่สุด
        const tot = prev[i] + cost;
        if (tot < row[j]) {
          row[j] = tot;
          bk[j] = i;
        }
      }
    }
    trail.push(bk);
    prev = row;
  }
  const last = M - 1;
  if (prev[last] === INF) return null;
  const out: string[] = [];
  let j = last;
  for (let l = lines - 1; l >= 0; l--) {
    const i = trail[l][j];
    out.unshift(t.slice(pts[i], pts[j]).trim());
    j = i;
  }
  return out.every((x) => x.length) ? out : null;
}

let THAI_SEG: Intl.Segmenter | null = null;
try {
  THAI_SEG = new Intl.Segmenter('th', { granularity: 'word' });
} catch {
  /* เบราว์เซอร์เก่า — ตัดตามช่องว่าง/ตัวอักษรแทน */
}

function wordPoints(t: string): Set<number> {
  const set = new Set<number>();
  if (THAI_SEG) for (const g of THAI_SEG.segment(t)) set.add(g.index);
  for (let i = 1; i < t.length; i++) if (t[i - 1] === ' ') set.add(i);
  return set;
}

export function wrapLabel(
  c: Ctx, text: string, maxw: number, maxLines: number, opts: { wordsOnly?: boolean } = {},
): { lines: string[]; fits: boolean } {
  const t = text.trim();
  if (c.measureText(t).width <= maxw) return { lines: [t], fits: true };
  const N = t.length;
  const cache = new Map<string, number>();
  const wOf = (a: number, b: number) => {
    const k = a + ':' + b;
    let v = cache.get(k);
    if (v === undefined) {
      v = c.measureText(t.slice(a, b).trim()).width;
      cache.set(k, v);
    }
    return v;
  };

  // รอบแรก: ตัดเฉพาะรอยต่อคำจริง
  const words = wordPoints(t);
  const wpts = [0];
  for (let i = 1; i < N; i++) if (words.has(i) && breakOK(t[i - 1], t[i])) wpts.push(i);
  wpts.push(N);
  for (let l = 2; l <= maxLines; l++) {
    const r = bestSplit(t, wpts, l, maxw, wOf);
    if (r) return { lines: r, fits: true };
  }

  if (opts.wordsOnly) return { lines: [t], fits: false };

  // รอบสอง: ยอมตัดกลางคำ (ตามกฎ breakOK)
  const pts = [0];
  for (let i = 1; i < N; i++) if (t[i - 1] === ' ' || breakOK(t[i - 1], t[i])) pts.push(i);
  pts.push(N);
  for (let l = 2; l <= maxLines; l++) {
    const r = bestSplit(t, pts, l, maxw, wOf);
    if (r) return { lines: r, fits: true };
  }

  // ทางสุดท้าย: จุดไข่ปลา
  const pieces: { t: string; sp: boolean }[] = [];
  t.split(/\s+/).forEach((w) => {
    if (c.measureText(w).width <= maxw) pieces.push({ t: w, sp: true });
    else splitLong(c, w, maxw).forEach((q, i) => pieces.push({ t: q, sp: i === 0 }));
  });
  const lines: string[] = [];
  let cur = '';
  for (const pc of pieces) {
    const cand = cur ? (pc.sp ? cur + ' ' + pc.t : cur + pc.t) : pc.t;
    if (cur && c.measureText(cand).width > maxw) {
      lines.push(cur);
      cur = pc.t;
    } else cur = cand;
  }
  if (cur) lines.push(cur);
  const keep = lines.slice(0, maxLines);
  let lastLn = keep[keep.length - 1];
  while (c.measureText(lastLn + '…').width > maxw && lastLn.length > 1) lastLn = lastLn.slice(0, -1);
  keep[keep.length - 1] = lastLn + '…';
  return { lines: keep, fits: false };
}
