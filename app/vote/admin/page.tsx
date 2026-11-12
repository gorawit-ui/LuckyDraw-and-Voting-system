import ComingSoon from '@/components/ComingSoon';
export const metadata = { title: 'หลังบ้าน Host' };
export default function Page() {
  return (
    <ComingSoon emoji="🎛️" title="หลังบ้าน Host" phase="PHASE 2"
      description="คุมสถานะงาน อนุมัติผู้ประกวด ดูคะแนนสด และ export CSV"
      prototype="/prototypes/costume-vote.html"
      checklist={['4 แท็บ: ภาพรวม / ผู้ประกวด / สิทธิ์ / งานทั้งหมด', 'เช็คสิทธิ์ host ทุก API', 'รีเซ็ตรอบ / ล้างทั้งหมด']} />
  );
}
