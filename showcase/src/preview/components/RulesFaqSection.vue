<script setup>
/**
 * 文件用途：功能 E——服务器规则 / FAQ 折叠面板组件
 * 作用：以折叠面板展示 5 条左右服务器规则与常见问题（使用原生 details/summary，零依赖）。
 */
// 原因：v-reveal / v-tilt 指令改为组件内局部注册（<script setup> 中 v 前缀变量自动注册为指令），
//       不再改动全局 src/main.js，保持现有框架零侵入。
import { reveal as vReveal } from '../directives/reveal'
// 作用：规则条目数据。
// TODO-CONTENT: 规则文案为通用占位，待服主定制正式规则。
const rules = [
  { title: '禁止作弊与非法插件', body: '严禁使用外挂、作弊客户端或任何破坏公平性的第三方工具，违者封禁处理。' },
  { title: '禁止恶意破坏与偷窃', body: '未经允许不得破坏他人建筑、恶意偷窃物资，纠纷可联系管理员仲裁。' },
  { title: '聊天规范', body: '公共频道禁止刷屏、辱骂与敏感内容；交易与宣传请到对应频道。' },
  { title: '红石与机械性能限制', body: '大规模红石/机械装置需控制规模并按时卸载，避免影响服务器 TPS。' },
  { title: '建筑规划报备', body: '大型建筑建议在社区频道报备选址，避免与他人规划冲突。' },
]

// 作用：FAQ 条目数据。
// TODO-CONTENT: FAQ 文案为通用占位，待服主补充真实常见问题。
const faqs = [
  { q: '如何加入服务器？', a: '安装客户端整合包后按下载区指引连接服务器地址即可。' },
  { q: '支持正版/离线登录吗？', a: '当前为混合模式：正版与离线账号均可进入，具体见登录公告。' },
  { q: '服务器核心模组有哪些？', a: '以 Create 机械动力为核心，含 JEI、优化与工业辅助模组，详见下载区整合包。' },
]
</script>

<template>
  <!-- 作用：规则 / FAQ 区容器。 -->
  <section
    v-reveal
    class="preview-card"
  >
    <h2 class="preview-section-title">
      规则与 FAQ
    </h2>
    <h3 class="preview-sub-title">
      服务器规则
    </h3>
    <!-- 作用：规则折叠列表（原生 details/summary，无需 JS 即可展开收起）。 -->
    <div class="preview-fold__group">
      <details
        v-for="(r, i) in rules"
        :key="i"
        class="preview-fold__item"
      >
        <summary class="preview-fold__summary">
          {{ i + 1 }}. {{ r.title }}
        </summary>
        <p class="preview-fold__body">
          {{ r.body }}
        </p>
      </details>
    </div>

    <h3 class="preview-sub-title">
      常见问题
    </h3>
    <!-- 作用：FAQ 折叠列表。 -->
    <div class="preview-fold__group">
      <details
        v-for="(f, i) in faqs"
        :key="`faq-${i}`"
        class="preview-fold__item"
      >
        <summary class="preview-fold__summary">
          Q{{ i + 1 }}：{{ f.q }}
        </summary>
        <p class="preview-fold__body">
          {{ f.a }}
        </p>
      </details>
    </div>
    <!-- TODO-CONTENT: 规则 / FAQ 内容待服主定制。 -->
    <p class="preview-muted preview-fold__note">
      TODO-CONTENT：规则与 FAQ 为占位文案，待服主定制后在组件数据区替换。
    </p>
  </section>
</template>

<style scoped>
/* 作用：区块内次级标题——铜黄但弱于主标题。 */
.preview-sub-title {
  margin: 0 0 10px;
  font-size: 18px;
  color: var(--preview-accent);
}

/* 作用：折叠项容器纵向排布。 */
.preview-fold__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

/* 作用：单个折叠项——暗棕底、铜黄描边。 */
.preview-fold__item {
  border: 1px solid var(--preview-line-strong);
  border-radius: 8px;
  background: var(--preview-bg-panel-soft);
  overflow: hidden;
}

/* 作用：折叠摘要（标题行）——可点击、悬停铜黄。 */
.preview-fold__summary {
  padding: 12px 14px;
  cursor: pointer;
  font-size: 15px;
  color: var(--preview-text);
  list-style: none;
  transition: background 0.2s ease, color 0.2s ease;
}

/* 作用：隐藏原生三角并自绘（用 CSS 伪元素加 + / − 提示）。 */
.preview-fold__summary::-webkit-details-marker {
  display: none;
}

.preview-fold__summary::before {
  content: '+';
  margin-right: 8px;
  color: var(--preview-accent);
}

details[open] .preview-fold__summary::before {
  content: '−';
}

.preview-fold__summary:hover {
  background: var(--preview-bg-hover);
  color: var(--preview-accent);
}

/* 作用：折叠内容正文。 */
.preview-fold__body {
  margin: 0;
  padding: 0 14px 12px 30px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--preview-text-soft);
}

/* 作用：TODO 提示。 */
.preview-fold__note {
  margin: 8px 0 0;
}
</style>
