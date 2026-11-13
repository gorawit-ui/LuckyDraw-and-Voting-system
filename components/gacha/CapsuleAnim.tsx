import { STICKER } from '@/lib/site';
import type { AnimPhase } from '@/lib/gacha/logic';

/**
 * แอนิเมชันตู้กาชาปอง — ทุกเครื่องเล่นพร้อมกันตามเวลา revealAt (SPEC §4)
 * ตู้สั่น → แคปซูลตก → แคปซูลโยก → แคปซูลแตก → เปิด
 */
export default function CapsuleAnim({ phase }: { phase: AnimPhase }) {
  const capsule = phase === 'crack' ? 'capsule-crack' : phase === 'done' ? 'capsule-open' : 'capsule-closed';
  return (
    <div className={`gacha-anim is-${phase}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={STICKER('gacha-machine')} alt="" className="gacha-machine" width={640} height={800} />
      {phase !== 'waiting' && phase !== 'shake' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={STICKER(capsule)} alt="" className="gacha-capsule" width={320} height={320} />
      )}
    </div>
  );
}
