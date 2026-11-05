<script setup>
/**
 * 文件用途：主页面"功能区"——8 个像素矢量图标，两行、每行四个
 * 顺序：整合包、蓝图站、自研模组、积分站 / 画廊、封神榜、历史记录点、敬请期待（数据见 content/features.js）
 * 交互：
 *  - 鼠标移上去：卡片上浮、黄铜边框发亮、图标轻轻弹一下；
 *  - 点击：进入该功能的介绍页 /home/f/<key>（功能本身待开发）；
 *  - "敬请期待"是灰色的，不可点击，没有任何作用；
 *  - 需要审核的功能，卡片右上角有"需审核"小标签。
 * 布局：桌面 4 列 × 2 行；窄屏（≤760px）自动变成 2 列 × 4 行。
 * 第六轮：每张卡片外面包一层 .cell，主页面的"从左右飞入"动画作用在 .cell 上，
 *        不会和卡片自己的悬停上浮（CSS transition）互相打架。
 */
import PixelIcon from '../PixelIcon.vue'
import PixelText from '../PixelText.vue'
import { FEATURES } from '../../content/features'
</script>

<template>
  <div class="feature-grid">
    <div v-for="f in FEATURES" :key="f.key" class="cell">
      <div v-if="f.disabled" class="tile is-disabled" aria-disabled="true">
        <PixelIcon class="icon" :icon="f.icon" :size="64" />
        <PixelText class="name" :text="f.name" :px="2" />
        <span class="en">{{ f.en }}</span>
        <span class="desc">{{ f.desc }}</span>
      </div>
      <router-link v-else :to="`/home/f/${f.key}`" class="tile">
        <span v-if="f.review" class="tag">需审核</span>
        <PixelIcon class="icon" :icon="f.icon" :size="64" :label="f.name" />
        <PixelText class="name" :text="f.name" :px="2" />
        <span class="en">{{ f.en }}</span>
        <span class="desc">{{ f.desc }}</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(12px, 2vw, 22px);
}
.cell {
  display: flex;
}
.tile {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 26px 12px 20px;
  text-align: center;
  color: #fff;
  /* 安山机壳底 + 深色描边 + 内侧高光/阴影，和公告板的显示屏同一套质感 */
  background: linear-gradient(180deg, #34353a, #26272b);
  box-shadow:
    0 0 0 3px var(--outline),
    inset 3px 3px 0 #4a4b50,
    inset -3px -3px 0 #141417,
    0 10px 0 rgba(0, 0, 0, 0.35);
  transition: transform 0.18s ease-out, box-shadow 0.18s ease-out;
}
.tile:not(.is-disabled):hover,
.tile:focus-visible {
  transform: translateY(-6px);
  box-shadow:
    0 0 0 3px var(--outline),
    0 0 0 6px var(--brass),
    inset 3px 3px 0 #4a4b50,
    inset -3px -3px 0 #141417,
    0 16px 0 rgba(0, 0, 0, 0.3),
    0 0 28px rgba(232, 178, 74, 0.35);
  outline: none;
}
.icon {
  margin-bottom: 6px;
  filter: drop-shadow(0 4px 0 rgba(0, 0, 0, 0.5));
}
.tile:not(.is-disabled):hover .icon {
  animation: icon-bob 0.5s ease-out;
}
@keyframes icon-bob {
  0% { transform: translateY(0); }
  40% { transform: translateY(-8px) scale(1.06); }
  100% { transform: translateY(0); }
}
.name {
  color: #fff;
}
.en {
  font-family: var(--font-pixel);
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--brass);
}
.desc {
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
}
.tag {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 1px 6px;
  font-family: var(--font-body);
  font-size: 11px;
  color: #3a2208;
  background: var(--brass);
  box-shadow: 0 0 0 2px var(--outline);
}
.is-disabled {
  cursor: default;
  filter: grayscale(1);
  opacity: 0.55;
}
@media (max-width: 760px) {
  .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (prefers-reduced-motion: reduce) {
  .tile { transition: none; }
  .tile:not(.is-disabled):hover .icon { animation: none; }
}
</style>
