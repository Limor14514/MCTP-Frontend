/**
 * 文件用途：主页面公告板（翻牌显示器）的数据
 * 规则：最少 1 个、最多 10 个选项卡；每个选项卡可填 封面 / 大标题（必填）/ 小标题 / 跳转链接（选填）。
 * 现状：【模拟】保存在浏览器本地存储里，只有当前浏览器看得到管理员的修改。
 * 接入真实后端时：MCTP-API 目前没有公告接口，建议新增
 *   GET  /api/v1/announcements/   —— 所有人可读，返回下面 normalize() 的数组形状
 *   PUT  /api/v1/announcements/   —— 仅管理员，整组覆盖保存（1~10 条）
 * 然后把 loadAnnouncements / saveAnnouncements 内部换成请求即可，页面代码不用改。
 */
import { ref } from 'vue'
import { readJSON, writeJSON, delay } from './storage'

const KEY = 'mctp-mock-announcements'
export const MIN_TABS = 1
export const MAX_TABS = 10

const DEFAULTS = [
  {
    cover: '',
    title: '欢迎来到 MCREATOPIA',
    subtitle: '机械动力生存服务器 · 新赛季现已开放',
    link: '',
  },
  {
    cover: '',
    title: '黄铜时代更新',
    subtitle: '新增列车站台、物流网络与全服共享仓库',
    link: '/feedback',
  },
  {
    cover: '',
    title: '建筑大赛报名中',
    subtitle: '主题「蒸汽与齿轮」· 截止本月底',
    link: '',
  },
]

let uid = 0
const newId = () => `a${Date.now().toString(36)}${(uid++).toString(36)}`

/** 作用：补齐字段、去掉多余空白，保证页面拿到的数据形状一致 */
export function normalize(item = {}) {
  return {
    id: item.id || newId(),
    cover: String(item.cover || '').trim(),
    title: String(item.title || '').trim(),
    subtitle: String(item.subtitle || '').trim(),
    link: String(item.link || '').trim(),
  }
}

export function blankTab() {
  return normalize({ title: '新的公告' })
}

/** 作用：校验一组公告，返回错误提示数组（空数组 = 通过） */
export function validate(list) {
  const errors = []
  if (list.length < MIN_TABS) errors.push(`至少需要 ${MIN_TABS} 个选项卡`)
  if (list.length > MAX_TABS) errors.push(`最多 ${MAX_TABS} 个选项卡`)
  list.forEach((a, i) => {
    if (!a.title) errors.push(`第 ${i + 1} 个选项卡缺少大标题`)
    if (a.link && !/^(https?:\/\/|\/)/.test(a.link)) {
      errors.push(`第 ${i + 1} 个选项卡的链接需以 http(s):// 或 / 开头`)
    }
  })
  return errors
}

export const announcements = ref(
  (readJSON(KEY, null) || DEFAULTS).slice(0, MAX_TABS).map(normalize),
)

/** 【模拟】保存（管理员）。失败会抛出带中文说明的错误 */
export async function saveAnnouncements(list) {
  const clean = list.map(normalize)
  const errors = validate(clean)
  if (errors.length) throw new Error(errors.join('；'))
  await delay(400)
  if (!writeJSON(KEY, clean)) {
    throw new Error('保存失败：浏览器存储空间不足（封面图片太大？请换小一点的图或改用图片链接）')
  }
  announcements.value = clean
  return clean
}
