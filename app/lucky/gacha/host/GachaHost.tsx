'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import CapsuleAnim from '@/components/gacha/CapsuleAnim';
import PersonPicker from '@/components/gacha/PersonPicker';
import ConnBanner from '@/components/ConnBanner';
import QrCode, { absUrl } from '@/components/QrCode';
import Modal from '@/components/vote/Modal';
import Toast from '@/components/vote/Toast';
import type { Result } from '@/lib/mock/create-store';
import { animPhase, displayName, isLucky, labelOf, LUCKY_MAX, LUCKY_MIN, MIN_MEMBERS, resultRows, verifyUrl } from '@/lib/gacha/logic';
import { gachaApi, useGacha } from '@/lib/gacha/mock-store';
import type { Person, Room } from '@/lib/gacha/types';
import { useNow, useToast } from '@/lib/vote/hooks';

const STEPS: [Room['status'], string][] = [['open', 'เปิดรับคนเข้าห้อง'], ['locked', 'ล็อกห้อง + สุ่ม'], ['drawn', 'สุ่มแล้ว']];

export default function GachaHost() {
  const { ready, room, roster, isHost, hostPin, conn } = useGacha();
  const [toast, show] = useToast();
  const run = async (p: Result | Promise<Result>) => { const r = await p; if (r.ok) { if (r.msg) show(r.msg); } else show(r.error); return r; };
  if (!ready) return <main className="container py-5 text-center text-cream"><div className="spinner-border" /></main>;
  if (!room || !isHost) return <main className="container py-4" style={{ maxWidth: 620 }}><ConnBanner conn={conn} host /><Claim room={room} run={run} /><Toast msg={toast} /></main>;
  return (
    <main className="container-xxl py-3 py-md-4">
      <ConnBanner conn={conn} host />
      <header className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="display-pop mb-0 me-auto" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.6rem)' }}>🎁 กาชาปอง · {room.id}</h1>
        <span className="chip-pop" title="ใช้เปิดหน้า host บนเครื่องอื่น"><i className="bi bi-key-fill" />PIN {hostPin}</span>
        <Link href="/lucky/gacha/stage" target="_blank" className="btn btn-sm btn-pop"><i className="bi bi-easel me-1" />เปิดจอเวที</Link>
      </header>
      <div className="card-pop p-3 mb-3">
        <ol className="stepper">
          {STEPS.map(([s, label], i) => {
            const idx = STEPS.findIndex(([x]) => x === room.status);
            return <li key={s} className={idx > i ? 'done' : idx === i ? 'now' : ''}><span>{i + 1}</span>{label}</li>;
          })}
        </ol>
      </div>
      {room.status === 'drawn' ? <Drawn room={room} run={run} /> : <Setup room={room} roster={roster} run={run} />}
      <Toast msg={toast} />
    </main>
  );
}

// ---------- ยังไม่ได้เป็น host ----------
function Claim({ room, run }: { room: Room | null; run: Run }) {
  const [p, setP] = useState('');
  return (
    <div className="card-pop p-4">
      <h1 className="h3"><i className="bi bi-sliders me-2" />host ตู้กาชาปอง</h1>
      {room ? (
        <>
          <p>ห้อง <b>{room.id}</b> มี {room.members.length} คน ({room.status === 'drawn' ? 'สุ่มแล้ว' : room.status === 'locked' ? 'ล็อกแล้ว' : 'เปิดรับอยู่'})</p>
          <form className="d-flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); run(gachaApi.claimHost(p)); }}>
            <input className="form-control" inputMode="numeric" placeholder="PIN 4 หลักของห้อง" value={p} onChange={(e) => setP(e.target.value)} />
            <button type="submit" className="btn btn-pop text-nowrap">เข้าเป็น host</button>
          </form>
        </>
      ) : <p>ยังไม่มีห้อง</p>}
      <button type="button" className="btn btn-pop btn-pop-green btn-lg w-100" onClick={() => run(gachaApi.createRoom())}>
        <i className="bi bi-plus-circle me-1" />เปิดห้องใหม่
      </button>
      <p className="small mt-3 mb-0"><i className="bi bi-cone-striped me-1" />โหมดทดสอบ: ยืนยัน host ด้วย PIN ของห้อง (ดูได้บนหน้า host ของเครื่องที่เปิดห้อง) · ของจริงจะใช้ Slack</p>
    </div>
  );
}

