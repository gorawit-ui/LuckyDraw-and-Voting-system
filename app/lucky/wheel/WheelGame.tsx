'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WheelEngine } from '@/lib/wheel/engine';
import { DEFAULT_GIFTS, DEFAULT_NAMES, randInt } from '@/lib/wheel/defaults';
import { burst, playTick, prefersReducedMotion } from '@/lib/fx';

type Phase = 'idle' | 'spinning' | 'name' | 'stopping' | 'done';
type SheetState = 'sending' | 'sent' | 'local' | 'failed';
type Log = { id: string; t: string; name: string; gift: string; round: number; sheet: SheetState };

const K = { names: 'oc_wheel_names', gifts: 'oc_wheel_gifts', logs: 'oc_wheel_logs', sound: 'oc_wheel_sound' };
const load = <T,>(k: string, fb: T): T => {
  try { const v = localStorage.getItem(k); return v == null ? fb : (JSON.parse(v) as T); } catch { return fb; }
};
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

const SHEET_LABEL: Record<SheetState, [string, string]> = {
  sending: ['กำลังส่ง…', 'text-bg-light'],
  sent: ['ส่งเข้าชีทแล้ว', 'text-bg-success'],
  local: ['เก็บในเครื่อง', 'text-bg-warning'],
  failed: ['ส่งไม่สำเร็จ', 'text-bg-danger'],
};

function Pointer() {
  return (
    <svg className="wheel-pointer" viewBox="0 0 44 52" aria-hidden="true">
      <path d="M22 50 L4 10 A20 20 0 0 1 40 10 Z" fill="#E8262B" stroke="#1A1414" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="22" cy="15" r="6" fill="#FFD23F" stroke="#1A1414" strokeWidth="3" />
    </svg>
  );
}

