'use client';
import { useMemo, useState } from 'react';
import { voteApi, useVote } from '@/lib/vote/mock-store';
import { MASCOT } from '@/lib/site';

/**
 * Sign in with Slack (จำลอง) — ของจริงใช้ Auth.js + Slack OIDC แล้วดึงตัวตนอัตโนมัติ
 * แต่ละแท็บ login เป็นคนละคนได้ ใช้ทดสอบหลายมุมพร้อมกัน
 */
export default function SignIn({ hostOnly = false, title = 'เข้าสู่ระบบเพื่อโหวต' }: { hostOnly?: boolean; title?: string }) {
  const { state } = useVote();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const users = useMemo(() => (state?.users ?? [])
    .filter((u) => !hostOnly || u.isHost)
    .filter((u) => !q || (u.name + u.dept).toLowerCase().includes(q.toLowerCase())), [state, q, hostOnly]);

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card-pop p-4 p-md-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MASCOT(hostOnly ? 'judge' : 'runway')} alt="" width={720} height={720} style={{ width: 150, height: 'auto' }} />
          <h1 className="h2 mt-2">{title}</h1>
          <p className="mb-4">ทุกคนมี Slack อยู่แล้ว กดปุ่มเดียวก็เข้าได้</p>
          {!open ? (
            <button type="button" className="btn btn-pop btn-lg w-100 slack-btn" onClick={() => setOpen(true)}>
              <i className="bi bi-slack me-2" />Sign in with Slack
            </button>
          ) : (
            <div className="text-start">
              <div className="alert alert-warning border-2 border-dark small mb-2">
                <i className="bi bi-cone-striped me-1" /><b>โหมดจำลอง</b> — ของจริงจะดึงชื่อจาก Slack ให้อัตโนมัติ ตอนนี้เลือกว่าจะเป็นใคร
              </div>
              <input className="form-control mb-2" placeholder="ค้นหาชื่อ / แผนก" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
              <div className="list-group signin-list">
                {users.map((u) => (
                  <button key={u.id} type="button" className="list-group-item list-group-item-action d-flex align-items-center gap-2" onClick={() => voteApi.signIn(u.id)}>
                    <span className="fw-bold">{u.name}</span>
                    <span className="small opacity-75 me-auto">{u.dept}</span>
                    {u.isManager && <span className="badge text-bg-warning border border-dark">เมเนเจอร์</span>}
                    {u.isHost && <span className="badge text-bg-dark">host</span>}
                  </button>
                ))}
                {!users.length && <div className="list-group-item">ไม่พบชื่อ</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
