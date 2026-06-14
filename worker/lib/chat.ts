import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

import { SYSTEM_PROMPT } from './persona';
import { getVisibleStreamingText, stripThinkContent } from './sanitize';
import type { ChatMessage } from './types';
import { LLM_BASE_URL } from './types';

const LLM_TIMEOUT_MS = 90_000;

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

/** Qwen3 默认开启思考；关闭后可显著缩短首字延迟（尤其线上经 Worker 代理时） */
function llmRequestExtras(model: string): Record<string, unknown> | undefined {
  if (!/qwen/i.test(model)) return undefined;
  return { chat_template_kwargs: { enable_thinking: false } };
}

function createLlm(apiKey: string, model: string) {
  const extras = llmRequestExtras(model);
  return new ChatOpenAI({
    model,
    apiKey,
    timeout: LLM_TIMEOUT_MS,
    configuration: { baseURL: LLM_BASE_URL.replace(/\/$/, '') },
    ...(extras ? { modelKwargs: extras } : {}),
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

function normalizeLlmError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/401|未授权|MODEL_AUTHENTICATION|invalid.*api.*key|authentication/i.test(message)) {
    return '大模型 API Key 无效或已过期，请在设置中重新填写并点击「测试」';
  }
  if (/network connection lost|fetch failed|terminated|aborted/i.test(message)) {
    return '大模型连接中断（可能思考时间过长或网络不稳定），请重试或换更小模型';
  }
  if (/timeout|timed out/i.test(message)) {
    return '大模型响应超时，请重试或更换模型';
  }
  return message;
}

export async function runChat(
  message: string,
  history: ChatMessage[],
  apiKey: string,
  model: string
): Promise<string> {
  try {
    const llm = createLlm(apiKey, model);
    const messages = buildMessages(message, history);
    const response = await llm.invoke(messages);
    const content =
      typeof response.content === 'string'
        ? response.content
        : String(response.content);
    return stripThinkContent(content);
  } catch (e) {
    throw new Error(normalizeLlmError(e));
  }
}

/** 连通性测试：短 prompt，不走完整判官人设 */
export async function runQuickTest(apiKey: string, model: string): Promise<string> {
  try {
    const llm = createLlm(apiKey, model);
    const response = await llm.invoke([
      new HumanMessage('请只回复 OK，不要输出其他内容，不要使用思考标签。'),
    ]);
    const content =
      typeof response.content === 'string'
        ? response.content
        : String(response.content);
    return stripThinkContent(content);
  } catch (e) {
    throw new Error(normalizeLlmError(e));
  }
}

export async function* streamChat(
  message: string,
  history: ChatMessage[],
  apiKey: string,
  model: string
): AsyncGenerator<string> {
  const llm = createLlm(apiKey, model);
  const messages = buildMessages(message, history);
  let accumulated = '';
  let visiblePrev = '';

  try {
    const stream = await llm.stream(messages);
    for await (const chunk of stream) {
      const text = chunkText(chunk);
      if (!text) continue;
      accumulated += text;
      const visible = getVisibleStreamingText(accumulated);
      const delta = visible.slice(visiblePrev.length);
      visiblePrev = visible;
      if (delta) yield delta;
    }
    const finalVisible = stripThinkContent(accumulated);
    const tail = finalVisible.slice(visiblePrev.length);
    if (tail) yield tail;
  } catch (e) {
    throw new Error(normalizeLlmError(e));
  }
}
