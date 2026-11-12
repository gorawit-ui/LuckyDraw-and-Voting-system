'use client';
import { useEffect } from 'react';

// โหลด JS ของ Bootstrap (dropdown / collapse / modal) ฝั่งเบราว์เซอร์เท่านั้น
export default function BootstrapClient() {
  useEffect(() => {
    // @ts-expect-error — bootstrap bundle ไม่มี type declaration แยก
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);
  return null;
}
