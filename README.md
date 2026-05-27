# 英文词根斩

基于 **React + TypeScript + Vite + Tailwind CSS + Framer Motion** 的英语词根学习应用，右下角集成 ChatGPT 风格 AI 对话面板。

## 架构

```
前端 (React)  →  模型列表直连第三方
              →  对话/阅卷走 Cloudflare Worker (/api Agent)
              →  Agent 调用写死的 LLM 补全接口
```

- **前端**：设置 API Key / 模型；模型列表直连 `aiplatform.njsrd.com`
- **Agent（/api）**：判官人设、流式对话、阅卷；内部固定调用 `https://aiplatform.njsrd.com/llm/v1`
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
| 模型列表（前端直连） | `https://aiplatform.njsrd.com/nexus/api/api-keys/models` |
| LLM 补全（仅 Agent） | `https://aiplatform.njsrd.com/llm/v1` |

## 部署到 Cloudflare

本项目使用 `@cloudflare/vite-plugin`，构建后静态资源在 `dist/client/`，Worker 在 `dist/english_root_zhan/`。**不要**只把 `dist` 当纯静态目录部署（会导致 `/assets/*` 404、白屏）。

### 整站 404 时

见 [docs/DEPLOY-RECOVERY.md](docs/DEPLOY-RECOVERY.md)：先在 Deployments **回滚**，再按下面二选一配置。

### 方式 A：Dashboard（Git 自动部署）⚠️ 必读

`vite build` 后前端在 **`dist/client/`**，不在 `dist/` 根目录。若 Output 填成 `dist`，线上会一直跑**旧 JS**（仍请求 `/api/models`、仍有 Base URL 输入框）。

在 Cloudflare → **Workers & Pages** → 你的项目 → **Settings** → **Builds**：

| 配置项 | 正确值 | 错误示例 |
|--------|--------|----------|
| **Build command** | 先救站：`yarn build:pages`；要 API：`yarn build:cf` + Token | 只 `vite build` 不 sync / Token 缺失 |
| **Build output directory** | 界面若是 **`/`** 且不能改：保持 `/`，用 `yarn build:pages` 或 `yarn build:cf`（脚本会发布到根目录） | 只跑 `vite build` 不 publish → 白屏 |

部署后自检：打开首页 → F12 → 看 JS 文件名应是 **`index-BqyeXQGv.js`** 这类新 hash，且 Network 里模型列表请求域名是 **`aiplatform.njsrd.com`**，不是 `mileswang262.com/api/models`。

并在 **Settings → Environment variables** 中配置（**Production** 与 **Preview** 都要加，类型选 **Encrypt**）：

| 变量 | 说明 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | 见下方「创建 API Token」 |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard 右侧 **Account ID**（32 位字符串） |
| `NODE_VERSION` | `20` |

#### 创建 API Token（解决 `CLOUDFLARE_API_TOKEN` 报错）

1. 打开 [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token**
2. 选模板 **Edit Cloudflare Workers**（或 Custom：Account → **Workers Scripts** → **Edit**）
3. Account Resources 选 **Include** → 你的账户
4. 创建后 **复制 Token**（只显示一次）
5. 回到 Pages 项目 → **Settings** → **Variables** → 新增 `CLOUDFLARE_API_TOKEN`，粘贴 Token，勾选加密
6. 保存后 **Retry deployment**

> 构建日志里 `In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN` 即表示第 5 步未配置或变量名拼写错误。

部署完成后访问 `https://你的域名/api/health` 应返回 `{"status":"ok"}`。

### 方式 B：本机 CLI

```bash
npx wrangler login
yarn deploy
```

`yarn deploy` = `vite build` + `wrangler deploy`（前端 + `/api` Worker 一起发布）。

## 目录结构

```
├── src/                    # React 前端
├── worker/
│   ├── index.ts            # /api/* 路由入口
│   └── lib/                # 对话、阅卷、模型列表
├── wrangler.worker.toml    # Worker + 静态资源（勿与 Pages 的 wrangler.toml 混用）
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
| POST | `/api/chat/stream` | SSE 流式对话（推荐，Agent） |
| POST | `/api/chat` | 非流式对话 |
| POST | `/api/judge` | 阅卷评判 |
