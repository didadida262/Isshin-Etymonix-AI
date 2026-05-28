import { MODELS_API_URL } from './types';

export function parseModelsPayload(data: unknown): string[] {
  if (Array.isArray(data)) {
    const result: string[] = [];
    for (const item of data) {
      if (typeof item === 'string') {
        result.push(item);
      } else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const name = obj.id ?? obj.name ?? obj.model;
        if (name) result.push(String(name));
      }
    }
    return result;
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['data', 'models', 'items', 'results']) {
      if (key in obj) return parseModelsPayload(obj[key]);
    }
    if (typeof obj.model === 'string') return [obj.model];
  }

  return [];
}

export async function fetchModels(apiKey: string): Promise<{
  models: string[];
  raw: unknown;
}> {
  const url = new URL(MODELS_API_URL);
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    let detail = await response.text();
    try {
      const body = (await response.json()) as { detail?: string };
      detail = body.detail ?? detail;
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `获取模型列表失败 (${response.status})`);
  }

  const payload: unknown = await response.json();
  return { models: parseModelsPayload(payload), raw: payload };
}
