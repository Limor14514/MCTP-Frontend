<script setup>
/**
 * 文件用途：预览页 footer 组件
 * 作用：展示服务器标语、社交入口图标位（QQ群 / B站 / 邮箱）、
 *       合规免责声明、版权与备案占位，并预留访问统计挂载位置。
 */
// 作用：社交入口占位数据（各平台入口，链接待补）。
// 原因：按需求删去 Discord / 玩家社区 / Wiki，只保留国内玩家常用的 QQ 群 / B站 / 邮箱。
// TODO-BACKEND: 外部链接地址待补，当前 href 为空字符串占位（点击不跳转）；图标为通用占位图形，非平台官方 logo。
const socials = [
  { key: 'qq', label: 'QQ 群', href: '' },
  { key: 'bilibili', label: 'B站', href: '' },
  { key: 'mail', label: '邮箱', href: '' },
]
</script>

<template>
  <!-- 作用：页脚容器，顶部铜黄分隔线。 -->
  <footer class="preview-footer">
    <p class="preview-footer__slogan">
      「让每一台机械，都成为文明的一部分。」
    </p>
    <!-- TODO-CONTENT: 服务器标语为占位文案，待服主定制。 -->

    <!-- 作用：社交入口图标位（图标 + 文字），MC 服务器官网惯例必备。 -->
    <nav
      class="preview-footer__socials"
      aria-label="社交入口"
    >
      <a
        v-for="s in socials"
        :key="s.key"
        class="preview-footer__social"
        :href="s.href || '#'"
        :aria-label="s.label"
        :aria-disabled="!s.href"
        :target="s.href ? '_blank' : undefined"
        rel="noopener noreferrer"
        @click="!s.href && $event.preventDefault()"
      >
        <!-- 原因：hash 路由下 href="#" 会跳回首页（新标签页打开同理），故链接待补时拦截跳转、且不开新标签页；
             填入真实地址后恢复新标签页打开。 -->
        <svg
          class="preview-footer__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <template v-if="s.key === 'qq'">
            <circle
              cx="9"
              cy="9"
              r="3"
            />
            <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
            <circle
              cx="17"
              cy="10"
              r="2.5"
            />
            <path d="M15 20c0-2 1-3.5 3-4" />
          </template>
          <template v-else-if="s.key === 'bilibili'">
            <rect
              x="3"
              y="6"
              width="18"
              height="12"
              rx="2"
            />
            <path d="M10 10l5 2-5 2z" />
          </template>
          <template v-else>
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
            />
            <path d="M3 7l9 6 9-6" />
          </template>
        </svg>
        <span>{{ s.label }}</span>
      </a>
    </nav>

    <!-- 作用：合规免责声明（MC 社区服务器官网通用做法）。 -->
    <p class="preview-footer__disclaimer">
      本站为非官方《我的世界》服务器站点，与 Mojang Studios / Microsoft 无关；《我的世界》相关商标归其各自权利人所有。
    </p>

    <!-- 作用：版权与备案占位行。 -->
    <!-- TODO-BACKEND: 版权年份/主体与备案号待补。 -->
    <p class="preview-footer__copy">
      © 2026 MCTP 机械动力服务器 · 本页为预览稿，非最终上线版本
    </p>
    <p class="preview-muted">
      TODO-BACKEND：备案号 / 版权主体 / 外部链接地址待补。
    </p>

    <!-- TODO-ANALYTICS: 上传后可在此挂载访问统计（如 Cloudflare Web Analytics 免费版脚本）。 -->
  </footer>
</template>

<style scoped>
/* 作用：页脚布局——居中纵向，顶部铜黄分隔线；底部内边距兼容 iPhone 刘海屏安全区。 */
.preview-footer {
  margin-top: 64px;
  padding: 32px 24px calc(40px + env(safe-area-inset-bottom));
  border-top: 2px solid var(--preview-accent-deep);
  background: var(--preview-bg-panel);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* 作用：服务器标语——铜黄强调。 */
.preview-footer__slogan {
  margin: 0;
  font-size: 16px;
  color: var(--preview-accent);
}

/* 作用：社交入口行——横向排布，可换行。 */
.preview-footer__socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 20px;
  margin: 4px 0;
}

/* 作用：单个社交入口——图标 + 文字，悬停铜黄。 */
.preview-footer__social {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--preview-line);
  border-radius: 8px;
  color: var(--preview-text-soft);
  font-size: 13px;
  text-decoration: none;
  transition: color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.preview-footer__social:hover {
  color: var(--preview-accent);
  border-color: var(--preview-accent);
  transform: translateY(-1px);
}

/* 作用：社交图标尺寸。 */
.preview-footer__icon {
  width: 18px;
  height: 18px;
}

/* 作用：合规免责声明——小字、弱化、限宽。 */
.preview-footer__disclaimer {
  margin: 4px 0 0;
  max-width: 640px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--preview-text-soft);
}

/* 作用：版权行。 */
.preview-footer__copy {
  margin: 0;
  font-size: 13px;
  color: var(--preview-text-soft);
}
</style>
