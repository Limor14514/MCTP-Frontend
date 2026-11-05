<script setup>
/**
 * 文件用途：加载页的"立体白色岩石像素字"（LOADING）+ 金色光芒进度
 * 结构（每个字母一个 <g>，由外到内）：
 *  1. 外层 g：用 transform 属性定位字母的 x；
 *  2. 内层 g.float：CSS 动画上下漂浮（每个字母错开相位，看起来"飘着"）；
 *  3. 侧面挤出：同一字形向右下方偏移叠 6 层，由浅到深，形成方块的厚度（立体感）；
 *  4. 正面：浅灰白岩石纹理（SVG pattern 随机灰阶小格，像方块贴图）；
 *  5. 倒角：每格左上亮边、右下暗边，让每个像素读起来像一块独立的方块；
 *  6. 金光：以字形为 clipPath（像素字作为遮罩），里面是金色渐变矩形，
 *     矩形宽度 = 进度，从左到右推进；前沿再叠一道亮白高光带。外侧另有模糊金色辉光层。
 * 参数：text 文字（默认 LOADING）；progress 0~1。
 */
import { computed } from 'vue'
import { layoutWord } from '../pixel/path'
import { glyphCells, GLYPH_W, GLYPH_H } from '../pixel/glyphs'

const props = defineProps({
  text: { type: String, default: 'LOADING' },
  progress: { type: Number, default: 0 },
})

// 挤出方向：接近正下方、略偏右——模仿 Minecraft Title 插件"从下方仰视"的厚底效果
const DEPTH_LAYERS = 7
const DX = 0.02
const DY = 0.16
// 底面颜色：由靠近正面的灰到最深处的暗灰（比正面暗很多，厚度更明显）
const SIDE = ['#9a9a95', '#8b8b86', '#7d7d78', '#6f6f6b', '#62625e', '#555552', '#494946']

const layout = computed(() => layoutWord(props.text))
const totalW = computed(() => layout.value.width)

// 倒角条：每格上/左 0.12 宽的亮边，下/右的暗边
function bevel(ch, side) {
  const t = 0.12
  let d = ''
  for (const [x, y] of glyphCells(ch)) {
    d += side === 'light'
      ? `M${x} ${y}h1v${t}h-1zM${x} ${y}h${t}v1h-${t}z`
      : `M${x} ${y + 1 - t}h1v${t}h-1zM${x + 1 - t} ${y}h${t}v1h-${t}z`
  }
  return d
}

const letters = computed(() =>
  layout.value.letters.map((l, i) => ({
    ...l,
    i,
    light: bevel(l.ch, 'light'),
    dark: bevel(l.ch, 'dark'),
  })),
)

// 当前进度在每个字母内部对应的填充宽度（0~5 格）
function fillW(x) {
  return Math.max(0, Math.min(GLYPH_W, props.progress * totalW.value - x))
}

// 岩石纹理：确定性伪随机（每次刷新纹理一致），8×8 小格，浅灰白色系
const stoneCells = (() => {
  const palette = ['#e4e4df', '#d6d6d0', '#cbcbc5', '#dededa', '#c2c2bc', '#ededea']
  let s = 7
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const cells = []
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) cells.push({ x: x / 4, y: y / 4, c: palette[Math.floor(rnd() * palette.length)] })
  return cells
})()

const vbW = computed(() => totalW.value + 1.6)
</script>

<template>
  <svg
    class="stone-word"
    :viewBox="`-0.6 -1.2 ${vbW} ${GLYPH_H + 3.4}`"
    shape-rendering="crispEdges"
    role="img"
    :aria-label="text"
  >
    <defs>
      <pattern id="stone-tex" patternUnits="userSpaceOnUse" width="2" height="2">
        <rect v-for="(c, k) in stoneCells" :key="k" :x="c.x" :y="c.y" width="0.25" height="0.25" :fill="c.c" />
      </pattern>
      <linearGradient id="gold-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff3b0" />
        <stop offset="0.45" stop-color="#ffc93c" />
        <stop offset="1" stop-color="#d48a0c" />
      </linearGradient>
      <linearGradient id="gold-shimmer" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0" />
        <stop offset="0.7" stop-color="#fffbe6" stop-opacity="0.95" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="0.55" />
      </filter>
      <clipPath v-for="l in letters" :id="`shape-${l.i}`" :key="'s' + l.i">
        <path :d="l.d" />
      </clipPath>
      <clipPath v-for="l in letters" :id="`prog-${l.i}`" :key="'p' + l.i">
        <rect x="-2" y="-2" :width="fillW(l.x) > 0 ? fillW(l.x) + 2 : 0" :height="GLYPH_H + 4" />
      </clipPath>
    </defs>

    <g v-for="l in letters" :key="l.i" :transform="`translate(${l.x} 0)`">
      <g class="float" :style="{ animationDelay: `${-l.i * 0.37}s` }">
        <!-- 侧面挤出（先画最深的，再往前叠） -->
        <path
          v-for="k in DEPTH_LAYERS"
          :key="k"
          :d="l.d"
          :fill="SIDE[DEPTH_LAYERS - k]"
          :transform="`translate(${DX * (DEPTH_LAYERS - k + 1)} ${DY * (DEPTH_LAYERS - k + 1)})`"
        />
        <!-- 正面岩石纹理 + 倒角 -->
        <path :d="l.d" fill="url(#stone-tex)" />
        <path :d="l.light" fill="#ffffff" opacity="0.55" />
        <path :d="l.dark" fill="#8a8a84" opacity="0.7" />
        <!-- 金光：外侧辉光（只受进度裁切） -->
        <g :clip-path="`url(#prog-${l.i})`" class="glow">
          <path :d="l.d" fill="#ffc93c" filter="url(#gold-glow)" opacity="0.75" />
        </g>
        <!-- 金光：字形内部（以像素字为遮罩） -->
        <g :clip-path="`url(#shape-${l.i})`">
          <rect x="0" y="0" :width="fillW(l.x)" :height="GLYPH_H" fill="url(#gold-fill)" />
          <rect
            v-if="fillW(l.x) > 0 && fillW(l.x) < GLYPH_W"
            :x="fillW(l.x) - 1.4"
            y="0"
            width="1.4"
            :height="GLYPH_H"
            fill="url(#gold-shimmer)"
          />
        </g>
        <!-- 金色区域上的倒角保留，让金色仍像方块 -->
        <g :clip-path="`url(#prog-${l.i})`">
          <path :d="l.light" fill="#fffbe0" opacity="0.6" />
          <path :d="l.dark" fill="#9c5f00" opacity="0.55" />
        </g>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.stone-word {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.float {
  animation: float 3.2s ease-in-out infinite;
  /* 以字母自身包围盒中心为旋转原点，左右轻摆不会"甩"出位置 */
  transform-box: fill-box;
  transform-origin: center;
}
/* SVG 内 CSS transform 的 px 即 viewBox 单位（1 = 一个像素格） */
@keyframes float {
  0%, 100% { transform: translate(0, -0.45px) rotate(-1.2deg); }
  50% { transform: translate(0, 0.45px) rotate(1.2deg); }
}
.glow {
  mix-blend-mode: screen;
}
@media (prefers-reduced-motion: reduce) {
  .float { animation: none; }
}
</style>
