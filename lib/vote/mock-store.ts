'use client';
/**
 * Mock backend (Phase 2 ก่อนมี Firestore/Slack): เก็บใน localStorage + ซิงก์ข้ามแท็บด้วย BroadcastChannel
 * ทุก action ตรวจสิทธิ์และกฎเหมือนที่ API จริงต้องทำ — ตอนย้ายไป Firestore ให้แทนไฟล์นี้ไฟล์เดียว
 * ผู้ใช้ที่ "login" เก็บใน sessionStorage → เปิดหลายแท็บเป็นคนละคนได้ (ใช้ทดสอบ)
 */
import { useSyncExternalStore } from 'react';
import { approved, castVote, isOpen, VOTE_ERROR_TH, weightOf } from './logic';
import { seedState, uid } from './seed';
import type { Contestant, VoteEvent, VoteState } from './types';

const KEY = 'oc_vote_state_v1';
const ME = 'oc_vote_me';
const CH = 'oc_vote';

export type Result = { ok: true; msg?: string } | { ok: false; error: string };
const ok = (msg?: string): Result => ({ ok: true, msg });
const fail = (error: string): Result => ({ ok: false, error });

let cache: VoteState | null = null;
let me: string | null = null;
const listeners = new Set<() => void>();
let bc: BroadcastChannel | null = null;
let booted = false;

function read(): VoteState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as VoteState;
  } catch { /* ignore */ }
  const s = seedState();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  return s;
}
const emit = () => listeners.forEach((l) => l());

function boot() {
  if (booted || typeof window === 'undefined') return;
  booted = true;
  cache = read();
  try { me = sessionStorage.getItem(ME); } catch { me = null; }
  try {
    bc = new BroadcastChannel(CH);
    bc.onmessage = () => { cache = read(); emit(); };
  } catch { /* Safari เก่า — ใช้ storage event แทน */ }
  addEventListener('storage', (e) => { if (e.key === KEY) { cache = read(); emit(); } });
}

/** อ่านล่าสุด → แก้ → เขียน → แจ้งทุกแท็บ */
function commit(fn: (s: VoteState) => Result): Result {
  boot();
  const s = read();
  const r = fn(s);
  if (!r.ok) return r;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    return fail('พื้นที่เก็บในเครื่องเต็ม (รูปเยอะเกินไป) — ลองใช้รูปเล็กลง หรือรีเซ็ตข้อมูล');
  }
  cache = s;
  bc?.postMessage(1);
  emit();
  return r;
}

const active = (s: VoteState) => s.events.find((e) => e.id === s.activeEventId) ?? s.events[0];
const isHost = (s: VoteState) => !!s.users.find((u) => u.id === me)?.isHost;
function hostOnly(fn: (s: VoteState, e: VoteEvent) => Result) {
  return commit((s) => (isHost(s) ? fn(s, active(s)) : fail('เฉพาะ host เท่านั้น')));
}

// ---------- React hook ----------
const subscribe = (l: () => void) => { boot(); listeners.add(l); return () => listeners.delete(l); };
const snap = () => { boot(); return cache; };
const serverSnap = () => null;
const meSnap = () => { boot(); return me; };

export function useVote() {
  const state = useSyncExternalStore(subscribe, snap, serverSnap);
  const meId = useSyncExternalStore(subscribe, meSnap, serverSnap);
  const event = state ? active(state) : null;
  const user = state?.users.find((u) => u.id === meId) ?? null;
  return { state, event, user, ready: !!state };
}

