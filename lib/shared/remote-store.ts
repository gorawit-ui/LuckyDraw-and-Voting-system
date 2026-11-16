'use client';
/**
 * ฝั่งเบราว์เซอร์: อ่าน state จาก /api/store/[name] (ถามทุก ~1 วินาที ได้คำตอบสั้นๆ ถ้ายังไม่เปลี่ยน) และส่ง action ไปให้ server ตัดสิน
 * ทุกเครื่อง (มือถือ/คอม/จอเวที) จึงเห็นข้อมูลชุดเดียวกัน · Phase 4 เปลี่ยนเป็น Firestore onSnapshot ได้โดยไม่แตะหน้าเว็บ
 */
import { useSyncExternalStore } from 'react';
import { syncClock } from './clock';
import { fail, type Out } from './result';

type Backend = 'redis' | 'memory';
export type Conn = { online: boolean; backend: Backend | null };

export function createRemoteStore<T>(name: string, opts: { ctx: () => Record<string, unknown> }) {
  let state: T | null = null;
  let rev = 0;
  let conn: Conn = { online: true, backend: null };
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inflight = false;
  const emit = () => listeners.forEach((l) => l());

  const apply = (j: { rev?: number; state?: T; backend?: Backend }) => {
    if (j.state !== undefined && typeof j.rev === 'number' && j.rev >= rev) {
      rev = j.rev; state = j.state;
      if (j.backend) conn = { ...conn, backend: j.backend };
      emit();
    }
  };
  const setOnline = (online: boolean) => { if (conn.online !== online) { conn = { ...conn, online }; emit(); } };

  async function poll() {
    if (inflight) return;
    inflight = true;
    const sent = Date.now();
    try {
      const r = await fetch(`/api/store/${name}?rev=${rev}`, { cache: 'no-store' });
      const recv = Date.now();
      if (r.status === 204) syncClock(Number(r.headers.get('x-now')), sent, recv);
      else if (r.ok) { const j = await r.json(); syncClock(j.now, sent, recv); apply(j); }
      setOnline(r.ok || r.status === 204);
    } catch { setOnline(false); }
    inflight = false;
  }
  const loop = () => {
    timer = setTimeout(async () => { await poll(); if (listeners.size) loop(); }, document.hidden ? 4000 : 1000);
  };
  const wake = () => { if (!document.hidden) void poll(); };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    if (listeners.size === 1) {
      void poll(); loop();
      document.addEventListener('visibilitychange', wake);
      addEventListener('focus', wake);
    }
    return () => {
      listeners.delete(l);
      if (!listeners.size) {
        if (timer) clearTimeout(timer);
        timer = null;
        document.removeEventListener('visibilitychange', wake);
        removeEventListener('focus', wake);
      }
    };
  };

  /** ส่ง action ให้ server — ได้ผล + state ล่าสุดกลับมาทันที (ไม่ต้องรอรอบถามถัดไป) */
  async function call(action: string, ...args: unknown[]): Promise<Out> {
    const sent = Date.now();
    try {
      const r = await fetch(`/api/store/${name}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
        body: JSON.stringify({ action, args, ctx: opts.ctx() }),
      });
      const j = (await r.json().catch(() => null)) as { result?: Out; rev?: number; state?: T; now?: number; backend?: Backend } | null;
      if (!j?.result) { setOnline(false); return fail(r.status === 413 ? 'ข้อมูลใหญ่เกินไป (รูปใหญ่) ลองรูปเล็กลง' : 'เชื่อมต่อ server ไม่ได้ ลองอีกครั้ง'); }
      setOnline(true);
      if (j.now) syncClock(j.now, sent, Date.now());
      apply(j);
      return j.result;
    } catch {
      setOnline(false);
      return fail('เชื่อมต่อไม่ได้ — เช็กอินเทอร์เน็ตแล้วลองอีกครั้ง');
    }
  }

  const useStore = () => useSyncExternalStore(subscribe, () => state, () => null);
  const useConn = () => useSyncExternalStore(subscribe, () => conn, () => conn);
  return { call, useStore, useConn, peek: () => state, refresh: poll };
}
