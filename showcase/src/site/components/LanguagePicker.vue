<script setup>
/**
 * 文件用途：导航栏的语言选择器（时钟左边的白色像素字 "Language"）
 * 交互：
 *  - 平时 50% 透明，鼠标移上去（或键盘聚焦）恢复不透明；
 *  - 点击后在下方展开一个"横轴翻页"的 3D 滚筒：没有背景，只有一行行不同语言的"Language"，
 *    展开时每一行像书页一样从上往下依次翻下来；
 *  - 鼠标滚轮 / 手指上下拖动 / 键盘 ↑↓ 滚动，所有行排在一个绕水平轴的圆柱面上，
 *    越往上下越倾斜、越暗，滚动时上下的字都带立体翻转（像横着翻开的书页）；
 *  - 点击某一行即切换到该语言并收起；点外面或按 Esc 收起。
 * 与全屏分段滑动的关系：滚筒带 data-fp-ignore，并在滚轮/按键事件里阻止冒泡，
 *   在滚筒上滚动不会让索引页切段。
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import gsap from 'gsap'
import PixelText from './PixelText.vue'
import { LANGS, locale, setLocale } from '../i18n'

const ITEM_H = 34 // 每一行的高度（px）
const STEP = 18 // 相邻两行在圆柱面上相差的角度（度）
const R = ITEM_H / 2 / Math.tan(((STEP / 2) * Math.PI) / 180) // 圆柱半径：让相邻行刚好首尾相接
const FOLD = 96 // 收起状态：每一行翻到上方背面（度）

const rootRef = ref(null)
const drumRef = ref(null)
const isOpen = ref(false)
const st = reactive({ pos: 0, open: 0 }) // pos：当前滚到第几行（可为小数）；open：展开进度 0~1
let target = 0

const currentIndex = computed(() => Math.max(0, LANGS.findIndex((l) => l.code === locale.value)))
const center = computed(() => Math.round(st.pos))

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const easeOut = (k) => 1 - Math.pow(1 - k, 3)

/** 作用：计算第 k 行在圆柱面上的角度、透明度（含"从上往下翻下来"的展开动画） */
function itemStyle(k) {
  const d = k - st.pos
  const base = -d * STEP // 正角度 = 往上翻
  // 展开动画：从上到下依次翻下来；rank 是该行在可见区域里从上往下的序号
  const rank = clamp(d + 5, 0, 10)
  const e = easeOut(clamp(st.open * 1.8 - rank * 0.1, 0, 1))
  const ang = FOLD + (base - FOLD) * e
  if (Math.abs(ang) > 92) return { display: 'none' }
  const fade = Math.pow(Math.max(0, Math.cos((ang * Math.PI) / 180)), 1.1)
  return {
    transform: `translate(-50%, -50%) rotateX(${ang}deg) translateZ(${R}px)`,
    opacity: (fade * e).toFixed(3),
  }
}

function animatePos(to, duration = 0.55) {
  target = clamp(to, 0, LANGS.length - 1)
  gsap.to(st, { pos: target, duration, ease: 'power3.out', overwrite: 'auto' })
}

function open() {
  if (isOpen.value) return
  st.pos = target = currentIndex.value
  isOpen.value = true
  gsap.fromTo(st, { open: 0 }, { open: 1, duration: 0.75, ease: 'none', overwrite: 'auto' })
  document.addEventListener('pointerdown', onOutside, true)
  nextTick(() => drumRef.value?.focus({ preventScroll: true }))
}

function close() {
  if (!isOpen.value) return
  document.removeEventListener('pointerdown', onOutside, true)
  gsap.to(st, {
    open: 0,
    duration: 0.45,
    ease: 'none',
    overwrite: 'auto',
    onComplete: () => (isOpen.value = false),
  })
}

function toggle() {
  isOpen.value && st.open > 0.5 ? close() : open()
}

function choose(k) {
  if (dragMoved) return
  animatePos(k, 0.35)
  setLocale(LANGS[k].code)
  setTimeout(close, 380)
}

function onOutside(e) {
  if (!rootRef.value?.contains(e.target)) close()
}

// ---------- 滚轮：累计到一定量才翻一行，触控板的细碎滚动也不会一下翻过头 ----------
let wheelAcc = 0
function onWheel(e) {
  e.preventDefault()
  e.stopPropagation()
  const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY
  wheelAcc += dy
  const steps = Math.trunc(wheelAcc / 48)
  if (steps) {
    wheelAcc -= steps * 48
    animatePos(target + steps)
  }
}

