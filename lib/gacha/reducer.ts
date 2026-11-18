/**
 * กติกาตู้กาชาปอง — รันที่ server เท่านั้น (app/api/store/[name]) · ห้องเดียว ณ เวลาหนึ่ง
 * flow (PRODUCT.md D10): หยิบการ์ด Lucky Number → สแกน QR → เลือกชื่อจากรายชื่อพนักงาน → กรอกเลข → ยืนยัน → host สุ่ม
 * host ใน demo ยืนยันตัวด้วย PIN 4 หลักของห้อง (ของจริงใช้ Slack host)
 * สุ่มด้วย lib/fair-draw.ts ครั้งเดียว จากป้าย "เลข ชื่อ" ของทุกคน — หน้าตรวจผลคำนวณซ้ำได้ผลเดียวกัน
 */
import { drawCircle } from '@/lib/fair-draw';
import { fail, ok, type Out } from '@/lib/shared/result';
import {
  cleanName, displayName, DRAW_SEED, isLucky, labelOf, LUCKY_MAX, LUCKY_MIN, luckyTaken, MIN_MEMBERS, nameTaken, parseRoster, personTaken, REVEAL_DELAY,
} from './logic';
import { SAMPLE_ROSTER } from './sample-roster';
import type { GachaState, Member, Room } from './types';

export type GachaCtx = { now: number; host?: { roomId: string; pin: string } | null };
type Action = (s: GachaState, args: unknown[], ctx: GachaCtx) => Out | Promise<Out>;

const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
const uid = (p = 'm_') => p + rnd(36 ** 6).toString(36).padStart(6, '0');
const code4 = () => String(1000 + rnd(9000));
const sampleRoster = () => SAMPLE_ROSTER.map(([full, nick, team], i) => ({ id: `p_${String(i + 1).padStart(3, '0')}`, full, nick, team }));

export const gachaSeed = (): GachaState => ({ v: 2, roster: sampleRoster(), room: null, history: [] });

const isHostOf = (room: Room | null, ctx: GachaCtx) => !!room && !!ctx.host && ctx.host.roomId === room.id && ctx.host.pin === room.hostPin;
const hostOnly = (fn: (room: Room, s: GachaState, args: unknown[], ctx: GachaCtx) => Out | Promise<Out>): Action => (s, args, ctx) =>
  !s.room ? fail('ยังไม่มีห้อง') : isHostOf(s.room, ctx) ? fn(s.room, s, args, ctx) : fail('เฉพาะ host ของห้องนี้ — ใส่ PIN ของห้องก่อน');
const str = (x: unknown) => (typeof x === 'string' ? x : '');
const luckyError = (room: Room, n: unknown) =>
  !isLucky(n) ? `Lucky Number ต้องเป็นเลข ${LUCKY_MIN}–${LUCKY_MAX}`
    : luckyTaken(room, n) ? `เลข ${n} มีคนใช้แล้ว — เช็กเลขบนการ์ดอีกครั้ง ถ้าถูกแล้วแจ้ง host` : null;

/** สร้างสมาชิกจาก (personId จากรายชื่อ) หรือ (ชื่อที่พิมพ์เอง เมื่อยังไม่มีรายชื่อ/host เพิ่มแทน) */
function makeMember(s: GachaState, room: Room, personId: unknown, typed: unknown, lucky: unknown, by: Member['by'], now: number): Member | string {
  const le = luckyError(room, lucky);
  if (le) return le;
  const pid = str(personId);
  if (pid) {
    const p = s.roster.find((x) => x.id === pid);
    if (!p) return 'ไม่พบชื่อนี้ในรายชื่อ ลองค้นหาใหม่';
    if (personTaken(room, p.id)) return `${displayName(p)} เข้าห้องไปแล้ว — ถ้าไม่ใช่คุณ แจ้ง host`;
    return { id: uid(), personId: p.id, nick: p.nick, full: p.full, team: p.team, lucky: lucky as number, by, at: now };
  }
  if (by === 'self' && s.roster.length) return 'เลือกชื่อจากรายการค้นหา — ไม่เจอชื่อแจ้ง host ที่โต๊ะ';
  const nick = cleanName(str(typed));
  if (!nick) return 'ใส่ชื่อก่อน';
  if (nameTaken(room, nick, '')) return `มี "${nick}" ในห้องแล้ว — ใส่ทีมต่อท้าย เช่น ${nick} (Sales)`;
  return { id: uid(), personId: null, nick, full: '', team: '', lucky: lucky as number, by, at: now };
}

