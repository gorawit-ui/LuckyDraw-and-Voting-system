/**
 * กติกาตู้กาชาปอง — รันที่ server เท่านั้น (app/api/store/[name]) · ห้องเดียว ณ เวลาหนึ่ง
 * host ใน demo ยืนยันตัวด้วย PIN 4 หลักของห้อง (ของจริงใช้ Slack host)
 * สุ่มด้วย lib/fair-draw.ts ครั้งเดียว — หน้าตรวจผลคำนวณซ้ำได้ผลเดียวกัน
 */
import { drawCircle } from '@/lib/fair-draw';
import { fail, ok, type Out } from '@/lib/shared/result';
import { cleanName, diceSeed, isDuplicate, MIN_DICE, MIN_MEMBERS, REVEAL_DELAY } from './logic';
import type { GachaState, Room } from './types';

export type GachaCtx = { now: number; host?: { roomId: string; pin: string } | null };
type Action = (s: GachaState, args: unknown[], ctx: GachaCtx) => Out | Promise<Out>;

export const gachaSeed = (): GachaState => ({ v: 1, room: null, history: [] });

const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
const uid = () => 'm_' + rnd(36 ** 6).toString(36).padStart(6, '0');
const code4 = () => String(1000 + rnd(9000));

const isHostOf = (room: Room | null, ctx: GachaCtx) => !!room && !!ctx.host && ctx.host.roomId === room.id && ctx.host.pin === room.hostPin;
const hostOnly = (fn: (room: Room, s: GachaState, args: unknown[], ctx: GachaCtx) => Out | Promise<Out>): Action => (s, args, ctx) =>
  !s.room ? fail('ยังไม่มีห้อง') : isHostOf(s.room, ctx) ? fn(s.room, s, args, ctx) : fail('เฉพาะ host ของห้องนี้ — ใส่ PIN ของห้องก่อน');
const str = (x: unknown) => (typeof x === 'string' ? x : '');

const SAMPLE = ['เบนซ์ (GM)', 'ป๊อป (Marketing)', 'ใบเตย (Sales)', 'กร (R&D)', 'มายด์ (Acc)', 'โอ๊ต (Production)', 'ฟ้า (HR)', 'เจ (Logistics)', 'นุ่น (QA)', 'ตั้ม (IT)', 'แพร (Design)', 'พี่ทิม (CEO)'];

