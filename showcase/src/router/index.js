/**
 * 文件用途：Showcase 路由配置（新版站点）
 * 作用：
 *  - 所有页面都挂在 SiteShell 下，共用导航栏、转场与首次加载页；
 *  - 第四轮：主页面 /home、公告编辑 /home/announcements（仅管理员，演示用、无真实鉴权）、登录占位 /login、反馈 /feedback；
 *  - 第五轮：功能介绍页 /home/f/:key、协议条款页 /legal/:doc；
 *  - 全局守卫：除首次进入外的每一次跳转（含浏览器前进后退），都先等转场把屏幕盖黑再切页面。
 *
 * 部署到子路径（例如 GitHub Pages 的 /MCTP-Frontend/preview/pr-58/）：
 *  - 路由的基础路径取 import.meta.env.BASE_URL，也就是 vite.config.js 里的 base（构建时用环境变量 SHOWCASE_BASE 指定）；
 *  - 环境变量 VITE_ROUTER_MODE=hash 时改用 hash 路由（地址形如 .../pr-58/#/home）：
 *    GitHub Pages 只认站点根目录的 404.html，子路径下的预览直接打开 /home 这类地址会 404，
 *    hash 路由的地址都落在 index.html 上，可以直接分享子页面链接。CI 构建预览时用的就是 hash 模式。
 *
 * 页面按需加载：每个页面是一个单独的代码块（three.js 只打进索引页那一块），首屏不必下载全部页面；
 * 加载页结束后会在空闲时预取其余页面，切换页面时不用等下载。
 *
 * 旧版展示页（/legacy）已移除：主应用里已经有同一份 /preview，不在这里重复维护。
 */
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import SiteShell from '../site/SiteShell.vue'
import { coverScreen } from '../site/composables/usePageTransition'

const BASE = import.meta.env.BASE_URL
const history = import.meta.env.VITE_ROUTER_MODE === 'hash' ? createWebHashHistory(BASE) : createWebHistory(BASE)

// 每个页面一个按需加载的代码块（webpackChunkName 之类的注释 Vite 不需要，文件名会自动生成）
const PAGES = {
  index: () => import('../site/pages/IndexPage.vue'),
  home: () => import('../site/pages/HomePage.vue'),
  announcementEdit: () => import('../site/pages/AnnouncementEditPage.vue'),
  login: () => import('../site/pages/LoginPage.vue'),
  feedback: () => import('../site/pages/FeedbackPage.vue'),
  feature: () => import('../site/pages/FeaturePage.vue'),
  legal: () => import('../site/pages/LegalPage.vue'),
}

const router = createRouter({
  history,
  // 换页后回到顶部（转场把屏幕盖黑时才切页面，所以看不到跳动）；浏览器后退时恢复原来的位置
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
  routes: [
    {
      path: '/',
      component: SiteShell,
      children: [
        { path: '', name: 'index', component: PAGES.index },
        { path: 'home', name: 'home', component: PAGES.home },
        { path: 'home/announcements', name: 'announcement-edit', component: PAGES.announcementEdit },
        { path: 'login', name: 'login', component: PAGES.login },
        { path: 'feedback', name: 'feedback', component: PAGES.feedback },
        { path: 'home/f/:key', name: 'feature', component: PAGES.feature },
        { path: 'legal/:doc?', name: 'legal', component: PAGES.legal },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to, from) => {
  // 首次进入（from 没有匹配记录）由加载页负责，不播转场；同页跳转也不播
  // 同一种页面之间切换（例如协议页的四个标签、不同功能的介绍页）也不播，免得点个标签等 5 秒
  if (!from.matched.length || to.path === from.path || to.name === from.name) return true
  await coverScreen()
  return true
})

// 首屏就绪后，空闲时把其余页面的代码块也下载下来（失败无所谓，真正跳转时会再下载一次）
router.isReady().then(() => {
  const prefetch = () => Object.values(PAGES).forEach((load) => load().catch(() => {}))
  if ('requestIdleCallback' in window) window.requestIdleCallback(prefetch, { timeout: 8000 })
  else setTimeout(prefetch, 4000)
})

export default router
