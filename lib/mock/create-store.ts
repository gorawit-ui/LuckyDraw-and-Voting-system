'use client';
/**
 * ค่า "ฉันคือใคร" ต่อแท็บ (sessionStorage) — เปิดหลายแท็บเป็นคนละคนได้ (ใช้ทดสอบ)
 * และจำไว้ใน localStorage ด้วย: ปิดแท็บแล้วสแกน QR ใหม่บนมือถือ ยังเป็นคนเดิม
 */
import { useSyncExternalStore } from 'react';

export { fail, ok, type Result } from '@/lib/shared/result';

export function createSessionValue<V>(key: string) {
  const listeners = new Set<() => void>();
  let cache: V | null | undefined;
  const get = (): V | null => {
    if (cache !== undefined) return cache;
    try {
      const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as V) : null;
    } catch { cache = null; }
    return cache;
  };
  const set = (v: V | null) => {
    cache = v;
    for (const st of [() => sessionStorage, () => localStorage]) {
      try { if (v == null) st().removeItem(key); else st().setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
    }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
  const use = () => useSyncExternalStore(subscribe, () => (typeof window === 'undefined' ? null : get()), () => null);
  return { get, set, use };
}
