'use client';
import { LUCKY_MAX } from '@/lib/gacha/logic';

/** แป้นตัวเลขกรอก Lucky Number จากการ์ด (ตามภาพร่าง: 1–9 แล้ว 0 ตรงกลางแถวล่าง) */
export default function LuckyPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const press = (d: string) => {
    const next = (value + d).replace(/^0+/, '');
    if (next && Number(next) <= LUCKY_MAX) onChange(next);
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
  return (
    <div className="lucky-pad">
      <div className={`lucky-display ${value ? '' : 'is-empty'}`} aria-live="polite">{value || '—'}</div>
      <div className="lucky-keys">
        {keys.map((k) => (
          <button key={k} type="button" className={`btn lucky-key ${k === 'C' || k === '⌫' ? 'is-fn' : ''}`}
            aria-label={k === 'C' ? 'ล้าง' : k === '⌫' ? 'ลบ' : k}
            onClick={() => (k === 'C' ? onChange('') : k === '⌫' ? onChange(value.slice(0, -1)) : press(k))}>
            {k === '⌫' ? <i className="bi bi-backspace" /> : k === 'C' ? 'ล้าง' : k}
          </button>
        ))}
      </div>
    </div>
  );
}
