/** กฎของตู้กาชาปอง — ฟังก์ชันล้วน ใช้ซ้ำใน API จริงได้ */
import type { Room } from './types';

export const MIN_MEMBERS = 3;
export const MIN_DICE = 2;

/** เทียบชื่อซ้ำแบบไม่สนตัวพิมพ์/ช่องว่างซ้ำ (SPEC §4) */
export const nameKey = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('th');
export const cleanName = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 40);

export const isDuplicate = (room: Room, name: string) => room.members.some((m) => nameKey(m.name) === nameKey(name));

/** เลขที่ใช้สุ่ม = แต้มลูกเต๋าต่อกัน เช่น [3,5,2] → "3-5-2" (ต้องเหมือนกันทั้ง server และหน้าตรวจผล) */
export const diceSeed = (dice: number[]) => dice.join('-');

/** เวลาแอนิเมชันที่ทุกเครื่องเล่นพร้อมกัน (SPEC: ตู้สั่น 1.5 → แคปซูลตก 1 → โยก 1.4 → แตก) */
export const ANIM = { shake: 1500, drop: 1000, wobble: 1400, crack: 600 };
export const ANIM_TOTAL = ANIM.shake + ANIM.drop + ANIM.wobble + ANIM.crack;
/** เผื่อเวลาให้ทุกเครื่องได้รับสถานะก่อนเริ่ม (Firestore ~0.5–1 วิ) */
export const REVEAL_DELAY = 1500;

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

export const receiverOf = (room: Room, name: string) => room.pairs?.find((p) => p[0] === name)?.[1] ?? null;

/** ลิงก์สั้นสำหรับ QR บนจอเวที (QR ยาวสแกนจากโปรเจกเตอร์ยาก) — หน้าตรวจผลดึงรายชื่อ+แต้มจากห้อง */
export const verifyRoomUrl = (origin: string, roomId: string) => `${origin}/lucky/verify?room=${encodeURIComponent(roomId)}`;

/** ลิงก์แบบมีข้อมูลครบในตัว (ใช้ได้แม้ไม่มีห้องในระบบแล้ว) — สำหรับแชร์ใน Slack/อีเมล */
export function verifyUrl(origin: string, names: string[], dice: number[]) {
  const q = new URLSearchParams({ d: diceSeed(dice), n: names.join('\n') });
  return `${origin}/lucky/verify?${q.toString()}`;
}

export const roomCode = () => `ROOM-${String(Math.floor(1000 + Math.random() * 9000))}`;
export const pin = () => String(Math.floor(1000 + Math.random() * 9000));
