'use client';
import { useEffect, useState } from 'react';
import { checkRules, drawCircle } from '@/lib/fair-draw';
import { DRAW_SEED, labelOf, parseLabel } from '@/lib/gacha/logic';
import { useGacha } from '@/lib/gacha/mock-store';

/**
 * ตรวจผลด้วยตัวเอง — คำนวณในเบราว์เซอร์ของคุณเองด้วยสูตรเดียวกับที่ใช้สุ่ม (lib/fair-draw.ts)
 * ข้อมูลที่ใช้ = รายชื่อ "Lucky Number ชื่อ" ของทุกคนที่ล็อก (ใส่ให้จากลิงก์/QR หรือห้องล่าสุด แก้เองได้)
 */
export default function VerifyApp() {
  const { room } = useGacha();
  const [names, setNames] = useState('');
  const [res, setRes] = useState<{ pairs: [string, string][]; rules: ReturnType<typeof checkRules> } | null>(null);
  const [err, setErr] = useState('');
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled) return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('n')) { setNames(q.get('n')!); setPrefilled(true); return; }
    const want = q.get('room');
    if (room?.status === 'drawn' && (!want || want === room.id)) {
      setNames([...room.members].sort((a, b) => a.lucky - b.lucky).map(labelOf).join('\n')); setPrefilled(true);
    }
  }, [room, prefilled]);

  const calc = async () => {
    setErr(''); setRes(null);
    try {
      const list = names.split('\n').map((s) => s.trim()).filter(Boolean);
      const pairs = await drawCircle(list, DRAW_SEED);
      setRes({ pairs, rules: checkRules(pairs) });
    } catch (e) { setErr((e as Error).message); }
  };
  const official = room?.status === 'drawn' && room.pairs ? room.pairs : null;
  const same = res && official ? JSON.stringify(res.pairs) === JSON.stringify(official) : null;
  // แสดงแบบเดียวกับจอเวที: ชื่อคุณ ← ได้ของขวัญจาก (เรียงตามเลข)
  const rows = res ? res.pairs.map(([giver, me]) => [me, giver] as const).sort((a, b) => (parseLabel(a[0]).lucky ?? 0) - (parseLabel(b[0]).lucky ?? 0)) : [];

  return (
    <main className="container py-4" style={{ maxWidth: 900 }}>
      <h1 className="display-pop mb-2" style={{ fontSize: 'clamp(1.8rem, 6vw, 2.8rem)' }}>🔍 ตรวจผลด้วยตัวเอง</h1>
      <p className="text-cream fw-semibold">ผลขึ้นกับ <u>รายชื่อ + Lucky Number ของทุกคน</u> เท่านั้น — ข้อมูลเดิมได้ผลเดิมทุกครั้งบนทุกเครื่อง คำนวณในเครื่องคุณเอง ไม่ส่งข้อมูลไปไหน</p>
      <div className="card-pop p-3 p-md-4 mb-3">
        <label htmlFor="v-names" className="form-label fw-bold">รายชื่อที่ล็อก: บรรทัดละคน รูปแบบ &quot;เลข ชื่อ&quot; (ลำดับไม่มีผล)</label>
        <textarea id="v-names" className="form-control mb-3" rows={10} placeholder={'8 เบนซ์ (GM)\n17 ป๊อป (Marketing)\n88 ทิม (CEO)'} value={names} onChange={(e) => setNames(e.target.value)} />
        <button type="button" className="btn btn-pop btn-lg" onClick={() => void calc()}><i className="bi bi-calculator me-1" />คำนวณ</button>
        {err && <div className="alert alert-danger border-2 border-dark mt-3 mb-0">{err}</div>}
      </div>
      {res && (
        <div className="card-pop p-3 p-md-4 mb-3">
          {same !== null && (
            <div className={`alert border-2 border-dark fw-bold ${same ? 'alert-success' : 'alert-warning'}`}>
              {same ? '✓ ตรงกับผลบนจอเวทีทุกคู่' : 'ไม่ตรงกับผลห้องล่าสุด — ตรวจว่ารายชื่อและเลขตรงกับที่ล็อกบนเวทีไหม'}
            </div>
          )}
          <ul className="list-unstyled fw-bold mb-3">
            <li>{res.rules.noSelf ? '✅' : '❌'} ไม่มีใครได้ชื่อตัวเอง</li>
            <li>{res.rules.unique ? '✅' : '❌'} ทุกคนได้ชื่อไม่ซ้ำกัน</li>
            <li>{res.rules.oneEach ? '✅' : '❌'} ทุกคนให้และได้รับคนละ 1 ชิ้น</li>
          </ul>
          <table className="table table-sm result-table mb-0">
            <thead><tr><th>ชื่อคุณ</th><th>ได้รับของขวัญจาก</th></tr></thead>
            <tbody>{rows.map(([me, from]) => <tr key={me}><td>{me}</td><td><i className="bi bi-gift me-1" />{from}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <details className="card-pop p-3 p-md-4">
        <summary className="fw-bold">สูตรที่ใช้ (สำหรับคนอยากดูโค้ด)</summary>
        <ol className="mt-2 mb-0">
          <li>เรียงรายชื่อตาม Lucky Number (ไม่มีใครจัดลำดับเองได้)</li>
          <li>เอา &quot;รายชื่อพร้อมเลขทั้งหมด | ครั้งที่&quot; ไปทำเป็นตัวเลขสุ่ม (SHA-256) — ใครได้เลขไหนมาจากการ์ดที่หยิบเอง</li>
          <li>สลับที่ให้เป็นวงกลมวงเดียว (Sattolo) → ไม่มีใครได้ชื่อตัวเอง</li>
          <li>แต่ละคนได้รับของขวัญจากคนก่อนหน้าในวง</li>
        </ol>
      </details>
    </main>
  );
}
