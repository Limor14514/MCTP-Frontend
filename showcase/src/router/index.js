/**
 * 文件用途：Showcase 路由配置（新版站点）
 * 作用：
 *  - / /home /feedback 三个页面都挂在 SiteShell 下，共用导航栏、转场与首次加载页；
 *  - /legacy 保留旧版展示页（src/preview/PreviewApp.vue）作为对照与回退点；
 *    （旧路由配置的本地备份未提交到仓库。）
 *  - 第四轮：主页面 /home、公告编辑 /home/announcements（仅管理员）、登录占位 /login、反馈 /feedback；
 *  - 第五轮：功能介绍页 /home/f/:key、协议条款页 /legal/:doc；
 *  - 全局守卫：除首次进入外的每一次跳转（含浏览器前进后退），都先等转场把屏幕盖黑再切页面。
 */
import { createRouter, createWebHistory } from 'vue-router'
import SiteShell from '../site/SiteShell.vue'
import IndexPage from '../site/pages/IndexPage.vue'
import HomePage from '../site/pages/HomePage.vue'
import FeedbackPage from '../site/pages/FeedbackPage.vue'
import LoginPage from '../site/pages/LoginPage.vue'
import AnnouncementEditPage from '../site/pages/AnnouncementEditPage.vue'
import FeaturePage from '../site/pages/FeaturePage.vue'
import LegalPage from '../site/pages/LegalPage.vue'
import { coverScreen } from '../site/composables/usePageTransition'

const router = createRouter({
  history: createWebHistory(),
  // 换页后回到顶部（转场把屏幕盖黑时才切页面，所以看不到跳动）；浏览器后退时恢复原来的位置
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
  routes: [
    {
      path: '/',
      component: SiteShell,
      children: [
        { path: '', name: 'index', component: IndexPage },
        { path: 'home', name: 'home', component: HomePage },
        { path: 'home/announcements', name: 'announcement-edit', component: AnnouncementEditPage },
        { path: 'login', name: 'login', component: LoginPage },
        { path: 'feedback', name: 'feedback', component: FeedbackPage },
        { path: 'home/f/:key', name: 'feature', component: FeaturePage },
        { path: 'legal/:doc?', name: 'legal', component: LegalPage },
      ],
    },
    {
      path: '/legacy',
      name: 'legacy',
      component: () => import('../preview/PreviewApp.vue'),
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

export default router
