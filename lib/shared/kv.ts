/**
 * ที่เก็บ state ฝั่ง server (ใช้ระหว่าง demo ก่อนย้ายไป Firestore ใน Phase 4)
 * - มี KV_REST_API_URL/TOKEN หรือ UPSTASH_REDIS_REST_URL/TOKEN → Upstash Redis (ใช้บน Vercel)
 * - ไม่มี → เก็บในหน่วยความจำของ process (ใช้กับ npm run dev/start ในเครื่อง — ทุกเครื่องในวง LAN เห็นข้อมูลเดียวกัน)
 * ข้อมูลหมดอายุเองใน 7 วัน (demo ไม่มีข้อมูลจริง)
 */
export type Snap = { rev: number; json: string };
export type Backend = {
  kind: 'redis' | 'memory';
  rev(name: string): Promise<number>;
  get(name: string): Promise<Snap | null>;
  /** เขียนเฉพาะเมื่อ rev ยังเป็น prevRev (กันสองคนกดพร้อมกันแล้วทับกัน) */
  cas(name: string, prevRev: number, json: string): Promise<boolean>;
};

const TTL = 60 * 60 * 24 * 7;
const kRev = (n: string) => `pc:${n}:rev`;
const kData = (n: string) => `pc:${n}:data`;

function redisBackend(url: string, token: string): Backend {
  const cmd = async (...args: (string | number)[]) => {
    const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args.map(String)), cache: 'no-store' });
    const j = (await r.json()) as { result?: unknown; error?: string };
    if (!r.ok || j.error) throw new Error(`redis: ${j.error ?? r.status}`);
    return j.result;
  };
  const CAS = `if (redis.call('GET', KEYS[1]) or '0') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[2], ARGV[3], 'EX', ARGV[4]); redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[4]); return 1`;
  return {
    kind: 'redis',
    rev: async (n) => Number((await cmd('GET', kRev(n))) ?? 0),
    async get(n) {
      const [rev, json] = (await cmd('MGET', kRev(n), kData(n))) as [string | null, string | null];
      return json ? { rev: Number(rev ?? 0), json } : null;
    },
    cas: async (n, prev, json) => Number(await cmd('EVAL', CAS, 2, kRev(n), kData(n), prev, prev + 1, json, TTL)) === 1,
  };
}

function memoryBackend(): Backend {
  const g = globalThis as unknown as { __pcMem?: Map<string, Snap> };
  const m = (g.__pcMem ??= new Map());
  return {
    kind: 'memory',
    rev: async (n) => m.get(n)?.rev ?? 0,
    get: async (n) => m.get(n) ?? null,
    async cas(n, prev, json) {
      if ((m.get(n)?.rev ?? 0) !== prev) return false;
      m.set(n, { rev: prev + 1, json });
      return true;
    },
  };
}

let backend: Backend | null = null;
export function kv(): Backend {
  if (backend) return backend;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  backend = url && token ? redisBackend(url.replace(/\/$/, ''), token) : memoryBackend();
  return backend;
}
