<script setup>
/**
 * 文件用途：主页面公告板——机械动力"翻牌显示器"风格的横向选项卡
 * 交互（第六轮：去掉顶部的选项卡，改成左右箭头）：
 *  - 鼠标移到公告板上，左右两侧淡入两个像素箭头，点击切到上一个 / 下一个（首尾循环）；
 *    触屏设备没有"悬停"，箭头一直半透明显示；只有 1 条公告时不显示箭头；
 *  - 每 10 秒自动切到下一个（最后一个之后回到第一个），手动切换后重新计时；
 *  - 鼠标在公告板上滚动滚轮也能切换：向下 = 下一个、向上 = 上一个；
 *    已经在第一个/最后一个时不拦截滚轮，页面照常上下滚动，不会"卡住"；
 *  - 内容：封面（翻牌图）+ 大标题 / 小标题（翻牌字）+ 跳转链接（有填才显示"前往"）。
 * 参数：items 公告数组；interval 自动切换间隔（毫秒）；preview 编辑页预览模式（不自动轮播）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import FlapText from './FlapText.vue'
import FlapImage from './FlapImage.vue'
import PixelText from '../PixelText.vue'

const props = defineProps({
  items: { type: Array, required: true },
  interval: { type: Number, default: 10000 },
  preview: { type: Boolean, default: false },
  modelValue: { type: Number, default: null }, // 编辑页可以从外部指定当前显示第几个
})
const emit = defineEmits(['update:modelValue'])
const router = useRouter()

const index = ref(0)
const current = computed(() => props.items[Math.min(index.value, props.items.length - 1)] || null)
const isExternal = (link) => /^https?:\/\//.test(link)

let timer
function restart() {
  clearInterval(timer)
  if (props.preview || props.items.length < 2) return
  timer = setInterval(() => go(index.value + 1, true), props.interval)
}

function go(i, wrap = false) {
  const n = props.items.length
  if (!n) return
  const next = wrap ? (i + n) % n : Math.max(0, Math.min(n - 1, i))
  if (next === index.value) return
  index.value = next
  emit('update:modelValue', next)
  restart()
}

watch(() => props.modelValue, (v) => v != null && v !== index.value && (index.value = v))
watch(() => props.items.length, (n) => index.value >= n && (index.value = Math.max(0, n - 1)))

// 滚轮：累计到阈值才翻一页，并有冷却时间，触控板惯性不会一下翻过好几页
let acc = 0
let cool = 0
function onWheel(e) {
  const dir = Math.sign(e.deltaY)
  const atEdge = (dir > 0 && index.value >= props.items.length - 1) || (dir < 0 && index.value <= 0)
  if (atEdge || !dir) return // 到头了：不拦截，让页面继续滚动
  e.preventDefault()
  const now = performance.now()
  if (now < cool) return
  acc += e.deltaY
  if (Math.abs(acc) >= 40) {
    go(index.value + dir)
    acc = 0
    cool = now + 650
  }
}

function open() {
  const link = current.value?.link
  if (!link || props.preview) return
  if (isExternal(link)) window.open(link, '_blank', 'noopener')
  else router.push(link)
}

const boardRef = ref(null)
onMounted(() => {
  // wheel 监听要设成非 passive 才能 preventDefault
  boardRef.value?.addEventListener('wheel', onWheel, { passive: false })
  restart()
})
onBeforeUnmount(() => {
  clearInterval(timer)
  boardRef.value?.removeEventListener('wheel', onWheel)
})
watch(() => [props.items.length, props.preview], restart)
</script>

<template>
  <div ref="boardRef" class="flap-board">
    <!-- 显示屏 -->
    <div v-if="current" class="screen" role="region" aria-roledescription="公告轮播" :aria-label="`公告 ${index + 1} / ${items.length}`">
      <FlapImage class="cover" :src="current.cover" />
      <div class="copy">
        <FlapText class="title" :text="current.title || ' '" :size="38" />
        <FlapText v-if="current.subtitle" class="subtitle" :text="current.subtitle" :size="18" />
        <button v-if="current.link" type="button" class="mc-btn go" @click="open">
          <PixelText text="前往 →" :px="2" />
        </button>
      </div>
      <!-- 显示屏四角的螺丝 -->
      <i class="screw a" /><i class="screw b" /><i class="screw c" /><i class="screw d" />

      <!-- 左右切换箭头：鼠标靠近公告板时淡入 -->
      <template v-if="items.length > 1">
        <button type="button" class="arrow prev" aria-label="上一条公告" @click="go(index - 1, true)">
          <svg viewBox="0 0 6 10" shape-rendering="crispEdges" aria-hidden="true">
            <path d="M4 0h2v2h-2zM2 2h2v2h-2zM0 4h2v2h-2zM2 6h2v2h-2zM4 8h2v2h-2z" fill="currentColor" />
          </svg>
        </button>
        <button type="button" class="arrow next" aria-label="下一条公告" @click="go(index + 1, true)">
          <svg viewBox="0 0 6 10" shape-rendering="crispEdges" aria-hidden="true">
            <path d="M0 0h2v2h-2zM2 2h2v2h-2zM4 4h2v2h-2zM2 6h2v2h-2zM0 8h2v2h-2z" fill="currentColor" />
          </svg>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.flap-board {
  width: 100%;
}
/* 左右箭头：平时透明，鼠标移到公告板上时从两侧淡入并轻微滑入 */
.arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 44px;
  height: 64px;
  padding: 0;
  border: 0;
  color: #fff;
  background: rgba(20, 13, 7, 0.55);
  box-shadow: 0 0 0 2px var(--outline), inset 2px 2px 0 rgba(255, 255, 255, 0.08);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.25s ease-out, transform 0.25s ease-out, background 0.2s, color 0.2s;
}
.arrow svg {
  width: 12px;
  height: 20px;
}
.arrow.prev {
  left: 10px;
  transform: translate(-8px, -50%);
}
.arrow.next {
  right: 10px;
  transform: translate(8px, -50%);
}
.flap-board:hover .arrow,
.arrow:focus-visible {
  opacity: 1;
  transform: translate(0, -50%);
}
.arrow:hover {
  color: #3a2208;
  background: var(--brass);
}
/* 触屏设备没有悬停：箭头一直半透明显示 */
@media (hover: none) {
  .arrow {
    opacity: 0.7;
    transform: translate(0, -50%);
  }
}
/* 显示屏：安山机壳外框 + 黑色翻牌区 */
.screen {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: clamp(18px, 3vw, 36px);
  align-items: center;
  padding: clamp(18px, 3vw, 32px);
  background: linear-gradient(180deg, #2e2f33, #232428);
  box-shadow: 0 0 0 3px var(--outline), inset 3px 3px 0 #4a4b50, inset -3px -3px 0 #141417, 0 20px 40px rgba(0, 0, 0, 0.5);
}
.copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}
.go { margin-top: 8px; }
.screw {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #6b6c71;
  box-shadow: inset 2px 2px 0 #9a9ba0, 0 0 0 1px #111;
}
.screw.a { top: 8px; left: 8px; }
.screw.b { top: 8px; right: 8px; }
.screw.c { bottom: 8px; left: 8px; }
.screw.d { bottom: 8px; right: 8px; }
@media (max-width: 760px) {
  .screen { grid-template-columns: 1fr; }
  .title { --fs: 22px !important; }
}
</style>
