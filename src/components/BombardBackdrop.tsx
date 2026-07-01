import { useReducedMotion } from 'framer-motion';

/** 轰炸页氛围底：单层霓虹网格 + 交点光点 + 扫描线 */
export function BombardBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#020508]" />

      {/* 环境光 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(6,182,212,0.14),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_0%_50%,rgba(139,92,246,0.1),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_35%_at_50%_100%,rgba(6,182,212,0.07),transparent_58%)]" />

      {/* 唯一线格层 + 交点光点（同 32px 步进，不叠线） */}
      <div
        className={
          reduceMotion
            ? 'bombard-grid-primary absolute inset-0'
            : 'bombard-grid-primary bombard-grid-primary--animated absolute inset-0'
        }
      />
      <div
        className={
          reduceMotion
            ? 'bombard-grid-nodes absolute inset-0'
            : 'bombard-grid-nodes bombard-grid-primary--animated absolute inset-0'
        }
      />

      {!reduceMotion && (
        <div className="bombard-grid-scan-band absolute inset-x-0 top-0 h-[16%]" />
      )}

      <div className="ambient-noise absolute inset-0 opacity-[0.08]" />
      <div className="absolute inset-0 shadow-[inset_0_80px_80px_-40px_rgba(0,0,0,0.35),inset_80px_0_80px_-40px_rgba(0,0,0,0.28),inset_-80px_0_80px_-40px_rgba(0,0,0,0.28)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
    </div>
  );
}
