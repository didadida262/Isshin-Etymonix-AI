# Etymonix · English Root Zhan

> Drill English word roots into long-term memory with **bombard sessions** and **AI grading**.

## About

Etymonix (Isshin English Root Zhan) is a web app for word-root memorization. Vocabulary is organized by Unit; learners flip cards in timed **bombard** drills to recall root meanings, then submit explanations to the AI **Judge** for real-time grading. A bottom-right chat panel is always available for etymology, morphology, and study tips.

## Highlights

| Feature | Description |
|---------|-------------|
| **Root Bombard** | Unit-based card draws with flip-and-recall drills and timed definition reveals |
| **AI Judge** | Dedicated grading persona with streaming correct/incorrect verdicts and on-demand Q&A |
| **Session Scoring** | 5 cards per round; end-of-session accuracy with grades (Excellent / Good / Pass / Fail) |
| **BYOK Models** | Configure your API key and model in Settings to connect any supported LLM |
| **Bilingual UI** | Switch between Chinese and English in one click |

## Quick Start

1. **Sign up** or **sign in** (Supabase email auth)
2. Open **Settings** (gear icon) → enter your API key, fetch models, and select one
3. Pick a Unit on the home screen → **Start Bombard**
4. Recall the root from each card, submit your explanation in the **Judge panel** (bottom-right); ask follow-up questions anytime

## Tech Stack

React · TypeScript · Vite · Tailwind CSS · Framer Motion · Supabase Auth · Cloudflare Worker

## Architecture

```
Frontend (React)  →  Supabase Auth (sign in / sign up)
                →  /api/* with Bearer JWT (Cloudflare Worker)
                 →  Agent calls LLM completion endpoint
```

- **Frontend**: Supabase email/password auth; API key and model configured in Settings
- **Auth**: Supabase issues JWT; Worker verifies `SUPABASE_JWT_SECRET` on protected routes
- **Agent (/api)**: Judge persona, streaming chat, grading; internally calls `https://aiplatform.njsrd.com/llm/v1`
- **Deployment**: Cloudflare Worker + static assets (`run_worker_first` handles `/api/*` first)

## Local Development

```bash
yarn install
cp .env.example .env
cp .dev.vars.example .dev.vars
# Fill in Supabase and Worker variables, then:
corepack yarn dev
```

Open `http://localhost:5173` (Vite + Cloudflare plugin starts the Worker alongside the app; local `/api` matches production behavior).

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. **Authentication → Providers → Email**: enable the Email provider
3. For local dev without email confirmation: disable “Confirm email” (optional)
4. Copy from **Project Settings → API**:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`
   - JWT Secret → `SUPABASE_JWT_SECRET` (Worker only; never expose in the frontend)

Production Worker secret:

```bash
wrangler secret put SUPABASE_JWT_SECRET --config wrangler.worker.toml
```

Cloudflare Pages build variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

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
