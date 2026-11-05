# 新版站点重建说明（2026-11-04）

> 说明：文中提到的 `src/site/_backup-r2/`、`src/site/_backup-r6/` 是开发过程中的本地备份，**没有提交到仓库**。

新站点全部放在 `src/site/`，旧版展示页**原样保留**在 `src/preview/`，访问 `/legacy` 仍可打开，用来对照或回退。
旧路由的本地备份未提交到仓库。

## 页面流程

打开网站 → 首次加载页 → 导航栏掉落 → 索引页（默认页）→ 通过导航栏跳到主页面 / 反馈（每次跳转都播转场，约 5.5 秒，各段时长见 `PageTransition.vue` 的 `PHASE`）

## 文件对照（按需求条目）

| 需求 | 文件 |
| --- | --- |
| 一.1 加载页背景：像素银河 + 鼠标水波涟漪（第三轮：二维波动方程 + 像素折射位移） | `src/site/components/PixelGalaxy.vue`（水波参数在文件顶部） |
| 一.1 LOADING 标题：机械动力黄铜风格立体像素字（第三轮）；放入渲染图则优先用图 | `src/site/components/CreateWord.vue`、`LoadingTitle.vue`（旧的白色岩石字 `StoneWord.vue` 保留作备份） |
| 一.1 经验条进度（替代百分比数字） | `src/site/components/XpBar.vue` |
| 一.1 进度跟随真实加载 + 超时兜底 | `src/site/components/BootLoader.vue`（`MIN_MS` / `MAX_MS`） |
| 一.2 M 窗口 → MCREATOPIA → 停留 1 秒 → A 收尾 3 秒 | `src/site/components/PageTransition.vue`（`PHASE` 常量 + 顶部时间轴注释） |
| 一.2 加载页 → 索引页也走转场 | `src/site/SiteShell.vue` 中的 `onBootDone` |
| 一.2 所有跳转（含浏览器前进后退）都走转场 | `src/router/index.js` 中的 `beforeEach` |
| （旧）星星躲避背景，已停用，保留作备份 | `src/site/components/StarField.vue` |
| 二.1 全屏分段滑动、只触发一次的入场效果、手机端锁定页面 | `src/site/composables/useFullPage.js`（GSAP Observer） |
| 二.1 驱动模型动画 + 3D 场景镜头切换；自动加载 `public/models/*.glb` | `src/site/three/VoxelStage.js`（教程见 `docs/3d-model-guide.md`） |
| 二 索引页各段内容 | `src/site/pages/IndexPage.vue` 里的 `SECTIONS` |
| 三 透明导航栏掉落回弹 | `src/site/components/SiteNav.vue`（`bounce.out`） |
| 三.2 金色时钟（自绘；放入原版 64 帧贴图则自动改用）+ 24 小时制时间 | `src/site/components/McClock.vue`、贴图放 `src/site/assets/clock/` |
| 三 Logo 右边的白色像素字 MCREATOPIA | `SiteNav.vue` 中的 `.nav-wordmark` |
| 三 Language 语言选择器（3D 翻页滚筒） | `src/site/components/LanguagePicker.vue`；语言列表与翻译在 `src/site/i18n.js` |
| 三.3 当前页金色光 | `SiteNav.vue` 中的 `.router-link-exact-active` |
| 一.1 背景水波只推动星星（第四轮：星云静止，不再变亮变暗） | `PixelGalaxy.vue`（`DRIFT` 控制星星荡多远） |
| 四.1 主页面：悬浮账号面板（头像 / 名字 / UID 复制）+ 右侧今日运势 | `pages/HomePage.vue`、`components/home/AccountHero.vue`、`FortunePanel.vue` |
| 四.2 今日运势（按 UID + 日期每日轮换）、塔罗抽牌、星盘点评 | `src/site/fortune/fortune.js`、`tarot.js`、`astro.js`；界面 `TarotSpread.vue`、`Astrolabe.vue` |
| 四.3 公告：翻牌显示器横向选项卡，10 秒轮换 + 滚轮切换 | `components/home/FlapBoard.vue`、`FlapText.vue`、`FlapImage.vue` |
| 四.3 公告可视化编辑（管理员，1~10 个选项卡） | `pages/AnnouncementEditPage.vue`（路由 `/home/announcements`）、数据 `services/announcements.js` |
| 四 登录界面（占位，含模拟登录按钮） | `pages/LoginPage.vue`（路由 `/login`）、账号 `services/account.js` |
| 五 反馈页"书与笔" + 合书动画 + 物品图标 | `pages/FeedbackPage.vue`、`components/feedback/BookQuillIcon.vue`、提交 `services/feedback.js` |
| 像素字 | `src/site/pixel/glyphs.js`（自绘 5×7 字母）、`pixel/rasterize.js`（中文点阵化） |

