<script setup>
/**
 * 文件用途：公告可视化编辑（仅管理员）——从主页面公告板的"编辑公告"跳转过来
 * 布局：左边是选项卡列表与表单，右边是实时预览（和主页面同一个翻牌显示器组件）。
 * 可编辑：每个选项卡的 封面（图片链接或上传图片）/ 大标题（必填）/ 小标题 / 跳转链接（选填）；
 *         可新增、删除、上移、下移；最少 1 个、最多 10 个。
 * 保存：校验通过后写入公告数据（目前为本地模拟，见 services/announcements.js），返回主页面即可看到。
 * 上传的图片会先在浏览器里缩小到最宽 960px 并转成 JPEG，避免存储空间被大图撑爆。
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import FlapBoard from '../components/home/FlapBoard.vue'
import PixelText from '../components/PixelText.vue'
import { isAdmin } from '../services/account'
import {
  announcements, blankTab, normalize, saveAnnouncements, validate, MAX_TABS, MIN_TABS,
} from '../services/announcements'

const router = useRouter()
const draft = ref(announcements.value.map((a) => ({ ...a })))
const active = ref(0)
const saving = ref(false)
const message = ref('')
const errors = computed(() => validate(draft.value.map(normalize)))
const cur = computed(() => draft.value[active.value])

function add() {
  if (draft.value.length >= MAX_TABS) return
  draft.value.push(blankTab())
  active.value = draft.value.length - 1
}
function remove(i) {
  if (draft.value.length <= MIN_TABS) return
  draft.value.splice(i, 1)
  active.value = Math.min(active.value, draft.value.length - 1)
}
function move(i, d) {
  const j = i + d
  if (j < 0 || j >= draft.value.length) return
  const list = draft.value
  ;[list[i], list[j]] = [list[j], list[i]]
  active.value = j
}

/** 作用：把上传的图片缩小到最宽 960px、转成 JPEG 的 data URL */
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, 960 / img.width)
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    img.src = url
  })
}

async function onUpload(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    message.value = '请选择图片文件'
    return
  }
  try {
    cur.value.cover = await shrinkImage(file)
  } catch (err) {
    message.value = err.message
  }
}

async function save() {
  message.value = ''
  saving.value = true
  try {
    await saveAnnouncements(draft.value)
    message.value = '已保存'
    setTimeout(() => router.push('/home'), 600)
  } catch (err) {
    message.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="site-page edit-page">
    <div v-if="!isAdmin" class="deny">
      <PixelText text="需要管理员账号" :px="3" />
      <p>只有管理员可以编辑公告。</p>
      <router-link to="/home" class="mc-btn is-ghost">返回主页面</router-link>
    </div>

    <template v-else>
      <header class="top">
        <PixelText text="编辑公告" :px="4" />
        <div class="actions">
          <router-link to="/home" class="mc-btn is-ghost">取消</router-link>
          <button type="button" class="mc-btn" :disabled="saving || errors.length > 0" @click="save">
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>
      </header>
      <!-- 评审要求：管理员功能要明确标注为演示 -->
      <p class="demo-note">演示功能：这里的"管理员"是本地模拟的账号，没有真实鉴权；保存的公告只存在你自己的浏览器里。</p>
      <p v-if="message" class="msg" :class="{ ok: message === '已保存' }">{{ message }}</p>
      <ul v-if="errors.length" class="errs">
        <li v-for="e in errors" :key="e">{{ e }}</li>
      </ul>

      <div class="layout">
        <!-- 左：选项卡列表 + 表单 -->
        <section class="editor">
          <div class="list">
            <button
              v-for="(a, i) in draft"
              :key="a.id"
              type="button"
              class="item"
              :class="{ on: i === active }"
              @click="active = i"
            >
              <span class="no">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="t">{{ a.title || '（无标题）' }}</span>
            </button>
            <button type="button" class="mc-btn is-ghost add" :disabled="draft.length >= MAX_TABS" @click="add">
              + 新增选项卡（{{ draft.length }}/{{ MAX_TABS }}）
            </button>
          </div>

          <div v-if="cur" class="form">
            <label>
              <span>封面</span>
              <div class="cover-row">
                <input v-model="cur.cover" class="mc-input" placeholder="图片链接（https://…）或点右边上传" />
                <label class="mc-btn is-ghost upload">
                  上传
                  <input type="file" accept="image/*" hidden @change="onUpload" />
                </label>
                <button v-if="cur.cover" type="button" class="mc-btn is-ghost" @click="cur.cover = ''">清除</button>
              </div>
            </label>
            <label>
              <span>大标题 <em>*</em></span>
              <input v-model="cur.title" class="mc-input" maxlength="24" placeholder="必填，最多 24 字" />
            </label>
            <label>
              <span>小标题</span>
              <input v-model="cur.subtitle" class="mc-input" maxlength="48" placeholder="选填，最多 48 字" />
            </label>
            <label>
              <span>跳转链接</span>
              <input v-model="cur.link" class="mc-input" placeholder="选填：https://… 或站内路径如 /feedback；无需跳转请留空" />
            </label>
            <div class="row-actions">
              <button type="button" class="mc-btn is-ghost" :disabled="active === 0" @click="move(active, -1)">上移</button>
              <button type="button" class="mc-btn is-ghost" :disabled="active === draft.length - 1" @click="move(active, 1)">下移</button>
              <button type="button" class="mc-btn is-ghost danger" :disabled="draft.length <= MIN_TABS" @click="remove(active)">删除此选项卡</button>
            </div>
          </div>
        </section>

        <!-- 右：实时预览 -->
        <section class="preview">
          <p class="label">实时预览</p>
          <FlapBoard v-model="active" :items="draft" preview />
        </section>
      </div>
    </template>
  </main>
</template>

<style scoped>
.edit-page {
  max-width: 1280px;
  margin: 0 auto;
}
.deny {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 18vh;
  color: rgba(255, 255, 255, 0.7);
}
.demo-note {
  margin: 0 0 12px;
  padding: 8px 12px;
  font-size: 14px;
  color: #1a1206;
  background: #ffb347;
  box-shadow: 0 0 0 2px var(--outline);
}
.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.actions { display: flex; gap: 14px; }
.msg {
  margin: 14px 0 0;
  color: #ff8a7a;
  font-size: 14px;
}
.msg.ok { color: #80c71f; }
.errs {
  margin: 10px 0 0;
  padding-left: 18px;
  color: #ff8a7a;
  font-size: 13px;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 32px;
  margin-top: 28px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}
.item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border: 0;
  background: #1c1d21;
  color: rgba(255, 255, 255, 0.7);
  font-family: var(--font-ui);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 0 0 2px var(--outline);
}
.item.on {
  color: #fff;
  box-shadow: 0 0 0 2px var(--brass);
}
.no { opacity: 0.5; }
.t { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.add { align-self: flex-start; margin-top: 8px; font-size: 13px; }
.form {
  display: grid;
  gap: 16px;
}
.form > label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
}
em { color: #ff8a7a; font-style: normal; }
.cover-row {
  display: flex;
  gap: 10px;
}
.cover-row .mc-btn { flex: none; font-size: 13px; padding: 8px 12px; }
.upload { cursor: pointer; }
.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.row-actions .mc-btn { font-size: 13px; padding: 8px 12px; }
.danger { color: #ffb0a6; }
.label {
  margin: 0 0 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
}
</style>
