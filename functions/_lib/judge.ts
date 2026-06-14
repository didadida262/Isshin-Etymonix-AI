import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

import { JUDGE_SYSTEM } from './persona';
import { getVisibleStreamingText, stripThinkContent } from './sanitize';
import { LLM_BASE_URL } from './types';

const JudgeVerdictSchema = z.object({
  verdict: z.string().describe('只能填写「正确」或「错误」'),
  feedback: z.string().describe('简短评语，一两句话，说明判词理由'),
});

const LLM_TIMEOUT_MS = 90_000;

const JUDGE_STREAM_SYSTEM = `${JUDGE_SYSTEM}

回复格式（严格遵守）：
第一行：【裁决】正确 或 【裁决】错误
空一行
第二段：一两句评语
不要输出 JSON 或其他格式。`;

function normalizeVerdict(raw: string): '正确' | '错误' {
  const text = (raw || '').trim();
  if (text.includes('正确') && !text.includes('错误')) return '正确';
  if (text.includes('错误')) return '错误';
  const lower = text.toLowerCase();
  if (['correct', 'right', 'true', 'yes'].includes(lower)) return '正确';
  return '错误';
}

function buildJudgePrompt(
  word: string,
  definition: string,
  root: string,
  rootMeaning: string,
  userExplanation: string
): string {
  return `请评判以下作答：

【词根】${root}（${rootMeaning}）
【目标单词】${word}
【标准释义】${definition}

【学习者解释】
${userExplanation}

请判断学习者解释是否符合词根与单词含义。`;
}

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

export function parseJudgeResponse(text: string): {
  verdict: '正确' | '错误';
  feedback: string;
} {
  const cleaned = stripThinkContent(text);
  const match = cleaned.match(/【裁决】\s*(正确|错误)/);
  const verdict = normalizeVerdict(match?.[1] ?? cleaned);
  const feedback = cleaned
    .replace(/【裁决】\s*(正确|错误)\s*/i, '')
    .replace(/^[\s\n]+/, '')
    .trim();
  return { verdict, feedback: feedback || '（无评语）' };
}

export async function runJudge(
  word: string,
  definition: string,
  root: string,
  rootMeaning: string,
  userExplanation: string,
  apiKey: string,
  model: string
): Promise<{ verdict: '正确' | '错误'; feedback: string }> {
  const llm = new ChatOpenAI({
    model,
    apiKey,
    configuration: { baseURL: LLM_BASE_URL.replace(/\/$/, '') },
  }).withStructuredOutput(JudgeVerdictSchema);

  const result = await llm.invoke([
    { role: 'system', content: JUDGE_SYSTEM },
    { role: 'user', content: buildJudgePrompt(word, definition, root, rootMeaning, userExplanation) },
  ]);

  return {
    verdict: normalizeVerdict(result.verdict),
    feedback: (result.feedback || '').trim(),
  };
}

export async function* streamJudge(
  word: string,
  definition: string,
  root: string,
  rootMeaning: string,
  userExplanation: string,
  apiKey: string,
  model: string
): AsyncGenerator<string> {
  const llm = createLlm(apiKey, model);
  const messages = [
    new SystemMessage(JUDGE_STREAM_SYSTEM),
    new HumanMessage(
      buildJudgePrompt(word, definition, root, rootMeaning, userExplanation)
    ),
  ];
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