export const gachaActions: Record<string, Action> = {
  // ---------- host ----------
  createRoom(s, _a, ctx) {
    if (s.room && s.room.status !== 'drawn' && s.room.members.length && !isHostOf(s.room, ctx))
      return fail('มีห้องที่ยังเล่นไม่จบอยู่ — ใช้ PIN ของห้องนั้นเข้าเป็น host ก่อน');
    if (s.room) s.history.unshift({ id: s.room.id, at: s.room.createdAt, count: s.room.members.length });
    s.history = s.history.slice(0, 20);
    let id = `ROOM-${code4()}`;
    while (id === s.room?.id) id = `ROOM-${code4()}`;
    s.room = { id, hostPin: code4(), status: 'open', members: [], pairs: null, revealAt: null, sheet: 'none', createdAt: ctx.now };
    return ok('เปิดห้องใหม่แล้ว', { roomId: id, pin: s.room.hostPin });
  },
  claimHost(s, [p]) {
    if (!s.room) return fail('ยังไม่มีห้อง');
    if (str(p).trim() !== s.room.hostPin) return fail('PIN ไม่ถูกต้อง — ดู PIN บนหน้า host ของเครื่องที่เปิดห้อง');
    return ok('เข้าเป็น host แล้ว', { roomId: s.room.id, pin: s.room.hostPin });
  },
  /** หลังบ้าน: วางรายชื่อพนักงาน (แทนที่ทั้งชุด) — คนที่อยู่ในห้องแล้วไม่หาย */
  setRoster: hostOnly((_room, s, [text]) => {
    const list = parseRoster(str(text));
    if (!list.length) return fail('ไม่พบรายชื่อ — วางจาก Excel/Sheet 3 คอลัมน์: ชื่อ-สกุล, ชื่อเล่น, ทีม');
    s.roster = list.map((p) => ({ ...p, id: uid('p_') }));
    return ok(`บันทึกรายชื่อพนักงาน ${list.length} คนแล้ว`);
  }),
  useSampleRoster: hostOnly((_room, s) => { s.roster = sampleRoster(); return ok(`ใช้รายชื่อตัวอย่าง ${s.roster.length} คน`); }),
  clearRoster: hostOnly((_room, s) => { s.roster = []; return ok('ล้างรายชื่อแล้ว — ผู้เล่นจะพิมพ์ชื่อเอง'); }),

  /** ผู้จัดเพิ่มแทน (คนที่ฝากของขวัญมาแต่ไม่อยู่ / ไม่ถนัดมือถือ / ไม่มีชื่อในรายชื่อ) */
  hostAdd: hostOnly((room, s, [personId, typed, lucky], ctx) => {
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว — ปลดล็อกก่อนถ้าจะเพิ่มชื่อ');
    const m = makeMember(s, room, personId, typed, lucky, 'host', ctx.now);
    if (typeof m === 'string') return fail(m);
    room.members.push(m);
    return ok(`เพิ่ม (${m.lucky}) ${displayName(m)} แล้ว`);
  }),
  hostRemove: hostOnly((room, _s, [id]) => {
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว');
    room.members = room.members.filter((m) => m.id !== id);
    return ok('นำชื่อออกแล้ว');
  }),
  /** demo: เติมคนจากรายชื่อพร้อมเลขสุ่มที่ยังว่าง */
  demoFill: hostOnly((room, s, _a, ctx) => {
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว');
    const pool = s.roster.filter((p) => !room.members.some((m) => m.personId === p.id)).slice(0, 12);
    let n = 0;
    for (const p of pool) {
      const free = Array.from({ length: LUCKY_MAX }, (_, i) => i + 1).filter((x) => !luckyTaken(room, x));
      if (!free.length) break;
      room.members.push({ id: uid(), personId: p.id, nick: p.nick, full: p.full, team: p.team, lucky: free[rnd(free.length)], by: 'host', at: ctx.now });
      n++;
    }
    return n ? ok(`เติมรายชื่อตัวอย่าง ${n} คน`) : fail('ไม่มีรายชื่อเหลือให้เติม');
  }),
  lock: hostOnly((room) => {
    if (room.status !== 'open') return fail('ห้องล็อกอยู่แล้ว');
    if (room.members.length < MIN_MEMBERS) return fail(`ต้องมีอย่างน้อย ${MIN_MEMBERS} คน`);
    room.status = 'locked'; return ok('ล็อกห้องแล้ว — ไม่มีใครเข้าเพิ่มได้');
  }),
  unlock: hostOnly((room) => {
    if (room.status !== 'locked') return fail('ปลดล็อกได้เฉพาะก่อนสุ่ม');
    room.status = 'open'; return ok('ปลดล็อกห้องแล้ว');
  }),
  /** สุ่มครั้งเดียว: คำนวณจากป้าย "เลข ชื่อ" ของทุกคนที่ล็อกไว้ แล้วตั้งเวลาเปิดผลพร้อมกันทุกเครื่อง */
  draw: hostOnly(async (room, _s, _a, ctx) => {
    if (room.status !== 'locked') return fail(room.status === 'drawn' ? 'สุ่มไปแล้ว — กติกาคือสุ่มครั้งเดียว' : 'ล็อกห้องก่อน');
    room.pairs = await drawCircle(room.members.map(labelOf), DRAW_SEED);
    room.status = 'drawn'; room.revealAt = ctx.now + REVEAL_DELAY;
    return ok('สุ่มแล้ว! ทุกเครื่องกำลังเปิดแคปซูลพร้อมกัน');
  }),
  setSheet: hostOnly((room, _s, [state]) => {
    if (!['sent', 'local', 'failed'].includes(str(state))) return fail('bad');
    room.sheet = state as Room['sheet']; return ok();
  }),

  // ---------- พนักงาน ----------
  join(s, [personId, typed, lucky], ctx) {
    const room = s.room;
    if (!room) return fail('ยังไม่เปิดห้อง รอ host สักครู่');
    if (room.status !== 'open') return fail('ห้องล็อกแล้ว — ติดต่อ host ที่โต๊ะลงชื่อ');
    const m = makeMember(s, room, personId, typed, lucky, 'self', ctx.now);
    if (typeof m === 'string') return fail(m);
    room.members.push(m);
    return ok('เข้าห้องแล้ว รอลุ้นได้เลย', { roomId: room.id, memberId: m.id });
  },
};

/** สิ่งที่ทุกเครื่องเห็น — ไม่ส่ง PIN ออกไป */
export const gachaView = (s: GachaState): GachaState => (s.room ? { ...s, room: { ...s.room, hostPin: '' } } : s);
