/**
 * ตู้กาชาปองจับฉลากของขวัญระหว่างพนักงาน — flow จากที่คุยกับป๊อป (PRODUCT.md D10, 2026-11-18)
 *   หยิบการ์ด Lucky Number หน้าห้อง → สแกน QR → ค้นหาชื่อตัวเองจากรายชื่อพนักงาน → กรอกเลขการ์ด → ยืนยัน → รอสุ่ม
 *   ผล: "จับได้ชื่อใคร ได้ของขวัญของคนนั้น"
 * Firestore ภายหลัง: gachaRoster/{id} · gachaRooms/{roomId} (+ members เป็น subcollection ถ้าคนเยอะ)
 */
export type GachaStatus = 'open' | 'locked' | 'drawn';

/** รายชื่อพนักงานที่ทีมงานเตรียมไว้ในหลังบ้าน */
export type Person = { id: string; full: string; nick: string; team: string };

export type Member = {
  id: string;
  personId: string | null; // ผูกกับรายชื่อพนักงาน (null = host พิมพ์ชื่อเอง)
  nick: string;
  full: string;
  team: string;
  lucky: number; // เลขบนการ์ดที่หยิบหน้าห้อง (ไม่ซ้ำในห้อง)
  by: 'self' | 'host'; // host = ผู้จัดเพิ่มแทน (เช่น คนที่ฝากของขวัญมาแต่ไม่อยู่)
  at: number;
};

export type Room = {
  id: string; // รหัสห้องที่โชว์ เช่น ROOM-4821
  hostPin: string; // demo เท่านั้น — ของจริงใช้ Slack host
  status: GachaStatus;
  members: Member[];
  /** [ผู้ให้, ผู้รับ] เป็นป้ายชื่อ "เลข ชื่อ" — ผู้รับ "จับได้ชื่อ" ผู้ให้ แล้วได้ของขวัญของคนนั้น */
  pairs: [string, string][] | null;
  revealAt: number | null; // ทุกเครื่องเริ่มแอนิเมชันพร้อมกัน ณ เวลานี้
  sheet: 'none' | 'sent' | 'local' | 'failed';
  createdAt: number;
};

export type GachaState = { v: 2; roster: Person[]; room: Room | null; history: { id: string; at: number; count: number }[] };
