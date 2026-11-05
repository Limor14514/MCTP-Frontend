<script setup>
/**
 * 文件用途：新版站点外壳（所有新页面的父路由组件）
 * 层级（z-index 由低到高）：页面 router-view → 导航栏 100 → 首次加载页 1100 → 转场 1200
 * 流程：打开网站 → BootLoader 播放并真实追踪加载 → 满格后播放转场（加载页 → 索引页）：
 *       透过 M 看到的是加载页，屏幕盖黑时卸载加载页，A 揭开的就是索引页；
 *       转场结束 booted=true → 导航栏掉落回弹 + 索引页入场动画。
 *       之后的页面跳转全部由路由守卫调用同一个转场。
 * 演示标记：右下角常驻"演示站 · 数据为本地模拟"（DemoBadge.vue），正式上线时删掉。
 * 页脚：除索引页外（索引页是全屏 3D，自己在最后一段放精简页脚），所有页面最下面自动加 SiteFooter。
 */
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import BootLoader from './components/BootLoader.vue'
import PageTransition from './components/PageTransition.vue'
import SiteNav from './components/SiteNav.vue'
import SiteFooter from './components/SiteFooter.vue'
import DemoBadge from './components/DemoBadge.vue'
import { booted } from './siteState'
import { playTransition } from './composables/usePageTransition'
import './styles/site.css'

const route = useRoute()
const showLoader = ref(!booted.value)

function onBootDone() {
  playTransition({
    onCovered: () => (showLoader.value = false),
  }).then(() => (booted.value = true))
}
</script>

<template>
  <div class="site-shell">
    <router-view />
    <SiteFooter v-if="route.name && route.name !== 'index'" />
    <SiteNav :show="booted" />
    <DemoBadge v-if="booted" />
    <BootLoader v-if="showLoader" @done="onBootDone" />
    <PageTransition />
  </div>
</template>
