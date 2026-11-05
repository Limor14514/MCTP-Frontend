<script setup>
/**
 * 文件用途：反馈页——《我的世界》"书与笔"风格
 * 页面：一本翻开的像素书。
 *   左页：分类（Bug / 建议 / 举报 / 申诉 / 其他 + 自定义分类）、
 *         被举报账号 UID（选"举报"时出现，选填）、截图（选填，最多 3 张，每张 ≤ 5MB）；
 *   右页：反馈内容（必填，最多 1000 字），下面是署名和"署名并提交"按钮。
 * 提交后：右页连同封底向左翻过来，把书合上 → 合上的书缩小、变成"书与笔"物品图标 →
 *         下方出现像素字"感谢您的反馈，我们将在7个兰猫日给您反馈"。
 * 手机竖屏两页上下排列，提交时改为整本书压扁收起，再变成物品图标。
 * 提交目前为本地模拟（services/feedback.js），后端接口建议见该文件注释。
 */
import { computed, nextTick, onBeforeUnmount, reactive, ref } from 'vue'
import gsap from 'gsap'
import PixelText from '../components/PixelText.vue'
import BookQuillIcon from '../components/feedback/BookQuillIcon.vue'
import { account } from '../services/account'
import {
  CATEGORIES, MAX_CONTENT, MAX_SHOTS, MAX_SHOT_MB, submitFeedback, validateFeedback,
} from '../services/feedback'

const THANKS = '感谢您的反馈，我们将在7个兰猫日给您反馈'

const form = reactive({ category: '', customCategory: '', reportedUid: '', content: '', shots: [] })
const errors = ref({})
const tried = ref(false)
const stage = ref('write') // write | sending | closing | done
const bookRef = ref(null)
const leafRef = ref(null)
const doneRef = ref(null)
const shotMsg = ref('')

const signer = computed(() => account.value?.name || '匿名玩家')
const count = computed(() => form.content.length)

function pickCategory(v) {
  form.category = v
  if (tried.value) errors.value = validateFeedback(form)
}

function addShots(e) {
  shotMsg.value = ''
  const files = [...(e.target.files || [])]
  e.target.value = ''
  for (const file of files) {
    if (form.shots.length >= MAX_SHOTS) {
      shotMsg.value = `最多 ${MAX_SHOTS} 张截图`
      break
    }
    if (!file.type.startsWith('image/')) {
      shotMsg.value = '只能上传图片'
      continue
    }
    if (file.size > MAX_SHOT_MB * 1024 * 1024) {
      shotMsg.value = `每张截图不能超过 ${MAX_SHOT_MB}MB`
      continue
    }
    form.shots.push({ file, url: URL.createObjectURL(file) })
  }
}
function removeShot(i) {
  URL.revokeObjectURL(form.shots[i].url)
  form.shots.splice(i, 1)
}

async function submit() {
  tried.value = true
  errors.value = validateFeedback(form)
  if (Object.keys(errors.value).length) return
  stage.value = 'sending'
  try {
    await submitFeedback(form, account.value?.uid ?? null)
  } catch {
    stage.value = 'write'
    errors.value = { content: '提交失败，请稍后再试' }
    return
  }
  playClose()
}

