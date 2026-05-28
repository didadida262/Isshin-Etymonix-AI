import { faArrowUp, faChevronDown, faChevronUp, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameSessionOptional } from '../context/GameSessionContext';
import { useLlmSettings } from '../context/LlmSettingsContext';
import { fetchModels, sendChatStream, sendJudge, type ChatMessagePayload } from '../lib/api';
import { Scoreboard } from './Scoreboard';
import { cn } from '../lib/cn';

const POS_STORAGE_KEY = 'chat-panel-position';
const VIEWPORT_MARGIN = 20;
const MOBILE_INSET = 8;
const MOBILE_BREAKPOINT = 768;
/** 初次加载默认位置：顶栏下方、右侧（与轰炸页顶栏高度对齐） */
const DEFAULT_COLLAPSED_TOP = 72;
const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 480;
const COLLAPSED_WIDTH = 300;
const COLLAPSED_HEIGHT = 40;
const PANEL_RADIUS = 12;
const COLLAPSED_RADIUS = 8;

const panelTransition = { type: 'spring' as const, stiffness: 360, damping: 30 };

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

let idCounter = 0;

function ModelTag({
  model,
  loading,
  collapsed,
}: {
  model: string;
  loading: boolean;
  collapsed: boolean;
}) {
  const label = loading ? '检测中' : model.trim() || '未配置';
  const title = model.trim()
    ? `当前模型：${model}（在设置中切换）`
    : '请在设置中配置并选择模型';

  return (
    <span
      className={cn(
        'inline-flex min-w-0 shrink items-center gap-1.5 rounded-md border',
        'border-cyan-400/25 bg-gradient-to-r from-cyan-500/[0.12] via-indigo-500/10 to-violet-500/[0.12]',
        'font-mono font-medium text-cyan-100/90',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_18px_-6px_rgba(34,211,238,0.45)]',
        'ml-auto backdrop-blur-sm',
        collapsed ? 'max-w-[9.5rem] px-2 py-1 text-xs' : 'max-w-[12rem] px-2.5 py-1 text-sm'
      )}
      title={title}
    >
      <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping" />
        <span className="relative h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
      </span>
      <span className="truncate leading-tight">{label}</span>
    </span>
  );
}