## 关于像素字

参考站 designatorapp 用的是 Google 字体 `Jersey 10` 和 `Pixelify Sans`，这两种都没有中文。
所以本站分两种做法：

- **英文标题**（LOADING、MCREATOPIA）：用自绘 5×7 点阵逐格画成 SVG 方块。每格都是严格的正方形，能做立体挤出、岩石贴图和金光遮罩。
- **中文**（导航、段落标题）：先在 12px 离屏 canvas 上用宋体画出来，再把像素二值化后放大。Windows 上效果最清晰。拿到正式的中文像素字体（比如 Fusion Pixel 的 woff2）后可以直接替换。

## LOADING 标题：放入 Blockbench 渲染图

1. 打开 Blockbench，选择 File → New → Minecraft Title，输入 `LOADING`，选择字体和"白色岩石"材质。
2. 在右上角切到 Render 标签，点 Position Camera 自动摆好机位，再渲染并导出 **透明背景的 PNG**（分辨率尽量高，比如宽 2000px 以上）。
3. 把文件保存为 `src/site/assets/title/loading.png`。页面会自动改用这张图，金光进度以图片的形状作遮罩，不用改代码。
4. 想换回内置立体字，删掉这张图就行。

## 需要你提供的素材

参考站 woanminecraftfolio 的做法是：用 Three.js 加载一组按图层拆分的 Minecraft 场景 `.glb` 模型（房子、草地、细节、生物等），配 6 张立方体天空盒、背景音乐和点击音效；滚轮或拖拽驱动镜头沿路径移动，到某个位置再弹出对应内容。对应到本站，需要：

1. **导航栏左上角 Logo**：SVG 矢量图。直接覆盖 `src/site/assets/logo-placeholder.svg`，文件名不变就不用改代码。
2. **3D 场景模型**：服务器地图或建筑导出的 `.glb`（可以用 Blockbench / Mineways / ObjToSchematic 导出）。最好按图层拆成几个文件，并用 gltf-transform 压缩。
3. **驱动模型**：用来替换现在占位的像素齿轮，比如机械动力的齿轮、传送带等 `.glb`，带不带动画都可以。
4. **天空盒**（可选）：6 张图 `px/nx/py/ny/pz/nz.webp`。
5. **每一段的内容**：每一屏的标题、文案、配图，以及 3D 场景里哪里可以点、点了弹出什么。现在是 5 段占位，见 `IndexPage.vue` 中的 `SECTIONS`。
6. **音乐 / 音效**（可选）：背景音乐和按钮点击音效。如果要加，还需要一个静音开关。
7. **中文像素字体**（可选）：woff2 文件。

## 第四轮：哪些是"模拟"的（接后端前必读）

后端 MCTP-API 目前只有账号接口（`/api/v1/auth/me/` 返回 id、username、绑定的 Minecraft 名），**没有头像、管理员标记、公告、反馈接口**。
所以下面三块先用浏览器本地存储模拟，页面代码只调用 `src/site/services/` 里的函数，接后端时只改这三个文件：

| 文件 | 现在 | 接后端时 |
| --- | --- | --- |
| `services/account.js` | `/login` 页上的两个按钮模拟登录 | 走现有 allauth + JWT；后端补 `avatar`、`is_staff` 字段，用 `fromApiUser()` 转换 |
| `services/announcements.js` | 公告存在本机，只有本浏览器能看到修改 | 新增 `GET/PUT /api/v1/announcements/` |
| `services/feedback.js` | 反馈存在本机（截图只记文件名） | 新增 `POST /api/v1/feedback/`（multipart） |

运势与塔罗结果按"UID + 日期"存在本机，换设备会重新抽；如需跨设备一致，可以把"是否已抽、抽到哪张、点击时刻"也存到后端。

## 第五轮：功能区、更新日志 / 最近评论、页脚（2026-11-05）

