<script setup>
/**
 * 文件用途：主页面开头板块——悬浮的机械动力风格账号面板
 * 布局：左 1/3 = 头像 + 白色像素名字 + 小一号的像素数字 UID（旁边有复制按钮）；
 *       右 2/3 = 今日运势（FortunePanel，含塔罗星盘）。
 * 未登录：左侧显示问号头像和"登录"按钮（跳转 /login，登录界面另做）；
 *         右侧运势模糊锁定。不登录也能继续往下浏览公告等内容。
 */
import { ref } from 'vue'
import CreatePanel from './CreatePanel.vue'
import PixelAvatar from './PixelAvatar.vue'
import FortunePanel from './FortunePanel.vue'
import PixelText from '../PixelText.vue'
import { account, isLoggedIn, isAdmin, logout } from '../../services/account'

const copied = ref(false)
let copiedTimer

/**
 * 作用：复制 UID 到剪贴板。
 * 原因：navigator.clipboard 只在 https / localhost 下可用，失败时退回到旧的 execCommand 方式。
 */
async function copyUid() {
  const text = String(account.value.uid)
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <section class="hero">
    <CreatePanel float class="panel">
      <div class="grid">
        <!-- 左 1/3：账号 -->
        <div class="who">
          <template v-if="isLoggedIn">
            <PixelAvatar :uid="account.uid" :src="account.avatar || ''" :size="128" />
            <div class="name">
              <PixelText :text="account.name" :px="3" />
            </div>
            <div class="uid">
              <PixelText :text="`UID ${account.uid}`" :px="2" />
              <button type="button" class="copy" :aria-label="copied ? '已复制' : '复制 UID'" :title="copied ? '已复制' : '复制 UID'" @click="copyUid">
                <!-- 像素"两张叠放的纸"复制图标 -->
                <svg v-if="!copied" viewBox="0 0 10 10" shape-rendering="crispEdges">
                  <path d="M3 0h7v7h-2v-1h1v-5h-5v1h-1z" fill="currentColor" />
                  <path d="M0 3h7v7h-7zM1 4v5h5v-5z" fill="currentColor" />
                </svg>
                <svg v-else viewBox="0 0 10 10" shape-rendering="crispEdges">
                  <path d="M8 2h1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v-1h1v1h1v1h1v-1h1v-1h1v-1h1v-1h1z" fill="currentColor" />
                </svg>
              </button>
              <span class="toast" :class="{ show: copied }">已复制</span>
            </div>
            <span v-if="isAdmin" class="badge">管理员</span>
            <button type="button" class="logout" @click="logout">退出登录</button>
          </template>
          <template v-else>
            <PixelAvatar locked :size="128" />
            <div class="name">
              <PixelText text="未登录" :px="3" />
            </div>
            <p class="tip">登录后可查看今日运势与更多功能</p>
            <router-link to="/login" class="mc-btn"><PixelText text="登录" :px="2" /></router-link>
          </template>
        </div>

        <!-- 右 2/3：今日运势 -->
        <div class="luck">
          <FortunePanel :uid="account?.uid ?? null" :locked="!isLoggedIn" />
        </div>
      </div>
    </CreatePanel>
  </section>
</template>

<style scoped>
.hero {
  min-height: calc(100dvh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0 48px;
}
.panel {
  width: min(1120px, 100%);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  min-height: 420px;
}
.who {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 36px 20px;
  border-right: 3px solid var(--outline);
  box-shadow: 3px 0 0 #45464b;
  text-align: center;
}
.name {
  color: #fff;
  margin-top: 10px;
}
.uid {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
}
.copy {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  background: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}
.copy:hover { color: var(--brass-hi); }
.copy svg { width: 16px; height: 16px; }
.toast {
  position: absolute;
  left: 100%;
  margin-left: 6px;
  font-size: 12px;
  color: #80c71f;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
}
.toast.show { opacity: 1; }
.badge {
  padding: 2px 8px;
  font-size: 12px;
  color: #3a2208;
  background: var(--brass);
  box-shadow: 0 0 0 2px var(--outline);
}
.logout {
  border: 0;
  background: none;
  color: rgba(255, 255, 255, 0.4);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}
.tip {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}
.luck {
  padding: 28px clamp(18px, 3vw, 36px);
  min-width: 0;
}
@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .who {
    border-right: 0;
    box-shadow: none;
    border-bottom: 3px solid var(--outline);
    padding: 28px 16px;
  }
}
</style>
