import { createMiddleware } from 'hono/factory';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface AuthBindings {
  SUPABASE_URL?: string;
  SUPABASE_JWT_SECRET?: string;
}

export type AuthVariables = {
  userId: string;
  userEmail?: string;
};

interface VerifiedClaims {
  sub: string;
  email?: string;
  role?: string;
}

async function verifySupabaseJwt(
  token: string,
  env: AuthBindings
): Promise<VerifiedClaims | null> {
  const supabaseUrl = env.SUPABASE_URL?.trim().replace(/\/$/, '');

  if (supabaseUrl) {
    try {
      const jwks = createRemoteJWKSet(
        new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
      );
      const { payload } = await jwtVerify(token, jwks);
      return {
        sub: payload.sub ?? '',
        email: typeof payload.email === 'string' ? payload.email : undefined,
        role: typeof payload.role === 'string' ? payload.role : undefined,
      };
    } catch {
      /* fall through to legacy HS256 */
    }
  }

  const secret = env.SUPABASE_JWT_SECRET?.trim();
  if (!secret) return null;

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return {
      sub: payload.sub ?? '',
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: typeof payload.role === 'string' ? payload.role : undefined,
    };
  } catch {
    return null;
  }
}

export const requireAuth = createMiddleware<{
  Bindings: AuthBindings;
  Variables: AuthVariables;
}>(async (c, next) => {
  const supabaseUrl = c.env.SUPABASE_URL?.trim();
  const jwtSecret = c.env.SUPABASE_JWT_SECRET?.trim();
  if (!supabaseUrl && !jwtSecret) {
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

  const claims = await verifySupabaseJwt(token, c.env);
  if (!claims || claims.role !== 'authenticated' || !claims.sub) {
    return c.json({ detail: 'Unauthorized' }, 401);
  }

  c.set('userId', claims.sub);
  if (claims.email) {
    c.set('userEmail', claims.email);
  }

  await next();
});