type Run = (r: Result | Promise<Result>) => Promise<Result>;

// ---------- เปิดรับ / ล็อก ----------
function Setup({ room, roster, run }: { room: Room; roster: Person[]; run: Run }) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = room.status === 'open';
  const joinUrl = absUrl('/lucky/gacha');
  const members = [...room.members].sort((a, b) => a.lucky - b.lucky);
  const doDraw = async () => { setBusy(true); const r = await run(gachaApi.draw()); setBusy(false); setAsk(false); if (r.ok) setTimeout(() => void gachaApi.sendSheet().then((x) => { if (!x.ok) void run(x); }), 300); };
  return (
    <div className="row g-3">
      <div className="col-lg-8">
        <div className="card-pop p-3 p-md-4 mb-3">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <h2 className="h4 mb-0 me-auto"><i className="bi bi-people-fill me-2" />ในห้อง <span className="badge text-bg-dark fs-6">{room.members.length} คน</span></h2>
            {open && roster.length > 0 && <button type="button" className="btn btn-sm btn-pop btn-pop-cream" onClick={() => run(gachaApi.demoFill())}><i className="bi bi-robot me-1" />เติมคนตัวอย่าง (demo)</button>}
          </div>
          <div className="d-flex flex-wrap gap-2 mb-1 member-chips">
            {members.map((m) => (
              <span key={m.id} className="chip-pop" title={m.full || undefined}>
                {m.by === 'host' && <i className="bi bi-pencil-fill small" title="host เพิ่มแทน" />}<b>({m.lucky})</b> {displayName(m)}
                {open && <button type="button" className="btn-close btn-close-sm ms-1" style={{ fontSize: '.6rem' }} aria-label={`นำ ${displayName(m)} ออก`} onClick={() => run(gachaApi.hostRemove(m.id))} />}
              </span>
            ))}
            {!room.members.length && <span className="opacity-75">ยังไม่มีคนเข้าห้อง — ให้ทุกคนหยิบการ์ด Lucky Number แล้วสแกน QR</span>}
          </div>
        </div>
        {open && <HostAdd room={room} roster={roster} run={run} />}
        {open && <RosterAdmin roster={roster} run={run} />}
      </div>
      <div className="col-lg-4">
        {open ? (
          <div className="card-pop p-3 p-md-4 text-center">
            <h2 className="h5">ให้ทุกคนสแกนเข้าห้อง</h2>
            <QrCode text={joinUrl} size={200} className="mx-auto" />
            <p className="small mt-2 text-break">{joinUrl}</p>
            <p className="small fw-semibold">สแกน → ค้นหาชื่อ → ใส่ Lucky Number → ยืนยัน</p>
            <button type="button" className="btn btn-pop btn-lg w-100" disabled={room.members.length < MIN_MEMBERS} onClick={() => run(gachaApi.lock())}>
              <i className="bi bi-lock-fill me-1" />ล็อกห้องต่อหน้าทุกคน
            </button>
            {room.members.length < MIN_MEMBERS && <div className="small mt-2">ต้องมีอย่างน้อย {MIN_MEMBERS} คน</div>}
          </div>
        ) : (
          <div className="card-pop p-3 p-md-4">
            <h2 className="h5"><i className="bi bi-lock-fill me-2" />ล็อกแล้ว {room.members.length} คน</h2>
            <p className="small">ให้ทุกคนดูชื่อตัวเองบนจอเวทีว่าครบไหม ถ้าขาดใคร ปลดล็อกแล้วเพิ่มแทนได้ · ผลมาจาก Lucky Number ที่ทุกคนหยิบเอง ไม่มีใครเลือกผลได้</p>
            <button type="button" className="btn btn-pop btn-pop-green btn-lg w-100 mb-2" onClick={() => setAsk(true)}>
              <i className="bi bi-stars me-1" />สุ่มเลย!
            </button>
            <button type="button" className="btn btn-sm btn-pop btn-pop-cream w-100" onClick={() => run(gachaApi.unlock())}><i className="bi bi-unlock me-1" />ปลดล็อก (แก้รายชื่อ)</button>
          </div>
        )}
      </div>
      <Modal open={ask} onClose={() => setAsk(false)} title="สุ่มครั้งเดียว ไม่สุ่มใหม่"
        footer={<><button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setAsk(false)}>ยังก่อน</button>
          <button type="button" className="btn btn-pop btn-pop-green" disabled={busy} onClick={doDraw}><i className="bi bi-stars me-1" />ยืนยัน สุ่มเลย</button></>}>
        <p>รายชื่อ <b>{room.members.length} คน</b> พร้อม Lucky Number</p>
        <p className="mb-0 small">กดแล้วทุกเครื่องจะเปิดแคปซูลพร้อมกัน (รวมถึงหน้านี้) — ไม่มีใครเห็นผลก่อน</p>
      </Modal>
    </div>
  );
}

