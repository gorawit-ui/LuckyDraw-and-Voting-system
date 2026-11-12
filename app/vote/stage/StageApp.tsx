'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import ContestantArt from '@/components/vote/ContestantArt';
import { burst } from '@/lib/fx';
import { MASCOT } from '@/lib/site';
import { useNow } from '@/lib/vote/hooks';
import { approved, fmtCountdown, isOpen, stats, tally } from '@/lib/vote/logic';
import { useVote, voteApi } from '@/lib/vote/mock-store';

/**
 * จอเวที (โปรเจกเตอร์) — ระหว่างโหวตโชว์แค่จำนวนคนโหวต + เวลา (ไม่โชว์คะแนน)
 * ปิดแล้ว host เปิดผลทีละอันดับจากท้ายขึ้นมา: Space / → / PageDown = ถัดไป · ← = ย้อน
 * ของจริง: จอนี้ subscribe Firestore ตรงจากเบราว์เซอร์ (ไม่ผ่าน Cloud Run → บิล 0)
 */
export default function StageApp() {
  const { ready, state, event, user } = useVote();
  const now = useNow(250);
  const host = !!user?.isHost;
  const lastStep = useRef<number | null>(null);

  useEffect(() => {
    if (event?.status === 'voting' && event.endsAt && now >= event.endsAt) voteApi.autoCloseIfExpired();
  }, [now, event]);

  // คีย์ลัด (host เท่านั้น) — รีโมตพรีเซนต์ใช้ได้
  useEffect(() => {
    if (!host) return;
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input,textarea,button,a')) return;
      if ([' ', 'ArrowRight', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); voteApi.revealNext(); }
      if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); voteApi.revealPrev(); }
      if (e.key === 'f') toggleFull();
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [host]);

  // พลุเมื่อเปิดอันดับ (ใหญ่สุดตอนอันดับ 1) — ยิงเฉพาะตอนค่าเปลี่ยน ไม่ยิงตอนโหลดหน้า
  const n = event ? approved(event).length : 0;
  useEffect(() => {
    if (!event) return;
    const prev = lastStep.current;
    lastStep.current = event.revealStep;
    if (prev === null || event.revealStep <= prev) return;
    if (event.revealStep >= n) { burst(220); setTimeout(() => burst(160), 450); setTimeout(() => burst(120), 900); }
    else burst(50);
  }, [event, n]);

  if (!ready || !state || !event) return <main className="stage-root" />;
  const st = stats(state, event);
  const rows = tally(event);
  const shown = (rank: number) => rank > rows.length - event.revealStep;
  const allShown = event.revealStep >= rows.length && rows.length > 0;
  const remain = event.endsAt ? Math.max(0, event.endsAt - now) : 0;

  return (
    <main className="stage-root">
      <div className="stage-inner">
        <div className="stage-title">{event.name}</div>

        {event.status === 'registration' && (
          <section className="text-center">
            <h1 className="stage-big">FASHION WALK</h1>
            <p className="stage-sub">เปิดเว็บบนมือถือ → Sign in with Slack → รอโหวต</p>
            <p className="stage-url">{typeof window !== 'undefined' ? `${location.host}/vote` : '/vote'}</p>
            <div className="stage-thumbs">
              {approved(event).map((c) => (
                <figure key={c.id}><ContestantArt c={c} /><figcaption>{c.name}</figcaption></figure>
              ))}
            </div>
          </section>
        )}

        {event.status === 'voting' && (
          <section className="text-center">
            <div className="stage-label">โหวตแล้ว</div>
            <div className="stage-count"><span>{st.voted}</span><small> / {st.eligible} คน</small></div>
            <div className="stage-progress"><div style={{ width: `${st.eligible ? (st.voted / st.eligible) * 100 : 0}%` }} /></div>
            <div className={`stage-timer ${remain < 30_000 ? 'is-hurry' : ''}`}>{isOpen(event, now) ? fmtCountdown(remain) : 'หมดเวลา'}</div>
            <p className="stage-sub">คะแนนกำลังรวม เสียงเชียร์พร้อมไหม?</p>
          </section>
        )}

        {(event.status === 'closed' || event.status === 'revealed') && (
          <section>
            {allShown && rows[0] ? (
              <div className="stage-winner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MASCOT('winner')} alt="" className="stage-winner-mascot" width={720} height={720} />
                <ContestantArt c={rows[0].c} className="stage-winner-art" />
                <div>
                  <div className="stage-label">🏆 ผู้ชนะคือ…</div>
                  <div className="stage-winner-name">{rows[0].c.name}</div>
                  <div className="stage-sub mb-1">{rows[0].c.title} · {rows[0].c.team}</div>
                  <div className="stage-sub">{rows[0].points} คะแนน · ขอเสียงปรบมือ!</div>
                </div>
              </div>
            ) : (
              <div className="text-center stage-label mb-3">{event.revealStep === 0 ? 'ปิดโหวตแล้ว · พร้อมประกาศผล' : 'ลุ้นได้ แต่อย่าเพิ่งกลั้นหายใจ'}</div>
            )}
            <ol className={`stage-ranks ${rows.length > 6 ? 'two-col' : ''}`}>
              {rows.map((r) => (
                <li key={r.c.id} className={`stage-rank ${shown(r.rank) ? 'is-shown' : ''} ${r.rank === 1 ? 'is-first' : ''}`}>
                  <span className="no">{r.rank}</span>
                  <div className="flip">
                    <div className="face back">?</div>
                    <div className="face front">
                      <ContestantArt c={r.c} className="c-art-xs" />
                      <span className="nm">{r.c.name} <small>{r.c.title}</small></span>
                      <span className="pts">{r.points}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {/* แถบควบคุม (host) */}
      <div className="stage-controls">
        {host ? (
          <>
            {(event.status === 'closed' || event.status === 'revealed') && (
              <>
                <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => voteApi.revealPrev()} disabled={event.revealStep === 0}><i className="bi bi-arrow-left" /></button>
                {!allShown
                  ? <button type="button" className="btn btn-pop" onClick={() => voteApi.revealNext()}>เปิดอันดับ {rows.length - event.revealStep} <i className="bi bi-arrow-right" /></button>
                  : <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => voteApi.resetReveal()}><i className="bi bi-arrow-counterclockwise me-1" />รีเซ็ตเล่นใหม่</button>}
              </>
            )}
            <Link href="/vote/admin" className="btn btn-pop btn-pop-cream"><i className="bi bi-sliders" /></Link>
          </>
        ) : (
          <Link href="/vote/admin" className="btn btn-sm btn-pop btn-pop-cream">เข้าสู่ระบบ host เพื่อควบคุม</Link>
        )}
        <button type="button" className="btn btn-pop btn-pop-cream" onClick={toggleFull} title="เต็มจอ (F)"><i className="bi bi-arrows-fullscreen" /></button>
      </div>
    </main>
  );
}

function toggleFull() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.();
}
