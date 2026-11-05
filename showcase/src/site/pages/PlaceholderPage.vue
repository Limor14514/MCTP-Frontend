<script setup>
/**
 * 文件用途：主页面 / 反馈页面的占位页（需求文档 四、五：等后续开发）
 * 作用：先保证导航栏三个入口都能跳转、转场完整可见；正式内容开发时替换为各自页面组件。
 */
import PixelText from '../components/PixelText.vue'

defineProps({
  title: { type: String, required: true },
  note: { type: String, default: '' },
})
</script>

<template>
  <main class="placeholder-page">
    <PixelText :text="title" :px="5" />
    <p>{{ note }}</p>
  </main>
</template>

<style scoped>
.placeholder-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: var(--space-bg);
  color: #fff;
}
p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 214, 120, 0.7);
}
</style>
