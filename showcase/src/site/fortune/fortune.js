/**
 * 文件用途：今日运势（每个账号每天一份，次日自动轮换）
 * 原理：用"账号 UID + 当天日期"做随机种子（确定性伪随机），
 *       所以同一个账号同一天怎么刷新结果都一样，换一天或换账号结果就不同。
 * 内容：综合 / 财运 / 桃花运 / 事业运 / 学业运 / 健康运（1~5 星 + 一句点评），
 *       外加幸运色（Minecraft 染料色）、幸运数字、幸运方块（机械动力物品）、宜 / 忌。
 * 仅供娱乐。
 */

/** 作用：字符串 → 32 位整数哈希（FNV-1a） */
export function hashStr(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** 作用：确定性伪随机数生成器（mulberry32），同一个种子永远产出同一串数 */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 作用：本地日期 → 'YYYY-MM-DD'（按用户自己的时区换日） */
export function dateKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length)]

export const ASPECTS = [
  { key: 'overall', label: '综合运势' },
  { key: 'wealth', label: '财运' },
  { key: 'love', label: '桃花运' },
  { key: 'career', label: '事业运' },
  { key: 'study', label: '学业运' },
  { key: 'health', label: '健康运' },
]

// 每个方面按星级（1~5）各有几句点评，随机选一句
const LINES = {
  overall: [
    ['今天像是忘了上润滑油的齿轮，慢一点没关系。', '诸事宜缓，先把手头的小事做完。'],
    ['平平稳稳的一天，按计划推进就好。', '小波折难免，转个弯就过去了。'],
    ['整体顺利，适合把拖了很久的事情收尾。', '状态在线，一步一个脚印。'],
    ['动力充足，传动顺畅，做什么都事半功倍。', '好运在线，可以挑战一下新东西。'],
    ['满级好运！今天的你就是全服最亮的黄铜。', '天时地利人和，大胆去做。'],
  ],
  wealth: [
    ['钱包要上锁，冲动消费容易后悔。', '今天不适合大额交易。'],
    ['收支持平，记得记账。', '小钱可以花，大钱先等等。'],
    ['有点小进账，适合整理仓库、变卖闲置。', '稳中有进，攒钱的好日子。'],
    ['财源滚滚，交易容易谈拢。', '投资眼光不错，可以小试一下。'],
    ['偏财运爆棚，挖矿可能直接挖到钻石矿脉。', '今天的你点石成金。'],
  ],
  love: [
    ['今天适合和自己好好相处。', '话说出口前多想三秒。'],
    ['桃花还在路上，先把自己收拾好。', '平淡也是一种甜。'],
    ['和朋友组队会有意外的心动。', '真诚比套路好用。'],
    ['有人在默默关注你，主动一点吧。', '适合约人一起建造。'],
    ['桃花朵朵开，魅力值拉满。', '今天说的话很容易打动人。'],
  ],
  career: [
    ['计划容易被打乱，留好备用方案。', '先别急着拍板。'],
    ['按部就班，别贪多。', '细节决定成败，多检查一遍。'],
    ['思路清晰，适合推进项目。', '合作顺利，沟通有效。'],
    ['灵感涌现，大胆提出你的想法。', '今天的努力会被看见。'],
    ['事业运满格，适合开新坑、做决定。', '你就是今天的总工程师。'],
  ],
  study: [
    ['注意力容易分散，番茄钟救你。', '先复习，再学新的。'],
    ['进度一般，坚持就是胜利。', '背东西效果一般，多理解。'],
    ['学习效率不错，适合攻克难点。', '记笔记会有大收获。'],
    ['一点就通，适合挑战难题。', '考试运不错。'],
    ['学神附体，看什么都过目不忘。', '今天学的东西会记很久。'],
  ],
  health: [
    ['别熬夜挖矿了，早点睡。', '注意饮食，少喝冰的。'],
    ['有点疲惫，记得起来走走。', '多喝水，少久坐。'],
    ['精神不错，适合运动一下。', '作息规律，状态稳定。'],
    ['活力满满，饱食度拉满。', '适合出门晒太阳。'],
    ['元气爆棚，像刚喝了力量药水。', '身体和心情都在最佳状态。'],
  ],
}

// Minecraft 16 种染料颜色（名称 + 色值）
const COLORS = [
  ['白色', '#f9fffe'], ['淡灰色', '#9d9d97'], ['灰色', '#474f52'], ['黑色', '#1d1d21'],
  ['棕色', '#835432'], ['红色', '#b02e26'], ['橙色', '#f9801d'], ['黄色', '#fed83d'],
  ['黄绿色', '#80c71f'], ['绿色', '#5e7c16'], ['青色', '#169c9c'], ['淡蓝色', '#3ab3da'],
  ['蓝色', '#3c44aa'], ['紫色', '#8932b8'], ['品红色', '#c74ebd'], ['粉红色', '#f38baa'],
]
const BLOCKS = [
  '黄铜块', '安山合金', '齿轮', '大齿轮', '传动杆', '动力辊压机', '机械手', '搅拌器',
  '蒸汽引擎', '风车轴承', '传送带', '漏斗', '流体管道', '机械臂', '列车站台', '黄铜机壳',
]
const DO = [
  '建造传动装置', '整理仓库', '下矿', '种田', '和朋友组队', '探索新地形', '交易', '做红石实验',
  '装修基地', '写更新日志', '帮新人', '钓鱼', '画蓝图', '修铁路',
]
const DONT = [
  '熬夜挖矿', '乱拆别人的机器', '冲动消费', '去下界裸奔', '忘记存档', '在岩浆边挖脚下',
  '把钻石放进漏斗', '拖延', '和苦力怕贴脸', '改了配置不备份',
]

/**
 * 作用：生成某账号某天的运势
 * 返回：{ date, aspects: [{ key, label, stars, line }], color, number, block, good: [], bad: [] }
 */
export function dailyFortune(uid, date = new Date()) {
  const key = dateKey(date)
  const r = rng(hashStr(`${uid}|${key}|fortune`))
  // 星级分布略偏向 3~4 星：两次随机取平均再放大，比纯均匀分布更"像运势"
  const star = () => Math.max(1, Math.min(5, Math.round(((r() + r()) / 2) * 4.6 + 0.7)))
  const aspects = ASPECTS.map((a) => {
    const stars = star()
    return { ...a, stars, line: pick(r, LINES[a.key][stars - 1]) }
  })
  const [colorName, colorHex] = pick(r, COLORS)
  const good = []
  while (good.length < 2) {
    const v = pick(r, DO)
    if (!good.includes(v)) good.push(v)
  }
  const bad = []
  while (bad.length < 2) {
    const v = pick(r, DONT)
    if (!bad.includes(v)) bad.push(v)
  }
  return {
    date: key,
    aspects,
    color: { name: colorName, hex: colorHex },
    number: 1 + Math.floor(r() * 99),
    block: pick(r, BLOCKS),
    good,
    bad,
  }
}
