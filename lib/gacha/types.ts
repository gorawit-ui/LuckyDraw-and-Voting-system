/**
 * ตู้กาชาปองจับคู่แลกของ — แบบเปิดเผย (PRODUCT.md §3.1) · พิมพ์ชื่อเอง
 * Firestore ภายหลัง: gachaRooms/{roomId} (+ members เป็น subcollection ถ้าคนเยอะ)
 */
export type GachaStatus = 'open' | 'locked' | 'drawn';

export type Member = { id: string; name: string; by: 'self' | 'host'; at: number };

export type Room = {
  id: string; // รหัสห้องที่โชว์ เช่น ROOM-4821
  hostPin: string; // mock เท่านั้น — ของจริงใช้ Slack host
  status: GachaStatus;
  members: Member[];
  dice: number[]; // แต้มลูกเต๋าจริงที่ host กรอกตามลำดับ
  pairs: [string, string][] | null; // [ผู้ให้, ผู้รับ] — คำนวณครั้งเดียวตอนสุ่ม
  revealAt: number | null; // ทุกเครื่องเริ่มแอนิเมชันพร้อมกัน ณ เวลานี้
  sheet: 'none' | 'sent' | 'local' | 'failed';
  createdAt: number;
};

export type GachaState = { v: 1; room: Room | null; history: { id: string; at: number; count: number; dice: number[] }[] };
