<script setup>
/**
 * 文件用途：翻牌显示器的一行字（模仿机械动力"翻牌显示器"的分瓣翻页效果）
 * 每个字是一个"翻牌格"，上下两半：
 *   - 换字时，旧字的上半片向下翻倒（0° → -90°），新字的下半片接着翻下来（90° → 0°）；
 *   - 每个格子先随机翻过 2~4 个过渡字再停在目标字上，并且从左到右依次错开，
 *     看起来就像一排机械翻牌在"哗啦啦"地翻。
 * 参数：text 要显示的文字；size 字号（px）。
 */
import { onBeforeUnmount, reactive, watch } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  size: { type: Number, default: 28 },
})

const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CJK = '机械动力齿轮黄铜安山传动蒸汽列车公告更新活动'
// 宽字符（中日韩文字、全角符号）占两格宽；半角片假名除外。用转义写法，源码里不出现特殊字符
const isWide = (ch) => /[\u2E80-\uFFEF]/.test(ch) && !/[\uFF61-\uFF9F]/.test(ch)

const cells = reactive([]) // { cur, prev, n（每翻一次 +1，用来重启 CSS 动画） }
let timers = []

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function flipTo(cell, ch) {
  cell.prev = cell.cur
  cell.cur = ch
  cell.n++
}

watch(
  () => props.text,
  (text) => {
    clearTimers()
    const chars = [...text]
    // 长度变化时先补齐/截断格子（新增的格子从空白开始翻）
    while (cells.length < chars.length) cells.push({ cur: ' ', prev: ' ', n: 0 })
    cells.splice(chars.length)
    chars.forEach((ch, i) => {
      const cell = cells[i]
      if (cell.cur === ch) return
      const pool = isWide(ch) ? CJK : LATIN
      const steps = ch === ' ' ? 0 : 2 + Math.floor(Math.random() * 3)
      for (let s = 0; s <= steps; s++) {
        const next = s === steps ? ch : pool[Math.floor(Math.random() * pool.length)]
        timers.push(setTimeout(() => flipTo(cell, next), i * 28 + s * 90))
      }
    })
  },
  { immediate: true },
)

onBeforeUnmount(clearTimers)
</script>

<template>
  <span class="flap-text" :style="{ '--fs': `${size}px` }" :aria-label="text" role="text">
    <span v-for="(c, i) in cells" :key="i" class="cell" :class="{ wide: isWide(c.cur), space: c.cur === ' ' }" aria-hidden="true">
      <span class="half top"><span>{{ c.cur }}</span></span>
      <span class="half bottom"><span>{{ c.prev }}</span></span>
      <template v-if="c.n">
        <span :key="'t' + c.n" class="half top flap-top"><span>{{ c.prev }}</span></span>
        <span :key="'b' + c.n" class="half bottom flap-bottom"><span>{{ c.cur }}</span></span>
      </template>
    </span>
  </span>
</template>

<style scoped>
.flap-text {
  display: inline-flex;
  flex-wrap: wrap;
  gap: calc(var(--fs) * 0.12) calc(var(--fs) * 0.08);
  font-family: var(--font-ui);
  font-size: var(--fs);
  line-height: 1;
}
.cell {
  position: relative;
  display: inline-block;
  width: 0.72em;
  height: 1.3em;
  perspective: 4em;
  background: #101012;
  box-shadow: 0 0 0 1px #000, inset 0 0 0 1px #2a2a2e;
}
.cell.wide { width: 1.18em; }
.cell.space { width: 0.5em; }
.half {
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  overflow: hidden;
  background: #1a1a1d;
  color: #f4f1e6;
}
.half > span {
  position: absolute;
  left: 0;
  right: 0;
  height: 1.3em;
  line-height: 1.3em;
  text-align: center;
}
.top {
  top: 0;
  transform-origin: 50% 100%;
}
.top > span { top: 0; }
.bottom {
  bottom: 0;
  transform-origin: 50% 0;
  background: #141416;
}
.bottom > span { bottom: 0; }
/* 中间的分割缝 */
.cell::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: calc(50% - 1px);
  height: 2px;
  background: #000;
  z-index: 3;
}
.flap-top {
  z-index: 2;
  animation: flap-top 90ms ease-in forwards;
}
.flap-bottom {
  z-index: 2;
  transform: rotateX(90deg);
  animation: flap-bottom 90ms ease-out 45ms forwards;
}
@keyframes flap-top {
  to { transform: rotateX(-90deg); }
}
@keyframes flap-bottom {
  to { transform: rotateX(0deg); }
}
@media (prefers-reduced-motion: reduce) {
  .flap-top, .flap-bottom { animation-duration: 1ms; }
}
</style>
