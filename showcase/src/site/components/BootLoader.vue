<script setup>
/**
 * 文件用途：首次加载页（只在打开网站时出现一次）
 * 作用：PixelGalaxy 像素银河背景（鼠标涟漪）+ 居中的 LOADING 标题（Blockbench 渲染图或内置立体字）
 *       + 下方《我的世界》风格经验条；金光与经验条随真实加载进度同步推进。
 *       满格后 emit('done')，由 SiteShell 播放转场衔接到索引页（加载页在转场盖住屏幕时卸载）。
 * 进度来源（真实而不是假进度条）：
 *  - document.fonts.ready（像素字体）
 *  - window load（图片、样式等首屏资源）
 *  - props.tasks：外部传入的额外 Promise（例如 three.js 场景模块的预加载）
 * 显示规则：
 *  - 显示进度 = min(真实进度, 时间进度)，时间进度在 MIN_MS 内走满，保证动效至少完整播放一次；
 *  - 真实任务没全部完成前最多显示到 92%，避免"到 100% 还卡着"；
 *  - 兜底：MAX_MS 后无论如何结束（修复旧版"偶发卡在 36%/4%"的问题）。
 */
import { onMounted, onBeforeUnmount, ref } from 'vue'
import PixelGalaxy from './PixelGalaxy.vue'
import LoadingTitle from './LoadingTitle.vue'
import XpBar from './XpBar.vue'

const props = defineProps({
  tasks: { type: Array, default: () => [] },
})
const emit = defineEmits(['done'])

const MIN_MS = 2600
const MAX_MS = 12000
const HOLD_MS = 450 // 满格后停留，让用户看清"全金 + 经验条满"

const shown = ref(0)

let done = 0
let total = 0
let finished = false
let raf
let start
let lastNow
let holdTimer

function track(p) {
  total++
  Promise.resolve(p).catch(() => {}).finally(() => done++)
}

function tick(now) {
  const elapsed = now - start
  const real = total ? done / total : 1
  const timeP = Math.min(1, elapsed / MIN_MS)
  let target = Math.min(real, timeP)
  if (real < 1) target = Math.min(target, 0.92)
  if (elapsed > MAX_MS) target = 1
  // 平滑追赶，金光推进不会一跳一跳；按真实帧间隔计算，低帧率/后台标签页下速度一致
  const dt = Math.min(0.1, (now - (lastNow ?? now)) / 1000)
  lastNow = now
  shown.value += (target - shown.value) * (1 - Math.exp(-dt * 8))
  if (target === 1 && shown.value > 0.995) shown.value = 1

  if (shown.value >= 1 && !finished) {
    finished = true
    holdTimer = setTimeout(() => emit('done'), HOLD_MS)
    return
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  track(document.fonts?.ready)
  track(
    document.readyState === 'complete'
      ? null
      : new Promise((r) => window.addEventListener('load', r, { once: true })),
  )
  props.tasks.forEach(track)
  start = performance.now()
  raf = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  clearTimeout(holdTimer)
})
</script>

<template>
  <div class="boot-loader">
    <PixelGalaxy />
    <div class="boot-center">
      <div class="boot-word">
        <LoadingTitle :progress="shown" />
      </div>
      <div class="boot-xp">
        <XpBar :progress="shown" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.boot-loader {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: var(--space-bg);
  overflow: hidden;
  touch-action: none;
}
.boot-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(22px, 5vh, 56px);
  pointer-events: none; /* 让指针事件穿透到背景，标题区域上方也能划出涟漪 */
}
.boot-word {
  /* 比上一版（75vw）小一号；竖屏手机放宽到 78vw 保证看得清 */
  width: min(52vw, 100vh);
  filter: drop-shadow(0 1vw 1.2vw rgba(0, 0, 0, 0.65));
}
.boot-xp {
  width: min(34vw, 66vh);
}
@media (max-width: 640px) {
  .boot-word { width: 78vw; }
  .boot-xp { width: 60vw; }
}
</style>
