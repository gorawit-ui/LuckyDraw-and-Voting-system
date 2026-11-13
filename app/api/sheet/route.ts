import { NextResponse } from 'next/server';

/**
 * ส่งผลวงล้อคู่ (ทีละแถว) / กาชาปอง (ทั้งชุด) เข้า Google Sheet ผ่าน server — secret อยู่ใน env ไม่ฝังในหน้าเว็บ (แก้ข้อ 1–2 ใน SPEC §6)
 * ถ้าไม่ได้ตั้ง SHEET_LOGGER_URL (เช่น demo บน Vercel) → ตอบ { ok:false, error:'not-configured' } หน้าเว็บจะเก็บในเครื่องอย่างเดียว
 */
export async function POST(req: Request) {
  const url = process.env.SHEET_LOGGER_URL;
  const secret = process.env.SHEET_LOGGER_SECRET;
  if (!url || !secret) return NextResponse.json({ ok: false, error: 'not-configured' }); // 200: ไม่ใช่ error ของระบบ

  let body: { type?: unknown; name?: unknown; gift?: unknown; round?: unknown; room?: unknown; pairs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }
  const str = (v: unknown, n = 200) => (typeof v === 'string' ? v.slice(0, n) : '');
  let payload: Record<string, unknown>;
  if (body.type === 'gacha') {
    // กาชาปอง: ส่งทั้งชุดทีเดียว { room, pairs:[{from,to}] }
    const pairs = Array.isArray(body.pairs) ? body.pairs.slice(0, 500).map((p) => ({ from: str((p as { from?: unknown }).from, 80), to: str((p as { to?: unknown }).to, 80) })) : [];
    if (!pairs.length || pairs.some((p) => !p.from || !p.to)) return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
    payload = { type: 'gacha', secret, room: str(body.room, 40), pairs };
  } else {
    const name = str(body.name), gift = str(body.gift);
    const round = Number.isInteger(body.round) ? body.round : '';
    if (!name || !gift) return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
    payload = { type: 'wheel', secret, name, gift, round };
  }

  try {
    // Apps Script ตอบผ่าน redirect → fetch ตามให้อัตโนมัติ
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!data?.ok) return NextResponse.json({ ok: false, error: data?.error ?? `upstream-${r.status}` }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
