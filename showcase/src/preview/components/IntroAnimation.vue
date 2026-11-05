<script setup>
/**
 * 文件用途：预览页启动遮罩组件（精简版：仅加载遮罩 → 上滑过渡）
 * 作用：启动时全屏显示加载遮罩（极细进度条 + 百分比 + monospace 终端日志 + 「点击任意位置开始」提示）；
 *       点击遮罩后整体向上滑出退场（GSAP yPercent -100、约 0.55s、power2.inOut），
 *       滑出动画 onComplete 后再向父组件发出 finish 事件，父组件随即显示主界面
 *       （主界面入场由 PreviewApp.vue 的 .preview-shell 动画衔接，形成「上滑 + 上移淡入」的上下连贯进入效果）。
 * 回退方式：本文件由 IntroAnimation.three-stage.vue（三段式：加载遮罩→点击触发→拆字入场稳定首屏）精简而来，
 *       如需回退，将 IntroAnimation.three-stage.vue 复制覆盖本文件即可；
 *       更早的双齿轮自动播放版见 IntroAnimation.original.vue。
 * 配色：沿用预览页主题变量（--preview-*）；字体沿用像素字体栈与 monospace 终端日志。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'

const emit = defineEmits(['finish'])

// 作用：防重入标记：finish 只允许触发一次，避免滑出动画 onComplete 与重复点击重复发出事件。
const done = ref(false)

// 作用：加载进度百分比（0 → 100），与极细进度条严格同步。
const percent = ref(0)

// 作用：终端日志已输出的行数组，加载阶段逐行追加。
const logs = ref([])

// 作用：是否加载完成（进度 100% 且日志输出完毕），完成后显示「点击任意位置开始」提示。
const ready = ref(false)

// 作用：加载阶段终端日志文案（monospace + '>' 前缀，营造系统引导感）。
// TODO-CONTENT: 文案可随服主实际资源预加载流程调整。
const LOG_LINES = [
  '> Pre-fetching assets...',
  '> Loading archive...',
  '> Calibrating gears...',
  '> Ready.',
]

// 作用：读取系统「减少动态效果」偏好。
// 原因：无障碍要求——用户开启系统减少动效时，跳过加载与滑出动画，短暂停留后直接进入主界面。
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let loadTl = null // 加载进度条时间线
let exitTl = null // 遮罩上滑退场时间线
let logTimer = null // 终端日志逐行输出定时器

// 作用：结束启动遮罩并通知父组件切换主界面。
// 原因：done 防重入，保证 finish 事件只发出一次。
function finish() {
  if (done.value) return
  done.value = true
  emit('finish')
}

// 作用：点击遮罩的事件入口。
// 原因：加载中点击 = 跳过加载立即播放上滑过渡；加载完成后点击同样直接播放过渡。
function onClick() {
  if (done.value) return
  playExit()
}

// 作用：播放「启动页 → 主页面」过渡：遮罩整体向上滑出退场。
// 原因：滑出动画 onComplete 后再 emit finish，保证视觉连贯——主界面在遮罩滑出完成瞬间于下方衔接进入。
function playExit() {
  if (exitTl) return // 防重入：过渡已开始则忽略后续点击

  // 原因：过渡开始即停止加载动画与日志输出，避免与滑出动画竞争。
  loadTl?.kill()
  if (logTimer) window.clearInterval(logTimer)

  exitTl = gsap.to('.preview-intro__overlay', {
    yPercent: -100,
    duration: 0.55,
    ease: 'power2.inOut',
    onComplete: finish,
  })
}

// 作用：终端日志逐行输出（加载阶段自动播放，每行 0.5s）。
function runLog() {
  let i = 0
  logTimer = window.setInterval(() => {
    if (i < LOG_LINES.length) {
      logs.value.push(LOG_LINES[i])
      i += 1
    } else {
      window.clearInterval(logTimer)
      logTimer = null
      ready.value = true
    }
  }, 500)
}

onMounted(() => {
  // 原因：减少动效用户直接跳过加载与过渡，避免不必要的等待。
  if (prefersReducedMotion) {
    window.setTimeout(finish, 600)
    return
  }

  // 作用：加载进度条 0 → 100%（0.25vw 级极细条），并同步更新百分比数字。
  // 原因：进度条与百分比需严格同步，故在 onUpdate 里读取动画进度换算为 0-100。
  loadTl = gsap.fromTo(
    '.preview-intro__panel-bar',
    { scaleX: 0 },
    {
      scaleX: 1,
      duration: 2,
      ease: 'power1.inOut',
      onUpdate() {
        percent.value = Math.round(this.progress() * 100)
        if (this.progress() >= 1) ready.value = true
      },
    },
  )

  // 作用：终端日志逐行输出（自动播放）。
  runLog()
})

onBeforeUnmount(() => {
  // 原因：组件销毁前终止所有动画与定时器，避免离开页面后继续执行造成内存泄漏。
  loadTl?.kill()
  exitTl?.kill()
  if (logTimer) window.clearInterval(logTimer)
})
</script>

<template>
  <!-- 作用：启动遮罩根层；点击任意处触发上滑过渡（onClick 内防重入）。 -->
  <div
    class="preview-intro"
    @click="onClick"
  >
    <!-- 作用：全屏加载遮罩——主题底色 + 极淡网格 + 居中加载面板 + 点击提示；上滑退场由 GSAP 控制 yPercent。 -->
    <div class="preview-intro__overlay">
      <!-- 作用：极淡网格层，模拟工程蓝图/参考站遮罩网格；配色用主题线色变量。 -->
      <div
        class="preview-intro__grid"
        aria-hidden="true"
      />

      <!-- 作用：居中加载面板：Logo + 极细进度条 + 百分比 + 终端日志。 -->
      <div
        class="preview-intro__panel"
        aria-hidden="true"
      >
        <div class="preview-intro__panel-logo">
          MCREATOPIA
        </div>
        <div class="preview-intro__panel-track">
          <div class="preview-intro__panel-bar" />
        </div>
        <span class="preview-intro__panel-percent">{{ percent }}%</span>
        <div class="preview-intro__panel-log">
          <p
            v-for="(line, i) in logs"
            :key="i"
          >
            {{ line }}
          </p>
        </div>
        <!-- TODO-AUDIO: 音频开关（Off/On）占位，待接入开场音效后实现显式开关。 -->
      </div>

      <!-- 作用：面板下方「点击任意位置开始」提示，加载完成后闪烁。 -->
      <span
        class="preview-intro__panel-start"
        :class="{ 'is-ready': ready }"
      >点击任意位置开始</span>
    </div>
  </div>
</template>

<style scoped>
/* 作用：启动遮罩根层——固定全屏覆盖，整层可点击。
   原因：不设背景色，滑出时露出下层 GearBackground 动态背景，使上滑过渡视觉更连贯。 */
