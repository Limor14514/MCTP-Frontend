<script setup>
/**
 * 文件用途：功能 A——服务器状态条组件
 * 作用：展示在线人数 / TPS / 游戏版本三项指标，并接入后端 GET /api/v1/health/ 做 10 秒轮询；
 *       后端若已提供在线人数 / TPS 字段则展示真实值，否则回退模拟值并标注，避免预览环境无数据时空白。
 *       在线人数与 TPS 滚入视口时做数字滚动计数动效，在线状态点脉冲提示「实时」。
 */
// 原因：v-reveal / v-tilt 指令改为组件内局部注册（<script setup> 中 v 前缀变量自动注册为指令），
//       不再改动全局 src/main.js，保持现有框架零侵入。
import { reveal as vReveal } from '../directives/reveal'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useServiceHealth } from '../composables/useServiceHealth'

// 作用：后端健康接口 10 秒轮询（复用现有 composable，自带挂载/卸载清理）。
// 原因：审核方最看重「真实性」，用真实健康接口优于纯静态；接口无在线人数/TPS 字段时自动降级。
const { health, loading, error, online } = useServiceHealth({ intervalMs: 10000 })

// 作用：模拟兜底数据——后端字段缺失或接口不可用时使用。
// TODO-BACKEND: 请后端在 GET /api/v1/health/ 增加在线人数 / TPS 字段（如 online、tps），即可自动展示真实值。
const mock = {
  online: 128,
  tps: 19.8,
  version: '1.20.1 Forge 47.2.0',
}

// 作用：从对象里按候选键取第一个有限数字（兼容后端不同字段命名）。
function pickNum(obj, keys) {
  if (!obj) return null
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return null
}

// 作用：真实在线人数 / TPS（后端未提供则为 null）。
const liveOnline = computed(() => pickNum(health.value, ['online', 'players_online', 'online_players', 'players']))
const liveTps = computed(() => pickNum(health.value, ['tps', 'server_tps']))

// 作用：最终展示值——优先真实值，缺失回退模拟值。
const resolvedOnline = computed(() => liveOnline.value ?? mock.online)
const resolvedTps = computed(() => liveTps.value ?? mock.tps)
const version = computed(() => health.value?.version || mock.version)
// 作用：是否已拿到真实的在线人数/TPS（用于标注「实时 / 模拟」）。
const isLive = computed(() => liveOnline.value != null || liveTps.value != null)

// 作用：状态提示文案。
const statusText = computed(() => {
  if (loading.value && !health.value) return '连接中…'
  if (error.value) return '接口离线 · 展示模拟数据'
  if (online.value) return isLive.value ? '实时数据' : '服务正常 · 数值模拟'
  return '服务状态异常'
})

// 作用：在线人数 / TPS 的动画显示值。
const displayOnline = ref(0)
const displayTps = ref(0)
const sectionEl = ref(null)
let observer = null
let started = false

// 作用：根据 TPS 值计算状态文案（用于徽章标签，纯前端展示逻辑）。
function tpsLabel(tps) {
  if (tps >= 19) return '流畅'
  if (tps >= 15) return '稳定'
  return '拥堵'
}

