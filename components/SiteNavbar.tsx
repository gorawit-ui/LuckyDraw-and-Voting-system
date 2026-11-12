'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { site, zones } from '@/lib/site';

export default function SiteNavbar() {
  const path = usePathname();
  return (
    <nav className="navbar navbar-expand-lg navbar-pop sticky-top" data-bs-theme="dark">
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
          <span className="pixel-badge py-1 px-2" style={{ fontSize: '.7rem' }}>GO</span>
          <span className="fw-bolder" style={{ fontFamily: 'var(--font-display)' }}>{site.name}</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
          aria-controls="mainNav" aria-expanded="false" aria-label="เปิดเมนู">
          <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }} />
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto gap-lg-1 mt-2 mt-lg-0">
            <li className="nav-item">
              <Link href="/" className={`nav-link ${path === '/' ? 'active' : ''}`}>
                <i className="bi bi-house-heart-fill me-1" />หน้าแรก
              </Link>
            </li>
            {zones.map((z) => (
              <li key={z.key} className="nav-item dropdown">
                <a href="#" className={`nav-link dropdown-toggle ${path.startsWith(z.href) ? 'active' : ''}`}
                  role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <span className="me-1">{z.emoji}</span>{z.title}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  {z.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="dropdown-item">
                        <i className={`bi ${l.icon} me-2`} />{l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
