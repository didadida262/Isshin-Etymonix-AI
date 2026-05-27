import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

import { JUDGE_SYSTEM } from './persona';

const JudgeVerdictSchema = z.object({
  verdict: z.string().describe('只能填写「正确」或「错误」'),
  feedback: z.string().describe('简短评语，一两句话，说明判词理由'),
});

function normalizeVerdict(raw: string): '正确' | '错误' {
  const text = (raw || '').trim();
  if (text.includes('正确') && !text.includes('错误')) return '正确';
  if (text.includes('错误')) return '错误';
  const lower = text.toLowerCase();
  if (['correct', 'right', 'true', 'yes'].includes(lower)) return '正确';
  return '错误';
}

export async function runJudge(
  word: string,
  definition: string,
  root: string,
  rootMeaning: string,
  userExplanation: string,
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<{ verdict: '正确' | '错误'; feedback: string }> {
  const llm = new ChatOpenAI({
    model,
    apiKey,
    configuration: { baseURL: baseUrl.replace(/\/$/, '') },
  }).withStructuredOutput(JudgeVerdictSchema);

  const prompt = `请评判以下作答：

【词根】${root}（${rootMeaning}）
【目标单词】${word}
【标准释义】${definition}

【学习者解释】
${userExplanation}

请判断学习者解释是否符合词根与单词含义。`;

  const result = await llm.invoke([
    { role: 'system', content: JUDGE_SYSTEM },
    { role: 'user', content: prompt },
  ]);

  return {
    verdict: normalizeVerdict(result.verdict),
    feedback: (result.feedback || '').trim(),
  };
}
