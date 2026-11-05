<script setup>
/**
 * 文件用途：功能 B——在线时长排行榜组件
 * 作用：以排行榜样式展示在线时长 Top 玩家（模拟数据）。
 */
// 原因：v-reveal / v-tilt 指令改为组件内局部注册（<script setup> 中 v 前缀变量自动注册为指令），
//       不再改动全局 src/main.js，保持现有框架零侵入。
import { reveal as vReveal } from '../directives/reveal'
// 作用：排行榜模拟数据（玩家名 + 在线时长小时）。
// 原因：后端排行接口未接入，先用模拟数据验证布局与视觉。
// TODO-BACKEND: 待对接后端在线时长排行接口（建议返回玩家名 + 在线时长字段）。
const ranking = [
  { rank: 1, name: 'Limor', hours: 1451 },
  { rank: 2, name: 'Self', hours: 241 },
  { rank: 3, name: 'Underp', hours: 198 },
  { rank: 4, name: 'AAA', hours: 156 },
  { rank: 5, name: 'Gk', hours: 122 },
]

// 作用：格式化时长（小时转 天/小时 文本）。
// 原因：直接显示小时不直观，转成「天 + 小时」更符合玩家阅读习惯。
function formatHours(h) {
  const days = Math.floor(h / 24)
  const hours = h % 24
  return days > 0 ? `${days} 天 ${hours} 小时` : `${hours} 小时`
}
</script>

<template>
  <!-- 作用：在线时长排行榜容器。 -->
  <section
    v-reveal
    class="preview-card"
  >
    <h2 class="preview-section-title">
      在线时长排行
    </h2>
    <!-- 作用：排行榜列表（表头 + 数据行）。 -->
    <div class="preview-rank__head">
      <span>排名</span><span>玩家</span><span>在线时长</span>
    </div>
    <ul class="preview-rank__list">
      <!-- 作用：遍历排行数据渲染行；前三名加铜黄强调。 -->
      <li
        v-for="r in ranking"
        :key="r.rank"
        class="preview-rank__row"
        :class="{ '--top': r.rank <= 3 }"
      >
        <span class="preview-rank__no">{{ r.rank }}</span>
        <span class="preview-rank__name">{{ r.name }}</span>
        <span class="preview-rank__hours">{{ formatHours(r.hours) }}</span>
      </li>
    </ul>
    <!-- TODO-BACKEND: 排行数据为模拟数据，待对接后端排行接口。 -->
    <p class="preview-muted preview-rank__note">
      TODO-BACKEND：排行数据为模拟数据，待对接后端排行接口。
    </p>
  </section>
</template>

<style scoped>
/* 作用：表头行——与数据行对齐的三栏布局。 */
.preview-rank__head {
  display: grid;
  grid-template-columns: 64px 1fr 160px;
  gap: 8px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--preview-text-soft);
  border-bottom: 1px solid var(--preview-line-strong);
}

/* 作用：列表无默认样式。 */
.preview-rank__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 作用：排行行——三栏布局，行间分隔。 */
.preview-rank__row {
  display: grid;
  grid-template-columns: 64px 1fr 160px;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--preview-line);
}

/* 作用：前三名行背景加深，突出荣誉感。 */
.preview-rank__row.--top {
  background: var(--preview-bg-hover);
}

/* 作用：排名数字。 */
.preview-rank__no {
  color: var(--preview-accent);
  font-size: 18px;
}

/* 作用：玩家名。 */
.preview-rank__name {
  color: var(--preview-text);
}

/* 作用：在线时长文字。 */
.preview-rank__hours {
  color: var(--preview-text-soft);
  text-align: right;
}

/* 作用：手机宽度（≤520px）改为「排名窄列 + 名字自适应 + 时长按内容宽度」的三栏。
   原因：原固定 64px + 160px 两列加上卡片内边距，在 375px 手机上超出屏幕约 40px，
        整页出现横向滚动、右侧露出空白；名字过长时省略号截断，不再撑破布局。 */
@media (max-width: 520px) {
  .preview-rank__head,
  .preview-rank__row {
    grid-template-columns: 36px minmax(0, 1fr) auto;
    padding-left: 8px;
    padding-right: 8px;
  }
  .preview-rank__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/* 作用：TODO 提示。 */
.preview-rank__note {
  margin: 12px 0 0;
}
</style>