/** ผู้จัดเพิ่มแทน: คนที่ฝากของขวัญมาแต่ไม่อยู่ / ไม่ถนัดมือถือ / ไม่มีชื่อในรายชื่อ */
function HostAdd({ room, roster, run }: { room: Room; roster: Person[]; run: Run }) {
  const [person, setPerson] = useState<Person | null>(null);
  const [typed, setTyped] = useState('');
  const [manual, setManual] = useState(roster.length === 0);
  const [num, setNum] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const taken = useMemo(() => new Set(room.members.map((m) => m.personId).filter((x): x is string => !!x)), [room.members]);
  const used = new Set(room.members.map((m) => m.lucky));
  const n = Number(num);
  const pickFree = () => {
    const free = Array.from({ length: LUCKY_MAX }, (_, i) => LUCKY_MAX - i).filter((x) => !used.has(x));
    if (free.length) setNum(String(free[0]));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run(gachaApi.hostAdd(manual ? null : person?.id ?? null, typed, isLucky(n) ? n : null)).then((r) => {
      if (r.ok) { setPerson(null); setTyped(''); setNum(''); setResetKey((k) => k + 1); }
    });
  };
  return (
    <form className="card-pop p-3 p-md-4 mb-3" onSubmit={submit}>
      <h2 className="h5"><i className="bi bi-person-plus me-2" />เพิ่มแทน <span className="fw-normal small">(คนที่ฝากของขวัญมา · ไม่ถนัดมือถือ)</span></h2>
      <div className="row g-2 align-items-start">
        <div className="col-md-8">
          {manual
            ? <input className="form-control form-control-lg" placeholder="พิมพ์ชื่อ เช่น ป้าแดง (Admin)" value={typed} onChange={(e) => setTyped(e.target.value)} maxLength={60} />
            : <PersonPicker key={resetKey} roster={roster} taken={taken} value={person} onChange={setPerson} id="h-search" />}
          {roster.length > 0 && (
            <button type="button" className="btn btn-sm btn-link text-dark px-0" onClick={() => { setManual(!manual); setPerson(null); }}>
              {manual ? 'เลือกจากรายชื่อพนักงาน' : 'ไม่มีในรายชื่อ? พิมพ์ชื่อเอง'}
            </button>
          )}
        </div>
        <div className="col-6 col-md-2">
          <input className="form-control form-control-lg text-center fw-bold" inputMode="numeric" placeholder="เลข" aria-label={`Lucky Number ${LUCKY_MIN}–${LUCKY_MAX}`}
            value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, '').slice(0, 3))} />
          <button type="button" className="btn btn-sm btn-link text-dark px-0" onClick={pickFree}>ใช้เลขว่าง</button>
        </div>
        <div className="col-6 col-md-2">
          <button type="submit" className="btn btn-pop btn-lg w-100" disabled={!(manual ? typed.trim() : person) || !isLucky(n)}>เพิ่ม</button>
        </div>
      </div>
      <div className="form-text">หยิบการ์ดให้เขา 1 ใบแล้วใส่เลขนั้น (เก็บการ์ดไว้กับของขวัญ) หรือกด &quot;ใช้เลขว่าง&quot;</div>
    </form>
  );
}

