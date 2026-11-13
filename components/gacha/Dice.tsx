// ลูกเต๋าวาดด้วย CSS (ไม่พึ่งฟอนต์ ⚀–⚅ ที่แต่ละเครื่องหน้าตาไม่เหมือนกัน)
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

export default function Dice({ value, size = 64 }: { value: number; size?: number }) {
  return (
    // padding/gap คิดจากขนาดลูกเต๋าเอง (ถ้าใช้ % จะอิงความกว้างของกล่องแม่ แล้วจุดหายบนจอกว้าง)
    <span className="dice" style={{ width: size, height: size, padding: Math.round(size * 0.14), gap: Math.max(2, Math.round(size * 0.06)), borderRadius: Math.round(size * 0.22) }}
      role="img" aria-label={`ลูกเต๋า ${value}`}>
      {Array.from({ length: 9 }, (_, i) => <i key={i} className={PIPS[value]?.includes(i) ? 'on' : ''} />)}
    </span>
  );
}

export function DiceRow({ dice, size = 64 }: { dice: number[]; size?: number }) {
  return (
    <div className="d-flex flex-wrap justify-content-center gap-2">
      {dice.map((d, i) => <Dice key={i} value={d} size={size} />)}
    </div>
  );
}
