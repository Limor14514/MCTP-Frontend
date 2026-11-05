/**
 * 文件用途：塔罗牌（22 张大阿卡纳）数据 + 抽牌
 * 每张牌：编号、中英文名、牌面符号、正位 / 逆位关键词、对应的星座或行星
 *        （对应关系采用通行的"黄金黎明"体系，星盘点评会用到）。
 * 抽牌：由"账号 + 日期 + 点击时刻（毫秒）+ 选中的是第几张背面牌"共同决定，
 *       每次点击时刻都不同，所以是真正的"那一刻抽到的牌"；正逆位同理。
 */
import { hashStr, rng } from './fortune'

// astro：'sign:<星座下标 0=白羊>' 或 'planet:<行星名>'
export const MAJOR_ARCANA = [
  { n: 0, zh: '愚者', en: 'The Fool', sym: '✧', astro: 'planet:天王星', up: '新的开始、冒险、自由', rev: '鲁莽、犹豫、错过时机' },
  { n: 1, zh: '魔术师', en: 'The Magician', sym: '∞', astro: 'planet:水星', up: '创造力、行动、资源齐备', rev: '计划落空、能力未发挥' },
  { n: 2, zh: '女祭司', en: 'The High Priestess', sym: '☽', astro: 'planet:月亮', up: '直觉、沉静、内在智慧', rev: '忽视直觉、心事重重' },
  { n: 3, zh: '女皇', en: 'The Empress', sym: '♀', astro: 'planet:金星', up: '丰盛、滋养、享受生活', rev: '依赖、停滞、过度付出' },
  { n: 4, zh: '皇帝', en: 'The Emperor', sym: '♈', astro: 'sign:0', up: '秩序、掌控、稳定', rev: '固执、专断、失去控制' },
  { n: 5, zh: '教皇', en: 'The Hierophant', sym: '♉', astro: 'sign:1', up: '传统、学习、指引', rev: '打破常规、质疑权威' },
  { n: 6, zh: '恋人', en: 'The Lovers', sym: '♊', astro: 'sign:2', up: '选择、默契、真心', rev: '分歧、犹豫不决' },
  { n: 7, zh: '战车', en: 'The Chariot', sym: '♋', astro: 'sign:3', up: '意志、前进、胜利', rev: '方向迷失、冲动' },
  { n: 8, zh: '力量', en: 'Strength', sym: '♌', astro: 'sign:4', up: '勇气、耐心、温柔的力量', rev: '自我怀疑、急躁' },
  { n: 9, zh: '隐士', en: 'The Hermit', sym: '♍', astro: 'sign:5', up: '独处、反思、寻找答案', rev: '孤立、逃避' },
  { n: 10, zh: '命运之轮', en: 'Wheel of Fortune', sym: '⚙', astro: 'planet:木星', up: '转机、好运、循环', rev: '时运不济、抗拒变化' },
  { n: 11, zh: '正义', en: 'Justice', sym: '♎', astro: 'sign:6', up: '公平、平衡、真相', rev: '失衡、偏见' },
  { n: 12, zh: '倒吊人', en: 'The Hanged Man', sym: '⊥', astro: 'planet:海王星', up: '换个角度、暂停、牺牲', rev: '无谓的拖延、固执' },
  { n: 13, zh: '死神', en: 'Death', sym: '♏', astro: 'sign:7', up: '结束与新生、转变', rev: '抗拒改变、停滞' },
  { n: 14, zh: '节制', en: 'Temperance', sym: '♐', astro: 'sign:8', up: '调和、耐心、适度', rev: '失衡、过度' },
  { n: 15, zh: '恶魔', en: 'The Devil', sym: '♑', astro: 'sign:9', up: '欲望、束缚、诱惑', rev: '挣脱束缚、觉醒' },
  { n: 16, zh: '高塔', en: 'The Tower', sym: '♂', astro: 'planet:火星', up: '突变、打破、顿悟', rev: '避免灾难、内在动荡' },
  { n: 17, zh: '星星', en: 'The Star', sym: '★', astro: 'sign:10', up: '希望、灵感、治愈', rev: '失望、信心不足' },
  { n: 18, zh: '月亮', en: 'The Moon', sym: '♓', astro: 'sign:11', up: '潜意识、梦境、不安', rev: '迷雾散去、真相浮现' },
  { n: 19, zh: '太阳', en: 'The Sun', sym: '☀', astro: 'planet:太阳', up: '快乐、成功、活力', rev: '短暂的阴霾、过度自信' },
  { n: 20, zh: '审判', en: 'Judgement', sym: '♇', astro: 'planet:冥王星', up: '觉醒、召唤、重生', rev: '自我怀疑、错过召唤' },
  { n: 21, zh: '世界', en: 'The World', sym: '♄', astro: 'planet:土星', up: '完成、圆满、旅程的终点', rev: '未竟之事、差一点' },
]

export const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']

/** 作用：抽一张牌。返回 { card, reversed, clickedAt(ISO 字符串) } */
export function drawTarot(uid, dateKey, clickedAt, slot) {
  const r = rng(hashStr(`${uid}|${dateKey}|${clickedAt.getTime()}|${slot}|tarot`))
  const card = MAJOR_ARCANA[Math.floor(r() * MAJOR_ARCANA.length)]
  return { card, reversed: r() < 0.35, clickedAt: clickedAt.toISOString() }
}
