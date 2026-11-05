<script setup>
/**
 * 文件用途：塔罗占卜 + 星盘点评（今日运势下方）
 * 流程：
 *  1. 点"抽一张塔罗牌" → 7 张背面朝上的牌排成整齐的一行（第六轮：不再扇形歪斜），逐张从上方缓缓落下；
 *  2. 鼠标移到某张牌上会抬起；点击 → 记录点击时刻，由"账号 + 日期 + 点击时刻 + 第几张"决定抽到哪张牌、正逆位；
 *  3. 选中的牌移到中央并翻面（逆位的牌面倒着显示），其余牌淡出；
 *  4. 星盘转动就位，标出太阳、月亮、上升点和这张牌对应的星座/行星，下面逐行给出点评。
 * 第六轮：整个板块（含上方的虚线边框）出现时平滑淡入、边框从中间向两边展开；
 *        "按钮 → 牌阵 → 结果"之间的切换也改成淡入淡出，不再突然出现。
 * 每天只能抽一次：结果交给父组件存到本地（按 UID + 日期），刷新后直接显示当天抽到的牌。
 */
import { computed, nextTick, onMounted, ref } from 'vue'
import gsap from 'gsap'
import PixelText from '../PixelText.vue'
import Astrolabe from './Astrolabe.vue'
import { drawTarot, MAJOR_ARCANA, ROMAN } from '../../fortune/tarot'
import { readChart } from '../../fortune/astro'

const props = defineProps({
  uid: { type: [Number, String], required: true },
  dateKey: { type: String, required: true },
  fortune: { type: Object, required: true },
  saved: { type: Object, default: null }, // { n, reversed, clickedAt, slot }
})
const emit = defineEmits(['drawn'])

const SLOTS = 7
const stage = ref('intro') // intro | spread | flipping | read
const picked = ref(-1)
const draw = ref(null)
const spreadRef = ref(null)
const readingRef = ref(null)

const entered = ref(false) // 板块入场动画：挂载后下一帧置 true，CSS 过渡负责平滑出现

const chart = computed(() => (draw.value ? readChart(new Date(draw.value.clickedAt), draw.value, props.fortune) : null))

onMounted(() => {
  requestAnimationFrame(() => requestAnimationFrame(() => (entered.value = true)))
  if (props.saved) {
    draw.value = { card: MAJOR_ARCANA[props.saved.n], reversed: props.saved.reversed, clickedAt: props.saved.clickedAt }
    picked.value = props.saved.slot ?? 3
    stage.value = 'read'
  }
})

async function openSpread() {
  stage.value = 'spread'
  await nextTick()
  const cards = spreadRef.value?.querySelectorAll('.card')
  if (cards) gsap.from(cards, { y: -40, autoAlpha: 0, duration: 0.6, stagger: 0.07, delay: 0.15, ease: 'power3.out' })
}

async function choose(slot) {
  if (stage.value !== 'spread') return
  const clickedAt = new Date()
  const result = drawTarot(props.uid, props.dateKey, clickedAt, slot)
  draw.value = result
  picked.value = slot
  stage.value = 'flipping'
  emit('drawn', { n: result.card.n, reversed: result.reversed, clickedAt: result.clickedAt, slot })

  await nextTick()
  const root = spreadRef.value
  const others = root.querySelectorAll(`.card:not([data-slot="${slot}"])`)
  const chosen = root.querySelector(`.card[data-slot="${slot}"]`)
  const box = root.getBoundingClientRect()
  const c = chosen.getBoundingClientRect()
  const tl = gsap.timeline({ onComplete: () => (stage.value = 'read') })
  tl.to(others, { autoAlpha: 0, y: 30, duration: 0.35, stagger: 0.03 })
    .to(chosen, {
      x: box.left + box.width / 2 - (c.left + c.width / 2),
      y: -10,
      rotate: 0,
      scale: 1.15,
      duration: 0.55,
      ease: 'power3.inOut',
    }, 0.1)
    .to(chosen.querySelector('.flip'), { rotateY: 180, duration: 0.7, ease: 'power2.inOut' }, 0.6)
    .to({}, { duration: 0.35 })
}

// 点评逐行出现
async function revealLines() {
  await nextTick()
  const lines = readingRef.value?.querySelectorAll('p')
  if (lines) gsap.fromTo(lines, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.25, delay: 0.9 })
}

</script>

