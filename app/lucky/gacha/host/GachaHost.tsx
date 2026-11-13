'use client';
import Link from 'next/link';
import { useState } from 'react';
import CapsuleAnim from '@/components/gacha/CapsuleAnim';
import Dice, { DiceRow } from '@/components/gacha/Dice';
import QrCode, { absUrl } from '@/components/QrCode';
import Modal from '@/components/vote/Modal';
import Toast from '@/components/vote/Toast';
import type { Result } from '@/lib/mock/create-store';
import { animPhase, MIN_DICE, MIN_MEMBERS, verifyUrl } from '@/lib/gacha/logic';
import { gachaApi, useGacha } from '@/lib/gacha/mock-store';
import type { Room } from '@/lib/gacha/types';
import { useNow, useToast } from '@/lib/vote/hooks';

const STEPS: [Room['status'], string][] = [['open', 'เปิดรับคนเข้าห้อง'], ['locked', 'ล็อกห้อง + ทอยลูกเต๋า'], ['drawn', 'สุ่มแล้ว']];

export default function GachaHost() {
  const { ready, room, isHost } = useGacha();
  const [toast, show] = useToast();
  const run = (r: Result) => { if (r.ok) { if (r.msg) show(r.msg); } else show(r.error); };
  if (!ready) return <main className="container py-5 text-center text-cream"><div className="spinner-border" /></main>;
  if (!room || !isHost) return <main className="container py-4" style={{ maxWidth: 620 }}><Claim room={room} run={run} /><Toast msg={toast} /></main>;
  return (
    <main className="container-xxl py-3 py-md-4">
      <header className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h1 className="display-pop mb-0 me-auto" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.6rem)' }}>🎁 กาชาปอง · {room.id}</h1>
        <span className="chip-pop" title="ใช้เปิดหน้า host บนเครื่องอื่น"><i className="bi bi-key-fill" />PIN {room.hostPin}</span>
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
      {room.status === 'drawn' ? <Drawn room={room} run={run} /> : <Setup room={room} run={run} />}
      <Toast msg={toast} />
    </main>
  );
}

// ---------- ยังไม่ได้เป็น host ----------
function Claim({ room, run }: { room: Room | null; run: (r: Result) => void }) {
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
      <p className="small mt-3 mb-0"><i className="bi bi-cone-striped me-1" />โหมดจำลอง: ยืนยัน host ด้วย PIN ของห้อง · ของจริงจะใช้ Slack</p>
    </div>
  );
}

