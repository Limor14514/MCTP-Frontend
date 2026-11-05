<script setup>
/**
 * 文件用途：主页面最后一个板块的左半——"更新日志"
 * 外观：竖向时间线，每个版本一个黄铜色的方形节点；点版本标题展开 / 收起该版本的改动条目。
 *       每条改动前有彩色小标签：新增（绿）、优化（蓝）、修复（橙）。
 * 默认只展开最新一个版本；内容超过面板高度时面板内部滚动，不会把页面撑得很长。
 * 第六轮：卷轴展开效果由主页面外面套的 ScrollUnroll 组件负责（和"最近评论"共用）。
 * 数据：content/changelog.js
 */
import { ref } from 'vue'
import CreatePanel from './CreatePanel.vue'
import PixelText from '../PixelText.vue'
import { CHANGELOG, CHANGE_TYPES } from '../../content/changelog'

const open = ref(new Set([CHANGELOG[0]?.version]))
function toggle(v) {
  const s = new Set(open.value)
  s.has(v) ? s.delete(v) : s.add(v)
  open.value = s
}
</script>

<template>
  <CreatePanel class="changelog">
    <div class="inner">
      <header class="head">
        <PixelText text="更新日志" :px="3" />
      </header>
      <ol class="timeline">
        <li v-for="(c, i) in CHANGELOG" :key="c.version" class="entry" :class="{ open: open.has(c.version), latest: i === 0 }">
          <button type="button" class="entry-head" :aria-expanded="open.has(c.version)" @click="toggle(c.version)">
            <i class="node" />
            <span class="ver">{{ c.version }}</span>
            <span class="title">{{ c.title }}</span>
            <time class="date" :datetime="c.date">{{ c.date }}</time>
            <span class="arrow" aria-hidden="true">{{ open.has(c.version) ? '▾' : '▸' }}</span>
          </button>
          <ul v-show="open.has(c.version)" class="items">
            <li v-for="(it, j) in c.items" :key="j">
              <span class="type" :style="{ background: CHANGE_TYPES[it.type]?.color }">{{ CHANGE_TYPES[it.type]?.label }}</span>
              <span class="text">{{ it.text }}</span>
            </li>
          </ul>
        </li>
      </ol>
    </div>
  </CreatePanel>
</template>

<style scoped>
.inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 22px clamp(16px, 2.4vw, 28px);
}
.head {
  color: #fff;
  margin-bottom: 18px;
}
.timeline {
  position: relative;
  flex: 1;
  max-height: 420px;
  overflow-y: auto;
  margin: 0;
  padding: 0 6px 0 0;
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: var(--brass-mid) transparent;
}
/* 时间线竖线 */
.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: #4a4b50;
}
.entry + .entry {
  margin-top: 6px;
}
.entry-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 6px 8px 26px;
  border: 0;
  background: none;
  color: #fff;
  font-family: var(--font-body);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.entry-head:hover {
  background: rgba(255, 255, 255, 0.04);
}
.node {
  position: absolute;
  left: 1px;
  width: 12px;
  height: 12px;
  background: var(--casing-hi);
  box-shadow: 0 0 0 2px var(--outline);
}
.entry.latest .node,
.entry.open .node {
  background: var(--brass);
  box-shadow: 0 0 0 2px var(--outline), 0 0 10px rgba(232, 178, 74, 0.6);
}
.ver {
  font-family: var(--font-pixel);
  font-size: 15px;
  color: var(--brass);
}
.title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.date {
  font-family: var(--font-pixel);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}
.arrow {
  width: 12px;
  color: rgba(255, 255, 255, 0.5);
}
.items {
  margin: 2px 0 10px;
  padding: 0 0 0 26px;
  list-style: none;
}
.items li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.78);
}
.type {
  flex: none;
  padding: 0 5px;
  font-size: 11px;
  line-height: 18px;
  color: #111;
  box-shadow: 0 0 0 1px var(--outline);
}
</style>
