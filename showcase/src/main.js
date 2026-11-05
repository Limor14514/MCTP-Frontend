/**
 * 文件用途：Showcase 工程入口
 * 作用：创建 Vue 应用实例并挂载 vue-router。
 *       本工程为独立展示站，与 MCTP-Frontend 主应用无任何耦合；登录等业务目前都是本地模拟（见 src/site/services/）。
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
