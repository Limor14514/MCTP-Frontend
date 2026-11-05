/**
 * 文件用途：当前登录账号（主页面账号面板、运势、公告编辑权限都从这里读）
 * 现状：【模拟】正式登录界面还没做，这里先用本地存储模拟"已登录"，方便预览登录后的样子。
 *       /login 占位页上有"以测试账号登录 / 以管理员登录"两个按钮。
 * 接入真实后端时（MCTP-API）：
 *   - 登录流程走 MCTP-Frontend 现有的 allauth + JWT（POST /api/v1/auth/token/session/），
 *   - 账号信息来自 GET /api/v1/auth/me/，字段对应关系见 fromApiUser()；
 *   - 后端目前的用户信息里没有"头像"和"是否管理员"字段，需要后端补：
 *     建议在 UserSerializer 里加 avatar（头像图片地址）与 is_staff（管理员）。
 * 数据形状：{ uid: 数字账号, name: 显示名, avatar: 头像地址或 null, role: 'user' | 'admin' }
 */
import { computed, ref } from 'vue'
import { readJSON, writeJSON, removeKey } from './storage'

const KEY = 'mctp-mock-account'

export const account = ref(readJSON(KEY, null))
export const isLoggedIn = computed(() => !!account.value)
export const isAdmin = computed(() => account.value?.role === 'admin')

/** 作用：把 MCTP-API /auth/me/ 返回的用户对象转换成本站使用的形状（接后端时用） */
export function fromApiUser(u) {
  return {
    uid: u.id,
    name: u.minecraft?.username || u.username, // 绑定了正版 Minecraft 就显示游戏名
    avatar: u.avatar || null,
    role: u.is_staff ? 'admin' : 'user',
  }
}

/** 【模拟】以测试账号登录；admin=true 时为管理员 */
export function mockLogin(admin = false) {
  account.value = admin
    ? { uid: 10001, name: 'Admin_Brass', avatar: null, role: 'admin' }
    : { uid: 20230817, name: 'Steve_Cogwheel', avatar: null, role: 'user' }
  writeJSON(KEY, account.value)
}

export function logout() {
  account.value = null
  removeKey(KEY)
}
