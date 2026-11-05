<script setup>
/**
 * 文件用途：全站常驻的"演示站"标记（右下角）
 * 原因：登录、公告、反馈、评论目前都是浏览器本地模拟数据，"管理员"身份也没有真实鉴权；
 *       评审要求页面上明确标注"演示 / 本地模拟"，避免被误当成正式站使用。
 * 交互：点一下展开说明，再点收起；不挡页面操作（只占右下角一小块）。
 * 接入真实后端、正式上线时删除本组件（SiteShell.vue 里的 <DemoBadge />）即可。
 */
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <button
    class="demo-badge"
    :class="{ open }"
    type="button"
    :aria-expanded="open"
    aria-label="演示站说明"
    @click="open = !open"
  >
    <span class="title">演示站 · 数据为本地模拟</span>
    <span v-if="open" class="detail">
      登录、公告、反馈、评论只保存在你自己的浏览器里，不会上传；"管理员"身份是模拟的，没有真实鉴权。
    </span>
  </button>
</template>

<style scoped>
.demo-badge {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 1000; /* 在页面和导航栏之上，在加载页（1100）和转场（1200）之下 */
  max-width: min(320px, calc(100vw - 24px));
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 10px;
  border: 0;
  text-align: left;
  font-family: var(--font-ui);
  font-size: 13px;
  color: #1a1206;
  background: #ffb347;
  box-shadow: 0 0 0 2px var(--outline), 0 4px 0 rgba(0, 0, 0, 0.4);
  cursor: pointer;
  opacity: 0.92;
}
.demo-badge:hover,
.demo-badge.open { opacity: 1; }
.demo-badge:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.detail { font-family: var(--font-body); font-size: 12px; line-height: 1.6; }
</style>
