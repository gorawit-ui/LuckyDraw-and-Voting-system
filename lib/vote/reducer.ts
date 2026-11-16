/**
 * กติกา Fashion Vote — รันที่ server เท่านั้น (app/api/store/[name])
 * demo: "ผู้ใช้" = เลือกชื่อจากรายชื่อตัวอย่าง แล้วส่ง id มากับทุกคำขอ (ของจริงใช้ Slack login ใน Phase 4)
 */
import { fail, ok, type Out } from '@/lib/shared/result';
import { approved, castVote, isOpen, VOTE_ERROR_TH } from './logic';
import { seedState, uid } from './seed';
import type { Contestant, VoteEvent, VoteState } from './types';

export type VoteCtx = { now: number; me?: string | null };
type Action = (s: VoteState, args: unknown[], ctx: VoteCtx) => Out;

export const voteSeed = seedState;

const active = (s: VoteState) => s.events.find((e) => e.id === s.activeEventId) ?? s.events[0];
const str = (x: unknown, max = 200) => (typeof x === 'string' ? x : '').slice(0, max);
const photoOf = (x: unknown) => (typeof x === 'string' && x.startsWith('data:image/') && x.length < 400_000 ? x : null);
const hostOnly = (fn: (s: VoteState, e: VoteEvent, args: unknown[], ctx: VoteCtx) => Out): Action => (s, args, ctx) =>
  s.users.find((u) => u.id === ctx.me)?.isHost ? fn(s, active(s), args, ctx) : fail('เฉพาะ host เท่านั้น');
const closeRound = (e: VoteEvent) => { e.status = 'closed'; e.endsAt = null; e.revealStep = 0; };

