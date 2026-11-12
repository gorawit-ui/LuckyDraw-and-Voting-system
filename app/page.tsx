import Link from 'next/link';
import { MASCOT, STICKER, site, zones } from '@/lib/site';

const steps = [
  { icon: 'bi-qr-code-scan', title: 'สแกน QR', text: 'เปิดบนมือถือได้ทันที ไม่ต้องลงแอป' },
  { icon: 'bi-hand-index-thumb', title: 'เลือกเกม', text: 'แตะซองที่อยากเล่น — วงล้อ กาชาปอง หรือโหวต' },
  { icon: 'bi-stars', title: 'ลุ้นบนจอใหญ่', text: 'ผลขึ้นจอเวทีพร้อมกันทุกเครื่อง โปร่งใส ตรวจได้' },
];

const floaties = [
  { src: STICKER('chili'), style: { top: '10%', left: '4%', width: 'clamp(48px, 7vw, 84px)' } },
  { src: STICKER('flame'), style: { top: '8%', right: '6%', width: 'clamp(44px, 6vw, 72px)', animationDelay: '-1s' } },
  { src: STICKER('star'), style: { bottom: '2%', left: '42%', width: 'clamp(40px, 5vw, 64px)', animationDelay: '-2s' }, desktop: true },
  { src: STICKER('dice'), style: { bottom: '14%', right: '4%', width: 'clamp(40px, 5vw, 64px)', animationDelay: '-.5s' }, desktop: true },
];

export default function Home() {
  return (
    <main>
      {/* ---------- HERO ---------- */}
      <section className="hero-zone overflow-hidden">
        {floaties.map((f) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={f.src} src={f.src} alt="" aria-hidden className={`hero-floaty ${f.desktop ? 'd-none d-md-block' : ''}`} style={f.style} />
        ))}
        <div className="container position-relative">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-7 text-center text-lg-start order-2 order-lg-1">
              <span className="pixel-badge mb-3"><span className="blink">▶</span> PRESS START</span>
              <h1 className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo.webp" alt={site.name} className="hero-logo" width={1200} height={520} />
              </h1>
              <div className="d-inline-flex flex-wrap gap-2 justify-content-center mb-3">
                <span className="chip-pop" style={{ background: 'var(--jalapeno)', color: '#fff' }}>3 เกม</span>
                <span className="chip-pop">{site.nameTh}</span>
              </div>
              <p className="fs-5 fw-semibold text-cream mb-0">{site.tagline}</p>
            </div>
            <div className="col-12 col-lg-5 text-center order-1 order-lg-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MASCOT('hero')} alt="น้องจี๊ด มาสคอตของงาน" className="hero-mascot" width={720} height={720} />
            </div>
          </div>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={z.image} alt="" className="pack-art" width={800} height={1000} loading="lazy" />
                  <div className="pack-body pt-3">
                    <div className="pack-title">{z.emoji} {z.title}</div>
                    <p className="mb-0 fw-semibold">{z.subtitle}</p>
                  </div>
                  <div className="pack-foot">
                    <span>เข้าเล่น</span>
                    <i className="bi bi-arrow-right-circle-fill fs-3" />
                  </div>
                </Link>
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
        TDFB · Outing Challenge · ทำด้วย 💚 โดยน้องจี๊ด
      </footer>
    </main>
  );
}
