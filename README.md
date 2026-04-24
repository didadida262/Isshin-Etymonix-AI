# 语言学写平台

基于 **React + TypeScript + Vite + Tailwind CSS + Framer Motion** 的纯静态站点：文章与个人资料均打包在前端，**不请求任何后端接口**。

## 本地开发

### Web 开发

```bash
npm install
npm run dev
```

### Electron 桌面应用开发

```bash
npm run electron:dev
```

这将启动 Vite 开发服务器和 Electron 应用。

## 新建文章

```bash
npm run new -- "文章标题" "语法"
npm run new -- --help
```

类别与说明见下文「目录说明」。新增 `src/content/articles/*.md` 后若列表未更新，**重启 dev**。

## 构建与部署

### Web 构建

```bash
npm run build
npm run preview
```

Cloudflare Pages：Framework **React (Vite)**，Build **`npm run build`**，输出目录 **`dist`**（不要写成 `/dist`）。

### Electron 桌面应用构建

#### macOS

```bash
npm run electron:build:mac
```

输出文件在 `release/` 目录，包含 `.dmg` 和 `.zip` 文件。

#### Windows

```bash
npm run electron:build:win
```

输出文件在 `release/` 目录，包含 `.exe` 安装包和便携版。

#### Linux

```bash
npm run electron:build:linux
```

输出文件在 `release/` 目录，包含 `.AppImage` 和 `.deb` 文件。

#### 全平台构建

```bash
npm run electron:build
```

## Apifox / OpenAPI（可选）

仅在你需要为**其它服务**生成类型时使用：

```bash
APIFOX_OPENAPI_URL="https://your-openapi.json" npm run openapi:sync
```

## 目录说明

- `src/mocks/data.ts` — 个人资料 `mockProfile`
- `src/content/articles/*.md` — 文章正文（由 `loadArticles` 聚合，兼容旧 `.json`）
- `src/content/article-categories.json` — 类别定义
- `src/theme/` — 主题与 `ThemeProvider`
- `src/pages/`、`src/components/` — 页面与组件
- `electron/` — Electron 主进程和预加载脚本
- `release/` — Electron 构建输出目录（构建桌面应用时生成）

## Electron 特性

- ✅ 跨平台支持（macOS、Windows、Linux）
- ✅ 自动更新支持（可配置）
- ✅ 原生菜单和快捷键
- ✅ 安全的上下文隔离
- ✅ 窗口管理（最小化、最大化、关闭）