/** 作用：合上书 → 变成物品图标 → 显示感谢文字 */
function playClose() {
  stage.value = 'closing'
  const book = bookRef.value
  const narrow = window.matchMedia('(max-width: 760px)').matches
  const tl = gsap.timeline({
    onComplete: async () => {
      stage.value = 'done'
      await nextTick()
      const el = doneRef.value
      gsap.timeline()
        .fromTo(el.querySelector('.item'), { scale: 0, rotate: -20 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(2)' })
        .fromTo(el.querySelectorAll('.thanks, .again'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.2 }, '-=0.1')
    },
  })
  if (narrow) {
    tl.to(book, { scaleY: 0.04, duration: 0.6, ease: 'power2.in' })
      .to(book, { scaleX: 0.1, autoAlpha: 0, duration: 0.35, ease: 'power2.in' })
  } else {
    // 右页（背面是封底）绕书脊向左翻过来盖住左页，书就合上了；再把合上的书移到中间、缩小消失
    tl.to(leafRef.value, { rotateY: -180, duration: 1.1, ease: 'power2.inOut' })
      // 合上后右半边只剩空的封皮，裁掉它，只留下合起来的那本书
      .fromTo(book, { clipPath: 'inset(-40px 0% -40px -40px)' }, { clipPath: 'inset(-40px 50% -40px -40px)', duration: 0.25, ease: 'power1.in' })
      .to(book, { xPercent: 25, duration: 0.5, ease: 'power2.inOut' }, '+=0.1')
      .to(book, { scale: 0.18, autoAlpha: 0, duration: 0.45, ease: 'power2.in' })
  }
}

function again() {
  form.shots.forEach((s) => URL.revokeObjectURL(s.url))
  Object.assign(form, { category: '', customCategory: '', reportedUid: '', content: '', shots: [] })
  errors.value = {}
  tried.value = false
  stage.value = 'write'
}

onBeforeUnmount(() => form.shots.forEach((s) => URL.revokeObjectURL(s.url)))
</script>

<template>
  <main class="site-page feedback-page">
    <!-- 书 -->
    <div v-if="stage !== 'done'" ref="bookRef" class="book" :class="{ busy: stage !== 'write' }">
      <!-- 左页 -->
      <section class="page left">
        <PixelText class="ink" text="书与笔" :px="3" />
        <p class="sub">写下你的反馈，我们会认真阅读每一页。</p>

        <div class="field">
          <span class="lbl">分类 <em>*</em></span>
          <div class="cats" role="radiogroup" aria-label="反馈分类">
            <button
              v-for="c in CATEGORIES"
              :key="c.value"
              type="button"
              role="radio"
              class="cat"
              :class="{ on: form.category === c.value }"
              :aria-checked="form.category === c.value"
              @click="pickCategory(c.value)"
            >{{ c.label }}</button>
          </div>
          <span v-if="errors.category" class="err">{{ errors.category }}</span>
        </div>

        <label v-if="form.category === 'other'" class="field">
          <span class="lbl">自定义分类 <em>*</em></span>
          <input v-model="form.customCategory" class="paper-input" maxlength="16" placeholder="例如：活动、账号问题…" />
          <span v-if="errors.customCategory" class="err">{{ errors.customCategory }}</span>
        </label>

        <label v-if="form.category === 'report'" class="field">
          <span class="lbl">被举报账号 UID（选填）</span>
          <input v-model="form.reportedUid" class="paper-input" inputmode="numeric" maxlength="12" placeholder="只填数字" />
          <span v-if="errors.reportedUid" class="err">{{ errors.reportedUid }}</span>
        </label>

        <div class="field">
          <span class="lbl">截图（选填，最多 {{ MAX_SHOTS }} 张，每张 ≤ {{ MAX_SHOT_MB }}MB）</span>
          <div class="shots">
            <div v-for="(s, i) in form.shots" :key="s.url" class="shot">
              <img :src="s.url" :alt="s.file.name" />
              <button type="button" class="x" aria-label="移除这张截图" @click="removeShot(i)">×</button>
            </div>
            <label v-if="form.shots.length < MAX_SHOTS" class="shot add">
              <span>+</span>
              <input type="file" accept="image/*" multiple hidden @change="addShots" />
            </label>
          </div>
          <span v-if="shotMsg" class="err">{{ shotMsg }}</span>
        </div>
      </section>

      <!-- 右页（能翻动的一页：正面是内容，背面是封底） -->
      <div ref="leafRef" class="leaf">
        <section class="page right leaf-front">
          <div class="field grow">
            <span class="lbl">反馈内容 <em>*</em> <span class="count">{{ count }}/{{ MAX_CONTENT }}</span></span>
            <textarea v-model="form.content" class="lined" :maxlength="MAX_CONTENT" placeholder="请详细描述你遇到的问题或建议…" />
            <span v-if="errors.content" class="err">{{ errors.content }}</span>
          </div>
          <div class="sign">
            <span>署名：{{ signer }}</span>
            <button type="button" class="mc-btn" :disabled="stage !== 'write'" @click="submit">
              <PixelText :text="stage === 'sending' ? '提交中…' : '署名并提交'" :px="2" />
            </button>
          </div>
        </section>
        <div class="leaf-back" aria-hidden="true">
          <span class="emboss">MCREATOPIA</span>
        </div>
      </div>
    </div>

    <!-- 提交完成：书与笔物品 + 感谢文字 -->
    <div v-else ref="doneRef" class="done">
      <BookQuillIcon class="item" :size="160" />
      <PixelText class="thanks" :text="THANKS" :px="2" />
      <button type="button" class="mc-btn is-ghost again" @click="again"><PixelText text="再写一份" :px="2" /></button>
    </div>
  </main>
</template>

<style scoped>
.feedback-page {
  display: grid;
  place-items: center;
}
/* 书：棕色皮质封面衬在两页下面 */
.book {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: min(1040px, 100%);
  min-height: 560px;
  padding: 14px;
  background: linear-gradient(180deg, #8a5a2b, #6b4220);
  box-shadow: 0 0 0 3px var(--outline), inset 3px 3px 0 #a87442, inset -3px -3px 0 #4a2c12, 0 24px 48px rgba(0, 0, 0, 0.55);
  perspective: 2200px;
  transform-origin: 50% 50%;
}
.book.busy { pointer-events: none; }
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px clamp(18px, 3vw, 36px);
  background: linear-gradient(90deg, #efe2bd, var(--paper) 12%, var(--paper) 88%, #e4d4a8);
  color: var(--ink);
  box-shadow: 0 0 0 2px var(--outline);
}
.left {
  border-right: 2px solid #c8b78c;
}
.leaf {
  position: relative;
  transform-style: preserve-3d;
  transform-origin: 0 50%;
}
.leaf-front,
.leaf-back {
  backface-visibility: hidden;
}
.leaf-front {
  height: 100%;
}
/* 封底：翻过来之后看到的就是它 */
.leaf-back {
  position: absolute;
  inset: -14px -14px -14px 0;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #8a5a2b, #6b4220);
  box-shadow: 0 0 0 3px var(--outline), inset 3px 3px 0 #a87442, inset -3px -3px 0 #4a2c12;
  transform: rotateY(180deg);
}
.emboss {
  font-family: var(--font-ui);
  font-size: 22px;
  letter-spacing: 0.2em;
  color: #4a2c12;
  text-shadow: 0 1px 0 #a87442;
}
.ink { color: var(--ink); }
.sub {
  margin: -6px 0 0;
  font-size: 13px;
  color: #7a6040;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.field.grow { flex: 1; }
.lbl {
  font-size: 14px;
  color: #5a4126;
}
.lbl em { color: #b02e26; font-style: normal; }
.count {
  float: right;
  font-size: 12px;
  color: #9a8058;
}
.err {
  font-size: 12px;
  color: #b02e26;
}
.cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cat {
  padding: 6px 14px;
  border: 0;
  background: #e2d2a6;
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 0 0 2px #8a6a3e, inset -2px -2px 0 #c9b27e;
}
.cat:hover { background: #ead9ae; }
.cat.on {
  background: var(--brass);
  color: #3a2208;
  box-shadow: 0 0 0 2px var(--outline), inset 2px 2px 0 var(--brass-hi), inset -2px -2px 0 var(--brass-lo);
}
.paper-input {
  padding: 8px 10px;
  border: 0;
  border-bottom: 2px solid #8a6a3e;
  background: rgba(255, 255, 255, 0.35);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 15px;
  outline: none;
}
.paper-input:focus { border-bottom-color: var(--brass-lo); background: rgba(255, 255, 255, 0.55); }
.shots {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.shot {
  position: relative;
  width: 84px;
  height: 64px;
  background: #e2d2a6;
  box-shadow: 0 0 0 2px #8a6a3e;
}
.shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.shot .x {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: #b02e26;
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
  box-shadow: 0 0 0 2px var(--outline);
}
.shot.add {
  display: grid;
  place-items: center;
  font-size: 28px;
  color: #8a6a3e;
  cursor: pointer;
}
.shot.add:hover { background: #ead9ae; }
/* 横线信纸 */
.lined {
  flex: 1;
  min-height: 300px;
  padding: 4px 6px;
  border: 0;
  resize: none;
  background: repeating-linear-gradient(180deg, transparent 0 27px, rgba(138, 106, 62, 0.35) 27px 28px);
  background-attachment: local;
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 28px;
  outline: none;
}
.sign {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #7a6040;
}
.done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding-top: 8vh;
  text-align: center;
}
.item {
  animation: bob 2.4s ease-in-out infinite;
}
@keyframes bob {
  50% { translate: 0 -8px; }
}
.thanks {
  max-width: 100%;
  height: auto;
}
@media (max-width: 760px) {
  .book {
    grid-template-columns: 1fr;
    min-height: 0;
  }
  .left { border-right: 0; border-bottom: 2px solid #c8b78c; }
  .leaf-back { display: none; }
  .thanks { zoom: 0.7; }
}
</style>
