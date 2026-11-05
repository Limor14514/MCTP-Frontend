<script setup>
/**
 * 文件用途：账号头像
 * 规则：账号有头像地址（src）就显示图片（像素化放大）；
 *       没有头像时，按 UID 生成一张 8×8 的像素小人头（原创生成规则，不是游戏皮肤）：
 *       头发颜色、发型、肤色、眼睛颜色都由 UID 决定，同一个账号永远是同一张脸。
 * 备注：如果后续想显示玩家的正版皮肤头像，可以把 src 设成皮肤头像服务的地址
 *       （例如按 Minecraft UUID 取头像的第三方服务），那属于向第三方发送 UUID，上线前请确认可以接受。
 */
import { computed } from 'vue'
import { hashStr, rng } from '../../fortune/fortune'

const props = defineProps({
  uid: { type: [Number, String], default: 0 },
  src: { type: String, default: '' },
  size: { type: Number, default: 128 },
  locked: { type: Boolean, default: false }, // 未登录时的灰色问号头像
})

const SKIN = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#d4a373']
const HAIR = ['#3b2a1a', '#6b4423', '#1c1c1c', '#c9a227', '#a0522d', '#d8d8d8', '#5b3a8c', '#2f6f4f']
const EYES = ['#3c44aa', '#5e7c16', '#4a2f1b', '#169c9c', '#1d1d21']

const cells = computed(() => {
  if (props.locked) return null
  const r = rng(hashStr(`avatar|${props.uid}`))
  const p = (a) => a[Math.floor(r() * a.length)]
  const skin = p(SKIN), hair = p(HAIR), eye = p(EYES)
  const fringe = Math.floor(r() * 3) // 刘海样式
  const out = []
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let c = skin
      if (y < 2) c = hair
      else if (y === 2) c = fringe === 0 ? hair : fringe === 1 ? (x < 2 || x > 5 ? hair : skin) : (x % 3 === 0 ? hair : skin)
      else if (y === 3 && (x === 0 || x === 7)) c = hair
      else if (y === 4 && (x === 1 || x === 5)) c = '#ffffff'
      else if (y === 4 && (x === 2 || x === 6)) c = eye
      else if (y === 6 && x >= 3 && x <= 4) c = '#8a4b3a'
      out.push({ x, y, c })
    }
  }
  return out
})
</script>

<template>
  <div class="pixel-avatar" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="src && !locked" :src="src" alt="头像" />
    <svg v-else-if="cells" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-label="头像">
      <rect v-for="(c, i) in cells" :key="i" :x="c.x" :y="c.y" width="1" height="1" :fill="c.c" />
    </svg>
    <svg v-else viewBox="0 0 8 8" shape-rendering="crispEdges" aria-label="未登录">
      <rect width="8" height="8" fill="#3a3b40" />
      <path d="M2 1h4v1h1v2h-1v1h-1v1h-2v-2h1v-1h1v-1h-2v1h-2v-1h1z M3 6h2v1h-2z" fill="#9a9aa0" />
    </svg>
  </div>
</template>

<style scoped>
.pixel-avatar {
  flex: none;
  box-shadow: 0 0 0 3px var(--outline), 0 0 0 6px var(--brass-mid), 0 0 0 9px var(--outline);
  background: #222;
}
.pixel-avatar img,
.pixel-avatar svg {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}
</style>
