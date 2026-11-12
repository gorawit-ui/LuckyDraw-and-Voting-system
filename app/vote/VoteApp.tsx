'use client';
import Link from 'next/link';
import { useState } from 'react';
import ContestantArt from '@/components/vote/ContestantArt';
import Modal from '@/components/vote/Modal';
import SignIn from '@/components/vote/SignIn';
import Toast from '@/components/vote/Toast';
import UserChip from '@/components/vote/UserChip';
import { burst } from '@/lib/fx';
import { MASCOT } from '@/lib/site';
import { useNow, useToast } from '@/lib/vote/hooks';
import { resizeToDataUrl } from '@/lib/vote/image';
import { approved, fmtCountdown, isContestant, isOpen, myApplication, myVote, tally, weightOf } from '@/lib/vote/logic';
import { useVote, voteApi } from '@/lib/vote/mock-store';
import { STATUS_LABEL, type Contestant, type User, type VoteEvent } from '@/lib/vote/types';

export default function VoteApp() {
  const { ready, event, user } = useVote();
  const [toast, show] = useToast();
  if (!ready || !event) return <main className="container py-5 text-center text-cream"><div className="spinner-border" /></main>;
  if (!user) return <main className="container py-4 py-md-5"><SignIn /></main>;

  return (
    <main className="container py-3 py-md-4 vote-page">
      <header className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="me-auto">
          <span className={`status-pill status-${event.status}`}>{STATUS_LABEL[event.status]}</span>
          <h1 className="display-pop mt-2 mb-0" style={{ fontSize: 'clamp(1.7rem, 6vw, 2.8rem)' }}>{event.name}</h1>
        </div>
        <UserChip user={user} />
      </header>
      {user.isHost && (
        <div className="d-flex gap-2 mb-3">
          <Link href="/vote/admin" className="btn btn-sm btn-pop"><i className="bi bi-sliders me-1" />หลังบ้าน Host</Link>
          <Link href="/vote/stage" className="btn btn-sm btn-pop btn-pop-cream"><i className="bi bi-easel me-1" />จอเวที</Link>
        </div>
      )}
      {event.status === 'registration' && <Registration event={event} user={user} show={show} />}
      {event.status === 'voting' && <Voting event={event} user={user} show={show} />}
      {(event.status === 'closed' || event.status === 'revealed') && <Closed event={event} user={user} />}
      <Toast msg={toast} />
    </main>
  );
}

// ======================= เปิดรับสมัคร =======================
function Registration({ event, user, show }: { event: VoteEvent; user: User; show: (m: string) => void }) {
  const mine = myApplication(event, user.id);
  const list = approved(event);
  return (
    <div className="row g-4">
      <div className="col-lg-5 order-lg-2">
        {mine ? <MyApplication c={mine} show={show} /> : <RegisterForm user={user} show={show} />}
      </div>
      <div className="col-lg-7">
        <div className="card-pop p-3 p-md-4">
          <h2 className="h4"><i className="bi bi-people-fill me-2" />ผู้ประกวด ({list.length})</h2>
          <p className="small mb-3">ยังไม่เปิดโหวต — ดูรายชื่อไว้ก่อน เปิดเมื่อไหร่กดโหวตได้เลย</p>
          <ContestantGrid list={list} />
        </div>
      </div>
    </div>
  );
}

function MyApplication({ c, show }: { c: Contestant; show: (m: string) => void }) {
  return (
    <div className="card-pop p-3 p-md-4">
      <h2 className="h4"><i className="bi bi-ticket-perforated me-2" />ใบสมัครของคุณ</h2>
      <div className="d-flex gap-3 align-items-center">
        <ContestantArt c={c} className="c-art-sm" />
        <div>
          <div className="fw-bold fs-5">{c.title}</div>
          <div>{c.name} · {c.team}</div>
          <span className={`badge border border-dark mt-1 ${c.status === 'approved' ? 'text-bg-success' : 'text-bg-warning'}`}>
            {c.status === 'approved' ? 'อนุมัติแล้ว' : 'รอ host อนุมัติ'}
          </span>
        </div>
      </div>
      {c.status === 'approved'
        ? <p className="small mt-3 mb-0"><i className="bi bi-info-circle me-1" />ผู้ประกวดอยู่บนเวที จึงลงคะแนนไม่ได้นะ</p>
        : <button type="button" className="btn btn-sm btn-pop btn-pop-cream mt-3" onClick={() => { const r = voteApi.withdraw(); show(r.ok ? r.msg ?? '' : r.error); }}>
            <i className="bi bi-x-circle me-1" />ถอนใบสมัคร
          </button>}
    </div>
  );
}

