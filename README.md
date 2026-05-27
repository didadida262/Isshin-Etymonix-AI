# 英文词根斩

基于 **React + TypeScript + Vite + Tailwind CSS + Framer Motion** 的英语词根学习应用，右下角集成 ChatGPT 风格 AI 对话面板。

## 架构

```
前端 (React)  →  Cloudflare Worker (/api)  →  LangChain  →  大模型 (OpenAI 兼容 API)
```

- **前端**：聊天面板、大模型设置（Base URL / API Key / 模型）
- **API**：`worker/` 下的 TypeScript Worker（Hono + LangChain）
- **部署**：Cloudflare Pages 构建 `dist` + Worker（`run_worker_first` 处理 `/api/*`），无需 Docker / 独立后端服务器

## 本地开发

```bash
yarn install
yarn dev
```

浏览器打开 `http://localhost:5173`（Vite + Cloudflare 插件会同时启动 Worker，`/api` 与线上一致）：

1. 点击顶部 **齿轮** 打开设置，填写 API Key，点击「获取模型列表」并选择模型
2. 右下角 **AI 助手** 面板输入问题，Enter 发送（Shift+Enter 换行）

### 默认配置

| 项 | 默认值 |
|----|--------|
| Base URL | `https://aiplatform.njsrd.com/llm/v1` |
| 模型列表接口 | `https://aiplatform.njsrd.com/nexus/api/api-keys/models` |

## 部署到 Cloudflare Pages

1. 在 Cloudflare Dashboard 连接本仓库
2. **Build command**：`yarn build`
3. **Build output directory**：`dist`
4. `wrangler.toml` 已配置 `run_worker_first = ["/api/*"]`，API 与静态资源同域部署

或使用 CLI：

```bash
yarn deploy
```

## 目录结构

```
├── src/                    # React 前端
├── worker/
│   ├── index.ts            # /api/* 路由入口
│   └── lib/                # 对话、阅卷、模型列表
├── wrangler.toml           # Worker + 静态资源配置
└── Week1/                  # 早期 Python Agent 参考（不参与运行）
```

## 构建

```bash
yarn build
yarn build:check
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/models?api_key=...` | 代理获取可用模型列表 |
| POST | `/api/chat/stream` | SSE 流式对话（推荐） |
| POST | `/api/chat` | 非流式对话 |
| POST | `/api/judge` | 阅卷评判 |
