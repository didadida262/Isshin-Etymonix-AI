# 紧急恢复：整站 404

## 先救回来（1 分钟）

Cloudflare → **Workers & Pages** → 项目 **project-language** → **Deployments**

1. 找到**上一次还能打开首页**的那条部署（绿勾、日期更早）
2. 点 **⋯** → **Rollback to this deployment**

首页会先回来（可能还是旧版 JS）。

---

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

**Build output directory：** 留空

**Environment variables（Production + Preview）：**

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NODE_VERSION` = `20`

部署后检查：

- `https://www.mileswang262.com/` → 能打开
- `https://www.mileswang262.com/api/health` → `{"status":"ok"}`

---

## 聊天 405 Method Not Allowed

原因：`public/_redirects` 里 `/* → /index.html` 把 **`/api/*` 也当成静态页**了。GET 返回首页 HTML（假 200），POST 返回 405。

已删除该文件（应用用 hash 路由，不需要全站 SPA 回退）。

**聊天 / 阅卷必须部署 Worker**，仅 `yarn build:pages` 不够：

```bash
# Build command（需 CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID）
yarn build:cf
# Output directory：留空
```

自检：`curl -X POST https://你的域名/api/chat/stream` 不应再是 405（未配 Token 时构建会失败，勿只用 build:pages）。

## 部署后自检

1. **Caching → Purge Everything**
2. 无痕窗口打开站点
3. F12 → Network：JS 不应再是旧的 `index-7ytnn2NB.js`（以最新 build 的 hash 为准）
4. 模型列表请求域名应为 `aiplatform.njsrd.com`，不是 `/api/models`
5. `POST /api/chat/stream` 不是 405；`GET /api/health` 返回 `{"status":"ok"}` 而不是 HTML
