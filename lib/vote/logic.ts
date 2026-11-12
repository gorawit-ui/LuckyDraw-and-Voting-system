/**
 * กฎของระบบโหวต — ฟังก์ชันล้วน (pure) ใช้ทั้ง mock และ API บน server ในอนาคต
 * กฎ (SPEC §1, §3 "กฎความปลอดภัย"):
 *  1) เปิดโหวตอยู่และยังไม่หมดเวลา  2) ยังไม่เคยโหวต  3) ไม่ใช่ผู้ประกวดที่อนุมัติแล้ว
 *  4) น้ำหนัก 10 (เมเนเจอร์) / 1 คิดจากข้อมูลบน server ไม่เชื่อค่าจากหน้าเว็บ
 */
import type { Contestant, User, Vote, VoteEvent, VoteState } from './types';

export const weightOf = (u: Pick<User, 'isManager'>): 10 | 1 => (u.isManager ? 10 : 1);

export const approved = (e: VoteEvent) => e.contestants.filter((c) => c.status === 'approved');
export const pending = (e: VoteEvent) => e.contestants.filter((c) => c.status === 'pending');

export const isContestant = (e: VoteEvent, userId: string) =>
  e.contestants.some((c) => c.status === 'approved' && c.slackId === userId);

export const myVote = (e: VoteEvent, userId: string) => e.votes.find((v) => v.voterId === userId) ?? null;

export const myApplication = (e: VoteEvent, userId: string) => e.contestants.find((c) => c.slackId === userId) ?? null;

/** ผู้มีสิทธิ์โหวต = ทุกคน ยกเว้นผู้ประกวดที่อนุมัติแล้ว */
export const eligibleVoters = (s: VoteState, e: VoteEvent) => s.users.filter((u) => !isContestant(e, u.id));

export const isOpen = (e: VoteEvent, now: number) => e.status === 'voting' && (e.endsAt == null || now < e.endsAt);

export type VoteError = 'not-open' | 'already-voted' | 'is-contestant' | 'no-contestant' | 'no-user';
export const VOTE_ERROR_TH: Record<VoteError, string> = {
  'not-open': 'ตอนนี้ยังไม่เปิดโหวต หรือหมดเวลาแล้ว',
  'already-voted': 'คุณลงคะแนนไปแล้ว',
  'is-contestant': 'ผู้ประกวดลงคะแนนไม่ได้',
  'no-contestant': 'ไม่พบผู้ประกวดคนนี้',
  'no-user': 'ไม่พบบัญชีผู้ใช้',
};

/** ตรวจและสร้างโหวต (เทียบเท่า transaction บน server) */
export function castVote(s: VoteState, e: VoteEvent, voterId: string, contestantId: string, now: number):
  { ok: true; vote: Vote } | { ok: false; error: VoteError } {
  const u = s.users.find((x) => x.id === voterId);
  if (!u) return { ok: false, error: 'no-user' };
  if (!isOpen(e, now)) return { ok: false, error: 'not-open' };
  if (myVote(e, voterId)) return { ok: false, error: 'already-voted' };
  if (isContestant(e, voterId)) return { ok: false, error: 'is-contestant' };
  if (!approved(e).some((c) => c.id === contestantId)) return { ok: false, error: 'no-contestant' };
  return { ok: true, vote: { voterId, contestantId, weight: weightOf(u), at: now } };
}

export type Row = { c: Contestant; points: number; votes: number; rank: number };

/** อันดับ: คะแนน → จำนวนโหวต → ชื่อ (tiebreak ตาม SPEC) */
export function tally(e: VoteEvent): Row[] {
  const rows = approved(e).map((c) => {
    const vs = e.votes.filter((v) => v.contestantId === c.id);
    return { c, points: vs.reduce((a, v) => a + v.weight, 0), votes: vs.length, rank: 0 };
  });
  rows.sort((a, b) => b.points - a.points || b.votes - a.votes || a.c.name.localeCompare(b.c.name, 'th'));
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

export function stats(s: VoteState, e: VoteEvent) {
  const managerIds = new Set(s.users.filter((u) => u.isManager).map((u) => u.id));
  return {
    contestants: approved(e).length,
    voted: e.votes.length,
    eligible: eligibleVoters(s, e).length,
    managersVoted: e.votes.filter((v) => managerIds.has(v.voterId)).length,
    managers: managerIds.size,
    points: e.votes.reduce((a, v) => a + v.weight, 0),
  };
}

const csvCell = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
export function buildCsv(s: VoteState, e: VoteEvent) {
  const name = (id: string) => s.users.find((u) => u.id === id)?.name ?? id;
  const cname = (id: string) => e.contestants.find((c) => c.id === id)?.name ?? id;
  const log = [['เวลา', 'ผู้โหวต', 'โหวตให้', 'น้ำหนัก'],
    ...e.votes.slice().sort((a, b) => a.at - b.at).map((v) => [new Date(v.at).toLocaleString('th-TH'), name(v.voterId), cname(v.contestantId), v.weight])];
  const rank = [['อันดับ', 'ผู้ประกวด', 'ทีม', 'ชุด', 'คะแนน', 'จำนวนโหวต'],
    ...tally(e).map((r) => [r.rank, r.c.name, r.c.team, r.c.title, r.points, r.votes])];
  return [`งาน: ${e.name}`, '', 'ตารางอันดับ', ...rank.map((r) => r.map(csvCell).join(',')), '', 'บันทึกการโหวต', ...log.map((r) => r.map(csvCell).join(','))].join('\n');
}

export const fmtCountdown = (ms: number) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};
