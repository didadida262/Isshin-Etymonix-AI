import { faGlobe, faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BombardBackdrop } from '../components/BombardBackdrop';
import { BombardCardAuras } from '../components/BombardCardAuras';
import { FinaleOverlay } from '../components/FinaleOverlay';
import { SettingsButton } from '../components/SettingsButton';
import { UserMenu } from '../components/UserMenu';
import brainLogoUrl from '../assets/brain.png';
import logoUrl from '../assets/logo_Isshin-Etymonix-AI.png';
import { MAX_ROUNDS, useGameSession } from '../context/GameSessionContext';
import { useAppLanguage } from '../context/AppLanguageContext';
import { useSettingsModal } from '../context/SettingsModalContext';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import {
  CARD_CENTER_MOVE_MS,
  CARD_SCROLL_SETTLE_MS,
  cardRefKey,
  computeCardFocusTransform,
  type CardFocusTransform,
} from '../lib/cardFocusLayout';
import { cn } from '../lib/cn';
import { loadUnitData, type RootGroup, type WordItem } from '../lib/loadUnitData';

/* ── 卡牌：竖版 2:3，卡背参考图二 ── */
const CARD_ASPECT = 'aspect-[2/3]';

const CARD_BASE =
  'relative w-full overflow-hidden rounded-xl border border-cyan-400/35 bg-[#050a0f] shadow-[0_0_18px_rgba(0,242,255,0.12)]';

const CARD_DOT_GRID =
  'absolute inset-0 bg-[radial-gradient(circle_1px_at_center,rgba(26,58,82,0.9)_1px,transparent_1px)] bg-[length:18px_18px]';

const CARD_BRACKET =
  'pointer-events-none absolute h-4 w-4 border-cyan-400/80 shadow-[0_0_8px_rgba(0,242,255,0.5)]';

function cardHighlightClass(highlighted: boolean, hovered?: boolean) {
  if (highlighted) {
    return 'border-cyan-400/60 shadow-[0_0_28px_rgba(0,242,255,0.38)]';
  }
  if (hovered) {
    return 'group-hover/card:border-cyan-400/50 group-hover/card:shadow-[0_0_24px_rgba(0,242,255,0.28)]';
  }
  return '';
}

function CardFrame({
  highlighted,
  showHover,
  children,
  className,
  style,
  fill,
}: {
  highlighted: boolean;
  showHover?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** 翻转正面：铺满容器，不再单独设 aspect */
  fill?: boolean;
}) {
  return (
    <div
      className={cn(
        CARD_BASE,
        !fill && CARD_ASPECT,
        'transition-[border-color,box-shadow] duration-300',
        cardHighlightClass(highlighted, showHover),
        className
      )}
      style={style}
    >
      <div className={CARD_DOT_GRID} aria-hidden />
      <div className={cn(CARD_BRACKET, 'left-3 top-3 border-l-2 border-t-2')} aria-hidden />
      <div className={cn(CARD_BRACKET, 'right-3 top-3 border-r-2 border-t-2')} aria-hidden />
      <div className={cn(CARD_BRACKET, 'bottom-3 left-3 border-b-2 border-l-2')} aria-hidden />
      <div className={cn(CARD_BRACKET, 'bottom-3 right-3 border-b-2 border-r-2')} aria-hidden />
      {children}
    </div>
  );
}

/* ── 常量 ── */
const FLIP_OPEN_MS = 480;
const FLIP_CLOSE_MS = 380;
const REVEAL_SECONDS = 30;
/** 卡片翻开后，延迟多久显示释义 */
const DEFINITION_REVEAL_MS = 20_000;

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

const BOMBARD_UI = {
  zh: {
    titleSuffix: '词根斩',
    revealAll: '全开',
    restore: '还原',
    back: '← 返回',
    backShort: '←',
    start: '开始轰炸',
    stop: '停止轰炸',
    startShort: '开始',
    stopShort: '停止',
    loading: '加载中...',
    loadingShort: '…',
  },
  en: {
    titleSuffix: 'Root Zhan',
    revealAll: 'Reveal all',
    restore: 'Restore',
    back: '← Back',
    backShort: '←',
    start: 'Start Bombard',
    stop: 'Stop Bombard',
    startShort: 'Start',
    stopShort: 'Stop',
    loading: 'Loading…',
    loadingShort: '…',
  },
} as const;

