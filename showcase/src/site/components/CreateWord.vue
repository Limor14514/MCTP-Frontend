<script setup>
/**
 * 文件用途：加载页标题 LOADING——《我的世界：机械动力》（Create）风格的立体像素字 + 金光进度
 * 风格要点（参考 Create 模组标志的"黄铜铸件"质感，字形为本站自绘 5×7 点阵）：
 *  1. 深棕色粗描边：整块字形（连同底部厚度）外围一圈深色轮廓，读起来像一整块金属铸件；
 *  2. 黄铜正面：上亮下暗的竖向渐变（浅黄 → 黄铜 → 橙棕），不再是一格一格的岩石块；
 *  3. 只在"字形外缘"做倒角（上/左亮边，下/右暗边），内部相邻像素之间不画缝，字面是光滑的整片；
 *  4. 底部厚度：向正下方挤出 6 层，由铜棕到深棕，模仿 Create 标志厚重的底边；
 *  5. 进度：未加载部分是"未打磨"的暗黄铜，已加载部分从左到右变成发亮的抛光黄铜，
 *     前沿有一道白色高光扫过，外侧带金色辉光（像熔融金属正在注满模具）。
 * 实现：描边用"同一字形 path 加粗描边、再把填充盖在上面"的办法——
 *       像素格之间共享的内部边会被填充盖住，只剩外缘一圈描边，节点数很少。
 * 参数：text 文字（默认 LOADING）；progress 0~1。
 */
import { computed } from 'vue'
import { layoutWord } from '../pixel/path'
import { glyphCells, GLYPH_W, GLYPH_H } from '../pixel/glyphs'

const props = defineProps({
  text: { type: String, default: 'LOADING' },
  progress: { type: Number, default: 0 },
})

// 底部厚度：层数与每层下移量（单位 = 1 像素格）
const DEPTH_LAYERS = 6
const DY = 0.14
// 厚度颜色：靠近正面的铜棕 → 最底部的深棕
const SIDE = ['#b8742a', '#a4631f', '#8f5419', '#7a4614', '#663910', '#522d0c']
const OUTLINE = '#22140a'
const OUTLINE_W = 0.62 // 描边总宽，外露一半 ≈ 0.3 格

const layout = computed(() => layoutWord(props.text))
const totalW = computed(() => layout.value.width)

/**
 * 作用：只沿字形外缘生成倒角条。
 * 原因：Create 标志的字面是整片光滑金属，不需要每个像素都有缝；
 *       判断某格上/下/左/右是否有邻格，没有邻格的那一边才画亮边或暗边。
 */
function edges(ch) {
  const cells = glyphCells(ch)
  const has = new Set(cells.map(([x, y]) => `${x},${y}`))
  const on = (x, y) => has.has(`${x},${y}`)
  let light = ''
  let dark = ''
  for (const [x, y] of cells) {
    if (!on(x, y - 1)) light += `M${x} ${y}h1v0.2h-1z`
    if (!on(x - 1, y)) light += `M${x} ${y}h0.16v1h-0.16z`
    if (!on(x, y + 1)) dark += `M${x} ${y + 0.8}h1v0.2h-1z`
    if (!on(x + 1, y)) dark += `M${x + 0.84} ${y}h0.16v1h-0.16z`
  }
  return { light, dark }
}

const letters = computed(() =>
  layout.value.letters.map((l, i) => ({ ...l, i, ...edges(l.ch) })),
)

// 当前进度在每个字母内部对应的填充宽度（0~5 格）
function fillW(x) {
  return Math.max(0, Math.min(GLYPH_W, props.progress * totalW.value - x))
}

const vbW = computed(() => totalW.value + 2)
</script>

