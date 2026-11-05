<script setup>
/**
 * 文件用途：像素风星盘（塔罗点评旁边的图）
 * 画法（与常见星盘一致）：上升点固定在左侧（9 点钟方向），黄道十二宫按逆时针排列；
 *   - 外圈：十二星座分格 + 星座符号；
 *   - 内圈标记：☀ 太阳、☽ 月亮、ASC 上升点连线、✦ 这张塔罗牌对应的星座/行星；
 * 动画：出现时整个星盘从偏转 540° 的位置缓缓转到正确位置（缓入缓出），随后标记逐个亮起。
 * 参数：chart —— fortune/astro.js 中 readChart() 的结果。
 */
import { computed, onMounted, reactive } from 'vue'
import gsap from 'gsap'
import { SIGNS } from '../../fortune/astro'

const props = defineProps({ chart: { type: Object, required: true } })

const C = 100
const anim = reactive({ spin: -540, marks: 0 })

// 黄经 → 屏幕坐标：上升点在左侧（180°），黄经增加方向为逆时针
function pt(lon, r) {
  const a = ((180 + (lon - props.chart.asc.lon) + anim.spin) * Math.PI) / 180
  return { x: C + r * Math.cos(a), y: C - r * Math.sin(a) }
}

const segments = computed(() =>
  SIGNS.map((s, i) => {
    const a = pt(i * 30, 96)
    const b = pt(i * 30, 74)
    const label = pt(i * 30 + 15, 85)
    return { s, i, a, b, label }
  }),
)

const marks = computed(() => {
  const c = props.chart
  return [
    { key: 'sun', p: pt(c.sun.lon, 56), sym: '☀', color: '#ffd34d', title: `太阳 · ${c.sun.sign.zh}` },
    { key: 'moon', p: pt(c.moon.lon, 44), sym: '☽', color: '#dfe6ff', title: `月亮 · ${c.moon.sign.zh}` },
    { key: 'card', p: pt(c.card.lon, 30), sym: '✦', color: '#c58cff', title: `塔罗 · ${c.card.name}` },
  ]
})
const ascA = computed(() => pt(props.chart.asc.lon, 74))
const ascB = computed(() => pt(props.chart.asc.lon + 180, 74))

onMounted(() => {
  gsap.timeline()
    .to(anim, { spin: 0, duration: 2.2, ease: 'power3.inOut' })
    .to(anim, { marks: 1, duration: 0.6, ease: 'power1.out' }, '-=0.3')
})
</script>

<template>
  <figure class="astrolabe">
    <svg viewBox="0 0 200 200" role="img" :aria-label="`星盘：太阳${chart.sun.sign.zh}，月亮${chart.moon.sign.zh}，上升${chart.asc.sign.zh}`">
      <!-- 盘面 -->
      <circle :cx="C" :cy="C" r="98" fill="#16141f" stroke="var(--outline)" stroke-width="3" />
      <circle :cx="C" :cy="C" r="96" fill="none" stroke="var(--brass)" stroke-width="2" />
      <circle :cx="C" :cy="C" r="74" fill="#1d1a2a" stroke="var(--brass-mid)" stroke-width="1.5" />
      <circle :cx="C" :cy="C" r="20" fill="none" stroke="rgba(255,201,60,.35)" stroke-width="1" stroke-dasharray="2 3" />
      <!-- 十二宫分格 + 星座符号 -->
      <g v-for="seg in segments" :key="seg.i">
        <line :x1="seg.a.x" :y1="seg.a.y" :x2="seg.b.x" :y2="seg.b.y" stroke="var(--brass-mid)" stroke-width="1" />
        <text
          :x="seg.label.x"
          :y="seg.label.y"
          class="sign"
          :class="{ hot: seg.s === chart.sun.sign }"
          text-anchor="middle"
          dominant-baseline="central"
        >{{ seg.s.sym }}</text>
      </g>
      <!-- 上升 / 下降轴 -->
      <g :opacity="anim.marks">
        <line :x1="ascA.x" :y1="ascA.y" :x2="ascB.x" :y2="ascB.y" stroke="rgba(255,255,255,.35)" stroke-width="1" stroke-dasharray="3 2" />
        <text :x="ascA.x + 4" :y="ascA.y - 5" class="asc">ASC</text>
        <g v-for="m in marks" :key="m.key">
          <line :x1="C" :y1="C" :x2="m.p.x" :y2="m.p.y" :stroke="m.color" stroke-opacity="0.35" stroke-width="1" />
          <circle :cx="m.p.x" :cy="m.p.y" r="8" fill="#0f0d17" :stroke="m.color" stroke-width="1.5" />
          <text :x="m.p.x" :y="m.p.y" class="mark" :fill="m.color" text-anchor="middle" dominant-baseline="central">{{ m.sym }}<title>{{ m.title }}</title></text>
        </g>
      </g>
      <!-- 中心铆钉 -->
      <rect :x="C - 3" :y="C - 3" width="6" height="6" fill="var(--brass)" stroke="var(--outline)" stroke-width="1" />
    </svg>
    <figcaption>
      <span>☀ {{ chart.sun.sign.zh }}</span>
      <span>☽ {{ chart.moon.sign.zh }} · {{ chart.moon.phaseName }}</span>
      <span>ASC {{ chart.asc.sign.zh }}</span>
      <span>✦ {{ chart.card.name }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.astrolabe {
  margin: 0;
}
svg {
  display: block;
  width: 100%;
  height: auto;
}
.sign {
  font-family: 'Segoe UI Symbol', 'Noto Sans Symbols 2', sans-serif;
  font-size: 13px;
  fill: rgba(255, 240, 168, 0.6);
}
/* 太阳所在的星座高亮 */
.sign.hot {
  fill: #ffd34d;
  font-weight: bold;
}
.asc {
  font-family: var(--font-ui);
  font-size: 9px;
  fill: rgba(255, 255, 255, 0.7);
}
.mark {
  font-family: 'Segoe UI Symbol', 'Noto Sans Symbols 2', sans-serif;
  font-size: 10px;
}
figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
