<script setup>
/**
 * 文件用途：翻牌显示器上的封面图（与 FlapText 同样的上下分瓣翻页）
 * 换图时：旧图上半片翻倒、新图下半片翻下来，中间有一道分割缝。
 * 没有封面时：显示安山机壳底纹 + 齿轮图标的默认封面。
 */
import { ref, watch } from 'vue'

const props = defineProps({ src: { type: String, default: '' } })

const cur = ref(props.src)
const prev = ref(props.src)
const n = ref(0)

watch(
  () => props.src,
  (v) => {
    prev.value = cur.value
    cur.value = v
    n.value++
  },
)

const bg = (src) => (src ? { backgroundImage: `url("${src.replace(/"/g, '%22')}")` } : {})
</script>

<template>
  <div class="flap-image" aria-hidden="true">
    <div class="half top" :class="{ empty: !cur }" :style="bg(cur)" />
    <!-- 静态下半片：翻页过程中先露出旧图，等新图的下半片翻下来盖住 -->
    <div class="half bottom" :class="{ empty: !(n ? prev : cur) }" :style="bg(n ? prev : cur)" />
    <template v-if="n">
      <div :key="'t' + n" class="half top flap-top" :class="{ empty: !prev }" :style="bg(prev)" />
      <div :key="'b' + n" class="half bottom flap-bottom" :class="{ empty: !cur }" :style="bg(cur)" />
    </template>
    <span class="seam" />
  </div>
</template>

<style scoped>
.flap-image {
  position: relative;
  aspect-ratio: 16 / 9;
  perspective: 900px;
  background: #101012;
  box-shadow: 0 0 0 3px var(--outline), inset 0 0 0 2px #2a2a2e;
}
.half {
  position: absolute;
  left: 0;
  right: 0;
  height: 50%;
  background-size: 100% 200%;
  background-repeat: no-repeat;
  backface-visibility: hidden;
}
.top {
  top: 0;
  background-position: 50% 0;
  transform-origin: 50% 100%;
}
.bottom {
  bottom: 0;
  background-position: 50% 100%;
  transform-origin: 50% 0;
}
/* 默认封面：安山机壳斜纹 + 中央齿轮（齿轮被分割缝切成上下两半，也跟着翻） */
.empty {
  background-color: #2c2d31;
  background-image:
    radial-gradient(circle at 50% 100%, var(--brass) 0 14%, var(--outline) 14% 17%, transparent 17%),
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.04) 0 6px, transparent 6px 12px) !important;
  background-size: 100% 100%, auto !important;
}
.bottom.empty {
  background-image:
    radial-gradient(circle at 50% 0%, var(--brass) 0 14%, var(--outline) 14% 17%, transparent 17%),
    repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.04) 0 6px, transparent 6px 12px) !important;
}
.flap-top {
  z-index: 2;
  animation: flap-top 0.22s ease-in forwards;
}
.flap-bottom {
  z-index: 2;
  transform: rotateX(90deg);
  animation: flap-bottom 0.22s ease-out 0.2s forwards;
}
@keyframes flap-top { to { transform: rotateX(-90deg); } }
@keyframes flap-bottom { to { transform: rotateX(0deg); } }
.seam {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(50% - 1px);
  height: 3px;
  background: #000;
  z-index: 3;
}
</style>
