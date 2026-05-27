import type { ChatRequest } from './types';

export function validateChatFields(
  fields: Pick<ChatRequest, 'api_key' | 'model' | 'message'>
): string | null {
  if (!fields.api_key?.trim()) return 'api_key 不能为空';
  if (!fields.model?.trim()) return 'model 不能为空';
  if (!fields.message?.trim()) return 'message 不能为空';
  return null;
}
