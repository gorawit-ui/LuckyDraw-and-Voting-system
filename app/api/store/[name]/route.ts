/**
 * API กลางของ demo: ทุกเครื่องอ่าน/เขียน state ห้องเดียวกัน (กาชาปอง, โหวต)
 *   GET  /api/store/gacha?rev=12  → 204 ถ้ายังไม่มีอะไรเปลี่ยน, ไม่งั้นได้ { rev, state }
 *   POST /api/store/gacha { action, args, ctx } → รันกติกาที่ server แล้วบันทึกแบบกันชนกัน (compare-and-set)
 * ตอนขึ้น Google Cloud (Phase 4) ให้แทนที่ kv() ด้วย Firestore transaction + ctx จาก Slack session
 */
import { NextResponse } from 'next/server';
import { kv } from '@/lib/shared/kv';
import { stores } from '@/lib/shared/registry';
import { fail } from '@/lib/shared/result';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = { params: Promise<{ name: string }> };
const NO_STORE = { 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

async function load(name: string) {
  const def = stores[name];
  const snap = await kv().get(name);
  const seed = def.seed() as { v?: number };
  const saved = snap ? JSON.parse(snap.json) : null;
  // โครงสร้างข้อมูลเปลี่ยนเวอร์ชัน (เช่น กาชาปอง v1 → v2) → เริ่มจากข้อมูลตัวอย่างใหม่ (demo ไม่มีข้อมูลจริง)
  return { def, rev: snap?.rev ?? 0, state: saved && saved.v === seed.v ? saved : seed };
}

export async function GET(req: Request, { params }: Params) {
  const { name } = await params;
  if (!stores[name]) return json({ error: 'unknown store' }, 404);
  try {
    const since = new URL(req.url).searchParams.get('rev');
    if (since !== null && Number(since) === (await kv().rev(name)) && Number(since) > 0)
      return new NextResponse(null, { status: 204, headers: { ...NO_STORE, 'x-now': String(Date.now()) } });
    const { def, rev, state } = await load(name);
    return json({ rev, state: def.view(state as never), now: Date.now(), backend: kv().kind });
  } catch (e) {
    console.error('[store] GET', name, e);
    return json({ error: 'storage-unavailable' }, 503);
  }
}

export async function POST(req: Request, { params }: Params) {
  const { name } = await params;
  const def = stores[name];
  if (!def) return json({ error: 'unknown store' }, 404);
  const body = (await req.json().catch(() => null)) as { action?: string; args?: unknown[]; ctx?: Record<string, unknown> } | null;
  const action = body?.action ?? '';

  try {
    for (let attempt = 0; attempt < 15; attempt++) {
      const { rev, state } = await load(name);
      const now = Date.now();
      let result;
      if (action === 'factoryReset') {
        // demo: ล้างกลับเป็นข้อมูลตัวอย่าง (ไม่ต้องเป็น host — ใช้ตอนทดสอบ)
        Object.keys(state).forEach((k) => delete state[k]);
        Object.assign(state, def.seed());
        result = { ok: true as const, msg: 'ล้างข้อมูล demo แล้ว' };
      } else {
        const fn = Object.hasOwn(def.actions, action) ? def.actions[action] : null;
        if (!fn) return json({ result: fail('ไม่รู้จักคำสั่งนี้') }, 400);
        result = await fn(state as never, Array.isArray(body?.args) ? body.args : [], def.ctx(body?.ctx ?? {}, now) as never);
      }
      if (!result.ok) return json({ result, now: Date.now() });
      const out = JSON.stringify(state);
      if (out.length > 4_000_000) return json({ result: fail('ข้อมูลใหญ่เกินไป (รูปเยอะ) — ลบรูปบางส่วนหรือรีเซ็ต demo') });
      if (await kv().cas(name, rev, out)) return json({ result, rev: rev + 1, state: def.view(state as never), now: Date.now(), backend: kv().kind });
      await new Promise((r) => setTimeout(r, 15 + Math.random() * 40 * Math.min(attempt + 1, 5))); // มีคนเขียนก่อน → อ่านใหม่แล้วลองอีกรอบ
    }
    return json({ result: fail('มีคนกดพร้อมกันเยอะ ลองอีกครั้ง') }, 409);
  } catch (e) {
    console.error('[store] POST', name, action, e);
    return json({ result: fail('เชื่อมต่อที่เก็บข้อมูลไม่ได้ ลองอีกครั้ง') }, 503);
  }
}
