<script setup>
/**
 * 文件用途：页面转场动画（第三轮：A 的收尾阶段延长到 3 秒，和 M 的入场一样全程缓入缓出）
 * 时间轴（秒，各段时长见下方 PHASE 常量，可直接改）：
 *  0.00–0.62  "M 形窗口"：黑幕上挖出一个 M 形的洞，洞里是上一页。M 从超大（整屏都在 M 的一格里）
 *             缩小、同时从 -90° 转到 0°，落到画面中央——黑幕从四周收拢，只能透过 M 看到上一页
 *  0.60–0.85  M 逐渐变成不透明的纯白字，0.86 时屏幕被完全盖住 → 切换页面（新页面在黑幕后挂载）
 *  0.86–1.46  M 向左移到单词首位；原本藏在 M 背后的 CREATOPIA 跟着展开到各自位置，拼成 MCREATOPIA
 *  1.46–2.46  整词停留 1 秒
 *  2.46–5.46  A 的收尾阶段，共 3 秒：
 *             2.46–3.66  A 缓缓左移到画面中央，MCREATOPI 同时往中间收拢、依次躲进 A 背后（1.2 秒）
 *             3.66–5.46  A 变成黑幕上的洞（A 形窗口），0°→90° 旋转并放大到铺满屏幕（1.8 秒），
 *                        第六轮：A 不再「瞬间」变成洞，而是白色像素字在前 0.7 秒里逐渐变透明，
 *                        透过越来越淡的白字慢慢露出新页面（PHASE.aFade 可调）；
 *                        旋转和放大都是缓入缓出：开始慢慢转、中间加速、快铺满时再慢下来
 * 实现：单个全屏 SVG。黑底 rect 使用 <mask>，mask 里的黑色 M / A 就是"洞"；
 *       字母变换统一为 translate(x,y) rotate(r) scale(e^ls·u) translate(-2.5,-3.5)：
 *       - 旋转/缩放中心固定在字母第 4 行中间那格（M、A 该格都有像素），放到极大时整屏恰好落在这一格里；
 *       - 缩放用对数值 ls 做补间，超大↔正常的缩放速度在视觉上是均匀的，配合 inOut 缓动才真正"缓入缓出"。
 *       绘制顺序：中间字母 → M → A，所以展开时字母从 M 背后出来，收拢时字母躲进 A 背后。
 */
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import gsap from 'gsap'
import { registerTransition } from '../composables/usePageTransition'
import { layoutWord } from '../pixel/path'

const WORD = 'MCREATOPIA'
const word = layoutWord(WORD) // 10 个字母，总宽 59 格
const LAST = word.letters.length - 1

const visible = ref(false)
const st = reactive({
  W: 1, H: 1, u: 10, left: 0,
  mHole: 0, // 1 = 黑幕上有 M 形洞
  mFill: 0, // M 白色实心的不透明度
  aHole: 0, // 1 = 末尾 A 变成黑幕上的洞
  aTop: 0, // 1 = A 叠在最上层（收拢阶段）
  aFill: 1, // A 白色字的不透明度：变成洞之后从 1 渐变到 0（白字 → 透明窗口）
  L: word.letters.map(() => ({ x: 0, y: 0, r: 0, ls: 0, o: 0 })),
})
// 绘制顺序（后画的在上面），像一叠卡片：
// 展开阶段左边压右边（M 最上），每个字母从左邻居底下滑出来；
// 收拢阶段右边压左边（A 最上），每个字母依次滑进右邻居底下，最后全部藏进 A
const LTR = word.letters.map((_, i) => i)
const RTL = [...LTR].reverse()
const order = computed(() => (st.aTop ? LTR : RTL))
function showLetter(i) {
  const l = st.L[i]
  if (!l.o) return false
  if (i === 0) return st.mFill > 0 // M 在变实心之前只是 mask 里的洞
  if (i === LAST) return !st.aHole || st.aFill > 0 // A 变成洞后，白字还要淡出一段时间
  return true
}

// 黑幕整体不透明度（只在"减少动态效果"模式下会变化）
const visibleBg = reactive({ o: 1 })
const M = () => st.L[0]
const A = () => st.L[LAST]

const T = (o) => `translate(${o.x} ${o.y}) rotate(${o.r}) scale(${Math.exp(o.ls) * st.u}) translate(-2.5 -3.5)`
const slotX = (i) => st.left + (word.letters[i].x + 2.5) * st.u

function measure() {
  st.W = window.innerWidth
  st.H = window.innerHeight
  st.u = Math.min((st.W * 0.82) / word.width, (st.H * 0.16) / 7)
  st.left = (st.W - word.width * st.u) / 2
}

// 各阶段时长（秒）。想整体加快/放慢，只改这里
const PHASE = {
  mIn: 0.62, // M 窗口飞入并落到中央
  expand: 0.6, // M 左移、其余字母从 M 背后展开
  hold: 1.0, // 整词停留
  collapse: 1.2, // A 左移到中央、其余字母躲进 A 背后
  reveal: 1.8, // A 窗口旋转 90° 并放大揭开新页面（collapse + reveal = 3 秒）
  aFade: 0.7, // reveal 开始后，A 的白色像素字用多久淡成透明（白字 → 透明遮罩）
}

