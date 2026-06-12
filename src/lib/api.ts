import type { LlmSettings } from '../context/LlmSettingsContext';

const API_BASE = '/api';
const CHAT_TIMEOUT_MS = 95_000;

function buildHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseErrorResponse(res: Response): Promise<string> {
  let detail = await res.text().catch(() => '');
  try {
    const json = JSON.parse(detail) as { detail?: string };
    detail = json.detail ?? detail;
  } catch {
    /* use raw text */
  }
  return detail || `Request failed (${res.status})`;
}

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
export async function fetchModels(
  apiKey: string,
  accessToken: string
): Promise<string[]> {
  const params = new URLSearchParams({ api_key: apiKey });
  const res = await fetch(`${API_BASE}/models?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }
  const data = (await res.json()) as { models?: string[] };
  return data.models ?? [];
}

function parseSsePayload(line: string): {
  content?: string;
  error?: string;
  verdict?: string;
  feedback?: string;
} | null {
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
  accessToken: string,
  onDelta: (delta: string) => void,
  options?: { signal?: AbortSignal; onConnected?: () => void }
): Promise<void> {
  const abortSignal = options?.signal ?? AbortSignal.timeout(CHAT_TIMEOUT_MS);

  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
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
    throw new Error(await parseErrorResponse(res));
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

/** 阅卷：SSE 流式，走本站 Agent（/api） */
export async function sendJudgeStream(
  payload: JudgePayload,
  settings: LlmSettings,
  accessToken: string,
  onDelta: (delta: string) => void,
  options?: { signal?: AbortSignal }
): Promise<JudgeResult> {
  const abortSignal = options?.signal ?? AbortSignal.timeout(CHAT_TIMEOUT_MS);

  const res = await fetch(`${API_BASE}/judge/stream`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      word: payload.word,
      definition: payload.definition,
      root: payload.root,
      root_meaning: payload.rootMeaning,
      user_explanation: payload.userExplanation,
      api_key: settings.apiKey,
      model: settings.model,
    }),
    signal: abortSignal,
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }

  if (!res.body) {
    throw new Error('服务器未返回流式数据');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let lineBuffer = '';
  let result: JudgeResult | null = null;

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
      if (parsed.verdict) {
        const verdict = parsed.verdict.includes('正确') ? '正确' : '错误';
        result = { verdict, feedback: parsed.feedback ?? '' };
      }
      if (parsed.content) onDelta(parsed.content);
    }
  }

  if (!result) {
    throw new Error('阅卷未返回裁决结果');
  }
  return result;
}

/** 阅卷：走本站 Agent（/api） */
export async function sendJudge(
  payload: JudgePayload,
  settings: LlmSettings,
  accessToken: string
): Promise<JudgeResult> {
  const res = await fetch(`${API_BASE}/judge`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
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
    throw new Error(await parseErrorResponse(res));
  }

  const data = (await res.json()) as { verdict: string; feedback: string };
  const verdict = data.verdict?.includes('正确') ? '正确' : '错误';
  return { verdict, feedback: data.feedback ?? '' };
}

/** 测试连通性：短 prompt，响应更快 */
export async function testLlmConnection(
  settings: Pick<LlmSettings, 'apiKey' | 'model'>,
  accessToken: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/test`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      api_key: settings.apiKey,
      model: settings.model,
    }),
    signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }

  const data = (await res.json()) as { reply: string };
  return data.reply ?? '';
}

export async function sendChat(
  message: string,
  history: ChatMessagePayload[],
  settings: LlmSettings,
  accessToken: string
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      message,
      history,
      api_key: settings.apiKey,
      model: settings.model,
    }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }

  const data = (await res.json()) as { reply: string };
  return data.reply ?? '';
}
