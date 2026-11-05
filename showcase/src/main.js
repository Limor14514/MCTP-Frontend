/**
 * 文件用途：Showcase 工程入口
 * 作用：创建 Vue 应用实例，挂载 vue-router；按任务要求，三主题初始化（themeStore.initTheme）
 *       在 main.js 完成——在应用挂载前把 html[data-theme] 写好，避免首帧主题闪烁。
 *       本工程为独立展示站，与 MCTP-Frontend 无任何耦合；登录等原站业务一概不引入。
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initTheme } from './preview/stores/themeStore'

// 作用：主题初始化提前到挂载前，保证首屏即为用户上次选择的主题（night/day/eye）。
initTheme()

createApp(App).use(router).mount('#app')
