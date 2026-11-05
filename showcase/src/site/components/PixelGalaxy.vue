<script setup>
/**
 * 文件用途：加载页背景——像素银河 + 鼠标"水波"涟漪（第三轮改版：去掉"升温色带"，改成真正的水波）
 * 画面构成（全部按 CELL 像素网格量化，所以每个点都是方块像素）：
 *  1. 银河：一条斜穿画面的星带，用分形噪声 + 高斯带状密度生成星云，
 *     星云颜色量化成几档并加 Bayer 有序抖动，呈现像素画的颗粒质感；中段有暗色尘埃带，核心偏暖；
 *  2. 星星：大小不一——1 格、2×2 格、十字形 3×3 格三种，星带内更密；部分十字星缓慢闪烁；
 *  3. 水波（第四轮：只作用于星星）：画面下面"铺"着一层看不见的水面（二维波动方程的高度场），
 *     鼠标/手指划过就像划过水面，激起一圈圈缓慢扩散的波纹。
 *     星云背景保持静止、不再变亮变暗；只有星星像漂在水面上的粒子一样，被波纹推开、再荡回原位。
 *     缓入：鼠标注入的力先累积、再按 FORCE_DECAY 慢慢释放；缓出：DAMPING 让波纹慢慢平静；
 *     不要太快：WAVE_SPEED² 控制波传播速度（每帧约 0.4 格）。
 * 第六轮：星星改成"随波逐流"的粒子——
 *     · 没有鼠标时：每颗星都沿银河方向缓缓漂流（大星快、小星慢，有前后层次感），
 *       同时在垂直方向轻轻摆动，整条银河像在缓慢流动；漂出画面的星星从另一头再流进来，
 *       而且仍在原来那条"车道"上，所以银河的形状始终保持；
 *     · 鼠标划过时：星星被水波推开，同时被鼠标的划动方向"带走"一段（DRAG），
 *       不会弹回原位，而是带着惯性慢慢减速（FRICTION），再回到自由漂流；
 *       被推离银河太远的星星会极慢地回到原来的车道（LANE_RETURN）。
 * 性能：整张图只在 (屏宽/CELL)×(屏高/CELL) 的小画布上逐格计算，再无平滑放大到全屏，
 *       1080p 下约 5.8 万格，每帧计算量很小；组件卸载即停止。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref(null)

// ---------- 水波参数（想调手感改这里） ----------
const WAVE_SPEED2 = 0.16 // 波速的平方（≤0.5 保证稳定）；越小扩散越慢
const DAMPING = 0.988 // 每帧保留的能量；越接近 1 波纹存在越久（缓出）
const FORCE = 1.25 // 鼠标每移动 1 格注入的力
const FORCE_RADIUS = 3 // 鼠标激起波纹的半径（格）
const FORCE_DECAY = 0.86 // 注入的力每帧释放的比例（越大越"缓入"）
// ---------- 星星运动参数（第六轮） ----------
const FLOW = 0.035 // 自由漂流的基础速度（格/帧，约每秒 12 屏幕像素）；每颗星在此基础上随机快慢
const WANDER = 0.012 // 自由漂流时垂直方向的轻微摆动
const WAVE_PUSH = 0.35 // 水面坡度 → 星星加速度（被波纹推开）
const DRAG = 0.1 // 鼠标划动把附近星星"带走"的强度
const DRAG_RADIUS = 9 // 鼠标带动星星的范围（格）
const FRICTION = 0.955 // 被推动后额外速度每帧保留的比例（越小越快恢复自由漂流）
const MAX_SPEED = 1.6 // 额外速度上限（格/帧），甩得再快星星也不会"瞬移"
const LANE_RETURN = 0.0015 // 偏离原来车道的星星回到银河的速度

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.5)

let ctx, off, offCtx, img, raf
let W, H, CELL, gw, gh
let base // Uint8ClampedArray：静态星云底图（不含星星，不受水波影响）
let hCur, hPrev, force // Float32Array：水面高度（当前 / 上一帧）、待释放的力
// { x, y 浮点位置（格）, vx, vy 被推动的额外速度, lane 所在车道, flow 漂流速度, c, a, size: 1|2|3, phase, speed }
let stars = []
const pointer = { x: null, y: null }
const pointerVel = { x: 0, y: 0 } // 鼠标这一帧移动了多少格
// 银河方向：DIR 沿星带（星星漂流方向），PERP 垂直星带；HALF = 画面在 DIR 方向上投影长度的一半
let DIR = { x: 1, y: 0 }, PERP = { x: 0, y: 1 }, CX = 0, CY = 0, HALF = 1

// ---------- 噪声工具（确定性，刷新后银河形状不变） ----------
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x, y) {
  let s = 0, amp = 0.5, f = 1
  for (let i = 0; i < 5; i++) {
    s += vnoise(x * f, y * f) * amp
    f *= 2.03
    amp *= 0.5
  }
  return s
}

function buildGalaxy() {
  base = new Uint8ClampedArray(gw * gh * 4)
  stars = []
  const ang = (-24 * Math.PI) / 180 // 星带方向：左下 → 右上
  const ca = Math.cos(ang), sa = Math.sin(ang)
  const cx = gw / 2, cy = gh / 2
  const norm = Math.max(gw, gh)
  DIR = { x: ca, y: -sa }
  PERP = { x: sa, y: ca }
  CX = cx
  CY = cy
  HALF = (gw * Math.abs(DIR.x) + gh * Math.abs(DIR.y)) / 2 + 4

  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x
      // 旋转到星带坐标：u 沿星带，v 垂直星带
      const dx = (x - cx) / norm, dy = (y - cy) / norm
      const u = dx * ca - dy * sa
      const v = dx * sa + dy * ca
      const warp = (fbm(u * 3 + 11, v * 3) - 0.5) * 0.12
      const band = Math.exp(-(((v + warp) / 0.16) ** 2))
      const cloud = fbm(u * 6 + 3, v * 9 + 7)
      const dust = Math.exp(-(((v + warp * 1.4 - 0.015) / 0.03) ** 2)) * fbm(u * 12, v * 12 + 5)
      const core = Math.exp(-((u / 0.22) ** 2 + (v / 0.1) ** 2))
      let k = band * (cloud * 1.25 - 0.25) - dust * 0.9 + core * 0.35
      // 量化 + 有序抖动：星云只有 5 档亮度，像素画质感
      k = Math.max(0, k) + BAYER[(y % 4) * 4 + (x % 4)] * 0.12
      const level = Math.max(0, Math.min(4, Math.floor(k * 6)))

      // 底色：深灰黑太空，上方略偏蓝
      let r = 11, g = 12, b = 16 + Math.round((1 - y / gh) * 6)
      if (level > 0) {
        // 星云配色：外圈深紫 → 蓝紫 → 品红 → 核心暖白
        const pal = [
          null,
          [26, 20, 58],
          [44, 34, 96],
          [86, 48, 120],
          [150, 110, 140],
        ][level]
        const warm = core * 0.9
        r = pal[0] + (210 - pal[0]) * warm * (level / 4)
        g = pal[1] + (170 - pal[1]) * warm * (level / 4)
        b = pal[2] + (120 - pal[2]) * warm * (level / 4)
      }
      const o = i * 4
      base[o] = r
      base[o + 1] = g
      base[o + 2] = b
      base[o + 3] = 255
    }
  }

  // 星星：大小不一，星带内概率更高。不画进底图，单独保存，每帧按水面位移后再画
  const count = Math.round(gw * gh * 0.012)
  const colors = [[255, 255, 255], [200, 220, 255], [255, 240, 205], [255, 214, 230]]
  for (let n = 0; n < count; n++) {
    const x = Math.floor(hash(n, 1.3) * gw)
    const y = Math.floor(hash(n, 7.9) * gh)
    const dx = (x - cx) / norm, dy = (y - cy) / norm
    const v = dx * sa + dy * ca
    const inBand = Math.exp(-((v / 0.2) ** 2))
    if (hash(n, 3.1) > 0.35 + inBand * 0.65) continue
    const c = colors[Math.floor(hash(n, 5.5) * colors.length)]
    const roll = hash(n, 9.2)
    const size = roll < 0.035 ? 3 : roll < 0.14 ? 2 : 1
    stars.push({
      x, y, c, size,
      vx: 0, vy: 0,
      lane: (x - cx) * PERP.x + (y - cy) * PERP.y,
      // 大星飘得快、小星飘得慢 → 有远近层次
      flow: FLOW * (0.5 + hash(n, 8.1)) * (size === 1 ? 0.7 : size === 2 ? 1 : 1.35),
      a: size === 1 ? 0.35 + hash(n, 6.6) * 0.6 : 0.9,
      phase: hash(n, 2.2) * 6.28,
      speed: 0.6 + hash(n, 4.4) * 1.4,
    })
  }
}

function resize() {
  // 窗口尺寸为 0（例如页面在后台、iframe 还没布局）时 createImageData 会报错，先跳过，等下一次 resize
  if (!window.innerWidth || !window.innerHeight) return
  W = window.innerWidth
  H = window.innerHeight
  CELL = W < 640 ? 5 : 6
  gw = Math.ceil(W / CELL)
  gh = Math.ceil(H / CELL)
  const c = canvasRef.value
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.width = Math.round(W * dpr)
  c.height = Math.round(H * dpr)
  c.style.width = W + 'px'
  c.style.height = H + 'px'
  off.width = gw
  off.height = gh
  img = offCtx.createImageData(gw, gh)
  hCur = new Float32Array(gw * gh)
  hPrev = new Float32Array(gw * gh)
  force = new Float32Array(gw * gh)
  buildGalaxy()
}

// 沿鼠标轨迹注入"力"（两帧之间按 1 格步长插值，快速划动也是连续的一道波）
let last = null
function inject() {
  pointerVel.x = pointerVel.y = 0
  if (pointer.x == null) {
    last = null
    return
  }
  const px = pointer.x / CELL, py = pointer.y / CELL
  const from = last || { x: px, y: py }
  const dist = Math.hypot(px - from.x, py - from.y)
  last = { x: px, y: py }
  pointerVel.x = px - from.x
  pointerVel.y = py - from.y
  if (dist < 0.05) return // 鼠标静止不动就不再激起新波纹，水面自己慢慢平静
  const steps = Math.max(1, Math.ceil(dist))
  // 力与移动距离成正比，但单帧有上限：甩得再快也不会把水面"打穿"
  const amp = (Math.min(dist, 14) * FORCE) / steps
  const R = Math.ceil(FORCE_RADIUS * 2)
  const r2 = FORCE_RADIUS * FORCE_RADIUS
  for (let s = 1; s <= steps; s++) {
    const t = s / steps
    const sx = from.x + (px - from.x) * t
    const sy = from.y + (py - from.y) * t
    for (let y = Math.max(1, Math.floor(sy - R)); y <= Math.min(gh - 2, Math.ceil(sy + R)); y++) {
      for (let x = Math.max(1, Math.floor(sx - R)); x <= Math.min(gw - 2, Math.ceil(sx + R)); x++) {
        const d2 = (x - sx) ** 2 + (y - sy) ** 2
        force[y * gw + x] -= amp * Math.exp(-d2 / r2) // 负值 = 把水面按下去
      }
    }
  }
}

function frame(t) {
  if (!img) {
    resize()
    raf = requestAnimationFrame(frame)
    return
  }
  inject()

  // ① 水面：二维波动方程（显式差分）。新高度 = 2·当前 − 上一帧 + c²·拉普拉斯，再乘阻尼。
  //    结果写回 hPrev 再交换，省掉一块缓冲区。边缘一圈固定为 0（波碰到屏幕边缘被吸收/反射）。
  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const i = y * gw + x
      const h = hCur[i]
      const lap = hCur[i - 1] + hCur[i + 1] + hCur[i - gw] + hCur[i + gw] - 4 * h
      // 缓入：力按 (1 − FORCE_DECAY) 的比例逐帧释放进水面，而不是一下子全砸进去
      const f = force[i] * (1 - FORCE_DECAY)
      force[i] -= f
      hPrev[i] = (2 * h - hPrev[i] + WAVE_SPEED2 * lap + f) * DAMPING
    }
  }
  ;[hCur, hPrev] = [hPrev, hCur]

  // ② 底图：静止的星云
  const data = img.data
  data.set(base)

  // ③ 星星：自由漂流 + 被水波推开 + 被鼠标带走，十字星同时缓慢闪烁
  const time = t / 1000
  const hasPointer = last && (pointerVel.x || pointerVel.y)
  const pX = last?.x ?? 0, pY = last?.y ?? 0
  const dr2 = DRAG_RADIUS * DRAG_RADIUS
  const plot = (x, y, c, a) => {
    if (x < 0 || y < 0 || x >= gw || y >= gh) return
    const o = (y * gw + x) * 4
    data[o] += (c[0] - data[o]) * a
    data[o + 1] += (c[1] - data[o + 1]) * a
    data[o + 2] += (c[2] - data[o + 2]) * a
  }
  for (const s of stars) {
    const ix = Math.round(s.x), iy = Math.round(s.y)
    // 水波：按所在位置的水面坡度加速（被一圈圈波纹推开）
    if (ix > 0 && iy > 0 && ix < gw - 1 && iy < gh - 1) {
      const i = iy * gw + ix
      s.vx += (hCur[i + 1] - hCur[i - 1]) * WAVE_PUSH
      s.vy += (hCur[i + gw] - hCur[i - gw]) * WAVE_PUSH
    }
    // 随波逐流：鼠标附近的星星顺着鼠标划动的方向被带走
    if (hasPointer) {
      const d2 = (s.x - pX) ** 2 + (s.y - pY) ** 2
      if (d2 < dr2 * 4) {
        const w = Math.exp(-d2 / dr2) * DRAG
        s.vx += pointerVel.x * w
        s.vy += pointerVel.y * w
      }
    }
    // 惯性慢慢衰减（缓出），并限制最大速度
    s.vx *= FRICTION
    s.vy *= FRICTION
    const sp = Math.hypot(s.vx, s.vy)
    if (sp > MAX_SPEED) {
      s.vx *= MAX_SPEED / sp
      s.vy *= MAX_SPEED / sp
    }
    // 偏离车道太远时，极慢地回到银河里
    const lane = (s.x - CX) * PERP.x + (s.y - CY) * PERP.y
    const back = (s.lane - lane) * LANE_RETURN
    // 自由漂流：沿银河方向前进 + 垂直方向轻微摆动
    const wob = Math.sin(time * s.speed * 0.5 + s.phase) * WANDER + back
    s.x += DIR.x * s.flow + PERP.x * wob + s.vx
    s.y += DIR.y * s.flow + PERP.y * wob + s.vy
    // 沿银河方向漂出画面 → 从另一头流进来（车道不变，银河形状保持）
    const u = (s.x - CX) * DIR.x + (s.y - CY) * DIR.y
    if (u > HALF) {
      s.x -= DIR.x * HALF * 2
      s.y -= DIR.y * HALF * 2
    } else if (u < -HALF) {
      s.x += DIR.x * HALF * 2
      s.y += DIR.y * HALF * 2
    }
    const x = Math.round(s.x), y = Math.round(s.y)
    if (s.size === 1) {
      plot(x, y, s.c, s.a)
    } else if (s.size === 2) {
      plot(x, y, s.c, s.a); plot(x + 1, y, s.c, s.a); plot(x, y + 1, s.c, s.a); plot(x + 1, y + 1, s.c, s.a)
    } else {
      const p = (Math.sin(time * s.speed + s.phase) + 1) / 2
      plot(x, y, s.c, 0.6 + p * 0.4)
      const arm = 0.15 + p * 0.65
      plot(x - 1, y, s.c, arm); plot(x + 1, y, s.c, arm); plot(x, y - 1, s.c, arm); plot(x, y + 1, s.c, arm)
    }
  }

  offCtx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(off, 0, 0, gw, gh, 0, 0, gw * CELL * (ctx.canvas.width / W), gh * CELL * (ctx.canvas.height / H))
  raf = requestAnimationFrame(frame)
}

function onMove(e) {
  pointer.x = e.clientX
  pointer.y = e.clientY
}
function onLeave() {
  pointer.x = pointer.y = null
}
function onUp(e) {
  if (e.pointerType !== 'mouse') onLeave()
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d')
  off = document.createElement('canvas')
  offCtx = off.getContext('2d')
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
  <canvas ref="canvasRef" class="pixel-galaxy" aria-hidden="true" />
</template>

<style scoped>
.pixel-galaxy {
  position: absolute;
  inset: 0;
  display: block;
  image-rendering: pixelated;
}
</style>
