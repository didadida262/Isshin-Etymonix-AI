import type { LlmSettings } from '../context/LlmSettingsContext';

const API_BASE = '/api';

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export async function fetchModels(apiKey: string): Promise<string[]> {
  const params = new URLSearchParams({ api_key: apiKey });
  const res = await fetch(`${API_BASE}/models?${params}`);
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
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

/** SSE 流式对话，通过 onDelta 逐段回调正文 */
export async function sendChatStream(
  message: string,
  history: ChatMessagePayload[],
  settings: LlmSettings,
  onDelta: (delta: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      base_url: settings.baseUrl,
      api_key: settings.apiKey,
      model: settings.model,
    }),
    signal,
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

/** 非流式对话（保留兼容） */
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
      base_url: settings.baseUrl,
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
