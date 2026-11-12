import Link from 'next/link';
import { site, zones } from '@/lib/site';

const steps = [
  { icon: 'bi-qr-code-scan', title: 'สแกน QR', text: 'เปิดบนมือถือได้ทันที ไม่ต้องลงแอป' },
  { icon: 'bi-hand-index-thumb', title: 'เลือกเกม', text: 'แตะซองที่อยากเล่น — วงล้อ กาชาปอง หรือโหวต' },
  { icon: 'bi-stars', title: 'ลุ้นบนจอใหญ่', text: 'ผลขึ้นจอเวทีพร้อมกันทุกเครื่อง โปร่งใส ตรวจได้' },
];

export default function Home() {
  return (
    <main>
      {/* ---------- HERO ---------- */}
      <section className="hero-zone overflow-hidden">
        <span className="hero-floaty" style={{ top: '12%', left: '6%' }} aria-hidden>🌶️</span>
        <span className="hero-floaty" style={{ top: '18%', right: '8%', animationDelay: '-1s' }} aria-hidden>🔥</span>
        <span className="hero-floaty d-none d-md-block" style={{ bottom: '10%', left: '14%', animationDelay: '-2s' }} aria-hidden>⭐</span>

        <div className="container text-center position-relative">
          <span className="pixel-badge mb-4"><span className="blink">▶</span> PRESS START</span>
          <h1 className="display-pop mb-3" style={{ fontSize: 'clamp(2.8rem, 11vw, 7rem)' }}>
            OUTING<br />CHALLENGE
          </h1>
          <div className="d-inline-flex flex-wrap gap-2 justify-content-center mb-3">
            <span className="chip-pop" style={{ background: 'var(--jalapeno)', color: '#fff' }}>3 เกม</span>
            <span className="chip-pop">{site.nameTh}</span>
          </div>
          <p className="fs-5 fw-semibold text-cream mx-auto" style={{ maxWidth: 560 }}>{site.tagline}</p>
        </div>
      </section>

      {/* ---------- เลือกเกม: snack packs ---------- */}
      <section className="container pb-5" aria-labelledby="pick">
        <h2 id="pick" className="visually-hidden">เลือกเกม</h2>
        <div className="row g-4 g-lg-5 justify-content-center">
          {zones.map((z, i) => (
            <div key={z.key} className="col-12 col-md-6 col-xl-5">
              <div className="h-100 d-flex flex-column">
                <Link href={z.href} className={`snack-pack ${z.packClass}`} style={{ rotate: i % 2 ? '1deg' : '-1deg' }}>
                  <span className="pack-tag chip-pop">{z.tag}</span>
                  <div className="pack-body">
                    <div className="pack-emoji mb-3">{z.emoji}</div>
                    <div className="pack-title">{z.title}</div>
                    <p className="mb-0 fw-semibold">{z.subtitle}</p>
                  </div>
                  <div className="pack-foot">
                    <span>เข้าเล่น</span>
                    <i className="bi bi-arrow-right-circle-fill fs-3" />
                  </div>
                </Link>
                {/* ลิงก์ตรงเข้าแต่ละหน้า (คนคุมเวทีใช้บ่อย) */}
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {z.links.map((l) => (
                    <Link key={l.href} href={l.href} className="chip-pop text-decoration-none text-reset">
                      <i className={`bi ${l.icon}`} />{l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="bg-ink py-5">
        <div className="container">
          <div className="row g-4 text-center text-cream">
            {steps.map((s, i) => (
              <div key={s.title} className="col-12 col-md-4">
                <div className="pixel text-warning small mb-2">STEP {i + 1}</div>
                <i className={`bi ${s.icon} display-5`} style={{ color: 'var(--mustard)' }} />
                <h3 className="h4 mt-2">{s.title}</h3>
                <p className="mb-0 opacity-75">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="container py-4 text-center text-cream small fw-semibold">
        TDFB · Outing Challenge · ทำด้วย 🌶️
      </footer>
    </main>
  );
}
