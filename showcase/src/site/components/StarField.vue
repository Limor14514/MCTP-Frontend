<script setup>
/**
 * 文件用途：加载页的星空背景（canvas）
 * 作用：
 *  1. 按屏幕面积随机撒星星（密度固定，大屏小屏观感一致）；
 *  2. 约 8% 的星星会周期性闪烁并带白色光晕（"少量白光闪烁"）；
 *  3. 鼠标 / 手指靠近时，星星被推到以指针为圆心、半径 R 的圆外，指针离开后弹回原位，
 *     实现"鼠标碰不到星星"。推开距离按"星星原位到指针的距离"计算，所以不会抖动。
 * 性能：只用一个 canvas + requestAnimationFrame；页面隐藏或组件卸载时停止。
 */
import { onMounted, onBeforeUnmount, ref } from 'vue'

const canvasRef = ref(null)
const AVOID_R = 120 // 躲避半径（CSS px）
const DENSITY = 1 / 2600 // 每 2600 平方像素一颗星

let ctx, raf, w, h, dpr
let stars = []
const pointer = { x: -9999, y: -9999 }

function seed() {
  const n = Math.round(w * h * DENSITY)
  stars = Array.from({ length: n }, () => {
    const hx = Math.random() * w
    const hy = Math.random() * h
    const twinkle = Math.random() < 0.08
    return {
      hx, hy, x: hx, y: hy,
      r: twinkle ? 1 + Math.random() * 0.9 : 0.35 + Math.random() * 0.9,
      a: 0.35 + Math.random() * 0.55,
      twinkle,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.6,
    }
  })
}

function resize() {
  const c = canvasRef.value
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = window.innerWidth
  h = window.innerHeight
  c.width = w * dpr
  c.height = h * dpr
  c.style.width = w + 'px'
  c.style.height = h + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  seed()
}

function frame(t) {
  ctx.clearRect(0, 0, w, h)
  const time = t / 1000
  for (const s of stars) {
    // 躲避：以星星"原位"到指针的向量为方向，把目标位置推到圆外
    const dx = s.hx - pointer.x
    const dy = s.hy - pointer.y
    const d = Math.hypot(dx, dy)
    let tx = s.hx, ty = s.hy
    if (d < AVOID_R) {
      const k = d < 0.001 ? 1 : 1 / d
      const ex = d < 0.001 ? 1 : dx * k
      const ey = d < 0.001 ? 0 : dy * k
      tx = pointer.x + ex * (AVOID_R + 4)
      ty = pointer.y + ey * (AVOID_R + 4)
    }
    // 缓动跟随：推开快（0.35），回位慢（0.06），手感更像"被吓跑再慢慢回来"
    const ease = d < AVOID_R ? 0.35 : 0.06
    s.x += (tx - s.x) * ease
    s.y += (ty - s.y) * ease

    let alpha = s.a
    if (s.twinkle) {
      const pulse = (Math.sin(time * s.speed + s.phase) + 1) / 2 // 0~1
      alpha = 0.35 + pulse * 0.65
      // 光晕：径向渐变，峰值时半径最大
      const glowR = s.r * (3 + pulse * 6)
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR)
      g.addColorStop(0, `rgba(255,255,255,${0.55 * pulse})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
  raf = requestAnimationFrame(frame)
}

function onMove(e) {
  pointer.x = e.clientX
  pointer.y = e.clientY
}
function onLeave() {
  pointer.x = pointer.y = -9999
}
// 触屏抬手后指针"消失"，星星回位；鼠标抬起不处理（鼠标仍在画面上）
function onUp(e) {
  if (e.pointerType !== 'mouse') onLeave()
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onMove, { passive: true })
  window.addEventListener('pointerup', onUp)
  document.addEventListener('pointerleave', onLeave)
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerdown', onMove)
  window.removeEventListener('pointerup', onUp)
  document.removeEventListener('pointerleave', onLeave)
})
</script>

<template>
  <canvas ref="canvasRef" class="star-field" aria-hidden="true" />
</template>

<style scoped>
.star-field {
  position: absolute;
  inset: 0;
  display: block;
}
</style>
