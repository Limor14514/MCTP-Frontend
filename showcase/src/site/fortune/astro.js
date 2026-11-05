/**
 * 文件用途：星盘计算 + 结合塔罗牌生成点评
 * 依据（用户要求：点击时间 + 塔罗牌 + 日期）：
 *  - 日期 → 太阳所在星座（太阳黄经，低精度天文公式，误差 < 0.1°）；
 *  - 日期 → 月亮所在星座与月相（月亮黄经近似公式，误差约 1~2°，够判断星座和月相）；
 *  - 点击时刻 → 上升星座（由当地恒星时推算；经度取自浏览器时区，纬度统一假设北纬 35°）
 *               与"行星时"（简化：以 6:00 为日出，每小时轮换一颗行星，迦勒底顺序）；
 *  - 塔罗牌 → 对应的星座或行星（黄金黎明体系），与太阳星座比较元素关系，得出今日基调。
 * 仅供娱乐，不构成任何建议。
 */

export const SIGNS = [
  { zh: '白羊座', sym: '♈', el: '火', trait: '冲劲十足，适合主动出击' },
  { zh: '金牛座', sym: '♉', el: '土', trait: '踏实稳重，适合慢慢积累' },
  { zh: '双子座', sym: '♊', el: '风', trait: '思维活跃，适合沟通交流' },
  { zh: '巨蟹座', sym: '♋', el: '水', trait: '情感细腻，适合照顾身边的人' },
  { zh: '狮子座', sym: '♌', el: '火', trait: '自信耀眼，适合展示自己' },
  { zh: '处女座', sym: '♍', el: '土', trait: '注重细节，适合整理与优化' },
  { zh: '天秤座', sym: '♎', el: '风', trait: '追求平衡，适合协调与合作' },
  { zh: '天蝎座', sym: '♏', el: '水', trait: '洞察深刻，适合专注攻坚' },
  { zh: '射手座', sym: '♐', el: '火', trait: '向往远方，适合探索新事物' },
  { zh: '摩羯座', sym: '♑', el: '土', trait: '目标明确，适合长期规划' },
  { zh: '水瓶座', sym: '♒', el: '风', trait: '想法新奇，适合尝试创新' },
  { zh: '双鱼座', sym: '♓', el: '水', trait: '想象丰富，适合创作与休息' },
]

const PLANETS = {
  太阳: { el: '火', home: 4, trait: '自我与活力被点亮' },
  月亮: { el: '水', home: 3, trait: '情绪与直觉格外敏锐' },
  水星: { el: '风', home: 2, trait: '思考与表达特别顺畅' },
  金星: { el: '土', home: 1, trait: '人缘与审美运势上扬' },
  火星: { el: '火', home: 0, trait: '行动力强，但也容易急躁' },
  木星: { el: '火', home: 8, trait: '机会与好运更容易靠近' },
  土星: { el: '土', home: 9, trait: '适合脚踏实地、承担责任' },
  天王星: { el: '风', home: 10, trait: '容易出现意料之外的变化' },
  海王星: { el: '水', home: 11, trait: '灵感与梦境交织' },
  冥王星: { el: '水', home: 7, trait: '深层的转变正在酝酿' },
}

const CHALDEAN = ['土星', '木星', '火星', '太阳', '金星', '水星', '月亮']
const DAY_RULER = ['太阳', '月亮', '火星', '水星', '木星', '金星', '土星'] // 周日 ~ 周六

const PHASES = [
  ['新月', '适合许愿与开启新计划'],
  ['娥眉月', '适合迈出第一小步'],
  ['上弦月', '适合克服阻碍、做出决定'],
  ['盈凸月', '适合打磨细节、继续推进'],
  ['满月', '适合收获成果、表达心意'],
  ['亏凸月', '适合分享与感恩'],
  ['下弦月', '适合整理、放下不需要的东西'],
  ['残月', '适合休息与复盘'],
]

const rad = (d) => (d * Math.PI) / 180
const norm = (d) => ((d % 360) + 360) % 360
const signOf = (lon) => SIGNS[Math.floor(norm(lon) / 30)]

/** 作用：距 J2000.0（2000-01-01 12:00 UTC）的天数 */
function daysJ2000(date) {
  return date.getTime() / 86400000 + 2440587.5 - 2451545.0
}

export function sunLongitude(date) {
  const n = daysJ2000(date)
  const L = 280.46 + 0.9856474 * n
  const g = rad(357.528 + 0.9856003 * n)
  return norm(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g))
}