/** หลังบ้าน: รายชื่อพนักงานให้ค้นหา (วางจาก Excel/Google Sheet) */
function RosterAdmin({ roster, run }: { roster: Person[]; run: Run }) {
  const [text, setText] = useState('');
  const [openBox, setOpenBox] = useState(false);
  return (
    <div className="card-pop p-3 p-md-4">
      <div className="d-flex flex-wrap align-items-center gap-2">
        <h2 className="h5 mb-0 me-auto"><i className="bi bi-person-lines-fill me-2" />รายชื่อพนักงานให้ค้นหา <span className="badge text-bg-dark">{roster.length} คน</span></h2>
        <button type="button" className="btn btn-sm btn-pop btn-pop-cream" onClick={() => setOpenBox(!openBox)}>{openBox ? 'ปิด' : 'แก้รายชื่อ'}</button>
      </div>
      {!roster.length && <p className="small mt-2 mb-0">ยังไม่มีรายชื่อ — ผู้เล่นจะพิมพ์ชื่อเองแทนการค้นหา</p>}
      {openBox && (
        <div className="mt-3">
          <label htmlFor="roster" className="form-label small fw-bold">วางจาก Excel / Google Sheet: 3 คอลัมน์ <u>ชื่อ-สกุล · ชื่อเล่น · ทีม</u> (แถวละคน)</label>
          <textarea id="roster" className="form-control mb-2" rows={6} placeholder={'ธนพล ใจดี\tเบนซ์\tGM\nปิยะพร แสงทอง\tป๊อป\tMarketing'} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-pop" disabled={!text.trim()} onClick={() => void run(gachaApi.setRoster(text)).then((r) => r.ok && (setText(''), setOpenBox(false)))}>
              <i className="bi bi-save me-1" />บันทึก (แทนรายชื่อเดิม)
            </button>
            <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => run(gachaApi.useSampleRoster())}>ใช้รายชื่อตัวอย่าง</button>
            <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => { if (confirm('ล้างรายชื่อพนักงาน? ผู้เล่นจะต้องพิมพ์ชื่อเอง')) void run(gachaApi.clearRoster()); }}>ล้างรายชื่อ</button>
          </div>
          <p className="small mt-2 mb-0"><i className="bi bi-info-circle me-1" />demo: ใช้ชื่อสมมติเท่านั้น (ทุกคนที่มีลิงก์เห็นรายชื่อนี้) · ของจริงจะอยู่หลัง Slack login</p>
        </div>
      )}
    </div>
  );
}