// 作用：通用数字滚动计数（缓出曲线）。
function animateCount(targetRef, end, duration, decimals = 0) {
  const start = performance.now()
  const from = 0
  function step(now) {
    const p = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    const val = from + (end - from) * eased
    targetRef.value = decimals > 0 ? Number(val.toFixed(decimals)) : Math.round(val)
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// 作用：把当前解析值动画到显示值。
function animateTo() {
  animateCount(displayOnline, Math.round(resolvedOnline.value), 1200)
  animateCount(displayTps, Number(resolvedTps.value), 1200, 1)
}

// 作用：真实数据变化时（轮询拿到新值）重新计数。
watch([resolvedOnline, resolvedTps], () => {
  if (started) animateTo()
})

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    displayOnline.value = Math.round(resolvedOnline.value)
    displayTps.value = Number(resolvedTps.value)
    started = true
    return
  }
  if (!sectionEl.value) return
  // 作用：进入视口才触发首次计数，避免页面加载即空转。
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return
      started = true
      animateTo()
      observer.disconnect()
    },
    { threshold: 0.4 },
  )
  observer.observe(sectionEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <!-- 作用：状态条区容器；ref 供 IntersectionObserver 监听。 -->
  <section
    id="status"
    ref="sectionEl"
    v-reveal
    class="preview-card"
  >
    <div class="preview-status__head">
      <h2 class="preview-section-title">
        服务器状态
      </h2>
      <!-- 作用：数据来源状态提示（实时 / 模拟 / 连接中）。 -->
      <span
        class="preview-status__source"
        :class="{ 'is-live': isLive }"
      >{{ statusText }}</span>
    </div>
    <!-- 作用：三项状态徽章并排。 -->
    <div class="preview-status__grid">
      <div class="preview-status__item">
        <span class="preview-status__label">
          在线人数
          <!-- 作用：在线脉冲点——铜黄实心、持续呼吸，传达「实时在线」语义。 -->
          <span
            class="preview-status__live"
            aria-hidden="true"
          />
        </span>
        <span class="preview-status__value">{{ displayOnline }}</span>
        <span class="preview-status__unit">人</span>
      </div>
      <div class="preview-status__item">
        <span class="preview-status__label">TPS</span>
        <span class="preview-status__value">{{ displayTps.toFixed(1) }}</span>
        <span
          class="preview-status__badge"
          :class="`--${tpsLabel(resolvedTps) === '流畅' ? 'good' : 'warn'}`"
        >
          {{ tpsLabel(resolvedTps) }}
        </span>
      </div>
      <div class="preview-status__item">
        <span class="preview-status__label">游戏版本</span>
        <span class="preview-status__version">{{ version }}</span>
      </div>
    </div>
    <!-- TODO-BACKEND: 在线人数 / TPS 字段后端未提供时展示模拟值，字段补齐后自动切换真实值。 -->
    <p class="preview-muted preview-status__note">
      TODO-BACKEND：已接入 GET /api/v1/health/ 十秒轮询；若需展示真实在线人数 / TPS，请后端补充对应字段。
    </p>
  </section>
</template>

<style scoped>
/* 作用：标题行两端对齐（标题 + 数据来源标签）。 */
.preview-status__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

/* 作用：数据来源状态标签——默认灰，实时态铜黄。 */
.preview-status__source {
  font-size: 12px;
  color: var(--preview-text-soft);
}

.preview-status__source.is-live {
  color: var(--preview-accent);
}

/* 作用：三项状态均等三列。
   原因：指标权重相同，并排展示便于一眼对比。 */
.preview-status__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .preview-status__grid {
    grid-template-columns: 1fr;
  }
}

/* 作用：单项状态块——暗棕底 + 铜黄描边。 */
.preview-status__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--preview-line-strong);
  border-radius: 10px;
  background: var(--preview-bg-panel-soft);
}

/* 作用：指标标签——横向排布以容纳脉冲点。 */
.preview-status__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--preview-text-soft);
}

/* 作用：在线脉冲点——小圆点 + 呼吸扩散动画。 */
.preview-status__live {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--preview-accent);
  animation: preview-status-pulse 1.8s ease-out infinite;
}

/* 作用：大数值——像素感强、铜黄，使用等宽数字避免跳动时抖动。 */
.preview-status__value {
  font-size: 34px;
  line-height: 1.1;
  color: var(--preview-accent);
  font-variant-numeric: tabular-nums;
}

/* 作用：数值单位。 */
.preview-status__unit {
  font-size: 14px;
  color: var(--preview-text-soft);
}

/* 作用：TPS 健康徽章（好=铜黄实底，中=暗橙描边）。 */
.preview-status__badge {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.preview-status__badge.--good {
  background: var(--preview-accent);
  color: #2b2118;
}

.preview-status__badge.--warn {
  border: 1px solid var(--preview-accent-deep);
  color: var(--preview-accent);
}

/* 作用：版本号文字——可换行，防止长版本号撑破卡片。 */
.preview-status__version {
  font-size: 15px;
  color: var(--preview-text);
  word-break: break-all;
}

/* 作用：TODO 提示。 */
.preview-status__note {
  margin: 16px 0 0;
}

@keyframes preview-status-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--preview-accent) 55%, transparent);
  }
  70% {
    box-shadow: 0 0 0 8px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}
</style>
