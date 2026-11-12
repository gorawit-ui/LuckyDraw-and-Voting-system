import ComingSoon from '@/components/ComingSoon';
export const metadata = { title: 'Fashion Vote' };
export default function Page() {
  return (
    <ComingSoon emoji="👑" title="Fashion Walk Vote" phase="PHASE 2"
      description="Login ด้วย Slack แล้วโหวตชุดที่ชอบ — เมเนเจอร์ 10 คะแนน คนอื่น 1 คะแนน"
      prototype="/prototypes/costume-vote.html"
      checklist={['หน้าโหวตมือถือ + บัตรลงคะแนน', 'ฟอร์มสมัครประกวด + อัปโหลดรูป', 'API โหวตแบบ transaction']} />
  );
}
