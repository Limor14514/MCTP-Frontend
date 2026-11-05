<script setup>
/**
 * 文件用途：功能 H——管理组成员（STAFF）展示组件
 * 作用：以卡片式列表展示管理组成员（称号 / ID / 职责），模拟数据可自定义。
 */
// 原因：v-reveal / v-tilt 指令改为组件内局部注册（<script setup> 中 v 前缀变量自动注册为指令），
//       不再改动全局 src/main.js，保持现有框架零侵入。
import { reveal as vReveal } from '../directives/reveal'
import { tilt as vTilt } from '../directives/tilt'
// 作用：管理组成员数据。
// TODO-CONTENT: 成员为模拟数据，待服主替换为真实管理组名单与职责。
const staffs = [
  { title: '服主', name: 'Under_p', duty: '服务器整体运营与版本决策' },
  { title: '技术管理员', name: 'Self、Qisumei', duty: '模组整合、服务器维护与性能优化' },
  { title: '建筑管理员', name: 'Limor', duty: '主城规划、建筑审核与保护' },
  { title: '社区管理员', name: 'Limor、Gouko', duty: '玩家反馈、活动策划与纠纷仲裁' },
]
</script>

<template>
  <!-- 作用：管理组区容器。 -->
  <section
    v-reveal
    class="preview-card"
  >
    <h2 class="preview-section-title">
      STAFF 管理组
    </h2>
    <!-- 作用：成员卡片网格（2 列，窄屏 1 列）；v-reveal="i * 0.08" 依次错峰入场。 -->
    <div class="preview-staff__grid">
      <!-- 作用：遍历成员渲染卡片；v-tilt 加鼠标 3D 倾斜。 -->
      <article
        v-for="(s, i) in staffs"
        :key="s.name"
        v-reveal="i * 0.08"
        v-tilt="8"
        class="preview-staff__card"
      >
        <span class="preview-staff__title">{{ s.title }}</span>
        <span class="preview-staff__name">{{ s.name }}</span>
        <p class="preview-staff__duty">
          {{ s.duty }}
        </p>
      </article>
    </div>
    <!-- TODO-CONTENT: 管理组成员为模拟数据，可自定义。 -->
    <p class="preview-muted preview-staff__note">
      TODO-CONTENT：管理组成员为模拟数据，待服主替换为真实名单。
    </p>
  </section>
</template>

<style scoped>
/* 作用：成员卡片双列网格。 */
.preview-staff__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 640px) {
  .preview-staff__grid {
    grid-template-columns: 1fr;
  }
}

/* 作用：单个成员卡片——暗棕底 + 铜黄描边，纵向排布。 */
.preview-staff__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--preview-line-strong);
  border-radius: 10px;
  background: var(--preview-bg-panel-soft);
}

/* 作用：称号——铜黄小标签。 */
.preview-staff__title {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--preview-accent);
  color: #2b2118;
  font-size: 12px;
}

/* 作用：成员 ID。 */
.preview-staff__name {
  font-size: 20px;
  color: var(--preview-text);
}

/* 作用：职责描述。 */
.preview-staff__duty {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--preview-text-soft);
}

/* 作用：TODO 提示。 */
.preview-staff__note {
  margin: 16px 0 0;
}
</style>