// ---------- เปิดรับ / ล็อก + ลูกเต๋า ----------
function Setup({ room, run }: { room: Room; run: (r: Result) => void }) {
  const [name, setName] = useState('');
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const open = room.status === 'open';
  const joinUrl = absUrl('/lucky/gacha');
  const doDraw = async () => { setBusy(true); const r = await gachaApi.draw(); setBusy(false); setAsk(false); run(r); if (r.ok) setTimeout(() => void gachaApi.sendSheet().then((x) => !x.ok && run(x)), 300); };
  return (
    <div className="row g-3">
      <div className="col-lg-8">
        <div className="card-pop p-3 p-md-4 h-100">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <h2 className="h4 mb-0 me-auto"><i className="bi bi-people-fill me-2" />ในห้อง <span className="badge text-bg-dark fs-6">{room.members.length} คน</span></h2>
            {open && <button type="button" className="btn btn-sm btn-pop btn-pop-cream" onClick={() => run(gachaApi.demoFill())}><i className="bi bi-robot me-1" />เติมรายชื่อตัวอย่าง (demo)</button>}
          </div>
          <div className="d-flex flex-wrap gap-2 mb-3 member-chips">
            {room.members.map((m) => (
              <span key={m.id} className="chip-pop">
                {m.by === 'host' && <i className="bi bi-pencil-fill small" title="host เพิ่มแทน" />}{m.name}
                {open && <button type="button" className="btn-close btn-close-sm ms-1" style={{ fontSize: '.6rem' }} aria-label={`นำ ${m.name} ออก`} onClick={() => run(gachaApi.hostRemove(m.id))} />}
              </span>
            ))}
            {!room.members.length && <span className="opacity-75">ยังไม่มีคนเข้าห้อง — ให้ทุกคนสแกน QR</span>}
          </div>
          {open && (
            <form className="d-flex gap-2" onSubmit={(e) => { e.preventDefault(); const r = gachaApi.hostAdd(name); run(r); if (r.ok) setName(''); }}>
              <input className="form-control" placeholder="เพิ่มชื่อแทนคนที่ไม่ถนัดมือถือ เช่น ป้าแดง (Admin)" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
              <button type="submit" className="btn btn-pop text-nowrap"><i className="bi bi-person-plus me-1" />เพิ่ม</button>
            </form>
          )}
        </div>
      </div>
      <div className="col-lg-4">
        {open ? (
          <div className="card-pop p-3 p-md-4 text-center h-100">
            <h2 className="h5">ให้ทุกคนสแกนเข้าห้อง</h2>
            <QrCode text={joinUrl} size={200} className="mx-auto" />
            <p className="small mt-2 text-break">{joinUrl}</p>
            <button type="button" className="btn btn-pop btn-lg w-100" disabled={room.members.length < MIN_MEMBERS} onClick={() => run(gachaApi.lock())}>
              <i className="bi bi-lock-fill me-1" />ล็อกห้องต่อหน้าทุกคน
            </button>
            {room.members.length < MIN_MEMBERS && <div className="small mt-2">ต้องมีอย่างน้อย {MIN_MEMBERS} คน</div>}
          </div>
        ) : (
          <div className="card-pop p-3 p-md-4 h-100">
            <h2 className="h5"><i className="bi bi-dice-5-fill me-2" />กรอกแต้มลูกเต๋าจริงจากบนเวที</h2>
            <p className="small">ให้ 2–3 คนต่างแผนกทอย แล้วกดแต้มตามลำดับ (อย่างน้อย {MIN_DICE} ลูก) เลขจะขึ้นจอเวทีทันที</p>
            <div className="d-flex flex-wrap gap-2 justify-content-center mb-2">
              {[1, 2, 3, 4, 5, 6].map((v) => (
                <button key={v} type="button" className="btn p-0 border-0 bg-transparent dice-btn" aria-label={`แต้ม ${v}`}
                  onClick={() => run(gachaApi.setDice([...room.dice, v]))} disabled={room.dice.length >= 12}><Dice value={v} size={44} /></button>
              ))}
            </div>
            <div className="dice-entered mb-2">{room.dice.length ? <DiceRow dice={room.dice} size={36} /> : <span className="small opacity-75">ยังไม่ได้กรอก</span>}</div>
            <div className="d-flex gap-2 mb-3">
              <button type="button" className="btn btn-sm btn-pop btn-pop-cream" disabled={!room.dice.length} onClick={() => run(gachaApi.setDice(room.dice.slice(0, -1)))}><i className="bi bi-backspace me-1" />ลบลูกล่าสุด</button>
              <button type="button" className="btn btn-sm btn-pop btn-pop-cream" disabled={!room.dice.length} onClick={() => run(gachaApi.setDice([]))}>ล้าง</button>
            </div>
            <button type="button" className="btn btn-pop btn-pop-green btn-lg w-100 mb-2" disabled={room.dice.length < MIN_DICE} onClick={() => setAsk(true)}>
              <i className="bi bi-stars me-1" />สุ่มเลย!
            </button>
            <button type="button" className="btn btn-sm btn-pop btn-pop-cream w-100" onClick={() => run(gachaApi.unlock())}><i className="bi bi-unlock me-1" />ปลดล็อก (แก้รายชื่อ)</button>
          </div>
        )}
      </div>
      <Modal open={ask} onClose={() => setAsk(false)} title="สุ่มครั้งเดียว ไม่สุ่มใหม่"
        footer={<><button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setAsk(false)}>ยังก่อน</button>
          <button type="button" className="btn btn-pop btn-pop-green" disabled={busy} onClick={doDraw}><i className="bi bi-stars me-1" />ยืนยัน สุ่มเลย</button></>}>
        <p>รายชื่อ <b>{room.members.length} คน</b> · แต้มลูกเต๋า</p>
        <DiceRow dice={room.dice} size={40} />
        <p className="mt-3 mb-0 small">กดแล้วทุกเครื่องจะเปิดแคปซูลพร้อมกัน (รวมถึงหน้านี้) — ไม่มีใครเห็นผลก่อน</p>
      </Modal>
    </div>
  );
}

