import type { ChatRequest } from './types';
import { normalizeLlmBaseUrl } from './types';

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateChatFields(
  fields: Pick<ChatRequest, 'base_url' | 'api_key' | 'model' | 'message'>
): string | null {
  const baseUrl = normalizeLlmBaseUrl(fields.base_url ?? '');
  if (!baseUrl) return 'base_url 不能为空';
  if (!isValidHttpUrl(baseUrl)) return 'base_url 需为有效的 http(s) 地址';
  if (!fields.api_key?.trim()) return 'api_key 不能为空';
  if (!fields.model?.trim()) return 'model 不能为空';
  if (!fields.message?.trim()) return 'message 不能为空';
  return null;
}
