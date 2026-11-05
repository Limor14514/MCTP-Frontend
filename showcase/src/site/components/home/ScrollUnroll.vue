<script setup>
/**
 * 文件用途：通用"卷轴"外框——上下两根黄铜卷轴杆，中间放任意面板（slot）
 * 用于主页面最后一个板块：更新日志、最近评论都套在里面。
 * 动画：
 *  - prepare()：合上卷轴（面板高度收为 0，只看到上下两根杆叠在一起）；主页面挂载时调用；
 *  - unroll(delay)：往下展开——下面那根杆带着面板一起往下走，直到面板完整露出；
 *    展开后清掉内联样式，面板恢复自然高度（之后展开 / 收起内容、评论加载都不受影响）。
 *  由主页面在板块第一次滚动进画面时调用，只播一次。
 */
import { ref } from 'vue'
import gsap from 'gsap'

const paperRef = ref(null)

function prepare() {
  if (paperRef.value) gsap.set(paperRef.value, { maxHeight: 0 })
}
function unroll(delay = 0) {
  const el = paperRef.value
  if (!el) return
  gsap.fromTo(
    el,
    { maxHeight: 0 },
    { maxHeight: el.scrollHeight, duration: 1.5, delay, ease: 'power2.inOut', clearProps: 'maxHeight' },
  )
}
defineExpose({ prepare, unroll })
</script>

<template>
  <div class="scroll">
    <i class="roller" aria-hidden="true" />
    <div ref="paperRef" class="paper">
      <slot />
    </div>
    <i class="roller" aria-hidden="true" />
  </div>
</template>

<style scoped>
.scroll {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.paper {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  margin: -8px 0; /* 面板上下边缘藏到杆子后面 */
  padding: 0 4px; /* 给面板外圈的深色描边留位置，不被裁掉 */
  overflow: hidden;
}
.paper > :deep(*) {
  flex: 1;
}
.roller {
  position: relative;
  z-index: 2;
  display: block;
  height: 16px;
  margin: 0 -2px;
  /* 圆柱体：上亮下暗的黄铜竖向渐变 + 深色描边 */
  background: linear-gradient(180deg, var(--brass-hi) 0 3px, var(--brass) 3px 8px, var(--brass-mid) 8px 12px, var(--brass-lo) 12px 16px);
  box-shadow: 0 0 0 3px var(--outline), 0 6px 10px rgba(0, 0, 0, 0.45);
}
/* 杆子两端的深色把手 */
.roller::before,
.roller::after {
  content: '';
  position: absolute;
  top: -4px;
  width: 12px;
  height: 24px;
  background: linear-gradient(180deg, #6b4a22, #3b2610);
  box-shadow: 0 0 0 3px var(--outline), inset 2px 2px 0 #8d6a3a;
}
.roller::before { left: -14px; }
.roller::after { right: -14px; }
</style>