<template>
  <section class="tarot" :class="{ 'is-in': entered }">
    <div class="head">
      <PixelText text="塔罗星盘" :px="2" />
      <span class="hint">依据抽牌时刻、牌面与今日星象给出点评 · 仅供娱乐</span>
    </div>

    <Transition name="tarot-fade" mode="out-in">
    <button v-if="stage === 'intro'" type="button" class="mc-btn" @click="openSpread"><PixelText text="抽一张塔罗牌" :px="2" /></button>

    <!-- 抽牌：一行 7 张 -->
    <div v-else-if="stage === 'spread' || stage === 'flipping'" ref="spreadRef" class="spread">
      <button
        v-for="k in SLOTS"
        :key="k"
        type="button"
        class="card"
        :data-slot="k - 1"
        :aria-label="`第 ${k} 张牌`"
        :disabled="stage !== 'spread'"
        @click="choose(k - 1)"
      >
        <span class="flip">
          <span class="back"><i>⚙</i></span>
          <span v-if="draw && picked === k - 1" class="face" :class="{ reversed: draw.reversed }">
            <b>{{ ROMAN[draw.card.n] }}</b>
            <em>{{ draw.card.sym }}</em>
            <strong>{{ draw.card.zh }}</strong>
            <small>{{ draw.card.en }}</small>
          </span>
        </span>
      </button>
    </div>

    <!-- 结果：牌 + 星盘 + 点评 -->
    <div v-else-if="stage === 'read' && draw && chart" class="reading" @vue:mounted="revealLines">
      <div class="result-card">
        <span class="face static" :class="{ reversed: draw.reversed }">
          <b>{{ ROMAN[draw.card.n] }}</b>
          <em>{{ draw.card.sym }}</em>
          <strong>{{ draw.card.zh }}</strong>
          <small>{{ draw.card.en }}</small>
        </span>
        <span class="pos">{{ draw.reversed ? '逆位' : '正位' }}</span>
      </div>
      <Astrolabe :chart="chart" class="astro" />
      <div ref="readingRef" class="lines">
        <p v-for="(l, i) in chart.lines" :key="i">{{ l }}</p>
      </div>
    </div>
    </Transition>
  </section>
</template>

<style scoped>
.tarot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding-top: 18px;
  /* 入场前：透明并略微下沉 */
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
/* 上方虚线边框：用伪元素画，入场时从中间向两边展开 */
.tarot::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  border-top: 2px dashed rgba(255, 201, 60, 0.25);
  transform: scaleX(0);
  transition: transform 0.9s cubic-bezier(0.65, 0, 0.35, 1) 0.1s;
}
.tarot.is-in {
  opacity: 1;
  transform: none;
}
.tarot.is-in::before {
  transform: scaleX(1);
}
/* 按钮 / 牌阵 / 结果 之间的切换 */
.tarot-fade-enter-active { transition: opacity 0.45s ease-out, transform 0.45s ease-out; }
.tarot-fade-leave-active { transition: opacity 0.25s ease-in; }
.tarot-fade-enter-from { opacity: 0; transform: translateY(10px); }
.tarot-fade-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .tarot, .tarot::before { transition: none; }
}
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 14px;
}
.hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

/* ---------- 牌 ---------- */
/* 一行 7 张，等宽等距、底边对齐；空间不够时每张一起等比缩小 */
.spread {
  position: relative;
  display: flex;
  justify-content: center;
  gap: clamp(6px, 1.2vw, 12px);
  width: 100%;
  padding: 24px 0 12px;
  perspective: 900px;
}
.card {
  --w: 84px;
  flex: 0 1 var(--w);
  min-width: 0;
  aspect-ratio: 1 / 1.6;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 0.25s ease-out;
}
.card:not(:disabled):hover {
  transform: translateY(-14px);
}
.flip {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}
.back,
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}
/* 牌背：深蓝紫底 + 黄铜边 + 中央齿轮 + 斜格纹 */
.back {
  display: grid;
  place-items: center;
  background:
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0 4px, transparent 4px 8px),
    linear-gradient(180deg, #2b2457, #171338);
  box-shadow: 0 0 0 2px var(--outline), inset 0 0 0 3px var(--brass-mid), inset 0 0 0 5px var(--outline);
}
.back i {
  font-style: normal;
  font-size: clamp(20px, 3vw, 34px);
  color: var(--brass);
  text-shadow: 0 2px 0 var(--outline);
}
/* 牌面：羊皮纸底 */
.face {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 8% 4%;
  background: linear-gradient(180deg, #f6ebcd, #e6d3a6);
  color: var(--ink);
  box-shadow: 0 0 0 2px var(--outline), inset 0 0 0 3px var(--brass-mid);
  transform: rotateY(180deg);
  text-align: center;
}
.face.reversed {
  transform: rotateY(180deg) rotate(180deg);
}
.face.static {
  position: relative;
  transform: none;
  width: 100%;
  height: 100%;
}
.face.static.reversed {
  transform: rotate(180deg);
}
.face b { font-size: 12px; letter-spacing: 0.1em; }
.face em { font-style: normal; font-size: 2.2em; line-height: 1; color: #6b3fa0; }
.face strong { font-size: 13px; }
.face small { font-size: 9px; opacity: 0.7; }

/* ---------- 结果 ---------- */
.reading {
  display: grid;
  grid-template-columns: auto minmax(180px, 260px) 1fr;
  gap: 20px;
  align-items: start;
  width: 100%;
}
.result-card {
  --w: 96px;
  width: var(--w);
  height: calc(var(--w) * 1.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.pos {
  font-size: 13px;
  color: var(--brass-hi);
}
.astro {
  width: 100%;
}
.lines {
  display: grid;
  gap: 8px;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
}
.lines p { margin: 0; }

@media (max-width: 900px) {
  .reading {
    grid-template-columns: auto 1fr;
  }
  .lines { grid-column: 1 / -1; }
}
</style>
