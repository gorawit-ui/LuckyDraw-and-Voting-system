'use client';
/**
 * Fashion Vote ฝั่งเบราว์เซอร์ — state อยู่ที่ server (/api/store/vote) ทุกเครื่องเห็นงานเดียวกัน
 * กติกาและสิทธิ์อยู่ที่ lib/vote/reducer.ts (รันที่ server)
 * demo: "login" = เลือกชื่อจากรายชื่อตัวอย่าง (จำไว้ในเครื่อง) · Phase 4 ใช้ Slack
 */
import { createSessionValue } from '@/lib/mock/create-store';
import { createRemoteStore } from '@/lib/shared/remote-store';
import type { Result } from '@/lib/shared/result';
import { weightOf } from './logic';
import type { Contestant, VoteState } from './types';

export type { Result };
const meSession = createSessionValue<string>('oc_vote_me');
const store = createRemoteStore<VoteState>('vote', { ctx: () => ({ me: meSession.get() }) });

export function useVote() {
  const state = store.useStore();
  const meId = meSession.use();
  const conn = store.useConn();
  const event = state ? state.events.find((e) => e.id === state.activeEventId) ?? state.events[0] : null;
  const user = state?.users.find((u) => u.id === meId) ?? null;
  return { state, event, user, ready: !!state, conn };
}

const call = (action: string, ...args: unknown[]): Promise<Result> => store.call(action, ...args);
let closing: Promise<Result> | null = null;

export const voteApi = {
  signIn: (id: string) => meSession.set(id),
  signOut: () => meSession.set(null),

  register: (input: { name: string; team: string; title: string; photo: string | null }) => call('register', input),
  withdraw: () => call('withdraw'),
  vote: (contestantId: string) => call('vote', contestantId),
  /** ทุกเครื่องที่เปิดหน้า host/จอเวทีเรียกได้ — กันยิงซ้ำระหว่างรอคำตอบ */
  autoCloseIfExpired: () => (closing ??= call('autoCloseIfExpired').finally(() => { closing = null; })),

  setDuration: (min: number) => call('setDuration', min),
  openVoting: (min?: number) => call('openVoting', min),
  addMinute: () => call('addMinute'),
  closeVoting: () => call('closeVoting'),
  reopen: () => call('reopen'),
  revealNext: () => call('revealNext'),
  revealPrev: () => call('revealPrev'),
  resetReveal: () => call('resetReveal'),
  resetRound: () => call('resetRound'),
  resetAll: () => call('resetAll'),
  simulate: () => call('simulate'),

  approve: (id: string) => call('approve', id),
  removeContestant: (id: string) => call('removeContestant', id),
  addContestant: (input: Pick<Contestant, 'name' | 'team' | 'title' | 'photo' | 'slackId'>) => call('addContestant', input),
  toggleManager: (userId: string) => call('toggleManager', userId),
  toggleHost: (userId: string) => call('toggleHost', userId),

  createEvent: (name: string) => call('createEvent', name),
  setActive: (id: string) => call('setActive', id),
  deleteEvent: (id: string) => call('deleteEvent', id),

  /** ล้างข้อมูล demo ทั้งหมดกลับเป็นตัวอย่าง */
  factoryReset: () => call('factoryReset'),
};

export { weightOf };
