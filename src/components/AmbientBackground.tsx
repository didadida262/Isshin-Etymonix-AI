/**
 * 全站背景：渐变底色 + 漂移网格 + 柔光色块 + 轻噪点（pointer-events: none）
 */
export function AmbientBackground() {
  return (
    <div
      className="ambient-bg pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* 深色：径向氛围；浅色：顶部柔光 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(139,92,246,0.14),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(139,92,246,0.22),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_50%,rgba(6,182,212,0.08),transparent_45%)] dark:bg-[radial-gradient(ellipse_70%_45%_at_100%_40%,rgba(34,211,238,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_0%_80%,rgba(217,70,239,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_55%_35%_at_0%_90%,rgba(217,70,239,0.1),transparent_55%)]" />

      {/* 漂移网格 */}
      <div className="absolute inset-0 bg-[length:24px_24px] bg-grid-light opacity-60 motion-reduce:animate-none animate-grid-drift dark:bg-grid-dark dark:opacity-[0.45]" />

      {/* 柔光 blob（缓慢位移由 animation 驱动） */}
      <div className="absolute -left-[20%] -top-[10%] h-[min(90vw,720px)] w-[min(90vw,720px)] rounded-full bg-violet-500/[0.12] blur-[100px] motion-reduce:animate-none animate-orb-1 dark:bg-violet-500/[0.18] dark:blur-[120px]" />
      <div className="absolute -right-[15%] top-[25%] h-[min(70vw,560px)] w-[min(70vw,560px)] rounded-full bg-cyan-500/[0.1] blur-[90px] motion-reduce:animate-none animate-orb-2 dark:bg-cyan-400/[0.14] dark:blur-[110px]" />
      <div className="absolute bottom-[-10%] left-[20%] h-[min(60vw,480px)] w-[min(60vw,480px)] rounded-full bg-fuchsia-500/[0.08] blur-[100px] motion-reduce:animate-none animate-orb-3 dark:bg-fuchsia-500/[0.12] dark:blur-[115px]" />

      {/* 细扫描高光（极淡） */}
      <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_42%,rgba(255,255,255,0.02)_50%,transparent_58%)] dark:bg-[linear-gradient(105deg,transparent_42%,rgba(167,139,250,0.04)_50%,transparent_58%)] motion-reduce:animate-none animate-sheen" />

      {/* 噪点贴图 */}
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay dark:opacity-[0.22] dark:mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* 底部压暗，托住内容 */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-transparent to-transparent dark:from-zinc-950/90" />
    </div>
  );
}
