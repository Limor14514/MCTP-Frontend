/**
 * 文件用途：三主题切换 store（独立工程版，不再依赖 Pinia）
 * 作用：管理「黑夜 / 白天 / 护眼」三主题；通过 CSS 变量 + html[data-theme] 属性驱动，
 *       使用 localStorage 持久化用户选择，默认黑夜（即黄铜深褐主基调）。
 * 说明：原 MCTP-Frontend 中该 store 为 Pinia 定义；本独立工程不安装 Pinia，
 *       改为模块级响应式单例（ref + 导出函数），行为完全一致。
 * TODO-BACKEND：如需扩展主题（如新增配色），在 THEMES 表追加即可，切换按钮自动渲染。
 */

import { ref } from 'vue'

// 作用：三主题的元数据表，供主题切换按钮渲染与校验使用。
// 原因：把主题枚举集中定义，避免多处硬编码字符串导致拼写不一致。
export const THEMES = {
  night: { key: 'night', label: '黑夜' },
  day: { key: 'day', label: '白天' },
  eye: { key: 'eye', label: '护眼' },
}

// 原因：骨架阶段默认黑夜（与黄铜深褐主背景一致），用户切换后写入 localStorage。
const STORAGE_KEY = 'mctp-preview-theme'
const DEFAULT_THEME = 'night'

// 作用：当前主题（模块级响应式状态，替代 Pinia store 的 theme）。
const theme = ref(DEFAULT_THEME)

// 作用：应用入口处初始化——读取 localStorage 中的主题，无记录则用默认黑夜。
// 原因：必须在渲染前设置好 html[data-theme]，否则首帧会闪一下默认主题。
//       本独立工程在 src/main.js 中调用（挂载前执行），保证首屏即为正确主题。
export function initTheme() {
  // 原因：浏览器隐私模式 / 禁用站点数据时 localStorage 访问会抛异常，需兜底为默认主题，避免整页白屏。
  let saved = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    saved = null
  }
  if (saved && THEMES[saved]) {
    theme.value = saved
  }
  applyTheme()
}

// 作用：把当前主题写入 html 根节点的 data-theme 属性，并持久化到 localStorage。
// 原因：主题 CSS 变量定义在 :root / html[data-theme=...] 上，改属性即整体换肤，
//       无需逐组件传参；持久化保证刷新后仍保留用户选择。
function applyTheme() {
  document.documentElement.dataset.theme = theme.value
  try {
    localStorage.setItem(STORAGE_KEY, theme.value)
  } catch {
    // 原因：存储不可用时仅本次会话生效，不影响切换效果。
  }
}

// 作用：切换主题并立即生效（供 ThemeSwitcher 组件调用）。
// 原因：对非法 key 做防御，避免异常数据破坏页面主题。
export function setTheme(key) {
  if (!THEMES[key]) return
  theme.value = key
  applyTheme()
}

export { theme }