// ---------- 拖动（手机端用手指上下拨动） ----------
let dragStartY = 0
let dragStartPos = 0
let dragging = false
let dragMoved = false
function onPointerDown(e) {
  dragging = true
  dragMoved = false
  dragStartY = e.clientY
  dragStartPos = st.pos
  gsap.killTweensOf(st, 'pos')
}
function onPointerMove(e) {
  if (!dragging) return
  const dy = e.clientY - dragStartY
  if (Math.abs(dy) > 4 && !dragMoved) {
    dragMoved = true
    drumRef.value?.setPointerCapture?.(e.pointerId)
  }
  if (dragMoved) st.pos = clamp(dragStartPos - dy / ITEM_H, -0.4, LANGS.length - 0.6)
}
function onPointerUp() {
  if (!dragging) return
  dragging = false
  if (dragMoved) {
    animatePos(Math.round(st.pos), 0.4)
    setTimeout(() => (dragMoved = false), 0) // 让本次松手不被当成"点击某一行"
  }
}

function onKey(e) {
  const map = { ArrowDown: 1, ArrowUp: -1 }
  if (e.key in map) {
    e.preventDefault()
    e.stopPropagation()
    animatePos(target + map[e.key])
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    e.stopPropagation()
    choose(Math.round(target))
  } else if (e.key === 'Escape') {
    e.stopPropagation()
    close()
  } else if (['PageUp', 'PageDown'].includes(e.key)) {
    e.stopPropagation() // 滚筒聚焦时，翻页键不触发索引页切段
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside, true)
  gsap.killTweensOf(st)
})
</script>

<template>
  <div ref="rootRef" class="lang" :class="{ 'is-open': isOpen }">
    <button
      type="button"
      class="lang-btn"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      aria-label="Language"
      @click="toggle"
    >
      <PixelText text="Language" :px="2" />
    </button>

    <div
      v-if="isOpen"
      ref="drumRef"
      class="lang-drum"
      data-fp-ignore
      tabindex="-1"
      role="listbox"
      aria-label="Language"
      :style="{ height: `${R * 2 + ITEM_H}px` }"
      @wheel="onWheel"
      @keydown="onKey"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="drum-3d" :style="{ transform: `translateZ(${-R}px)` }">
        <button
          v-for="(l, k) in LANGS"
          :key="l.code"
          type="button"
          class="lang-item"
          :class="{ 'is-center': k === center, 'is-active': l.code === locale }"
          role="option"
          :aria-selected="l.code === locale"
          :lang="l.code"
          :title="l.name"
          :style="itemStyle(k)"
          @click="choose(k)"
        >
          <PixelText :text="l.word" :px="2" />
          <span class="code">{{ l.code.toUpperCase() }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lang {
  position: relative;
}
.lang-btn {
  display: block;
  padding: 4px 2px;
  border: 0;
  background: none;
  color: #fff;
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.25s;
}
.lang-btn:hover,
.lang-btn:focus-visible,
.is-open .lang-btn {
  opacity: 1;
}
.lang-btn:focus-visible {
  outline: 2px solid rgba(255, 201, 60, 0.7);
  outline-offset: 2px;
}
/* 滚筒：没有背景，只有字；透视让上下的行有立体翻转感 */
.lang-drum {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  width: 240px;
  transform: translateX(-50%);
  perspective: 520px;
  outline: none;
  touch-action: none;
  user-select: none;
  cursor: ns-resize;
}
.drum-3d {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}
.lang-item {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 6px;
  height: 34px;
  border: 0;
  background: none;
  color: #fff;
  white-space: nowrap;
  cursor: pointer;
  backface-visibility: hidden;
  /* 无背景时保证在亮色 3D 场景上也看得清：像素字外加一圈深色投影 */
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.55));
}
.lang-item.is-active {
  color: #fff3c4;
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.55)) drop-shadow(0 0 6px rgba(255, 201, 60, 0.75));
}
.lang-item:hover {
  color: #ffe9a3;
}
.code {
  font-family: var(--font-pixel);
  font-size: 11px;
  letter-spacing: 0.08em;
  opacity: 0.55;
}
</style>
