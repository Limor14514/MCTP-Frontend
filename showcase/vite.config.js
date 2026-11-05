/**
 * 文件用途：Vite 构建配置
 * 作用：独立展示工程的基础配置——挂载 Vue 插件、dev 服务固定 5174 端口、产物 base 设为相对路径，
 *       便于将 build 产物直接部署到任意静态站点（如 GitHub Pages 子路径）而无需改配置。
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5174,
    strictPort: true,
    // 原因：默认仅绑 IPv6 ::1，Windows 浏览器访问 127.0.0.1/localhost 时偶发连不上；
    //       显式监听本机所有 IPv4/IPv6 回环与局域网地址，保证 localhost / 127.0.0.1 都能打开。
    host: true,
  },
  preview: {
    port: 5175,
    strictPort: true,
  },
})
