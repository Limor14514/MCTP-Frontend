<script setup>
/**
 * 文件用途：功能 G——玩家留言 / 评论组件
 * 作用：提供留言表单（昵称 + 内容）与留言列表，前端交互真实可用，并用 localStorage 持久化模拟后端。
 */
// 原因：v-reveal / v-tilt 指令改为组件内局部注册（<script setup> 中 v 前缀变量自动注册为指令），
//       不再改动全局 src/main.js，保持现有框架零侵入。
import { reveal as vReveal } from '../directives/reveal'
import { ref, watch, onMounted } from 'vue'

// 作用：localStorage 存储键（加 preview 前缀避免与其他模块冲突）。
const STORAGE_KEY = 'mctp-preview-guestbook'

// 作用：留言列表（初始为空，从 localStorage 恢复）。
// 原因：Vue 响应式 ref，push 后自动更新视图。
const messages = ref([])

// 作用：留言表单字段（昵称 + 内容）。
const nickname = ref('')
const content = ref('')

// 作用：加载历史留言（组件挂载时从 localStorage 读取）。
// 原因：localStorage 只能存字符串，需 JSON 解析为数组。
onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) messages.value = JSON.parse(raw)
  } catch (e) {
    // 原因：历史数据损坏时降级为空列表，不让页面崩溃。
    messages.value = []
  }
})

// 作用：留言列表变化时自动持久化。
// 原因：提交后无需手动再存一次，监听变化统一写入 localStorage。
watch(
  messages,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      // 原因：存储失败（如隐私模式）时忽略，不影响当前会话展示。
    }
  },
  { deep: true }
)

// 作用：提交留言。
// 原因：校验输入非空并构造留言对象插入列表；真实场景由后端接口完成持久化。
// TODO-BACKEND: 待对接后端留言接口后，改用已预留的封装 ./api/guestbook.js
//               （guestbookApi.create / guestbookApi.list），当前用 localStorage 模拟。
function submitMessage() {
  const name = nickname.value.trim()
  const text = content.value.trim()
  if (!name || !text) return
  messages.value.unshift({
    id: Date.now(),
    name,
    text,
    time: new Date().toISOString(),
  })
  content.value = ''
}

// 作用：格式化留言时间（ISO 转 本地 年-月-日 时:分）。
// 原因：ISO 字符串不便直接展示，转为可读的本地时间文本。
function formatTime(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <!-- 作用：玩家留言区容器；id 供顶部锚点导航定位。 -->
  <section
    id="guestbook"
    v-reveal
    class="preview-card"
  >
    <h2 class="preview-section-title">
      玩家留言
    </h2>
    <!-- 作用：留言表单——昵称 + 内容 + 提交按钮。 -->
    <form
      class="preview-guest__form"
      @submit.prevent="submitMessage"
    >
      <input
        v-model="nickname"
        class="preview-guest__input"
        type="text"
        maxlength="20"
        placeholder="昵称（20 字内）"
      >
      <textarea
        v-model="content"
        class="preview-guest__textarea"
        maxlength="200"
        placeholder="想说的话（200 字内）"
      />
      <button
        type="submit"
        class="preview-btn"
      >
        发表留言
      </button>
    </form>
    <!-- 作用：留言列表。 -->
    <ul class="preview-guest__list">
      <li
        v-for="m in messages"
        :key="m.id"
        class="preview-guest__item"
      >
        <span class="preview-guest__name">{{ m.name }}</span>
        <span class="preview-guest__time">{{ formatTime(m.time) }}</span>
        <p class="preview-guest__text">
          {{ m.text }}
        </p>
      </li>
    </ul>
    <!-- 作用：空状态提示（无留言时显示）。 -->
    <p
      v-if="messages.length === 0"
      class="preview-muted preview-guest__empty"
    >
      还没有留言，来抢沙发吧。
    </p>
    <!-- TODO-BACKEND: 留言持久化为 localStorage 模拟，待对接后端留言接口。 -->
    <p class="preview-muted preview-guest__note">
      TODO-BACKEND：留言当前使用 localStorage 本地模拟，刷新页面仍保留，待对接后端留言接口。
    </p>
  </section>
</template>

<style scoped>
/* 作用：留言表单纵向排布。 */
.preview-guest__form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

/* 作用：昵称输入框——暗棕底、铜黄聚焦描边。 */
.preview-guest__input,
.preview-guest__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--preview-line-strong);
  border-radius: 8px;
  background: var(--preview-bg);
  color: var(--preview-text);
  font-family: inherit;
  font-size: 14px;
}

.preview-guest__input:focus,
.preview-guest__textarea:focus {
  outline: none;
  border-color: var(--preview-accent);
}

/* 作用：留言内容框固定高度并允许纵向滚动。 */
.preview-guest__textarea {
  min-height: 90px;
  resize: vertical;
}

/* 作用：提交按钮左对齐（宽度自适应内容）。 */
.preview-guest__form .preview-btn {
  align-self: flex-start;
}

/* 作用：留言列表无默认样式。 */
.preview-guest__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 作用：单条留言——暗棕底圆角块。 */
.preview-guest__item {
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--preview-bg-panel-soft);
  border: 1px solid var(--preview-line);
}

/* 作用：留言者昵称——铜黄。 */
.preview-guest__name {
  color: var(--preview-accent);
  font-size: 14px;
}

/* 作用：留言时间——次要文字，与昵称同行。 */
.preview-guest__time {
  margin-left: 10px;
  font-size: 12px;
  color: var(--preview-text-soft);
}

/* 作用：留言正文。 */
.preview-guest__text {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--preview-text);
}

/* 作用：空状态 / TODO 提示。 */
.preview-guest__empty,
.preview-guest__note {
  margin: 12px 0 0;
}
</style>
