<script setup>
/**
 * 文件用途：《机械动力》风格的面板外框（黄铜机壳）
 * 外观：外圈三档黄铜色的像素边框 + 四角铆钉，内部是深色"机壳"底板（带一层很淡的像素网格）；
 *       float=true 时整块面板缓慢上下漂浮，并带投影，看起来"悬浮"在页面上。
 * 用法：<CreatePanel float> 里面放任意内容 </CreatePanel>
 */
defineProps({
  float: { type: Boolean, default: false },
})
</script>

<template>
  <div class="create-panel" :class="{ 'is-float': float }">
    <i class="rivet tl" /><i class="rivet tr" /><i class="rivet bl" /><i class="rivet br" />
    <div class="inner">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.create-panel {
  position: relative;
  padding: 10px;
  background: linear-gradient(180deg, #f6cf6c 0%, var(--brass) 40%, var(--brass-mid) 100%);
  box-shadow:
    0 0 0 3px var(--outline),
    inset 3px 3px 0 var(--brass-hi),
    inset -3px -3px 0 var(--brass-lo),
    0 24px 48px rgba(0, 0, 0, 0.55);
}
.inner {
  position: relative;
  height: 100%;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px) 0 0 / 8px 8px,
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px) 0 0 / 8px 8px,
    linear-gradient(180deg, #2b2c31, #1f2024);
  box-shadow: 0 0 0 3px var(--outline), inset 3px 3px 0 #111, inset -3px -3px 0 #45464b;
}
/* 四角铆钉：2×2 像素的深色点 + 1px 高光 */
.rivet {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--brass-lo);
  box-shadow: inset 2px 2px 0 var(--brass-hi);
  z-index: 1;
}
.tl { top: 2px; left: 2px; }
.tr { top: 2px; right: 2px; }
.bl { bottom: 2px; left: 2px; }
.br { bottom: 2px; right: 2px; }

.is-float {
  animation: hover-float 5s ease-in-out infinite;
}
@keyframes hover-float {
  0%, 100% { transform: translateY(-6px); }
  50% { transform: translateY(6px); }
}
@media (prefers-reduced-motion: reduce) {
  .is-float { animation: none; }
}
</style>