// ---------- สุ่มแล้ว ----------
function Drawn({ room, run }: { room: Room; run: Run }) {
  const now = useNow(100);
  const phase = animPhase(room.revealAt, now);
  const [ask, setAsk] = useState(false);
  const rows = resultRows(room);
  const csv = () => {
    const data = [['Lucky Number', 'ชื่อคุณ', 'ทีม', 'ชื่อ-สกุล', 'ได้รับของขวัญจาก (เลข)', 'ได้รับของขวัญจาก', 'ทีม', 'ชื่อ-สกุล'],
      ...rows.map(([m, g]) => [m.lucky, m.nick || m.full, m.team, m.full, g.lucky, g.nick || g.full, g.team, g.full])];
    const text = '﻿' + [`ห้อง ${room.id}`, '', ...data.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = `lucky-draw-${room.id}.csv`; a.click();
  };
  if (phase !== 'done') {
    return (
      <div className="card-pop p-4 text-center mx-auto" style={{ maxWidth: 520 }}>
        <h2 className="h3">{phase === 'waiting' ? 'เตรียมใจไว้ แคปซูลกำลังมา' : 'กำลังเปิดแคปซูลพร้อมกันทุกเครื่อง…'}</h2>
        <CapsuleAnim phase={phase} />
        <p className="mb-0 small">host เห็นผลพร้อมทุกคน ไม่มีตารางผลล่วงหน้า</p>
      </div>
    );
  }
  const sheetLabel = { none: 'ยังไม่ส่ง', sent: 'ส่งเข้าชีทแล้ว', local: 'ยังไม่ตั้งค่าชีท (ใช้ CSV)', failed: 'ส่งไม่สำเร็จ' }[room.sheet];
  return (
    <div className="row g-3">
      <div className="col-lg-8">
        <div className="card-pop p-3 p-md-4">
          <h2 className="h4"><i className="bi bi-table me-2" />ผลการจับฉลาก</h2>
          <div className="table-responsive">
            <table className="table table-sm result-table mb-0">
              <thead><tr><th>ชื่อคุณ</th><th>ได้รับของขวัญจาก</th></tr></thead>
              <tbody>
                {rows.map(([m, g]) => (
                  <tr key={m.id}>
                    <td><span className="num">({m.lucky})</span> {displayName(m)}</td>
                    <td><i className="bi bi-gift me-1" /><span className="num">({g.lucky})</span> {displayName(g)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="card-pop p-3 p-md-4 mb-3">
          <h2 className="h5">ตรวจผล / เก็บผล</h2>
          <div className="d-grid gap-2">
            <Link href="/lucky/verify" className="btn btn-pop"><i className="bi bi-shield-check me-1" />ตรวจผลด้วยตัวเอง</Link>
            <button type="button" className="btn btn-pop btn-pop-cream" onClick={csv}><i className="bi bi-download me-1" />ดาวน์โหลด CSV</button>
            <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => navigator.clipboard?.writeText(verifyUrl(window.location.origin, room.members.map(labelOf)))
              .then(() => run({ ok: true, msg: 'คัดลอกลิงก์ตรวจผลแล้ว (มีรายชื่อ+เลขในลิงก์ แชร์ใน Slack ได้)' }), () => run({ ok: false, error: 'คัดลอกไม่ได้' }))}>
              <i className="bi bi-link-45deg me-1" />คัดลอกลิงก์ตรวจผล (แชร์ใน Slack)
            </button>
          </div>
        </div>
        <div className="card-pop p-3 p-md-4">
          <div className="d-flex align-items-center gap-2 mb-2"><span className="me-auto"><i className="bi bi-table me-1" />Google Sheet: <b>{sheetLabel}</b></span>
            {room.sheet !== 'sent' && <button type="button" className="btn btn-sm btn-pop" onClick={() => void run(gachaApi.sendSheet())}>ส่งอีกครั้ง</button>}</div>
          <button type="button" className="btn btn-pop btn-pop-cream w-100" onClick={() => setAsk(true)}><i className="bi bi-plus-circle me-1" />เริ่มห้องใหม่</button>
        </div>
      </div>
      <Modal open={ask} onClose={() => setAsk(false)} title="เริ่มห้องใหม่?"
        footer={<><button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setAsk(false)}>ยกเลิก</button>
          <button type="button" className="btn btn-pop" onClick={() => { setAsk(false); run(gachaApi.createRoom()); }}>เริ่มห้องใหม่</button></>}>
        ผลห้องนี้จะหายจากจอ (ดาวน์โหลด CSV ไว้ก่อน ถ้ายังไม่ได้ส่งเข้าชีท) · รายชื่อพนักงานยังอยู่
      </Modal>
    </div>
  );
}