export function ChatPanel() {
  const { settings, updateSettings } = useLlmSettings();
  const game = useGameSessionOptional();
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT
  );
  const [collapsed, setCollapsed] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [llmConnected, setLlmConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mobileExpandedHeight, setMobileExpandedHeight] = useState(() =>
    Math.max(300, Math.min(Math.round(window.innerHeight * 0.62), 520))
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragActiveRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const dragRafRef = useRef(0);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const DRAG_THRESHOLD_PX = 4;

  const clampPosition = useCallback(
    (x: number, y: number, size?: { width: number; height: number }) => {
      const el = cardRef.current;
      const w = size?.width ?? el?.offsetWidth ?? PANEL_WIDTH;
      const h = size?.height ?? el?.offsetHeight ?? PANEL_HEIGHT;
      const margin = isMobile ? MOBILE_INSET : VIEWPORT_MARGIN;
      return {
        x: Math.max(margin, Math.min(x, window.innerWidth - w - margin)),
        y: Math.max(margin, Math.min(y, window.innerHeight - h - margin)),
      };
    },
    [isMobile]
  );

  const clampPositionForCollapsed = useCallback(
    (x: number, y: number, isCollapsed: boolean) =>
      clampPosition(x, y, {
        width: isCollapsed ? COLLAPSED_WIDTH : PANEL_WIDTH,
        height: isCollapsed ? COLLAPSED_HEIGHT : PANEL_HEIGHT,
      }),
    [clampPosition]
  );

  const initPosition = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    const saved = localStorage.getItem(POS_STORAGE_KEY);
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved) as { x: number; y: number };
        if (typeof x === 'number' && typeof y === 'number') {
          setPosition(clampPositionForCollapsed(x, y, collapsed));
          return;
        }
      } catch {
        /* ignore */
      }
    }
    setPosition(
      clampPositionForCollapsed(
        window.innerWidth - COLLAPSED_WIDTH - (isMobile ? MOBILE_INSET : VIEWPORT_MARGIN),
        DEFAULT_COLLAPSED_TOP,
        collapsed
      )
    );
  }, [clampPositionForCollapsed, collapsed, isMobile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => initPosition());
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      setMobileExpandedHeight(
        Math.max(300, Math.min(Math.round(window.innerHeight * 0.62), 520))
      );
      setPosition((p) => (p ? clampPosition(p.x, p.y) : p));
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [initPosition, clampPosition]);

  useEffect(() => {
    if (isMobile) return;
    if (isDraggingRef.current || !position) return;
    setPosition((p) => {
      if (!p) return p;
      const next = clampPositionForCollapsed(p.x, p.y, collapsed);
      return next.x === p.x && next.y === p.y ? p : next;
    });
  }, [collapsed, clampPositionForCollapsed, isMobile, position]);

  /** 轰炸「开始」后自动展开判官面板 */
  useEffect(() => {
    if (game?.active) {
      setCollapsed(false);
    }
  }, [game?.active]);

  const showJudgeInputPrompt = !collapsed && !!game?.canJudge;

  /** 轮到阅卷时引导用户聚焦输入框 */
  useEffect(() => {
    if (!showJudgeInputPrompt || loading) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 420);
    return () => window.clearTimeout(t);
  }, [showJudgeInputPrompt, loading, game?.currentCard?.word]);

  useEffect(() => () => dragCleanupRef.current?.(), []);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  useEffect(() => {
    let cancelled = false;
    const apiKey = settings.apiKey.trim();
    const model = settings.model.trim();

    if (!apiKey || !model) {
      setLlmConnected(false);
      setLoadingModels(false);
      return;
    }

    const applyList = (list: string[]) => {
      if (cancelled) return;
      if (list.length === 0 || !list.includes(model)) {
        setLlmConnected(false);
        return;
      }
      setLlmConnected(true);
      if (settings.models.length === 0 || !settings.models.includes(model)) {
        updateSettings({
          models: list,
          model: list.includes(model) ? model : list[0],
        });
      }
    };

    setLoadingModels(true);
    fetchModels(apiKey)
      .then(applyList)
      .catch(() => {
        if (!cancelled) setLlmConnected(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [settings.apiKey, settings.model, settings.models, updateSettings]);

  const endDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;
      const didDrag = dragActiveRef.current;
      isDraggingRef.current = false;
      dragActiveRef.current = false;
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
      cancelAnimationFrame(dragRafRef.current);

      if (didDrag) {
        const next = clampPosition(
          clientX - dragOffsetRef.current.x,
          clientY - dragOffsetRef.current.y
        );
        setPosition(next);
        localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(next));
      }

      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
    },
    [clampPosition]
  );

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || loading) return;
    e.preventDefault();
    e.stopPropagation();

    const fallbackPos = (() => {
      if (position) return position;
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return { x: MOBILE_INSET, y: DEFAULT_COLLAPSED_TOP };
      return clampPosition(rect.left, rect.top);
    })();

    dragOffsetRef.current = { x: e.clientX - fallbackPos.x, y: e.clientY - fallbackPos.y };
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    dragActiveRef.current = false;
    isDraggingRef.current = true;

    const onMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;

      if (!dragActiveRef.current) {
        const dx = ev.clientX - pointerStartRef.current.x;
        const dy = ev.clientY - pointerStartRef.current.y;
        if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
        dragActiveRef.current = true;
        setIsDragging(true);
        document.body.style.userSelect = 'none';
        document.body.style.touchAction = 'none';
      }

      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = requestAnimationFrame(() => {
        setPosition(
          clampPosition(ev.clientX - dragOffsetRef.current.x, ev.clientY - dragOffsetRef.current.y)
        );
      });
    };

    const onUp = (ev: PointerEvent) => endDrag(ev.clientX, ev.clientY);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    dragCleanupRef.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  };

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!settings.apiKey.trim() || !settings.model.trim()) {
      setError('请先在顶部设置中配置 API Key 和模型');
      return;
    }

    const userMsg: ChatMessage = { id: ++idCounter, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError('');
    setLoading(true);
    setStreamConnected(false);

    const assistantId = ++idCounter;

    try {
      if (game?.canJudge && game.currentCard) {
        const card = game.currentCard;
        const result = await sendJudge(
          {
            word: card.word,
            definition: card.definition,
            root: card.root,
            rootMeaning: card.rootMeaning,
            userExplanation: text,
          },
          settings
        );
        game.recordVerdict(result.verdict);
        const verdictColor = result.verdict === '正确' ? '✅' : '❌';
        const reply = `${verdictColor} 【裁决】${result.verdict}\n\n${result.feedback}`;
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '' },
        ]);
        const history: ChatMessagePayload[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        await sendChatStream(
          text,
          history,
          settings,
          (delta) => {
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === assistantId);
              if (!existing) {
                return [...prev, { id: assistantId, role: 'assistant', content: delta }];
              }
              return prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + delta } : m
              );
            });
          },
          {
            onConnected: () => setStreamConnected(true),
          }
        );
        setMessages((prev) => {
          const hasReply = prev.some((m) => m.id === assistantId && m.content.trim());
          if (hasReply) return prev;
          return [...prev, { id: assistantId, role: 'assistant', content: '（无回复内容）' }];
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败';
      setError(msg);
      if (/api\s*key|认证|连接|网络|401|403|fetch/i.test(msg)) {
        setLlmConnected(false);
      }
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== assistantId),
        { id: assistantId, role: 'assistant', content: `错误：${msg}` },
      ]);
    } finally {
      setLoading(false);
      setStreamConnected(false);
      textareaRef.current?.focus();
    }
  }, [game, input, loading, messages, settings]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const positioned = position !== null;
  const canSend = input.trim().length > 0 && !loading;
  const panelWidth = isMobile ? `calc(100vw - ${MOBILE_INSET * 2}px)` : (collapsed ? COLLAPSED_WIDTH : PANEL_WIDTH);
  const panelHeight = isMobile
    ? (collapsed ? COLLAPSED_HEIGHT : mobileExpandedHeight)
    : (collapsed ? COLLAPSED_HEIGHT : PANEL_HEIGHT);

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden select-none',
        'border border-white/[0.14]',
        'bg-gradient-to-br from-zinc-800 via-zinc-900 to-slate-950',
        !collapsed && game?.canJudge && 'border-cyan-400/50'
      )}
      style={{
        left: positioned ? position.x : undefined,
        top: positioned ? position.y : (isMobile ? undefined : DEFAULT_COLLAPSED_TOP),
        right: positioned ? 'auto' : (isMobile ? MOBILE_INSET : VIEWPORT_MARGIN),
        bottom: positioned ? 'auto' : (isMobile ? MOBILE_INSET : undefined),
        borderRadius: collapsed ? COLLAPSED_RADIUS : PANEL_RADIUS,
        transition: isDragging ? 'none' : undefined,
        boxShadow: game?.canJudge
          ? '0 24px 56px -16px rgba(0,0,0,0.72), 0 0 0 1px rgba(34,211,238,0.4), 0 0 32px -10px rgba(34,211,238,0.35)'
          : '0 24px 56px -16px rgba(0,0,0,0.68), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{
        opacity: 1,
        scale: 1,
        width: panelWidth,
        height: panelHeight,
      }}
      transition={isDragging ? { duration: 0 } : panelTransition}
      onAnimationComplete={() => {
        if (isDraggingRef.current || !position) return;
        setPosition((p) => (p ? clampPosition(p.x, p.y) : p));
      }}
    >
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <div
          className={cn(
            'flex h-10 shrink-0 items-center gap-2 px-2.5',
            !collapsed && 'border-b border-white/[0.1] bg-white/[0.03]'
          )}
          style={{ cursor: isMobile ? 'default' : (loading ? 'default' : isDragging ? 'grabbing' : 'grab') }}
          onPointerDown={handleDragStart}
          title={isMobile ? '判官面板' : '拖动移动'}
        >
          <span
            className={cn(
              'inline-block h-2 w-2 shrink-0 rounded-full',
              llmConnected
                ? 'bg-emerald-400 animate-breathe-dot'
                : 'bg-zinc-500'
            )}
            title={
              llmConnected
                ? '大模型已连接'
                : loadingModels
                  ? '正在检测大模型连接…'
                  : '大模型未连接，请在设置中配置 API Key 并获取模型'
            }
          />
          <span
            className={cn(
              'shrink-0 font-medium text-white/85',
              collapsed ? 'text-sm tracking-wide' : 'text-xs'
            )}
          >
            判官
          </span>
          <ModelTag
            model={settings.model}
            loading={loadingModels}
            collapsed={collapsed}
          />
          <button
            type="button"
            aria-label={collapsed ? '展开判官' : '收起判官'}
            aria-expanded={!collapsed}
            title={collapsed ? '展开' : '收起'}
            className="inline-flex shrink-0 items-center justify-center p-0.5 text-white/45 transition-colors hover:text-white/75"
            onClick={() => {
              setCollapsed((v) => {
                const next = !v;
                setPosition((p) => (p ? clampPositionForCollapsed(p.x, p.y, next) : p));
                return next;
              });
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <FontAwesomeIcon
              icon={collapsed ? faChevronUp : faChevronDown}
              className="h-2.5 w-2.5"
            />
          </button>
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {!collapsed && (
            <motion.div
              key="body"
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Scoreboard embedded />
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
              >
                {messages.map((msg) => {
                  if (msg.role === 'assistant' && !msg.content.trim()) return null;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                        style={{
                          background:
                            msg.role === 'user'
                              ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                              : 'rgba(255,255,255,0.09)',
                          color: msg.role === 'user' ? '#fff' : 'rgba(255,255,255,0.9)',
                          border:
                            msg.role === 'assistant'
                              ? '1px solid rgba(255,255,255,0.12)'
                              : 'none',
                        }}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex justify-start">
                    <div
                      className="flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-white/40"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-indigo-400" />
                      {game?.canJudge
                        ? '阅卷中...'
                        : streamConnected
                          ? '模型生成中...'
                          : '连接判官中...'}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="shrink-0 px-3 pb-1 text-xs text-red-400/90">{error}</p>
              )}

              <div className="shrink-0 border-t border-white/[0.07] p-3">
                {showJudgeInputPrompt && (
                  <p className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-300/95">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 animate-pulse" />
                    请在此输入词根解释，Enter 发送阅卷
                  </p>
                )}
                <div
                  className={cn(
                    'flex items-end gap-2 rounded-xl border px-2 py-2 transition-colors',
                    showJudgeInputPrompt
                      ? 'animate-judge-input-prompt border-cyan-400/50 bg-cyan-950/25'
                      : 'border-white/10 bg-white/[0.04]'
                  )}
                  style={
                    isMobile
                      ? { paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }
                      : undefined
                  }
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      game?.canJudge && game.currentCard
                        ? `解释「${game.currentCard.word}」词根含义，发送阅卷`
                        : game?.active
                          ? '本轮已阅卷，可继续向判官提问'
                          : '输入消息，Enter 发送，Shift+Enter 换行'
                    }
                    disabled={loading}
                    className={cn(
                      'max-h-[120px] min-h-[24px] min-w-0 flex-1 resize-none bg-transparent px-1 py-1 text-sm outline-none disabled:opacity-50',
                      showJudgeInputPrompt
                        ? 'text-white placeholder:text-cyan-200/45'
                        : 'text-white/90 placeholder:text-white/25'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={!canSend}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-35"
                    style={{
                      background: canSend
                        ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                        : 'rgba(255,255,255,0.1)',
                    }}
                    title="发送"
                  >
                    {loading ? (
                      <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin text-white" />
                    ) : (
                      <FontAwesomeIcon icon={faArrowUp} className="h-3.5 w-3.5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
