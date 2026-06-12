import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';

export interface AuthBindings {
  SUPABASE_JWT_SECRET: string;
}

export type AuthVariables = {
  userId: string;
  userEmail?: string;
};

export const requireAuth = createMiddleware<{
  Bindings: AuthBindings;
  Variables: AuthVariables;
}>(async (c, next) => {
  const secret = c.env.SUPABASE_JWT_SECRET?.trim();
  if (!secret) {
    return c.json({ detail: 'Server auth is not configured' }, 503);
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ detail: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return c.json({ detail: 'Unauthorized' }, 401);
  }

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    if (payload.role !== 'authenticated') {
      return c.json({ detail: 'Unauthorized' }, 401);
    }

    const userId = payload.sub;
    if (!userId) {
      return c.json({ detail: 'Unauthorized' }, 401);
    }

    c.set('userId', userId);
    if (typeof payload.email === 'string') {
      c.set('userEmail', payload.email);
    }

    await next();
  } catch {
    return c.json({ detail: 'Unauthorized' }, 401);
  }
});