<template>
  <svg
    class="create-word"
    :viewBox="`-1 -1.2 ${vbW} ${GLYPH_H + 3.4}`"
    role="img"
    :aria-label="text"
  >
    <defs>
      <!-- 暗黄铜（未加载）：低饱和、偏暗 -->
      <linearGradient id="cw-dull" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b59a5c" />
        <stop offset="0.5" stop-color="#8f7440" />
        <stop offset="1" stop-color="#5f4824" />
      </linearGradient>
      <!-- 抛光黄铜（已加载）：浅黄 → 黄铜 → 橙棕 -->
      <linearGradient id="cw-brass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff4b8" />
        <stop offset="0.3" stop-color="#fcd25a" />
        <stop offset="0.68" stop-color="#e59a32" />
        <stop offset="1" stop-color="#b0611f" />
      </linearGradient>
      <linearGradient id="cw-shimmer" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0" />
        <stop offset="0.7" stop-color="#fffbe6" stop-opacity="0.95" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <filter id="cw-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="0.6" />
      </filter>
      <clipPath v-for="l in letters" :id="`cw-shape-${l.i}`" :key="'s' + l.i">
        <path :d="l.d" />
      </clipPath>
      <clipPath v-for="l in letters" :id="`cw-prog-${l.i}`" :key="'p' + l.i">
        <rect x="-2" y="-2" :width="fillW(l.x) > 0 ? fillW(l.x) + 2 : 0" :height="GLYPH_H + 5" />
      </clipPath>
    </defs>

    <g v-for="l in letters" :key="l.i" :transform="`translate(${l.x} 0)`">
      <g class="float" :style="{ animationDelay: `${-l.i * 0.37}s` }">
        <!-- 金色外辉光（只在已加载部分出现） -->
        <g :clip-path="`url(#cw-prog-${l.i})`">
          <path :d="l.d" :transform="`translate(0 ${DY * DEPTH_LAYERS * 0.5})`" fill="#ffb43c" filter="url(#cw-glow)" opacity="0.7" />
        </g>
        <!-- 外描边：正面与每层厚度都加粗描边，合起来是一整块铸件的轮廓 -->
        <path
          v-for="k in DEPTH_LAYERS + 1"
          :key="'o' + k"
          :d="l.d"
          :transform="`translate(0 ${DY * (k - 1)})`"
          fill="none"
          :stroke="OUTLINE"
          :stroke-width="OUTLINE_W"
          stroke-linejoin="miter"
        />
        <!-- 底部厚度（先画最深的，再往上叠） -->
        <path
          v-for="k in DEPTH_LAYERS"
          :key="'d' + k"
          :d="l.d"
          :fill="SIDE[DEPTH_LAYERS - k]"
          :transform="`translate(0 ${DY * (DEPTH_LAYERS - k + 1)})`"
          shape-rendering="crispEdges"
        />
        <!-- 正面：未加载的暗黄铜 -->
        <path :d="l.d" fill="url(#cw-dull)" shape-rendering="crispEdges" />
        <path :d="l.light" fill="#e6d3a0" opacity="0.55" shape-rendering="crispEdges" />
        <path :d="l.dark" fill="#3e2c14" opacity="0.5" shape-rendering="crispEdges" />
        <!-- 正面：已加载的抛光黄铜（以字形为遮罩，宽度 = 进度） -->
        <g :clip-path="`url(#cw-shape-${l.i})`">
          <rect x="0" y="0" :width="fillW(l.x)" :height="GLYPH_H" fill="url(#cw-brass)" shape-rendering="crispEdges" />
          <rect
            v-if="fillW(l.x) > 0 && fillW(l.x) < GLYPH_W"
            :x="fillW(l.x) - 1.4"
            y="0"
            width="1.4"
            :height="GLYPH_H"
            fill="url(#cw-shimmer)"
          />
        </g>
        <g :clip-path="`url(#cw-prog-${l.i})`">
          <path :d="l.light" fill="#fffbe0" opacity="0.8" shape-rendering="crispEdges" />
          <path :d="l.dark" fill="#8a4512" opacity="0.6" shape-rendering="crispEdges" />
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.create-word {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.float {
  animation: float 3.2s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}
/* SVG 内 CSS transform 的 px 即 viewBox 单位（1 = 一个像素格） */
@keyframes float {
  0%, 100% { transform: translate(0, -0.4px) rotate(-1deg); }
  50% { transform: translate(0, 0.4px) rotate(1deg); }
}
@media (prefers-reduced-motion: reduce) {
  .float { animation: none; }
}
</style>
