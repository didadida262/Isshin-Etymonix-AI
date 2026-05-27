# 紧急恢复：整站 404

## 先救回来（1 分钟）

Cloudflare → **Workers & Pages** → 项目 **project-language** → **Deployments**

1. 找到**上一次还能打开首页**的那条部署（绿勾、日期更早）
2. 点 **⋯** → **Rollback to this deployment**

首页会先回来（可能还是旧版 JS）。

---

## 构建报错：`main` 与 `pages_build_output_dir` 不能同时存在

Pages 会校验根目录 `wrangler.toml`，不能与 Worker 配置混写。本项目已改为：

- **`wrangler.worker.toml`**：仅 `yarn build:cf` / `wrangler deploy` 使用
- **根目录不再有 `wrangler.toml`**，避免 Pages 校验失败

## 为什么会整站 404

常见组合错误：

| 错误配置 | 结果 |
|----------|------|
| Output = `dist/client`，但 **没构建出** `dist/client`（build 失败） | 空目录 → 全站 404 |
| Build 里跑了 `wrangler deploy`，但 **Worker 没绑好静态资源** | 域名指向 Worker → 全站 404 |
| Output = `dist`（不是 `dist/client`） | 发错目录 / 旧包 |

---

## 推荐两套配置（二选一，不要混）

### 方案 1：先恢复网站（只要页面能开）

**Build command：**

```bash
yarn build:pages
```

**Build output directory：**

```text
dist
```

（`build:pages` 会把 `dist/client` 同步到 `dist/` 根目录，**不要**只填 `dist/client`，否则容易整站 404。）

**不要**在 Build 里加 `wrangler deploy`。

AI `/api` 暂时不可用，但首页不会 404。

---

### 方案 2：页面 + API 一起上（需要 Token）

**Build command：**

```bash
yarn build:cf
```

**Build output directory：** 若界面固定为 **`/`** 无法修改——可以保留 `/`，但必须用下面的 build 命令（会把 `dist/` 复制到根目录再发布）。

> ⚠️ 若 **没有** 跑 `publish-dist-to-root`，`/` 会发布 Git 里的开发版 `index.html`（含 `/src/main.tsx`）→ 白屏 / MIME 报错。

**Environment variables（Production + Preview）：**

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NODE_VERSION` = `20`

部署后检查：

- `https://www.mileswang262.com/` → 能打开
- `https://www.mileswang262.com/api/health` → `{"status":"ok"}`

---

## 聊天 405 Method Not Allowed

**现象**：`POST /api/chat/stream` → 405，但 `GET /api/health` 返回的是 **HTML** 而不是 JSON。

**原因**：只有 **Pages 静态站**在跑，`/api` 没被 Functions/Worker 接管（静态托管不允许对「页面」做 POST）。

**修复**：仓库已加 `functions/api/`（Pages Functions）+ `public/_routes.json`（只让 `/api/*` 走 Functions）。

**Build command 用**：

```bash
yarn build:pages
```

**Output**：`/`（固定即可）

**不要**再依赖 `yarn build:cf` 才能聊天（除非你自己用 CLI 部署 Worker）。

自检：

- `GET /api/health` → `{"status":"ok"}`（不是 HTML）
- `POST /api/chat/stream` → 不是 405

## 部署后自检

1. **Caching → Purge Everything**
2. 无痕窗口打开站点
3. F12 → Network：JS 不应再是旧的 `index-7ytnn2NB.js`（以最新 build 的 hash 为准）
4. 模型列表请求域名应为 `aiplatform.njsrd.com`，不是 `/api/models`
5. `POST /api/chat/stream` 不是 405；`GET /api/health` 返回 `{"status":"ok"}` 而不是 HTML
