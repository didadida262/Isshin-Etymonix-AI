export interface ChatMessage {
  role: 'user' | 'assistant' | string;
  content: string;
}

export interface ChatRequest {
  message: string;
  base_url: string;
  api_key: string;
  model: string;
  history?: ChatMessage[];
}

export interface JudgeRequest {
  word: string;
  definition: string;
  root: string;
  root_meaning: string;
  user_explanation: string;
  base_url: string;
  api_key: string;
  model: string;
}

/** 默认 LLM BaseUrl（用户可在设置中覆盖） */
export const DEFAULT_LLM_BASE_URL = 'https://aiplatform.njsrd.com/llm/v1';

/** @deprecated 使用 DEFAULT_LLM_BASE_URL */
export const LLM_BASE_URL = DEFAULT_LLM_BASE_URL;

export function normalizeLlmBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/** Supabase 项目 URL（与前端 VITE_SUPABASE_URL 一致，用于 JWKS 校验） */
export const SUPABASE_PROJECT_URL = 'https://zhryubclcfityqqqdsaa.supabase.co';