.preview-intro {
  position: fixed;
  inset: 0;
  z-index: 1000;
  color: var(--preview-accent);
  cursor: pointer;
  overflow: hidden;
}

/* 作用：全屏加载遮罩——承载网格/面板/提示；主题底色覆盖背景层，上滑退场由 GSAP 控制 yPercent。 */
.preview-intro__overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  background: var(--preview-bg);
}

/* 作用：极淡网格层——两条线性渐变交叉成细线网格，模拟工程蓝图/参考站网格遮罩。 */
.preview-intro__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--preview-line-strong) 1px, transparent 1px),
    linear-gradient(90deg, var(--preview-line-strong) 1px, transparent 1px);
  background-size: 56px 56px;
  opacity: 0.14;
}

/* 作用：居中加载面板。 */
.preview-intro__panel {
  position: relative;
  width: min(400px, 78vw);
  padding: 28px 30px 24px;
  border: 1px solid var(--preview-line-strong);
  border-radius: 10px;
  background: color-mix(in srgb, var(--preview-bg-panel) 88%, transparent);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 作用：面板顶部 Logo/标题。 */
.preview-intro__panel-logo {
  font-family: var(--preview-font);
  /* 原因：站名由 4 字母「MCTP」改为 10 字母「MCREATOPIA」，固定 26px + 0.28em 字距在手机上会溢出面板；
          改为随视口缩放（最小 18px、最大 26px）并收窄字距，大屏观感不变、小屏不换行。 */
  font-size: clamp(18px, 5.5vw, 26px);
  letter-spacing: 0.2em;
  white-space: nowrap;
  color: var(--preview-accent);
  text-shadow: 0 0 16px color-mix(in srgb, var(--preview-accent) 55%, transparent);
}

/* 作用：极细进度条轨道（0.25vw 级，min 1px 兜底）。 */
.preview-intro__panel-track {
  height: max(1px, 0.25vw);
  border-radius: 2px;
  background: color-mix(in srgb, var(--preview-text) 18%, transparent);
  overflow: hidden;
}

/* 作用：进度条激活条，由 GSAP 控制 scaleX 0 → 1。 */
.preview-intro__panel-bar {
  width: 100%;
  height: 100%;
  background: var(--preview-accent);
  transform-origin: left center;
  box-shadow: 0 0 10px var(--preview-accent);
}

/* 作用：加载百分比数字——等宽数字，像素感。 */
.preview-intro__panel-percent {
  font-size: 14px;
  letter-spacing: 0.12em;
  color: var(--preview-text-soft);
  font-variant-numeric: tabular-nums;
}

/* 作用：终端日志容器——monospace 等宽，逐行输出。 */
.preview-intro__panel-log {
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--preview-text-soft);
  min-height: 6.4em;
}

.preview-intro__panel-log p {
  margin: 0;
}

/* 作用：「点击任意位置开始」提示——默认隐藏，加载完成后闪烁。 */
.preview-intro__panel-start {
  font-size: 14px;
  letter-spacing: 0.18em;
  color: var(--preview-accent);
  opacity: 0;
  visibility: hidden;
  animation: preview-intro-blink 1s ease-in-out infinite;
}

.preview-intro__panel-start.is-ready {
  opacity: 1;
  visibility: visible;
}

/* 作用：加载完成提示闪烁动画。 */
@keyframes preview-intro-blink {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}
</style>
