'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** QR code สร้างในเบราว์เซอร์ (ไม่ส่งข้อมูลไปที่ไหน) */
export default function QrCode({ text, size = 220, className = '' }: { text: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, { margin: 1, width: size * 2, errorCorrectionLevel: 'M', color: { dark: '#1A1414', light: '#FFF6E0' } })
      .then((u) => alive && setSrc(u))
      .catch(() => alive && setSrc(null));
    return () => { alive = false; };
  }, [text, size]);
  return (
    <div className={`qr-box ${className}`} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={`QR: ${text}`} width={size} height={size} /> : <div className="spinner-border" />}
    </div>
  );
}

/** URL เต็มของหน้าในเว็บนี้ (ฝั่งเบราว์เซอร์) */
export const absUrl = (path: string) => (typeof window === 'undefined' ? path : `${window.location.origin}${path}`);
