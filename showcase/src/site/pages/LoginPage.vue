<script setup>
/**
 * 文件用途：登录界面（占位）
 * 现状：正式登录界面另行开发（会接 MCTP-API 的 allauth 登录）。
 *       这里先放两个【模拟登录】按钮，方便预览主页面"登录后"和"管理员"的样子。
 */
import { useRouter } from 'vue-router'
import CreatePanel from '../components/home/CreatePanel.vue'
import PixelText from '../components/PixelText.vue'
import { mockLogin } from '../services/account'

const router = useRouter()
function enter(admin) {
  mockLogin(admin)
  router.push('/home')
}
</script>

<template>
  <main class="site-page login-page">
    <CreatePanel float class="box">
      <div class="inner">
        <PixelText text="登录" :px="4" />
        <p class="note">【待开发】正式登录界面另做。下面是预览用的模拟登录：</p>
        <button type="button" class="mc-btn" @click="enter(false)"><PixelText text="以测试账号登录" :px="2" /></button>
        <button type="button" class="mc-btn is-ghost" @click="enter(true)"><PixelText text="以管理员登录" :px="2" /></button>
        <router-link to="/home" class="back">不登录，返回主页面</router-link>
      </div>
    </CreatePanel>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  place-items: center;
}
.box { width: min(420px, 100%); }
.inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 36px 28px;
  text-align: center;
}
.note {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 214, 120, 0.75);
}
.inner .mc-btn { width: 100%; }
.back {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: underline;
}
</style>
