import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'llm-settings';

export interface LlmSettings {
  apiKey: string;
  model: string;
  models: string[];
}

interface LlmSettingsContextValue {
  settings: LlmSettings;
  updateSettings: (patch: Partial<LlmSettings>) => void;
  saveSettings: (next: LlmSettings) => void;
}

const defaultSettings: LlmSettings = {
  apiKey: '',
  model: '',
  models: [],
};

function loadSettings(): LlmSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<LlmSettings>;
    return {
      apiKey: parsed.apiKey || defaultSettings.apiKey,
      model: parsed.model || '',
      models: Array.isArray(parsed.models) ? parsed.models : [],
    };
  } catch {
    return defaultSettings;
  }
}

const LlmSettingsContext = createContext<LlmSettingsContextValue | null>(null);

export function LlmSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LlmSettings>(loadSettings);

  const saveSettings = useCallback((next: LlmSettings) => {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateSettings = useCallback((patch: Partial<LlmSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
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
