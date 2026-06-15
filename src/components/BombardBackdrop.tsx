import { motion, useReducedMotion } from 'framer-motion';

/** 轰炸页氛围底：暖色漂移光晕，与卡牌青紫 HUD 区分 */
export function BombardBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-zinc-950" />

      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(251,191,36,0.09),transparent_58%)]"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_100%_100%,rgba(244,63,94,0.07),transparent_55%)]"
      />

      {!reduceMotion && (
        <>
          <div
            className="absolute -left-[18%] -top-[12%] h-[min(80vw,480px)] w-[min(80vw,480px)] rounded-full bg-amber-400/34 blur-[90px] animate-orb-1"
          />
          <div
            className="absolute -right-[12%] top-[18%] h-[min(68vw,420px)] w-[min(68vw,420px)] rounded-full bg-rose-500/30 blur-[100px] animate-orb-2"
          />
          <div
            className="absolute bottom-[-12%] left-[15%] h-[min(72vw,460px)] w-[min(72vw,460px)] rounded-full bg-orange-500/26 blur-[95px] animate-orb-3"
          />
          <div
            className="absolute right-[8%] bottom-[5%] h-[min(50vw,320px)] w-[min(50vw,320px)] rounded-full bg-emerald-500/22 blur-[85px] animate-ink-blob-2"
          />

          <motion.div
            className="absolute left-[10%] top-[35%] h-[min(55vw,380px)] w-[min(55vw,380px)] rounded-full bg-amber-400/28 blur-[88px]"
            animate={{
              x: [0, 120, 40, -80, 0],
              y: [0, -60, 80, 30, 0],
              scale: [1, 1.12, 0.95, 1.08, 1],
              opacity: [0.45, 0.72, 0.55, 0.68, 0.45],
            }}
            transition={{
              duration: 32,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          />
          <motion.div
            className="absolute right-[5%] top-[8%] h-[min(48vw,340px)] w-[min(48vw,340px)] rounded-full bg-rose-400/26 blur-[80px]"
            animate={{
              x: [0, -100, -30, 90, 0],
              y: [0, 50, 120, 20, 0],
              scale: [1, 0.92, 1.1, 1.02, 1],
              opacity: [0.4, 0.65, 0.5, 0.7, 0.4],
            }}
            transition={{
              duration: 38,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.28, 0.52, 0.76, 1],
            }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[min(42vw,300px)] w-[min(42vw,300px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/20 blur-[75px]"
            animate={{
              x: ['-5%', '8%', '-6%', '4%', '-5%'],
              y: ['-4%', '6%', '-8%', '5%', '-4%'],
              scale: [1, 1.15, 0.9, 1.08, 1],
              opacity: [0.35, 0.58, 0.42, 0.55, 0.35],
            }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}

      <div
        className="absolute inset-0 opacity-[0.22] bg-[radial-gradient(circle_2px_at_center,rgba(251,191,36,0.1)_1px,transparent_1px)] bg-[length:22px_22px] [mask-image:radial-gradient(ellipse_85%_75%_at_50%_45%,black_15%,transparent_72%)]"
      />

      {!reduceMotion && (
        <>
          <div
            className="absolute inset-0 bg-grid-dark bg-[length:48px_48px] opacity-[0.1] [mask-image:radial-gradient(ellipse_90%_70%_at_50%_50%,black_10%,transparent_78%)]"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
          />
          <div
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-400/22 to-transparent animate-scan opacity-55"
          />
        </>
      )}

      <div className="ambient-noise absolute inset-0 opacity-[0.14]" />
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.42)]" />
    </div>
  );
}
