/**
 * 文件用途：账号区状态 store（独立工程版，不再依赖 Pinia）
 * 作用：独立展示工程不接入任何登录/注册/后台业务，账号区仅做「只读演示」——
 *       固定展示一位演示玩家（含占位头像），不提供真实登录/登出；
 *       若后续要展示「登录前 / 登录后」两种状态，可打开 login/logout 模拟逻辑。
 * TODO-BACKEND：本工程与 MCTP-Frontend 完全解耦，不接入真实登录接口。
 */

import { ref } from 'vue'
// 原因：头像为占位素材，随代码打包，避免写死字符串路径导致构建期路径失效。
import avatarPlaceholder from '../assets/placeholders/avatar.svg'

// TODO-ASSET: 玩家头像真实素材待补，当前使用占位 SVG。
const DEMO_USER = {
  name: 'SteelSmith',
  avatar: avatarPlaceholder,
}

// 作用：当前登录用户（模块级响应式状态，替代 Pinia store 的 user）。
// 说明：独立展示工程固定为「已登录演示态」，不依赖任何后端鉴权。
const user = ref({ ...DEMO_USER })

// 作用：保持与原组件调用方式一致的只读接口（AccountArea 仍引用 user / logout 无副作用时兼容）。
export function logout() {
  // 说明：展示工程不做真实登出；如需演示未登录态，可在此置 user.value = null。
  // TODO-DEMO：如要展示「登录前/后」两种 UI，改为 user.value = null 并增加 login()。
}

export { user }