// ---------- สุ่มแล้ว ----------
function Drawn({ room, run }: { room: Room; run: (r: Result) => void }) {
  const now = useNow(100);
  const phase = animPhase(room.revealAt, now);
  const [ask, setAsk] = useState(false);
  const csv = () => {
    const rows = [['ลำดับ', 'ผู้ให้', 'ต้องให้ของกับ'], ...(room.pairs ?? []).map(([a, b], i) => [i + 1, a, b])];
    const text = '﻿' + [`ห้อง ${room.id}`, `แต้มลูกเต๋า ${room.dice.join('-')}`, '', ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = `gacha-${room.id}.csv`; a.click();
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
      <div className="col-lg-7">
        <div className="card-pop p-3 p-md-4">
          <h2 className="h4"><i className="bi bi-arrow-repeat me-2" />ลำดับเดินแลกของ (แต่ละคนให้คนถัดไป)</h2>
          <ol className="pairs-list mb-0">
            {room.pairs?.map(([a, b]) => <li key={a}><b>{a}</b> <i className="bi bi-arrow-right" /> {b}</li>)}
          </ol>
        </div>
      </div>
      <div className="col-lg-5">
        <div className="card-pop p-3 p-md-4 mb-3">
          <h2 className="h5">แต้มลูกเต๋าที่ใช้สุ่ม</h2>
          <DiceRow dice={room.dice} size={44} />
          <div className="d-grid gap-2 mt-3">
            <Link href="/lucky/verify" className="btn btn-pop"><i className="bi bi-shield-check me-1" />ตรวจผลด้วยตัวเอง</Link>
            <button type="button" className="btn btn-pop btn-pop-cream" onClick={csv}><i className="bi bi-download me-1" />ดาวน์โหลด CSV</button>
            <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => navigator.clipboard?.writeText(verifyUrl(window.location.origin, room.members.map((m) => m.name), room.dice))
              .then(() => run({ ok: true, msg: 'คัดลอกลิงก์ตรวจผลแล้ว (มีรายชื่อ+แต้มในลิงก์ แชร์ใน Slack ได้)' }), () => run({ ok: false, error: 'คัดลอกไม่ได้' }))}>
              <i className="bi bi-link-45deg me-1" />คัดลอกลิงก์ตรวจผล (แชร์ใน Slack)
            </button>
          </div>
        </div>
        <div className="card-pop p-3 p-md-4">
          <div className="d-flex align-items-center gap-2 mb-2"><span className="me-auto"><i className="bi bi-table me-1" />Google Sheet: <b>{sheetLabel}</b></span>
            {room.sheet !== 'sent' && <button type="button" className="btn btn-sm btn-pop" onClick={() => void gachaApi.sendSheet().then(run)}>ส่งอีกครั้ง</button>}</div>
          <button type="button" className="btn btn-pop btn-pop-cream w-100" onClick={() => setAsk(true)}><i className="bi bi-plus-circle me-1" />เริ่มห้องใหม่</button>
        </div>
      </div>
      <Modal open={ask} onClose={() => setAsk(false)} title="เริ่มห้องใหม่?"
        footer={<><button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setAsk(false)}>ยกเลิก</button>
          <button type="button" className="btn btn-pop" onClick={() => { setAsk(false); run(gachaApi.createRoom()); }}>เริ่มห้องใหม่</button></>}>
        ผลห้องนี้จะหายจากจอ (ดาวน์โหลด CSV ไว้ก่อน ถ้ายังไม่ได้ส่งเข้าชีท)
      </Modal>
    </div>
  );
}
