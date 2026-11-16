/** ผลของ action — ใช้ทั้งฝั่ง server และเบราว์เซอร์ */
export type Result = { ok: true; msg?: string } | { ok: false; error: string };
/** ผลจาก server อาจแนบข้อมูลเพิ่ม เช่น memberId ที่เพิ่งสร้าง */
export type Out = Result & { data?: Record<string, string> };
export const ok = (msg?: string, data?: Record<string, string>): Out => ({ ok: true, msg, ...(data ? { data } : {}) });
export const fail = (error: string): Out => ({ ok: false, error });
