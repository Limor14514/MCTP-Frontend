<script setup>
/**
 * 文件用途：预览页机械工业动态背景组件
 * 作用：在预览页内容底层铺一层「随滚动旋转的多层齿轮 + 蓝色图纸网格 + 上浮火星粒子」的固定背景，
 *       强化机械动力（Create）的工业纵深氛围。
 *       装配线重设计（方向 A）：齿轮旋转由「CSS 无限动画」改为「GSAP ScrollTrigger 滚动驱动（scrub）」，
 *       多层齿轮以不同速率随页面滚动旋转——近景大齿轮转得急、远景小齿轮转得缓，
 *       模拟「浏览页面 = 推动传动轴，各层齿轮按传动比联动」的机械隐喻；
 *       prefers-reduced-motion 时齿轮保持静态呈现（不创建任何滚动动画）。
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

// 作用：齿轮布点配置表（每项一个齿轮：尺寸/位置/转向/透明度/整页滚动旋转圈数）。
// 原因：把齿轮参数集中成数据，便于服主后续调整背景密度与节奏，无需改模板与样式。
// 装配线重设计：原 dur（CSS 动画时长）改为 turns（整页滚动全程的旋转圈数），
//       近层（尺寸大）圈数多→转速感强，远层圈数少→转速感弱，形成传动纵深。
// TODO-ASSET: 齿轮为内联 SVG 占位，如需真实齿轮素材可替换为图片/更精细的 SVG。
const gears = [
  { size: 460, top: '6%', left: '-7%', turns: 2.2, reverse: false, opacity: 0.09 },
  { size: 320, top: '56%', left: '74%', turns: 1.8, reverse: true, opacity: 0.08 },
  { size: 240, top: '10%', left: '68%', turns: 1.2, reverse: false, opacity: 0.07 },
  { size: 190, top: '76%', left: '10%', turns: 0.9, reverse: true, opacity: 0.07 },
  { size: 150, top: '30%', left: '40%', turns: 0.6, reverse: true, opacity: 0.05 },
]

// 作用：生成漂浮火星粒子数据（24 颗，位置/延迟/时长/尺寸各异）。
// 原因：用确定性公式生成而非随机数，保证每次渲染视觉一致、避免水合差异。
const particles = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 41 + 13) % 100}%`,
  delay: `${(i % 12) * 1.7}s`,
  dur: `${9 + (i % 5) * 4}s`,
  size: `${2 + (i % 3)}px`,
}))

// 作用：齿轮齿数量（每个齿轮固定 10 齿，用于 v-for 生成轮齿矩形）。
// 原因：10 齿对应每齿 36°，便于用 rotate 均布轮齿。
const TEETH = 10

// 作用：收集齿轮 SVG 元素引用（顺序与 gears 数组一致），供 ScrollTrigger 驱动旋转。
const gearSvgs = ref([])
function collectGear(el) {
  if (el && !gearSvgs.value.includes(el)) gearSvgs.value.push(el)
}

// 作用：滚动驱动齿轮旋转的 tween 列表（卸载时逐一销毁，避免影响其它组件的 ScrollTrigger）。
const gearTweens = []
// 作用：系统减少动效时（prefers-reduced-motion）齿轮静态呈现。
const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  if (reducedMotion) return
  // 作用：读取主题提供的齿轮速度系数 --preview-gear-speed（默认 1），便于服主整体提速/降速。
  const speed =
    Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--preview-gear-speed')) || 1
  gearSvgs.value.forEach((svg, i) => {
    const g = gears[i]
    gsap.set(svg, { rotation: 0, transformOrigin: '50% 50%' })
    const total = 360 * g.turns * speed
    // 作用：单个齿轮的旋转与整页滚动进度绑定（scrub），滚动即驱动、回滚即反转。
    const tween = gsap.to(svg, {
      rotation: g.reverse ? -total : total,
      ease: 'none',
      scrollTrigger: {
        trigger: '.preview-root',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    })
    gearTweens.push(tween)
  })
})

onBeforeUnmount(() => {
  gearTweens.forEach((t) => {
    t.scrollTrigger?.kill()
    t.kill()
  })
  gearTweens.length = 0
})
</script>

<template>
  <!-- 作用：固定全屏背景层；pointer-events:none 保证不拦截鼠标，z-index 0 位于内容之下。 -->
  <div
    class="preview-bg"
    aria-hidden="true"
  >
    <!-- 作用：图纸网格——用两条线性渐变交叉成细线网格，模拟工程蓝图。 -->
    <div class="preview-bg__grid" />

    <!-- 作用：齿轮层——遍历配置渲染多个齿轮。 -->
    <div
      v-for="g in gears"
      :key="g.left + g.top"
      class="preview-bg__gear"
      :style="{
        width: g.size + 'px',
        height: g.size + 'px',
        top: g.top,
        left: g.left,
        opacity: g.opacity,
      }"
    >
      <!-- 作用：单个齿轮 SVG；ref 收集后由 GSAP 控制 rotation（transformOrigin 50% 50%），
           旋转方向由 gears 配置的 reverse 决定，滚动进度由 ScrollTrigger 驱动。 -->
      <svg
        viewBox="0 0 200 200"
        :ref="collectGear"
      >
        <!-- 作用：轮齿——10 个矩形绕圆心均布，构成齿轮外齿。 -->
        <g
          v-for="n in TEETH"
          :key="n"
          :transform="`rotate(${(n - 1) * (360 / TEETH)} 100 100)`"
        >
          <rect
            x="91"
            y="4"
            width="18"
            height="30"
            rx="3"
            fill="currentColor"
          />
        </g>
        <!-- 作用：齿轮主体外圈。 -->
        <circle
          cx="100"
          cy="100"
          r="74"
          fill="none"
          stroke="currentColor"
          stroke-width="16"
        />
        <!-- 作用：齿轮内圈镂空（虚线描边，形成辐条感）。 -->
        <circle
          cx="100"
          cy="100"
          r="44"
          fill="none"
          stroke="currentColor"
          stroke-width="20"
          stroke-dasharray="24 16"
        />
        <!-- 作用：齿轮轴心孔。 -->
        <circle
          cx="100"
          cy="100"
          r="14"
          fill="currentColor"
        />
      </svg>
    </div>

    <!-- 作用：火星粒子层——遍历渲染上浮粒子。 -->
    <div class="preview-bg__particles">
      <span
        v-for="p in particles"
        :key="p.id"
        class="preview-bg__particle"
        :style="{
          left: p.left,
          width: p.size,
          height: p.size,
          animationDelay: p.delay,
          animationDuration: p.dur,
        }"
      />
    </div>

    <!-- 作用：底部渐隐遮罩，让背景在内容区边缘自然收淡，避免喧宾夺主。 -->
    <div class="preview-bg__fade" />
  </div>
</template>

<style scoped>
/* 作用：背景层固定铺满视口，置于内容之下、不接收鼠标事件。 */
.preview-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  color: var(--preview-accent);
}