function RegisterForm({ user, show }: { user: User; show: (m: string) => void }) {
  const [name, setName] = useState(user.name);
  const [team, setTeam] = useState(user.dept);
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { setPhoto(await resizeToDataUrl(f)); } catch (e) { show((e as Error).message); } finally { setBusy(false); }
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = voteApi.register({ name, team, title, photo });
    show(r.ok ? r.msg ?? '' : r.error);
  };
  return (
    <form className="card-pop p-3 p-md-4" onSubmit={submit}>
      <h2 className="h4"><i className="bi bi-stars me-2" />สมัครประกวดชุด</h2>
      <p className="small">กรอกข้อมูลและแนบรูปชุด host จะอนุมัติก่อนขึ้นรายชื่อให้โหวต</p>
      <div className="mb-2"><label className="form-label fw-bold" htmlFor="r-name">ชื่อที่ให้ประกาศ</label>
        <input id="r-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></div>
      <div className="mb-2"><label className="form-label fw-bold" htmlFor="r-team">ทีม / แผนก</label>
        <input id="r-team" className="form-control" value={team} onChange={(e) => setTeam(e.target.value)} maxLength={60} /></div>
      <div className="mb-2"><label className="form-label fw-bold" htmlFor="r-title">ชื่อชุด / คอนเซปต์</label>
        <input id="r-title" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} placeholder="เช่น ราชินีมัทฉะ" /></div>
      <div className="mb-3"><label className="form-label fw-bold" htmlFor="r-photo">รูปชุด (ไม่ใส่ก็ได้)</label>
        <input id="r-photo" type="file" accept="image/*" className="form-control" onChange={(e) => onFile(e.target.files?.[0])} />
        {busy && <div className="small mt-1"><span className="spinner-border spinner-border-sm me-1" />กำลังย่อรูป…</div>}
        {photo && <ContestantArt c={{ photo, emoji: '', hue: 0, name }} className="c-art-sm mt-2" />}
      </div>
      <button type="submit" className="btn btn-pop w-100" disabled={busy}><i className="bi bi-send me-1" />ส่งใบสมัคร</button>
    </form>
  );
}

