import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_MODEL } from '../lib/llmConstants';
import {
  DEFAULT_LLM_API_KEY,
  DEFAULT_LLM_BASE_URL,
  normalizeLlmBaseUrl,
} from '../lib/llmEndpoints';

const STORAGE_KEY = 'llm-settings';

export interface LlmSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface LlmSettingsContextValue {
  settings: LlmSettings;
  updateSettings: (patch: Partial<LlmSettings>) => void;
  saveSettings: (next: LlmSettings) => void;
}

const defaultSettings: LlmSettings = {
  baseUrl: DEFAULT_LLM_BASE_URL,
  apiKey: DEFAULT_LLM_API_KEY,
  model: DEFAULT_MODEL,
};

function loadSettings(): LlmSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<LlmSettings>;
    return {
      baseUrl: normalizeLlmBaseUrl(parsed.baseUrl || defaultSettings.baseUrl),
      // 固定使用内置 Agnes Key，忽略本地缓存中的旧值
      apiKey: DEFAULT_LLM_API_KEY,
      model: parsed.model?.trim() || DEFAULT_MODEL,
    };
  } catch {
    return defaultSettings;
  }
}

const LlmSettingsContext = createContext<LlmSettingsContextValue | null>(null);

export function LlmSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LlmSettings>(loadSettings);

  const saveSettings = useCallback((next: LlmSettings) => {
    const sanitized = {
      baseUrl: normalizeLlmBaseUrl(next.baseUrl),
      apiKey: DEFAULT_LLM_API_KEY,
      model: next.model.trim(),
    };
    setSettings(sanitized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  }, []);

  const updateSettings = useCallback((patch: Partial<LlmSettings>) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        ...patch,
        ...(patch.baseUrl !== undefined
          ? { baseUrl: normalizeLlmBaseUrl(patch.baseUrl) }
          : {}),
        apiKey: DEFAULT_LLM_API_KEY,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, saveSettings }),
    [settings, updateSettings, saveSettings]
  );

  return (
    <LlmSettingsContext.Provider value={value}>{children}</LlmSettingsContext.Provider>
  );
}

export function useLlmSettings() {
  const ctx = useContext(LlmSettingsContext);
  if (!ctx) {
    throw new Error('useLlmSettings must be used within LlmSettingsProvider');
  }
  return ctx;
}
