import { Hono } from 'hono';

import { requireAuth, type AuthBindings, type AuthVariables } from './lib/auth';
import { runChat, runQuickTest, streamChat } from './lib/chat';
import { parseJudgeResponse, runJudge, streamJudge } from './lib/judge';
import { fetchModels } from './lib/models';
import {
  type ChatRequest,
  type JudgeRequest,
  LLM_BASE_URL,
} from './lib/types';
import { validateChatFields } from './lib/validate';

const app = new Hono<{ Bindings: AuthBindings; Variables: AuthVariables }>().basePath('/api');

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

app.get('/health', (c) => c.json({ status: 'ok', llm_base_url: LLM_BASE_URL }));

app.get('/models', requireAuth, async (c) => {
  const apiKey = c.req.query('api_key');
  if (!apiKey?.trim()) {
    return c.json({ detail: 'api_key 不能为空' }, 400);
  }
  try {
    const { models, raw } = await fetchModels(apiKey.trim());
    return c.json({ models, raw });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return c.json({ detail: message }, 502);
  }
});

app.post('/test', requireAuth, async (c) => {
  const body = await c.req.json<{ api_key?: string; model?: string }>();
  const err = validateChatFields({
    api_key: body.api_key ?? '',
    model: body.model ?? '',
    message: 'test',
  });
  if (err) return c.json({ detail: err }, 400);

  try {
    const reply = await runQuickTest(body.api_key!.trim(), body.model!.trim());
    return c.json({ reply: reply || '' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return c.json({ detail: message }, 500);
  }
});

app.post('/judge', requireAuth, async (c) => {
  const req = await c.req.json<JudgeRequest>();
  const err = validateChatFields({
    api_key: req.api_key,
    model: req.model,
    message: req.user_explanation,
  });
  if (err) return c.json({ detail: err }, 400);

  try {
    const result = await runJudge(
      req.word.trim(),
      req.definition.trim(),
      req.root.trim(),
      req.root_meaning.trim(),
      req.user_explanation.trim(),
      req.api_key.trim(),
      req.model.trim()
    );
    return c.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return c.json({ detail: message }, 500);
  }
});

app.post('/judge/stream', requireAuth, async (c) => {
  const req = await c.req.json<JudgeRequest>();
  const err = validateChatFields({
    api_key: req.api_key,
    model: req.model,
    message: req.user_explanation,
  });
  if (err) return c.json({ detail: err }, 400);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, string>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          /* stream closed */
        }
      }, 12_000);

      let accumulated = '';

      try {
        send({ content: '' });
        for await (const delta of streamJudge(
          req.word.trim(),
          req.definition.trim(),
          req.root.trim(),
          req.root_meaning.trim(),
          req.user_explanation.trim(),
          req.api_key.trim(),
          req.model.trim()
        )) {
          if (delta) {
            accumulated += delta;
            send({ content: delta });
          }
        }
        const result = parseJudgeResponse(accumulated);
        send({ verdict: result.verdict, feedback: result.feedback });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        send({ error: message });
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
});

app.post('/chat/stream', requireAuth, async (c) => {
  const req = await c.req.json<ChatRequest>();
  const err = validateChatFields(req);
  if (err) return c.json({ detail: err }, 400);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, string>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          /* stream closed */
        }
      }, 12_000);

      try {
        send({ content: '' });
        for await (const delta of streamChat(
          req.message.trim(),
          req.history ?? [],
          req.api_key.trim(),
          req.model.trim()
        )) {
          if (delta) send({ content: delta });
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        send({ error: message });
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
});

app.post('/chat', requireAuth, async (c) => {
  const req = await c.req.json<ChatRequest>();
  const err = validateChatFields(req);
  if (err) return c.json({ detail: err }, 400);

  try {
    const reply = await runChat(
      req.message.trim(),
      req.history ?? [],
      req.api_key.trim(),
      req.model.trim()
    );
    return c.json({ reply: reply || '' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return c.json({ detail: message }, 500);
  }
});

export default app;
