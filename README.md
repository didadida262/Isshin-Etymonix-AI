# Etymonix

An English word-root learning app built with **React + TypeScript + Vite + Tailwind CSS + Framer Motion**, with a ChatGPT-style AI chat panel in the bottom-right corner.

## Architecture

```
Frontend (React)  →  Model list: direct to third-party API
                  →  Chat / grading: via Cloudflare Worker (/api Agent)
                  →  Agent calls a hardcoded LLM completion endpoint
```

- **Frontend**: Configure API Key / model; model list connects directly to `aiplatform.njsrd.com`
- **Agent (/api)**: Judge persona, streaming chat, grading; internally calls `https://aiplatform.njsrd.com/llm/v1`
- **Deployment**: Cloudflare Pages builds `dist` + Worker (`run_worker_first` handles `/api/*`); no Docker or separate backend server required

## Local Development

```bash
yarn install
yarn dev
corepack yarn dev
```

Open `http://localhost:5173` in your browser (Vite + Cloudflare plugin starts the Worker alongside the app; `/api` behaves the same as production):

1. Click the **gear** icon at the top to open Settings, enter your API Key, click "Fetch Model List", and select a model
2. Type a question in the bottom-right **AI Assistant** panel; press Enter to send (Shift+Enter for a new line)

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
| GET | `/api/health` | Health check |
| POST | `/api/chat/stream` | SSE streaming chat (recommended, Agent) |
| POST | `/api/chat` | Non-streaming chat |
| POST | `/api/judge` | Grading / evaluation |
