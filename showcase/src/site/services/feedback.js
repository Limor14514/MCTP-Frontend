/**
 * 文件用途：反馈页"书与笔"的提交
 * 现状：【模拟】只保存在浏览器本地（截图只记文件名和大小，不保存图片本身，避免撑爆本地存储）。
 * 接入真实后端时：MCTP-API 目前没有反馈接口，建议新增
 *   POST /api/v1/feedback/  （multipart/form-data）
 *     category        bug | suggestion | report | appeal | other
 *     custom_category 选"其他"时的自定义分类
 *     reported_uid    被举报账号 UID（选填）
 *     content         反馈内容（必填）
 *     screenshots[]   截图文件（选填，最多 3 张）
 * 然后把 submitFeedback 内部换成请求即可。
 */
import { readJSON, writeJSON, delay } from './storage'

const KEY = 'mctp-mock-feedback'

export const CATEGORIES = [
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: '建议' },
  { value: 'report', label: '举报' },
  { value: 'appeal', label: '申诉' },
  { value: 'other', label: '其他' },
]
export const MAX_SHOTS = 3
export const MAX_SHOT_MB = 5
export const MAX_CONTENT = 1000

/** 作用：校验表单，返回 { 字段名: 错误提示 }（空对象 = 通过） */
export function validateFeedback(f) {
  const e = {}
  if (!CATEGORIES.some((c) => c.value === f.category)) e.category = '请选择反馈分类'
  if (f.category === 'other' && !f.customCategory.trim()) e.customCategory = '请填写自定义分类'
  if (f.reportedUid && !/^\d{1,12}$/.test(f.reportedUid.trim())) e.reportedUid = 'UID 只能是数字'
  if (!f.content.trim()) e.content = '请填写反馈内容'
  else if (f.content.length > MAX_CONTENT) e.content = `内容不能超过 ${MAX_CONTENT} 字`
  return e
}

/** 【模拟】提交反馈 */
export async function submitFeedback(f, uid = null) {
  await delay(500)
  const list = readJSON(KEY, [])
  list.push({
    id: Date.now(),
    uid,
    category: f.category,
    customCategory: f.category === 'other' ? f.customCategory.trim() : '',
    reportedUid: f.reportedUid.trim(),
    content: f.content.trim(),
    screenshots: f.shots.map((s) => ({ name: s.file.name, size: s.file.size })),
    createdAt: new Date().toISOString(),
  })
  writeJSON(KEY, list.slice(-50))
  return true
}
