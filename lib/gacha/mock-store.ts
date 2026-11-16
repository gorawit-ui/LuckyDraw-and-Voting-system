'use client';
/**
 * ตู้กาชาปอง ฝั่งเบราว์เซอร์ — state อยู่ที่ server (/api/store/gacha) ทุกเครื่องเห็นห้องเดียวกัน
 * กติกาอยู่ที่ lib/gacha/reducer.ts (รันที่ server) · host ใน demo ยืนยันตัวด้วย PIN ของห้อง
 */
import { createSessionValue } from '@/lib/mock/create-store';
import { createRemoteStore } from '@/lib/shared/remote-store';
import { ok, type Out, type Result } from '@/lib/shared/result';
import type { GachaState } from './types';

export const meSession = createSessionValue<{ roomId: string; memberId: string }>('oc_gacha_me');
export const hostSession = createSessionValue<{ roomId: string; pin: string }>('oc_gacha_host');
const store = createRemoteStore<GachaState>('gacha', { ctx: () => ({ host: hostSession.get() }) });

export function useGacha() {
  const state = store.useStore();
  const conn = store.useConn();
  const me = meSession.use();
  const host = hostSession.use();
  const room = state?.room ?? null;
  const member = room && me && me.roomId === room.id ? room.members.find((m) => m.id === me.memberId) ?? null : null;
  // PIN ได้มาจาก server หลังตรวจแล้วเท่านั้น (server ไม่ส่ง PIN ให้เครื่องอื่น)
  const isHost = !!room && !!host && host.roomId === room.id;
  return { ready: !!state, room, member, isHost, hostPin: isHost ? host!.pin : null, conn,
    removed: !!(room && me && me.roomId === room.id && !member) };
}

const call = (action: string, ...args: unknown[]) => store.call(action, ...args);
const withHost = async (p: Promise<Out>): Promise<Result> => {
  const r = await p;
  if (r.ok && r.data?.roomId && r.data.pin) hostSession.set({ roomId: r.data.roomId, pin: r.data.pin });
  if (!r.ok && /เฉพาะ host/.test(r.error)) hostSession.set(null); // PIN เก่า/ห้องเปลี่ยน → ให้ใส่ PIN ใหม่
  return r;
};

export const gachaApi = {
  // ---------- host ----------
  createRoom: () => withHost(call('createRoom')),
  claimHost: (pin: string) => withHost(call('claimHost', pin)),
  hostAdd: (name: string) => withHost(call('hostAdd', name)),
  hostRemove: (id: string) => withHost(call('hostRemove', id)),
  demoFill: () => withHost(call('demoFill')),
  lock: () => withHost(call('lock')),
  unlock: () => withHost(call('unlock')),
  setDice: (dice: number[]) => withHost(call('setDice', dice)),
  draw: () => withHost(call('draw')),
  /** ส่งผลทั้งชุดเข้าชีทครั้งเดียว (Phase 4 ย้ายไปทำที่ server ตอนสุ่ม) */
  async sendSheet(): Promise<Result> {
    const room = store.peek()?.room;
    if (!room?.pairs) return ok();
    let state: 'sent' | 'local' | 'failed' = 'failed';
    try {
      const r = await fetch('/api/sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gacha', room: room.id, pairs: room.pairs.map(([from, to]) => ({ from, to })) }) });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      state = j?.ok ? 'sent' : j?.error === 'not-configured' ? 'local' : 'failed';
    } catch { state = 'failed'; }
    await call('setSheet', state);
    return state === 'failed' ? { ok: false, error: 'ส่งเข้าชีทไม่สำเร็จ — กดส่งซ้ำได้' } : ok(state === 'sent' ? 'ส่งผลเข้าชีทแล้ว' : 'ยังไม่ได้ตั้งค่าชีท (เก็บผลในเครื่อง/CSV)');
  },

  // ---------- พนักงาน ----------
  async join(name: string): Promise<Result> {
    const r = await call('join', name);
    if (r.ok && r.data?.memberId) meSession.set({ roomId: r.data.roomId, memberId: r.data.memberId });
    return r;
  },
  forgetMe() { meSession.set(null); },
  /** demo: ล้างทั้งหมด */
  async factoryReset() { meSession.set(null); hostSession.set(null); return call('factoryReset'); },
};
