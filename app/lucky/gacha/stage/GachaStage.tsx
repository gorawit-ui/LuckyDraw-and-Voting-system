'use client';
import { useEffect, useRef } from 'react';
import Ring from '@/components/gacha/Ring';
import QrCode, { absUrl } from '@/components/QrCode';
import { checkRules } from '@/lib/fair-draw';
import { burst } from '@/lib/fx';
import { animPhase, displayName, resultRows, verifyRoomUrl } from '@/lib/gacha/logic';
import { useGacha } from '@/lib/gacha/mock-store';
import { MASCOT } from '@/lib/site';
import { useNow } from '@/lib/vote/hooks';

/**
 * จอเวทีจับฉลากของขวัญ (แบบเปิดเผย) — ความเชื่อใจมาจาก "เห็นกระบวนการ"
 * เปิดรับ: QR + รายชื่อ (เลข) ชื่อ · ล็อก: ให้ทุกคนเช็กชื่อตัวเอง · สุ่ม: ชื่อสลับเป็นวงกลม
 * ผล: ตารางเรียงตาม Lucky Number "ชื่อคุณ → ได้รับของขวัญจาก" + ตรวจกติกา 3 ข้อ + QR ตรวจเอง
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
  const members = [...(room?.members ?? [])].sort((a, b) => a.lucky - b.lucky);
  const chips = members.map((m) => `(${m.lucky}) ${displayName(m)}`);
  const ringNames = members.map((m) => `(${m.lucky}) ${m.nick || m.full}`);
  const rules = room?.pairs ? checkRules(room.pairs) : null;
  const rows = room?.pairs ? resultRows(room) : [];
  const cols = rows.length <= 10 ? 2 : rows.length <= 30 ? 3 : rows.length <= 60 ? 4 : 5;
  const big = rows.length > 30; // คนเยอะ: บรรทัดเดียว ไม่โชว์ทีม ให้พอดีจอเดียว

  return (
    <main className="stage-root stage-lucky">
      <div className="stage-inner">
        <div className="stage-title">จับฉลากของขวัญ {room && `· ห้อง ${room.id}`}</div>

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
              <div className="stage-count"><span>{members.length}</span><small> คน</small></div>
              <div className="stage-names">{chips.map((n) => <span key={n}>{n}</span>)}</div>
            </div>
            <div className="col-lg-4 text-center">
              <QrCode text={absUrl('/lucky/gacha')} size={260} className="mx-auto" />
              <p className="stage-sub mt-2 mb-0">หยิบการ์ด → สแกน → หาชื่อ → ใส่ Lucky Number</p>
            </div>
          </section>
        )}

        {room?.status === 'locked' && (
          <section className="text-center">
            <div className="stage-label"><i className="bi bi-lock-fill me-2" />ล็อกห้องแล้ว หาชื่อตัวเองเจอไหม?</div>
            <div className="stage-count"><span>{members.length}</span><small> คน</small></div>
            <div className="stage-names">{chips.map((n) => <span key={n}>{n}</span>)}</div>
            <p className="stage-rule">สุ่มครั้งเดียว ไม่สุ่มใหม่ · ผลมาจาก Lucky Number ที่ทุกคนหยิบเอง</p>
          </section>
        )}

        {room?.status === 'drawn' && phase !== 'done' && (
          <section className="text-center">
            <div className="stage-label">แคปซูลไหนจะเป็นของใคร…</div>
            {members.length > RING_MAX
              ? <div className="stage-names is-shuffling">{shuffleNames(chips, Math.floor(now / 220)).map((n) => <span key={n}>{n}</span>)}</div>
              : <div className="stage-ring"><Ring names={ringNames} shuffleSeed={Math.floor(now / 220)} /></div>}
          </section>
        )}

        {room?.status === 'drawn' && phase === 'done' && rules && (
          <section>
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-4 mb-3">
              <Checks rules={rules} compact />
              <div className="d-flex align-items-center gap-2">
                <QrCode text={verifyRoomUrl(window.location.origin, room.id)} size={130} />
                <span className="fw-bold" style={{ maxWidth: 170 }}>สแกนตรวจผลเองได้ ได้ผลเดียวกันทุกครั้ง</span>
              </div>
            </div>
            <div className="stage-label small mb-2 text-center">หาเลขของคุณ → <i className="bi bi-gift" /> ไปรับของขวัญจากเพื่อนคนนี้</div>
            <ol className={`stage-pairs is-result cols-${cols} ${big ? 'is-big' : ''}`} style={{ gridTemplateRows: `repeat(${Math.ceil(rows.length / cols)}, auto)` }}>
              {rows.map(([m, g]) => (
                <li key={m.id}><b className="no">({m.lucky})</b> <b>{m.nick || m.full}</b> <span className="arrow">←</span> <span className="no">({g.lucky})</span> {g.nick || g.full}{g.team && !big && <small> · {g.team}</small>}</li>
              ))}
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
