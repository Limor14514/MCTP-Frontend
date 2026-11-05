<script setup>
/**
 * 文件用途：索引页（首次进入网站默认所在页面）
 * 结构：
 *  - 底层：固定的 three.js 画布（VoxelStage），像素齿轮"驱动模型" + 方块小岛 3D 场景；
 *  - 上层：全屏分段（useFullPage），每段切换时 3D 镜头同步飞到对应机位；
 *  - 每段内带 data-reveal 的元素只在第一次到达时播放入场（单向一次性触发）。
 * 内容：目前全部为占位文案，等用户提供素材与每段要弹出的内容后逐段替换（见各段【待定】备注）。
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { VoxelStage, SHOT_COUNT } from '../three/VoxelStage'
import { useFullPage } from '../composables/useFullPage'
import { booted } from '../siteState'
import { whenTransitionDone } from '../composables/usePageTransition'
import PixelText from '../components/PixelText.vue'
import SiteFooter from '../components/SiteFooter.vue'

const SECTIONS = [
  { key: 'cover', kicker: 'MINECRAFT · CREATE', title: '机械动力服务器', body: '向下滑动，开始装配你的世界。', note: '【待定】封面主视觉 / 标语' },
  { key: 'world', kicker: '01 / WORLD', title: '世界一览', body: '镜头飞入方块小岛——这里将替换为服务器实景 3D 场景。', note: '【待定】服务器地图 .glb 模型 + 天空盒' },
  { key: 'overview', kicker: '02 / OVERVIEW', title: '俯瞰全局', body: '俯视机位，适合放置地标点位、可点击的热点。', note: '【待定】热点位置与弹出内容' },
  { key: 'machine', kicker: '03 / MACHINE', title: '传动装配', body: '齿轮驱动模型近景，适合讲玩法 / 特色机械。', note: '【待定】玩法说明与配图' },
  { key: 'enter', kicker: '04 / ENTER', title: '进入主页面', body: '索引到此结束，点击前往主页面。', note: '' },
]
console.assert(SECTIONS.length === SHOT_COUNT, '分段数量需与 VoxelStage 的镜头关键帧数量一致')

const canvasRef = ref(null)
const trackRef = ref(null)
const sectionRefs = ref([])
let stage

function reveal(i) {
  const els = sectionRefs.value[i]?.querySelectorAll('[data-reveal]')
  if (!els?.length) return
  gsap.fromTo(
    els,
    { y: 48, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.09, delay: 0.35, ease: 'power3.out' },
  )
}

// 第 0 段的首次入场要同时满足：3D 舞台已创建 + 加载页已结束；
// 若是从其他页面转场进来，再等转场的 A 遮罩完全揭开后再播，避免在黑幕后播完
let firstPending = false
function tryFirst() {
  if (!firstPending || !booted.value || !stage) return
  firstPending = false
  whenTransitionDone().then(() => {
    stage?.intro()
    reveal(0)
  })
}

function onEnter(i, prev, first) {
  stage?.goTo(i)
  if (!first) return
  if (i === 0) {
    firstPending = true
    tryFirst()
    return
  }
  reveal(i)
}

const { index, goTo } = useFullPage(trackRef, SECTIONS.length, onEnter)

watch(booted, tryFirst)

onMounted(() => {
  document.documentElement.classList.add('fp-lock')
  stage = new VoxelStage(canvasRef.value)
  tryFirst()
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('fp-lock')
  stage?.dispose()
})
</script>

<template>
  <div class="index-page">
    <canvas ref="canvasRef" class="stage" aria-hidden="true" />

    <div class="viewport">
      <div ref="trackRef" class="track" :style="{ height: `${SECTIONS.length * 100}%` }">
        <section
          v-for="(s, i) in SECTIONS"
          :key="s.key"
          :ref="(el) => (sectionRefs[i] = el)"
          class="fp-section"
          :class="`is-${s.key}`"
          :style="{ height: `${100 / SECTIONS.length}%` }"
        >
          <div class="copy">
            <p class="kicker" data-reveal>{{ s.kicker }}</p>
            <h2 class="title" data-reveal>
              <PixelText :text="s.title" :px="i === 0 ? 5 : 4" />
            </h2>
            <p class="body" data-reveal>{{ s.body }}</p>
            <p v-if="s.note" class="note" data-reveal>{{ s.note }}</p>
            <router-link v-if="s.key === 'enter'" to="/home" class="cta" data-reveal>
              <PixelText text="前往主页面 →" :px="2" />
            </router-link>
          </div>
          <!-- 最后一段底部：精简页脚（协议条款 / 反馈 + 非官方声明） -->
          <SiteFooter v-if="s.key === 'enter'" compact class="index-footer" />
        </section>
      </div>
    </div>

    <!-- 右侧分段指示点，可直接点击跳段 -->
    <ol class="dots" aria-label="分段导航">
      <li v-for="(s, i) in SECTIONS" :key="s.key">
        <button :class="{ active: index === i }" :aria-label="`第 ${i + 1} 段：${s.title}`" @click="goTo(i)" />
      </li>
    </ol>

    <p class="hint" :class="{ gone: index > 0 }">滚动 / 拖拽 / 滑动 ↓</p>
  </div>
</template>

<style scoped>
.index-page {
  position: fixed;
  inset: 0;
  height: 100dvh;
  background: radial-gradient(120% 90% at 70% 30%, #151a24 0%, var(--space-bg) 60%);
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
  color: #fff;
}
.stage {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.track {
  will-change: transform;
}
.fp-section {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 clamp(20px, 8vw, 120px);
}
.copy {
  max-width: 560px;
  pointer-events: auto;
}
.is-overview .copy,
.is-enter .copy {
  margin: 0 auto;
  text-align: center;
}
.is-overview .title :deep(svg),
.is-enter .title :deep(svg) {
  margin: 0 auto;
}
.is-machine .copy {
  margin-left: auto;
}
.index-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: auto;
}
[data-reveal] {
  opacity: 0; /* 由 reveal() 一次性淡入；未触发前保持隐藏 */
}
.kicker {
  font-family: var(--font-pixel);
  letter-spacing: 0.24em;
  font-size: 13px;
  color: var(--gold);
  margin: 0 0 18px;
}
.title {
  margin: 0 0 20px;
  filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.45));
}
.body {
  margin: 0 0 12px;
  font-size: clamp(15px, 1.2vw, 18px);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.82);
}
.note {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 214, 120, 0.7);
}
.cta {
  display: inline-block;
  margin-top: 28px;
  padding: 14px 22px;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.85);
  box-shadow: 4px 4px 0 rgba(255, 201, 60, 0.6);
  transition: transform 0.15s, box-shadow 0.15s;
}
.cta:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 rgba(255, 201, 60, 0.85);
}
.dots {
  position: absolute;
  right: clamp(12px, 2.4vw, 32px);
  top: 50%;
  transform: translateY(-50%);
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dots button {
  display: block;
  width: 10px;
  height: 10px;
  padding: 0;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: transparent;
  cursor: pointer;
  transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.dots button.active {
  background: var(--gold);
  border-color: var(--gold);
  box-shadow: 0 0 8px rgba(255, 201, 60, 0.7);
}
.hint {
  position: absolute;
  left: 50%;
  bottom: max(20px, env(safe-area-inset-bottom));
  transform: translateX(-50%);
  margin: 0;
  font-family: var(--font-pixel);
  font-size: 13px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.55);
  animation: bob 1.6s ease-in-out infinite;
  transition: opacity 0.4s;
}
.hint.gone {
  opacity: 0;
}
@keyframes bob {
  50% { transform: translate(-50%, 6px); }
}
@media (max-width: 640px) {
  .fp-section {
    align-items: flex-end;
    padding-bottom: 18vh; /* 手机竖屏：文字放下方，上方留给 3D 模型 */
  }
  .is-machine .copy { margin-left: 0; }
  .title :deep(svg) { zoom: 0.7; }
}
</style>