/* 作用：蓝图网格——交叉细线，颜色取强调色并压到很低透明度。 */
.preview-bg__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--preview-line-strong) 1px, transparent 1px),
    linear-gradient(90deg, var(--preview-line-strong) 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: 0.5;
}

/* 作用：齿轮定位容器（绝对定位，尺寸/位置由内联 style 决定）。 */
.preview-bg__gear {
  position: absolute;
}

/* 作用：齿轮 SVG——旋转不再由 CSS 动画驱动，改由 GSAP ScrollTrigger 按滚动进度旋转（见 script）。
   原因：CSS 无限动画与 GSAP transform 会互相覆盖，保留任一会造成跳动；移除 CSS 动画后
        GSAP 独占 rotation 控制，滚动驱动更顺滑且可回滚。 */
.preview-bg__gear svg {
  width: 100%;
  height: 100%;
  will-change: transform;
}

/* 作用：粒子容器。 */
.preview-bg__particles {
  position: absolute;
  inset: 0;
}

/* 作用：单颗火星粒子——从底部上浮、边升边淡出。 */
.preview-bg__particle {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  background: var(--preview-accent);
  opacity: 0;
  animation-name: preview-bg-rise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

/* 作用：系统减少动效时——粒子停止上浮（齿轮已静态、无 CSS 旋转动画），整体呈现静止背景。 */
@media (prefers-reduced-motion: reduce) {
  .preview-bg__particle {
    animation: none;
    opacity: 0;
  }
}

/* 作用：底部渐隐遮罩，让背景随内容向下自然收淡。 */
.preview-bg__fade {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40%;
  background: linear-gradient(to bottom, transparent, var(--preview-bg));
}

@keyframes preview-bg-rise {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  15% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-110vh);
    opacity: 0;
  }
}
</style>
