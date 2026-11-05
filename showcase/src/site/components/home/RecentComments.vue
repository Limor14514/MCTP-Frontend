<script setup>
/**
 * 文件用途：主页面最后一个板块的右半——"最近评论"
 * 每条：像素头像 + 玩家名 + 评论于哪里（画廊 · 作品名，可点击跳转）+ 评论内容 + 多久之前。
 * 现状：可评论的功能（画廊、蓝图站等）还没做，接口返回空列表时，面板正中显示"近期暂无评论哦"。
 * 时间每分钟刷新一次（"刚刚"会变成"1 分钟前"）。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import CreatePanel from './CreatePanel.vue'
import PixelAvatar from './PixelAvatar.vue'
import PixelText from '../PixelText.vue'
import { fetchRecentComments, kindLabel, timeAgo } from '../../services/comments'

const list = ref([])
const loading = ref(true)
const failed = ref(false)
const now = ref(Date.now())
let tick

onMounted(async () => {
  tick = setInterval(() => (now.value = Date.now()), 60000)
  try {
    list.value = await fetchRecentComments(6)
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
})
onBeforeUnmount(() => clearInterval(tick))
</script>

<template>
  <CreatePanel class="recent">
    <div class="inner">
      <header class="head">
        <PixelText text="最近评论" :px="3" />
      </header>

      <p v-if="loading" class="state">正在读取评论…</p>
      <p v-else-if="failed" class="state">评论加载失败，请稍后刷新重试。</p>
      <p v-else-if="!list.length" class="state is-empty">近期暂无评论哦</p>

      <ul v-else class="list">
        <li v-for="c in list" :key="c.id" class="item">
          <PixelAvatar class="avatar" :uid="c.uid" :src="c.avatar || ''" :size="40" />
          <div class="body">
            <div class="meta">
              <span class="name">{{ c.name }}</span>
              <span class="where">评论了
                <router-link :to="c.target.to" class="target">{{ kindLabel(c.target.kind) }} · {{ c.target.title }}</router-link>
              </span>
            </div>
            <p class="text">{{ c.text }}</p>
            <time class="time" :datetime="c.at">{{ timeAgo(c.at, now) }}</time>
          </div>
        </li>
      </ul>
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
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  margin-bottom: 18px;
}
.state {
  margin: 0;
  text-align: center;
  font-family: var(--font-body);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}
/* 没有评论：文字在面板正中（上下左右都居中） */
.state.is-empty {
  flex: 1;
  display: grid;
  place-items: center;
  min-height: 200px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}
.list {
  flex: 1;
  max-height: 420px;
  overflow-y: auto;
  margin: 0;
  padding: 0 6px 0 0;
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: var(--brass-mid) transparent;
}
.item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
}
.item + .item {
  border-top: 2px dashed rgba(255, 255, 255, 0.08);
}
.avatar {
  flex: none;
}
.body {
  min-width: 0;
  font-family: var(--font-body);
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  font-size: 13px;
}
.name {
  font-family: var(--font-pixel);
  font-size: 15px;
  color: #fff;
}
.where {
  color: rgba(255, 255, 255, 0.45);
}
.target {
  color: var(--brass);
}
.target:hover {
  color: var(--brass-hi);
  text-decoration: underline;
}
.text {
  margin: 4px 0 2px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  overflow-wrap: anywhere;
}
.time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
