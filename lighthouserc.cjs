/**
 * Lighthouse CI 配置，供 Jenkins 阶段「Lighthouse 性能检测」使用。
 *
 * 使用 .cjs 后缀：package.json 声明了 "type": "module"，若用 .js 后缀，
 * 本文件里的 module.exports 会被当作 ESM 解析而报错，LHCI 将无法加载配置。
 *
 * 相对 base 的 dist 可同时用于根路径 Lighthouse、Pages 和 PR 子目录预览。
 */
module.exports = {
  ci: {
    collect: {
      // 直接托管 dist，无需额外启动 web server
      staticDistDir: './dist',
      // 跑 3 次取中位数，降低单次抖动导致的误判
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      // 阈值按「移动端 + Lighthouse 默认 4G 限速」的实测基线设定：
      // 全屏视频 + GSAP 动效的首页在移动端很难上 0.85，性能只做 warn，
      // 真正卡构建的是 LCP、CLS 和无障碍。
      assertions: {
        'categories:performance': ['warn', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2200 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      // 报告上传到 Lighthouse 官方临时存储，构建日志里会打印可访问链接；约 7 天过期
      target: 'temporary-public-storage',
    },
  },
}
