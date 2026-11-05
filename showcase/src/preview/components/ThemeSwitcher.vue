<script setup>
/**
 * 文件用途：主题切换组件（独立工程版，不再依赖 Pinia）
 * 作用：渲染「黑夜 / 白天 / 护眼」三个切换按钮，点击后切换主题并高亮当前项。
 * 说明：原工程经 Pinia useThemeStore + storeToRefs 取状态；本工程 themeStore 为模块级单例，
 *       theme / setTheme / THEMES 直接导入使用，行为一致。
 */
import { theme, setTheme, THEMES } from '../stores/themeStore'

// 作用：遍历主题表生成按钮列表。
// 原因：主题表集中在 themeStore.THEMES 中定义（普通对象，无需响应式解包），
//       组件只负责渲染与触发，便于后续扩展新主题。
const themeList = Object.values(THEMES)
</script>

<template>
  <!-- 作用：主题切换按钮组。 -->
  <div
    class="preview-theme-switch"
    role="group"
    aria-label="主题切换"
  >
    <button
      v-for="item in themeList"
      :key="item.key"
      class="preview-theme-switch__btn"
      :class="{ 'preview-theme-switch__btn--active': theme === item.key }"
      type="button"
      :aria-pressed="theme === item.key"
      @click="setTheme(item.key)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
/* 作用：按钮组横向排列，圆角容器。 */
.preview-theme-switch {
  display: inline-flex;
  border: 1px solid var(--preview-line-strong);
  border-radius: 10px;
  overflow: hidden;
}

/* 作用：单个主题按钮——透明底、描边分隔。 */
.preview-theme-switch__btn {
  padding: 8px 14px;
  border: none;
  border-right: 1px solid var(--preview-line);
  background: transparent;
  color: var(--preview-text-soft);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

/* 作用：去掉最后一个按钮的右侧分隔线。 */
.preview-theme-switch__btn:last-child {
  border-right: none;
}

/* 作用：手机宽度（≤520px）收窄按钮内边距与字号。
   原因：配合顶栏在 375px 手机上放得下，避免横向滚动。 */
@media (max-width: 520px) {
  .preview-theme-switch__btn {
    padding: 6px 8px;
    font-size: 13px;
  }
}

/* 作用：当前主题高亮——铜黄底加深色文字。 */
.preview-theme-switch__btn--active {
  background: var(--preview-accent);
  color: #2b2118;
}
</style>