// ======================= กำลังโหวต =======================
function Voting({ event, user, show }: { event: VoteEvent; user: User; show: (m: string) => void }) {
  const now = useNow(500);
  const [sel, setSel] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const voted = myVote(event, user.id);
  const list = approved(event);
  const open = isOpen(event, now);
  const remain = event.endsAt ? event.endsAt - now : 0;
  const w = weightOf(user);
  const picked = list.find((c) => c.id === sel) ?? null;

  if (isContestant(event, user.id)) {
    return <Notice mascot="runway" title="คุณเป็นผู้ประกวด" text="ผู้ประกวดอยู่บนเวที จึงลงคะแนนไม่ได้ — ขอให้โชคดีนะ!"><ContestantGrid list={list} /></Notice>;
  }
  if (voted) {
    const c = event.contestants.find((x) => x.id === voted.contestantId)!;
    return <Ticket c={c} weight={voted.weight} at={voted.at} remain={open ? remain : 0} />;
  }
  const doVote = () => {
    if (!sel) return;
    const r = voteApi.vote(sel);
    setConfirm(false);
    if (r.ok) burst(120);
    show(r.ok ? r.msg ?? '' : r.error);
  };

  return (
    <>
      <div className="card-pop p-3 mb-3 d-flex flex-wrap align-items-center gap-3 vote-rights">
        <div className="weight-badge">{w === 10 ? '+10' : '+1'}</div>
        <div className="me-auto">
          <div className="fw-bold fs-5">{w === 10 ? '10 คะแนนในฐานะเมเนเจอร์' : 'คุณมี 1 คะแนน'}</div>
          <div className="small">เลือกชุดที่ชอบที่สุด 1 ชุด · ยืนยันแล้วแก้ไขไม่ได้</div>
        </div>
        <div className="text-center">
          <div className="small fw-bold">เหลือเวลา</div>
          <div className={`countdown ${remain < 30_000 ? 'is-hurry' : ''}`}>{open ? fmtCountdown(remain) : 'หมดเวลา'}</div>
        </div>
      </div>
      <ContestantGrid list={list} selected={sel} onSelect={open ? setSel : undefined} />
      <div className={`vote-bar ${picked ? 'show' : ''}`}>
        <div className="container d-flex align-items-center gap-3">
          {picked && <ContestantArt c={picked} className="c-art-xs" />}
          <div className="me-auto text-truncate"><div className="fw-bold text-truncate">{picked?.title}</div><div className="small">{picked?.name}</div></div>
          <button type="button" className="btn btn-pop btn-lg" disabled={!open} onClick={() => setConfirm(true)}>
            <i className="bi bi-heart-fill me-1" />โหวตให้คนนี้
          </button>
        </div>
      </div>
      <Modal open={confirm && !!picked} onClose={() => setConfirm(false)} title="ยืนยันโหวตให้คนนี้?"
        footer={<>
          <button type="button" className="btn btn-pop btn-pop-cream" onClick={() => setConfirm(false)}>ยังก่อน</button>
          <button type="button" className="btn btn-pop btn-pop-green" onClick={doVote}><i className="bi bi-check2-circle me-1" />ยืนยัน {w === 10 ? '+10' : '+1'}</button>
        </>}>
        {picked && (
          <div className="text-center">
            <ContestantArt c={picked} className="c-art-md mx-auto" />
            <div className="fw-bold fs-4 mt-2">{picked.title}</div>
            <div>{picked.name} · {picked.team}</div>
            <div className="alert alert-warning border-2 border-dark mt-3 mb-0 fw-semibold"><i className="bi bi-exclamation-triangle-fill me-1" />ยืนยันแล้วแก้ไขไม่ได้</div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Ticket({ c, weight, at, remain }: { c: Contestant; weight: number; at: number; remain: number }) {
  return (
    <div className="row justify-content-center">
      <div className="col-md-7 col-lg-5">
        <div className="ticket card-pop p-4 text-center">
          <div className="pixel small mb-2">BALLOT · บัตรลงคะแนน</div>
          <ContestantArt c={c} className="c-art-md mx-auto" />
          <div className="fw-bold fs-4 mt-2">{c.title}</div>
          <div>{c.name} · {c.team}</div>
          <div className="display-6 fw-bold mt-2">+{weight}</div>
          <div className="small">{new Date(at).toLocaleTimeString('th-TH')}</div>
          <div className="stamp">ลงคะแนนแล้ว</div>
          <p className="fw-bold mt-4 mb-1">รับคะแนนแล้ว ขอบคุณที่ร่วมโหวต!</p>
          <p className="small mb-0">{remain > 0 ? `ปิดโหวตในอีก ${fmtCountdown(remain)} — ไปลุ้นผลที่จอเวทีกัน` : 'รอลุ้นผลที่จอเวที'}</p>
        </div>
      </div>
    </div>
  );
}

// ======================= ปิดแล้ว / ประกาศผล =======================
function Closed({ event, user }: { event: VoteEvent; user: User }) {
  const rows = tally(event);
  const done = event.status === 'revealed' && event.revealStep >= rows.length && rows.length > 0;
  const voted = myVote(event, user.id);
  if (done) {
    const w = rows[0].c;
    return (
      <Notice mascot="winner" title={`ผู้ชนะคือ… ${w.name}`} text="ขอเสียงปรบมือ!">
        <ContestantArt c={w} className="c-art-md mx-auto" />
        <div className="fw-bold fs-4 mt-2">{w.title}</div>
      </Notice>
    );
  }
  return <Notice mascot="nervous" title="ปิดโหวตแล้ว" text={`${voted ? 'คุณลงคะแนนแล้ว · ' : ''}คะแนนกำลังรวม เสียงเชียร์พร้อมไหม? ไปลุ้นที่จอเวทีกัน`} />;
}

// ======================= ส่วนประกอบ =======================
function Notice({ mascot, title, text, children }: { mascot: Parameters<typeof MASCOT>[0]; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="card-pop p-4 p-md-5 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MASCOT(mascot)} alt="" width={720} height={720} style={{ width: 150, height: 'auto' }} />
      <h2 className="h3 mt-2">{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}

function ContestantGrid({ list, selected, onSelect }: { list: Contestant[]; selected?: string | null; onSelect?: (id: string) => void }) {
  if (!list.length) return <p className="mb-0 opacity-75">ยังไม่มีผู้ประกวดที่อนุมัติ</p>;
  return (
    <div className="row g-3">
      {list.map((c) => {
        const body = (
          <>
            <ContestantArt c={c} />
            <div className="p-2">
              <div className="fw-bold text-truncate">{c.title}</div>
              <div className="small text-truncate">{c.name} · {c.team}</div>
            </div>
            {selected === c.id && <span className="c-check"><i className="bi bi-check-lg" /></span>}
          </>
        );
        return (
          <div key={c.id} className="col-6 col-md-4 col-xl-3">
            {onSelect
              ? <button type="button" className={`c-card ${selected === c.id ? 'is-selected' : ''}`} onClick={() => onSelect(c.id)} aria-pressed={selected === c.id}>{body}</button>
              : <div className="c-card">{body}</div>}
          </div>
        );
      })}
    </div>
  );
}
