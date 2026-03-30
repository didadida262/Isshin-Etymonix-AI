# 语言学写平台

基于 **React + TypeScript + Vite + Tailwind CSS + Framer Motion** 的纯静态站点：文章与个人资料均打包在前端，**不请求任何后端接口**。

## 本地开发

```bash
npm install
npm run dev
```

## 新建文章

```bash
npm run new -- "文章标题" "语法"
npm run new -- --help
```

类别与说明见下文「目录说明」。新增 `src/content/articles/*.json` 后若列表未更新，**重启 dev**。

## 构建与部署

```bash
npm run build
npm run preview
```

Cloudflare Pages：Framework **React (Vite)**，Build **`npm run build`**，输出目录 **`dist`**（不要写成 `/dist`）。

## Apifox / OpenAPI（可选）

仅在你需要为**其它服务**生成类型时使用：

```bash
APIFOX_OPENAPI_URL="https://your-openapi.json" npm run openapi:sync
```

## 目录说明

- `src/mocks/data.ts` — 个人资料 `mockProfile`
- `src/content/articles/*.json` — 文章正文（由 `loadArticles` 聚合）
- `src/content/article-categories.json` — 类别定义
- `src/theme/` — 主题与 `ThemeProvider`
- `src/pages/`、`src/components/` — 页面与组件
