'use client';
import { useEffect, useRef } from 'react';
import { DiceRow } from '@/components/gacha/Dice';
import Ring from '@/components/gacha/Ring';
import QrCode, { absUrl } from '@/components/QrCode';
import { checkRules } from '@/lib/fair-draw';
import { burst } from '@/lib/fx';
import { animPhase, verifyRoomUrl } from '@/lib/gacha/logic';
import { useGacha } from '@/lib/gacha/mock-store';
import { MASCOT } from '@/lib/site';
import { useNow } from '@/lib/vote/hooks';

/**
 * จอเวทีกาชาปอง (แบบเปิดเผย) — ความเชื่อใจมาจาก "เห็นกระบวนการ" (SPEC §4)
 * ก่อนสุ่ม: รายชื่อ + จำนวน → ล็อก → แต้มลูกเต๋าตัวใหญ่ · ตอนสุ่ม: ชื่อสลับเป็นวงกลม · หลังสุ่ม: วงจริง + ตรวจกติกา 3 ข้อ + QR ตรวจเอง
 */
const RING_MAX = 30;

export default function GachaStage() {
  const { ready, room } = useGacha();
  const now = useNow(200);
  const phase = animPhase(room?.revealAt ?? null, now);
  const fired = useRef<string | null>(null);
  useEffect(() => {
    if (phase === 'done' && room && fired.current !== room.id) { fired.current = room.id; burst(220); setTimeout(() => burst(150), 450); }
  }, [phase, room]);

  if (!ready) return <main className="stage-root stage-lucky" />;
  const names = room?.members.map((m) => m.name) ?? [];
  const ringOrder = room?.pairs?.map((p) => p[0]) ?? names;
  const rules = room?.pairs ? checkRules(room.pairs) : null;
  // คนเยอะ (>30) วงกลมอ่านไม่ออกจากหลังห้อง → ใช้รายการลำดับเดินแลกของเป็นคอลัมน์แทน
  const big = names.length > RING_MAX;

  return (
    <main className="stage-root stage-lucky">
      <div className="stage-inner">
        <div className="stage-title">ตู้กาชาปองจับคู่แลกของขวัญ {room && `· ห้อง ${room.id}`}</div>

        {!room && (
          <section className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MASCOT('nervous')} alt="" width={720} height={720} style={{ width: 'clamp(160px, 20vw, 260px)', height: 'auto' }} />
            <h1 className="stage-big mt-3">รอเปิดห้อง</h1>
          </section>
        )}

        {room?.status === 'open' && (
          <section className="row align-items-center g-4">
            <div className="col-lg-8 text-center">
              <div className="stage-label">เข้าห้องแล้ว</div>
              <div className="stage-count"><span>{names.length}</span><small> คน</small></div>
              <div className="stage-names">{names.map((n) => <span key={n}>{n}</span>)}</div>
            </div>
            <div className="col-lg-4 text-center">
              <QrCode text={absUrl('/lucky/gacha')} size={260} className="mx-auto" />
              <p className="stage-sub mt-2 mb-0">สแกน → ใส่ชื่อ → รอลุ้น</p>
            </div>
          </section>
        )}

        {room?.status === 'locked' && (
          <section className="text-center">
            <div className="stage-label"><i className="bi bi-lock-fill me-2" />ล็อกห้องแล้ว ครบไหม?</div>
            <div className="stage-count"><span>{names.length}</span><small> คน</small></div>
            <div className="stage-names">{names.map((n) => <span key={n}>{n}</span>)}</div>
            <p className="stage-rule">สุ่มครั้งเดียว ไม่สุ่มใหม่ · ลูกเต๋าเป็นคนสุ่ม</p>
            {room.dice.length > 0 && <div className="stage-dice"><DiceRow dice={room.dice} size={110} /></div>}
          </section>
        )}

        {room?.status === 'drawn' && phase !== 'done' && (
          <section className="text-center">
            <div className="stage-label">ลูกเต๋าจะพาแคปซูลไหนมาให้…</div>
            {big
              ? <div className="stage-names is-shuffling">{shuffleNames(names, Math.floor(now / 220)).map((n) => <span key={n}>{n}</span>)}</div>
              : <div className="stage-ring"><Ring names={names} shuffleSeed={Math.floor(now / 220)} /></div>}
            <DiceRow dice={room.dice} size={70} />
          </section>
        )}

        {room?.status === 'drawn' && phase === 'done' && rules && !big && (
          <section className="row g-4 align-items-center">
            <div className="col-lg-7">
              <div className="stage-ring"><Ring names={ringOrder} arrows /></div>
              <p className="stage-sub text-center mb-0">ตามเข็มนาฬิกา: แต่ละคนให้ของคนถัดไป</p>
            </div>
            <div className="col-lg-5">
              <Checks rules={rules} />
              <div className="stage-label small mb-2">แต้มลูกเต๋าที่ใช้สุ่ม</div>
              <DiceRow dice={room.dice} size={64} />
              <div className="d-flex align-items-center gap-3 mt-4">
                <QrCode text={verifyRoomUrl(window.location.origin, room.id)} size={190} />
                <p className="stage-sub mb-0">ใครสงสัย สแกนแล้วคำนวณเองได้เลย ได้ผลเดียวกันทุกครั้ง</p>
              </div>
            </div>
          </section>
        )}

        {room?.status === 'drawn' && phase === 'done' && rules && big && (
          <section>
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-4 mb-3">
              <Checks rules={rules} compact />
              <DiceRow dice={room.dice} size={52} />
              <div className="d-flex align-items-center gap-2">
                <QrCode text={verifyRoomUrl(window.location.origin, room.id)} size={130} />
                <span className="fw-bold" style={{ maxWidth: 160 }}>สแกนตรวจผลเองได้</span>
              </div>
            </div>
            <div className="stage-label small mb-2 text-center">ลำดับเดินแลกของ ({room.pairs!.length} คน) · แต่ละคนให้ของคนถัดไป</div>
            <ol className="stage-pairs" style={{ gridTemplateRows: `repeat(${Math.ceil(room.pairs!.length / 4)}, auto)` }}>
              {room.pairs!.map(([a, b], i) => <li key={a}><span className="no">{i + 1}.</span> <b>{a}</b> → {b}</li>)}
            </ol>
          </section>
        )}
      </div>
      <div className="stage-controls">
        <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())} title="เต็มจอ">
          <i className="bi bi-arrows-fullscreen" />
        </button>
      </div>
    </main>
  );
}

function shuffleNames(a: string[], seed: number) {
  const r = a.slice();
  let x = seed * 9301 + 49297;
  for (let i = r.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor((x / 233280) * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function Checks({ rules, compact }: { rules: ReturnType<typeof checkRules>; compact?: boolean }) {
  return (
    <ul className={`stage-checks ${compact ? 'is-compact' : ''}`}>
      <li className={rules.noSelf ? 'ok' : 'bad'}>ไม่มีใครได้ชื่อตัวเอง</li>
      <li className={rules.unique ? 'ok' : 'bad'}>ทุกคนได้ชื่อไม่ซ้ำกัน</li>
      <li className={rules.oneEach ? 'ok' : 'bad'}>ทุกคนให้และได้รับคนละ 1 ชิ้น</li>
    </ul>
  );
}
