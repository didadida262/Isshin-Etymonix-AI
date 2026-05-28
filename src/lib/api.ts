import type { LlmSettings } from '../context/LlmSettingsContext';

const API_BASE = '/api';
const CHAT_TIMEOUT_MS = 95_000;

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface JudgePayload {
  word: string;
  definition: string;
  root: string;
  rootMeaning: string;
  userExplanation: string;
}

export interface JudgeResult {
  verdict: '正确' | '错误';
  feedback: string;
}

/** 模型列表：经本站 /api 代理，避免浏览器 CORS */
export async function fetchModels(apiKey: string): Promise<string[]> {
  const params = new URLSearchParams({ api_key: apiKey });
  const res = await fetch(`${API_BASE}/models?${params}`);
  if (!res.ok) {
    let detail = await res.text().catch(() => '');
    try {
      const body = (await res.json()) as { detail?: string };
      detail = body.detail ?? detail;
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `获取模型列表失败 (${res.status})`);
  }
  const data = (await res.json()) as { models?: string[] };
  return data.models ?? [];
}

function parseSsePayload(line: string): { content?: string; error?: string } | null {
  if (!line.startsWith('data: ')) return null;
  const payload = line.slice(6).trim();
  if (payload === '[DONE]') return null;
  try {
    return JSON.parse(payload) as { content?: string; error?: string };
  } catch {
    return null;
  }
}

/** 对话：走本站 Agent（/api），由后端调用写死的 LLM 接口 */
export async function sendChatStream(
  message: string,
  history: ChatMessagePayload[],
  settings: LlmSettings,
  onDelta: (delta: string) => void,
  options?: { signal?: AbortSignal; onConnected?: () => void }
): Promise<void> {
  const abortSignal = options?.signal ?? AbortSignal.timeout(CHAT_TIMEOUT_MS);

  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      api_key: settings.apiKey,
      model: settings.model,
    }),
    signal: abortSignal,
  });

  options?.onConnected?.();

  if (!res.ok) {
    let detail = await res.text().catch(() => '');
    try {
      const json = JSON.parse(detail) as { detail?: string };
      detail = json.detail ?? detail;
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `对话请求失败 (${res.status})`);
  }

  if (!res.body) {
    throw new Error('服务器未返回流式数据');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let lineBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    lineBuffer += decoder.decode(value, { stream: true });
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';

    for (const line of lines) {
      const parsed = parseSsePayload(line);
      if (!parsed) continue;
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.content) onDelta(parsed.content);
    }
  }
}

/** 阅卷：走本站 Agent（/api） */
export async function sendJudge(
  payload: JudgePayload,
  settings: LlmSettings
): Promise<JudgeResult> {
  const res = await fetch(`${API_BASE}/judge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      word: payload.word,
      definition: payload.definition,
      root: payload.root,
      root_meaning: payload.rootMeaning,
      user_explanation: payload.userExplanation,
      api_key: settings.apiKey,
      model: settings.model,
    }),
  });

  if (!res.ok) {
    let detail = await res.text().catch(() => '');
    try {
      const json = JSON.parse(detail) as { detail?: string };
      detail = json.detail ?? detail;
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `阅卷失败 (${res.status})`);
  }

  const data = (await res.json()) as { verdict: string; feedback: string };
  const verdict = data.verdict?.includes('正确') ? '正确' : '错误';
  return { verdict, feedback: data.feedback ?? '' };
}

/** 测试连通性：短 prompt，响应更快 */
export async function testLlmConnection(
  settings: Pick<LlmSettings, 'apiKey' | 'model'>
): Promise<string> {
  const res = await fetch(`${API_BASE}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: settings.apiKey,
      model: settings.model,
    }),
    signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
  });

  if (!res.ok) {
    let detail = await res.text().catch(() => '');
    try {
      const json = JSON.parse(detail) as { detail?: string };
      detail = json.detail ?? detail;
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `测试失败 (${res.status})`);
  }

  const data = (await res.json()) as { reply: string };
  return data.reply ?? '';
}

export async function sendChat(
  message: string,
  history: ChatMessagePayload[],
  settings: LlmSettings
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      api_key: settings.apiKey,
      model: settings.model,
    }),
  });

  if (!res.ok) {
    let detail = await res.text().catch(() => '');
    try {
      const json = JSON.parse(detail) as { detail?: string };
      detail = json.detail ?? detail;
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `对话请求失败 (${res.status})`);
  }

  const data = (await res.json()) as { reply: string };
  return data.reply ?? '';
}
