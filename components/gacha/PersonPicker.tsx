'use client';
import { useMemo, useState } from 'react';
import { searchRoster } from '@/lib/gacha/logic';
import type { Person } from '@/lib/gacha/types';

/** ช่องค้นหาชื่อจากรายชื่อพนักงาน (ชื่อ-สกุล / ชื่อเล่น / ทีม) — คนที่เข้าห้องแล้วไม่ขึ้นในรายการ */
export default function PersonPicker({ roster, taken, value, onChange, id = 'g-search', autoFocus }: {
  roster: Person[]; taken: Set<string>; value: Person | null; onChange: (p: Person | null) => void; id?: string; autoFocus?: boolean;
}) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => searchRoster(roster, q, taken), [roster, q, taken]);
  if (value) {
    return (
      <div className="picked-person">
        <Avatar name={value.nick || value.full} />
        <div className="flex-grow-1 min-w-0">
          <div className="fw-bold fs-5 text-truncate">{value.nick || value.full}{value.team && <span className="fw-semibold"> · {value.team}</span>}</div>
          {value.full && <div className="small text-truncate">{value.full}</div>}
        </div>
        <button type="button" className="btn btn-sm btn-pop btn-pop-cream" onClick={() => { onChange(null); setQ(''); }}>เปลี่ยน</button>
      </div>
    );
  }
  return (
    <div>
      <div className="input-group input-group-lg">
        <span className="input-group-text bg-white border-dark"><i className="bi bi-search" /></span>
        <input id={id} className="form-control" placeholder="พิมพ์ชื่อ ชื่อเล่น หรือทีม" value={q} onChange={(e) => setQ(e.target.value)}
          autoComplete="off" autoFocus={autoFocus} enterKeyHint="search" />
      </div>
      {q.trim() && (
        <div className="list-group person-hits mt-2" role="listbox" aria-label="ผลการค้นหา">
          {hits.map((p) => (
            <button key={p.id} type="button" role="option" aria-selected={false} className="list-group-item list-group-item-action d-flex align-items-center gap-2" onClick={() => onChange(p)}>
              <Avatar name={p.nick || p.full} small />
              <span className="min-w-0"><b>{p.nick || p.full}</b>{p.team && <> · {p.team}</>}<br /><span className="small">{p.full}</span></span>
            </button>
          ))}
          {!hits.length && <div className="list-group-item small">ไม่เจอชื่อ — ลองพิมพ์ชื่อเล่นหรือทีม ถ้ายังไม่เจอ แจ้ง host ที่โต๊ะ</div>}
        </div>
      )}
    </div>
  );
}

/** วงกลมตัวอักษรแรก (ระหว่างยังไม่มีรูปพนักงาน — Phase 4 ใช้รูปโปรไฟล์ Slack) */
export function Avatar({ name, small, big }: { name: string; small?: boolean; big?: boolean }) {
  const ch = Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(name.trim())).map((s) => s.segment).find((g) => /[\p{L}\p{N}]/u.test(g)) ?? '?';
  let h = 0;
  for (const c of name) h = (h * 31 + c.codePointAt(0)!) % 360;
  return <span className={`avatar-pop ${small ? 'is-sm' : ''} ${big ? 'is-lg' : ''}`} style={{ background: `hsl(${h} 80% 72%)` }} aria-hidden="true">{ch}</span>;
}
