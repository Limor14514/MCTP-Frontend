<script setup>
/**
 * 文件用途：加载页标题（LOADING）——自动选择"Blockbench 渲染图"或"内置立体像素字"
 * 规则：
 *  - 只要 src/site/assets/title/loading.png 存在（用 Blockbench 的 Minecraft Title 插件
 *    在 Render 标签里渲染、导出透明背景 PNG），就用这张图；
 *    金光进度以图片的透明度为遮罩（mask-image），从左到右推进，所以金光只出现在字形上；
 *  - 图片不存在时，使用 CreateWord（自绘《我的世界：机械动力》黄铜风格立体像素字，第三轮改版）；
 *    旧的白色岩石字 StoneWord.vue 保留作备份，不再使用。
 * 好处：替换素材只需放一张图，不改任何代码。
 */
import { computed } from 'vue'
import CreateWord from './CreateWord.vue'

const props = defineProps({
  progress: { type: Number, default: 0 },
})

// 可选素材：eager 导入，不存在时为空对象，不会报错
const found = import.meta.glob('../assets/title/loading.png', { eager: true, import: 'default' })
const pngUrl = Object.values(found)[0] || null

const clip = computed(() => `inset(0 ${(1 - props.progress) * 100}% 0 0)`)
</script>

<template>
  <div v-if="pngUrl" class="title-png" :style="{ '--title-img': `url(${pngUrl})` }">
    <img :src="pngUrl" alt="LOADING" draggable="false" />
    <div class="gold-wrap">
      <div class="gold" :style="{ clipPath: clip }">
        <span class="shimmer" :style="{ left: `${progress * 100}%`, opacity: progress > 0 && progress < 1 ? 1 : 0 }" />
      </div>
    </div>
  </div>
  <div v-else class="title-fallback">
    <CreateWord :progress="progress" />
  </div>
</template>

<style scoped>
.title-png {
  position: relative;
  width: 100%;
  animation: float 3.2s ease-in-out infinite;
}
.title-png img {
  display: block;
  width: 100%;
  height: auto;
  image-rendering: pixelated;
  user-select: none;
}
/* 外层负责辉光（drop-shadow 作用在遮罩后的形状上），内层负责以图片形状作遮罩 */
.gold-wrap {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 0 0.6vw rgba(255, 201, 60, 0.55));
}
.gold {
  position: absolute;
  inset: 0;
  -webkit-mask: var(--title-img) center / 100% 100% no-repeat;
  mask: var(--title-img) center / 100% 100% no-repeat;
  background: linear-gradient(180deg, #fff3b0 0%, #ffc93c 45%, #d48a0c 100%);
  /* hard-light：保留原图的方块纹理明暗，只把颜色染成金色 */
  mix-blend-mode: hard-light;
  overflow: hidden;
}
.shimmer {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8%;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 251, 230, 0.95) 70%, transparent);
  transition: opacity 0.3s;
}
/* 内置黄铜立体字：Create 标志是正面平视的，不再做仰视透视 */
.title-fallback {
  width: 100%;
}
@keyframes float {
  0%, 100% { transform: translateY(-1.2%); }
  50% { transform: translateY(1.2%); }
}
@media (prefers-reduced-motion: reduce) {
  .title-png { animation: none; }
}
</style>
