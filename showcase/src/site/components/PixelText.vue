<script setup>
/**
 * 文件用途：通用像素文字组件（导航栏中文标签、小号说明文字等）
 * 作用：调用 rasterizeText 把文字二值化成点阵，再用一条 SVG path 画出来；
 *       颜色走 currentColor，所以外层改 color / text-shadow 类效果（filter）即可换色发光。
 * 参数：text 文字；px 每个像素格在屏幕上的边长（CSS px），默认 2 → 12px 字高约 28px。
 */
import { computed } from 'vue'
import { rasterizeText, fontsVersion } from '../pixel/rasterize'
import { cellsToPath } from '../pixel/path'

const props = defineProps({
  text: { type: String, required: true },
  px: { type: Number, default: 2 },
  size: { type: Number, default: 12 },
})

// 依赖 fontsVersion：像素字体下载完成后自动重画一次
const raster = computed(() => (fontsVersion.value, rasterizeText(props.text, props.size)))
const d = computed(() => cellsToPath(raster.value.cells))
</script>

<template>
  <svg
    class="pixel-text"
    :width="raster.width * px"
    :height="raster.height * px"
    :viewBox="`0 0 ${raster.width} ${raster.height}`"
    shape-rendering="crispEdges"
    role="img"
    :aria-label="text"
  >
    <path :d="d" fill="currentColor" />
  </svg>
</template>

<style scoped>
.pixel-text {
  display: block;
  overflow: visible;
}
</style>
