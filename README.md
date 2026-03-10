# Cloudflare Pages + D1 多端同步模板

完全免费的静态应用云端同步方案。前端托管在 Cloudflare Pages，数据存储在 Cloudflare D1（SQLite），通过 Pages Functions 提供 API，支持多设备实时同步。

---

## 架构概览

```
浏览器（localStorage）
    ↕  CloudSync 模块（本地优先 + 云端同步）
Cloudflare Pages（静态文件托管）
    ↕  Pages Functions（/api/data）
Cloudflare D1（SQLite 数据库）
```

**设计理念：本地优先**
- 所有读写操作先走 localStorage，不依赖网络
- 数据修改后 1 秒自动推送云端（防抖）
- 打开页面时自动拉取云端数据（时间戳比较，保护离线修改）

---

## 文件说明

```
cf-pages-d1-template/
├── functions/
│   ├── _middleware.js     # HTTP Basic Auth 鉴权（拦截所有请求）
│   └── api/
│       └── data.js        # GET/PUT 数据接口
├── cloudsync.js           # 前端同步模块（集成到你的 JS 文件）
├── schema.sql             # D1 数据库表结构
├── wrangler.toml          # Cloudflare 配置（填入你的 database_id）
└── .github/
    └── workflows/
        └── notify-feishu.yml  # 飞书推送通知
```

---

## 快速上手

### 1. 创建 D1 数据库

```bash
npx wrangler d1 create your_db_name
```

记录输出的 `database_id`。

### 2. 初始化数据表

```bash
npx wrangler d1 execute your_db_name --file=schema.sql --remote
```

### 3. 填写 wrangler.toml

将 `YOUR_DATABASE_ID_HERE` 替换为真实的 database_id，并修改 `name` 和 `database_name`。

### 4. 集成 CloudSync 到你的前端

将 `cloudsync.js` 的内容复制到你的 JS 文件，修改 `SYNC_KEYS` 为实际需要同步的 localStorage key 列表。

在应用启动处调用 `pull`，在数据写入后调用 `schedulePush`：

```javascript
// 启动前拉取云端数据
CloudSync.pull().finally(() => {
    // 渲染你的应用
    renderApp();
});

// 数据写入 localStorage 后触发推送
function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    CloudSync.schedulePush();
}
```

### 5. 部署到 Cloudflare Pages

```bash
git add .
git commit -m "init"
git push origin main
```

在 Cloudflare Pages 控制台：
- 连接 GitHub 仓库
- Build command：**留空**
- Build output directory：`/`
- Settings → Functions → D1 bindings：Variable `DB` → 选择你的数据库
- Settings → Environment variables：添加 `AUTH_PASSWORD`（访问密码）

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data` | 返回全量数据及 `updated_at` 时间戳 |
| PUT | `/api/data` | 覆盖保存全量数据 |

**GET 响应示例：**
```json
{
  "ok": true,
  "data": { "your_key": [...] },
  "updated_at": "2026-03-09T10:00:00.000Z"
}
```

---

## 鉴权说明

通过 `functions/_middleware.js` 实现 HTTP Basic Auth。浏览器会弹出用户名/密码框，用户名随意，密码为 `AUTH_PASSWORD` 环境变量的值。

> 适合个人使用，无需 Cloudflare Access，不需要绑定信用卡。

---

## 离线同步冲突处理

使用时间戳比较策略：

- 每次 push 成功 → 记录 `_local_updated_at` 到 localStorage
- pull 时比较 D1 的 `updated_at` 与本地 `_local_updated_at`
- 只有云端更新才覆盖本地，离线修改不会被丢失

---

## 费用

完全免费，使用 Cloudflare 免费套餐：

| 服务 | 免费额度 |
|------|----------|
| Cloudflare Pages | 无限静态请求 |
| Pages Functions | 10万次/天 |
| D1 数据库 | 5GB 存储，500万次读/天 |