| 需求 | 文件 |
| --- | --- |
| 功能区 8 个像素矢量图标（两行四个） | `src/site/components/home/FeatureGrid.vue`；图标与文案在 `src/site/content/features.js`；通用图标组件 `src/site/components/PixelIcon.vue` |
| 点击功能 → 介绍页（功能本身待开发） | `src/site/pages/FeaturePage.vue`，路由 `/home/f/:key`；"敬请期待"不可点击 |
| 更新日志 | `src/site/components/home/ChangelogPanel.vue`，数据 `src/site/content/changelog.js`（手写，本站真实更新记录） |
| 最近评论 | `src/site/components/home/RecentComments.vue`，数据 `src/site/services/comments.js`（**示例数据**） |
| 全站页脚（用户交流 / 站点支持 / 协议条款） | `src/site/components/SiteFooter.vue`，链接在 `src/site/content/footer.js`；普通页面由 `SiteShell.vue` 自动加，索引页最后一段用精简版 |
| 协议条款页 | `src/site/pages/LegalPage.vue`，路由 `/legal/:doc`，正文 `src/site/content/legal.js`（**全部是草案**） |

其他：窗口宽度 ≤800px（手机、竖屏平板）时导航栏变成两行——第一行 Logo + Language/时钟/时间，第二行三个页面链接，避免时钟被挤出屏幕（`SiteNav.vue` 末尾的媒体查询；改前版本备份在 `src/site/_backup-r2/SiteNav.r5-before-mobile.vue`）。
同一种页面之间切换（协议页四个标签、不同功能介绍页）不再播放 5 秒转场，见 `src/router/index.js` 守卫。

需要你提供或确认：
- `content/footer.js`：玩家 QQ 群、Oopz、B 站、联系邮箱、ICP 备案号（没填的链接显示灰色"待填"）；
- `content/legal.js`：四份协议草案，尤其是隐私政策里标了【待确认】的日志、第三方服务、保存期限；定稿后把 `draft` 改成 `false`；
- 最近评论接后端时，建议新增 `GET /api/v1/comments/recent/?limit=8`，把 `RecentComments.vue` 里的 `IS_SAMPLE` 改成 `false`；
- 更新日志如果要由管理员在后台维护，建议新增 `GET /api/v1/changelog/`。

## 第六轮调整（2026-11-05）

改动前的文件都备份在 `src/site/_backup-r6/`。

| 需求 | 改了哪里 |
| --- | --- |
| 转场最后，A 从白色像素字渐变成透明遮罩 | `components/PageTransition.vue`：`aFill` 在 `PHASE.aFade`（0.7 秒）内从 1 降到 0 |
| 星星随波逐流；没有鼠标时也沿银河自由漂流 | `components/PixelGalaxy.vue` 顶部"星星运动参数"：`FLOW` 漂流速度、`DRAG` 鼠标带动强度、`FRICTION` 惯性、`LANE_RETURN` 回到银河的速度 |
| 最近评论不显示示例，没有评论时居中显示"近期暂无评论哦" | `services/comments.js` 的 `USE_SAMPLE = false`；`components/home/RecentComments.vue` |
| 塔罗牌排成一行；板块与边框平滑出现 | `components/home/TarotSpread.vue` |
| 换像素字体（字母不再黏在一起） | 像素字：`pixel/latinFont.js`（自绘点阵字库）+ `pixel/rasterize.js`；CSS 小字：`styles/site.css` 里的 `Site Pixel`（VT323，放大 135%） |
| 公告去掉顶部选项卡，鼠标靠近显示左右箭头 | `components/home/FlapBoard.vue` |
| 主页面下滑时一次性入场动画 | `pages/HomePage.vue`：公告从下往上升起；功能卡片从左右两侧飞入；更新日志、最近评论像卷轴一样展开（`components/home/ScrollUnroll.vue`） |
| "Discord"改为"Oopz" | `content/footer.js` |

注意：系统开启了"减少动态效果"时（Windows：设置 → 辅助功能 → 视觉效果 → 动画效果 关闭），
浏览器会告诉网页"不要播放动画"，这时主页面入场动画不播放、转场变成简单淡入淡出——这是有意的无障碍处理。

## 第三轮备份

改动前的版本都复制到了 `src/site/_backup-r2/`（没有被引用，不参与构建）。想退回某个效果，把对应文件复制回 `components/` 或 `three/` 即可。

## 调试小技巧

- 开发环境下，控制台的 `window.__pageTransitionTl` 就是转场时间轴，可以用 `.pause()`、`.seek(1.2)` 逐帧查看。
- 用 `.seek()` 时 GSAP 不会触发回调，所以路由不会切换，这是正常的。
