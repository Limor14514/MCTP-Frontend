<script setup>
/**
 * 文件用途：Showcase 展示页根组件（独立工程入口页）
 * 作用：组装「开场动画 → 主界面」的完整流程；主界面包含顶部导航（账号区 + 主题切换）、
 *       第一屏（公告区）、玩法介绍区、下载区、功能模块区（A~H）与 footer。
 * 说明：本文件由 MCTP-Frontend/src/preview/PreviewApp.vue 迁移，已做解耦：
 *       - 所有 @/preview/* 引用改为本工程内相对路径；
 *       - 三主题初始化由 src/main.js 完成（挂载前），此处不再 initTheme / clearTheme；
 *       - 路由入口为 /（无需 /preview 前缀）。
 */
import { ref } from 'vue'
// 原因：预览页主题变量与基础样式为独立 CSS 文件，需在此显式引入才会打包生效。
import './styles/theme.css'
// 原因：像素字体为本地自托管（替代 Google Fonts 在线加载，避免国内无法访问时丢失像素风）。
// 作用：Pixelify Sans 引入 400（正文）与 700（标题 h2/h3 默认加粗）两个字重，VT323 为备选只有 400；
//       fontsource 按 unicode-range 拆分字符子集，浏览器只下载页面实际用到的子集（拉丁字母）。
//       中文字符两款字体都不包含，会自动回退到字体栈中的「Microsoft YaHei」。
import '@fontsource/pixelify-sans/400.css'
import '@fontsource/pixelify-sans/700.css'
import '@fontsource/vt323/400.css'
import './styles/base.css'
import GearBackground from './components/GearBackground.vue'
import IntroAnimation from './components/IntroAnimation.vue'
import CustomCursor from './components/CustomCursor.vue'
import PreviewHeader from './components/PreviewHeader.vue'
import AnnouncementSection from './components/AnnouncementSection.vue'
import FeatureShowcaseSection from './components/FeatureShowcaseSection.vue'
import DownloadSection from './components/DownloadSection.vue'
import StatusBarSection from './components/StatusBarSection.vue'
import PlaytimeRankingSection from './components/PlaytimeRankingSection.vue'
import RulesFaqSection from './components/RulesFaqSection.vue'
import EventsTimelineSection from './components/EventsTimelineSection.vue'
import GuestbookSection from './components/GuestbookSection.vue'
import StaffSection from './components/StaffSection.vue'
import PreviewFooter from './components/PreviewFooter.vue'

// 作用：introDone=false 时显示开场动画；动画结束（或跳过）后切换为 true 展示主界面。
const introDone = ref(false)
</script>

<template>
  <!-- 作用：展示页根容器，承载三主题变量并统一字体。 -->
  <div class="preview-root">
    <!-- 作用：机械工业动态背景，铺在所有内容之下，营造纵深氛围。 -->
    <GearBackground />

    <!-- 作用：自定义光标（桌面端铜黄跟随环），覆盖开场动画与主界面。 -->
    <CustomCursor />

    <!-- 原因：开场动画用 v-if 挂载，finish 后销毁动画组件，避免其 GSAP 动画继续占用资源。 -->
    <IntroAnimation
      v-if="!introDone"
      @finish="introDone = true"
    />

    <!-- 作用：固定顶部导航——从 .preview-shell 内移出放到根层，v-if="introDone" 控制在 intro 期间不显示。
         原因：.preview-shell 的入场动画 animation 保留 transform，会使 fixed 后代的包含块变成壳层而非视口，
               导致导航栏滚动时跟随壳层离开顶部；移出后 header 的 fixed 直接相对视口，可真正固定置顶。 -->
    <PreviewHeader v-if="introDone" />

    <!-- 作用：主界面内容壳层，用 position/relative + z-index 抬到背景层之上；id 供品牌按钮返回顶部。
         原因：必须与 PreviewHeader 使用各自独立的 v-if="introDone"（而非 v-else）——
               v-else 会与紧邻的 PreviewHeader v-if 配对成互斥链，导致 introDone=true 时壳层被吞掉不渲染，
               公告/玩法/下载等主内容全部消失；改为独立 v-if 后，intro 结束导航栏与主内容同时显示。 -->
    <div
      v-if="introDone"
      id="preview-top"
      class="preview-shell"
    >
      <!-- 作用：主内容区，第一屏为公告，后续为玩法 / 下载 / 功能模块。 -->
      <main class="preview-main">
        <!-- 作用：第一屏——公告区（原广告区未迁移，展示页聚焦方向 A 重设计成果）。 -->
        <AnnouncementSection />

        <!-- 作用：玩法介绍区。 -->
        <FeatureShowcaseSection />
        <!-- 作用：下载区。 -->
        <DownloadSection />
        <!-- 作用：功能模块区：A 状态条 / B 在线时长排行 / E 规则 FAQ / F 活动 / G 留言 / H STAFF。 -->
        <StatusBarSection />
        <PlaytimeRankingSection />
        <RulesFaqSection />
        <EventsTimelineSection />
        <GuestbookSection />
        <StaffSection />
      </main>

      <PreviewFooter />
    </div>
  </div>
</template>

<style scoped>
/* 作用：主界面内容壳层——抬升到背景层（z-index 0）之上，确保内容可读可交互。
   原因：GearBackground 为 fixed 定位 z-index 0，壳层需要更高的堆叠层级。
   原因：introDone 由 false 变 true 时壳层挂载，播放「从下方轻微上移 + 淡入」入场动画，
        与 IntroAnimation 遮罩向上滑出退场形成上下衔接的进入效果（遮罩上滑 0.55s → 主界面上移淡入 0.6s）。 */
.preview-shell {
  position: relative;
  z-index: 1;
  /* 原因：顶部导航已移出壳层并 fixed 置顶（高度约 64px），主内容需在顶部预留导航高度，避免第一屏被遮挡；
          叠加刘海屏安全区（顶栏自身也叠加了 safe-area，二者保持一致）。 */
  padding-top: calc(72px + env(safe-area-inset-top));
  animation: preview-shell-enter 0.6s ease-out both;
}

/* 作用：主界面壳层入场动画——从下方轻微上移 + 淡入。
   原因：与启动遮罩向上滑出呼应，形成「上滑 + 上移」的上下连贯进入效果；0.6s 略长于遮罩 0.55s，衔接不重叠。 */
@keyframes preview-shell-enter {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
