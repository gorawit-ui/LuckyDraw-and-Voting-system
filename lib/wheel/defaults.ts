// ข้อมูลตัวอย่าง (ไม่ใช่ข้อมูลจริง — ใช้ได้กับ demo บน Vercel)
export const DEFAULT_NAMES = ['เบนซ์ (GM)', 'พี่ทิม (CEO)', 'ป๊อป (Marketing)', 'ใบเตย (Sales)', 'กร (R&D)', 'มายด์ (Acc)', 'โอ๊ต (Production)', 'ฟ้า (HR)', 'เจ (Logistics)', 'นุ่น (QA)', 'ตั้ม (IT)', 'แพร (Design)'];
export const DEFAULT_GIFTS = ['หม้อทอดไร้น้ำมัน', 'บัตรสตาร์บัคส์ 1,000฿', 'เซ็ตมัทฉะพรีเมียม', 'ลำโพงบลูทูธ', 'ร่มพับอัตโนมัติ', 'กระติกเก็บความเย็น', 'เงินสด 2,000฿', 'หูฟังไร้สาย', 'เก้าอี้นวดมินิ', 'ชุดเครื่องนอน', 'บัตรเติมน้ำมัน 500฿', 'ตุ๊กตาหมีใหญ่'];

/** สุ่มเลข 0..n-1 ด้วย crypto (ไม่ใช้ Math.random ในการเลือกผล) */
export function randInt(n: number) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(2 ** 32 / n) * n; // ตัด modulo bias
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % n;
}
