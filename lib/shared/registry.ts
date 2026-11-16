/** รายการ store ที่ API /api/store/[name] รู้จัก (ฝั่ง server) */
import { gachaActions, gachaSeed, gachaView, type GachaCtx } from '@/lib/gacha/reducer';
import { voteActions, voteSeed, type VoteCtx } from '@/lib/vote/reducer';
import type { Out } from './result';

type Ctx = { now: number } & Record<string, unknown>;
export type StoreDef = {
  seed: () => unknown;
  actions: Record<string, (s: never, args: unknown[], ctx: never) => Out | Promise<Out>>;
  view: (s: never) => unknown;
  ctx: (raw: Record<string, unknown>, now: number) => Ctx;
};

const obj = (x: unknown) => (x && typeof x === 'object' ? (x as Record<string, unknown>) : null);

export const stores: Record<string, StoreDef> = {
  gacha: {
    seed: gachaSeed, actions: gachaActions, view: gachaView,
    ctx: (raw, now): GachaCtx => {
      const h = obj(raw.host);
      return { now, host: h && typeof h.roomId === 'string' && typeof h.pin === 'string' ? { roomId: h.roomId, pin: h.pin } : null };
    },
  },
  vote: {
    seed: voteSeed, actions: voteActions, view: (s) => s,
    ctx: (raw, now): VoteCtx => ({ now, me: typeof raw.me === 'string' ? raw.me : null }),
  },
};
