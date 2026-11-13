'use client';
/**
 * ตัวช่วยสร้าง mock backend: เก็บ state ใน localStorage + ซิงก์ข้ามแท็บด้วย BroadcastChannel
 * ใช้ระหว่างยังไม่มี Firestore — ตอนขึ้น Google Cloud ให้แทนด้วย Firestore subscribe + API
 */
import { useSyncExternalStore } from 'react';

export type Result = { ok: true; msg?: string } | { ok: false; error: string };
export const ok = (msg?: string): Result => ({ ok: true, msg });
export const fail = (error: string): Result => ({ ok: false, error });

export function createMockStore<T>(key: string, channel: string, seed: () => T) {
  let cache: T | null = null;
  const listeners = new Set<() => void>();
  let bc: BroadcastChannel | null = null;
  let booted = false;

  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch { /* ignore */ }
    const s = seed();
    try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* ignore */ }
    return s;
  };
  const emit = () => listeners.forEach((l) => l());
  const boot = () => {
    if (booted || typeof window === 'undefined') return;
    booted = true;
    cache = read();
    try { bc = new BroadcastChannel(channel); bc.onmessage = () => { cache = read(); emit(); }; } catch { /* fallback: storage event */ }
    addEventListener('storage', (e) => { if (e.key === key) { cache = read(); emit(); } });
  };

  /** อ่านล่าสุด → แก้ → เขียน → แจ้งทุกแท็บ */
  const commit = (fn: (s: T) => Result): Result => {
    boot();
    const s = read();
    const r = fn(s);
    if (!r.ok) return r;
    try { localStorage.setItem(key, JSON.stringify(s)); } catch { return fail('พื้นที่เก็บในเครื่องเต็ม'); }
    cache = s;
    bc?.postMessage(1);
    emit();
    return r;
  };

  const subscribe = (l: () => void) => { boot(); listeners.add(l); return () => { listeners.delete(l); }; };
  const useStore = () => useSyncExternalStore(subscribe, () => { boot(); return cache; }, () => null);
  const reset = () => { try { localStorage.removeItem(key); } catch { /* ignore */ } cache = read(); bc?.postMessage(1); emit(); };

  return { commit, useStore, subscribe, reset, peek: () => { boot(); return cache; }, notify: emit };
}

/** ค่าที่จำไว้ต่อแท็บ (sessionStorage) เช่น "ฉันคือใคร" — เปิดหลายแท็บเป็นคนละคนได้ */
export function createSessionValue<V>(key: string) {
  const listeners = new Set<() => void>();
  let cache: V | null | undefined;
  const get = (): V | null => {
    if (cache !== undefined) return cache;
    try { const raw = sessionStorage.getItem(key); cache = raw ? (JSON.parse(raw) as V) : null; } catch { cache = null; }
    return cache;
  };
  const set = (v: V | null) => {
    cache = v;
    try { if (v == null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
  const use = () => useSyncExternalStore(subscribe, () => (typeof window === 'undefined' ? null : get()), () => null);
  return { get, set, use };
}