export const voteActions: Record<string, Action> = {
  // ----- ผู้ใช้ทั่วไป -----
  register(s, [input], ctx) {
    const e = active(s);
    const i = (input ?? {}) as Record<string, unknown>;
    const me = ctx.me;
    if (!me || !s.users.some((u) => u.id === me)) return fail('กรุณาเข้าสู่ระบบก่อน');
    if (e.status !== 'registration') return fail('ปิดรับสมัครแล้ว');
    if (e.contestants.some((c) => c.slackId === me)) return fail('คุณสมัครไว้แล้ว');
    const name = str(i.name).trim().slice(0, 60), title = str(i.title).trim().slice(0, 80);
    if (!name || !title) return fail('กรอกชื่อและชื่อชุดก่อนนะ');
    e.contestants.push({
      id: uid('c_'), name, team: str(i.team).trim().slice(0, 60), title,
      photo: photoOf(i.photo), emoji: '✨', hue: Math.floor(Math.random() * 360), status: 'pending', slackId: me, createdAt: ctx.now,
    });
    return ok('ส่งใบสมัครแล้ว รอ host อนุมัติ');
  },
  withdraw(s, _a, ctx) {
    const e = active(s);
    const c = e.contestants.find((x) => x.slackId === ctx.me && x.status === 'pending');
    if (!c) return fail('ไม่มีใบสมัครที่รออนุมัติ');
    e.contestants = e.contestants.filter((x) => x !== c);
    return ok('ถอนใบสมัครแล้ว');
  },
  vote(s, [cid], ctx) {
    const e = active(s);
    if (!ctx.me) return fail('กรุณาเข้าสู่ระบบก่อน');
    const r = castVote(s, e, ctx.me, str(cid), ctx.now);
    if (!r.ok) return fail(VOTE_ERROR_TH[r.error]);
    e.votes.push(r.vote);
    return ok('รับคะแนนแล้ว ขอบคุณที่ร่วมโหวต!');
  },
  /** เรียกได้ทุกเครื่องที่เปิดหน้า host/จอเวทีอยู่ — ปิดเองเมื่อหมดเวลา (idempotent) */
  autoCloseIfExpired(s, _a, ctx) {
    const e = active(s);
    if (e.status !== 'voting' || isOpen(e, ctx.now)) return fail('noop');
    closeRound(e); return ok('หมดเวลา ปิดโหวตอัตโนมัติ');
  },

  // ----- Host: สถานะงาน -----
  setDuration: hostOnly((_s, e, [min]) => {
    const m = Number(min);
    if (!Number.isFinite(m) || m < 1 || m > 120) return fail('ตั้งเวลาได้ 1–120 นาที');
    e.durationMin = Math.round(m); return ok();
  }),
  openVoting: hostOnly((_s, e, [min], ctx) => {
    if (e.status !== 'registration') return fail('เปิดโหวตได้จากสถานะ "เปิดรับสมัคร" เท่านั้น');
    if (!approved(e).length) return fail('ต้องมีผู้ประกวดที่อนุมัติแล้วอย่างน้อย 1 คน');
    const m = Number(min);
    if (Number.isFinite(m) && m >= 1 && m <= 120) e.durationMin = Math.round(m);
    e.status = 'voting'; e.endsAt = ctx.now + e.durationMin * 60_000; return ok('เปิดโหวตแล้ว');
  }),
  addMinute: hostOnly((_s, e) => {
    if (e.status !== 'voting' || !e.endsAt) return fail('ยังไม่ได้เปิดโหวต');
    e.endsAt += 60_000; return ok('เพิ่ม 1 นาที');
  }),
  closeVoting: hostOnly((_s, e) => {
    if (e.status !== 'voting') return fail('ไม่ได้อยู่ในช่วงโหวต');
    closeRound(e); return ok('ปิดโหวตแล้ว');
  }),
  reopen: hostOnly((_s, e, _a, ctx) => {
    if (e.status !== 'closed') return fail('เปิดต่อได้หลังปิดโหวตเท่านั้น');
    e.status = 'voting'; e.endsAt = ctx.now + 120_000; e.revealStep = 0; return ok('เปิดโหวตต่ออีก 2 นาที');
  }),
  revealNext: hostOnly((_s, e) => {
    if (e.status !== 'closed' && e.status !== 'revealed') return fail('ต้องปิดโหวตก่อน');
    const n = approved(e).length;
    if (e.revealStep >= n) return fail('เปิดครบแล้ว');
    e.revealStep += 1; if (e.revealStep >= n) e.status = 'revealed'; return ok();
  }),
  revealPrev: hostOnly((_s, e) => {
    if (e.revealStep <= 0) return fail('ยังไม่ได้เปิดอันดับไหน');
    e.revealStep -= 1; e.status = 'closed'; return ok();
  }),
  resetReveal: hostOnly((_s, e) => {
    if (e.status !== 'closed' && e.status !== 'revealed') return fail('ยังไม่ได้ปิดโหวต');
    e.status = 'closed'; e.revealStep = 0; return ok('รีเซ็ตการประกาศผลแล้ว');
  }),
  resetRound: hostOnly((_s, e) => {
    e.votes = []; e.status = 'registration'; e.endsAt = null; e.revealStep = 0; return ok('ล้างคะแนนรอบนี้แล้ว (เก็บผู้ประกวดไว้)');
  }),
  resetAll: hostOnly((_s, e) => {
    e.votes = []; e.contestants = []; e.status = 'registration'; e.endsAt = null; e.revealStep = 0; return ok('ล้างทั้งหมดแล้ว');
  }),
  /** demo only: สุ่มโหวตแทนคนที่ยังไม่โหวต */
  simulate: hostOnly((s, e, _a, ctx) => {
    if (!isOpen(e, ctx.now)) return fail('ต้องเปิดโหวตก่อน');
    const cs = approved(e);
    const bias = cs.map(() => 0.5 + Math.random() * 2);
    let n = 0;
    for (const u of s.users) {
      if (u.id === ctx.me || Math.random() < 0.15) continue;
      let x = Math.random() * bias.reduce((a, b) => a + b, 0), pick = cs[cs.length - 1];
      for (let i = 0; i < cs.length; i++) { x -= bias[i]; if (x <= 0) { pick = cs[i]; break; } }
      const r = castVote(s, e, u.id, pick.id, ctx.now);
      if (r.ok) { e.votes.push(r.vote); n++; }
    }
    return ok(`จำลองโหวต ${n} คน`);
  }),

  // ----- Host: ผู้ประกวด -----
  approve: hostOnly((_s, e, [id]) => {
    const c = e.contestants.find((x) => x.id === id);
    if (!c) return fail('ไม่พบใบสมัคร');
    if (e.status !== 'registration') return fail('รายชื่อล็อกแล้วหลังเปิดโหวต');
    c.status = 'approved'; return ok(`อนุมัติ ${c.name} แล้ว`);
  }),
  removeContestant: hostOnly((_s, e, [id]) => {
    if (e.status !== 'registration') return fail('รายชื่อล็อกแล้วหลังเปิดโหวต');
    e.contestants = e.contestants.filter((x) => x.id !== id); return ok('ลบแล้ว');
  }),
  addContestant: hostOnly((_s, e, [input], ctx) => {
    const i = (input ?? {}) as Record<string, unknown>;
    if (e.status !== 'registration') return fail('รายชื่อล็อกแล้วหลังเปิดโหวต');
    const name = str(i.name).trim().slice(0, 60), title = str(i.title).trim().slice(0, 80);
    if (!name || !title) return fail('กรอกชื่อและชื่อชุดก่อน');
    const slackId = str(i.slackId, 40) || null;
    if (slackId && e.contestants.some((c) => c.slackId === slackId)) return fail('คนนี้มีชื่อในรายการแล้ว');
    const c: Contestant = { id: uid('c_'), name, team: str(i.team).trim().slice(0, 60), title, photo: photoOf(i.photo), slackId,
      emoji: '⭐', hue: Math.floor(Math.random() * 360), status: 'approved', createdAt: ctx.now };
    e.contestants.push(c);
    return ok('เพิ่มผู้ประกวดแล้ว');
  }),

  // ----- Host: ผู้ใช้และสิทธิ์ (น้ำหนักคิด ณ ตอนกดโหวต) -----
  toggleManager: hostOnly((s, _e, [userId]) => {
    const u = s.users.find((x) => x.id === userId); if (!u) return fail('ไม่พบผู้ใช้');
    u.isManager = !u.isManager; return ok(`${u.name}: ${u.isManager ? 'เมเนเจอร์ (10 คะแนน)' : '1 คะแนน'}`);
  }),
  toggleHost: hostOnly((s, _e, [userId]) => {
    const u = s.users.find((x) => x.id === userId); if (!u) return fail('ไม่พบผู้ใช้');
    if (u.isHost && s.users.filter((x) => x.isHost).length <= 1) return fail('ต้องมี host อย่างน้อย 1 คน');
    u.isHost = !u.isHost; return ok(`${u.name}: ${u.isHost ? 'เป็น host' : 'ไม่ใช่ host'}`);
  }),

  // ----- Host: งานทั้งหมด -----
  createEvent: hostOnly((s, _e, [name], ctx) => {
    const n = str(name).trim().slice(0, 80);
    if (!n) return fail('ตั้งชื่องานก่อน');
    const e: VoteEvent = { id: uid('ev_'), name: n, status: 'registration', durationMin: 5, endsAt: null, revealStep: 0, createdAt: ctx.now, contestants: [], votes: [] };
    s.events.unshift(e); s.activeEventId = e.id; return ok('สร้างงานใหม่และตั้งเป็นงานปัจจุบันแล้ว');
  }),
  setActive: hostOnly((s, _e, [id]) => {
    if (!s.events.some((e) => e.id === id)) return fail('ไม่พบงาน');
    s.activeEventId = id as string; return ok('สลับงานแล้ว');
  }),
  deleteEvent: hostOnly((s, _e, [id]) => {
    if (s.activeEventId === id) return fail('ลบงานที่ใช้อยู่ไม่ได้ — สลับไปงานอื่นก่อน');
    s.events = s.events.filter((e) => e.id !== id); return ok('ลบงานแล้ว');
  }),
};
