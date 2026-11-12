import ComingSoon from '@/components/ComingSoon';
export const metadata = { title: 'จอเวที' };
export default function Page() {
  return (
    <ComingSoon emoji="🎭" title="จอเวที Fashion Vote" phase="PHASE 2"
      description="โชว์จำนวนคนโหวต + เวลาที่เหลือ แล้วเปิดผลทีละอันดับจากท้ายขึ้นมา"
      prototype="/prototypes/costume-vote.html#stage"
      checklist={['นับถอยหลัง + progress bar', 'Reveal ทีละอันดับ (Space / →)', 'QR ให้สแกนเข้าโหวต']} />
  );
}
