<script setup>
/**
 * 文件用途：预览页自定义光标组件
 * 作用：桌面端（精细指针）用铜黄「外环 + 内点」替换默认光标；外环带延迟跟随，
 *       悬停在可交互元素上时外环放大、按下时收缩，增强工业交互手感。
 *       触屏设备或「减少动态效果」用户不启用，回退系统光标，保证可用性。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

// 作用：是否启用自定义光标（仅精细指针 + 非减少动效）。
const enabled =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

const ringEl = ref(null)
const dotEl = ref(null)

let raf = 0
// 作用：目标坐标（鼠标实时位置）与当前坐标（外环平滑跟随的位置）。
let targetX = 0
let targetY = 0
let curX = 0
let curY = 0

// 作用：可交互元素选择器——悬停到这些元素时光标环放大。
const INTERACTIVE = 'a, button, summary, input, textarea, select, [data-cursor-hover]'

function onMove(e) {
  targetX = e.clientX
  targetY = e.clientY
  if (dotEl.value) {
    dotEl.value.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
  }
}

// 作用：外环用线性插值缓慢跟随，形成拖尾感；内点即时跟随。
function loop() {
  curX += (targetX - curX) * 0.18
  curY += (targetY - curY) * 0.18
  if (ringEl.value) {
    ringEl.value.style.transform = `translate3d(${curX}px, ${curY}px, 0)`
  }
  raf = requestAnimationFrame(loop)
}

function setState(cls, on) {
  if (!ringEl.value) return
  ringEl.value.classList.toggle(cls, on)
}

function onOver(e) {
  if (e.target instanceof Element && e.target.closest(INTERACTIVE)) setState('is-active', true)
}

function onOut(e) {
  if (e.target instanceof Element && e.target.closest(INTERACTIVE)) setState('is-active', false)
}

function onDown() {
  setState('is-down', true)
}
function onUp() {
  setState('is-down', false)
}

onMounted(() => {
  if (!enabled) return
  // 原因：启用自定义光标时隐藏系统光标（输入框保留文本光标），避免两套光标叠加。
  document.documentElement.classList.add('has-custom-cursor')
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerover', onOver, true)
  window.addEventListener('pointerout', onOut, true)
  window.addEventListener('pointerdown', onDown, { passive: true })
  window.addEventListener('pointerup', onUp, { passive: true })
  raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  if (!enabled) return
  document.documentElement.classList.remove('has-custom-cursor')
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerover', onOver, true)
  window.removeEventListener('pointerout', onOut, true)
  window.removeEventListener('pointerdown', onDown)
  window.removeEventListener('pointerup', onUp)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <!-- 作用：仅桌面精细指针下渲染自定义光标，触屏/减少动效时不渲染。 -->
  <template v-if="enabled">
    <div
      ref="ringEl"
      class="preview-cursor-ring"
      aria-hidden="true"
    />
    <div
      ref="dotEl"
      class="preview-cursor-dot"
      aria-hidden="true"
    />
  </template>
</template>

<style scoped>
/* 作用：外环——铜黄描边圆圈，带延迟跟随与状态过渡。 */
.preview-cursor-ring {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2000;
  width: 34px;
  height: 34px;
  margin: -17px 0 0 -17px;
  border: 1.5px solid var(--preview-accent);
  border-radius: 50%;
  pointer-events: none;
  transition: width 0.18s ease, height 0.18s ease, margin 0.18s ease,
    background 0.18s ease, opacity 0.18s ease, border-color 0.18s ease;
  opacity: 0.75;
}

/* 作用：内点——铜黄实心小点，即时跟随鼠标。 */
.preview-cursor-dot {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2001;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: var(--preview-accent);
  pointer-events: none;
}

/* 作用：悬停可交互元素时外环放大并填充半透明铜黄。 */
.preview-cursor-ring.is-active {
  width: 54px;
  height: 54px;
  margin: -27px 0 0 -27px;
  background: color-mix(in srgb, var(--preview-accent) 14%, transparent);
  opacity: 1;
}

/* 作用：按下时外环收缩，反馈点击。 */
.preview-cursor-ring.is-down {
  width: 22px;
  height: 22px;
  margin: -11px 0 0 -11px;
}
</style>
