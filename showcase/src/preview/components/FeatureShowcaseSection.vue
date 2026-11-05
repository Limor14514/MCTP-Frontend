<script setup>
/**
 * 文件用途：玩法介绍区组件
 * 作用：以「机械动力」为主题，展示服务器玩法亮点文字与 2-4 个特性卡片。
 */
// 原因：v-reveal / v-tilt 指令改为组件内局部注册（<script setup> 中 v 前缀变量自动注册为指令），
//       不再改动全局 src/main.js，保持现有框架零侵入。
import { reveal as vReveal } from '../directives/reveal'
import { tilt as vTilt } from '../directives/tilt'
// 作用：玩法亮点特性卡片数据（图标用文字符号，不引入图标库）。
// 原因：骨架阶段避免新增 npm 包，用文字符号 + 铜黄描边呈现工业感。
// TODO-CONTENT: 以下玩法文案为通用 MC 服务器文案，待服主定制具体特色玩法。
const features = [
  {
    icon: '传动',
    title: '机械自动化',
    desc: '基于 Create 机械动力模组，搭建传动网络与应力产线，从河动力水车到全自动工厂。',
  },
  {
    icon: '协作',
    title: '多人协作',
    desc: '支持多人在线协作建造，团队分工流水线作业，共建工业城邦。',
  },
  {
    icon: '工业',
    title: '工业建筑',
    desc: '工业风格建筑体系，规划厂区、仓库与交通枢纽。',
  },
  {
    icon: '活动',
    title: '定期活动',
    desc: '定期举办活动：MCGO等等小游戏。',
  },
]

// 作用：玩法总述文案。
// 原因：文字介绍放在特性卡片之前，先给访客整体印象再展示细节。
// TODO-CONTENT: 服务器玩法总述文案待服主定制。
const introText =
  '本服务器以《我的世界》机械动力（Create）模组为核心，打造基建工业风的多人生存体验。' +
  '在这里，你可以从零搭建传动系统、设计应力产线，与伙伴共建一座轰鸣运转的工业之城。'
</script>

<template>
  <!-- 作用：玩法介绍区容器；id 供顶部锚点导航定位。 -->
  <section
    id="features"
    v-reveal
    class="preview-card"
  >
    <h2 class="preview-section-title">
      玩法介绍
    </h2>
    <!-- 作用：玩法总述段落。 -->
    <p class="preview-feature__intro">
      {{ introText }}
    </p>
    <!-- 作用：特性卡片网格（2 列，窄屏 1 列）。 -->
    <div class="preview-feature__grid">
      <!-- 作用：遍历特性卡片渲染；v-reveal="i * 0.08" 让卡片依次错峰入场；v-tilt 加鼠标 3D 倾斜。 -->
      <article
        v-for="(f, i) in features"
        :key="f.title"
        v-reveal="i * 0.08"
        v-tilt="8"
        class="preview-feature__card"
      >
        <span
          class="preview-feature__icon"
          aria-hidden="true"
        >{{ f.icon }}</span>
        <h3 class="preview-feature__title">
          {{ f.title }}
        </h3>
        <p class="preview-feature__desc">
          {{ f.desc }}
        </p>
      </article>
    </div>
    <!-- TODO-CONTENT: 玩法介绍文案待服主定制（当前为通用 MC 服务器文案）。 -->
    <p class="preview-muted preview-feature__note">
      TODO-CONTENT：玩法文案为占位文案，待服主定制后在组件数据区替换。
    </p>
  </section>
</template>

<style scoped>
/* 作用：玩法总述文字样式——稍大字号、骨白文字。 */
.preview-feature__intro {
  margin: 0 0 20px;
  font-size: 16px;
  line-height: 1.8;
  color: var(--preview-text);
}

/* 作用：特性卡片双列网格。
   原因：卡片有图标+标题+描述三段内容，双列在 1100px 主容器下更舒展。 */
.preview-feature__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

/* 作用：窄屏退回单列。 */
@media (max-width: 640px) {
  .preview-feature__grid {
    grid-template-columns: 1fr;
  }
}

/* 作用：单个特性卡片——暗棕底 + 铜黄描边。 */
.preview-feature__card {
  padding: 16px;
  border: 1px solid var(--preview-line-strong);
  border-radius: 10px;
  background: var(--preview-bg-panel-soft);
}

/* 作用：特性图标——居中铜黄文字符号。 */
.preview-feature__icon {
  display: inline-block;
  padding: 2px 8px;
  border: 1px solid var(--preview-accent-deep);
  border-radius: 6px;
  font-size: 15px;
  color: var(--preview-accent);
}

/* 作用：特性标题。 */
.preview-feature__title {
  margin: 8px 0 6px;
  font-size: 18px;
  color: var(--preview-text);
}

/* 作用：特性描述。 */
.preview-feature__desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--preview-text-soft);
}

/* 作用：TODO 提示文字——弱化显示，不干扰正式内容阅读。 */
.preview-feature__note {
  margin: 16px 0 0;
}
</style>