let tl
function play({ onCovered, onComplete }) {
  measure()
  const { W, H, u } = st
  const cx = W / 2
  const cy = H / 2
  // 一格放大到超过屏幕对角线 2.4 倍 → 整屏都在这一格里
  const lsHuge = Math.log((Math.hypot(W, H) * 2.4) / u)
  const lsLand = Math.log(1.5) // M 落在中央时略大，左移时缩回 1
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  st.L.forEach((l) => Object.assign(l, { x: cx, y: cy, r: 0, ls: 0, o: 0 }))
  Object.assign(M(), { r: -90, ls: lsHuge, o: 1 })
  st.mHole = 1
  st.mFill = 0
  st.aHole = 0
  st.aTop = 0
  st.aFill = 1
  visible.value = true

  tl?.kill()
  tl = gsap.timeline({
    onComplete: () => {
      visible.value = false
      onComplete()
    },
  })
  // 仅开发环境：暴露时间轴，便于在控制台 seek 到任意时刻逐帧检查
  if (import.meta.env.DEV) window.__pageTransitionTl = tl

  if (reduce) {
    // 减少动态效果：只做 0.8s 黑场淡入淡出
    st.mHole = 0
    visibleBg.o = 0
    tl.to(visibleBg, { o: 1, duration: 0.3 })
      .call(onCovered)
      .to(visibleBg, { o: 0, duration: 0.4, delay: 0.1 })
    return
  }
  visibleBg.o = 1

  const rest = st.L.slice(0, LAST) // M + CREATOPI（收拢时要躲进 A 背后的那些）
  const others = st.L.slice(1) // CREATOPIA（展开时从 M 背后出来的那些）

  const tCover = 0.86 // M 完全变实心、屏幕被盖住的时刻
  const tHold = tCover + PHASE.expand
  const tCollapse = tHold + PHASE.hold
  const tReveal = tCollapse + PHASE.collapse

  tl
    // ① M 形窗口：超大 → 落到中央，-90° → 0°
    .to(M(), { ls: lsLand, r: 0, duration: PHASE.mIn, ease: 'power2.inOut' }, 0)
    // ② M 逐渐变实心，盖住整屏后切换页面
    .to(st, { mFill: 1, duration: 0.25, ease: 'sine.inOut' }, 0.6)
    .set(st, { mHole: 0 }, tCover)
    .set(others, { o: 1 }, tCover)
    .call(onCovered, null, tCover)
    // ③ M 左移，CREATOPIA 从 M 背后展开
    .to(M(), { x: slotX(0), ls: 0, duration: PHASE.expand, ease: 'power3.inOut' }, tCover)
  others.forEach((l, k) => {
    tl.to(l, { x: slotX(k + 1), duration: PHASE.expand, ease: 'power3.inOut' }, tCover)
  })
  tl
    // ④ 停留；⑤ A 缓缓左移到中央，其余字母同时收拢到 A 背后（缓入缓出）
    .set(st, { aTop: 1 }, tCollapse)
    .to(rest, { x: cx, duration: PHASE.collapse, ease: 'power2.inOut' }, tCollapse)
    .to(A(), { x: cx, duration: PHASE.collapse, ease: 'power2.inOut' }, tCollapse)
    .set(rest, { o: 0 }, tReveal)
    // ⑥ A 形窗口：旋转 90° 并放大，揭开新页面。
    //    缩放用对数值 ls 补间 + inOut 缓动：起步慢、中段快、快铺满屏幕时再慢下来（缓出）
    .set(st, { aHole: 1 }, tReveal)
    .to(st, { aFill: 0, duration: PHASE.aFade, ease: 'sine.inOut' }, tReveal)
    .to(A(), { r: 90, duration: PHASE.reveal, ease: 'power2.inOut' }, tReveal)
    .to(A(), { ls: lsHuge, duration: PHASE.reveal, ease: 'power3.inOut' }, tReveal)
}

let unregister
onMounted(() => {
  measure()
  unregister = registerTransition(play)
})
onBeforeUnmount(() => {
  unregister?.()
  tl?.kill()
})
</script>

<template>
  <div v-show="visible" class="page-transition" aria-hidden="true">
    <svg :width="st.W" :height="st.H" :viewBox="`0 0 ${st.W} ${st.H}`" shape-rendering="crispEdges">
      <defs>
        <mask id="pt-mask" maskUnits="userSpaceOnUse" x="0" y="0" :width="st.W" :height="st.H">
          <rect :width="st.W" :height="st.H" fill="#fff" />
          <path v-if="st.mHole" :d="word.letters[0].d" :transform="T(st.L[0])" fill="#000" />
          <path v-if="st.aHole" :d="word.letters[LAST].d" :transform="T(st.L[LAST])" fill="#000" />
        </mask>
      </defs>

      <rect :width="st.W" :height="st.H" fill="#000" :opacity="visibleBg.o" mask="url(#pt-mask)" />

      <!--
        每个字母 = 黑色底板（与背景同色，看不见）+ 白色字形，像一叠卡片：
        叠在下面的字母被上面字母的底板挡住，不会从镂空处透出来。
        叠放顺序：展开阶段 M 在最上（字母从 M 背后出来），收拢阶段 A 在最上（字母躲进 A 背后）。
      -->
      <template v-for="i in order" :key="i">
        <g v-if="showLetter(i)" :transform="T(st.L[i])">
          <!-- 黑色底板：A 变成洞之后去掉，否则会挡住洞里的新页面 -->
          <rect v-if="(i !== 0 || st.mFill >= 1) && !(i === LAST && st.aHole)" x="0" y="0" width="5" height="7" fill="#000" />
          <path :d="word.letters[i].d" fill="#fff" :opacity="i === 0 ? st.mFill : i === LAST ? st.aFill : 1" />
        </g>
      </template>
    </svg>
  </div>
</template>

<style scoped>
.page-transition {
  position: fixed;
  inset: 0;
  z-index: 1200; /* 高于首次加载页（1100），加载页 → 索引页也由它衔接 */
  pointer-events: all; /* 转场期间屏蔽点击，防止重复跳转 */
}
.page-transition svg {
  display: block;
}
</style>
