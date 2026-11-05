# MCTP Showcase（新版官网展示站）

机械动力服务器官网的重设计展示站，是一个**独立的 Vite 子工程**：有自己的 `package.json`，
不引用、也不修改仓库根目录主应用的任何代码、路由或构建配置。

## 运行

```bash
cd showcase
npm install
npm run dev      # http://localhost:5174
npm run build    # 产物在 showcase/dist/（同时生成 404.html 兜底）
```

部署到子路径（例如 GitHub Pages 的 PR 预览）：

```bash
SHOWCASE_BASE=/MCTP-Frontend/preview/pr-58/ VITE_ROUTER_MODE=hash npm run build
```

`SHOWCASE_BASE` 是部署的子路径（以 / 开头和结尾）；`VITE_ROUTER_MODE=hash` 让地址变成 `.../#/home`，
这样在 GitHub Pages 的子路径下也能直接打开子页面链接（GitHub Pages 只认站点根目录的 404.html）。
CI 的 `showcase` 任务就是这样构建预览的。

## 页面

| 路由 | 内容 |
| --- | --- |
| `/` | 加载页（像素银河 + 黄铜 LOADING）→ M/A 转场 → 索引页（three.js 方块小岛，全屏分段） |
| `/home` | 主页面：账号面板 + 今日运势 + 塔罗星盘、翻牌公告、功能区、更新日志、最近评论 |
| `/home/announcements` | 公告可视化编辑（管理员） |
| `/home/f/:key` | 功能区各入口的介绍页（功能待开发） |
| `/feedback` | 反馈页（"书与笔"） |
| `/legal/:doc` | 用户协议 / 隐私政策 / 社区规范 / 免责声明（草案） |
| `/login` | 登录占位页（模拟登录按钮） |

## 现状与限制

- **这是演示站**：页面右下角常驻"演示站 · 数据为本地模拟"标记，不要接到正式站的导航里。

- 登录、公告、反馈、评论目前都是**本地模拟数据**（`src/site/services/`），还没接 MCTP-API；
  需要后端补的接口和字段见 `docs/site-rebuild-notes.md`「哪些是模拟的」一节。
- 页脚的 QQ 群、Oopz、B 站、联系方式、备案号待填（`src/site/content/footer.js`）；
  四份协议是草案，需管理团队审定（`src/site/content/legal.js`）。
- 3D 模型、Logo 等素材还是占位，替换方法见 `docs/3d-model-guide.md`。

## 文档

- `docs/site-rebuild-notes.md`：需求 ↔ 文件对照、每轮改动、模拟数据说明
- `docs/3d-model-guide.md`：索引页 3D 模型制作与导入教程
