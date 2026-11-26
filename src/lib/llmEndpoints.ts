/** 默认：Agnes OpenAI 兼容补全接口 */
export const DEFAULT_LLM_BASE_URL = 'https://api.agnes-ai.cn/v1';

/** 内置固定 Agnes API Key（设置里预填且不可查看明文） */
export const DEFAULT_LLM_API_KEY =
  'sk-KzVGSnhI3B4xPmzQwquv3wJkM41Zyyrb0Cm0EC4GQlRgawKM';

export interface LlmProviderPreset {
  id: 'nexus' | 'agnes';
  label: string;
  baseUrl: string;
  modelHint: string;
  keyUrl: string;
  /** 为 false 时不在设置页展示预设按钮 */
  visible?: boolean;
}

export const LLM_PROVIDER_PRESETS: LlmProviderPreset[] = [
  {
    id: 'nexus',
    label: 'Nexus 体验',
    baseUrl: 'https://aiplatform.njsrd.com/llm/v1',
    modelHint: 'minimax-m2.7',
    keyUrl: 'https://aiplatform.njsrd.com/nexus/?invite_code=6UFELQ',
    visible: false,
  },
  {
    id: 'agnes',
    label: 'Agnes',
    baseUrl: DEFAULT_LLM_BASE_URL,
    modelHint: 'agnes-3.0-flash',
    keyUrl: 'https://www.agnes-ai.cn/',
    visible: false,
  },
];

export const VISIBLE_LLM_PROVIDER_PRESETS = LLM_PROVIDER_PRESETS.filter(
  (p) => p.visible !== false
);

/** @deprecated 使用 DEFAULT_LLM_BASE_URL */
export const LLM_BASE_URL = DEFAULT_LLM_BASE_URL;

export function normalizeLlmBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}
