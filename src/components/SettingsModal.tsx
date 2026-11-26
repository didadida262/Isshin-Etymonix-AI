import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLlmSettings, type LlmSettings } from '../context/LlmSettingsContext';
import {
  DEFAULT_LLM_API_KEY,
  DEFAULT_LLM_BASE_URL,
  normalizeLlmBaseUrl,
} from '../lib/llmEndpoints';
import { DEFAULT_MODEL } from '../lib/llmConstants';
import { testLlmConnection } from '../lib/api';
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

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { getAccessToken } = useAuth();
  const { settings, saveSettings } = useLlmSettings();
  const [draft, setDraft] = useState<LlmSettings>(settings);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (open) {
      setDraft({ ...settings, apiKey: DEFAULT_LLM_API_KEY });
      setError('');
      setTestResult(null);
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

  const handleTest = useCallback(async () => {
    const baseUrl = normalizeLlmBaseUrl(draft.baseUrl);
    if (!baseUrl) {
      setTestResult({ ok: false, message: '请先填写 BaseUrl' });
      return;
    }
    if (!isValidHttpUrl(baseUrl)) {
      setTestResult({ ok: false, message: 'BaseUrl 需为有效的 http(s) 地址' });
      return;
    }
    if (!draft.apiKey.trim()) {
      setTestResult({ ok: false, message: '请先填写 API Key' });
      return;
    }
    if (!draft.model.trim()) {
      setTestResult({ ok: false, message: '请先填写模型名称' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) {
        setTestResult({ ok: false, message: '请先登录' });
        return;
      }
      const reply = await testLlmConnection(
        {
          baseUrl,
          apiKey: draft.apiKey.trim(),
          model: draft.model.trim(),
        },
        token
      );
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
  }, [draft.baseUrl, draft.apiKey, draft.model, getAccessToken]);

  const handleSave = () => {
    const baseUrl = normalizeLlmBaseUrl(draft.baseUrl);
    if (!baseUrl) {
      setError('BaseUrl 不能为空');
      return;
    }
    if (!isValidHttpUrl(baseUrl)) {
      setError('BaseUrl 需为有效的 http(s) 地址');
      return;
    }
    if (!draft.apiKey.trim()) {
      setError('API Key 不能为空');
      return;
    }
    if (!draft.model.trim()) {
      setError('模型名称不能为空');
      return;
    }
    saveSettings({
      baseUrl,
      apiKey: DEFAULT_LLM_API_KEY,
      model: draft.model.trim(),
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
                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-400">BaseUrl</span>
                  <input
                    type="url"
                    value={draft.baseUrl}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, baseUrl: e.target.value }));
                      setTestResult(null);
                    }}
                    placeholder={DEFAULT_LLM_BASE_URL}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs text-zinc-400">API Key</span>
                  <input
                    type="password"
                    value={draft.apiKey}
                    readOnly
                    autoComplete="off"
                    className="w-full cursor-default rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-400 outline-none"
                  />
                </label>
              </div>
            </section>

            <section className="mb-4">
              <SectionTitle>模型名称</SectionTitle>
              <label className="block">
                <input
                  type="text"
                  value={draft.model}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, model: e.target.value }));
                    setTestResult(null);
                  }}
                  placeholder={DEFAULT_MODEL}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/40"
                />
              </label>
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
