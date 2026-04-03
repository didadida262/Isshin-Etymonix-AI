import { motion } from 'framer-motion';

/** 全屏氛围底：多层渐变、漂移网格、浮动光晕与噪点 */
export function AmbientBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* 基底 */}
      <div className="absolute inset-0 bg-[#050508]" />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(139,92,246,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_100%,rgba(6,182,212,0.12),transparent_50%)]" />

      {/* 浮动光球 — CSS + 一层 Framer 慢漂移 */}
      <div className="absolute -left-[20%] -top-[10%] h-[min(85vw,520px)] w-[min(85vw,520px)] rounded-full bg-violet-600/25 blur-[100px] animate-orb-1" />
      <div className="absolute -right-[15%] top-[25%] h-[min(70vw,440px)] w-[min(70vw,440px)] rounded-full bg-cyan-500/20 blur-[110px] animate-orb-2" />
      <div className="absolute bottom-[-15%] left-[20%] h-[min(75vw,480px)] w-[min(75vw,480px)] rounded-full bg-fuchsia-600/18 blur-[95px] animate-orb-3" />
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2">
        <motion.div
          className="h-[40vmin] w-[40vmin] rounded-full bg-indigo-500/15 blur-[80px]"
          animate={{
            scale: [1, 1.05, 1.03, 1],
            opacity: [0.32, 0.44, 0.4, 0.32],
            x: [0, 22, -14, 10, 0],
            y: [0, -16, 12, -8, 0],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.28, 0.52, 0.78, 1],
          }}
        />
      </div>

      {/* 漂移网格 */}
      <div className="absolute inset-0 bg-grid-dark bg-[length:48px_48px] opacity-[0.45] animate-grid-drift [mask-image:radial-gradient(ellipse_90%_70%_at_50%_45%,black_20%,transparent_75%)]" />

      {/* 顶部细线高光 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* 噪点 + 暗角 */}
      <div className="ambient-noise absolute inset-0 opacity-[0.22]" />
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.55),inset_0_0_200px_rgba(0,0,0,0.35)]" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.07]" />
    </div>
  );
}
