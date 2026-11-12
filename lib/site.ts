// ข้อมูลกลางของเว็บ — เมนู/การ์ดหน้าแรกอ่านจากที่นี่ที่เดียว
export const site = {
  name: 'OUTING CHALLENGE',
  nameTh: 'รวมเกมวันเอาท์ติ้ง',
  tagline: 'สุ่ม · ลุ้น · โหวต — ทุกอย่างของวันเอาท์ติ้งอยู่ในที่เดียว',
};

export type ZoneLink = { href: string; label: string; icon: string; note?: string };
export type Zone = {
  key: 'lucky' | 'vote';
  href: string;
  title: string;
  subtitle: string;
  emoji: string;
  packClass: string;
  tag: string;
  links: ZoneLink[];
  prototype: string;
};

export const zones: Zone[] = [
  {
    key: 'lucky',
    href: '/lucky',
    title: 'Lucky Zone',
    subtitle: 'วงล้อคู่แจกของรางวัล + ตู้กาชาปองจับคู่แลกของขวัญ',
    emoji: '🎡',
    packClass: 'pack-lucky',
    tag: '2 เกม',
    links: [
      { href: '/lucky/wheel', label: 'วงล้อคู่', icon: 'bi-bullseye', note: 'จอเวที · คนคุมกดเอง' },
      { href: '/lucky/gacha', label: 'ตู้กาชาปอง', icon: 'bi-gift', note: 'มือถือทุกคน · จับคู่แลกของ' },
    ],
    prototype: '/prototypes/lucky-wheel-gacha.html',
  },
  {
    key: 'vote',
    href: '/vote',
    title: 'Fashion Vote',
    subtitle: 'โหวตประกวดชุด Fashion Walk แบบเรียลไทม์ ลุ้นประกาศผลทีละอันดับ',
    emoji: '👑',
    packClass: 'pack-vote',
    tag: 'LIVE',
    links: [
      { href: '/vote', label: 'โหวต / สมัครประกวด', icon: 'bi-phone', note: 'มือถือ' },
      { href: '/vote/stage', label: 'จอเวที', icon: 'bi-easel', note: 'โปรเจกเตอร์' },
      { href: '/vote/admin', label: 'หลังบ้าน Host', icon: 'bi-sliders', note: 'host เท่านั้น' },
    ],
    prototype: '/prototypes/costume-vote.html',
  },
];
