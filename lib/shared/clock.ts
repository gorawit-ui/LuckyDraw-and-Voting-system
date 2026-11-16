/**
 * นาฬิกาที่ตรงกับ server — ใช้กับเวลาที่ต้องตรงกันทุกเครื่อง (เปิดแคปซูลพร้อมกัน, นับถอยหลังโหวต)
 * มือถือแต่ละเครื่องตั้งเวลาเพี้ยนได้หลายวินาที เลยเก็บส่วนต่างกับเวลาของ server ไว้ใช้แทน Date.now()
 */
let offset = 0;
let best = Infinity;
/** เรียกทุกครั้งที่ได้คำตอบจาก server: serverNow = เวลา server, sentAt/recvAt = เวลาเครื่องตอนส่ง/รับ */
export function syncClock(serverNow: number, sentAt: number, recvAt: number) {
  const rtt = recvAt - sentAt;
  if (!Number.isFinite(serverNow) || rtt < 0) return;
  // ใช้รอบที่ไป-กลับเร็วที่สุดเป็นหลัก (แม่นสุด) แต่ค่อยๆ ยอมรับค่าใหม่เผื่อเครื่องปรับเวลา
  if (rtt <= best * 1.5 || rtt < 400) {
    best = Math.min(best, rtt);
    offset = serverNow + rtt / 2 - recvAt;
  }
}
export const serverNow = () => Date.now() + offset;
