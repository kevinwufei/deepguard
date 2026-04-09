# DeepGuard — DigitalOcean App Platform 部署指南

## 前置条件

- DigitalOcean 账号（[注册](https://cloud.digitalocean.com)）
- GitHub 仓库已就绪：`kevinwufei/deepguard`
- 域名 `deepguard.org` 的 DNS 管理权限

---

## 第一步：创建 App

1. 登录 DigitalOcean → 点击左上角 **Create → Apps**
2. 选择 **GitHub** → 授权 DigitalOcean 访问你的 GitHub
3. 选择仓库 `kevinwufei/deepguard`，分支 `main`
4. 勾选 **Autodeploy**（每次 push 自动重新部署）
5. 点击 **Next**

---

## 第二步：配置构建命令

DigitalOcean 自动检测 Node.js，手动修改以下字段：

| 字段 | 值 |
|------|----|
| **Build Command** | `npm install -g pnpm && pnpm install && pnpm build` |
| **Run Command** | `pnpm start` |
| **HTTP Port** | `3000` |

---

## 第三步：添加数据库

1. 在 App 配置页面点击 **Add Resource → Database**
2. 选择 **MySQL 8**，套餐选 **Basic（$15/月）**
3. 名称填 `db`
4. DigitalOcean 会自动把 `DATABASE_URL` 注入到你的 App 环境变量里

---

## 第四步：配置环境变量

在 App 配置页面点击 **Environment Variables**，逐一添加：

### 必填变量

| 变量名 | 说明 | 从哪里获取 |
|--------|------|-----------|
| `NODE_ENV` | `production` | 直接填写 |
| `JWT_SECRET` | 随机字符串，用于签名 session | 运行 `openssl rand -hex 32` 生成 |
| `SIGHTENGINE_API_USER` | SightEngine 用户名 | [sightengine.com](https://sightengine.com) 控制台 |
| `SIGHTENGINE_API_SECRET` | SightEngine 密钥 | [sightengine.com](https://sightengine.com) 控制台 |
| `ILLUMINARTY_API_KEY` | Illuminarty API Key | [illuminarty.ai](https://illuminarty.ai) 控制台 |
| `VITE_APP_TITLE` | `DeepGuard` | 直接填写 |

### Manus OAuth 相关（如果继续用 Manus 登录）

| 变量名 | 值 |
|--------|-----|
| `VITE_APP_ID` | 从 Manus 项目设置获取 |
| `OAUTH_SERVER_URL` | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im` |
| `OWNER_OPEN_ID` | 从 Manus 项目设置获取 |
| `OWNER_NAME` | 你的名字 |
| `BUILT_IN_FORGE_API_URL` | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | 从 Manus 项目设置获取 |
| `VITE_FRONTEND_FORGE_API_KEY` | 从 Manus 项目设置获取 |
| `VITE_FRONTEND_FORGE_API_URL` | `https://api.manus.im` |

> **注意**：`DATABASE_URL` 由 DigitalOcean 自动注入，不需要手动填写。

---

## 第五步：数据库初始化

App 首次部署成功后，需要运行数据库迁移：

1. 在 DigitalOcean App 控制台，点击 **Console**（控制台）
2. 运行：
   ```bash
   pnpm drizzle-kit migrate
   ```
   或者直接把 `drizzle/` 目录下的 SQL 文件按顺序在数据库里执行（0000 → 0006）

---

## 第六步：绑定域名 deepguard.org

1. 在 App 控制台点击 **Settings → Domains**
2. 点击 **Add Domain** → 输入 `deepguard.org`
3. DigitalOcean 会显示一个 CNAME 或 A 记录值
4. 去你的域名注册商（GoDaddy / Namecheap / 阿里云等）添加该 DNS 记录
5. 等待 DNS 生效（通常 5-30 分钟），DigitalOcean 自动配置 HTTPS

---

## 第七步：验证部署

访问 `https://deepguard.org`，确认：
- [ ] 首页正常加载
- [ ] 图片检测功能可用
- [ ] 用户登录正常

---

## 自动部署流程（之后每次更新）

```bash
# 本地修改代码后
git add .
git commit -m "你的修改说明"
git push origin main
# DigitalOcean 自动触发重新构建和部署，约 3-5 分钟
```

---

## 费用估算

| 资源 | 套餐 | 月费 |
|------|------|------|
| App（Web 服务） | Basic XXS (512MB RAM) | $5 |
| MySQL 数据库 | Basic 1GB | $15 |
| **合计** | | **~$20/月** |

如果流量增大，可以随时在控制台升级套餐。
