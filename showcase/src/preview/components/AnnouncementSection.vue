<script setup>
/**
 * 文件用途：预览页公告区组件（主界面第一屏左侧）
 * 作用：以横向轮播展示公告（自动播放、悬停/聚焦暂停、圆点与左右切换），
 *       并在标题旁显示「最后更新于」时间戳；骨架阶段使用本地模拟数据，标注待对接后端。
 */
// 原因：v-reveal / v-tilt 指令改为组件内局部注册（<script setup> 中 v 前缀变量自动注册为指令），
//       不再改动全局 src/main.js，保持现有框架零侵入。
import { reveal as vReveal } from '../directives/reveal'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// 作用：模拟公告数据（含摘要，供轮播每个 slide 展示更完整信息）。
// TODO-BACKEND: 公告为模拟数据，待对接后端公告接口（可复用 src/api/community.js 的 announcements）。
const announcements = ref([
  {
    id: 1,
    tag: '置顶',
    title: '机械动力服 · 首轮内测正式开启',
    summary: '欢迎加入黄铜工业时代：搭建传动网络、共建自动化工厂，内测期间全服双倍产出。',
    date: '2026-10-25',
  },
  {
    id: 2,
    tag: '更新',
    title: '0.5.4 版本更新：新增黄铜压力管道系统',
    summary: '本次更新加入压力管道与蒸汽机械，优化了大范围机械装置的 TPS 表现。',
    date: '2026-10-20',
  },
  {
    id: 3,
    tag: '维护',
    title: '服务器每周例行维护通知',
    summary: '每周三 04:00 例行维护，预计 30 分钟，期间无法进入服务器。',
    date: '2026-10-28',
  },
])

// 作用：最后更新时间戳（自动取所有公告中最新的日期）——配合状态条体现「持续运营」。
// 原因：原先手写固定日期，新增/修改公告后容易忘记同步；改为从公告数据计算，
//       YYYY-MM-DD 字符串可直接按字典序比较，取最大值即最新日期。
const lastUpdate = computed(() =>
  announcements.value.reduce((max, a) => (a.date > max ? a.date : max), ''),
)

// 作用：当前轮播索引。
const current = ref(0)
// 作用：是否暂停自动播放（悬停/聚焦时）。
const paused = ref(false)
let timer = null

// 作用：是否开启自动播放（减少动效用户不自动轮播）。
const canAutoplay =
  typeof window !== 'undefined' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 作用：切换到指定索引（循环）。
function go(i) {
  const len = announcements.value.length
  current.value = (i + len) % len
}
function next() {
  go(current.value + 1)
}
function prev() {
  go(current.value - 1)
}

onMounted(() => {
  if (!canAutoplay) return
  // 作用：每 4.5 秒自动切下一条；paused 时跳过。
  timer = setInterval(() => {
    if (!paused.value && !document.hidden) next()
  }, 4500)
})

onBeforeUnmount(() => {
  // 原因：离开页面时清除定时器，避免泄漏与后台空转。
  clearInterval(timer)
})
</script>

