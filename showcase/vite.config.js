/**
 * 文件用途：Vite 构建配置
 * 作用：独立展示工程的基础配置——挂载 Vue 插件、dev 服务固定 5174 端口。
 *
 * 部署路径（base）：
 *  - 默认 '/'（部署在域名根目录、或本地 npm run dev / preview）；
 *  - 部署到子路径时用环境变量 SHOWCASE_BASE 指定，必须以 / 开头和结尾，例如：
 *      SHOWCASE_BASE=/MCTP-Frontend/preview/pr-58/ npm run build
 *    CI 构建 PR 预览时就是这样传的（见仓库根目录 .github/workflows/ci.yml 的 showcase 任务）。
 *  - 以前用的相对路径 './' 会让 history 路由在子路径下跳到域名根目录（/home → 404），所以不再使用。
 *
 * 404 兜底：构建结束后把 index.html 复制一份成 404.html。
 *   部署在静态站点根目录时（GitHub Pages、Nginx 的 error_page 等），直接打开 /home 这类子页面地址也能回到单页应用。
 *   注意 GitHub Pages 只认整个站点根目录的 404.html，子路径预览要配合 hash 路由（VITE_ROUTER_MODE=hash）。
 */
import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const base = process.env.SHOWCASE_BASE || '/'
if (!base.startsWith('/') || !base.endsWith('/')) {
  throw new Error(`SHOWCASE_BASE 必须以 / 开头和结尾，当前为：${base}`)
}

/** 作用：构建完成后生成 404.html（内容与 index.html 相同） */
function spaFallback() {
  let outDir = 'dist'
  return {
    name: 'showcase-spa-404',
    apply: 'build',
    configResolved(cfg) {
      outDir = resolve(cfg.root, cfg.build.outDir)
    },
    async closeBundle() {
      await copyFile(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

export default defineConfig({
  plugins: [vue(), spaFallback()],
  base,
  build: {
    // 包体积：页面已按路由拆成单独的代码块，首屏主包约 210KB；
    // 剩下唯一超过 500KB 的是索引页的代码块（IndexPage，约 680KB / gzip 约 175KB），几乎全是 three.js。
    // 直接打开其他页面时首屏不用等它（空闲时才在后台预取），作为展示站可以接受，所以把警告线调到 700KB；
    // 以后如果索引页换成静态图或更轻的 3D 方案，可以把这一行删掉恢复默认的 500KB。
    chunkSizeWarningLimit: 700,
  },
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
