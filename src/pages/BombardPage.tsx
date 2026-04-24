import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { cn } from '../lib/cn';
import { loadUnitData, type RootGroup, type WordItem } from '../lib/loadUnitData';

/* ── 统一背面设计 token ── */
const BACK_CLASSES = {
  outer:
    'rounded-xl border border-cyan-500/20 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 shadow-[0_0_40px_-10px_rgba(6,182,212,0.3),inset_0_0_60px_-20px_rgba(6,182,212,0.15)]',
  pattern: 'bg-[radial-gradient(circle_2px_at_center,rgba(6,182,212,0.15)_1px,transparent_1px)] bg-[length:16px_16px]',
  emblem: 'text-cyan-400/80',
  logoContainer: 'absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-950/40 to-zinc-900/60 backdrop-blur-sm border border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]',
  logoIcon: 'text-cyan-400/80',
  glow: 'absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(6,182,212,0.12),transparent_70%)]',
};

/* ── 常量 ── */
const FLIP_OPEN_MS = 480;
const FLIP_CLOSE_MS = 380;
const REVEAL_SECONDS = 10;

/* ── 全量 word 索引（用于随机抽取） ── */
interface FlatCard {
  rootIdx: number;
  wordIdx: number;
  root: RootGroup;
  word: WordItem;
}

/* ── 工具 ── */
function pickRandom(cards: FlatCard[], exclude?: { rootIdx: number; wordIdx: number }): FlatCard {
  if (cards.length === 0) {
    throw new Error('No cards to pick');
  }
  let card: FlatCard;
  do {
    card = cards[Math.floor(Math.random() * cards.length)];
  } while (
    exclude &&
    card.rootIdx === exclude.rootIdx &&
    card.wordIdx === exclude.wordIdx
  );
  return card;
}

/* ════════════════════════════════════════
   页面主体
   ════════════════════════════════════════ */
