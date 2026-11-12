/**
 * โครงสร้างข้อมูล Fashion Vote — ตรงกับ Firestore ใน docs/handoff/costume-vote/SPEC.md §3
 *   users/{slackId} · events/{id} · events/{id}/contestants/{id} · events/{id}/votes/{slackId}
 * mock เก็บซ้อนกันใน object เดียว แต่ shape แต่ละ record เหมือนของจริง
 */
export type EventStatus = 'registration' | 'voting' | 'closed' | 'revealed';

export type User = {
  id: string; // Slack User ID
  name: string;
  dept: string;
  isManager: boolean;
  isHost: boolean;
};

export type Contestant = {
  id: string;
  name: string; // ชื่อที่ให้ประกาศ
  team: string;
  title: string; // ชื่อชุด / คอนเซปต์
  photo: string | null; // data URL ย่อแล้ว (ด้านยาว 480px)
  emoji: string; // ใช้แทนรูปถ้าไม่มี
  hue: number;
  status: 'pending' | 'approved';
  slackId: string | null; // ผูกบัญชีผู้สมัคร (ทีมอาจไม่ผูก)
  createdAt: number;
};

export type Vote = {
  voterId: string; // = document id → 1 คน 1 โหวต
  contestantId: string;
  weight: 10 | 1; // คิดที่ server ณ ตอนกดโหวต
  at: number;
};

export type VoteEvent = {
  id: string;
  name: string;
  status: EventStatus;
  durationMin: number;
  endsAt: number | null;
  revealStep: number; // จำนวนอันดับที่เปิดแล้ว นับจากท้าย
  createdAt: number;
  contestants: Contestant[];
  votes: Vote[];
};

export type VoteState = {
  v: 1;
  users: User[];
  events: VoteEvent[];
  activeEventId: string;
};

export const STATUS_LABEL: Record<EventStatus, string> = {
  registration: 'เปิดรับสมัคร',
  voting: 'กำลังโหวต',
  closed: 'ปิดโหวต',
  revealed: 'ประกาศผลแล้ว',
};
