<script setup>
/**
 * 文件用途：功能 F——活动预告与历史时间线组件
 * 作用：以纵向时间线展示活动（预告 + 历史，模拟数据）；每条可点击展开详情，
 *       预告类活动展开后显示「报名入口」占位，形成功能闭环演示。
 */
// 原因：v-reveal / v-tilt 指令改为组件内局部注册（<script setup> 中 v 前缀变量自动注册为指令），
//       不再改动全局 src/main.js，保持现有框架零侵入。
import { reveal as vReveal } from '../directives/reveal'
import { ref } from 'vue'

// 作用：活动原始数据（按时间倒序）；link 为报名地址，空字符串表示待补。
// 原因：不再手写 type（预告/已结束），改为按日期与今天比较自动计算——
//       否则活动日期一过仍显示「预告」（如 10-24 的活动在 10-31 仍标预告），审核时显得数据不真实。
// TODO-BACKEND: 待对接后端活动接口（建议返回 title / date / desc / link 字段）。
// TODO-CONTENT: 活动标题 / 日期 / 描述 / 报名链接待服主提供。
const RAW_EVENTS = [
  { date: '2026-11-07', title: 'MCGO第三届大赛', desc: 'AAA', link: '' },
  { date: '2026-10-24', title: 'MCGO第二届大赛', desc: 'BBB', link: '' },
  { date: '2026-10-10', title: 'MCGO第一届大赛', desc: 'CCC', link: '' },
]

// 作用：今天的本地日期字符串（YYYY-MM-DD），活动当天仍视为「预告」（可报名）。
// 原因：用本地时区而非 toISOString（UTC），避免北京时间凌晨被算成前一天。
const pad = (n) => String(n).padStart(2, '0')
const now = new Date()
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

// 作用：给每条活动补上 type——日期 >= 今天为 upcoming（预告），否则为 past（已结束）。
// 原因：YYYY-MM-DD 格式的字符串可直接按字典序比较大小，无需解析为 Date。
const events = RAW_EVENTS.map((e) => ({ ...e, type: e.date >= today ? 'upcoming' : 'past' }))

// 作用：当前展开的活动索引（-1 表示全部收起）；单开手风琴式，避免同时展开过多内容。
const openIndex = ref(-1)

// 作用：切换某条活动的展开/收起。
function toggle(i) {
  openIndex.value = openIndex.value === i ? -1 : i
}
</script>

<template>
  <!-- 作用：活动预告与历史时间线容器；id 供顶部锚点导航定位。 -->
  <section
    id="events"
    v-reveal
    class="preview-card"
  >
    <h2 class="preview-section-title">
      活动
    </h2>
    <!-- 作用：时间线列表——每条活动左侧时间轴、右侧可点击展开的内容。 -->
    <ol class="preview-events__list">
      <li
        v-for="(e, i) in events"
        :key="i"
        v-reveal="i * 0.08"
        class="preview-events__item"
        :class="{ 'is-open': openIndex === i }"
      >
        <div class="preview-events__axis">
          <span
            class="preview-events__dot"
            :class="`--${e.type}`"
          />
        </div>
        <div class="preview-events__content">
          <!-- 作用：点击整行头部展开/收起详情。 -->
          <button
            class="preview-events__head"
            type="button"
            :aria-expanded="openIndex === i"
            @click="toggle(i)"
          >
            <span class="preview-events__meta">
              <span class="preview-events__date">{{ e.date }}</span>
              <span
                class="preview-events__tag"
                :class="`--${e.type}`"
              >
                {{ e.type === 'upcoming' ? '预告' : '已结束' }}
              </span>
            </span>
            <span class="preview-events__title">{{ e.title }}</span>
            <span
              class="preview-events__chevron"
              aria-hidden="true"
            >›</span>
          </button>
          <!-- 作用：展开后的详情 + 预告类活动的报名入口占位。 -->
          <div
            v-show="openIndex === i"
            class="preview-events__detail"
          >
            <p class="preview-events__desc">
              {{ e.desc }}
            </p>
            <!-- TODO-BACKEND: 报名入口链接待补，当前为占位按钮。 -->
            <a
              v-if="e.type === 'upcoming'"
              class="preview-btn preview-btn--ghost preview-events__signup"
              :href="e.link || '#'"
              :aria-disabled="!e.link"
              @click="!e.link && $event.preventDefault()"
            >{{ e.link ? '立即报名' : '报名入口（占位）' }}</a>
            <!-- 原因：hash 路由下 href="#" 会跳回首页，故 link 为空（待补）时拦截默认跳转。 -->
            <span
              v-else
              class="preview-events__closed"
            >活动已结束</span>
          </div>
        </div>
      </li>
    </ol>
    <!-- TODO-BACKEND: 活动数据为模拟数据，待对接后端活动接口。 -->
    <p class="preview-muted preview-events__note">
      TODO-BACKEND：活动数据为模拟数据，待对接后端活动接口；报名入口为占位链接。
    </p>
  </section>
