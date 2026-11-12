import type { Metadata, Viewport } from 'next';
import { Anuphan, Kanit, Press_Start_2P } from 'next/font/google';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/globals.scss';
import SiteNavbar from '@/components/SiteNavbar';
import BootstrapClient from '@/components/BootstrapClient';
import { site } from '@/lib/site';

// หัวข้อ: Kanit 800/900 (หนา กลม อ่านไทยชัดบนโปรเจกเตอร์) · เนื้อหา: Anuphan · ป้ายเกม: Press Start 2P
const display = Kanit({ subsets: ['thai', 'latin'], weight: ['700', '800', '900'], variable: '--font-display', display: 'swap' });
const body = Anuphan({ subsets: ['thai', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-pixel', display: 'swap' });

export const metadata: Metadata = {
  title: { default: `${site.name} · ${site.nameTh}`, template: `%s · ${site.name}` },
  description: site.tagline,
};

export const viewport: Viewport = {
  themeColor: '#E8262B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable} ${pixel.variable}`}>
      <body>
        <SiteNavbar />
        {children}
        <BootstrapClient />
      </body>
    </html>
  );
}
