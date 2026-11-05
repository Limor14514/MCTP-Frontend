<script setup>
/**
 * 文件用途：全站页脚
 *  - 完整版（默认）：主页面、反馈页等普通滚动页面最下面。顶部一条黄铜色"传动轴"分隔线，
 *    下面三列链接：用户交流 / 站点支持 / 协议条款，最底下是版权、备案号与"非官方"声明。
 *    由 SiteShell 统一挂在 router-view 之后，所以每个普通页面都会自动带上。
 *  - 精简版（compact）：索引页是全屏 3D 分段，没有地方放大页脚，
 *    只在最后一段底部放一行链接 + 非官方声明。
 * 链接与文字都在 content/footer.js 里改；没填地址的链接显示为灰色【待填】。
 */
import PixelText from './PixelText.vue'
import { FOOTER_GROUPS, FOOTER_COMPACT, FOOTER_TEXT } from '../content/footer'

defineProps({
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <footer v-if="compact" class="site-footer is-compact">
    <nav class="row" aria-label="页脚">
      <router-link v-for="l in FOOTER_COMPACT" :key="l.label" :to="l.to">{{ l.label }}</router-link>
    </nav>
    <p class="fine">{{ FOOTER_TEXT.copyright }} · {{ FOOTER_TEXT.notOfficial }}</p>
  </footer>

  <footer v-else class="site-footer">
    <!-- 黄铜传动轴分隔线：一条横杆 + 等距的轴套 -->
    <div class="shaft" aria-hidden="true" />

    <div class="wrap">
      <div class="brand">
        <PixelText text="MCREATOPIA" :px="3" />
        <p>机械动力 · 我的世界玩家社区</p>
      </div>

      <nav v-for="g in FOOTER_GROUPS" :key="g.title" class="group" :aria-label="g.title">
        <h4>{{ g.title }}</h4>
        <ul>
          <li v-for="l in g.links" :key="l.label">
            <router-link v-if="l.to" :to="l.to">{{ l.label }}</router-link>
            <a v-else-if="l.href" :href="l.href" target="_blank" rel="noopener">{{ l.label }}</a>
            <span v-else class="pending" title="待填写">{{ l.label }}</span>
          </li>
        </ul>
      </nav>
    </div>

    <div class="bottom">
      <span>{{ FOOTER_TEXT.copyright }}</span>
      <span v-if="FOOTER_TEXT.icp">{{ FOOTER_TEXT.icp }}</span>
      <span>{{ FOOTER_TEXT.notOfficial }}</span>
      <span>{{ FOOTER_TEXT.create }}</span>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  position: relative;
  font-family: var(--font-body);
  color: rgba(255, 255, 255, 0.7);
  background: linear-gradient(180deg, #1c1d21, #121316);
}
.shaft {
  height: 10px;
  background:
    repeating-linear-gradient(90deg, transparent 0 88px, var(--brass-lo) 88px 104px) 0 0 / 100% 100%,
    linear-gradient(180deg, var(--brass-hi) 0 2px, var(--brass) 2px 6px, var(--brass-mid) 6px 8px, var(--brass-lo) 8px 10px);
  box-shadow: 0 2px 0 var(--outline), 0 -2px 0 var(--outline);
}
.wrap {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, 1fr);
  gap: 32px;
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 44px clamp(16px, 5vw, 64px) 28px;
}
.brand {
  color: #fff;
}
.brand p {
  margin: 12px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}
.group h4 {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.06em;
}
.group ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 9px;
  font-size: 14px;
}
.group a:hover {
  color: #fff;
  text-decoration: underline;
}
.pending {
  color: rgba(255, 255, 255, 0.3);
  cursor: help;
}
.pending::after {
  content: '（待填）';
  font-size: 11px;
}
.bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 18px;
  padding: 16px clamp(16px, 5vw, 64px) max(20px, env(safe-area-inset-bottom));
  border-top: 2px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}
@media (max-width: 860px) {
  .wrap { grid-template-columns: repeat(3, 1fr); }
  .brand { grid-column: 1 / -1; }
}
@media (max-width: 520px) {
  .wrap { grid-template-columns: 1fr 1fr; }
}

/* —— 精简版（索引页最后一段底部） —— */
.is-compact {
  background: none;
  text-align: center;
  padding: 0 16px max(14px, env(safe-area-inset-bottom));
}
.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 20px;
  font-size: 13px;
}
.row a:hover {
  color: #fff;
  text-decoration: underline;
}
.fine {
  margin: 6px 0 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.38);
}
</style>
