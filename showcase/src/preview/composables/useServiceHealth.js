/**
 * 文件用途：服务器健康状态 composable（独立工程版，本地 mock）
 * 作用：原工程该 composable 依赖 @/api/community 与 @/utils/errors 请求后端健康接口；
 *       独立展示工程无后端，改为本地模拟健康数据：定时微调在线人数 / TPS / 版本，
 *       返回与原工程一致的结构（health / loading / error / online），供 StatusBarSection 原样消费。
 * TODO-BACKEND：如需展示真实健康数据，替换 mock 为后端接口请求即可，组件无需改动。
 */

import { ref, onMounted, onBeforeUnmount } from 'vue'

// 作用：模拟基础健康数据（在线人数 / TPS / 版本）。
const BASE = {
  online: 128,
  tps: 19.8,
  version: '1.20.1 Forge 47.2.0',
}

export function useServiceHealth({ intervalMs = 10000 } = {}) {
  // 作用：健康数据（本地模拟，定时轻微波动以体现「实时」）。
  const health = ref({ ...BASE })
  // 作用：加载状态（首次挂载瞬间为 true，随后立即置 false）。
  const loading = ref(true)
  // 作用：错误状态（本地 mock 恒为 null，字段补齐后供组件标注真实/模拟）。
  const error = ref(null)
  // 作用：服务是否在线（本地 mock 恒为 true）。
  const online = ref(true)

  let timer = null

  // 作用：模拟一次数据刷新（在线人数 ± 小波动，TPS 微调）。
  function refresh() {
    health.value = {
      online: Math.max(80, Math.round(BASE.online + (Math.random() * 40 - 20))),
      tps: Number((BASE.tps + (Math.random() * 1.2 - 0.6)).toFixed(1)),
      version: BASE.version,
    }
    loading.value = false
  }

  onMounted(() => {
    refresh()
    timer = window.setInterval(refresh, intervalMs)
  })

  onBeforeUnmount(() => {
    if (timer) window.clearInterval(timer)
  })

  return { health, loading, error, online }
}