export const gachaActions: Record<string, Action> = {
  // ---------- host ----------
  createRoom(s, _a, ctx) {
    if (s.room && s.room.status !== 'drawn' && s.room.members.length && !isHostOf(s.room, ctx))
      return fail('มีห้องที่ยังเล่นไม่จบอยู่ — ใช้ PIN ของห้องนั้นเข้าเป็น host ก่อน');
    if (s.room) s.history.unshift({ id: s.room.id, at: s.room.createdAt, count: s.room.members.length, dice: s.room.dice });
    s.history = s.history.slice(0, 20);
    let id = `ROOM-${code4()}`;
    while (id === s.room?.id) id = `ROOM-${code4()}`;
    s.room = { id, hostPin: code4(), status: 'open', members: [], dice: [], pairs: null, revealAt: null, sheet: 'none', createdAt: ctx.now };
    return ok('เปิดห้องใหม่แล้ว', { roomId: id, pin: s.room.hostPin });
  },
  claimHost(s, [p]) {
    if (!s.room) return fail('ยังไม่มีห้อง');
    if (str(p).trim() !== s.room.hostPin) return fail('PIN ไม่ถูกต้อง — ดู PIN บนหน้า host ของเครื่องที่เปิดห้อง');
    return ok('เข้าเป็น host แล้ว', { roomId: s.room.id, pin: s.room.hostPin });
  },
  hostAdd: hostOnly((room, _s, [raw], ctx) => {
    const name = cleanName(str(raw));
    if (!name) return fail('ใส่ชื่อก่อน');
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว — ปลดล็อกก่อนถ้าจะเพิ่มชื่อ');
    if (isDuplicate(room, name)) return fail(`มี "${name}" ในห้องแล้ว — ใส่ทีมต่อท้าย เช่น ${name} (Sales)`);
    room.members.push({ id: uid(), name, by: 'host', at: ctx.now });
    return ok(`เพิ่ม ${name} แล้ว`);
  }),
  hostRemove: hostOnly((room, _s, [id]) => {
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว');
    room.members = room.members.filter((m) => m.id !== id);
    return ok('นำชื่อออกแล้ว');
  }),
  demoFill: hostOnly((room, _s, _a, ctx) => {
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว');
    let n = 0;
    for (const name of SAMPLE) if (!isDuplicate(room, name)) { room.members.push({ id: uid(), name, by: 'host', at: ctx.now }); n++; }
    return ok(`เติมรายชื่อตัวอย่าง ${n} คน`);
  }),
  lock: hostOnly((room) => {
    if (room.status !== 'open') return fail('ห้องล็อกอยู่แล้ว');
    if (room.members.length < MIN_MEMBERS) return fail(`ต้องมีอย่างน้อย ${MIN_MEMBERS} คน`);
    room.status = 'locked'; return ok('ล็อกห้องแล้ว — ไม่มีใครเข้าเพิ่มได้');
  }),
  unlock: hostOnly((room) => {
    if (room.status !== 'locked') return fail('ปลดล็อกได้เฉพาะก่อนสุ่ม');
    room.status = 'open'; room.dice = []; return ok('ปลดล็อกห้องแล้ว');
  }),
  setDice: hostOnly((room, _s, [dice]) => {
    if (room.status !== 'locked') return fail('ล็อกห้องก่อนแล้วค่อยกรอกเลขลูกเต๋า');
    if (!Array.isArray(dice) || !dice.every((d) => Number.isInteger(d) && d >= 1 && d <= 6)) return fail('แต้มลูกเต๋าต้องเป็น 1–6');
    room.dice = (dice as number[]).slice(0, 12); return ok();
  }),
  /** สุ่มครั้งเดียว: คำนวณจาก (รายชื่อที่ล็อก + แต้มลูกเต๋า) แล้วตั้งเวลาเปิดผลพร้อมกันทุกเครื่อง */
  draw: hostOnly(async (room, _s, _a, ctx) => {
    if (room.status !== 'locked') return fail(room.status === 'drawn' ? 'สุ่มไปแล้ว — กติกาคือสุ่มครั้งเดียว' : 'ล็อกห้องก่อน');
    if (room.dice.length < MIN_DICE) return fail(`กรอกแต้มลูกเต๋าอย่างน้อย ${MIN_DICE} ลูก`);
    room.pairs = await drawCircle(room.members.map((m) => m.name), diceSeed(room.dice));
    room.status = 'drawn'; room.revealAt = ctx.now + REVEAL_DELAY;
    return ok('สุ่มแล้ว! ทุกเครื่องกำลังเปิดแคปซูลพร้อมกัน');
  }),
  setSheet: hostOnly((room, _s, [state]) => {
    if (!['sent', 'local', 'failed'].includes(str(state))) return fail('bad');
    room.sheet = state as Room['sheet']; return ok();
  }),

  // ---------- พนักงาน ----------
  join(s, [raw], ctx) {
    const room = s.room;
    const name = cleanName(str(raw));
    if (!room) return fail('ยังไม่เปิดห้อง รอ host สักครู่');
    if (!name) return fail('ใส่ชื่อก่อนนะ');
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว — ติดต่อ host ที่โต๊ะลงชื่อ');
    if (isDuplicate(room, name)) return fail(`ชื่อ "${name}" มีในห้องแล้ว — ใส่ทีมต่อท้าย เช่น ${name} (Sales)`);
    const memberId = uid();
    room.members.push({ id: memberId, name, by: 'self', at: ctx.now });
    return ok('เข้าห้องแล้ว', { roomId: room.id, memberId });
  },
};

/** สิ่งที่ทุกเครื่องเห็น — ไม่ส่ง PIN ออกไป */
export const gachaView = (s: GachaState): GachaState => (s.room ? { ...s, room: { ...s.room, hostPin: '' } } : s);
