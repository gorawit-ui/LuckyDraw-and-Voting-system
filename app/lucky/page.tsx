import Link from 'next/link';
import { zones } from '@/lib/site';

export const metadata = { title: 'Lucky Zone' };

export default function LuckyHub() {
  const z = zones.find((x) => x.key === 'lucky')!;
  return (
    <main className="container py-5">
      <h1 className="display-pop text-center mb-5" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}>🎡 LUCKY ZONE</h1>
      <div className="row g-4 justify-content-center">
        {z.links.map((l) => (
          <div key={l.href} className="col-12 col-md-6 col-lg-5">
            <Link href={l.href} className="snack-pack pack-lucky">
              <div className="pack-body">
                <i className={`bi ${l.icon} display-3`} />
                <div className="pack-title mt-2">{l.label}</div>
                <p className="mb-0 fw-semibold">{l.note}</p>
              </div>
              <div className="pack-foot"><span>เริ่มเลย</span><i className="bi bi-play-circle-fill fs-3" /></div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
