import ComingSoon from '@/components/ComingSoon';
export const metadata = { title: 'วงล้อคู่' };
export default function Page() {
  return (
    <ComingSoon emoji="🎡" title="วงล้อคู่" phase="PHASE 1"
      description="ซ้ายชื่อพนักงาน ขวาของรางวัล — กดหยุดเองแบบสดๆ บนจอเวที"
      prototype="/prototypes/lucky-wheel-gacha.html"
      checklist={['พอร์ตวงล้อ Canvas + ตัดคำไทยจากต้นแบบ', 'ธีม Spicy Snack Pack', 'บันทึกผลลง Google Sheet ผ่าน server']} />
  );
}