<template>
  <!-- 作用：公告区容器；id 供顶部锚点导航定位；v-reveal 使其滚入视口时淡入上浮。 -->
  <section
    id="announcements"
    v-reveal
    class="preview-card preview-announce"
    aria-labelledby="announce-title"
  >
    <!-- 作用：标题行——左侧标题、右侧「最后更新于」时间戳。 -->
    <div class="preview-announce__head">
      <h2
        id="announce-title"
        class="preview-section-title"
      >
        公告
      </h2>
      <span class="preview-announce__updated">最后更新于 {{ lastUpdate }}</span>
    </div>

    <!-- 作用：轮播视口——悬停/聚焦时暂停自动播放。 -->
    <div
      class="preview-announce__viewport"
      @mouseenter="paused = true"
      @mouseleave="paused = false"
      @focusin="paused = true"
      @focusout="paused = false"
    >
      <div
        class="preview-announce__track"
        :style="{ transform: `translateX(-${current * 100}%)` }"
      >
        <!-- 作用：单条公告 slide。 -->
        <article
          v-for="item in announcements"
          :key="item.id"
          class="preview-announce__slide"
        >
          <span class="preview-announce__tag">{{ item.tag }}</span>
          <h3 class="preview-announce__title">
            {{ item.title }}
          </h3>
          <p class="preview-announce__summary">
            {{ item.summary }}
          </p>
          <time class="preview-announce__date">{{ item.date }}</time>
        </article>
      </div>
    </div>

    <!-- 作用：轮播控制——上一条 / 圆点 / 下一条。 -->
    <div class="preview-announce__controls">
      <button
        class="preview-announce__arrow"
        type="button"
        aria-label="上一条公告"
        @click="prev"
      >
        ‹
      </button>
      <div class="preview-announce__dots">
        <button
          v-for="(item, i) in announcements"
          :key="item.id"
          class="preview-announce__dot"
          :class="{ 'is-active': i === current }"
          type="button"
          :aria-label="`第 ${i + 1} 条公告`"
          :aria-pressed="i === current"
          @click="go(i)"
        />
      </div>
      <button
        class="preview-announce__arrow"
        type="button"
        aria-label="下一条公告"
        @click="next"
      >
        ›
      </button>
    </div>

    <!-- TODO-BACKEND: 公告为模拟数据，待对接后端公告接口。 -->
    <p class="preview-muted preview-announce__note">
      TODO-BACKEND：公告为模拟数据，待对接后端公告接口（含标题 / 摘要 / 标签 / 日期）。
    </p>
  </section>
</template>

<style scoped>
/* 作用：标题行两端对齐。 */
.preview-announce__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

/* 作用：最后更新时间戳——弱化小字。 */
.preview-announce__updated {
  font-size: 12px;
  color: var(--preview-text-soft);
}

/* 作用：轮播视口——裁切超出部分。 */
.preview-announce__viewport {
  overflow: hidden;
  border-radius: 8px;
}

/* 作用：轨道——flex 横排，位移通过 transform 切换；加过渡形成滑动。 */
.preview-announce__track {
  display: flex;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

/* 作用：单个 slide——占满视口宽度，不收缩。 */
.preview-announce__slide {
  flex: 0 0 100%;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 8px;
  background: var(--preview-bg-panel-soft);
  border-left: 3px solid var(--preview-accent);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 作用：公告标签——铜黄小圆角块。 */
.preview-announce__tag {
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--preview-accent);
  color: #2b2118;
  font-size: 12px;
}

/* 作用：公告标题。 */
.preview-announce__title {
  margin: 0;
  font-size: 18px;
  color: var(--preview-text);
}

/* 作用：公告摘要。 */
.preview-announce__summary {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--preview-text-soft);
}

/* 作用：公告日期。 */
.preview-announce__date {
  font-size: 13px;
  color: var(--preview-text-soft);
}

/* 作用：控制条——左右箭头夹圆点居中。 */
.preview-announce__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 12px;
}

/* 作用：箭头按钮。 */
.preview-announce__arrow {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--preview-line-strong);
  background: transparent;
  color: var(--preview-text-soft);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.preview-announce__arrow:hover {
  color: var(--preview-accent);
  border-color: var(--preview-accent);
}

/* 作用：圆点组。 */
.preview-announce__dots {
  display: flex;
  gap: 8px;
}

/* 作用：单个圆点——默认灰，激活铜黄并拉长。 */
.preview-announce__dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: var(--preview-line-strong);
  cursor: pointer;
  transition: background 0.2s ease, width 0.2s ease;
}

.preview-announce__dot.is-active {
  width: 22px;
  background: var(--preview-accent);
}

/* 作用：TODO 提示。 */
.preview-announce__note {
  margin: 12px 0 0;
}
</style>
