<script setup>
/**
 * 文件用途：下载区组件
 * 作用：提供客户端下载入口（Java 版 / 基岩版 / 整合包 占位按钮），
 *       高亮「当前推荐版本」，服主定版后访客一眼可见主推入口。
 */
// 原因：v-reveal / v-tilt 指令改为组件内局部注册（<script setup> 中 v 前缀变量自动注册为指令），
//       不再改动全局 src/main.js，保持现有框架零侵入。
import { reveal as vReveal } from '../directives/reveal'
import { tilt as vTilt } from '../directives/tilt'
// 作用：下载项数据（版本类型 + 说明 + 占位链接 + 是否推荐）。
// 原因：下载链接尚未确定，href 留空表示「待补」，后续对接后端或静态资源时填入真实地址即可。
// 原因：按需求移除「基岩版客户端」（Java 版 Forge 模组服，基岩版无法进入）。
// TODO-BACKEND: 两个下载地址均待补（href 为空字符串）；recommended 由服主定版后调整。
// TODO-CONTENT: label（标题）/ desc（说明）文案可直接在下方修改。
const downloads = [
  {
    id: 'java',
    label: 'Java 版客户端',
    desc: 'PC 端 / Forge + Create 机械动力整合',
    href: '',
    recommended: true,
  },
  {
    id: 'pack',
    label: '整合包下载',
    desc: '含全部模组与配置的打包文件',
    href: '',
    recommended: false,
  },
]
</script>

<template>
  <!-- 作用：下载区容器；id 供顶部锚点导航定位。 -->
  <section
    id="downloads"
    v-reveal
    class="preview-card"
  >
    <h2 class="preview-section-title">
      下载区
    </h2>
    <!-- 作用：下载项列表（两按钮并排，窄屏纵向）；v-reveal 错峰入场 + v-tilt 鼠标 3D 倾斜。 -->
    <div class="preview-download__grid">
      <a
        v-for="(d, i) in downloads"
        :key="d.id"
        v-reveal="i * 0.1"
        v-tilt="6"
        :href="d.href || '#'"
        class="preview-download__item"
        :class="[`--${d.id}`, { 'is-recommended': d.recommended }]"
        :aria-disabled="!d.href"
        @click="!d.href && $event.preventDefault()"
      >
        <!-- 原因：站点使用 hash 路由，占位链接 href="#" 被点击会把地址改成「#」从而跳回首页、离开预览页；
             因此 href 为空（待补）时拦截默认跳转，填入真实地址后自动恢复正常跳转。 -->
        <!-- 作用：推荐徽章（仅推荐版本显示）。 -->
        <span
          v-if="d.recommended"
          class="preview-download__badge"
        >推荐版本</span>
        <span class="preview-download__label">{{ d.label }}</span>
        <span class="preview-download__desc">{{ d.desc }}</span>
        <span class="preview-download__action">立即下载</span>
      </a>
    </div>
    <!-- TODO-ASSET: 下载区图标素材待补；TODO-BACKEND: 下载地址待补。 -->
    <p class="preview-muted preview-download__note">
      TODO-BACKEND：下载地址为占位链接（点击无跳转），确定下载源后填入 href 即可；「推荐版本」由服主定版后调整。
    </p>
  </section>
</template>

<style scoped>
/* 作用：下载项两列网格。
   原因：移除基岩版后剩 Java 版 + 整合包两个入口，均等两列并排视觉均衡；窄屏纵向堆叠。 */
.preview-download__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 720px) {
  .preview-download__grid {
    grid-template-columns: 1fr;
  }
}

/* 作用：单个下载项——卡片式链接，铜黄描边。 */
.preview-download__item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 16px;
  border: 1px solid var(--preview-line-strong);
  border-radius: 10px;
  background: var(--preview-bg-panel-soft);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

/* 作用：悬停时铜黄描边 + 上浮，明确可点击反馈。 */
.preview-download__item:hover {
  border-color: var(--preview-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px var(--preview-shadow);
}

/* 作用：推荐版本高亮——亮版铜黄描边 + 微亮底，明显区别于其它入口。
   视觉精修：边框/描边改用 --preview-accent-bright，成为下载区的亮色点缀。 */
.preview-download__item.is-recommended {
  border-color: var(--preview-accent-bright);
  background: color-mix(in srgb, var(--preview-accent-bright) 12%, var(--preview-bg-panel-soft));
  box-shadow: 0 0 0 1px var(--preview-accent-bright);
}

/* 作用：推荐徽章——右上角小标签（亮版强调色，增强推荐入口可见性）。 */
.preview-download__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--preview-accent-bright);
  color: #2b2118;
  font-size: 11px;
}

/* 作用：下载项标题。 */
.preview-download__label {
  font-size: 18px;
  color: var(--preview-text);
}

/* 作用：下载项说明文字。 */
.preview-download__desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--preview-text-soft);
}

/* 作用：下载动作文字——亮版铜黄强调。
   视觉精修：改用 --preview-accent-bright，与推荐徽章形成下载区亮色点缀。 */
.preview-download__action {
  margin-top: auto;
  color: var(--preview-accent-bright);
  font-size: 14px;
}

/* 作用：TODO 提示。 */
.preview-download__note {
  margin: 16px 0 0;
}
</style>
