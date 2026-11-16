'use client';
import { useSyncExternalStore } from 'react';
import type { Conn } from '@/lib/shared/remote-store';

const isLocalhost = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const noop = () => () => {};

/**
 * แถบเตือนบนหน้า host: หลุดการเชื่อมต่อ / เปิดผ่าน localhost (มือถือสแกน QR แล้วเข้าไม่ได้)
 * / บน Vercel ยังไม่ได้ต่อ Redis (แต่ละเครื่องอาจเห็นข้อมูลไม่ตรงกัน)
 */
export default function ConnBanner({ conn, host = false }: { conn: Conn; host?: boolean }) {
  const local = useSyncExternalStore(noop, isLocalhost, () => false);
  const vercelNoKv = useSyncExternalStore(noop, () => conn.backend === 'memory' && /\.vercel\.app$/.test(location.hostname), () => false);
  const msgs: [string, string][] = [];
  if (!conn.online) msgs.push(['bi-wifi-off', 'เชื่อมต่อ server ไม่ได้ — กำลังลองใหม่อัตโนมัติ']);
  if (host && local) msgs.push(['bi-phone', 'เปิดด้วย localhost อยู่ มือถือสแกน QR แล้วจะเข้าไม่ได้ — เปิดเว็บผ่าน IP ของเครื่องนี้ (เช่น http://192.168.1.20:3000) หรือใช้ลิงก์ Vercel']);
  if (host && vercelNoKv) msgs.push(['bi-database-exclamation', 'ยังไม่ได้เชื่อม Upstash Redis บน Vercel — มือถือแต่ละเครื่องอาจเห็นห้องไม่ตรงกัน (ดู docs/DEPLOY.md ขั้นตอน Redis)']);
  if (!msgs.length) return null;
  return (
    <div className="alert alert-warning border-2 border-dark small fw-semibold mb-3" role="status">
      {msgs.map(([icon, t]) => <div key={t}><i className={`bi ${icon} me-1`} />{t}</div>)}
    </div>
  );
}
