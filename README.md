# Etymonix

An English word-root learning app built with **React + TypeScript + Vite + Tailwind CSS + Framer Motion**, with a ChatGPT-style AI chat panel in the bottom-right corner.

## Architecture

```
Frontend (React)  →  Supabase Auth (sign in / sign up)
                  →  /api/* with Bearer JWT (Cloudflare Worker)
                  →  Agent calls LLM completion endpoint
```

- **Frontend**: Supabase email/password auth; API Key / model in Settings
- **Auth**: Supabase issues JWT; Worker verifies `SUPABASE_JWT_SECRET` on protected routes
- **Agent (/api)**: Judge persona, streaming chat, grading; internally calls `https://aiplatform.njsrd.com/llm/v1`
- **Deployment**: Cloudflare Worker + static assets (`run_worker_first` handles `/api/*`)

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. **Authentication → Providers → Email**: enable Email provider
3. For local dev without email confirmation: **Authentication → Providers → Email** → disable “Confirm email” (optional)
4. Copy from **Project Settings → API**:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`
   - JWT Secret → `SUPABASE_JWT_SECRET` (Worker only, never expose in frontend)

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
# Fill in values, then:
corepack yarn dev
```

Production Worker secret:

```bash
wrangler secret put SUPABASE_JWT_SECRET --config wrangler.worker.toml
```

Cloudflare Pages: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables.

## Local Development

```bash
yarn install
yarn dev
corepack yarn dev
```

Open `http://localhost:5173` in your browser (Vite + Cloudflare plugin starts the Worker alongside the app; `/api` behaves the same as production):

1. **Sign in** or **create an account** on the auth screen
2. Click the **gear** icon to open Settings, enter your API Key, fetch models, and select one
3. Use the bottom-right **AI Assistant** panel; Enter to send, Shift+Enter for a new line

## Project Structure

```
├── src/                    # React frontend
├── worker/
│   ├── index.ts            # /api/* route entry
│   └── lib/                # Chat, grading, model list
├── wrangler.worker.toml    # Worker + static assets (do not mix with Pages wrangler.toml)
└── Week1/                  # Early Python Agent reference (not used at runtime)
```

## Build

```bash
yarn build
yarn build:check
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (public) |
| GET | `/api/models` | Model list (auth required) |
| POST | `/api/chat/stream` | SSE streaming chat (auth required) |
| POST | `/api/chat` | Non-streaming chat (auth required) |
| POST | `/api/judge` | Grading / evaluation (auth required) |
