import ComingSoon from '@/components/ComingSoon';
import { MASCOT } from '@/lib/site';
export const metadata = { title: 'ตู้กาชาปอง' };
export default function Page() {
  return (
    <ComingSoon mascot={MASCOT('gacha')} title="ตู้กาชาปองจับคู่แลกของ" phase="PHASE 3"
      description="รอเข้าห้อง อีกนิดได้ลุ้น — ทุกคนสแกนเข้าห้อง โฮสต์ล็อกห้องต่อหน้าทุกคน แล้วสุ่มด้วยเลขลูกเต๋าจริง"
      prototype="/prototypes/lucky-wheel-gacha.html"
      checklist={['ห้อง real-time บน Firestore', 'สุ่มแบบตรวจสอบได้ (lib/fair-draw.ts)', 'จอเวที + หน้าตรวจผลด้วยตัวเอง']} />
  );
}
