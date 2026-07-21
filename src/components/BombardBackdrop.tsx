import { useReducedMotion } from 'framer-motion';

/** 轰炸页 Web3 暗色氛围：极光光晕 + 斜向光束（无节点连线） */
export function BombardBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* 深空底色 */}
      <div className="absolute inset-0 bg-[#03050a]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#05070e] to-[#020308]" />

      {/* 漂移极光光晕 */}
      <div
        className={
          reduceMotion
            ? 'bombard-aurora bombard-aurora--a absolute -left-[20%] -top-[25%] h-[70%] w-[70%] opacity-70'
            : 'bombard-aurora bombard-aurora--a bombard-aurora--drift-a absolute -left-[20%] -top-[25%] h-[70%] w-[70%]'
        }
      />
      <div
        className={
          reduceMotion
            ? 'bombard-aurora bombard-aurora--b absolute -right-[15%] top-[10%] h-[60%] w-[55%] opacity-60'
            : 'bombard-aurora bombard-aurora--b bombard-aurora--drift-b absolute -right-[15%] top-[10%] h-[60%] w-[55%]'
        }
      />
      <div
        className={
          reduceMotion
            ? 'bombard-aurora bombard-aurora--c absolute bottom-[-20%] left-[20%] h-[55%] w-[60%] opacity-50'
            : 'bombard-aurora bombard-aurora--c bombard-aurora--drift-c absolute bottom-[-20%] left-[20%] h-[55%] w-[60%]'
        }
      />

      {/* 斜向光束 */}
      {!reduceMotion && <div className="bombard-beam absolute inset-0" />}

      <div className="ambient-noise absolute inset-0 opacity-[0.06]" />
      <div className="absolute inset-0 shadow-[inset_0_100px_100px_-50px_rgba(0,0,0,0.55),inset_0_-80px_80px_-40px_rgba(0,0,0,0.45),inset_80px_0_90px_-50px_rgba(0,0,0,0.35),inset_-80px_0_90px_-50px_rgba(0,0,0,0.35)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
    </div>
  );
}