export default function WheelGame() {
  const [loaded, setLoaded] = useState(false);
  const [names, setNames] = useState<string[]>(DEFAULT_NAMES);
  const [gifts, setGifts] = useState<string[]>(DEFAULT_GIFTS);
  const [logs, setLogs] = useState<Log[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<{ ni: number; gi: number; name: string; gift: string } | null>(null);
  const [draftNames, setDraftNames] = useState('');
  const [draftGifts, setDraftGifts] = useState('');
  const [toast, setToast] = useState('');
  const [canFull, setCanFull] = useState(false);

  const cvA = useRef<HTMLCanvasElement>(null);
  const cvB = useRef<HTMLCanvasElement>(null);
  const engA = useRef<WheelEngine | null>(null);
  const engB = useRef<WheelEngine | null>(null);
  const soundRef = useRef(soundOn);
  const phaseRef = useRef<Phase>('idle');
  soundRef.current = soundOn;
  phaseRef.current = phase;

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? '' : t)), 2400);
  }, []);

  // ---------- โหลดข้อมูลจากเครื่อง ----------
  useEffect(() => {
    const n = load(K.names, DEFAULT_NAMES), g = load(K.gifts, DEFAULT_GIFTS);
    setNames(n); setGifts(g); setLogs(load(K.logs, [] as Log[]));
    setSoundOn(load(K.sound, true));
    setDraftNames(n.join('\n')); setDraftGifts(g.join('\n'));
    setCanFull(!!document.documentElement.requestFullscreen);
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) save(K.names, names); }, [loaded, names]);
  useEffect(() => { if (loaded) save(K.gifts, gifts); }, [loaded, gifts]);
  useEffect(() => { if (loaded) save(K.logs, logs); }, [loaded, logs]);
  useEffect(() => { if (loaded) save(K.sound, soundOn); }, [loaded, soundOn]);

  // ---------- สร้าง engine ----------
  useEffect(() => {
    const font = () => getComputedStyle(document.body).getPropertyValue('--font-body').trim() || 'sans-serif';
    const opts = { font, onTick: () => soundRef.current && playTick(), reduceMotion: prefersReducedMotion };
    const a = new WheelEngine(cvA.current!, opts);
    const b = new WheelEngine(cvB.current!, opts);
    engA.current = a; engB.current = b;
    const ro = new ResizeObserver(() => { a.size(); b.size(); });
    ro.observe(cvA.current!); ro.observe(cvB.current!);
    // วาดใหม่หลังฟอนต์โหลดเสร็จ (ไม่งั้นวัดความกว้างตัวหนังสือผิด)
    document.fonts?.ready.then(() => { a.size(); b.size(); });
    return () => { ro.disconnect(); a.destroy(); b.destroy(); };
  }, []);

  // อัปเดตช่องบนวงล้อเฉพาะตอนไม่ได้หมุน
  useEffect(() => { if (phase === 'idle') engA.current?.setItems(names); }, [names, phase]);
  useEffect(() => { if (phase === 'idle') engB.current?.setItems(gifts); }, [gifts, phase]);

  // ---------- Flow ----------
  const spin = useCallback(async () => {
    if (phaseRef.current !== 'idle' || !names.length || !gifts.length) return;
    setPhase('spinning'); phaseRef.current = 'spinning';
    const ni = randInt(names.length);
    setPicked({ ni, gi: -1, name: names[ni], gift: '' });
    engB.current!.spinFree(0.42); // วงขวาหมุนค้าง เห็นชื่อของขวัญวิ่งชัดๆ (ไม่มีผ้าคลุม)
    await engA.current!.stopAt(ni, 4200 + Math.random() * 900);
    burst(70);
    setPhase('name'); phaseRef.current = 'name';
  }, [names, gifts]);

  const stopGift = useCallback(async () => {
    if (phaseRef.current !== 'name') return;
    setPhase('stopping'); phaseRef.current = 'stopping';
    const gi = randInt(gifts.length); // สุ่ม ณ ตอนกดหยุด — กันคนเล็งจังหวะ
    setPicked((p) => (p ? { ...p, gi, gift: gifts[gi] } : p));
    await engB.current!.stopAt(gi, 2800 + Math.random() * 700);
    burst(170); window.setTimeout(() => burst(90), 420);
    setPhase('done'); phaseRef.current = 'done';
  }, [gifts]);

  const sendSheet = useCallback(async (entry: Log) => {
    setLogs((ls) => ls.map((l) => (l.id === entry.id ? { ...l, sheet: 'sending' } : l)));
    let state: SheetState = 'failed';
    try {
      const r = await fetch('/api/sheet', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: entry.name, gift: entry.gift, round: entry.round }),
      });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      state = j?.ok ? 'sent' : j?.error === 'not-configured' ? 'local' : 'failed';
    } catch { state = 'failed'; }
    setLogs((ls) => ls.map((l) => (l.id === entry.id ? { ...l, sheet: state } : l)));
    if (state === 'failed') flash('ส่งเข้าชีทไม่สำเร็จ เก็บไว้ในเครื่องแล้ว กดส่งซ้ำได้');
  }, [flash]);

  const next = useCallback(() => {
    if (phaseRef.current !== 'done' || !picked) return;
    const entry: Log = { id: crypto.randomUUID(), t: new Date().toISOString(), name: picked.name, gift: picked.gift,
      round: logs.length + 1, sheet: 'sending' };
    setLogs((ls) => [entry, ...ls]);
    // ตัดออกตามตำแหน่ง (ชื่อซ้ำกันจะไม่โดนลบพร้อมกัน)
    const nn = names.filter((_, i) => i !== picked.ni), gg = gifts.filter((_, i) => i !== picked.gi);
    setNames(nn); setGifts(gg);
    setDraftNames(nn.join('\n')); setDraftGifts(gg.join('\n'));
    setPicked(null);
    setPhase('idle'); phaseRef.current = 'idle';
    void sendSheet(entry);
  }, [picked, logs.length, names, gifts, sendSheet]);

  const primary = phase === 'idle' ? spin : phase === 'name' ? stopGift : phase === 'done' ? next : null;

  // แตะตรงไหนก็ได้บนจอเพื่อหยุดวงล้อของขวัญ
  const onStageClick = (e: React.MouseEvent) => {
    if (phaseRef.current !== 'name') return;
    if ((e.target as HTMLElement).closest('button,a,summary,textarea,input,label,table')) return;
    void stopGift();
  };

  // รีโมตพรีเซนต์ / คีย์บอร์ด: Space · Enter · → · PageDown = ปุ่มหลัก
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('textarea,input,button,summary,a')) return;
      if ([' ', 'Enter', 'ArrowRight', 'PageDown'].includes(e.key) && primary) {
        e.preventDefault();
        void primary();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [primary]);

  // ---------- เครื่องมือ ----------
  const saveLists = () => {
    const n = lines(draftNames), g = lines(draftGifts);
    setNames(n); setGifts(g); flash('บันทึกรายการแล้ว');
  };
  const resetLists = () => {
    if (!confirm('คืนค่ารายชื่อและของขวัญเป็นตัวอย่าง?')) return;
    setNames(DEFAULT_NAMES); setGifts(DEFAULT_GIFTS);
    setDraftNames(DEFAULT_NAMES.join('\n')); setDraftGifts(DEFAULT_GIFTS.join('\n'));
    flash('คืนค่าตัวอย่างแล้ว');
  };
  const clearLogs = () => { if (confirm('ล้างบันทึกผลทั้งหมด? (ดาวน์โหลด CSV ก่อนได้)')) { setLogs([]); flash('ล้างบันทึกแล้ว'); } };
  const downloadCsv = () => {
    if (!logs.length) return flash('ยังไม่มีข้อมูลให้ดาวน์โหลด');
    const rows = [['รอบที่', 'เวลา', 'ชื่อ', 'ของขวัญ'], ...logs.slice().reverse().map((l) => [l.round, new Date(l.t).toLocaleString('th-TH'), l.name, l.gift])];
    const csv = '﻿' + rows.map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'outing-lucky-wheel.csv';
    a.click();
  };
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };
  const unsent = logs.filter((l) => l.sheet === 'failed');

  const status =
    !names.length || !gifts.length ? 'รายการหมดแล้ว — เพิ่มได้ที่ "แก้รายชื่อและของขวัญ"'
    : phase === 'idle' ? 'พร้อมหมุน'
    : phase === 'spinning' ? 'กำลังหมุน…'
    : phase === 'name' ? 'แตะตรงไหนก็ได้ เพื่อหยุดวงล้อของรางวัล'
    : phase === 'stopping' ? 'กำลังหน่วง…'
    : 'ยินดีด้วย! 🎉';

  return (
    <main className={`wheel-page container-xxl py-3 py-md-4 ${phase === 'name' ? 'is-tap-to-stop' : ''}`} onClick={onStageClick}>
      {/* ---------- หัวเรื่อง ---------- */}
      <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
        <h1 className="display-pop mb-0 me-auto" style={{ fontSize: 'clamp(2rem, 6vw, 3.2rem)' }}>🎡 วงล้อคู่</h1>
        <span className="chip-pop" role="status" aria-live="polite">{status}</span>
        <button type="button" className="btn btn-pop btn-pop-cream btn-sm" onClick={() => { setSoundOn((s) => !s); if (!soundOn) playTick(); }}
          aria-pressed={soundOn} title="เสียงเข็ม">
          <i className={`bi ${soundOn ? 'bi-volume-up-fill' : 'bi-volume-mute-fill'} me-1`} />{soundOn ? 'เสียงเปิด' : 'เสียงปิด'}
        </button>
        {canFull && (
          <button type="button" className="btn btn-pop btn-pop-cream btn-sm d-none d-md-inline-block" onClick={toggleFull} title="เต็มจอ (โปรเจกเตอร์)">
            <i className="bi bi-arrows-fullscreen me-1" />เต็มจอ
          </button>
        )}
      </div>

      {/* ---------- วงล้อ 2 วง ---------- */}
      <div className="row g-3 g-lg-4">
        {[
          { key: 'A', title: 'ผู้โชคดี', icon: 'bi-person-fill', count: `${names.length} คน`, cv: cvA, label: 'ผู้โชคดี',
            val: phase === 'idle' || phase === 'spinning' ? null : picked?.name },
          { key: 'B', title: 'ของรางวัล', icon: 'bi-gift-fill', count: `${gifts.length} ชิ้น`, cv: cvB, label: 'ของรางวัลที่ได้',
            val: phase === 'done' ? picked?.gift : null },
        ].map((w) => (
          <div key={w.key} className="col-12 col-md-6">
            <section className="card-pop wheel-card h-100">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h4 mb-0"><i className={`bi ${w.icon} me-2`} />{w.title}</h2>
                <span className="chip-pop">เหลือ {w.count}</span>
              </div>
              <div className="wheel-wrap">
                <Pointer />
                <canvas ref={w.cv} className="wheel-canvas" role="img" aria-label={`วงล้อ${w.title}`} />
              </div>
              <div className="wheel-result" aria-live="polite">
                <div className="small fw-semibold opacity-75">{w.label}</div>
                <div className={`wheel-result-val ${w.val ? 'is-on' : ''}`}>{w.val ?? '— — —'}</div>
              </div>
            </section>
          </div>
        ))}
      </div>

      {/* ---------- ปุ่มหลัก ---------- */}
      <div className="d-flex flex-wrap justify-content-center gap-3 my-4">
        {(phase === 'idle' || phase === 'spinning') && (
          <button type="button" className="btn btn-pop btn-lg wheel-cta" onClick={() => void spin()}
            disabled={phase !== 'idle' || !names.length || !gifts.length}>
            <i className="bi bi-play-fill me-1" />{phase === 'spinning' ? 'กำลังหมุน…' : 'เริ่มหมุน'}
          </button>
        )}
        {(phase === 'name' || phase === 'stopping') && (
          <button type="button" className="btn btn-pop btn-pop-red btn-lg wheel-cta" onClick={() => void stopGift()} disabled={phase !== 'name'}>
            <i className="bi bi-stop-fill me-1" />หยุดวงล้อของรางวัล
          </button>
        )}
        {phase === 'done' && (
          <button type="button" className="btn btn-pop btn-pop-green btn-lg wheel-cta" onClick={next}>
            <i className="bi bi-check2-circle me-1" />บันทึกแล้วหมุนต่อ
          </button>
        )}
      </div>
      <p className="text-center text-cream small fw-semibold mb-4 d-none d-md-block">
        <i className="bi bi-keyboard me-1" />Space / Enter / → / รีโมตพรีเซนต์ = กดปุ่มหลัก
      </p>

      {/* ---------- บันทึกผล ---------- */}
      <section className="card-pop p-3 p-md-4 mb-4">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <h2 className="h4 mb-0 me-auto"><i className="bi bi-journal-check me-2" />บันทึกผล</h2>
          <span className="chip-pop">{logs.length ? `${logs.length} รายการ` : 'ยังไม่มีรายการ'}</span>
          {unsent.length > 0 && (
            <button type="button" className="btn btn-pop btn-sm" onClick={() => unsent.forEach((l) => void sendSheet(l))}>
              <i className="bi bi-arrow-repeat me-1" />ส่งเข้าชีทอีกครั้ง ({unsent.length})
            </button>
          )}
          <button type="button" className="btn btn-pop btn-pop-cream btn-sm" onClick={downloadCsv}><i className="bi bi-download me-1" />CSV</button>
          <button type="button" className="btn btn-pop btn-pop-cream btn-sm" onClick={clearLogs} disabled={!logs.length}><i className="bi bi-trash3 me-1" />ล้าง</button>
        </div>
        {logs.length ? (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0 log-table">
              <thead><tr><th>#</th><th>เวลา</th><th>ชื่อ</th><th>ของรางวัล</th><th>ชีท</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="fw-bold">{l.round}</td>
                    <td className="text-nowrap">{new Date(l.t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{l.name}</td>
                    <td>{l.gift}</td>
                    <td><span className={`badge rounded-pill border border-dark ${SHEET_LABEL[l.sheet][1]}`}>{SHEET_LABEL[l.sheet][0]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mb-0 opacity-75">ผลการหมุนจะมาอยู่ตรงนี้ — เก็บในเครื่องเสมอ แม้เน็ตล่ม</p>
        )}
      </section>

      {/* ---------- ตั้งค่า ---------- */}
      <details className="card-pop p-3 p-md-4 mb-5 wheel-settings">
        <summary className="h5 mb-0"><i className="bi bi-pencil-square me-2" />แก้รายชื่อและของขวัญ</summary>
        <fieldset disabled={phase !== 'idle'} className="mt-3">
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="in-names" className="form-label fw-bold">รายชื่อ บรรทัดละคน ({lines(draftNames).length})</label>
              <textarea id="in-names" className="form-control" rows={9} value={draftNames} onChange={(e) => setDraftNames(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label htmlFor="in-gifts" className="form-label fw-bold">ของรางวัล บรรทัดละชิ้น ({lines(draftGifts).length})</label>
              <textarea id="in-gifts" className="form-control" rows={9} value={draftGifts} onChange={(e) => setDraftGifts(e.target.value)} />
            </div>
          </div>
          <div className="form-text mb-3">ชื่อซ้ำกัน ให้ใส่ทีมต่อท้าย เช่น <code>เบนซ์ (GM)</code> · ผลส่งเข้า Google Sheet ผ่าน server (ตั้งค่าที่ env <code>SHEET_LOGGER_URL</code>)</div>
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-pop" onClick={saveLists}><i className="bi bi-save me-1" />บันทึกรายการ</button>
            <button type="button" className="btn btn-pop btn-pop-cream" onClick={resetLists}><i className="bi bi-arrow-counterclockwise me-1" />คืนค่าตัวอย่าง</button>
          </div>
        </fieldset>
      </details>

      <div className={`toast-pop ${toast ? 'show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </main>
  );
}
