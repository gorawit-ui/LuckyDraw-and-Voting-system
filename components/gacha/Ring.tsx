'use client';
/**
 * วงกลมรายชื่อบนจอเวที — ตอนสุ่มสลับที่ไปมา แล้วนิ่งเป็นวงจริง พร้อมลูกศรตามลำดับการให้ของ (ตามเข็มนาฬิกา)
 */
export default function Ring({ names, shuffleSeed, arrows }: { names: string[]; shuffleSeed?: number; arrows?: boolean }) {
  const n = names.length;
  const order = shuffleSeed == null ? names : shuffled(names, shuffleSeed);
  const R = 400, C = 500;
  const fs = n <= 12 ? 44 : n <= 24 ? 32 : n <= 40 ? 22 : n <= 70 ? 15 : 11;
  const pos = (i: number, r = R) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const;
  };
  return (
    <svg viewBox="0 0 1000 1000" className="ring-svg" role="img" aria-label={arrows ? 'วงกลมผลการจับคู่ ตามเข็มนาฬิกา แต่ละคนให้ของคนถัดไป' : 'กำลังสุ่ม'}>
      <defs>
        <marker id="arw" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#FFD23F" />
        </marker>
      </defs>
      <circle cx={C} cy={C} r={R - 70} fill="none" stroke="rgba(255,246,224,.25)" strokeWidth="6" strokeDasharray="4 14" />
      {arrows && n > 1 && order.map((_, i) => {
        // ลูกศรสั้นบนวงใน จากคน i → คน i+1
        const a1 = -Math.PI / 2 + ((i + 0.3) / n) * Math.PI * 2, a2 = -Math.PI / 2 + ((i + 0.7) / n) * Math.PI * 2, r = R - 70;
        return <path key={'a' + i} d={`M${C + Math.cos(a1) * r} ${C + Math.sin(a1) * r} A${r} ${r} 0 0 1 ${C + Math.cos(a2) * r} ${C + Math.sin(a2) * r}`}
          fill="none" stroke="#FFD23F" strokeWidth="6" markerEnd="url(#arw)" />;
      })}
      {order.map((name, i) => {
        const [x, y] = pos(i);
        return (
          <g key={name} className="ring-name" style={{ transform: `translate(${x}px, ${y}px)` }}>
            <text textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight={800} fill="#FFF6E0" stroke="#1A1414" strokeWidth={fs / 5} paintOrder="stroke">{name}</text>
          </g>
        );
      })}
    </svg>
  );
}

function shuffled<T>(a: T[], seed: number) {
  const r = a.slice();
  let s = seed * 9301 + 49297;
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