const STOP_BTN_CLASSES =
  'border-amber-400/50 bg-gradient-to-b from-amber-900/75 to-amber-950/90 text-amber-50 shadow-[0_0_28px_-6px_rgba(251,191,36,0.45)] hover:from-amber-800/80 hover:to-amber-900/90';

/* ════════════════════════════════════════
   页面主体
   ════════════════════════════════════════ */
export function BombardPage({ onBack, unitId }: { onBack: () => void; unitId: number }) {
  const reduceMotion = useReducedMotion();
  const { openSettings } = useSettingsModal();
  const { lang, toggleLang } = useAppLanguage();
  const ui = BOMBARD_UI[lang];
  const game = useGameSession();
  const roundRef = useRef(0);
  const currentRef = useRef<FlatCard | null>(null);
  
  // 动态加载单元数据
  const [unitData, setUnitData] = useState<RootGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  /** 临时测试：一键全开 / 还原背面 */
  const [testRevealAll, setTestRevealAll] = useState(false);

  /* 轰炸循环 */
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<FlatCard | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const wasJudgingRef = useRef(false);
  const pausedCountdownRef = useRef(0);
  const [activeCardTransform, setActiveCardTransform] = useState<
    ({ key: string } & CardFocusTransform) | null
  >(null);
  
  /* 性能优化：缓存 allCards */
  const allCards = useMemo(() => {
    return unitData.flatMap((root, ri) =>
      root.words.map((word, wi) => ({ rootIdx: ri, wordIdx: wi, root, word })),
    );
  }, [unitData]);

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
  const toggleTestRevealAll = useCallback(() => {
    setTestRevealAll((prev) => {
      if (prev) setFlipped({});
      return !prev;
    });
  }, []);

  const flipClose = useCallback((card: FlatCard) => {
    setFlipped((prev) => ({
      ...prev,
      [card.rootIdx]: { ...prev[card.rootIdx], [card.wordIdx]: false },
    }));
  }, []);

  const settleAfterScroll = useCallback(
    () =>
      new Promise<void>((resolve) => {
        if (reduceMotion) {
          resolve();
          return;
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 40);
          });
        });
      }),
    [reduceMotion]
  );

  /* ── 滚动到当前卡牌 ── */
  const scrollToCard = useCallback(
    (card: FlatCard) =>
      new Promise<void>((resolve) => {
        const el = cardRefs.current.get(cardRefKey(card.rootIdx, card.wordIdx));
        if (el) {
          el.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'center',
            inline: 'nearest',
          });
          setTimeout(resolve, reduceMotion ? 60 : CARD_SCROLL_SETTLE_MS);
          return;
        }
        const section = sectionRefs.current[card.rootIdx];
        if (section) {
          section.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'center',
          });
          setTimeout(resolve, reduceMotion ? 60 : CARD_SCROLL_SETTLE_MS);
          return;
        }
        resolve();
      }),
    [reduceMotion]
  );

  /* ── 将当前卡牌动画移至可视区中央（避开底部判官面板） ── */
  const centerCardInView = useCallback(
    (card: FlatCard) =>
      new Promise<void>((resolve) => {
        const key = cardRefKey(card.rootIdx, card.wordIdx);
        const el = cardRefs.current.get(key);
        if (!el) {
          resolve();
          return;
        }
        const { x, y, scale } = computeCardFocusTransform(el);
        if (reduceMotion) {
          setActiveCardTransform({ key, x, y, scale });
          resolve();
          return;
        }
        setActiveCardTransform({ key, x, y, scale });
        setTimeout(resolve, CARD_CENTER_MOVE_MS);
      }),
    [reduceMotion]
  );

  /* ── 进入下一轮 ── */
  const nextRound = useCallback(
    async (prev: FlatCard | null) => {
      if (allCards.length === 0) return;

      if (prev) {
        setActiveCardTransform(null);
        flipClose(prev);
      }
      await new Promise<void>((r) => setTimeout(r, FLIP_CLOSE_MS + 80));

      const nextRoundNum = roundRef.current + 1;
      if (nextRoundNum > MAX_ROUNDS) {
        clearTimers();
        setRunning(false);
        setCountdown(0);
        setCurrent(null);
        setActiveCardTransform(null);
        setFlipped({});
        game.completeSession();
        return;
      }

      try {
        const card = pickRandom(allCards, prev ?? undefined);
        roundRef.current = nextRoundNum;
        setCurrent(card);

        game.beginRound(
          {
            word: card.word.word,
            definition: card.word.definition,
            root: card.root.root,
            rootMeaning: card.root.meaning,
          },
          nextRoundNum
        );

        await new Promise<void>((r) => {
          requestAnimationFrame(() => requestAnimationFrame(() => r()));
        });

        await scrollToCard(card);
        await settleAfterScroll();
        await centerCardInView(card);
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
    [
      allCards,
      centerCardInView,
      clearTimers,
      flipClose,
      flipOpen,
      game,
      scrollToCard,
      settleAfterScroll,
    ],
  );

  /* ── 开始 / 停止 ── */
  const toggleRunning = useCallback(() => {
    if (running) {
      clearTimers();
      setRunning(false);
      setCurrent(null);
      setActiveCardTransform(null);
      setCountdown(0);
      setFlipped({});
      roundRef.current = 0;
      game.stopSession();
    } else {
      roundRef.current = 0;
      game.startSession();
      setRunning(true);
      nextRound(null);
    }
  }, [clearTimers, game, nextRound, running]);
  
  /* 性能优化：缓存 allCards 长度 */
  const cardsCount = allCards.length;

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const advanceAfterVerdict = useCallback(() => {
    if (!running) return;
    clearTimers();
    setCountdown(0);
    void nextRound(currentRef.current);
  }, [running, clearTimers, nextRound]);

  useEffect(() => {
    game.registerAdvanceRound(advanceAfterVerdict);
    return () => game.unregisterAdvanceRound();
  }, [game, advanceAfterVerdict]);

  /** 阅卷中暂停倒计时；阅卷失败且仍可提交时恢复剩余时间 */
  useEffect(() => {
    if (!running) {
      wasJudgingRef.current = game.isJudging;
      return;
    }

    if (game.isJudging && !wasJudgingRef.current) {
      pausedCountdownRef.current = countdown;
      clearInterval(timerRef.current);
      clearTimeout(timeoutRef.current);
    } else if (!game.isJudging && wasJudgingRef.current) {
      if (game.canJudge && pausedCountdownRef.current > 0) {
        const remaining = pausedCountdownRef.current;
        setCountdown(remaining);
        const startTime = Date.now();
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const left = remaining - elapsed;
          if (left <= 0) {
            clearInterval(timerRef.current);
            setCountdown(0);
          } else {
            setCountdown(left);
          }
        }, 1000);
        timeoutRef.current = setTimeout(() => {
          void nextRound(currentRef.current);
        }, remaining * 1000);
      }
    }

    wasJudgingRef.current = game.isJudging;
  }, [game.isJudging, game.canJudge, running, countdown, nextRound]);

  /* ── 卸载清理 ── */
  useEffect(() => clearTimers, [clearTimers]);

  /* ── running 变化时取消正在进行的循环 ── */
  useEffect(() => {
    if (!running) clearTimers();
  }, [clearTimers, running]);

  const countdownWarning = running && countdown > 0 && countdown <= 10;
  const countdownUrgency = countdownWarning ? 11 - countdown : 0;
  const showFocusBackdrop = running && !!current && !!activeCardTransform;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <BombardBackdrop />

      {/* ── 顶栏 ── */}
      <FinaleOverlay />

      <header className="relative z-40 sticky top-0 grid min-h-[3.5rem] grid-cols-[1fr_auto_1fr] items-center border-b border-white/[0.08] bg-zinc-950/70 px-3 py-3 backdrop-blur-xl md:min-h-[4rem] md:px-6 md:py-3.5">
          <div className="flex min-w-0 items-center justify-self-start gap-2.5 md:gap-3">
            <img src={logoUrl} alt="" className="hidden h-11 shrink-0 rounded-lg border border-white/15 bg-white object-contain shadow-sm shadow-black/20 md:h-12 sm:block" />
            <img src={logoUrl} alt="" className="h-10 shrink-0 rounded-lg border border-white/15 bg-white object-contain shadow-sm shadow-black/20 sm:hidden" />
            <h1 className="min-w-0 font-display text-sm font-semibold tracking-tight text-white md:text-lg">
              <span className="hidden md:inline">
                Unit {unitId} · {ui.titleSuffix}
              </span>
              <span className="md:hidden">Unit {unitId}</span>
            </h1>
          </div>

          <div className="flex items-center justify-center gap-2.5 md:gap-3">
            <div
              className={cn(
                'relative flex h-11 shrink-0 items-center justify-center overflow-visible transition-[width] duration-200 md:h-12',
                running
                  ? countdownWarning
                    ? 'w-[4.75rem] md:w-[5.25rem]'
                    : 'w-[4.25rem] md:w-[4.75rem]'
                  : 'w-0 overflow-hidden'
              )}
              aria-hidden={!running}
            >
              <AnimatePresence mode="wait">
                {running && countdown > 0 ? (
                  <motion.span
                    key={countdownWarning ? `warn-${countdown}` : 'cd'}
                    initial={
                      countdownWarning
                        ? { opacity: 0.7, scale: 1.14 }
                        : { opacity: 0, scale: 0.92 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={
                      countdownWarning
                        ? { type: 'spring', stiffness: 520, damping: 22 }
                        : { duration: 0.2 }
                    }
                    className={cn(
                      'relative inline-flex h-11 w-full items-center justify-center rounded-xl border font-mono font-bold tabular-nums tracking-wide md:h-12',
                      countdownWarning
                        ? cn(
                            'animate-countdown-warning-tick',
                            'border-red-400/60 bg-gradient-to-b from-red-800/90 to-red-950/95 text-red-50',
                            'shadow-[0_0_32px_-4px_rgba(248,113,113,0.65)]',
                            countdownUrgency >= 7 && 'text-2xl md:text-3xl',
                            countdownUrgency >= 4 &&
                              countdownUrgency < 7 &&
                              'text-xl md:text-2xl',
                            countdownUrgency < 4 && 'text-lg md:text-xl'
                          )
                        : cn(
                            'border-cyan-400/50 bg-gradient-to-b from-cyan-800/70 to-cyan-950/95 text-cyan-50',
                            'text-lg shadow-[0_0_28px_-6px_rgba(34,211,238,0.55)] md:text-xl'
                          )
                    )}
                  >
                    {countdownWarning && (
                      <span
                        className="pointer-events-none absolute inset-0 rounded-xl bg-red-500/20 animate-countdown-warning-glow"
                        aria-hidden
                      />
                    )}
                    <span className="relative">{countdown}s</span>
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={toggleRunning}
              disabled={loading || cardsCount === 0}
              className={cn(
                'inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3.5',
                'text-sm font-semibold tracking-wide transition-all md:h-12 md:min-w-[7.5rem] md:gap-2 md:px-6 md:text-base',
                running ? STOP_BTN_CLASSES : 'border-emerald-400/50 bg-gradient-to-b from-emerald-800/70 to-emerald-950/90 text-emerald-50 shadow-[0_0_28px_-6px_rgba(52,211,153,0.5)] hover:from-emerald-700/75 hover:to-emerald-900/90',
                !running && 'min-w-[6rem] md:min-w-[9.5rem]',
                running && 'min-w-[5.5rem] md:min-w-[7.5rem]',
                (loading || cardsCount === 0) && 'cursor-not-allowed opacity-50'
              )}
            >
              <FontAwesomeIcon
                icon={running ? faStop : faPlay}
                className="h-3.5 w-3.5 md:h-4 md:w-4"
              />
              <span className="hidden sm:inline">
                {loading ? ui.loading : running ? ui.stop : ui.start}
              </span>
              <span className="sm:hidden">
                {loading ? ui.loadingShort : running ? ui.stopShort : ui.startShort}
              </span>
            </button>
          </div>

          <div className="flex min-w-0 items-center justify-self-end gap-2.5 md:gap-3.5">
          {!running && (
          <>
            <button
              type="button"
              onClick={toggleTestRevealAll}
              disabled={loading || cardsCount === 0}
              title={testRevealAll ? '恢复所有卡片为背面' : '临时测试：翻开全部单词牌'}
              className={cn(
                'inline-flex h-10 min-w-[3rem] items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors md:h-11 md:px-3.5 md:text-sm',
                testRevealAll
                  ? 'border-amber-500/40 bg-amber-950/50 text-amber-300 hover:bg-amber-900/40'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200',
                (loading || cardsCount === 0) && 'cursor-not-allowed opacity-50'
              )}
            >
              {testRevealAll ? ui.restore : ui.revealAll}
            </button>
            <button
              type="button"
              onClick={toggleLang}
              title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
              aria-label={lang === 'zh' ? 'Switch to English (EN)' : '切换到中文 (中)'}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:border-cyan-500/30 hover:bg-white/10 hover:text-cyan-300 md:h-11 md:w-11"
            >
              <FontAwesomeIcon icon={faGlobe} className="h-4 w-4 text-cyan-400" />
            </button>
            <SettingsButton onClick={openSettings} className="h-10 w-10 md:h-11 md:w-11" />
            <UserMenu />
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-200 md:h-11 md:px-4 md:text-sm"
            >
              <span className="hidden sm:inline">{ui.back}</span>
              <span className="sm:hidden">{ui.backShort}</span>
            </button>
          </>
          )}
          </div>
      </header>

      {/* ── 主体内容 ── */}
      <main className="relative z-10 mx-auto max-w-6xl space-y-10 px-3 py-6 pb-10 sm:space-y-12 sm:px-4 sm:py-10 sm:pb-12 md:space-y-14 md:px-6 md:py-12 md:pb-16">
        <BombardCardAuras />
        <div className="relative z-10">
        <AnimatePresence>
          {showFocusBackdrop && (
            <motion.div
              key="card-focus-backdrop"
              className="pointer-events-auto fixed inset-0 z-[15] bg-zinc-950/60 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              aria-hidden
            />
          )}
        </AnimatePresence>
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
              className="scroll-mt-32 md:scroll-mt-36"
            >
              {/* 词根标题 */}
              <div className="mb-4 sm:mb-5 group relative flex items-center gap-2 sm:gap-3">
                {/* 词根 - 突出显示 */}
                <span className="relative flex items-center">
                  {/* 发光背景 */}
                  <span className="absolute -inset-1.5 rounded-md bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-sm transition-opacity opacity-50 group-hover:opacity-100" />
                  {/* 词根文字 */}
                  <span className="relative font-display text-sm font-bold tracking-widest bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(6,182,212,0.4)] sm:text-base">
                    {root.root}
                  </span>
                </span>
                
                {/* 分隔线 */}
                <div className="h-4 w-px bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                
                {/* 释义 - hover 时显示 / 移动端始终显示（空间允许时） */}
                <span className="text-xs text-zinc-500 opacity-100 transition-opacity sm:text-sm sm:opacity-0 sm:group-hover:opacity-100">
                  {root.meaning}
                </span>
              </div>

              {/* 2×2 卡牌网格 */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
                {root.words.map((word, wi) => {
                  const isFlipped = testRevealAll || !!flipped[ri]?.[wi];
                  const isCurrent =
                    current?.rootIdx === ri && current?.wordIdx === wi;
                  const key = cardRefKey(ri, wi);
                  const focusOffset =
                    isCurrent && activeCardTransform?.key === key
                      ? {
                          x: activeCardTransform.x,
                          y: activeCardTransform.y,
                          scale: activeCardTransform.scale,
                        }
                      : undefined;

                  return (
                    <FlipCard
                      key={wi}
                      ref={(el) => {
                        if (el) cardRefs.current.set(key, el);
                        else cardRefs.current.delete(key);
                      }}
                      word={word}
                      flipped={isFlipped}
                      highlighted={isCurrent}
                      focusOffset={focusOffset}
                      reduceMotion={!!reduceMotion}
                      immediateDefinition={testRevealAll}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
        </div>
      </main>
    </div>
  );
}

/* ════════════════════════════════════════
   翻转卡牌
   ════════════════════════════════════════ */

interface FlipCardProps {
  word: WordItem;
  flipped: boolean;
  highlighted: boolean;
  focusOffset?: { x: number; y: number; scale: number };
  reduceMotion: boolean;
  /** 全开测试时立即显示释义，不等待 20s */
  immediateDefinition?: boolean;
}

const FlipCard = React.memo(
  React.forwardRef<HTMLDivElement, FlipCardProps>(function FlipCard(
    {
      word,
      flipped,
      highlighted,
      focusOffset,
      reduceMotion,
      immediateDefinition = false,
    },
    ref
  ) {
  const openMs = reduceMotion ? 0 : FLIP_OPEN_MS;
  const closeMs = reduceMotion ? 0 : FLIP_CLOSE_MS;

  /* 翻开 20s 后才显示释义 */
  const [showDef, setShowDef] = useState(false);
  
  useEffect(() => {
    if (!flipped) {
      setShowDef(false);
      return;
    }
    if (immediateDefinition) {
      setShowDef(true);
      return;
    }
    const timer = setTimeout(() => setShowDef(true), DEFINITION_REVEAL_MS);
    return () => clearTimeout(timer);
  }, [flipped, immediateDefinition]);
  
  // 性能优化：缓存样式
  const hoverScale = reduceMotion ? 1 : 1.02;

  const isFocused = !!focusOffset;
  const centerTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 280, damping: 30 };

  return (
    <motion.div
      ref={ref}
      className={cn(
        'perspective-[800px] cursor-pointer group/card',
        isFocused && 'relative z-[25]'
      )}
      style={{ perspective: '800px', transformOrigin: 'center center' }}
      animate={{
        x: focusOffset?.x ?? 0,
        y: focusOffset?.y ?? 0,
        scale: focusOffset?.scale ?? 1,
      }}
      transition={centerTransition}
      whileHover={isFocused ? undefined : { scale: hoverScale }}
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
        {/* 背面：点阵底 + 角标 + brain logo */}
        <CardFrame
          highlighted={highlighted}
          showHover={!isFocused}
          className="flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img
            src={brainLogoUrl}
            alt=""
            className="relative z-10 h-[78%] w-[78%] object-contain drop-shadow-[0_0_24px_rgba(0,229,255,0.35)]"
            draggable={false}
          />
        </CardFrame>

        {/* 正面：单词 + 释义 */}
        <CardFrame
          highlighted={highlighted}
          fill
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="relative z-10 flex h-full min-h-0 flex-col px-4 pb-6 pt-7">
            <div className="shrink-0 text-center">
              <span className="font-display text-lg font-bold break-words text-white drop-shadow-[0_0_10px_rgba(0,242,255,0.3)] md:text-xl">
                {word.word}
              </span>
              <div className="mx-auto mt-2 h-px w-16 bg-gradient-to-r from-transparent via-amber-400/65 to-transparent" />
            </div>

            <motion.div
              className="mt-4 flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0 }}
              animate={showDef ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: immediateDefinition ? 0.2 : 0.5, ease: 'easeOut' }}
            >
              <div
                className={cn(
                  'scrollbar-chat min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-1',
                  !showDef && 'pointer-events-none'
                )}
                title={word.definition}
              >
                <p className="pb-2 text-center text-sm leading-relaxed break-words text-cyan-100/95 md:text-base">
                  {word.definition}
                </p>
              </div>
            </motion.div>
          </div>
        </CardFrame>
      </motion.div>
    </motion.div>
  );
  })
);