// ---------- Actions ----------
export const voteApi = {
  signIn(id: string) {
    boot(); me = id;
    try { sessionStorage.setItem(ME, id); } catch { /* ignore */ }
    emit();
  },
  signOut() {
    boot(); me = null;
    try { sessionStorage.removeItem(ME); } catch { /* ignore */ }
    emit();
  },

  // ----- ผู้ใช้ทั่วไป -----
  register(input: { name: string; team: string; title: string; photo: string | null }): Result {
    return commit((s) => {
      const e = active(s);
      if (!me) return fail('กรุณาเข้าสู่ระบบก่อน');
      if (e.status !== 'registration') return fail('ปิดรับสมัครแล้ว');
      if (e.contestants.some((c) => c.slackId === me)) return fail('คุณสมัครไว้แล้ว');
      if (!input.name.trim() || !input.title.trim()) return fail('กรอกชื่อและชื่อชุดก่อนนะ');
      e.contestants.push({
        id: uid('c_'), name: input.name.trim().slice(0, 60), team: input.team.trim().slice(0, 60), title: input.title.trim().slice(0, 80),
        photo: input.photo, emoji: '✨', hue: Math.floor(Math.random() * 360), status: 'pending', slackId: me, createdAt: Date.now(),
      });
      return ok('ส่งใบสมัครแล้ว รอ host อนุมัติ');
    });
  },
  withdraw(): Result {
    return commit((s) => {
      const e = active(s);
      const c = e.contestants.find((x) => x.slackId === me && x.status === 'pending');
      if (!c) return fail('ไม่มีใบสมัครที่รออนุมัติ');
      e.contestants = e.contestants.filter((x) => x !== c);
      return ok('ถอนใบสมัครแล้ว');
    });
  },
  vote(contestantId: string): Result {
    return commit((s) => {
      const e = active(s);
      if (!me) return fail('กรุณาเข้าสู่ระบบก่อน');
      const r = castVote(s, e, me, contestantId, Date.now());
      if (!r.ok) return fail(VOTE_ERROR_TH[r.error]);
      e.votes.push(r.vote);
      return ok('รับคะแนนแล้ว ขอบคุณที่ร่วมโหวต!');
    });
  },

  // ----- Host: สถานะงาน -----
  setDuration: (min: number) => hostOnly((_, e) => {
    if (!Number.isFinite(min) || min < 1 || min > 120) return fail('ตั้งเวลาได้ 1–120 นาที');
    e.durationMin = Math.round(min); return ok();
  }),
  openVoting: () => hostOnly((_, e) => {
    if (e.status !== 'registration') return fail('เปิดโหวตได้จากสถานะ "เปิดรับสมัคร" เท่านั้น');
    if (!approved(e).length) return fail('ต้องมีผู้ประกวดที่อนุมัติแล้วอย่างน้อย 1 คน');
    e.status = 'voting'; e.endsAt = Date.now() + e.durationMin * 60_000; return ok('เปิดโหวตแล้ว');
  }),
  addMinute: () => hostOnly((_, e) => {
    if (e.status !== 'voting' || !e.endsAt) return fail('ยังไม่ได้เปิดโหวต');
    e.endsAt += 60_000; return ok('เพิ่ม 1 นาที');
  }),
  closeVoting: () => hostOnly((_, e) => {
    if (e.status !== 'voting') return fail('ไม่ได้อยู่ในช่วงโหวต');
    e.status = 'closed'; e.endsAt = null; e.revealStep = 0; return ok('ปิดโหวตแล้ว');
  }),
  /** เรียกได้ทุกเครื่องที่เปิดหน้า host/จอเวทีอยู่ — ปิดเองเมื่อหมดเวลา (idempotent) */
  autoCloseIfExpired: () => commit((s) => {
    const e = active(s);
    if (e.status !== 'voting' || isOpen(e, Date.now())) return fail('noop');
    e.status = 'closed'; e.endsAt = null; e.revealStep = 0; return ok('หมดเวลา ปิดโหวตอัตโนมัติ');
  }),
  reopen: () => hostOnly((_, e) => {
    if (e.status !== 'closed') return fail('เปิดต่อได้หลังปิดโหวตเท่านั้น');
    e.status = 'voting'; e.endsAt = Date.now() + 120_000; e.revealStep = 0; return ok('เปิดโหวตต่ออีก 2 นาที');
  }),
  revealNext: () => hostOnly((_, e) => {
    if (e.status !== 'closed' && e.status !== 'revealed') return fail('ต้องปิดโหวตก่อน');
    const n = approved(e).length;
    if (e.revealStep >= n) return fail('เปิดครบแล้ว');
    e.revealStep += 1; if (e.revealStep >= n) e.status = 'revealed'; return ok();
  }),
  revealPrev: () => hostOnly((_, e) => {
    if (e.revealStep <= 0) return fail('ยังไม่ได้เปิดอันดับไหน');
    e.revealStep -= 1; e.status = 'closed'; return ok();
  }),
  resetReveal: () => hostOnly((_, e) => {
    if (e.status !== 'closed' && e.status !== 'revealed') return fail('ยังไม่ได้ปิดโหวต');
    e.status = 'closed'; e.revealStep = 0; return ok('รีเซ็ตการประกาศผลแล้ว');
  }),
  resetRound: () => hostOnly((_, e) => {
    e.votes = []; e.status = 'registration'; e.endsAt = null; e.revealStep = 0; return ok('ล้างคะแนนรอบนี้แล้ว (เก็บผู้ประกวดไว้)');
  }),
  resetAll: () => hostOnly((_, e) => {
    e.votes = []; e.contestants = []; e.status = 'registration'; e.endsAt = null; e.revealStep = 0; return ok('ล้างทั้งหมดแล้ว');
  }),
  /** demo only: สุ่มโหวตแทนคนที่ยังไม่โหวต */
  simulate: () => hostOnly((s, e) => {
    if (!isOpen(e, Date.now())) return fail('ต้องเปิดโหวตก่อน');
    const cs = approved(e);
    const bias = cs.map(() => 0.5 + Math.random() * 2);
    let n = 0;
    for (const u of s.users) {
      if (u.id === me || Math.random() < 0.15) continue;
      let x = Math.random() * bias.reduce((a, b) => a + b, 0), pick = cs[cs.length - 1];
      for (let i = 0; i < cs.length; i++) { x -= bias[i]; if (x <= 0) { pick = cs[i]; break; } }
      const r = castVote(s, e, u.id, pick.id, Date.now());
      if (r.ok) { e.votes.push(r.vote); n++; }
    }
    return ok(`จำลองโหวต ${n} คน`);
  }),

  // ----- Host: ผู้ประกวด -----
  approve: (id: string) => hostOnly((_, e) => {
    const c = e.contestants.find((x) => x.id === id);
    if (!c) return fail('ไม่พบใบสมัคร');
    if (e.status !== 'registration') return fail('รายชื่อล็อกแล้วหลังเปิดโหวต');
    c.status = 'approved'; return ok(`อนุมัติ ${c.name} แล้ว`);
  }),
  removeContestant: (id: string) => hostOnly((_, e) => {
    if (e.status !== 'registration') return fail('รายชื่อล็อกแล้วหลังเปิดโหวต');
    e.contestants = e.contestants.filter((x) => x.id !== id); return ok('ลบแล้ว');
  }),
  addContestant: (input: Pick<Contestant, 'name' | 'team' | 'title' | 'photo' | 'slackId'>) => hostOnly((_, e) => {
    if (e.status !== 'registration') return fail('รายชื่อล็อกแล้วหลังเปิดโหวต');
    if (!input.name.trim() || !input.title.trim()) return fail('กรอกชื่อและชื่อชุดก่อน');
    if (input.slackId && e.contestants.some((c) => c.slackId === input.slackId)) return fail('คนนี้มีชื่อในรายการแล้ว');
    e.contestants.push({ ...input, id: uid('c_'), emoji: '⭐', hue: Math.floor(Math.random() * 360), status: 'approved', createdAt: Date.now() });
    return ok('เพิ่มผู้ประกวดแล้ว');
  }),

  // ----- Host: ผู้ใช้และสิทธิ์ (น้ำหนักคิด ณ ตอนกดโหวต) -----
  toggleManager: (userId: string) => hostOnly((s) => {
    const u = s.users.find((x) => x.id === userId); if (!u) return fail('ไม่พบผู้ใช้');
    u.isManager = !u.isManager; return ok(`${u.name}: ${u.isManager ? 'เมเนเจอร์ (10 คะแนน)' : '1 คะแนน'}`);
  }),
  toggleHost: (userId: string) => hostOnly((s) => {
    const u = s.users.find((x) => x.id === userId); if (!u) return fail('ไม่พบผู้ใช้');
    if (u.isHost && s.users.filter((x) => x.isHost).length <= 1) return fail('ต้องมี host อย่างน้อย 1 คน');
    u.isHost = !u.isHost; return ok(`${u.name}: ${u.isHost ? 'เป็น host' : 'ไม่ใช่ host'}`);
  }),

  // ----- Host: งานทั้งหมด -----
  createEvent: (name: string) => hostOnly((s) => {
    if (!name.trim()) return fail('ตั้งชื่องานก่อน');
    const e: VoteEvent = { id: uid('ev_'), name: name.trim().slice(0, 80), status: 'registration', durationMin: 5, endsAt: null, revealStep: 0, createdAt: Date.now(), contestants: [], votes: [] };
    s.events.unshift(e); s.activeEventId = e.id; return ok('สร้างงานใหม่และตั้งเป็นงานปัจจุบันแล้ว');
  }),
  setActive: (id: string) => hostOnly((s) => {
    if (!s.events.some((e) => e.id === id)) return fail('ไม่พบงาน');
    s.activeEventId = id; return ok('สลับงานแล้ว');
  }),
  deleteEvent: (id: string) => hostOnly((s) => {
    if (s.activeEventId === id) return fail('ลบงานที่ใช้อยู่ไม่ได้ — สลับไปงานอื่นก่อน');
    s.events = s.events.filter((e) => e.id !== id); return ok('ลบงานแล้ว');
  }),

  /** ล้างข้อมูล demo ทั้งหมดกลับเป็นตัวอย่าง (ไม่ต้องเป็น host — ใช้ตอนทดสอบ) */
  factoryReset() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    cache = read(); bc?.postMessage(1); emit();
  },
};

export { weightOf };
