export interface ChatMessage {
  role: 'user' | 'assistant' | string;
  content: string;
}

export interface ChatRequest {
  message: string;
  base_url?: string;
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
  base_url?: string;
  api_key: string;
  model: string;
}

export const DEFAULT_BASE_URL = 'https://aiplatform.njsrd.com/llm/v1';
export const MODELS_API_URL =
  'https://aiplatform.njsrd.com/nexus/api/api-keys/models';
