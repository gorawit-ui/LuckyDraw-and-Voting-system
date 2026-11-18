/** กฎของตู้กาชาปอง — ฟังก์ชันล้วน ใช้ทั้ง server, หน้าเว็บ และหน้าตรวจผล */
import type { Member, Person, Room } from './types';

export const MIN_MEMBERS = 3;
/** การ์ด Lucky Number ที่แจกหน้าห้อง: เลข 1–100 */
export const LUCKY_MIN = 1;
export const LUCKY_MAX = 100;
/** ค่าคงที่ที่ใส่ในสูตรสุ่ม — ความสุ่มมาจากการ์ดที่แต่ละคนหยิบเอง (ใครได้เลขไหน) */
export const DRAW_SEED = 'lucky-number-v1';

/** เทียบชื่อแบบไม่สนตัวพิมพ์/ช่องว่างซ้ำ */
export const nameKey = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('th');
export const cleanName = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 60);

/** ชื่อที่โชว์: ชื่อเล่น (ทีม) — ถ้าไม่มีชื่อเล่นใช้ชื่อ-สกุล */
export const displayName = (p: { nick: string; full: string; team: string }) => {
  const n = p.nick || p.full;
  return p.team ? `${n} (${p.team})` : n;
};
/** ป้ายที่ใช้สุ่มและตรวจผล: "เลข ชื่อ" เช่น "8 เบนซ์ (GM)" — เลขไม่ซ้ำ ป้ายจึงไม่ซ้ำ */
export const labelOf = (m: Member) => `${m.lucky} ${displayName(m)}`;
export const parseLabel = (label: string) => {
  const m = /^(\d+)\s+(.*)$/.exec(label);
  return m ? { lucky: Number(m[1]), name: m[2] } : { lucky: null, name: label };
};

export const isLucky = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= LUCKY_MIN && (n as number) <= LUCKY_MAX;
export const luckyTaken = (room: Room, n: number) => room.members.some((m) => m.lucky === n);
export const personTaken = (room: Room, personId: string) => room.members.some((m) => m.personId === personId);
export const nameTaken = (room: Room, nick: string, team: string) =>
  room.members.some((m) => nameKey(displayName(m)) === nameKey(displayName({ nick, full: '', team })));

/** ค้นหาจากชื่อ-สกุล ชื่อเล่น หรือทีม */
export function searchRoster(roster: Person[], q: string, exclude: Set<string>, limit = 8) {
  const k = nameKey(q);
  if (!k) return [];
  return roster.filter((p) => !exclude.has(p.id) && [p.full, p.nick, p.team, `${p.nick} ${p.team}`].some((x) => nameKey(x).includes(k))).slice(0, limit);
}

/** แปลงรายชื่อที่วางจาก Excel/Google Sheet: ชื่อ-สกุล | ชื่อเล่น | ทีม (คั่นด้วย Tab หรือ ,) */
export function parseRoster(text: string): Omit<Person, 'id'>[] {
  const out: Omit<Person, 'id'>[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split(/\t|,|\|/).map((c) => cleanName(c));
    if (!cols.some(Boolean)) continue;
    const [full = '', nick = '', team = ''] = cols;
    if (/^(ชื่อ|name|full)/i.test(full) && /(เล่น|nick)/i.test(nick)) continue; // แถวหัวตาราง
    const key = nameKey(`${full}|${nick}|${team}`);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ full, nick, team });
  }
  return out.slice(0, 1000);
}

/** เวลาแอนิเมชันที่ทุกเครื่องเล่นพร้อมกัน (ตู้สั่น 1.5 → แคปซูลตก 1 → โยก 1.4 → แตก) */
export const ANIM = { shake: 1500, drop: 1000, wobble: 1400, crack: 600 };
export const ANIM_TOTAL = ANIM.shake + ANIM.drop + ANIM.wobble + ANIM.crack;
/** เผื่อเวลาให้ทุกเครื่องได้รับสถานะก่อนเริ่ม (ถาม server ทุก ~1 วิ) */
export const REVEAL_DELAY = 2500;

export type AnimPhase = 'waiting' | 'shake' | 'drop' | 'wobble' | 'crack' | 'done';
export function animPhase(revealAt: number | null, now: number): AnimPhase {
  if (revealAt == null) return 'waiting';
  const t = now - revealAt;
  if (t < 0) return 'waiting';
  if (t < ANIM.shake) return 'shake';
  if (t < ANIM.shake + ANIM.drop) return 'drop';
  if (t < ANIM.shake + ANIM.drop + ANIM.wobble) return 'wobble';
  if (t < ANIM_TOTAL) return 'crack';
  return 'done';
}

/** คนที่ฉัน "จับได้ชื่อ" = ฉันได้ของขวัญของคนนี้ */
export function giftFrom(room: Room, me: Member): Member | null {
  const g = room.pairs?.find((p) => p[1] === labelOf(me))?.[0];
  return g ? room.members.find((m) => labelOf(m) === g) ?? null : null;
}
/** ตารางผล เรียงตามเลขของตัวเอง: [ฉัน, ได้ของขวัญจาก] */
export function resultRows(room: Room): [Member, Member][] {
  const rows: [Member, Member][] = [];
  for (const m of [...room.members].sort((a, b) => a.lucky - b.lucky)) {
    const g = giftFrom(room, m);
    if (g) rows.push([m, g]);
  }
  return rows;
}

/** ลิงก์สั้นสำหรับ QR บนจอเวที — หน้าตรวจผลดึงรายชื่อจากห้อง */
export const verifyRoomUrl = (origin: string, roomId: string) => `${origin}/lucky/verify?room=${encodeURIComponent(roomId)}`;
/** ลิงก์แบบมีข้อมูลครบในตัว (ใช้ได้แม้ไม่มีห้องในระบบแล้ว) — สำหรับแชร์ใน Slack/อีเมล */
export const verifyUrl = (origin: string, labels: string[]) => `${origin}/lucky/verify?${new URLSearchParams({ n: labels.join('\n') }).toString()}`;
