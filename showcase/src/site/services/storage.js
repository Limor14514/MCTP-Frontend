/**
 * 文件用途：浏览器本地存储的安全读写（所有"模拟后端"共用）
 * 原因：隐私模式、存储被禁用或空间写满时，localStorage 会直接抛错；
 *       这里统一 try/catch，读不到就返回默认值，写不进就返回 false，页面照常运行。
 */
export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* 忽略 */
  }
}

/** 作用：模拟网络延迟，让"提交中"之类的状态在演示时看得见 */
export const delay = (ms) => new Promise((r) => setTimeout(r, ms))
