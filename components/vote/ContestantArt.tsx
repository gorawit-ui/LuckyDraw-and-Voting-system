import type { Contestant } from '@/lib/vote/types';

/** รูปชุด 4:5 — ไม่มีรูปใช้ emoji บนพื้นสีประจำตัว */
export default function ContestantArt({ c, className = '' }: { c: Pick<Contestant, 'photo' | 'emoji' | 'hue' | 'name'>; className?: string }) {
  return (
    <div className={`c-art ${className}`} style={{ background: `hsl(${c.hue} 75% 62%)` }}>
      {c.photo
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={c.photo} alt={`ชุดของ ${c.name}`} />
        : <span aria-hidden>{c.emoji}</span>}
    </div>
  );
}
