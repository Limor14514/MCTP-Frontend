---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 51c49d6df962a9d4b21f188913b061a5_1dfc8718d77c11f1a216525400248c00
    ReservedCode1: +bOv2vAkOhi7zhGJmg1qRaMF+kjdS0POlFz7GF8Lruz+CrQNFxQNmzz96cmRz1yHDpIu7ixSf0Adu0NrKONJnzv6MNXtmr/C431mfSNnu4sNB7Hp4nU76p6cipVP87tMcJkxHlz/ZVqc/qHJKPcSWP1PbctY16y5j7q7Y0m3NrdCs1CCjg8oQM+vElo=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 51c49d6df962a9d4b21f188913b061a5_1dfc8718d77c11f1a216525400248c00
    ReservedCode2: +bOv2vAkOhi7zhGJmg1qRaMF+kjdS0POlFz7GF8Lruz+CrQNFxQNmzz96cmRz1yHDpIu7ixSf0Adu0NrKONJnzv6MNXtmr/C431mfSNnu4sNB7Hp4nU76p6cipVP87tMcJkxHlz/ZVqc/qHJKPcSWP1PbctY16y5j7q7Y0m3NrdCs1CCjg8oQM+vElo=
---

# MCTP Showcase · 方向 A 传动装配线重设计 独立展示工程说明

> 本工程是「MCTP 服务器官网预览页方向 A（传动装配线）重设计」的独立展示站，供 MCTP 作者查看重设计成果。
> 与 `E:\Code\MCTP\MCTP-Frontend` 仓库**完全解耦**：不包含作者原网站的任何业务代码（登录 / 注册 / 后台 / 原路由 / 框架外壳均未迁移）。

## 一、工程信息

- 位置：`E:\Code\MCTP\Showcase`
- 技术栈：Vue 3（`vue@^3.5.32`）+ Vite（`vite@^8.3.5`）+ vue-router（`vue-router@^5.4.0`）+ GSAP（`gsap@^3.15.0`，含 ScrollTrigger）
- 字体：`@fontsource/pixelify-sans`、`@fontsource/vt323`（本地自托管，不依赖 Google Fonts 在线加载）
- 入口：路由 `/` 直接挂 `src/preview/PreviewApp.vue`（无需 `/preview` 前缀）
- dev 端口：5174（`vite.config.js` 中 `strictPort: true`）

## 二、目录结构

```
E:\Code\MCTP\Showcase
├─ index.html                      # Vite 入口 HTML
├─ package.json                    # 依赖与脚本
├─ vite.config.js                  # Vite 配置（base './'，dev 5174 / preview 5175）
├─ docs\
│  └─ showcase-notes.md            # 本说明文件
└─ src\
   ├─ main.js                      # 入口：挂载前调用 initTheme() 初始化三主题
   ├─ App.vue                      # 仅路由出口，不含任何原站业务
   ├─ router\index.js              # 只挂展示页（/）
   └─ preview\                     # 迁移自 MCTP-Frontend/src/preview 的展示页
      ├─ PreviewApp.vue            # 展示页根：开场动画 → 主界面（含样式/字体引入）
      ├─ styles\theme.css          # 三主题 CSS 变量（含 --preview-gear-speed/--preview-shaft 等传动装配线变量）
      ├─ styles\base.css           # 基础样式（导轨 / 工序号 / 工位卡片）
      ├─ components\               # GearBackground / IntroAnimation / PreviewHeader / 各 Section / Footer / CustomCursor / ThemeSwitcher / AccountArea
      ├─ directives\reveal.js      # v-reveal 滚动驱动装配入场（章节工位 / 下载出库 / 普通）
      ├─ directives\tilt.js        # v-tilt 鼠标 3D 倾斜
      ├─ composables\useServiceHealth.js  # 健康状态本地 mock（原依赖后端，现本地模拟）
      ├─ api\guestbook.js          # 留言 API 本地占位 mock
      ├─ stores\themeStore.js      # 三主题单例（原 Pinia，现模块级 ref）
      ├─ stores\previewAuthStore.js# 账号只读演示单例（原 Pinia 模拟登录，现固定演示态）
      └─ assets\placeholders\      # 占位 SVG
```

## 三、迁移与解耦说明

