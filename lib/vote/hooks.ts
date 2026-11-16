'use client';
import { useCallback, useEffect, useState } from 'react';
import { serverNow } from '@/lib/shared/clock';

/** เวลาปัจจุบันตามนาฬิกา server อัปเดตทุก ms (นับถอยหลัง/เปิดแคปซูลพร้อมกันทุกเครื่อง) */
export function useNow(ms = 500) {
  const [now, setNow] = useState(() => serverNow());
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function useToast() {
  const [msg, setMsg] = useState('');
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg((x) => (x === m ? '' : x)), 2600);
  }, []);
  return [msg, show] as const;
}
