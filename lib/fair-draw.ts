/**
 * สูตรสุ่มวงกลมแบบตรวจสอบได้ (ตู้กาชาปอง) — ใช้โค้ดชุดนี้ทั้งที่ server และหน้า "ตรวจผลด้วยตัวเอง"
 * ที่มา: docs/handoff/lucky-wheel-gacha/SPEC.md §4
 *
 * ผลขึ้นกับ (รายชื่อที่ล็อก + เลขจากลูกเต๋า) เท่านั้น → ข้อมูลเดิม = ผลเดิมทุกเครื่อง
 * ใช้ Intl.Collator('th') ที่กำหนด locale ชัดเจน + NFC normalize กันผลเรียงต่างกันระหว่าง Node กับเบราว์เซอร์
 */
const collator = new Intl.Collator('th', { sensitivity: 'variant', numeric: true });

export async function drawCircle(names: string[], diceNumber: string): Promise<[giver: string, receiver: string][]> {
  if (names.length < 3) throw new Error('ต้องมีอย่างน้อย 3 คน');
  // 1) เรียงตามตัวอักษร ไม่มีใครจัดลำดับเองได้
  const ring = names.map((n) => n.normalize('NFC').trim()).sort(collator.compare);
  if (new Set(ring).size !== ring.length) throw new Error('มีชื่อซ้ำ');

  let round = 0;
  const random = async () => {
    // 2) ตัวเลขสุ่มมาจากเลขที่คนในงานทอย + รายชื่อทั้งหมด เท่านั้น
    const data = new TextEncoder().encode(`${diceNumber}|${ring.join(',')}|${round++}`);
    const digest = new Uint32Array(await crypto.subtle.digest('SHA-256', data));
    return digest[0] / 2 ** 32;
  };

  // 3) Sattolo's algorithm → วงกลมวงเดียว ไม่มีใครได้ตัวเอง
  for (let i = ring.length - 1; i > 0; i--) {
    const j = Math.floor((await random()) * i);
    [ring[i], ring[j]] = [ring[j], ring[i]];
  }
  // 4) แต่ละคนให้ของคนถัดไปในวง
  return ring.map((name, i) => [name, ring[(i + 1) % ring.length]]);
}

/** ตรวจกติกา 3 ข้อที่ขึ้นจอเวทีหลังสุ่ม */
export function checkRules(pairs: [string, string][]) {
  const givers = new Set(pairs.map((p) => p[0]));
  const receivers = new Set(pairs.map((p) => p[1]));
  return {
    noSelf: pairs.every(([a, b]) => a !== b),
    unique: receivers.size === pairs.length,
    oneEach: givers.size === pairs.length && receivers.size === pairs.length,
  };
}
