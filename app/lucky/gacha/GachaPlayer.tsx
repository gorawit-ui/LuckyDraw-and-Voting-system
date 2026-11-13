'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import CapsuleAnim from '@/components/gacha/CapsuleAnim';
import { DiceRow } from '@/components/gacha/Dice';
import Toast from '@/components/vote/Toast';
import { burst } from '@/lib/fx';
import { animPhase, receiverOf } from '@/lib/gacha/logic';
import { gachaApi, useGacha } from '@/lib/gacha/mock-store';
import { MASCOT } from '@/lib/site';
import { useNow, useToast } from '@/lib/vote/hooks';

export default function GachaPlayer() {
  const { ready, room, member, removed } = useGacha();
  const [toast, show] = useToast();
  const now = useNow(100);
  const phase = animPhase(room?.revealAt ?? null, now);
  const fired = useRef(false);
  useEffect(() => {
    if (phase === 'done' && member && !fired.current) { fired.current = true; burst(160); setTimeout(() => burst(100), 400); }
    if (phase === 'waiting') fired.current = false;
  }, [phase, member]);

  if (!ready) return <main className="container py-5 text-center text-cream"><div className="spinner-border" /></main>;

  return (
    <main className="container py-3 py-md-4" style={{ maxWidth: 560 }}>
      <h1 className="display-pop text-center mb-3" style={{ fontSize: 'clamp(1.8rem, 7vw, 2.8rem)' }}>🎁 ตู้กาชาปอง</h1>
      {!room && <Card mascot="nervous" title="ยังไม่เปิดห้อง" text="รอ host เปิดห้องสักครู่ แล้วรีเฟรชหน้านี้" />}

      {room && !member && room.status !== 'drawn' && (
        room.status === 'open' ? <JoinForm removed={removed} roomId={room.id} show={show} /> :
          <Card mascot="sad" title="ห้องล็อกแล้ว" text="ไม่ทันเข้าห้อง ติดต่อ host ที่โต๊ะลงชื่อ ให้เพิ่มชื่อแทนได้ก่อนสุ่ม" />
      )}

      {room && member && room.status !== 'drawn' && (
        <div className="card-pop p-4 text-center">
          <span className="chip-pop mb-2"><i className="bi bi-person-check-fill" />{member.name}</span>
          <h2 className="h3 mt-2">{room.status === 'open' ? 'รอเข้าห้อง อีกนิดได้ลุ้น' : 'ล็อกห้องแล้ว รอสุ่ม!'}</h2>
          <CapsuleAnim phase="waiting" />
          <p className="fw-bold fs-5 mb-1">ในห้อง {room.members.length} คน</p>
          <p className="small mb-0">ห้อง {room.id} · สุ่มครั้งเดียว ไม่สุ่มใหม่</p>
          {room.dice.length > 0 && <div className="mt-3"><div className="small fw-bold mb-1">แต้มลูกเต๋าจากบนเวที</div><DiceRow dice={room.dice} size={40} /></div>}
        </div>
      )}

      {room && room.status === 'drawn' && member && (
        <div className="card-pop p-4 text-center">
          <h2 className="h3">{phase === 'done' ? 'แต่นแต๊น!' : phase === 'waiting' ? 'เตรียมใจไว้ แคปซูลกำลังมา' : 'กำลังหมุน…'}</h2>
          <CapsuleAnim phase={phase} />
          {phase === 'done' ? (
            <div className="gacha-result">
              <div className="fw-semibold">เอาของขวัญของคุณไปให้</div>
              <div className="gacha-target">{receiverOf(room, member.name)}</div>
              <p className="small mt-2 mb-3">ดูวงกลมทั้งหมดบนจอเวทีได้เลย</p>
              <Link href="/lucky/verify" className="btn btn-sm btn-pop btn-pop-cream"><i className="bi bi-shield-check me-1" />ตรวจผลด้วยตัวเอง</Link>
            </div>
          ) : <p className="fw-bold mb-0">ทุกเครื่องเปิดผลพร้อมกัน รวมถึง host</p>}
        </div>
      )}

      {room && room.status === 'drawn' && !member && (
        <Card mascot="judge" title="ห้องนี้สุ่มแล้ว" text="ผลทั้งหมดอยู่บนจอเวที ตรวจผลด้วยตัวเองได้">
          <Link href="/lucky/verify" className="btn btn-pop"><i className="bi bi-shield-check me-1" />ตรวจผลด้วยตัวเอง</Link>
        </Card>
      )}
      <Toast msg={toast} />
    </main>
  );
}

function JoinForm({ removed, roomId, show }: { removed: boolean; roomId: string; show: (m: string) => void }) {
  const [name, setName] = useState('');
  return (
    <form className="card-pop p-4" onSubmit={(e) => { e.preventDefault(); const r = gachaApi.join(name); if (!r.ok) show(r.error); }}>
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MASCOT('gacha')} alt="" width={720} height={720} style={{ width: 140, height: 'auto' }} />
      </div>
      <h2 className="h3 text-center">ใส่ชื่อเข้าห้อง</h2>
      {removed && <div className="alert alert-warning border-2 border-dark small">host นำชื่อคุณออกจากห้อง — ใส่ชื่อใหม่ได้</div>}
      <label htmlFor="g-name" className="form-label fw-bold">ชื่อของคุณ</label>
      <input id="g-name" className="form-control form-control-lg mb-1" placeholder="เบนซ์ (GM)" value={name} maxLength={40}
        onChange={(e) => setName(e.target.value)} autoComplete="off" autoFocus />
      <div className="form-text mb-3">ใส่ชื่อเล่นและทีม เช่น <b>เบนซ์ (GM)</b> กันชื่อชนกัน</div>
      <button type="submit" className="btn btn-pop btn-lg w-100"><i className="bi bi-box-arrow-in-right me-1" />เข้าห้อง</button>
      <p className="small text-center mt-3 mb-0">ห้อง {roomId}</p>
    </form>
  );
}

function Card({ mascot, title, text, children }: { mascot: Parameters<typeof MASCOT>[0]; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="card-pop p-4 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MASCOT(mascot)} alt="" width={720} height={720} style={{ width: 140, height: 'auto' }} />
      <h2 className="h3 mt-2">{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
