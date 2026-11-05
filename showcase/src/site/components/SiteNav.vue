<script setup>
/**
 * 文件用途：全站透明导航栏
 * 布局：左 = 矢量 Logo + 与 Logo 等高的光滑白色像素字 "MCREATOPIA"；
 *       中 = "索引 / 主页面 / 反馈" 三个像素字链接（随 Language 切换语言）；
 *       右 = Language 语言选择器 + 《我的世界》金色时钟 + 24 小时制现实时间（HH:MM）。
 * 动效：show 变为 true 时（首次加载结束），整条导航栏连同 Logo 一起从屏幕上方掉落，
 *       用 bounce.out 缓动——"从空中下落、突然停住、再弹两下"。
 * 跳转：使用普通 router-link；转场由路由守卫统一接管（见 router/index.js），这里无需额外处理。
 * 当前页：router-link-exact-active 类 → 薄弱而明显的金色辉光。
 */
import { onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import gsap from 'gsap'
import PixelText from './PixelText.vue'
import McClock from './McClock.vue'
import LanguagePicker from './LanguagePicker.vue'
import logoUrl from '../assets/logo-placeholder.svg'
import { wordPath } from '../pixel/path'
import { GLYPH_H } from '../pixel/glyphs'
import { t } from '../i18n'

const props = defineProps({ show: { type: Boolean, default: false } })

const LINKS = [
  { to: '/', key: 'nav.index' },
  { to: '/home', key: 'nav.home' },
  { to: '/feedback', key: 'nav.feedback' },
]

// Logo 右边的字标：用自绘 5×7 点阵合成一条 path，纯白、无倒角无描边（"光滑"）
const mark = wordPath('MCREATOPIA')

const navRef = ref(null)
const now = ref(new Date())
const pad = (n) => String(n).padStart(2, '0')
const timeText = ref('')
function refreshTime() {
  now.value = new Date()
  timeText.value = `${pad(now.value.getHours())}:${pad(now.value.getMinutes())}`
}

// 只在"整分钟"刷新：先对齐到下一分钟，再每 60s 一次，不做秒级刷新
let alignTimer, minuteTimer
function startClock() {
  refreshTime()
  const msToNext = 60000 - (Date.now() % 60000) + 20
  alignTimer = setTimeout(() => {
    refreshTime()
    minuteTimer = setInterval(refreshTime, 60000)
  }, msToNext)
}

function drop() {
  gsap.fromTo(
    navRef.value,
    { yPercent: -180, autoAlpha: 1 },
    { yPercent: 0, duration: 1.15, ease: 'bounce.out' },
  )
}

watch(() => props.show, (v) => v && nextTick(drop))

// 普通滚动页面（主页面、反馈等）往下滚动后，导航栏背后加一层由深到透明的渐变，
// 避免透明导航栏的文字和页面内容叠在一起看不清；回到顶部时恢复完全透明。
const scrolled = ref(false)
const onScroll = () => (scrolled.value = window.scrollY > 24)

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  startClock()
  if (props.show) drop()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  clearTimeout(alignTimer)
  clearInterval(minuteTimer)
})
</script>

<template>
  <header ref="navRef" class="site-nav" :class="{ 'is-hidden': !show, 'is-scrolled': scrolled }">
    <router-link to="/" class="nav-brand" aria-label="MCREATOPIA">
      <img class="nav-logo" :src="logoUrl" alt="" />
      <svg
        class="nav-wordmark"
        :viewBox="`0 0 ${mark.width} ${GLYPH_H}`"
        shape-rendering="crispEdges"
        aria-hidden="true"
      >
        <path :d="mark.d" fill="currentColor" />
      </svg>
    </router-link>

    <nav class="nav-links" aria-label="主导航">
      <router-link v-for="l in LINKS" :key="l.to" :to="l.to" class="nav-link">
        <PixelText :text="t(l.key)" :px="2" />
      </router-link>
    </nav>

    <div class="nav-time">
      <LanguagePicker />
      <McClock :date="now" :px="2" />
      <PixelText :text="timeText" :px="2" />
    </div>
  </header>
</template>

<style scoped>
.site-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: clamp(10px, 2vh, 22px) clamp(14px, 3vw, 40px);
  background: transparent;
  color: #fff;
  pointer-events: none; /* 只让实际可点元素接收事件，不挡住下面的页面交互 */
}
.site-nav::before {
  content: '';
  position: absolute;
  inset: 0 0 -30px;
  background: linear-gradient(180deg, rgba(11, 12, 16, 0.92), rgba(11, 12, 16, 0));
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: -1;
}
.site-nav.is-scrolled::before {
  opacity: 1;
}
.site-nav > * {
  pointer-events: auto;
}
.is-hidden {
  visibility: hidden;
}
/* Logo 与字标共用同一个高度变量，保证"字和商标差不多大" */
.nav-brand {
  --brand-h: clamp(26px, 2.8vw, 40px);
  justify-self: start;
  display: flex;
  align-items: center;
  gap: calc(var(--brand-h) * 0.35);
  color: #fff;
}
.nav-logo {
  display: block;
  width: var(--brand-h);
  height: var(--brand-h);
  image-rendering: pixelated;
}
.nav-wordmark {
  display: block;
  height: calc(var(--brand-h) * 0.8);
  width: auto;
}
.nav-links {
  display: flex;
  gap: clamp(14px, 3vw, 44px);
}
.nav-link {
  color: #fff;
  opacity: 0.78;
  padding: 6px 4px;
  transition: opacity 0.2s, filter 0.3s;
}
.nav-link:hover {
  opacity: 1;
}
/* 当前页：薄弱但明显的金色光，用两层 drop-shadow（像素字是 SVG，text-shadow 无效） */
.nav-link.router-link-exact-active {
  opacity: 1;
  color: #fff6d8;
  filter: drop-shadow(0 0 2px rgba(255, 201, 60, 0.9)) drop-shadow(0 0 8px rgba(255, 190, 40, 0.45));
}
.nav-time {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 800px) {
  /* 手机竖屏：一行放不下 Logo + 三个链接 + Language + 时钟 + 时间（会把时钟挤出屏幕），
     改成两行——第一行左 Logo、右 Language/时钟/时间；第二行居中放三个页面链接 */
  .site-nav {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'brand time'
      'links links';
    gap: 6px 10px;
    padding-bottom: 6px;
  }
  .nav-brand { grid-area: brand; }
  .nav-time { grid-area: time; }
  .nav-links {
    grid-area: links;
    justify-content: center;
    gap: 22px;
  }
  /* 手机端整体缩到 1.5 倍像素（zoom 会同时缩小占位尺寸，transform 不会） */
  .nav-link :deep(svg),
  .nav-time :deep(svg) {
    zoom: 0.75;
  }
  .nav-time {
    gap: 6px;
  }
}
/* 窗口不够宽时整行字标会和中间的链接挤在一起，只保留 Logo */
@media (max-width: 1080px) {
  .nav-wordmark {
    display: none;
  }
}
</style>
