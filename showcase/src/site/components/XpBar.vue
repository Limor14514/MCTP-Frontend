<script setup>
/**
 * 文件用途：加载进度条——《我的世界》风格经验条（自绘像素画，替代百分比数字）
 * 结构（viewBox 单位 = 1 像素格，总尺寸 182×7）：
 *  - 黑色描边 + 深灰槽；槽内每 18 格一个刻度，分成 10 段，和游戏里的经验条一样；
 *  - 绿色填充分三行：顶行亮绿高光、中间主绿、底行暗绿，宽度 = 进度；
 *  - 刻度线画在填充之上，所以填满的部分也能看到分段；外层有淡淡的绿色辉光。
 */
import { computed } from 'vue'

const props = defineProps({
  progress: { type: Number, default: 0 },
})

const INNER = 180
const fill = computed(() => Math.round(Math.max(0, Math.min(1, props.progress)) * INNER))
const ticks = Array.from({ length: 9 }, (_, i) => 1 + (i + 1) * 18)
</script>

<template>
  <svg
    class="xp-bar"
    viewBox="0 0 182 7"
    shape-rendering="crispEdges"
    role="progressbar"
    aria-label="加载进度"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(progress * 100)"
  >
    <rect x="0" y="0" width="182" height="7" fill="#000" />
    <rect x="1" y="1" width="180" height="5" fill="#2a2a2a" />
    <rect x="1" y="5" width="180" height="1" fill="#1a1a1a" />
    <g v-if="fill > 0">
      <rect x="1" y="1" :width="fill" height="1" fill="#c6ff73" />
      <rect x="1" y="2" :width="fill" height="3" fill="#80e82b" />
      <rect x="1" y="5" :width="fill" height="1" fill="#3f8f12" />
    </g>
    <!-- 分段刻度 -->
    <rect v-for="x in ticks" :key="x" :x="x" y="1" width="1" height="5" :fill="x <= fill ? '#2f6b0c' : '#141414'" />
  </svg>
</template>

<style scoped>
.xp-bar {
  display: block;
  width: 100%;
  height: auto;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 6px rgba(128, 232, 43, 0.25));
}
</style>
