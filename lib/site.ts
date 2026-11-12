// ข้อมูลกลางของเว็บ — เมนู/การ์ดหน้าแรกอ่านจากที่นี่ที่เดียว
/** มาสคอต: น้องจี๊ด (ตัวกลมสีเขียว) — ภาพทั้งหมดอยู่ใน public/brand ดู docs/brand/ASSETS.md */
export const MASCOT = (pose: 'hero' | 'wheel' | 'gacha' | 'judge' | 'runway' | 'nervous' | 'winner' | 'sad') => `/brand/mascot/${pose}.webp`;
export const STICKER = (name: string) => `/brand/stickers/${name}.webp`;

export const site = {
  name: 'OUTING CHALLENGE',
  nameTh: 'รวมเกมวันเอาท์ติ้ง',
  tagline: 'สุ่ม · ลุ้น · โหวต — ทุกอย่างของวันเอาท์ติ้งอยู่ในที่เดียว',
};

export type ZoneLink = { href: string; label: string; icon: string; note?: string; mascot?: string };
export type Zone = {
  key: 'lucky' | 'vote';
  href: string;
  title: string;
  subtitle: string;
  emoji: string;
  image: string;
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
    image: '/brand/zones/lucky.webp',
    packClass: 'pack-lucky',
    tag: '2 เกม',
    links: [
      { href: '/lucky/wheel', label: 'วงล้อคู่', icon: 'bi-bullseye', note: 'จอเวที · คนคุมกดเอง', mascot: '/brand/mascot/wheel.webp' },
      { href: '/lucky/gacha', label: 'ตู้กาชาปอง', icon: 'bi-gift', note: 'มือถือทุกคน · จับคู่แลกของ', mascot: '/brand/mascot/gacha.webp' },
    ],
    prototype: '/prototypes/lucky-wheel-gacha.html',
  },
  {
    key: 'vote',
    href: '/vote',
    title: 'Fashion Vote',
    subtitle: 'โหวตประกวดชุด Fashion Walk แบบเรียลไทม์ ลุ้นประกาศผลทีละอันดับ',
    emoji: '👑',
    image: '/brand/zones/vote.webp',
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
