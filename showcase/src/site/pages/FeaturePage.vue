<script setup>
/**
 * 文件用途：功能区各入口的介绍页（/home/f/:key）
 * 现状：整合包、蓝图站等 7 个功能都还【待开发】（没有后端接口），这里先展示：
 *       图标、名称、一句话说明、计划中的功能清单、权限说明（是否要登录 / 是否需管理员审核）。
 *       正式开发某个功能时，给它单独建页面组件，再把路由从这里换过去即可。
 * key 不存在（或是"敬请期待"）时回到主页面。
 */
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CreatePanel from '../components/home/CreatePanel.vue'
import PixelIcon from '../components/PixelIcon.vue'
import PixelText from '../components/PixelText.vue'
import { featureByKey } from '../content/features'
import { isLoggedIn } from '../services/account'

const route = useRoute()
const router = useRouter()
const feature = computed(() => featureByKey(route.params.key))

watchEffect(() => {
  if (route.name === 'feature' && !feature.value) router.replace('/home')
})
</script>

<template>
  <main class="site-page feature-page">
    <CreatePanel v-if="feature" class="box">
      <div class="inner">
        <PixelIcon class="icon" :icon="feature.icon" :size="128" :label="feature.name" />
        <div class="head">
          <span class="en">{{ feature.en }}</span>
          <PixelText :text="feature.name" :px="4" />
          <p class="desc">{{ feature.desc }}</p>
        </div>

        <ul class="rules">
          <li v-if="feature.upload">上传需要先登录<span v-if="!isLoggedIn" class="warn">（你当前未登录）</span></li>
          <li v-if="feature.review">上传的内容需要管理员审核通过后才会公开</li>
          <li v-if="!feature.upload">浏览无需登录</li>
        </ul>

        <section class="plans">
          <h3>计划中的功能</h3>
          <ol>
            <li v-for="p in feature.plans" :key="p">{{ p }}</li>
          </ol>
        </section>

        <p class="todo">【待开发】此功能尚未上线，敬请期待。</p>
        <router-link to="/home" class="mc-btn is-ghost"><PixelText text="← 返回主页面" :px="2" /></router-link>
      </div>
    </CreatePanel>
  </main>
</template>

<style scoped>
.feature-page {
  display: grid;
  place-items: center;
}
.box {
  width: min(720px, 100%);
}
.inner {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px 32px;
  padding: clamp(24px, 4vw, 44px);
}
.icon {
  filter: drop-shadow(0 6px 0 rgba(0, 0, 0, 0.5));
}
.head {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  color: #fff;
}
.en {
  font-family: var(--font-pixel);
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--brass);
}
.desc {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(255, 255, 255, 0.7);
}
.rules,
.plans,
.todo,
.inner > .mc-btn {
  grid-column: 1 / -1;
}
.rules {
  margin: 0;
  padding: 12px 16px 12px 32px;
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.06);
}
.warn {
  color: #ff9a6b;
}
.plans h3 {
  margin: 0 0 10px;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--brass);
}
.plans ol {
  margin: 0;
  padding-left: 22px;
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.85);
}
.todo {
  margin: 0;
  font-family: var(--font-body);
  font-size: 13px;
  color: rgba(255, 214, 120, 0.75);
}
.inner > .mc-btn {
  justify-self: start;
}
@media (max-width: 560px) {
  .inner { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .head { align-items: center; }
  .inner > .mc-btn { justify-self: center; }
}
</style>
