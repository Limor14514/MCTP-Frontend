<script setup>
/**
 * 文件用途："书与笔"物品图标（16×16 像素画，本站原创绘制，沿用游戏里"书 + 羽毛笔"的物品意象）
 * 用于反馈提交成功后，书合上并变成这个物品图标。
 * 字符含义：O 描边 / B 封皮 / b 封皮暗部 / P 书页 / p 书页阴影 / W 羽毛 / w 羽毛阴影 / K 笔尖 / R 书签带
 */
const MAP = [
  '..........OOO...',
  '.........OWWWO..',
  '........OWWWwO..',
  '.......OWWWwO...',
  '..OOOOOWWWwOOO..',
  '.OBBBOWWWwOBBBO.',
  '.OBBOWWWwOPPBBO.',
  '.OBBOWWwOPPPBBO.',
  '.OBBBOKOPPPPBBO.',
  '.OBBBKOPPPPpBBO.',
  '.OBBBBPPPPppBBO.',
  '.OBBBPPPPpppBBO.',
  '.ObbbbbbbbbbbbO.',
  '.ObbRbbbbbbbbbO.',
  '..OOROOOOOOOOO..',
  '....R...........',
]
const COLOR = {
  O: '#2a1a0c', B: '#8a5a2b', b: '#5e3a18', P: '#f2e8cc', p: '#cbbd94',
  W: '#f6f6f6', w: '#b9b9b9', K: '#202020', R: '#b02e26',
}
const pixels = []
MAP.forEach((row, y) => [...row].forEach((ch, x) => COLOR[ch] && pixels.push({ x, y, c: COLOR[ch] })))

defineProps({ size: { type: Number, default: 128 } })
</script>

<template>
  <svg class="book-quill" :width="size" :height="size" viewBox="0 0 16 16" shape-rendering="crispEdges" role="img" aria-label="书与笔">
    <rect v-for="(p, i) in pixels" :key="i" :x="p.x" :y="p.y" width="1" height="1" :fill="p.c" />
  </svg>
</template>

<style scoped>
.book-quill {
  display: block;
  image-rendering: pixelated;
  filter: drop-shadow(0 6px 0 rgba(0, 0, 0, 0.45));
}
</style>
