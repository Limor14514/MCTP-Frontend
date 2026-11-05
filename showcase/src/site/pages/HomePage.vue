<script setup>
/**
 * 文件用途：主页面
 * 板块顺序（从上到下）：
 *  1. 悬浮的机械动力风格账号面板（AccountHero）：头像 / 名字 / UID + 今日运势 + 塔罗星盘；
 *  2. 公告板（FlapBoard）：翻牌显示器风格，10 秒自动轮换、滚轮或左右箭头切换；
 *     管理员登录后，公告标题右侧出现"编辑公告"，跳转到 /home/announcements 可视化编辑；
 *  3. 功能区（FeatureGrid）：8 个像素图标，两行四列，点击进入各功能介绍页 /home/f/<key>；
 *  4. 最后一个板块：左"更新日志"（ChangelogPanel）+ 右"最近评论"（RecentComments）。
 *  页脚（用户交流 / 站点支持 / 协议条款）由 SiteShell 统一加在页面最下面。
 * 第六轮：往下滚动时，各板块第一次进入画面才播放入场动画（每个板块只播一次）：
 *  - 公告：整块从下往上缓缓升起并淡入；
 *  - 功能：每张卡片分别从画面左右两侧飞入——左半边的从左边飞来，右半边的从右边飞来，依次落位；
 *  - 更新日志、最近评论：都套在卷轴（ScrollUnroll）里，像卷轴一样从上往下展开，右边比左边晚 0.25 秒。
 *  动画要等首次加载页结束、页面转场完全揭开后才开始监听，免得在黑幕后面偷偷播完。
 *  系统开启"减少动态效果"时不播放，内容直接显示。
 * 不登录也能浏览全部板块，只是运势被锁定。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import AccountHero from '../components/home/AccountHero.vue'
import FlapBoard from '../components/home/FlapBoard.vue'
import FeatureGrid from '../components/home/FeatureGrid.vue'
import ChangelogPanel from '../components/home/ChangelogPanel.vue'
import RecentComments from '../components/home/RecentComments.vue'
import ScrollUnroll from '../components/home/ScrollUnroll.vue'
import PixelText from '../components/PixelText.vue'
import { announcements } from '../services/announcements'
import { isAdmin } from '../services/account'
import { booted } from '../siteState'
import { whenTransitionDone } from '../composables/usePageTransition'

const noticeRef = ref(null)
const featureRef = ref(null)
const changelogRef = ref(null)
const commentsRef = ref(null)

// 每个板块：prepare = 先藏起来（挂载时立即执行），play = 进入画面时播放
const blocks = [
  {
    el: () => noticeRef.value,
    prepare: (el) => gsap.set(el, { y: 90, autoAlpha: 0 }),
    play: (el) => gsap.to(el, { y: 0, autoAlpha: 1, duration: 1.2, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }),
  },
  {
    el: () => featureRef.value,
    prepare: (el) => {
      gsap.set(el.querySelector('.block-head'), { autoAlpha: 0 })
      cells(el).forEach((c) => gsap.set(c, { x: flyFrom(c), autoAlpha: 0 }))
    },
    play: (el) => {
      gsap.to(el.querySelector('.block-head'), { autoAlpha: 1, duration: 0.6, clearProps: 'opacity,visibility' })
      gsap.to(cells(el), {
        x: 0,
        autoAlpha: 1,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.08,
        clearProps: 'transform,opacity,visibility',
      })
    },
  },
  {
    el: () => changelogRef.value?.$el,
    prepare: () => changelogRef.value?.prepare(),
    play: () => changelogRef.value?.unroll(),
  },
  {
    el: () => commentsRef.value?.$el,
    prepare: () => commentsRef.value?.prepare(),
    play: () => commentsRef.value?.unroll(0.25),
  },
]

const cells = (el) => [...el.querySelectorAll('.cell')]
// 卡片在左半边 → 从屏幕左边外面飞进来；在右半边 → 从右边外面飞进来
function flyFrom(cell) {
  const r = cell.getBoundingClientRect()
  const mid = window.innerWidth / 2
  return r.left + r.width / 2 < mid ? -(r.right + 40) : window.innerWidth - r.left + 40
}

let io
let unwatch
function start() {
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const b = blocks.find((x) => x.el() === e.target)
        io.unobserve(e.target) // 只播一次
        b?.play(e.target)
      }
    },
    { threshold: 0.18 },
  )
  blocks.forEach((b) => b.el() && io.observe(b.el()))
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  blocks.forEach((b) => {
    const el = b.el()
    if (el) b.prepare(el)
  })
  // 等首次加载页结束 + 转场揭开后，才开始监听滚动
  const go = () => whenTransitionDone().then(() => io === undefined && start())
  if (booted.value) go()
  else unwatch = watch(booted, (v) => v && go())
})
onBeforeUnmount(() => {
  io?.disconnect()
  io = null
  unwatch?.()
})
</script>

<template>
  <main class="site-page home-page">
    <AccountHero />

    <section ref="noticeRef" class="block">
      <header class="block-head">
        <PixelText text="公告" :px="4" />
        <router-link v-if="isAdmin" to="/home/announcements" class="mc-btn is-ghost edit"><PixelText text="编辑公告" :px="2" /></router-link>
      </header>
      <FlapBoard :items="announcements" />
    </section>

    <section ref="featureRef" class="block">
      <header class="block-head">
        <PixelText text="功能" :px="4" />
      </header>
      <FeatureGrid />
    </section>

    <section class="block duo">
      <ScrollUnroll ref="changelogRef"><ChangelogPanel /></ScrollUnroll>
      <ScrollUnroll ref="commentsRef"><RecentComments /></ScrollUnroll>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: clip; /* 卡片从屏幕外飞入时不出现横向滚动条 */
}
.block {
  width: min(1120px, 100%);
  margin-top: 64px;
}
.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.edit {
  font-size: 13px;
  padding: 8px 14px;
}
/* 更新日志 + 最近评论：桌面左右各一半，窄屏上下排列 */
.duo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(16px, 2.4vw, 28px);
  align-items: stretch;
}
@media (max-width: 860px) {
  .duo { grid-template-columns: 1fr; }
}
</style>
