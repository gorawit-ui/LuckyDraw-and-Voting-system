'use client';
import { voteApi } from '@/lib/vote/mock-store';
import type { User } from '@/lib/vote/types';

export default function UserChip({ user }: { user: User }) {
  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <span className="chip-pop"><i className="bi bi-person-circle" />{user.name}
        <span className="opacity-75 fw-normal">· {user.dept}</span>
        {user.isHost && <span className="badge text-bg-dark ms-1">host</span>}
      </span>
      <button type="button" className="btn btn-sm btn-pop btn-pop-cream" onClick={() => voteApi.signOut()} title="สลับบัญชี (โหมดจำลอง)">
        <i className="bi bi-box-arrow-right" /><span className="visually-hidden">ออกจากระบบ</span>
      </button>
    </div>
  );
}
