'use client';
/**
 * Mock backend ตู้กาชาปอง (ก่อนขึ้น Google Cloud) — ห้องเดียว ณ เวลาหนึ่ง
 * ทุก action ตรวจกฎแบบเดียวกับที่ API จริงต้องทำ · สุ่มด้วย lib/fair-draw.ts ครั้งเดียว
 * host ใน mock ยืนยันตัวด้วย PIN 4 หลักของห้อง (ของจริงใช้ Slack host)
 */
import { drawCircle } from '@/lib/fair-draw';
import { createMockStore, createSessionValue, fail, ok, type Result } from '@/lib/mock/create-store';
import { cleanName, diceSeed, isDuplicate, MIN_DICE, MIN_MEMBERS, pin, REVEAL_DELAY, roomCode } from './logic';
import type { GachaState, Room } from './types';

const store = createMockStore<GachaState>('oc_gacha_state_v1', 'oc_gacha', () => ({ v: 1, room: null, history: [] }));
export const meSession = createSessionValue<{ roomId: string; memberId: string }>('oc_gacha_me');
export const hostSession = createSessionValue<{ roomId: string; pin: string }>('oc_gacha_host');

const uid = () => 'm_' + Math.random().toString(36).slice(2, 9);
const isHostOf = (room: Room | null) => {
  const h = hostSession.get();
  return !!room && !!h && h.roomId === room.id && h.pin === room.hostPin;
};
function hostOnly(fn: (room: Room, s: GachaState) => Result): Result {
  return store.commit((s) => (!s.room ? fail('ยังไม่มีห้อง') : isHostOf(s.room) ? fn(s.room, s) : fail('เฉพาะ host ของห้องนี้')));
}

export function useGacha() {
  const state = store.useStore();
  const me = meSession.use();
  const host = hostSession.use();
  const room = state?.room ?? null;
  const member = room && me && me.roomId === room.id ? room.members.find((m) => m.id === me.memberId) ?? null : null;
  const isHost = !!room && !!host && host.roomId === room.id && host.pin === room.hostPin;
  return { ready: !!state, room, member, isHost, removed: !!(room && me && me.roomId === room.id && !member) };
}

const SAMPLE = ['เบนซ์ (GM)', 'ป๊อป (Marketing)', 'ใบเตย (Sales)', 'กร (R&D)', 'มายด์ (Acc)', 'โอ๊ต (Production)', 'ฟ้า (HR)', 'เจ (Logistics)', 'นุ่น (QA)', 'ตั้ม (IT)', 'แพร (Design)', 'พี่ทิม (CEO)'];

