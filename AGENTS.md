# MCTP-Frontend Agent Guide

本文件给 Hermes / Codex / Claude 等代码智能体使用。进入本仓库后优先阅读本文件。

## 项目定位

- Vue 3 + Vite 前端 Dashboard。
- 仓库路径：`/mnt/d/code/MCTP-FE`。
- GitHub：`github.com/SelfAbandonment/MCTP-Frontend`。
- 生产前端：`MCTP-Deploy`（`main` 构建成功后自动部署）。
- GitHub Pages：`main` 前端预览（`deploy.yml`），不是生产入口。
- 当前后端 API：`http://api.mcreatopla.top:21009`。

## 分支规则

- `main`：生产分支，只接收 `develop` 的 release PR 与 hotfix 回流，每次合并打 tag。
- `develop`：集成分支，功能分支都合入这里；**禁止直接推送**。
- 新任务从 `develop` 拉分支：`feat/<name>`、`fix/<name>`、`docs/<name>`、`chore/<name>`。
- 合并统一 Squash；规则真源见 `docs/协作规范.md`。

## CI 与 Jenkins

- GitHub Actions 负责全部 CI：`ci.yml` 跑 lint + test（JUnit/覆盖率门禁 70%）+ build + Lighthouse，PR 上回写 CI 汇总评论并复用 `dist` 部署 `preview/pr-<n>/`；`preview.yml` 负责关闭清理与月初压缩 gh-pages；`deploy.yml` 部署 Pages 预览；`release.yml` 在 `main` 合并后调用 Jenkins `MCTP-Deploy`。
- Jenkins 只保留 `MCTP-Deploy`（生产部署）和 `MCTP-Notify`（AstrBot 通知），不再跑 FE CI。
- 本地等价命令：`npm run lint:check`、`npm test`、`npm run build`。
- Node 版本以 24 为准（`engines` 为 `>=24`，`npm` 为 `>=11`）。

## 隐私与安全

- Git 作者统一：`MrDai <205823393@qq.com>`，不要暴露真实姓名。
- 禁止提交 `.env.local`、token、密码、API key。
- 前端只允许使用 `VITE_` 前缀环境变量暴露给浏览器。
- 不要把私密后端地址、服务器密码或密钥写进构建产物。

## 常用命令

```bash
# WSL 中如 devDependencies 被跳过，使用：
NODE_ENV=development npm install

# 干净安装
npm ci

# 开发
npm run dev

# Lint 检查
npm run lint:check

# 自动修复 lint
npm run lint

# 生产构建
npm run build

# 预览构建
npm run preview
```

## 验证要求

- 改 JS/Vue/CSS：至少运行 `npm run lint:check` 和 `npm run build`。
- 改接口调用：确认 `VITE_API_BASE_URL` 指向正确环境，并与后端 OpenAPI schema 对齐。
- 改部署：检查 `.github/workflows/deploy.yml` 和 `.env.example`。
- 不要声称完成，除非命令或页面/API 响应已验证。

## 代码约定

- Vue 代码保持组件化。
- 可复用逻辑放 `src/composables/`。
- API 调用集中在 `src/api/`。
- 路由集中在 `src/router/`。
- 状态管理集中在 `src/stores/`。
- 复杂 UI 拆分为小组件，避免单文件过大。

## 当前注意事项

- 本项目曾从 Render 后端迁移到私有服务器，旧地址 `https://mctp-api.onrender.com` 不应再作为生产默认值。
- WSL 环境可能存在 `NODE_ENV=production` 导致 devDependencies 不安装，遇到构建缺依赖时先运行 `NODE_ENV=development npm install`。
- 当前仓库可能有人工未提交改动；自动化 worker 改代码前必须先检查 `git status --short --branch`，不要覆盖用户工作。

## 多智能体协作

推荐看板 assignee：

- `frontend`：Vue/UI/接口调用/构建。
- `backend`：后端接口、认证和 schema 变更。
- `reviewer`：PR 审查、UI/接口兼容性、安全检查。
- `devops`：GitHub Pages、CI/CD、部署配置。

代码变更任务完成后，如不是微小文档改动，应先 block 为 `review-required` 或创建 reviewer 子任务，不要直接合并。
