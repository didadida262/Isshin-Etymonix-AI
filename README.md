# 语言学写平台

基于 PRD 的单页应用：**React + TypeScript + Vite + Tailwind CSS + Framer Motion + axios**，默认暗色主题、支持亮/暗切换与移动端布局。

## 本地开发

```bash
npm install
npm run dev
```

开发环境默认使用 **Mock 数据**（见根目录 `.env.development` 中 `VITE_USE_MOCK=true`）。对接真实后端时：

1. 复制 `.env.example` 为 `.env.development`（或 `.env`），将 `VITE_USE_MOCK` 设为 `false`。
2. 配置 `VITE_API_BASE_URL`（或通过 Vite 的 `server.proxy` 转发到后端）。
3. 约定接口：`GET /profile`、`GET /articles`、`GET /articles/:id`（与 `src/types/api.ts` 及 Mock 数据结构对齐）。

## 构建

```bash
npm run build
npm run preview
```

## Apifox / OpenAPI 类型同步

在 Apifox 中导出 OpenAPI JSON 地址后执行：

```bash
APIFOX_OPENAPI_URL="https://your-openapi.json" npm run openapi:sync
```

会在 `src/types/generated-api.ts` 生成类型（首次需自行创建目录；脚本会创建文件）。

## 目录说明

- `src/theme/` — 主题 Token、`ThemeProvider` 与 `localStorage` 持久化
- `src/services/` — axios 实例与数据请求（含 Mock 分支）
- `src/mocks/` — 本地 Mock 数据
- `src/pages/` — 首页、文章详情
- `src/components/` — 侧栏、列表、骨架屏、主题切换等