export const gachaApi = {
  // ---------- host ----------
  createRoom(): Result {
    const r = store.commit((s) => {
      if (s.room && s.room.status !== 'drawn' && s.room.members.length && !isHostOf(s.room)) return fail('มีห้องที่ยังเล่นไม่จบอยู่ — ใช้ PIN ของห้องนั้นเข้าเป็น host ก่อน');
      if (s.room) s.history.unshift({ id: s.room.id, at: s.room.createdAt, count: s.room.members.length, dice: s.room.dice });
      s.room = { id: roomCode(), hostPin: pin(), status: 'open', members: [], dice: [], pairs: null, revealAt: null, sheet: 'none', createdAt: Date.now() };
      return ok('เปิดห้องใหม่แล้ว');
    });
    const room = store.peek()?.room;
    if (r.ok && room) hostSession.set({ roomId: room.id, pin: room.hostPin });
    return r;
  },
  claimHost(p: string): Result {
    const room = store.peek()?.room;
    if (!room) return fail('ยังไม่มีห้อง');
    if (p.trim() !== room.hostPin) return fail('PIN ไม่ถูกต้อง');
    hostSession.set({ roomId: room.id, pin: room.hostPin });
    return ok('เข้าเป็น host แล้ว');
  },
  hostAdd: (raw: string) => hostOnly((room) => {
    const name = cleanName(raw);
    if (!name) return fail('ใส่ชื่อก่อน');
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว — ปลดล็อกก่อนถ้าจะเพิ่มชื่อ');
    if (isDuplicate(room, name)) return fail(`มี "${name}" ในห้องแล้ว — ใส่ทีมต่อท้าย เช่น ${name} (Sales)`);
    room.members.push({ id: uid(), name, by: 'host', at: Date.now() });
    return ok(`เพิ่ม ${name} แล้ว`);
  }),
  hostRemove: (id: string) => hostOnly((room) => {
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว');
    room.members = room.members.filter((m) => m.id !== id);
    return ok('นำชื่อออกแล้ว');
  }),
  demoFill: () => hostOnly((room) => {
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว');
    let n = 0;
    for (const name of SAMPLE) if (!isDuplicate(room, name)) { room.members.push({ id: uid(), name, by: 'host', at: Date.now() }); n++; }
    return ok(`เติมรายชื่อตัวอย่าง ${n} คน`);
  }),
  lock: () => hostOnly((room) => {
    if (room.status !== 'open') return fail('ห้องล็อกอยู่แล้ว');
    if (room.members.length < MIN_MEMBERS) return fail(`ต้องมีอย่างน้อย ${MIN_MEMBERS} คน`);
    room.status = 'locked'; return ok('ล็อกห้องแล้ว — ไม่มีใครเข้าเพิ่มได้');
  }),
  unlock: () => hostOnly((room) => {
    if (room.status !== 'locked') return fail('ปลดล็อกได้เฉพาะก่อนสุ่ม');
    room.status = 'open'; room.dice = []; return ok('ปลดล็อกห้องแล้ว');
  }),
  setDice: (dice: number[]) => hostOnly((room) => {
    if (room.status !== 'locked') return fail('ล็อกห้องก่อนแล้วค่อยกรอกเลขลูกเต๋า');
    if (!dice.every((d) => Number.isInteger(d) && d >= 1 && d <= 6)) return fail('แต้มลูกเต๋าต้องเป็น 1–6');
    room.dice = dice.slice(0, 12); return ok();
  }),
  /** สุ่มครั้งเดียว: คำนวณจาก (รายชื่อที่ล็อก + แต้มลูกเต๋า) แล้วตั้งเวลาเปิดผลพร้อมกันทุกเครื่อง */
  async draw(): Promise<Result> {
    const s = store.peek();
    const room = s?.room;
    if (!room || !isHostOf(room)) return fail('เฉพาะ host ของห้องนี้');
    if (room.status !== 'locked') return fail(room.status === 'drawn' ? 'สุ่มไปแล้ว — กติกาคือสุ่มครั้งเดียว' : 'ล็อกห้องก่อน');
    if (room.dice.length < MIN_DICE) return fail(`กรอกแต้มลูกเต๋าอย่างน้อย ${MIN_DICE} ลูก`);
    const names = room.members.map((m) => m.name);
    const pairs = await drawCircle(names, diceSeed(room.dice));
    return hostOnly((r) => {
      // กันกดซ้ำ/สถานะเปลี่ยนระหว่างคำนวณ
      if (r.status !== 'locked' || r.members.length !== names.length || diceSeed(r.dice) !== diceSeed(room.dice)) return fail('ข้อมูลห้องเปลี่ยนระหว่างสุ่ม ลองใหม่');
      r.pairs = pairs; r.status = 'drawn'; r.revealAt = Date.now() + REVEAL_DELAY;
      return ok('สุ่มแล้ว! ทุกเครื่องกำลังเปิดแคปซูลพร้อมกัน');
    });
  },
  /** ส่งผลทั้งชุดเข้าชีทครั้งเดียว (ของจริงทำที่ server ตอนสุ่ม) */
  async sendSheet(): Promise<Result> {
    const room = store.peek()?.room;
    if (!room?.pairs || !isHostOf(room)) return fail('ยังไม่มีผล');
    let state: Room['sheet'] = 'failed';
    try {
      const r = await fetch('/api/sheet', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gacha', room: room.id, pairs: room.pairs.map(([from, to]) => ({ from, to })) }) });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      state = j?.ok ? 'sent' : j?.error === 'not-configured' ? 'local' : 'failed';
    } catch { state = 'failed'; }
    hostOnly((r) => { r.sheet = state; return ok(); });
    return state === 'failed' ? fail('ส่งเข้าชีทไม่สำเร็จ — กดส่งซ้ำได้') : ok(state === 'sent' ? 'ส่งผลเข้าชีทแล้ว' : 'ยังไม่ได้ตั้งค่าชีท (เก็บผลในเครื่อง/CSV)');
  },

  // ---------- พนักงาน ----------
  join(raw: string): Result {
    const name = cleanName(raw);
    let memberId = '';
    const r = store.commit((s) => {
      const room = s.room;
      if (!room) return fail('ยังไม่เปิดห้อง รอ host สักครู่');
      if (!name) return fail('ใส่ชื่อก่อนนะ');
      if (room.status !== 'open') return fail('ห้องล็อกแล้ว — ติดต่อ host ที่โต๊ะลงชื่อ');
      if (isDuplicate(room, name)) return fail(`ชื่อ "${name}" มีในห้องแล้ว — ใส่ทีมต่อท้าย เช่น ${name} (Sales)`);
      memberId = uid();
      room.members.push({ id: memberId, name, by: 'self', at: Date.now() });
      return ok('เข้าห้องแล้ว');
    });
    const room = store.peek()?.room;
    if (r.ok && room) meSession.set({ roomId: room.id, memberId });
    return r;
  },
  forgetMe() { meSession.set(null); },
  /** demo: ล้างทั้งหมด */
  factoryReset() { store.reset(); meSession.set(null); hostSession.set(null); },
};
