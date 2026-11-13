import type { Contestant, User, VoteEvent, VoteState } from './types';

// ข้อมูลตัวอย่าง (ชื่อสมมติ) — demo บน Vercel ใช้แค่ชุดนี้
const PEOPLE: [string, string, string][] = [
  ['U01', 'พี่ต้น', 'People & Culture'], ['U02', 'พี่แนน', 'Operations'], ['U03', 'พี่บอส', 'Sales'], ['U04', 'พี่เก่ง', 'Marketing'],
  ['U05', 'พี่ปุ๋ย', 'Finance'], ['U06', 'พี่โอ๊ต', 'R&D'], ['U07', 'มายด์', 'Marketing'], ['U08', 'ฟ้า', 'Sales'], ['U09', 'เจมส์', 'Operations'],
  ['U10', 'ปาล์ม', 'R&D'], ['U11', 'แพรว', 'Finance'], ['U12', 'กาย', 'Operations'], ['U13', 'มิ้นท์', 'Marketing'], ['U14', 'ภูมิ', 'Sales'],
  ['U15', 'เฟิร์น', 'People & Culture'], ['U16', 'ต้าร์', 'Production'], ['U17', 'เบล', 'Production'], ['U18', 'นัท', 'Production'],
  ['U19', 'ไอซ์', 'Warehouse'], ['U20', 'บีม', 'Warehouse'], ['U21', 'น้ำ', 'Customer Service'], ['U22', 'ฝน', 'Customer Service'],
  ['U23', 'อาร์ม', 'IT'], ['U24', 'โอม', 'IT'], ['U25', 'จูน', 'Design'], ['U26', 'แบงค์', 'Sales'], ['U27', 'พลอย', 'Marketing'],
  ['U28', 'ต่อ', 'Production'], ['U29', 'แอน', 'Finance'], ['U30', 'ปอ', 'Warehouse'],
];
const MANAGERS = new Set(['U01', 'U02', 'U03', 'U04', 'U05', 'U06']);
const HOSTS = new Set(['U01', 'U02']);

export const uid = (p: string) => p + Math.random().toString(36).slice(2, 9);

export function seedState(): VoteState {
  const users: User[] = PEOPLE.map(([id, name, dept]) => ({ id, name, dept, isManager: MANAGERS.has(id), isHost: HOSTS.has(id) }));
  const u = (id: string) => users.find((x) => x.id === id)!;
  const mk = (slackId: string, title: string, emoji: string, hue: number, status: Contestant['status'] = 'approved'): Contestant => ({
    id: uid('c_'), slackId, name: u(slackId).name, team: u(slackId).dept, title, emoji, hue, photo: null, status, createdAt: Date.now(),
  });
  const now = Date.now();
  const current: VoteEvent = {
    id: 'ev_main', name: 'Fashion Walk 2026', status: 'registration', durationMin: 5, endsAt: null, revealStep: 0, createdAt: now,
    contestants: [
      mk('U07', 'นางฟ้าพริกเผา', '🌶️', 0), mk('U16', 'อัศวินกล่องลัง', '📦', 30), mk('U25', 'ราชินีมัทฉะ', '🍵', 120),
      mk('U12', 'ซูเปอร์ฮีโร่ไลน์ผลิต', '🦸', 210), mk('U21', 'ดิสโก้ยุค 80', '🪩', 280), mk('U23', 'แฮกเกอร์สายมู', '🧿', 250),
      mk('U19', 'นักบินอวกาศโกดัง', '🚀', 190, 'pending'),
    ],
    votes: [],
  };
  // งานเก่าพร้อมผล (ตัวอย่างหน้า "งานทั้งหมด")
  const pastC = [mk('U13', 'ชุดไทยประยุกต์', '👘', 330), mk('U27', 'ชุดไทยจักรี', '👑', 45), mk('U18', 'ชุดไทยเรือนต้น', '🌸', 300)];
  const past: VoteEvent = {
    id: 'ev_ny2026', name: 'ปาร์ตี้ปีใหม่ 2026 · ประกวดชุดไทย', status: 'revealed', durationMin: 5, endsAt: null, revealStep: 3,
    createdAt: now - 1000 * 60 * 60 * 24 * 300, contestants: pastC,
    votes: users.filter((x) => !['U13', 'U27', 'U18'].includes(x.id)).map((x, i) => ({
      voterId: x.id, contestantId: pastC[(i * 7) % 3].id, weight: x.isManager ? 10 : 1, at: now - 1000 * 60 * 60 * 24 * 300 + i * 1000,
    })),
  };
  return { v: 1, users, events: [current, past], activeEventId: current.id };
}
