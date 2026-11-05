/**
 * 文件用途：主页面"最近评论"的数据
 * 现状：画廊、蓝图站等可评论的功能都还没做，所以默认返回空列表，主页面显示"近期暂无评论哦"。
 *       下面的 SAMPLE 是示例数据（玩家名都是虚构的），只用于调试版式：把 USE_SAMPLE 改成 true 即可看到。
 * 接入真实后端时：建议 GET /api/v1/comments/recent/?limit=8，返回同样的形状，
 *       把 fetchRecentComments() 里的模拟数据换成 fetch 请求即可，组件不用改。
 * 数据形状：{ id, uid, name, avatar, text, at: ISO 时间, target: { kind, title, to } }
 *   target.kind：gallery 画廊 / blueprints 蓝图站 / mods 自研模组 / announcement 公告
 */
import { delay } from './storage'

const KIND_LABEL = { gallery: '画廊', blueprints: '蓝图站', mods: '自研模组', announcement: '公告' }
export const kindLabel = (k) => KIND_LABEL[k] || '其他'

const USE_SAMPLE = false // 调试版式时改成 true

const SAMPLE = [
  { min: 3, uid: 31415926, name: 'Redstone_Owl', kind: 'gallery', title: '黄铜钟楼', text: '齿轮组的转速比算得太漂亮了，晚上去现场看看！' },
  { min: 18, uid: 27182818, name: 'AndesiteAlly', kind: 'blueprints', title: '全自动甘蔗农场 v2', text: '下载了，粘贴的时候记得先放好传动杆，不然会缺一格。' },
  { min: 47, uid: 16180339, name: 'Mill_Stone', kind: 'gallery', title: '海边风车磨坊', text: '帆布的颜色搭配好舒服～' },
  { min: 95, uid: 14142135, name: 'Cogsworth_7', kind: 'mods', title: '轨道信号扩展', text: '已经在测试服跑了两天，没遇到崩溃。' },
  { min: 230, uid: 17320508, name: 'Brass_Hand', kind: 'announcement', title: '第三周目开放通知', text: '冲！这次一定要把主城的列车网修起来。' },
  { min: 610, uid: 22360679, name: 'Steam_Kettle', kind: 'blueprints', title: '紧凑型蒸汽引擎', text: '三格高就能塞进地下室，好评。' },
]

/** 作用：取最近评论（模拟一点网络延迟，方便看到加载状态） */
export async function fetchRecentComments(limit = 6) {
  await delay(300)
  if (!USE_SAMPLE) return []
  const now = Date.now()
  return SAMPLE.slice(0, limit).map((s, i) => ({
    id: `sample-${i}`,
    uid: s.uid,
    name: s.name,
    avatar: null,
    text: s.text,
    at: new Date(now - s.min * 60000).toISOString(),
    target: { kind: s.kind, title: s.title, to: s.kind === 'announcement' ? '/home' : `/home/f/${s.kind}` },
  }))
}

/** 作用：把时间显示成"刚刚 / 5 分钟前 / 3 小时前 / 2 天前"，超过 30 天显示日期 */
export function timeAgo(iso, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000)
  if (s < 60) return '刚刚'
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} 天前`
  return new Date(iso).toLocaleDateString('zh-CN')
}
