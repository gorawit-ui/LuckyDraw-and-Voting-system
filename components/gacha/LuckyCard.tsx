'use client';
import type { Member } from '@/lib/gacha/types';
import { Avatar } from './PersonPicker';

/** การ์ดคน: Lucky Number ตัวใหญ่ด้านบน + วงกลมรูป + ชื่อ/ทีม (ตามภาพร่างหน้าผล) */
export default function LuckyCard({ m, caption }: { m: Pick<Member, 'lucky' | 'nick' | 'full' | 'team'>; caption?: string }) {
  return (
    <div className="lucky-card">
      <div className="lucky-card-num"><small>Lucky Number</small><span>{m.lucky}</span></div>
      <div className="lucky-card-body">
        <Avatar name={m.nick || m.full} big />
        <div className="min-w-0">
          <div className="lucky-card-name">{m.nick || m.full}</div>
          {m.team && <div className="fw-bold">ทีม {m.team}</div>}
          {m.full && m.full !== m.nick && <div className="small">{m.full}</div>}
        </div>
      </div>
      {caption && <div className="lucky-card-cap">{caption}</div>}
    </div>
  );
}
