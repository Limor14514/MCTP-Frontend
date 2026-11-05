<script setup>
/**
 * 文件用途：导航栏右上角的《我的世界》金色时钟（第三轮改版）
 * 两种来源，自动选择：
 *  A. 游戏原版时钟贴图（推荐，最原汁原味）：
 *     从你自己的游戏本体 .minecraft/versions/<版本>/<版本>.jar（改后缀为 .zip 打开）里取出
 *     assets/minecraft/textures/item/clock_00.png … clock_63.png 共 64 帧，
 *     放到 src/site/assets/clock/ 下（文件名不变）。存在时直接用对应帧，不用改代码。
 *     帧号换算（与游戏一致）：clock_00 = 正午（太阳在正上方），clock_32 = 午夜，按现实时间均匀推进。
 *     注意：原版贴图版权属于 Mojang，公开上线前请确认符合 Minecraft 使用准则。
 *  B. 没有放贴图时：本组件自绘的 16×16 金色时钟（原创像素画，沿用原版时钟的设计思路）：
 *     - 金色表壳：深色描边 + 左上高光、右下阴影的黄金边框，顶部一个小挂环；
 *     - 表盘：一个随时间转动的"天空圆盘"，一半是白天（蓝天 + 太阳），一半是黑夜（深蓝 + 月亮 + 星星）；
 *     - 地平线：表盘下半部分被金色"地面"挡住——白天太阳在地平线上方，夜晚月亮升起，
 *       日出日落时太阳正好在地平线左右两端（和游戏里看时钟判断昼夜的方式一样）。
 * 参数：date 当前时间（由父组件每分钟刷新传入，避免每个组件各开一个定时器）；px 每格边长。
 */
import { computed } from 'vue'

const props = defineProps({
  date: { type: Date, required: true },
  px: { type: Number, default: 2 },
})

// ---------- A. 原版贴图（可选素材，不存在时为空对象，不会报错） ----------
const frames = import.meta.glob('../assets/clock/clock_*.png', { eager: true, import: 'default' })
const frameUrls = Object.keys(frames)
  .sort()
  .map((k) => frames[k])
const useTexture = frameUrls.length === 64

// 现实时间 → 一天中的比例（正午 = 0，与游戏的天体角一致）
const dayFrac = computed(() => {
  const h = props.date.getHours() + props.date.getMinutes() / 60
  return (((h - 12) / 24) % 1 + 1) % 1
})
const frameUrl = computed(() => (useTexture ? frameUrls[Math.floor(dayFrac.value * 64) % 64] : null))

// ---------- B. 自绘金色时钟 ----------
const C = 7.5 // 16×16 画布中心
const COL = {
  outline: '#2a1a04',
  goldHi: '#fff2a6',
  gold: '#f5c432',
  goldMid: '#d79a1c',
  goldLo: '#9c6410',
  ground: '#b9801a',
  groundLo: '#8a560c',
  daySky: '#4f8fe8',
  dayHi: '#7db4ff',
  nightSky: '#0f1638',
  nightHi: '#1d2a5c',
  sun: '#ffe14d',
  sunCore: '#fff8c4',
  moon: '#eef0f7',
  moonShade: '#b8bdd0',
  star: '#ffffff',
}

// 表壳轮廓：近似圆形的像素圆（8 边形倒角），逐行给出 [起始x, 结束x]
const ROWS = [
  null, null,
  [5, 10], [4, 11], [3, 12], [2, 13], [2, 13], [2, 13],
  [2, 13], [2, 13], [2, 13], [3, 12], [4, 11], [5, 10],
  null, null,
]
const inside = (x, y) => ROWS[y] && x >= ROWS[y][0] && x <= ROWS[y][1]

const pixels = computed(() => {
  const a = dayFrac.value * Math.PI * 2 // 0 = 正午，太阳在正上方；顺时针转
  const sun = { x: C + Math.sin(a) * 3.2, y: C - Math.cos(a) * 3.2 }
  const moon = { x: C - Math.sin(a) * 3.2, y: C + Math.cos(a) * 3.2 }
  const out = []
  const put = (x, y, c) => out.push({ x, y, c })

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!inside(x, y)) {
        // 外描边：紧贴表壳外侧一圈
        const near = inside(x + 1, y) || inside(x - 1, y) || inside(x, y + 1) || inside(x, y - 1)
        if (near) put(x, y, COL.outline)
        continue
      }
      const edge = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1)
      const edge2 = !inside(x + 2, y) || !inside(x - 2, y) || !inside(x, y + 2) || !inside(x, y - 2)
      const lit = x - C + (y - C) // <0 左上，>0 右下
      if (edge) {
        // 外圈金边：左上亮、右下暗
        put(x, y, lit < -2 ? COL.goldHi : lit > 2 ? COL.goldLo : COL.gold)
      } else if (edge2) {
        // 内圈金边：比外圈暗一档，做出"表框有厚度"的感觉
        put(x, y, lit < -2 ? COL.gold : lit > 2 ? COL.goldLo : COL.goldMid)
      } else if (y >= 9) {
        // 地平线以下：金色地面挡住天空圆盘的下半部
        put(x, y, y === 9 ? COL.goldMid : (x + y) % 3 === 0 ? COL.groundLo : COL.ground)
      } else {
        // 天空圆盘：以中心为界，太阳一侧是白天、月亮一侧是黑夜
        const side = (x - C) * Math.sin(a) - (y - C) * Math.cos(a) // >0 偏向太阳
        const day = side > -0.3
        let c = day ? (y < 6 ? COL.dayHi : COL.daySky) : (y < 6 ? COL.nightHi : COL.nightSky)
        const ds = Math.hypot(x - sun.x, y - sun.y)
        const dm = Math.hypot(x - moon.x, y - moon.y)
        if (ds < 1.5) c = ds < 0.75 ? COL.sunCore : COL.sun
        else if (dm < 1.4) c = x - moon.x > 0.4 ? COL.moonShade : COL.moon
        else if (!day && (x * 7 + y * 13 + Math.round(a * 4)) % 11 === 0) c = COL.star
        put(x, y, c)
      }
    }
  }
  // 顶部挂环
  put(7, 0, COL.outline); put(8, 0, COL.outline)
  put(6, 1, COL.outline); put(7, 1, COL.goldHi); put(8, 1, COL.gold); put(9, 1, COL.outline)
  return out
})
</script>

<template>
  <img
    v-if="frameUrl"
    class="mc-clock"
    :src="frameUrl"
    :width="16 * px"
    :height="16 * px"
    alt="时钟"
    draggable="false"
  />
  <svg
    v-else
    class="mc-clock"
    :width="16 * px"
    :height="16 * px"
    viewBox="0 0 16 16"
    shape-rendering="crispEdges"
    role="img"
    aria-label="时钟"
  >
    <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.c" />
  </svg>
</template>

<style scoped>
.mc-clock {
  display: block;
  image-rendering: pixelated;
}
</style>