export function moonLongitude(date) {
  const n = daysJ2000(date)
  const L = 218.316 + 13.176396 * n
  const M = rad(134.963 + 13.064993 * n)
  return norm(L + 6.289 * Math.sin(M))
}

/** 作用：上升点黄经。经度由浏览器时区推算（东八区 ≈ 120°E），纬度假设 35°N */
export function ascendant(date, lat = 35) {
  const lonE = -date.getTimezoneOffset() / 4
  const n = daysJ2000(date)
  const ut = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  const ramc = rad(norm(100.46 + 0.985647 * Math.floor(n) + lonE + 15 * ut))
  const eps = rad(23.44)
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(rad(lat)) * Math.sin(eps)))
  return norm((asc * 180) / Math.PI)
}

export function planetaryHour(date) {
  const h = date.getHours()
  let day = date.getDay()
  if (h < 6) day = (day + 6) % 7 // 日出前仍算前一天的行星日
  const since = (h - 6 + 24) % 24
  return CHALDEAN[(CHALDEAN.indexOf(DAY_RULER[day]) + since) % 7]
}

/** 作用：塔罗牌对应的元素、名称与在星盘上的标记位置 */
function cardAstro(card) {
  const [kind, v] = card.astro.split(':')
  if (kind === 'sign') {
    const s = SIGNS[+v]
    return { name: s.zh, el: s.el, trait: s.trait, lon: +v * 30 + 15 }
  }
  const p = PLANETS[v]
  return { name: v, el: p.el, trait: p.trait, lon: p.home * 30 + 15 }
}

function relation(a, b) {
  if (a === b) return ['共鸣', '能量同频，今天想做的事更容易顺水推舟。']
  const pair = [a, b].sort().join('')
  if (pair === '火风' || pair === '风火' || pair === '土水' || pair === '水土') {
    return ['相生', '彼此成全，适合把想法落到行动上。']
  }
  if (pair === '水火' || pair === '火水' || pair === '土风' || pair === '风土') {
    return ['张力', '会有一点拉扯，放慢节奏反而能找到突破口。']
  }
  return ['磨合', '需要一点耐心去调和，别急着下结论。']
}

/**
 * 作用：生成星盘数据与点评
 * 参数：dateObj 抽牌当天；clickedAt 点击时刻；draw { card, reversed }；fortune 当日运势
 */
export function readChart(clickedAt, draw, fortune) {
  const sunLon = sunLongitude(clickedAt)
  const moonLon = moonLongitude(clickedAt)
  const ascLon = ascendant(clickedAt)
  const phaseAngle = norm(moonLon - sunLon)
  const [phaseName, phaseAdvice] = PHASES[Math.floor(norm(phaseAngle + 22.5) / 45) % 8]
  const illum = Math.round(((1 - Math.cos(rad(phaseAngle))) / 2) * 100)
  const sun = signOf(sunLon)
  const moon = signOf(moonLon)
  const asc = signOf(ascLon)
  const hourPlanet = planetaryHour(clickedAt)
  const ca = cardAstro(draw.card)
  const [relName, relText] = relation(ca.el, sun.el)

  const sorted = [...fortune.aspects].sort((a, b) => b.stars - a.stars)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  const hh = String(clickedAt.getHours()).padStart(2, '0')
  const mm = String(clickedAt.getMinutes()).padStart(2, '0')
  const pos = draw.reversed ? '逆位' : '正位'
  const keys = draw.reversed ? draw.card.rev : draw.card.up

  const lines = [
    `今天太阳行经${sun.zh}（${sun.el}象），${sun.trait}。`,
    `月亮位于${moon.zh}，月相为${phaseName}（亮度约 ${illum}%），${phaseAdvice}。`,
    `你在 ${hh}:${mm} 抽牌，此刻上升星座约为${asc.zh}，正值${hourPlanet}时——${PLANETS[hourPlanet].trait}。`,
    `抽到「${draw.card.zh}」${pos}，对应${ca.name}（${ca.el}元素），关键词：${keys}。`,
    `牌的${ca.el}元素与太阳的${sun.el}元素形成「${relName}」：${relText}` +
      `今日${best.label}最旺，可以多花心思；${worst.label}偏弱，${draw.reversed ? '更要放慢脚步、留足余地' : '稳住节奏就好'}。`,
  ]

  return {
    sun: { lon: sunLon, sign: sun },
    moon: { lon: moonLon, sign: moon, phaseName, illum },
    asc: { lon: ascLon, sign: asc },
    card: { lon: ca.lon, name: ca.name },
    hourPlanet,
    relation: relName,
    lines,
  }
}
