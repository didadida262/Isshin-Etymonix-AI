import { faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLlmSettings, type LlmSettings } from '../context/LlmSettingsContext';
import { LLM_BASE_URL } from '../lib/llmEndpoints';
import { fetchModels, testLlmConnection } from '../lib/api';
import { cn } from '../lib/cn';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-sm font-medium text-zinc-300 border-b border-white/[0.08] pb-2">
      {children}
    </h3>
  );
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, saveSettings } = useLlmSettings();
  const [draft, setDraft] = useState<LlmSettings>(settings);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const modelListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(settings);
      setModels(settings.models);
      setError('');
      setTestResult(null);
      setShowApiKey(false);
    }
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    const allowScroll = (target: EventTarget | null) =>
      target instanceof Element && target.closest('[data-settings-modal]');

    const blockBackgroundScroll = (e: Event) => {
      if (!allowScroll(e.target)) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', blockBackgroundScroll, { passive: false });
    document.addEventListener('touchmove', blockBackgroundScroll, { passive: false });

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      document.removeEventListener('wheel', blockBackgroundScroll);
      document.removeEventListener('touchmove', blockBackgroundScroll);
    };
  }, [open]);

  const loadModels = useCallback(async () => {
    if (!draft.apiKey.trim()) {
      setError('请先填写 API Key');
      return;
    }
    setLoadingModels(true);
    setError('');
    try {
      const list = await fetchModels(draft.apiKey.trim());
      setModels(list);
      if (list.length === 0) {
        setError('未获取到模型，请检查 API Key');
      } else {
        setDraft((d) => ({
          ...d,
          models: list,
          model: !d.model || !list.includes(d.model) ? list[0] : d.model,
        }));
      }
    } catch (err) {
      setModels([]);
      setError(err instanceof Error ? err.message : '获取模型失败');
    } finally {
      setLoadingModels(false);
    }
  }, [draft.apiKey, draft.model]);

  const displayModels = useMemo(() => {
    const list = models.length > 0 ? models : draft.models;
    if (draft.model && !list.includes(draft.model)) {
      return [draft.model, ...list];
    }
    return list;
  }, [models, draft.models, draft.model]);

  const scrollToSelectedModel = useCallback(() => {
    const list = modelListRef.current;
    if (!list || !draft.model.trim()) return;
    const selected = list.querySelector<HTMLElement>('[data-selected-model="true"]');
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [draft.model]);

  useEffect(() => {
    if (!open || loadingModels || displayModels.length === 0 || !draft.model.trim()) {
      return;
    }
    const timer = window.setTimeout(scrollToSelectedModel, 220);
    return () => window.clearTimeout(timer);
  }, [open, loadingModels, displayModels, draft.model, scrollToSelectedModel]);

  const handleTest = useCallback(async () => {
    if (!draft.apiKey.trim()) {
      setTestResult({ ok: false, message: '请先填写 API Key' });
      return;
    }
    if (!draft.model.trim()) {
      setTestResult({ ok: false, message: '请先选择模型' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const reply = await testLlmConnection({
        apiKey: draft.apiKey.trim(),
        model: draft.model.trim(),
      });
      const preview = reply.trim().slice(0, 80);
      setTestResult({
        ok: true,
        message: preview ? `连接成功，模型回复：${preview}` : '连接成功，模型已正常响应',
      });
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : '测试失败',
      });
    } finally {
      setTesting(false);
    }
  }, [draft.apiKey, draft.model]);

  const handleSave = () => {
    if (!draft.apiKey.trim()) {
      setError('API Key 不能为空');
      return;
    }
    if (!draft.model.trim()) {
      setError('请选择模型');
      return;
    }
    saveSettings({
      apiKey: draft.apiKey.trim(),
      model: draft.model.trim(),
      models: models.length > 0 ? models : draft.models,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden p-4 overscroll-none">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm overscroll-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            data-settings-modal
            className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-center text-lg font-semibold text-white">大模型设置</h2>

            <section className="mb-5">
              <SectionTitle>基础配置</SectionTitle>
              <div className="space-y-3">
                <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
                  获取 API Key 请访问：
                  <a
                    href="https://aiplatform.njsrd.com/nexus/?invite_code=6UFELQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block break-all text-cyan-400/90 hover:text-cyan-300 hover:underline"
                  >
                    https://aiplatform.njsrd.com/nexus/?invite_code=6UFELQ
                  </a>
                </p>

                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-400">BaseUrl</span>
                  <input
                    type="text"
                    readOnly
                    value={LLM_BASE_URL}
                    className="w-full cursor-default rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400 outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-400">API Key</span>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={draft.apiKey}
                      onChange={(e) => {
                        setDraft((d) => ({ ...d, apiKey: e.target.value }));
                        setTestResult(null);
                      }}
                      placeholder="sk-..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-10 text-sm text-white outline-none focus:border-cyan-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition-colors hover:text-zinc-300"
                      aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                      title={showApiKey ? '隐藏' : '显示'}
                    >
                      <FontAwesomeIcon
                        icon={showApiKey ? faEyeSlash : faEye}
                        className="h-4 w-4"
                      />
                    </button>
                  </div>
                </label>
              </div>
            </section>

            <section className="mb-4">
              <div className="mb-3 flex items-center justify-between border-b border-white/[0.08] pb-2">
                <h3 className="text-sm font-medium text-zinc-300">模型列表</h3>
                <button
                  type="button"
                  onClick={() => void loadModels()}
                  disabled={loadingModels}
                  className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                >
                  {loadingModels ? (
                    <span className="inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      加载中
                    </span>
                  ) : (
                    '获取模型列表'
                  )}
                </button>
              </div>
              {loadingModels ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] py-8 text-sm text-zinc-400">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-cyan-400" />
                  正在加载模型列表...
                </div>
              ) : displayModels.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-6 text-center text-xs text-zinc-500">
                  点击「获取模型列表」加载可用模型
                </p>
              ) : (
                <ul
                  ref={modelListRef}
                  className="max-h-56 divide-y divide-white/[0.08] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03]"
                >
                  {displayModels.map((m) => {
                    const selected = draft.model === m;
                    return (
                      <li key={m}>
                        <button
                          type="button"
                          data-selected-model={selected ? 'true' : undefined}
                          onClick={() => {
                            setDraft((d) => ({ ...d, model: m }));
                            setTestResult(null);
                          }}
                          className={cn(
                            'w-full px-3 py-2.5 text-left text-sm leading-snug break-all transition-colors',
                            selected
                              ? 'bg-indigo-500/15 text-cyan-100'
                              : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          {m}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {displayModels.length > 0 && (
                <p className="mt-2 text-[11px] text-zinc-500">
                  共 {displayModels.length} 个模型，点击选择
                </p>
              )}
            </section>

            {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
            {testResult && (
              <p
                className={cn(
                  'mb-3 text-xs',
                  testResult.ok ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {testResult.message}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => void handleTest()}
                disabled={testing}
                className="rounded-lg border border-cyan-500/30 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50"
              >
                {testing ? (
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    测试中
                  </span>
                ) : (
                  '测试'
                )}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  保存
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
