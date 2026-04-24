# 韦林英文词根轰炸

基于 **React + TypeScript + Vite + Tailwind CSS + Framer Motion** 的英语词根学习应用，支持 Web 和 Electron 桌面端。

## ✨ 特性

- 🚀 高性能：优化的 React 组件和动画
- 🎨 精美 UI：现代化设计，暗色主题
- ⚡ 快速响应：60fps 流畅体验
- 🖥️ 跨平台：Web + 桌面应用（macOS/Windows/Linux）
- 📦 完全 TypeScript 支持

## 🛠️ TypeScript 支持

项目已全面采用 TypeScript，提供：

- ✅ 完整的类型定义
- ✅ 类型安全的 API
- ✅ 智能代码补全
- ✅ 编译时错误检查
- ✅ 更好的可维护性

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

## TypeScript 类型结构

### 核心类型

```typescript
// 单词项
interface WordItem {
  word: string;
  definition: string;
  root?: string;
}

// 词根组
interface RootGroup {
  root: string;
  meaning: string;
  words: WordItem[];
}

// 单元信息
interface RootUnit {
  id: number;
  label: string;
  locked: boolean;
}
```

## 构建与部署

### Web 构建

```bash
npm run build
npm run preview
```

Cloudflare Pages：Framework **React (Vite)**，Build **`npm run build`**，输出目录 **`dist`**（不要写成 `/dist`）。

### TypeScript 检查

```bash
# 仅检查类型
npx tsc --noEmit

# 构建时自动检查
npm run build:check
```

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

- `src/types/` — TypeScript 类型定义
- `src/data/` — 数据文件和 JSON 导入
- `src/lib/` — 工具函数和库
- `src/pages/` — 页面组件
- `src/components/` — 可复用组件
- `electron/` — Electron 主进程和预加载脚本
- `release/` — Electron 构建输出目录

## Electron 特性

- ✅ 跨平台支持（macOS、Windows、Linux）
- ✅ 自动更新支持（可配置）
- ✅ 原生菜单和快捷键
- ✅ 安全的上下文隔离
- ✅ 窗口管理（最小化、最大化、关闭）
- ✅ 性能优化（60fps 流畅体验）

## 性能优化

项目已应用以下性能优化：

- ✅ React.memo 组件缓存
- ✅ useMemo 和 useCallback 优化
- ✅ 动画简化（根据 prefers-reduced-motion）
- ✅ 代码分割和懒加载
- ✅ Electron 主进程优化

详见 [ELECTRON_PERFORMANCE.md](./ELECTRON_PERFORMANCE.md)
