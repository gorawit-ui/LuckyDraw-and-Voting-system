'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import ConnBanner from '@/components/ConnBanner';
import CapsuleAnim from '@/components/gacha/CapsuleAnim';
import LuckyCard from '@/components/gacha/LuckyCard';
import LuckyPad from '@/components/gacha/LuckyPad';
import PersonPicker from '@/components/gacha/PersonPicker';
import Modal from '@/components/vote/Modal';
import Toast from '@/components/vote/Toast';
import { burst } from '@/lib/fx';
import { animPhase, cleanName, giftFrom, isLucky, LUCKY_MAX, LUCKY_MIN } from '@/lib/gacha/logic';
import { gachaApi, useGacha } from '@/lib/gacha/mock-store';
import type { Person, Room } from '@/lib/gacha/types';
import { MASCOT } from '@/lib/site';
import { useNow, useToast } from '@/lib/vote/hooks';

/**
 * มือถือพนักงาน (PRODUCT.md D10): สแกน QR → ค้นหาชื่อตัวเอง → กรอก Lucky Number จากการ์ด → ยืนยัน → ตู้เขย่ารอ
 * → ทุกเครื่องเปิดแคปซูลพร้อมกัน → "คุณได้ของขวัญจากเพื่อนคนนี้"
 */
export default function GachaPlayer() {
  const { ready, room, roster, member, removed, conn } = useGacha();
  const [toast, show] = useToast();
  const now = useNow(100);
  const phase = animPhase(room?.revealAt ?? null, now);
  const fired = useRef(false);
  useEffect(() => {
    if (phase === 'done' && member && !fired.current) { fired.current = true; burst(160); setTimeout(() => burst(100), 400); }
    if (phase === 'waiting') fired.current = false;
  }, [phase, member]);

  if (!ready) return <main className="container py-5 text-center text-cream"><div className="spinner-border" /></main>;
  const from = room && member ? giftFrom(room, member) : null;

  return (
    <main className="container py-3 py-md-4" style={{ maxWidth: 560 }}>
      <ConnBanner conn={conn} />
      <h1 className="display-pop text-center mb-3" style={{ fontSize: 'clamp(1.8rem, 7vw, 2.8rem)' }}>🎁 จับฉลากของขวัญ</h1>
      {!room && <Card mascot="nervous" title="ยังไม่เปิดห้อง" text="รอ host เปิดห้องสักครู่ หน้านี้จะเปลี่ยนเอง" />}

      {room && !member && room.status !== 'drawn' && (
        room.status === 'open' ? <JoinFlow room={room} roster={roster} removed={removed} show={show} /> :
          <Card mascot="sad" title="ห้องล็อกแล้ว" text="ไม่ทันเข้าห้อง ติดต่อ host ที่โต๊ะ ให้เพิ่มชื่อแทนได้ก่อนสุ่ม" />
      )}

      {room && member && room.status !== 'drawn' && (
        <div className="card-pop p-3 p-md-4 text-center">
          <h2 className="h3 mb-1">{room.status === 'open' ? 'เข้าห้องแล้ว รอลุ้นกัน!' : 'ล็อกห้องแล้ว ใกล้สุ่มแล้ว!'}</h2>
          <p className="fw-semibold mb-3">ในห้อง {room.members.length} คน · เก็บการ์ดไว้ให้ดีนะ</p>
          <LuckyCard m={member} caption="บัตรของคุณ" />
          <div className="gacha-anim-sm"><CapsuleAnim phase="waiting" idle /></div>
          <p className="small mt-3 mb-0">ห้อง {room.id} · สุ่มครั้งเดียว ทุกเครื่องเปิดผลพร้อมกัน</p>
        </div>
      )}

      {room && room.status === 'drawn' && member && (
        <div className="card-pop p-3 p-md-4 text-center">
          <h2 className="h3">{phase === 'done' ? 'แต่นแต๊น! จับได้…' : phase === 'waiting' ? 'เตรียมใจไว้ แคปซูลกำลังมา' : 'กำลังหมุน…'}</h2>
          {phase !== 'done' && <CapsuleAnim phase={phase} />}
          {phase === 'done' && from ? (
            <div className="gacha-result">
              <LuckyCard m={from} caption="🎁 คุณได้ของขวัญจากเพื่อนคนนี้ เดินไปรับของจากเพื่อนได้เลย!" />
              <p className="small mt-3 mb-2">คุณคือ ({member.lucky}) {member.nick || member.full} · ผลทั้งหมดอยู่บนจอเวที</p>
              <Link href="/lucky/verify" className="btn btn-sm btn-pop btn-pop-cream"><i className="bi bi-shield-check me-1" />ตรวจผลด้วยตัวเอง</Link>
            </div>
          ) : phase !== 'done' && <p className="fw-bold mb-0">ทุกเครื่องเปิดผลพร้อมกัน รวมถึง host</p>}
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

/** 1) เลือกชื่อ → 2) กรอก Lucky Number → ยืนยัน [แก้ไข]/[OK] */
function JoinFlow({ room, roster, removed, show }: { room: Room; roster: Person[]; removed: boolean; show: (m: string) => void }) {
  const [person, setPerson] = useState<Person | null>(null);
  const [typed, setTyped] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [num, setNum] = useState('');
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const taken = useMemo(() => new Set(room.members.map((m) => m.personId).filter((x): x is string => !!x)), [room.members]);
  const useRoster = roster.length > 0;
  const sending = useRef(false);
  // คนอื่นเลือกชื่อนี้ไปก่อน (ระหว่างที่เรายังกรอกเลข) → ให้เลือกใหม่ (ไม่นับตอนที่เรากำลังส่งเอง)
  useEffect(() => {
    if (person && taken.has(person.id) && !sending.current) { setPerson(null); setStep(1); show('มีคนเลือกชื่อนี้ไปแล้ว — ถ้าเป็นชื่อคุณ แจ้ง host'); }
  }, [person, taken, show]);

  const who = person ? { nick: person.nick, full: person.full, team: person.team } : { nick: cleanName(typed), full: '', team: '' };
  const hasName = useRoster ? !!person : !!who.nick;
  const lucky = Number(num);
  const submit = async () => {
    setBusy(true); sending.current = true;
    const r = await gachaApi.join(person?.id ?? null, typed, lucky);
    sending.current = false; setBusy(false); setAsk(false);
    if (!r.ok) { show(r.error); if (/เลข/.test(r.error)) setStep(2); else setStep(1); }
  };

  return (
    <div className="card-pop p-3 p-md-4">
      <div className="step-dots" aria-hidden><span className="on" /><span className={step === 2 ? 'on' : ''} /></div>
      {removed && <div className="alert alert-warning border-2 border-dark small">host นำชื่อคุณออกจากห้อง — เข้าใหม่ได้</div>}
      {step === 1 ? (
        <>
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MASCOT('gacha')} alt="" width={720} height={720} style={{ width: 110, height: 'auto' }} />
          </div>
          <h2 className="h3 text-center">1. หาชื่อของคุณ</h2>
          {useRoster
            ? <PersonPicker roster={roster} taken={taken} value={person} onChange={setPerson} autoFocus />
            : <>
                <label htmlFor="g-name" className="form-label fw-bold">ชื่อของคุณ</label>
                <input id="g-name" className="form-control form-control-lg mb-1" placeholder="เบนซ์ (GM)" value={typed} maxLength={60}
                  onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoFocus />
                <div className="form-text">ใส่ชื่อเล่นและทีม เช่น <b>เบนซ์ (GM)</b> กันชื่อชนกัน</div>
              </>}
          <button type="button" className="btn btn-pop btn-lg w-100 mt-3" disabled={!hasName} onClick={() => setStep(2)}>
            ถัดไป <i className="bi bi-arrow-right" />
          </button>
        </>
      ) : (
        <>
          <h2 className="h3 text-center mb-1">2. ใส่ Lucky Number</h2>
          <p className="text-center small mb-3">เลขบนการ์ดที่หยิบจากหน้าห้อง ({LUCKY_MIN}–{LUCKY_MAX})</p>
          <LuckyPad value={num} onChange={setNum} />
          <div className="d-flex gap-2 mt-3">
            <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setStep(1)}><i className="bi bi-arrow-left" /> ชื่อ</button>
            <button type="button" className="btn btn-pop btn-lg flex-grow-1" disabled={!isLucky(lucky)} onClick={() => setAsk(true)}>ตกลง</button>
          </div>
        </>
      )}
      <p className="small text-center mt-3 mb-0">ห้อง {room.id}</p>
      <Modal open={ask} onClose={() => setAsk(false)} title="เช็กข้อมูลครั้งสุดท้าย"
        footer={<>
          <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setAsk(false)}><i className="bi bi-pencil me-1" />แก้ไข</button>
          <button type="button" className="btn btn-pop btn-pop-green btn-lg" disabled={busy} onClick={() => void submit()}>OK เข้าห้อง</button>
        </>}>
        {isLucky(lucky) && <LuckyCard m={{ ...who, lucky }} />}
        <p className="small mt-3 mb-0">ชื่อและเลขต้องตรงกับการ์ดในมือ — กด OK แล้วแก้เองไม่ได้ (แจ้ง host ให้แก้แทน)</p>
      </Modal>
    </div>
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
