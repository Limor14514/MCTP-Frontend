<script setup>
/**
 * 文件用途：通用像素图标（矢量 SVG）
 * 用法：<PixelIcon :icon="{ map: [...16 行字符串], colors: { O: '#000', ... } }" :size="96" />
 *  - map 每一行是一串字符，一个字符 = 一个像素；'.' 或 colors 里没有的字符 = 透明；
 *  - 同色的相邻像素合并成一条 path（每种颜色一条），放大到任意尺寸都清晰锐利。
 * 主页面功能区的 8 个图标、以后其他像素小图标都可以用它画。
 */
import { computed } from 'vue'

const props = defineProps({
  icon: { type: Object, required: true },
  size: { type: Number, default: 64 },
  label: { type: String, default: '' },
})

// 按颜色分组，每个像素写成 "M x y h1 v1 h-1 z"，同色像素拼进同一条 path
const layers = computed(() => {
  const { map, colors } = props.icon
  const byColor = {}
  map.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const c = colors[ch]
      if (!c) return
      ;(byColor[c] ||= []).push(`M${x} ${y}h1v1h-1z`)
    }),
  )
  return Object.entries(byColor).map(([fill, parts]) => ({ fill, d: parts.join('') }))
})
const w = computed(() => props.icon.map[0]?.length || 16)
const h = computed(() => props.icon.map.length || 16)
</script>

<template>
  <svg
    class="pixel-icon"
    :width="size"
    :height="(size * h) / w"
    :viewBox="`0 0 ${w} ${h}`"
    shape-rendering="crispEdges"
    :role="label ? 'img' : 'presentation'"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  >
    <path v-for="l in layers" :key="l.fill" :d="l.d" :fill="l.fill" />
  </svg>
</template>

<style scoped>
.pixel-icon {
  display: block;
}
</style>