export function BombardPage({ onBack, unitId }: { onBack: () => void; unitId: number }) {
  const reduceMotion = useReducedMotion();
  
  // 动态加载单元数据
  const [unitData, setUnitData] = useState<RootGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 使用 hook 获取所有卡片
  const allCards = useAllCards(unitData);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await loadUnitData(unitId);
        if (mounted) {
          setUnitData(data);
          
          if (data.length === 0) {
            setError(`Unit ${unitId} 数据暂未找到，请运行 \`npm run gen\` 转换 docs 文件夹中的 TXT 文件`);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(`加载 Unit ${unitId} 数据失败：${err instanceof Error ? err.message : '未知错误'}`);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [unitId]);

  /* 翻转状态：rootIdx → wordIdx → true=正面 / false=背面 */
  const [flipped, setFlipped] = useState<Record<number, Record<number, boolean>>>({});

  /* 轰炸循环 */
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<FlatCard | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(0);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  /* 性能优化：缓存 allCards */
  const getAllCards = useAllCards(unitData);
  const allCards = useMemo(() => getAllCards(), [getAllCards]);

  /* ── 清理定时器 ── */
  const clearTimers = useCallback(() => {
    clearInterval(timerRef.current);
    clearTimeout(timeoutRef.current);
  }, []);

  /* ── 翻开一张卡 ── */
  const flipOpen = useCallback((card: FlatCard) => {
    setFlipped((prev) => ({
      ...prev,
      [card.rootIdx]: { ...prev[card.rootIdx], [card.wordIdx]: true },
    }));
  }, []);

  /* ── 翻回一张卡 ── */
  const flipClose = useCallback((card: FlatCard) => {
    setFlipped((prev) => ({
      ...prev,
      [card.rootIdx]: { ...prev[card.rootIdx], [card.wordIdx]: false },
    }));
  }, []);

  /* ── 丝滑滚动到词根区 ── */
  const scrollToRoot = useCallback(
    (rootIdx: number) =>
      new Promise<void>((resolve) => {
        const el = sectionRefs.current[rootIdx];
        if (el) {
          el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
          // 等待滚动大致完成
          setTimeout(resolve, reduceMotion ? 60 : 520);
        } else {
          resolve();
        }
      }),
    [reduceMotion],
  );

  /* ── 进入下一轮 ── */
  const nextRound = useCallback(
    async (prev: FlatCard | null) => {
      const cards = getAllCards();
      if (cards.length === 0) return;
      
      // 先翻回上一张
      if (prev) flipClose(prev);

      // 短暂停顿让翻回动画播放
      await new Promise<void>((r) => setTimeout(r, FLIP_CLOSE_MS + 80));

      // 随机抽卡
      try {
        const card = pickRandom(cards, prev ?? undefined);
        setCurrent(card);

        // 滚动到对应词根
        await scrollToRoot(card.rootIdx);

        // 翻开
        flipOpen(card);

        // 开始倒计时 - 优化：使用 requestAnimationFrame 减少重渲染
        let sec = REVEAL_SECONDS;
        setCountdown(sec);
        
        clearInterval(timerRef.current);
        const startTime = Date.now();
        
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = REVEAL_SECONDS - elapsed;
          
          if (remaining <= 0) {
            clearInterval(timerRef.current);
            setCountdown(0);
          } else {
            setCountdown(remaining);
          }
        }, 1000);

        // REVEAL_SECONDS 后进入下一轮
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          nextRound(card);
        }, REVEAL_SECONDS * 1000);
      } catch (err) {
        console.error('Failed to pick card:', err);
      }
    },
    [getAllCards, flipClose, flipOpen, scrollToRoot],
  );

  /* ── 开始 / 停止 ── */
  const toggleRunning = useCallback(() => {
    if (running) {
      clearTimers();
      setRunning(false);
      setCurrent(null);
      setCountdown(0);
      // 所有卡牌翻回背面
      setFlipped({});
    } else {
      setRunning(true);
      nextRound(null);
    }
  }, [clearTimers, nextRound, running]);
  
  /* 性能优化：缓存 allCards 长度 */
  const cardsCount = allCards.length;

  /* ── 卸载清理 ── */
  useEffect(() => clearTimers, [clearTimers]);

  /* ── running 变化时取消正在进行的循环 ── */
  useEffect(() => {
    if (!running) clearTimers();
  }, [clearTimers, running]);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── 顶栏 ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.08] bg-zinc-950/70 px-6 py-3 backdrop-blur-xl">
        <h1 className="font-display text-lg font-semibold tracking-tight text-white">
          Unit {unitId} · 词根轰炸
        </h1>
        <div className="flex items-center gap-4">
          {/* 返回 */}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200"
          >
            ← 返回
          </button>

          {/* 倒计时 */}
          <AnimatePresence mode="wait">
            {running && countdown > 0 ? (
              <motion.span
                key="cd"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex h-9 min-w-[52px] items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 font-mono text-lg font-bold tabular-nums text-cyan-300"
              >
                {countdown}s
              </motion.span>
            ) : null}
          </AnimatePresence>

          {/* 开始 / 停止按钮 */}
          <button
            type="button"
            onClick={toggleRunning}
            disabled={loading || cardsCount === 0}
            className={`
              inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors
              ${
                running
                  ? 'border-red-500/40 bg-red-950/50 text-red-300 hover:bg-red-900/50'
                  : 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50'
              }
              ${(loading || cardsCount === 0) ? ' opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <FontAwesomeIcon icon={running ? faStop : faPlay} className="h-3.5 w-3.5" />
            {loading ? '加载中...' : running ? '停止' : '开始'}
          </button>
        </div>
      </header>

      {/* ── 主体内容 ── */}
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6">
        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
              <p className="text-zinc-400">正在加载 Unit {unitId} 数据...</p>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4 max-w-md text-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-red-400">加载失败</h3>
              <p className="text-zinc-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* 空数据状态 */}
        {!loading && !error && cardsCount === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <p className="text-zinc-400">Unit {unitId} 暂无单词数据</p>
              <p className="text-zinc-500 text-sm">请运行 `npm run gen` 转换 Pages 文件</p>
            </div>
          </div>
        )}

        {/* 词根列表 */}
        {!loading && !error && cardsCount > 0 && (
          unitData.map((root, ri) => (
            <div
              key={root.root}
              ref={(el) => {
                sectionRefs.current[ri] = el;
              }}
              className="scroll-mt-24"
            >
              {/* 词根标题 */}
              <div className="mb-4 group relative flex items-center gap-3">
                {/* 词根 - 突出显示 */}
                <span className="relative flex items-center">
                  {/* 发光背景 */}
                  <span className="absolute -inset-1.5 rounded-md bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-sm transition-opacity opacity-50 group-hover:opacity-100" />
                  {/* 词根文字 */}
                  <span className="relative font-display text-base font-bold tracking-widest bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                    {root.root}
                  </span>
                </span>
                
                {/* 分隔线 */}
                <div className="h-4 w-px bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                {/* 释义 - hover 时显示 */}
                <span className="text-sm text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100">
                  {root.rootMeaning}
                </span>
              </div>

              {/* 2×2 卡牌网格 */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {root.words.map((word, wi) => {
                  const isFlipped = !!flipped[ri]?.[wi];
                  const isCurrent =
                    current?.rootIdx === ri && current?.wordIdx === wi;

                  return (
                    <FlipCard
                      key={wi}
                      word={word}
                      flipped={isFlipped}
                      highlighted={isCurrent}
                      reduceMotion={!!reduceMotion}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════
   翻转卡牌组件（优化版）
   ════════════════════════════════════════ */
const FlipCard = React.memo(({
  word,
  flipped,
  highlighted,
  reduceMotion,
}: {
  word: WordItem;
  flipped: boolean;
  highlighted: boolean;
  reduceMotion: boolean;
}) => {
  const openMs = reduceMotion ? 0 : FLIP_OPEN_MS;
  const closeMs = reduceMotion ? 0 : FLIP_CLOSE_MS;

  /* 翻开 5s 后才显示释义 - 优化：使用 useMemo */
  const [showDef, setShowDef] = useState(false);
  
  useEffect(() => {
    if (!flipped) {
      setShowDef(false);
      return;
    }
    const timer = setTimeout(() => setShowDef(true), 5000);
    return () => clearTimeout(timer);
  }, [flipped]);
  
  // 性能优化：缓存样式
  const hoverScale = reduceMotion ? 1 : 1.02;
  const isHighlighted = highlighted;

  return (
    <motion.div
      className="perspective-[800px] cursor-pointer"
      style={{ perspective: '800px' }}
      whileHover={{ scale: hoverScale }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      // 性能优化：减少重绘
      shouldRender={true}
      layout={false}
    >
      <motion.div
        className="relative w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{
          duration: (flipped ? openMs : closeMs) / 1000,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* ──── 背面（统一设计） ──── */}
        <div
          className={`${BACK_CLASSES.outer} relative flex aspect-[4/3] items-center justify-center overflow-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* 动态光晕背景 - 性能优化：仅在高亮时启用 */}
          {!reduceMotion && <div className={BACK_CLASSES.glow} aria-hidden />}
          
          {/* 纹理底 - 性能优化：简化 */}
          {!reduceMotion && <div className={`absolute inset-0 ${BACK_CLASSES.pattern}`} aria-hidden />}

          {/* 中心光环装饰 - 性能优化：仅在 highlighted 时显示 */}
          {highlighted && !reduceMotion && (
            <div className="relative" aria-hidden>
              <div className="absolute -inset-10 rounded-full border border-cyan-500/10 animate-pulse" />
              <div className="absolute -inset-8 rounded-full border border-cyan-500/15" />
              <div className="absolute -inset-6 rounded-full border border-cyan-500/20 animate-glow" />
            </div>
          )}

          {/* 四角装饰 - 性能优化：简化 */}
          {!reduceMotion && (
            <>
              <div className="absolute left-4 top-4 h-4 w-4 border-l-2 border-t-2 border-cyan-500/40" aria-hidden />
              <div className="absolute right-4 top-4 h-4 w-4 border-r-2 border-t-2 border-cyan-500/40" aria-hidden />
              <div className="absolute bottom-4 left-4 h-4 w-4 border-b-2 border-l-2 border-cyan-500/40" aria-hidden />
              <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-cyan-500/40" aria-hidden />
            </>
          )}
          
          {/* 扫描线动画 - 性能优化：仅在高亮时显示 */}
          {highlighted && !reduceMotion && (
            <>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan" aria-hidden />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-scan" aria-hidden />
            </>
          )}
        </div>

        {/* ──── 正面 ──── */}
        <div
          className={cn(
            'absolute inset-0 flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border overflow-hidden',
            highlighted
              ? 'border-cyan-400/50 bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950/50 shadow-[0_0_28px_-6px_rgba(34,211,238,0.45)]'
              : 'border-white/10 bg-gradient-to-br from-zinc-800/95 via-zinc-900 to-black'
          )}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* 单词 */}
          <span className="font-display text-xl font-bold text-white">
            {word.word}
          </span>
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          {/* 拆解释义 - 翻开后 5s 淡入 */}
          <motion.span
            className="max-w-[85%] text-center text-sm leading-relaxed text-zinc-300"
            initial={{ opacity: 0, y: 4 }}
            animate={showDef ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {word.definition}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}
