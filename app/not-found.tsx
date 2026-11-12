import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="container py-5 text-center">
      <h1 className="display-pop" style={{ fontSize: 'clamp(3rem, 12vw, 6rem)' }}>GAME OVER</h1>
      <p className="text-cream fs-5 fw-semibold">ไม่พบหน้านี้</p>
      <Link href="/" className="btn btn-pop btn-lg mt-3">▶ CONTINUE?</Link>
    </main>
  );
}
