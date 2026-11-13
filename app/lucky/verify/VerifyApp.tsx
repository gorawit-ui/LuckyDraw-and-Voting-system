'use client';
import { useEffect, useState } from 'react';
import { checkRules, drawCircle } from '@/lib/fair-draw';
import { diceSeed } from '@/lib/gacha/logic';
import { useGacha } from '@/lib/gacha/mock-store';

/**
 * ตรวจผลด้วยตัวเอง — คำนวณในเบราว์เซอร์ของคุณเองด้วยสูตรเดียวกับที่ใช้สุ่ม (lib/fair-draw.ts)
 * กรอกรายชื่อ + แต้มลูกเต๋าไว้ให้จากลิงก์/QR หรือจากห้องล่าสุด แก้เองได้ทุกช่อง
 */
export default function VerifyApp() {
  const { room } = useGacha();
  const [names, setNames] = useState('');
  const [dice, setDice] = useState('');
  const [res, setRes] = useState<{ pairs: [string, string][]; rules: ReturnType<typeof checkRules> } | null>(null);
  const [err, setErr] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('n') && q.get('d')) { setNames(q.get('n')!); setDice(q.get('d')!); setPrefilled(true); return; }
    const want = q.get('room');
    if (room?.status === 'drawn' && (!want || want === room.id)) { setNames(room.members.map((m) => m.name).join('\n')); setDice(diceSeed(room.dice)); setPrefilled(true); }
  }, [room, prefilled]);

  const calc = async () => {
    setErr(''); setRes(null);
    try {
      const list = names.split('\n').map((s) => s.trim()).filter(Boolean);
      const pairs = await drawCircle(list, dice.trim());
      setRes({ pairs, rules: checkRules(pairs) });
    } catch (e) { setErr((e as Error).message); }
  };
  const official = room?.status === 'drawn' && room.pairs ? room.pairs : null;
  const same = res && official ? JSON.stringify(res.pairs) === JSON.stringify(official) : null;

  return (
    <main className="container py-4" style={{ maxWidth: 900 }}>
      <h1 className="display-pop mb-2" style={{ fontSize: 'clamp(1.8rem, 6vw, 2.8rem)' }}>🔍 ตรวจผลด้วยตัวเอง</h1>
      <p className="text-cream fw-semibold">ผลขึ้นกับ <u>รายชื่อ</u> + <u>แต้มลูกเต๋า</u> เท่านั้น — ข้อมูลเดิมได้ผลเดิมทุกครั้งบนทุกเครื่อง คำนวณในเครื่องคุณเอง ไม่ส่งข้อมูลไปไหน</p>
      <div className="card-pop p-3 p-md-4 mb-3">
        <div className="row g-3">
          <div className="col-md-7">
            <label htmlFor="v-names" className="form-label fw-bold">รายชื่อที่ล็อก (บรรทัดละคน · ลำดับไม่มีผล ระบบเรียงตามตัวอักษรเอง)</label>
            <textarea id="v-names" className="form-control" rows={10} value={names} onChange={(e) => setNames(e.target.value)} />
          </div>
          <div className="col-md-5">
            <label htmlFor="v-dice" className="form-label fw-bold">แต้มลูกเต๋า (คั่นด้วย - ตามลำดับที่ทอย)</label>
            <input id="v-dice" className="form-control form-control-lg mb-3" placeholder="เช่น 3-5-2" value={dice} onChange={(e) => setDice(e.target.value)} />
            <button type="button" className="btn btn-pop btn-lg w-100" onClick={() => void calc()}><i className="bi bi-calculator me-1" />คำนวณ</button>
            {err && <div className="alert alert-danger border-2 border-dark mt-3 mb-0">{err}</div>}
          </div>
        </div>
      </div>
      {res && (
        <div className="card-pop p-3 p-md-4 mb-3">
          {same !== null && (
            <div className={`alert border-2 border-dark fw-bold ${same ? 'alert-success' : 'alert-warning'}`}>
              {same ? '✓ ตรงกับผลบนจอเวทีทุกคู่' : 'ไม่ตรงกับผลห้องล่าสุด — ตรวจว่ารายชื่อและแต้มตรงกับที่ล็อกบนเวทีไหม'}
            </div>
          )}
          <ul className="list-unstyled fw-bold mb-3">
            <li>{res.rules.noSelf ? '✅' : '❌'} ไม่มีใครได้ชื่อตัวเอง</li>
            <li>{res.rules.unique ? '✅' : '❌'} ทุกคนได้ชื่อไม่ซ้ำกัน</li>
            <li>{res.rules.oneEach ? '✅' : '❌'} ทุกคนให้และได้รับคนละ 1 ชิ้น</li>
          </ul>
          <ol className="pairs-list mb-0">{res.pairs.map(([a, b]) => <li key={a}><b>{a}</b> <i className="bi bi-arrow-right" /> {b}</li>)}</ol>
        </div>
      )}
      <details className="card-pop p-3 p-md-4">
        <summary className="fw-bold">สูตรที่ใช้ (สำหรับคนอยากดูโค้ด)</summary>
        <ol className="mt-2 mb-0">
          <li>เรียงรายชื่อตามตัวอักษร (ไม่มีใครจัดลำดับเองได้)</li>
          <li>เอา &quot;แต้มลูกเต๋า | รายชื่อทั้งหมด | ครั้งที่&quot; ไปทำเป็นตัวเลขสุ่ม (SHA-256)</li>
          <li>สลับที่ให้เป็นวงกลมวงเดียว (Sattolo) → ไม่มีใครติดตัวเอง</li>
          <li>แต่ละคนให้ของคนถัดไปในวง</li>
        </ol>
      </details>
    </main>
  );
}
