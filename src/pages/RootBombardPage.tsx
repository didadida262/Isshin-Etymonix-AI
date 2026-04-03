import { faLock, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { AmbientBackdrop } from '../components/AmbientBackdrop';
import { ROOT_UNITS } from '../data/rootUnits';
import { cn } from '../lib/cn';
import type { RootUnit } from '../types/rootUnit';

const GRID_COLS = 4;
const UNIT_COUNT = ROOT_UNITS.length;
const GRID_ROWS = Math.ceil(UNIT_COUNT / GRID_COLS);

/** 未测量前用估算值，避免首帧错位过大 */
const FALLBACK_CELL = { w: 156, h: 134 };

function spreadOffset(
  index: number,
  cell: { w: number; h: number },
): { x: number; y: number } {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  const cx = (GRID_COLS - 1) / 2;
  const cy = (GRID_ROWS - 1) / 2;
  return {
    x: (cx - col) * cell.w,
    y: (cy - row) * cell.h,
  };
}

export function RootBombardPage() {
  const [selectedId, setSelectedId] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const [cellMetrics, setCellMetrics] = useState<{ w: number; h: number } | null>(
    null,
  );
  const reduceMotion = useReducedMotion();

  const canStart = selectedId === 1;

  useLayoutEffect(() => {
    const ul = gridRef.current;
    if (!ul) return;
    const li = ul.querySelector(':scope > li');
    if (!li) return;
    const r = li.getBoundingClientRect();
    const style = getComputedStyle(ul);
    const gap = parseFloat(style.rowGap || style.gap || '12') || 12;
    setCellMetrics({ w: r.width + gap, h: r.height + gap });
  }, []);

  const handleStart = useCallback(() => {
    if (!canStart) return;
    setToast('Unit 1 轰炸流程即将接入，当前为占位反馈。');
    window.setTimeout(() => setToast(null), 3200);
  }, [canStart]);

  return (
    <div className="relative flex h-screen min-h-0 flex-col bg-zinc-950 text-zinc-100">
      <AmbientBackdrop />

      <header className="relative z-10 shrink-0 border-b border-white/[0.08] bg-zinc-950/20 px-6 py-4 backdrop-blur-md">
        <h1 className="font-display text-xl font-semibold tracking-tight text-white md:text-2xl">
          韦林英文词根轰炸
        </h1>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <ul
            ref={gridRef}
            className="mx-auto grid max-w-6xl grid-cols-4 gap-3"
          >
            {ROOT_UNITS.map((unit, index) => (
              <UnitCard
                key={unit.id}
                index={index}
                cell={cellMetrics ?? FALLBACK_CELL}
                reduceMotion={!!reduceMotion}
                unit={unit}
                selected={selectedId === unit.id}
                onSelect={() => {
                  if (!unit.locked) setSelectedId(unit.id);
                }}
              />
            ))}
          </ul>
        </div>

        <footer className="relative z-10 flex h-24 shrink-0 items-center justify-center border-t border-white/[0.08] bg-zinc-950/40 px-4 backdrop-blur-xl">
          <motion.button
            type="button"
            disabled={!canStart}
            onClick={handleStart}
            whileHover={canStart ? { scale: 1.02 } : undefined}
            whileTap={canStart ? { scale: 0.98 } : undefined}
            className={cn(
              'rounded-xl px-10 py-3.5 text-sm font-semibold tracking-wide',
              canStart
                ? 'group border border-zinc-600/90 bg-gradient-to-b from-zinc-700/95 via-zinc-900 to-black text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-12px_24px_-12px_rgba(0,0,0,0.5)] transition-[color,border-color,box-shadow] duration-200 hover:border-cyan-500/25 hover:text-cyan-50 hover:animate-lightning-rim'
                : 'cursor-not-allowed border border-zinc-800/90 bg-zinc-900/90 text-zinc-500 shadow-none',
            )}
          >
            开始轰炸
          </motion.button>
        </footer>
      </main>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-28 left-1/2 z-50 max-w-md -translate-x-1/2 rounded-lg border border-white/10 bg-zinc-900/95 px-4 py-3 text-center text-sm text-zinc-200 shadow-xl backdrop-blur"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** 与底部「锁定」行同高，保证解锁/锁定卡片等高 */
const CARD_MIN_H = 'min-h-[118px] md:min-h-[124px]';

function UnitCard({
  index,
  cell,
  reduceMotion,
  unit,
  selected,
  onSelect,
}: {
  index: number;
  cell: { w: number; h: number };
  reduceMotion: boolean;
  unit: RootUnit;
  selected: boolean;
  onSelect: () => void;
}) {
  const locked = unit.locked;
  const off = spreadOffset(index, cell);
  const stackTwist = (index % 7) * 0.9 - 2.7;

  return (
    <motion.li
      initial={
        reduceMotion
          ? false
          : {
              x: off.x,
              y: off.y,
              scale: 0.48,
              rotate: stackTwist,
              opacity: 1,
            }
      }
      animate={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 520,
        damping: 20,
        mass: 0.52,
        delay: reduceMotion ? 0 : index * 0.004,
      }}
      style={{ zIndex: index }}
      className="min-w-0"
    >
      {locked ? (
        <button
          type="button"
          disabled
          className={cn(
            'group relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 text-center md:py-4',
            CARD_MIN_H,
            'cursor-not-allowed border-white/10 bg-zinc-900/82 opacity-95',
          )}
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <FontAwesomeIcon
              icon={faLock}
              className="h-5 w-5 text-zinc-600"
              title="未解锁"
            />
          </span>
          <span className="font-display text-sm font-medium text-zinc-600">
            {unit.label}
          </span>
          <span className="flex h-4 items-center justify-center text-[10px] font-medium uppercase tracking-wider text-zinc-700">
            锁定
          </span>
        </button>
      ) : (
        <motion.button
          type="button"
          onClick={onSelect}
          whileHover={{
            y: -4,
            transition: { type: 'spring', stiffness: 420, damping: 22 },
          }}
          whileTap={{ scale: 0.97 }}
          animate={
            selected
              ? {
                  boxShadow: [
                    '0 0 20px -6px rgba(34,211,238,0.25)',
                    '0 0 28px -4px rgba(139,92,246,0.35)',
                    '0 0 20px -6px rgba(34,211,238,0.25)',
                  ],
                }
              : { boxShadow: '0 0 0 0 transparent' }
          }
          transition={
            selected
              ? { boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }
              : undefined
          }
          className={cn(
            'group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border px-3 py-4 text-center md:py-4',
            CARD_MIN_H,
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
            selected
              ? 'border-cyan-400/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(34,211,238,0.12)]'
              : 'border-white/12 hover:border-violet-400/40',
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl"
            aria-hidden
          >
            {/* 主色渐变底 */}
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br transition-all duration-500',
                selected
                  ? 'from-violet-900/65 via-zinc-900/95 to-cyan-950/55'
                  : 'from-violet-950/50 via-zinc-900 to-zinc-950/98',
              )}
            />
            {/* 斜向高光层 */}
            <div
              className={cn(
                'absolute inset-0 rounded-xl opacity-80',
                selected
                  ? 'bg-[linear-gradient(155deg,rgba(255,255,255,0.09)_0%,transparent_38%,transparent_62%,rgba(34,211,238,0.08)_100%)]'
                  : 'bg-[linear-gradient(155deg,rgba(255,255,255,0.06)_0%,transparent_40%,transparent_60%,rgba(139,92,246,0.06)_100%)]',
              )}
            />
            {/* 角部光斑 */}
            <div
              className={cn(
                'absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl',
                selected ? 'bg-cyan-400/35' : 'bg-cyan-500/22',
              )}
            />
            <div
              className={cn(
                'absolute -bottom-10 -left-8 h-32 w-32 rounded-full blur-2xl',
                selected ? 'bg-violet-500/40' : 'bg-violet-600/28',
              )}
            />
            {/* 径向氛围 */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_35%_15%,rgba(139,92,246,0.28),transparent_58%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_75%_85%,rgba(34,211,238,0.18),transparent_52%)]" />
            {/* 微网格 */}
            <div
              className="absolute inset-0 opacity-[0.35] mix-blend-overlay"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
                backgroundSize: '10px 10px',
              }}
            />
            {/* 底边微光条 */}
            <div
              className={cn(
                'absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent to-transparent',
                selected
                  ? 'via-cyan-400/55'
                  : 'via-violet-400/40 group-hover:via-cyan-400/45',
              )}
            />
            {/* hover 扫光（一次） */}
            <div
              className="absolute inset-0 opacity-0 bg-[length:200%_100%] bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.18)_50%,transparent_60%)] group-hover:animate-sheen-sweep-once"
            />
          </div>
          <motion.span
            className="relative z-10 flex h-5 w-5 items-center justify-center will-change-transform"
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            <FontAwesomeIcon
              icon={faWandMagicSparkles}
              className={cn(
                'h-5 w-5 transition-colors duration-200',
                selected ? 'text-cyan-300' : 'text-zinc-500 group-hover:text-violet-300',
              )}
            />
          </motion.span>
          <span className="relative z-10 font-display text-sm font-medium text-zinc-200">
            {unit.label}
          </span>
          <span
            className="relative z-10 pointer-events-none flex h-4 items-center justify-center text-[10px] font-medium uppercase tracking-wider text-transparent select-none"
            aria-hidden
          >
            锁定
          </span>
        </motion.button>
      )}
    </motion.li>
  );
}