| 原工程耦合点 | 独立工程处理 |
| --- | --- |
| `@/preview/...` 别名导入 | 全部改为本工程内相对路径（`../directives/...`、`./components/...` 等） |
| Pinia store（`useThemeStore` / `usePreviewAuthStore`） | 改为模块级响应式单例（`ref` + 导出函数），不安装 pinia |
| `themeStore.initTheme()` 在 PreviewApp setup 调用 | 移至 `src/main.js` 挂载前调用，首帧即正确主题 |
| `@/stores`、`@/router`、原 App.vue 外壳、路由 meta `chrome=false` | 不迁移；路由仅 `/` 挂展示页 |
| `api/guestbook.js`（依赖 `@/api/axios` 后端） | 改为本地占位 mock（Promise 形状一致，接真实后端时替换实现即可） |
| `composables/useServiceHealth`（依赖后端健康接口） | 本地 mock 定时微调在线人数 / TPS / 版本 |
| AccountArea 依赖登录业务 | 降级为只读演示（固定演示玩家头像 + 用户名），不提供登录/登出 |
| 字体 Google Fonts 在线加载 | 改为 `@fontsource` 本地自托管（pixelify-sans 400/700、vt323 400） |

## 四、方向 A 重设计效果（已完整保留）

- **齿轮背景**：GSAP ScrollTrigger `scrub` 驱动多层齿轮旋转（CSS 旋转已移除，避免 transform 冲突），由 `--preview-gear-speed` 派生变量控制
- **传动轴进度**：顶栏（PreviewHeader）滚动进度条与齿轮同源 scrub 驱动，随页面滚动「转动」
- **章节装配入场**：`.preview-card` 从传送带右侧滑入 + 微摆归位（`v-reveal` 的 `isStation` 形态）
- **工序号**：装配完成后经 `data-assemble → is-assembled` 触发 CSS 工序号从导轨滑入
- **下载出库动画**：下载项从下方升起 + 轻微翻转归位（`isOutbound` 形态）
- **三主题**：night / day / eye，`html[data-theme]` 驱动，localStorage 持久化
- **无障碍降级**：`@media (prefers-reduced-motion: reduce)` 时跳过入场/齿轮/倾斜动画，内容静态可见
- 视觉减法精修已包含：gap 80px、卡片 padding 30px、渐变底 + 双层投影、章节标题辉光、`--preview-accent-bright` 亮色点缀（推荐徽章 / 下载动作）

## 五、运行方式

```bash
cd E:\Code\MCTP\Showcase
npm install       # 安装依赖（已完成一次，重建环境时重新执行）
npm run dev       # 开发预览 → http://localhost:5174
npm run build     # 生产构建 → 输出到 dist/
npm run preview   # 本地预览构建产物 → http://localhost:5175
```

> 版本约束：`vue-router@5.4.0` 的 peer 依赖要求 `vite ^7.3.0 || ^8.0.0`，故本工程使用 `vite@^8.3.5` + `@vitejs/plugin-vue@^6.0.10`（Node 需 `^20.19 || >=22.12`，已验证 v22.12.0 可用）。

## 六、回退方式

本工程为完全独立目录，**回退即删除整个 `E:\Code\MCTP\Showcase` 目录后重建**（或从 git 恢复即可，不影响 MCTP-Frontend 原仓库）：

```bash
# 谨慎执行，确认后手动操作（删除为不可逆操作，建议先确认无未提交成果）
Remove-Item -Recurse -Force E:\Code\MCTP\Showcase
# 需要时重新初始化：复制本工程备份 / 或重新执行迁移步骤
```

若仅需回退某个展示页组件的样式/逻辑，可直接对照 `MCTP-Frontend` 的 `feat/preview-website` 分支原文件覆盖对应组件后重新 `npm run build`。

## 七、已知占位项（TODO）

- 公告 / 活动 / 留言 / STAFF / 玩法文案为模拟数据（组件内 `TODO-CONTENT` / `TODO-BACKEND` 注释标注）
- 下载链接为空占位（`DownloadSection.vue` 内 `TODO-BACKEND`）
- 健康状态为本地模拟（`useServiceHealth.js`）
- 头像为占位 SVG（`TODO-ASSET`）
*（内容由AI生成，仅供参考）*
