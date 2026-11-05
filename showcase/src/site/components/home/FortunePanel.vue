<script setup>
/**
 * 文件用途：主页面账号面板右侧 2/3——今日运势 + 塔罗星盘
 * 流程：
 *  1. 未测：显示一个黄铜齿轮按钮"测一测今日运势"；
 *  2. 点击：齿轮加速旋转 1.6 秒（"计算中"），各项星级像老虎机一样乱跳；
 *  3. 揭晓：六项运势依次出现，星星一颗颗点亮；下面是幸运色 / 数字 / 方块与宜忌；
 *  4. 再往下：塔罗星盘（TarotSpread），抽一张牌后由星盘给出点评。
 * 每日轮换：运势由"UID + 日期"决定（见 fortune/fortune.js），同一天刷新页面结果不变；
 *          是否已揭晓、抽到哪张牌也按"UID + 日期"记在本地，第二天自动重置。
 * 未登录时：locked=true，显示模糊的示例内容和"登录后查看"的提示。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import gsap from 'gsap'
import PixelText from '../PixelText.vue'
import TarotSpread from './TarotSpread.vue'
import { dailyFortune, dateKey } from '../../fortune/fortune'
import { readJSON, writeJSON } from '../../services/storage'

const props = defineProps({
  uid: { type: [Number, String], default: null },
  locked: { type: Boolean, default: false },
})

const today = ref(dateKey())
const fortune = computed(() => dailyFortune(props.locked ? 'preview' : props.uid, new Date()))
const storeKey = computed(() => `mctp-fortune-${props.uid}-${today.value}`)
const saved = ref({})
const phase = ref('idle') // idle | rolling | done
const rollStars = ref([]) // 滚动动画中每一项临时显示的星数
const rowsRef = ref(null)

function load() {
  today.value = dateKey()
  saved.value = props.locked ? {} : readJSON(storeKey.value, {})
  phase.value = props.locked || saved.value.revealed ? 'done' : 'idle'
}
watch(() => [props.uid, props.locked], load, { immediate: true })

let rollTimer
function roll() {
  if (phase.value !== 'idle') return
  phase.value = 'rolling'
  const start = performance.now()
  // 老虎机式乱跳：越接近结束跳得越慢（缓出）
  const tick = () => {
    const t = (performance.now() - start) / 1600
    if (t >= 1) return reveal()
    rollStars.value = fortune.value.aspects.map(() => 1 + Math.floor(Math.random() * 5))
    rollTimer = setTimeout(tick, 50 + t * t * 220)
  }
  tick()
}

function reveal() {
  phase.value = 'done'
  saved.value = { ...saved.value, revealed: true }
  writeJSON(storeKey.value, saved.value)
  requestAnimationFrame(() => {
    const rows = rowsRef.value?.querySelectorAll('[data-row]')
    if (rows) gsap.fromTo(rows, { x: 24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' })
    const stars = rowsRef.value?.querySelectorAll('.star.on')
    if (stars) gsap.fromTo(stars, { scale: 0 }, { scale: 1, duration: 0.35, stagger: 0.03, delay: 0.2, ease: 'back.out(3)' })
  })
}

function onTarot(result) {
  saved.value = { ...saved.value, tarot: result }
  writeJSON(storeKey.value, saved.value)
}

onBeforeUnmount(() => clearTimeout(rollTimer))

// 7×7 像素星星
const STAR = 'M3 0h1v2h3v1h-1v1h-1v1h1v2h-1v-1h-1v-1h-1v1h-1v1h-1v-2h1v-1h-1v-1h-1v-1h3z'
</script>

<template>
  <div class="fortune" :class="{ 'is-locked': locked }">
    <div class="head">
      <PixelText text="今日运势" :px="3" />
      <span class="date">{{ today }}</span>
    </div>

    <!-- ① 未测：齿轮按钮 -->
    <button v-if="phase !== 'done'" type="button" class="roll" :class="{ spinning: phase === 'rolling' }" @click="roll">
      <svg class="gear" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
        <path
          d="M6 0h4v2h1v1h1v-1h2v2h-1v1h1v1h2v4h-2v1h-1v1h1v2h-2v-1h-1v1h-1v2h-4v-2h-1v-1h-1v1h-2v-2h1v-1h-1v-1h-2v-4h2v-1h1v-1h-1v-2h2v1h1v-1h1zM6 6v4h4v-4z"
          fill="var(--brass)"
          stroke="var(--outline)"
          stroke-width="0.5"
        />
      </svg>
      <PixelText class="roll-text" :text="phase === 'rolling' ? '齿轮转动中…' : '点击测一测今日运势'" :px="2" />
    </button>

    <!-- ② 结果 -->
    <div ref="rowsRef" class="result" :class="{ ghost: phase !== 'done' }">
      <ul class="aspects">
        <li v-for="(a, i) in fortune.aspects" :key="a.key" data-row>
          <span class="label">{{ a.label }}</span>
          <span class="stars" :aria-label="`${a.stars} 星`">
            <svg
              v-for="k in 5"
              :key="k"
              class="star"
              :class="{ on: k <= (phase === 'rolling' ? rollStars[i] : a.stars) }"
              viewBox="0 0 7 7"
              shape-rendering="crispEdges"
            >
              <path :d="STAR" />
            </svg>
          </span>
          <span class="line">{{ phase === 'done' ? a.line : '……' }}</span>
        </li>
      </ul>
      <div class="extras" data-row>
        <div class="chip">
          <span class="k">幸运色</span>
          <i class="swatch" :style="{ background: fortune.color.hex }" />
          <span>{{ fortune.color.name }}</span>
        </div>
        <div class="chip"><span class="k">幸运数字</span><span class="num">{{ fortune.number }}</span></div>
        <div class="chip"><span class="k">幸运方块</span><span>{{ fortune.block }}</span></div>
      </div>
      <div class="dos" data-row>
        <p><b class="yi">宜</b>{{ fortune.good.join('、') }}</p>
        <p><b class="ji">忌</b>{{ fortune.bad.join('、') }}</p>
      </div>
    </div>

    <!-- ③ 塔罗星盘：揭晓运势后才出现 -->
    <TarotSpread
      v-if="phase === 'done' && !locked"
      :uid="uid"
      :date-key="today"
      :fortune="fortune"
      :saved="saved.tarot || null"
      @drawn="onTarot"
    />

    <!-- 未登录遮罩 -->
    <div v-if="locked" class="lock">
      <svg class="lock-icon" viewBox="0 0 10 12" shape-rendering="crispEdges" aria-hidden="true">
        <path d="M3 0h4v1h1v4h-1v-3h-1v-1h-2v1h-1v3h-1v-4h1z M1 5h8v1h1v5h-1v1h-8v-1h-1v-5h1z" fill="var(--brass)" />
        <path d="M4 7h2v2h-1v1h-1z" fill="var(--outline)" />
      </svg>
      <PixelText text="登录后查看今日运势" :px="2" />
      <router-link to="/login" class="mc-btn"><PixelText text="去登录" :px="2" /></router-link>
    </div>
  </div>
</template>

<style scoped>
.fortune {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
}
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}
.date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.08em;
}
.roll {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border: 0;
  background: rgba(255, 201, 60, 0.06);
  box-shadow: inset 0 0 0 2px rgba(255, 201, 60, 0.35);
  color: #fff;
  font: inherit;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.roll:hover { background: rgba(255, 201, 60, 0.12); }
.gear {
  width: 56px;
  height: 56px;
  animation: spin 6s linear infinite;
}
.spinning .gear {
  animation-duration: 0.45s;
}
@keyframes spin { to { transform: rotate(360deg); } }
.result.ghost {
  opacity: 0.35;
  pointer-events: none;
}
.aspects {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.aspects li {
  display: grid;
  grid-template-columns: 5.5em auto 1fr;
  align-items: center;
  gap: 12px;
}
.label {
  color: var(--brass-hi);
  font-size: 15px;
}
.stars {
  display: flex;
  gap: 3px;
}
.star {
  width: 16px;
  height: 16px;
  fill: #3a3b40;
}
.star.on {
  fill: #ffd34d;
  filter: drop-shadow(0 0 3px rgba(255, 201, 60, 0.6));
}
.line {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.78);
}
.extras {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #151517;
  box-shadow: 0 0 0 2px var(--outline), inset 0 0 0 1px #3c3c40;
  font-size: 14px;
}
.k { color: rgba(255, 255, 255, 0.5); font-size: 12px; }
.swatch {
  width: 14px;
  height: 14px;
  box-shadow: 0 0 0 2px var(--outline);
}
.num { color: var(--brass-hi); font-size: 18px; }
.dos {
  display: grid;
  gap: 6px;
  margin-top: 14px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}
.dos p { margin: 0; }
.dos b {
  display: inline-block;
  width: 24px;
  margin-right: 8px;
  text-align: center;
  color: #111;
}
.yi { background: #80c71f; }
.ji { background: #e05a4a; }

.is-locked .result {
  filter: blur(5px);
  opacity: 0.5;
}
.lock {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(20, 20, 24, 0.45);
}
.lock-icon { width: 40px; height: 48px; }

@media (max-width: 640px) {
  .aspects li {
    grid-template-columns: 5em auto;
  }
  .line { grid-column: 1 / -1; }
}
</style>
