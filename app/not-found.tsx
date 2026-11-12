import Link from 'next/link';
import { MASCOT } from '@/lib/site';
export default function NotFound() {
  return (
    <main className="container py-5 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MASCOT('sad')} alt="" width={720} height={720} style={{ width: 'clamp(160px, 35vw, 260px)', height: 'auto' }} />
      <h1 className="display-pop mt-3" style={{ fontSize: 'clamp(3rem, 12vw, 6rem)' }}>GAME OVER</h1>
      <p className="text-cream fs-5 fw-semibold">หน้านี้หลงทาง กลับไปเลือกเกมกัน</p>
      <Link href="/" className="btn btn-pop btn-lg mt-3">▶ CONTINUE?</Link>
    </main>
  );
}
