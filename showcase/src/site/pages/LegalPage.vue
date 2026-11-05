<script setup>
/**
 * 文件用途：协议条款页（/legal/:doc，doc = terms 用户协议 / privacy 隐私政策 / community 社区规范 / disclaimer 免责声明）
 * 外观：一张米黄色的"纸"（和反馈页的书页同色），标题是像素字，正文用普通字体保证长文可读。
 *       顶部是四份文档的切换标签；草案状态下显示醒目的"草案"提示条。
 * 正文在 content/legal.js 里改。doc 不存在时回到用户协议。
 */
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PixelText from '../components/PixelText.vue'
import { LEGAL_DOCS } from '../content/legal'

const route = useRoute()
const router = useRouter()
const doc = computed(() => LEGAL_DOCS[route.params.doc] || null)
const tabs = Object.entries(LEGAL_DOCS).map(([key, d]) => ({ key, title: d.title }))

watchEffect(() => {
  if (route.name === 'legal' && !doc.value) router.replace('/legal/terms')
})
</script>

<template>
  <main class="site-page legal-page">
    <nav class="tabs" aria-label="协议条款">
      <router-link v-for="t in tabs" :key="t.key" :to="`/legal/${t.key}`" class="tab" active-class="active">{{ t.title }}</router-link>
    </nav>

    <article v-if="doc" class="paper">
      <p v-if="doc.draft" class="draft">【草案】本文尚未定稿，内容需服务器管理团队审定后发布。</p>
      <PixelText class="title" :text="doc.title" :px="4" />
      <p class="updated">更新日期：{{ doc.updated }}</p>
      <p v-if="doc.intro" class="intro">{{ doc.intro }}</p>
      <section v-for="s in doc.sections" :key="s.h">
        <h3>{{ s.h }}</h3>
        <p v-for="(p, i) in s.p" :key="i">{{ p }}</p>
      </section>
    </article>
  </main>
</template>

<style scoped>
.legal-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: min(820px, 100%);
  margin-bottom: 14px;
}
.tab {
  padding: 8px 14px;
  font-family: var(--font-body);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  background: linear-gradient(180deg, #4b4c51, var(--casing));
  box-shadow: 0 0 0 2px var(--outline), inset 2px 2px 0 var(--casing-hi);
}
.tab:hover { color: #fff; }
.tab.active {
  color: #3a2208;
  background: linear-gradient(180deg, #f9d775, var(--brass));
  box-shadow: 0 0 0 2px var(--outline), inset 2px 2px 0 var(--brass-hi);
}
.paper {
  width: min(820px, 100%);
  padding: clamp(24px, 5vw, 56px);
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  box-shadow: 0 0 0 3px var(--outline), inset -4px -4px 0 #d8c79c, 0 20px 40px rgba(0, 0, 0, 0.5);
}
.draft {
  margin: 0 0 22px;
  padding: 8px 12px;
  font-size: 13px;
  color: #7a3b00;
  background: #ffe2a3;
  box-shadow: inset 0 0 0 2px #e0a33c;
}
.title {
  color: var(--ink);
}
.updated {
  margin: 10px 0 20px;
  font-size: 12px;
  color: rgba(59, 42, 23, 0.6);
}
.intro {
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 1.8;
}
h3 {
  margin: 26px 0 8px;
  font-size: 16px;
  color: #5e3a18;
}
section p {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.9;
}
</style>
