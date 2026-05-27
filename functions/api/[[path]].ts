import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

import { runChat, streamChat } from '../_lib/chat';
import { runJudge } from '../_lib/judge';
import { type ChatRequest, type JudgeRequest } from '../_lib/types';
import { validateChatFields } from '../_lib/validate';

const app = new Hono().basePath('/api');

app.get('/health', (c) => c.json({ status: 'ok' }));

app.post('/judge', async (c) => {
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

app.post('/chat/stream', async (c) => {
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
      try {
        for await (const delta of streamChat(
          req.message.trim(),
          req.history ?? [],
          req.api_key.trim(),
          req.model.trim()
        )) {
          send({ content: delta });
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        send({ error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});

app.post('/chat', async (c) => {
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

export const onRequest = handle(app);
