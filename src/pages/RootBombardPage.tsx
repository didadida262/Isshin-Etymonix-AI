import { faCircleCheck, faGlobe, faLock, faSpinner, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
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

const TRANSLATIONS = {
  zh: {
    title: '韦林英文词根轰炸',
    startBtn: '开始轰炸',
    locked: '锁定',
    unlocked: '未解锁',
    toast: 'Unit 1 轰炸流程即将接入，当前为占位反馈。',
    lang: 'EN',
  },
  en: {
    title: 'Weilin Root Bombard',
    startBtn: 'Start Bombard',
    locked: 'LOCKED',
    unlocked: 'Not Unlocked',
    toast: 'Unit 1 bombarding process is coming soon.',
    lang: '中',
  },
} as const;

interface RootBombardPageProps {
  onStartBombard: (unitId: number) => void;
}

export function RootBombardPage({ onStartBombard }: RootBombardPageProps) {
  const [lang, setLang] = useState<'zh' | 'en'>('en');
  const t = TRANSLATIONS[lang];

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'disappearing' | 'moving' | 'whiteout'>('idle');
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
    if (!canStart || isTransitioning) return;
    setIsTransitioning(true);
    setTransitionPhase('disappearing');

    setTimeout(() => {
      setTransitionPhase('moving');
    }, 800);

    setTimeout(() => {
      setTransitionPhase('whiteout');
    }, 1800);

    setTimeout(() => {
      onStartBombard(selectedId!);
    }, 3000);
  }, [canStart, isTransitioning, onStartBombard, selectedId]);

  return (
    <div className="relative flex h-screen min-h-0 flex-col bg-zinc-950 text-zinc-100">
      <AmbientBackdrop />

      <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-zinc-950/20 px-6 py-4 backdrop-blur-md">
        <h1 className="font-display text-xl font-semibold tracking-tight text-white md:text-2xl">
          {t.title}
        </h1>

        <button
          type="button"
          onClick={() => setLang((prev) => (prev === 'zh' ? 'en' : 'zh'))}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:border-cyan-500/30 hover:bg-white/10 hover:text-white"
        >
          <FontAwesomeIcon icon={faGlobe} className="text-cyan-400" />
          <span>{t.lang}</span>
        </button>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <ul
            ref={gridRef}
            className={cn(
              'mx-auto grid max-w-6xl grid-cols-4 gap-3',
              transitionPhase === 'whiteout' && 'pointer-events-none'
            )}
          >
            {ROOT_UNITS.map((unit, index) => (
              <UnitCard
                key={unit.id}
                index={index}
                cell={cellMetrics ?? FALLBACK_CELL}
                reduceMotion={!!reduceMotion}
                unit={unit}
                translations={t}
                selected={selectedId === unit.id}
                isTransitioning={isTransitioning}
                transitionPhase={transitionPhase}
                onSelect={() => {
                  if (!unit.locked && !isTransitioning) {
                    setSelectedId((prev) => (prev === unit.id ? null : unit.id));
                  }
                }}
              />
            ))}
          </ul>
        </div>

        <footer className="relative z-10 flex h-24 shrink-0 items-center justify-center border-t border-white/[0.08] bg-zinc-950/40 px-4 backdrop-blur-xl">
          <motion.button
            type="button"
            disabled={!canStart || isTransitioning}
            onClick={handleStart}
            whileHover={canStart && !isTransitioning ? { scale: 1.02 } : undefined}
            whileTap={canStart && !isTransitioning ? { scale: 0.98 } : undefined}
            className={cn(
              'relative flex items-center justify-center gap-2 rounded-xl px-10 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300',
              canStart
                ? 'group border border-zinc-600/90 bg-gradient-to-b from-zinc-700/95 via-zinc-900 to-black text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-12px_24px_-12px_rgba(0,0,0,0.5)] hover:border-cyan-500/25 hover:text-cyan-50 hover:animate-lightning-rim'
                : 'cursor-not-allowed border border-zinc-800/90 bg-zinc-900/90 text-zinc-500 shadow-none',
              isTransitioning && 'opacity-80'
            )}
          >
            <AnimatePresence mode="wait">
              {isTransitioning ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-cyan-400" />
                  <span>Loading...</span>
                </motion.div>
              ) : (
                <motion.span
                  key="text"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  {t.startBtn}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </footer>
      </main>

      <AnimatePresence>
        {(transitionPhase === 'moving' || transitionPhase === 'whiteout') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm"
          >
            {selectedId !== null && (
              <SelectedCardCenter
                unit={ROOT_UNITS.find(u => u.id === selectedId)!}
                isWhiteout={transitionPhase === 'whiteout'}
                reduceMotion={!!reduceMotion}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transitionPhase === 'whiteout' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 z-[60] bg-white"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectedCardCenter({
  unit,
  isWhiteout,
  reduceMotion,
}: {
  unit: RootUnit;
  isWhiteout: boolean;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
      animate={{ scale: 1.2, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, duration: 1 }}
      className="relative flex h-40 w-40 flex-col items-center justify-center rounded-2xl border border-cyan-400/60 bg-gradient-to-br from-violet-900/60 via-zinc-900/90 to-cyan-900/60 shadow-[0_0_60px_-10px_rgba(34,211,238,0.5),0_0_100px_-20px_rgba(139,92,246,0.4)]"
    >
      <motion.span
        className="mb-2 text-2xl font-bold text-white"
        animate={!isWhiteout ? {
          textShadow: [
            '0 0 20px rgba(34,211,238,0.5)',
            '0 0 40px rgba(139,92,246,0.6)',
            '0 0 20px rgba(34,211,238,0.5)',
          ],
        } : { textShadow: '0 0 100px rgba(255,255,255,1)' }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {unit.label}
      </motion.span>
      <FontAwesomeIcon
        icon={faWandMagicSparkles}
        className="h-8 w-8 text-cyan-300"
      />
    </motion.div>
  );
}

/** 与底部「锁定」行同高，保证解锁/锁定卡片等高 */
const CARD_MIN_H = 'min-h-[118px] md:min-h-[124px]';

function UnitCard({
  index,
  cell,
  reduceMotion,
  unit,
  translations,
  selected,
  isTransitioning,
  transitionPhase,
  onSelect,
}: {
  index: number;
  cell: { w: number; h: number };
  reduceMotion: boolean;
  unit: RootUnit;
  translations: (typeof TRANSLATIONS)['zh' | 'en'];
  selected: boolean;
  isTransitioning: boolean;
  transitionPhase: 'idle' | 'disappearing' | 'moving' | 'whiteout';
  onSelect: () => void;
}) {
  const locked = unit.locked;
  const off = spreadOffset(index, cell);
  const stackTwist = (index % 7) * 0.9 - 2.7;

  const getOpacity = () => {
    if (!isTransitioning) return 1;
    if (transitionPhase === 'disappearing') return 0;
    if (transitionPhase === 'moving' || transitionPhase === 'whiteout') return 0;
    return 1;
  };

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
      animate={{
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        opacity: getOpacity(),
      }}
      transition={{
        type: 'spring',
        stiffness: 520,
        damping: 20,
        mass: 0.52,
        delay: reduceMotion ? 0 : index * 0.004,
        opacity: { duration: 0.8 },
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
            'cursor-not-allowed border border-zinc-600/45 bg-gradient-to-b from-zinc-800/95 to-zinc-900/98 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
          )}
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <FontAwesomeIcon
              icon={faLock}
              className="h-5 w-5 text-zinc-500"
              title={translations.unlocked}
            />
          </span>
          <span className="font-display text-sm font-medium text-zinc-400">
            {unit.label}
          </span>
          <span className="flex h-4 items-center justify-center text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {translations.locked}
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
                  scale: 1.02,
                  boxShadow: [
                    '0 0 20px -6px rgba(34,211,238,0.3)',
                    '0 0 32px -4px rgba(139,92,246,0.45)',
                    '0 0 20px -6px rgba(34,211,238,0.3)',
                  ],
                }
              : { scale: 1, boxShadow: '0 0 0 0 transparent' }
          }
          transition={
            selected
              ? {
                  scale: { type: 'spring', stiffness: 300, damping: 20 },
                  boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                }
              : { scale: { type: 'spring', stiffness: 300, damping: 20 } }
          }
          className={cn(
            'group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border px-3 py-4 text-center md:py-4',
            'outline-none transition-all duration-500',
            CARD_MIN_H,
            selected
              ? 'border-cyan-400/60 shadow-[0_0_25px_-5px_rgba(34,211,238,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] scale-[1.02]'
              : 'border-white/20 bg-white/[0.02] hover:border-cyan-400/40 hover:bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
          )}
        >
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: -45 }}
                className="absolute right-2 top-2 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white shadow-lg shadow-cyan-500/30"
              >
                <FontAwesomeIcon icon={faCircleCheck} />
              </motion.div>
            )}
          </AnimatePresence>
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl"
            aria-hidden
          >
            {/* 主色渐变底 */}
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br transition-all duration-700',
                selected
                  ? 'from-violet-800/40 via-zinc-900/90 to-cyan-900/40 opacity-100'
                  : 'from-violet-600/15 via-zinc-900/80 to-cyan-600/15 opacity-80 group-hover:opacity-100',
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
                'absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl transition-opacity duration-500',
                selected ? 'bg-cyan-400/45 opacity-100' : 'bg-cyan-500/22 opacity-60',
              )}
            />
            <div
              className={cn(
                'absolute -bottom-10 -left-8 h-32 w-32 rounded-full blur-2xl transition-opacity duration-500',
                selected ? 'bg-violet-500/50 opacity-100' : 'bg-violet-600/28 opacity-60',
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
            whileHover={!isTransitioning ? { rotate: [0, -8, 8, 0], scale: 1.08 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          >
            <FontAwesomeIcon
              icon={faWandMagicSparkles}
              className={cn(
                'h-5 w-5 transition-colors duration-300',
                selected ? 'text-cyan-300' : 'text-zinc-300 group-hover:text-cyan-200',
              )}
            />
          </motion.span>
          <span
            className={cn(
              'relative z-10 font-display text-sm font-semibold transition-colors duration-300',
              selected ? 'text-white' : 'text-zinc-200 group-hover:text-white',
            )}
          >
            {unit.label}
          </span>
          <span
            className="relative z-10 pointer-events-none flex h-4 items-center justify-center text-[10px] font-medium uppercase tracking-wider text-transparent select-none"
            aria-hidden
          >
            {translations.locked}
          </span>
        </motion.button>
      )}
    </motion.li>
  );
}
