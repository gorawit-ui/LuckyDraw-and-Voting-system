'use client';
import { useCallback, useEffect, useState } from 'react';

/** เวลาปัจจุบัน อัปเดตทุก ms (ใช้กับนับถอยหลัง) */
export function useNow(ms = 500) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
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
