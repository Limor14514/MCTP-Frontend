<script setup>
/**
 * 文件用途：账号区组件（独立展示工程只读演示版）
 * 作用：原工程该组件依赖 Pinia 模拟登录（previewAuthStore.login/logout）切换两种 UI；
 *       独立展示工程不包含登录/注册业务，账号区降级为「只读展示」：固定显示演示玩家头像 + 用户名，
 *       不提供登录/注册/退出入口，仅作为顶栏布局的一部分保留视觉完整性。
 * TODO-DEMO：如需演示「登录前/后」两种状态，可在 previewAuthStore 中启用模拟 login/logout。
 */
import { user } from '../stores/previewAuthStore'
</script>

<template>
  <!-- 作用：账号区容器。 -->
  <div class="preview-account">
    <!-- 作用：只读展示——演示玩家头像 + 用户名（不依赖任何登录业务）。 -->
    <img
      class="preview-account__avatar"
      :src="user.avatar"
      alt="演示玩家头像占位"
    >
    <span class="preview-account__name">{{ user.name }}</span>
  </div>
</template>

<style scoped>
/* 作用：账号区横向排列并垂直居中。 */
.preview-account {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 作用：手机宽度（≤520px）收紧间距，避免顶栏溢出。
   原因：配合顶栏在 375px 手机上不产生横向滚动。 */
@media (max-width: 520px) {
  .preview-account {
    gap: 6px;
  }
}

/* 作用：头像占位图尺寸与圆形裁切。 */
.preview-account__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--preview-accent);
  object-fit: cover;
}

/* 作用：用户名文字样式。 */
.preview-account__name {
  font-size: 15px;
  color: var(--preview-text);
}
</style>
