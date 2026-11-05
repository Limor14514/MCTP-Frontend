/**
 * 文件用途：留言板 API 封装（独立工程版，本地占位 mock）
 * 作用：原工程该文件复用仓库 axios 实例（@/api/axios）请求后端；
 *       独立展示工程无后端、与 MCTP-Frontend 解耦，这里改为本地占位 mock：
 *       返回 Promise 与后端一致的形状，后续接入真实后端时仅需替换实现。
 * 说明：GuestbookSection 当前仍使用 localStorage 模拟留言，本封装为预留接口。
 * TODO-BACKEND：待提供留言后端后，在此替换为真实请求（端点以最终后端为准）。
 */

// 作用：本地占位 mock 数据（空列表）。
const MOCK_LIST = []

export const guestbookApi = {
  // 作用：获取留言列表（本地占位，返回空数组）。
  list: async () => ({ data: MOCK_LIST }),
  // 作用：提交留言（本地占位，原样回显提交内容）。
  create: async (data) => ({ data: { id: Date.now(), ...data } }),
}
