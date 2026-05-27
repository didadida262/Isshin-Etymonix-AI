import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

import { SYSTEM_PROMPT } from './persona';
import { stripThinkContent } from './sanitize';
import type { ChatMessage } from './types';

function buildMessages(userMessage: string, history: ChatMessage[]): BaseMessage[] {
  const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT)];
  for (const item of history) {
    if (item.role === 'user') {
      messages.push(new HumanMessage(item.content));
    } else if (item.role === 'assistant') {
      messages.push(new AIMessage(item.content));
    }
  }
  messages.push(new HumanMessage(userMessage));
  return messages;
}

function createLlm(baseUrl: string, apiKey: string, model: string) {
  return new ChatOpenAI({
    model,
    apiKey,
    configuration: { baseURL: baseUrl.replace(/\/$/, '') },
  });
}

function chunkText(chunk: { content: unknown }): string {
  const content = chunk.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const block of content) {
      if (typeof block === 'string') parts.push(block);
      else if (block && typeof block === 'object' && 'type' in block) {
        const b = block as { type?: string; text?: string };
        if (b.type === 'text') parts.push(String(b.text ?? ''));
      }
    }
    return parts.join('');
  }
  return content ? String(content) : '';
}

export async function runChat(
  message: string,
  history: ChatMessage[],
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<string> {
  const llm = createLlm(baseUrl, apiKey, model);
  const messages = buildMessages(message, history);
  const response = await llm.invoke(messages);
  const content =
    typeof response.content === 'string'
      ? response.content
      : String(response.content);
  return stripThinkContent(content);
}

export async function* streamChat(
  message: string,
  history: ChatMessage[],
  baseUrl: string,
  apiKey: string,
  model: string
): AsyncGenerator<string> {
  const llm = createLlm(baseUrl, apiKey, model);
  const messages = buildMessages(message, history);
  let accumulated = '';
  let visiblePrev = '';

  const stream = await llm.stream(messages);
  for await (const chunk of stream) {
    const text = chunkText(chunk);
    if (!text) continue;
    accumulated += text;
    const visible = stripThinkContent(accumulated);
    const delta = visible.slice(visiblePrev.length);
    visiblePrev = visible;
    if (delta) yield delta;
  }
}
