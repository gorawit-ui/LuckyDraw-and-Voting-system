'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ContestantArt from '@/components/vote/ContestantArt';
import Modal from '@/components/vote/Modal';
import SignIn from '@/components/vote/SignIn';
import Toast from '@/components/vote/Toast';
import UserChip from '@/components/vote/UserChip';
import { useNow, useToast } from '@/lib/vote/hooks';
import { resizeToDataUrl } from '@/lib/vote/image';
import { approved, buildCsv, fmtCountdown, isOpen, pending, stats, tally } from '@/lib/vote/logic';
import { useVote, voteApi, type Result } from '@/lib/vote/mock-store';
import { STATUS_LABEL, type EventStatus, type VoteEvent, type VoteState } from '@/lib/vote/types';

type Tab = 'overview' | 'contestants' | 'users' | 'events';
const TABS: [Tab, string, string][] = [
  ['overview', 'ภาพรวม', 'bi-speedometer2'], ['contestants', 'ผู้ประกวด', 'bi-person-badge'],
  ['users', 'ผู้ใช้และสิทธิ์', 'bi-shield-lock'], ['events', 'งานทั้งหมด', 'bi-calendar-event'],
];

export default function AdminApp() {
  const { ready, state, event, user } = useVote();
  const [tab, setTab] = useState<Tab>('overview');
  const [toast, show] = useToast();
  const run = (r: Result) => { if (r.ok) { if (r.msg) show(r.msg); } else show(r.error); };

  // หมดเวลา → ปิดอัตโนมัติ (หน้า host ที่เปิดอยู่ทำหน้าที่นี้ใน mock; ของจริงทำที่ server)
  const now = useNow(1000);
  useEffect(() => {
    if (event?.status === 'voting' && event.endsAt && now >= event.endsAt) { const r = voteApi.autoCloseIfExpired(); if (r.ok) show(r.msg ?? ''); }
  }, [now, event, show]);

  if (!ready || !state || !event) return <main className="container py-5 text-center text-cream"><div className="spinner-border" /></main>;
  if (!user) return <main className="container py-4 py-md-5"><SignIn hostOnly title="หลังบ้าน Host" /></main>;
  if (!user.isHost) {
    return (
      <main className="container py-5"><div className="card-pop p-4 text-center mx-auto" style={{ maxWidth: 520 }}>
        <h1 className="h3">เฉพาะ host เท่านั้น</h1><p>บัญชี {user.name} ไม่มีสิทธิ์ host</p>
        <div className="d-flex gap-2 justify-content-center"><Link href="/vote" className="btn btn-pop">ไปหน้าโหวต</Link>
          <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => voteApi.signOut()}>สลับบัญชี</button></div>
      </div></main>
    );
  }

  return (
    <main className="container-xxl py-3 py-md-4">
      <header className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="me-auto">
          <span className={`status-pill status-${event.status}`}>{STATUS_LABEL[event.status]}</span>
          <h1 className="display-pop mt-2 mb-0" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.6rem)' }}>{event.name}</h1>
        </div>
        <Link href="/vote/stage" target="_blank" className="btn btn-sm btn-pop"><i className="bi bi-easel me-1" />เปิดจอเวที</Link>
        <UserChip user={user} />
      </header>
      <ul className="nav nav-pills admin-tabs mb-3 gap-2 flex-nowrap overflow-auto" role="tablist">
        {TABS.map(([k, label, icon]) => (
          <li key={k} className="nav-item" role="presentation">
            <button type="button" role="tab" aria-selected={tab === k} className={`nav-link text-nowrap ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
              <i className={`bi ${icon} me-1`} />{label}
              {k === 'contestants' && pending(event).length > 0 && <span className="badge text-bg-danger ms-1">{pending(event).length}</span>}
            </button>
          </li>
        ))}
      </ul>
      {tab === 'overview' && <Overview state={state} event={event} now={now} run={run} show={show} />}
      {tab === 'contestants' && <Contestants state={state} event={event} run={run} show={show} />}
      {tab === 'users' && <Users state={state} run={run} />}
      {tab === 'events' && <Events state={state} run={run} />}
      <Toast msg={toast} />
    </main>
  );
}

// =============================== ภาพรวม ===============================
const STEPS: EventStatus[] = ['registration', 'voting', 'closed', 'revealed'];

function Overview({ state, event: e, now, run, show }: { state: VoteState; event: VoteEvent; now: number; run: (r: Result) => void; show: (m: string) => void }) {
  const st = stats(state, e);
  const rows = tally(e);
  const top = rows[0]?.points || 1;
  const [dur, setDur] = useState(String(e.durationMin));
  const [ask, setAsk] = useState<null | 'close' | 'reset'>(null);
  const [csv, setCsv] = useState(false);
  useEffect(() => setDur(String(e.durationMin)), [e.durationMin]);
  const open = isOpen(e, now);
  const nameOf = (id: string) => state.users.find((u) => u.id === id)?.name ?? id;
  const csvText = useMemo(() => (csv ? buildCsv(state, e) : ''), [csv, state, e]);

  return (
    <div className="row g-3">
      <div className="col-12">
        <div className="card-pop p-3 p-md-4">
          <ol className="stepper">
            {STEPS.map((s, i) => (
              <li key={s} className={STEPS.indexOf(e.status) > i ? 'done' : e.status === s ? 'now' : ''}><span>{i + 1}</span>{STATUS_LABEL[s]}</li>
            ))}
          </ol>
          <div className="d-flex flex-wrap align-items-end gap-2 mt-3">
            {e.status === 'registration' && (
              <>
                <div>
                  <label className="form-label fw-bold small mb-1" htmlFor="dur">เวลาโหวต (นาที)</label>
                  <input id="dur" type="number" min={1} max={120} className="form-control" style={{ width: 110 }} value={dur}
                    onChange={(x) => setDur(x.target.value)} onBlur={() => run(voteApi.setDuration(Number(dur)))} />
                </div>
                <button type="button" className="btn btn-pop btn-pop-green btn-lg" disabled={!approved(e).length}
                  onClick={() => { voteApi.setDuration(Number(dur)); run(voteApi.openVoting()); }}>
                  <i className="bi bi-play-fill me-1" />เปิดโหวต
                </button>
                {!approved(e).length && <span className="small fw-semibold">ต้องอนุมัติผู้ประกวดอย่างน้อย 1 คนก่อน</span>}
              </>
            )}
            {e.status === 'voting' && (
              <>
                <div className="countdown me-2">{open ? fmtCountdown((e.endsAt ?? now) - now) : '0:00'}</div>
                <button type="button" className="btn btn-pop" onClick={() => run(voteApi.addMinute())}><i className="bi bi-plus-lg me-1" />1 นาที</button>
                <button type="button" className="btn btn-pop btn-pop-red" onClick={() => setAsk('close')}><i className="bi bi-stop-fill me-1" />ปิดโหวตตอนนี้</button>
                <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => run(voteApi.simulate())} title="ใช้ทดสอบเท่านั้น">
                  <i className="bi bi-robot me-1" />จำลองโหวต (demo)
                </button>
              </>
            )}
            {(e.status === 'closed' || e.status === 'revealed') && (
              <>
                {e.status === 'closed' && <button type="button" className="btn btn-pop" onClick={() => run(voteApi.reopen())}><i className="bi bi-arrow-repeat me-1" />เปิดโหวตต่อ +2 นาที</button>}
                <span className="chip-pop">เปิดผลบนจอเวทีแล้ว {e.revealStep}/{rows.length} อันดับ</span>
                {e.revealStep > 0 && <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => run(voteApi.resetReveal())}>รีเซ็ตการประกาศผล</button>}
              </>
            )}
            <div className="ms-auto d-flex gap-2">
              <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setCsv(true)}><i className="bi bi-filetype-csv me-1" />CSV</button>
              <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setAsk('reset')} title="รีเซ็ต"><i className="bi bi-arrow-counterclockwise" /> รีเซ็ต</button>
            </div>
          </div>
        </div>
      </div>

      {[
        ['ผู้ประกวด', st.contestants, 'bi-person-badge'],
        ['โหวตแล้ว', `${st.voted} / ${st.eligible}`, 'bi-check2-square'],
        ['เมเนเจอร์โหวตแล้ว', `${st.managersVoted} / ${st.managers}`, 'bi-star-fill'],
        ['คะแนนรวม', st.points, 'bi-trophy'],
      ].map(([label, val, icon]) => (
        <div key={label as string} className="col-6 col-lg-3">
          <div className="card-pop p-3 h-100 stat-tile"><div className="small fw-bold"><i className={`bi ${icon} me-1`} />{label}</div><div className="stat-val">{val}</div></div>
        </div>
      ))}

      {(e.status === 'closed' || e.status === 'revealed') && rows[0] && (
        <div className="col-12">
          <div className="card-pop p-3 d-flex align-items-center gap-3 winner-box">
            <ContestantArt c={rows[0].c} className="c-art-xs" />
            <div><div className="small fw-bold">🏆 ผู้ชนะ (host เห็นก่อน — จอเวทียังไม่โชว์จนกว่าจะเปิดผล)</div>
              <div className="fs-4 fw-bold">{rows[0].c.name} · {rows[0].c.title}</div><div>{rows[0].points} คะแนน · {rows[0].votes} โหวต</div></div>
          </div>
        </div>
      )}

      <div className="col-lg-7">
        <div className="card-pop p-3 p-md-4 h-100">
          <h2 className="h5"><i className="bi bi-bar-chart-fill me-2" />คะแนนสด</h2>
          {rows.length ? rows.map((r) => (
            <div key={r.c.id} className="d-flex align-items-center gap-2 mb-2">
              <span className="rank-no">{r.rank}</span>
              <ContestantArt c={r.c} className="c-art-xs" />
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex justify-content-between"><span className="fw-bold text-truncate">{r.c.name} · {r.c.title}</span><span className="fw-bold ms-2 text-nowrap">{r.points} คะแนน</span></div>
                <div className="progress border border-dark" style={{ height: 12 }} role="progressbar" aria-valuenow={r.points} aria-valuemin={0} aria-valuemax={top}>
                  <div className="progress-bar bg-warning" style={{ width: `${(r.points / top) * 100}%` }} />
                </div>
                <div className="small">{r.votes} โหวต</div>
              </div>
            </div>
          )) : <p className="mb-0">ยังไม่มีผู้ประกวด</p>}
        </div>
      </div>
      <div className="col-lg-5">
        <div className="card-pop p-3 p-md-4 h-100">
          <h2 className="h5"><i className="bi bi-list-check me-2" />ใครโหวตใคร ({e.votes.length})</h2>
          <div className="table-responsive" style={{ maxHeight: 420 }}>
            <table className="table table-sm align-middle mb-0" style={{ ['--bs-table-bg' as string]: 'transparent' }}>
              <thead><tr><th>เวลา</th><th>ผู้โหวต</th><th>โหวตให้</th><th className="text-end">+</th></tr></thead>
              <tbody>
                {e.votes.slice().reverse().map((v) => (
                  <tr key={v.voterId}>
                    <td className="text-nowrap small">{new Date(v.at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                    <td>{nameOf(v.voterId)}</td>
                    <td>{e.contestants.find((c) => c.id === v.contestantId)?.name}</td>
                    <td className="text-end fw-bold">{v.weight}</td>
                  </tr>
                ))}
                {!e.votes.length && <tr><td colSpan={4} className="opacity-75">ยังไม่มีโหวต</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={ask === 'close'} onClose={() => setAsk(null)} title="ปิดโหวตตอนนี้?"
        footer={<><button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setAsk(null)}>ยกเลิก</button>
          <button type="button" className="btn btn-pop btn-pop-red" onClick={() => { setAsk(null); run(voteApi.closeVoting()); }}>ปิดโหวต</button></>}>
        คนที่ยังไม่โหวตจะลงคะแนนไม่ได้อีก (เปิดต่อได้ +2 นาทีถ้าจำเป็น)
      </Modal>
      <Modal open={ask === 'reset'} onClose={() => setAsk(null)} title="รีเซ็ตงานนี้"
        footer={<button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setAsk(null)}>ยกเลิก</button>}>
        <div className="d-grid gap-2">
          <button type="button" className="btn btn-pop" onClick={() => { setAsk(null); run(voteApi.resetRound()); }}>
            <b>ล้างคะแนนรอบนี้</b><br /><span className="small fw-normal">เก็บผู้ประกวดไว้ กลับไปสถานะเปิดรับสมัคร</span>
          </button>
          <button type="button" className="btn btn-pop btn-pop-red" onClick={() => { setAsk(null); run(voteApi.resetAll()); }}>
            <b>ล้างทั้งหมด</b><br /><span className="small fw-normal">ลบทั้งผู้ประกวดและคะแนน</span>
          </button>
        </div>
      </Modal>
      <Modal open={csv} onClose={() => setCsv(false)} title="ผลโหวตแบบ CSV" size="lg"
        footer={<>
          <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => {
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csvText], { type: 'text/csv' }));
            a.download = 'fashion-vote.csv'; a.click();
          }}><i className="bi bi-download me-1" />ดาวน์โหลด</button>
          <button type="button" className="btn btn-pop" onClick={() => navigator.clipboard?.writeText(csvText).then(() => show('คัดลอกแล้ว'), () => show('คัดลอกไม่ได้ ให้เลือกข้อความเอง'))}>
            <i className="bi bi-clipboard me-1" />คัดลอก
          </button></>}>
        <p className="small">วางใน Google Sheets / Excel ได้เลย (ตารางอันดับ + บันทึกทุกโหวต)</p>
        <textarea className="form-control font-monospace small" rows={12} readOnly value={csvText} />
      </Modal>
    </div>
  );
}

// =============================== ผู้ประกวด ===============================
function Contestants({ state, event: e, run, show }: { state: VoteState; event: VoteEvent; run: (r: Result) => void; show: (m: string) => void }) {
  const locked = e.status !== 'registration';
  const [f, setF] = useState({ name: '', team: '', title: '', slackId: '', photo: null as string | null });
  const add = (x: React.FormEvent) => {
    x.preventDefault();
    const r = voteApi.addContestant({ name: f.name, team: f.team, title: f.title, photo: f.photo, slackId: f.slackId || null });
    run(r);
    if (r.ok) setF({ name: '', team: '', title: '', slackId: '', photo: null });
  };
  const linkUser = (id: string) => {
    const u = state.users.find((x) => x.id === id);
    setF((p) => ({ ...p, slackId: id, name: u ? u.name : p.name, team: u ? u.dept : p.team }));
  };
  return (
    <div className="row g-3">
      {locked && <div className="col-12"><div className="alert alert-warning border-2 border-dark mb-0"><i className="bi bi-lock-fill me-1" />รายชื่อล็อกแล้วหลังเปิดโหวต</div></div>}
      <div className="col-lg-7">
        <div className="card-pop p-3 p-md-4 mb-3">
          <h2 className="h5"><i className="bi bi-hourglass-split me-2" />รออนุมัติ ({pending(e).length})</h2>
          {pending(e).map((c) => (
            <div key={c.id} className="d-flex align-items-center gap-2 py-2 border-bottom border-2">
              <ContestantArt c={c} className="c-art-xs" />
              <div className="me-auto"><div className="fw-bold">{c.title}</div><div className="small">{c.name} · {c.team}</div></div>
              <button type="button" className="btn btn-sm btn-pop btn-pop-green" disabled={locked} onClick={() => run(voteApi.approve(c.id))}>อนุมัติ</button>
              <button type="button" className="btn btn-sm btn-pop btn-pop-cream" disabled={locked} onClick={() => run(voteApi.removeContestant(c.id))}>ปฏิเสธ</button>
            </div>
          ))}
          {!pending(e).length && <p className="mb-0 opacity-75">ไม่มีใบสมัครค้าง</p>}
        </div>
        <div className="card-pop p-3 p-md-4">
          <h2 className="h5"><i className="bi bi-people-fill me-2" />รายชื่อผู้ประกวด ({approved(e).length})</h2>
          {approved(e).map((c) => (
            <div key={c.id} className="d-flex align-items-center gap-2 py-2 border-bottom border-2">
              <ContestantArt c={c} className="c-art-xs" />
              <div className="me-auto"><div className="fw-bold">{c.title}</div>
                <div className="small">{c.name} · {c.team} {c.slackId ? <span className="badge text-bg-light border border-dark">ผูก Slack · โหวตไม่ได้</span> : <span className="badge text-bg-light border border-dark">ไม่ผูก</span>}</div></div>
              <button type="button" className="btn btn-sm btn-pop btn-pop-cream" disabled={locked} onClick={() => run(voteApi.removeContestant(c.id))} aria-label={`ลบ ${c.name}`}><i className="bi bi-trash3" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="col-lg-5">
        <form className="card-pop p-3 p-md-4" onSubmit={add}>
          <h2 className="h5"><i className="bi bi-person-plus-fill me-2" />เพิ่มผู้ประกวดเอง</h2>
          <fieldset disabled={locked}>
            <label className="form-label fw-bold small" htmlFor="a-link">ผูกบัญชี Slack (ไม่ผูกก็ได้ เช่นประกวดเป็นทีม)</label>
            <select id="a-link" className="form-select mb-2" value={f.slackId} onChange={(x) => linkUser(x.target.value)}>
              <option value="">— ไม่ผูก —</option>
              {state.users.filter((u) => !e.contestants.some((c) => c.slackId === u.id)).map((u) => <option key={u.id} value={u.id}>{u.name} · {u.dept}</option>)}
            </select>
            <input className="form-control mb-2" placeholder="ชื่อที่ให้ประกาศ" value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} required />
            <input className="form-control mb-2" placeholder="ทีม / แผนก" value={f.team} onChange={(x) => setF({ ...f, team: x.target.value })} />
            <input className="form-control mb-2" placeholder="ชื่อชุด / คอนเซปต์" value={f.title} onChange={(x) => setF({ ...f, title: x.target.value })} required />
            <input type="file" accept="image/*" className="form-control mb-3" onChange={async (x) => {
              const file = x.target.files?.[0]; if (!file) return;
              try { const photo = await resizeToDataUrl(file); setF((p) => ({ ...p, photo })); } catch (err) { show((err as Error).message); }
            }} />
            <button type="submit" className="btn btn-pop w-100"><i className="bi bi-plus-lg me-1" />เพิ่ม</button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

// =============================== ผู้ใช้และสิทธิ์ ===============================
function Users({ state, run }: { state: VoteState; run: (r: Result) => void }) {
  const [q, setQ] = useState('');
  const list = state.users.filter((u) => !q || (u.name + u.dept).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="card-pop p-3 p-md-4">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <h2 className="h5 mb-0 me-auto"><i className="bi bi-shield-lock me-2" />ผู้ใช้และสิทธิ์ ({state.users.length})</h2>
        <input className="form-control" style={{ maxWidth: 260 }} placeholder="ค้นหา" value={q} onChange={(x) => setQ(x.target.value)} />
      </div>
      <p className="small">เมเนเจอร์ได้ 10 คะแนน คนอื่น 1 คะแนน · น้ำหนักคิด ณ ตอนกดโหวต · ของจริง sync เมเนเจอร์จาก Slack user group แล้วแก้มือที่นี่ได้</p>
      <div className="table-responsive">
        <table className="table align-middle mb-0" style={{ ['--bs-table-bg' as string]: 'transparent' }}>
          <thead><tr><th>ชื่อ</th><th>แผนก</th><th className="text-center">เมเนเจอร์ (10)</th><th className="text-center">Host</th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td className="fw-bold">{u.name}</td><td>{u.dept}</td>
                <td className="text-center"><div className="form-check form-switch d-inline-block">
                  <input className="form-check-input" type="checkbox" role="switch" checked={u.isManager} onChange={() => run(voteApi.toggleManager(u.id))} aria-label={`เมเนเจอร์ ${u.name}`} /></div></td>
                <td className="text-center"><div className="form-check form-switch d-inline-block">
                  <input className="form-check-input" type="checkbox" role="switch" checked={u.isHost} onChange={() => run(voteApi.toggleHost(u.id))} aria-label={`host ${u.name}`} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================== งานทั้งหมด ===============================
function Events({ state, run }: { state: VoteState; run: (r: Result) => void }) {
  const [name, setName] = useState('');
  const [view, setView] = useState<VoteEvent | null>(null);
  return (
    <div className="row g-3">
      <div className="col-lg-4">
        <form className="card-pop p-3 p-md-4" onSubmit={(x) => { x.preventDefault(); const r = voteApi.createEvent(name); run(r); if (r.ok) setName(''); }}>
          <h2 className="h5"><i className="bi bi-calendar-plus me-2" />สร้างงานใหม่</h2>
          <input className="form-control mb-2" placeholder="เช่น ประกวดชุดไทย" value={name} onChange={(x) => setName(x.target.value)} required />
          <button type="submit" className="btn btn-pop w-100">สร้างและใช้งาน</button>
        </form>
        <button type="button" className="btn btn-sm btn-link text-cream mt-2" onClick={() => { if (confirm('ล้างข้อมูล demo ทั้งหมดกลับเป็นตัวอย่าง?')) voteApi.factoryReset(); }}>
          ล้างข้อมูล demo ทั้งหมด
        </button>
      </div>
      <div className="col-lg-8">
        <div className="card-pop p-3 p-md-4">
          <h2 className="h5"><i className="bi bi-calendar-event me-2" />งานทั้งหมด ({state.events.length})</h2>
          {state.events.map((ev) => {
            const w = tally(ev)[0];
            const isActive = ev.id === state.activeEventId;
            return (
              <div key={ev.id} className="d-flex flex-wrap align-items-center gap-2 py-2 border-bottom border-2">
                <div className="me-auto">
                  <div className="fw-bold">{ev.name} {isActive && <span className="badge text-bg-success border border-dark">งานปัจจุบัน</span>}</div>
                  <div className="small">{new Date(ev.createdAt).toLocaleDateString('th-TH')} · {STATUS_LABEL[ev.status]} · {approved(ev).length} ผู้ประกวด · {ev.votes.length} โหวต
                    {(ev.status === 'closed' || ev.status === 'revealed') && w && <> · 🏆 {w.c.name}</>}</div>
                </div>
                <button type="button" className="btn btn-sm btn-pop btn-pop-cream" onClick={() => setView(ev)}>ดูผล</button>
                {!isActive && <button type="button" className="btn btn-sm btn-pop" onClick={() => run(voteApi.setActive(ev.id))}>ใช้งานนี้</button>}
                {!isActive && <button type="button" className="btn btn-sm btn-pop btn-pop-cream" aria-label={`ลบ ${ev.name}`}
                  onClick={() => { if (confirm(`ลบงาน "${ev.name}"?`)) run(voteApi.deleteEvent(ev.id)); }}><i className="bi bi-trash3" /></button>}
              </div>
            );
          })}
        </div>
      </div>
      <Modal open={!!view} onClose={() => setView(null)} title={view?.name ?? ''} size="lg">
        {view && (
          <table className="table align-middle mb-0" style={{ ['--bs-table-bg' as string]: 'transparent' }}>
            <thead><tr><th>#</th><th>ผู้ประกวด</th><th>ชุด</th><th className="text-end">คะแนน</th><th className="text-end">โหวต</th></tr></thead>
            <tbody>{tally(view).map((r) => (
              <tr key={r.c.id}><td className="fw-bold">{r.rank === 1 ? '🏆' : r.rank}</td><td>{r.c.name}</td><td>{r.c.title}</td><td className="text-end fw-bold">{r.points}</td><td className="text-end">{r.votes}</td></tr>
            ))}</tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