</template>

<style scoped>
/* 作用：时间线列表——去掉默认序号与边距。 */
.preview-events__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* 作用：单条活动——左侧时间轴 + 右侧内容两栏。 */
.preview-events__item {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 12px;
  position: relative;
  padding-bottom: 18px;
}

/* 作用：时间轴线——在圆点下方画竖线连接下一条。 */
.preview-events__item::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: var(--preview-line-strong);
}

/* 作用：最后一条不画竖线。 */
.preview-events__item:last-child::before {
  display: none;
}

/* 作用：时间轴圆点（预告=铜黄实心，历史=灰描边）。 */
.preview-events__dot {
  display: block;
  width: 12px;
  height: 12px;
  margin-top: 8px;
  border-radius: 50%;
}

.preview-events__dot.--upcoming {
  background: var(--preview-accent);
}

.preview-events__dot.--past {
  background: transparent;
  border: 2px solid var(--preview-text-soft);
}

/* 作用：活动内容区。 */
.preview-events__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

/* 作用：展开时给内容卡加描边与底色，突出当前项。 */
.preview-events__item.is-open .preview-events__content {
  border-color: var(--preview-line-strong);
  background: var(--preview-bg-panel-soft);
}

/* 作用：头部按钮——整行可点，去默认按钮样式。 */
.preview-events__head {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: 'meta chevron' 'title chevron';
  align-items: center;
  gap: 2px 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

/* 作用：日期 + 类型标签行。 */
.preview-events__meta {
  grid-area: meta;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 作用：活动日期——次要文字。 */
.preview-events__date {
  font-size: 13px;
  color: var(--preview-text-soft);
}

/* 作用：活动类型标签。 */
.preview-events__tag {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.preview-events__tag.--upcoming {
  background: var(--preview-accent);
  color: #2b2118;
}

.preview-events__tag.--past {
  border: 1px solid var(--preview-line-strong);
  color: var(--preview-text-soft);
}

/* 作用：活动标题。 */
.preview-events__title {
  grid-area: title;
  font-size: 17px;
  color: var(--preview-text);
}

/* 作用：展开箭头——展开时旋转 90°。 */
.preview-events__chevron {
  grid-area: chevron;
  font-size: 18px;
  color: var(--preview-accent);
  transition: transform 0.2s ease;
}

.preview-events__item.is-open .preview-events__chevron {
  transform: rotate(90deg);
}

/* 作用：详情区。 */
.preview-events__detail {
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 作用：活动描述。 */
.preview-events__desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--preview-text-soft);
}

/* 作用：报名按钮左对齐。 */
.preview-events__signup {
  align-self: flex-start;
}

/* 作用：已结束提示。 */
.preview-events__closed {
  font-size: 12px;
  color: var(--preview-text-soft);
}

/* 作用：TODO 提示。 */
.preview-events__note {
  margin: 8px 0 0;
}
</style>
