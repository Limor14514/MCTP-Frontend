/**
 * 文件用途：把任意文字栅格化成像素点阵（PixelText 组件用它画所有像素字）
 * 第六轮改版（换字体）：
 *  - 英文字母、数字、常用标点：用本站自绘的点阵字库 latinFont.js 逐字拼出来，
 *    每个像素都落在格子上，字与字之间固定空 1 格——不会再像 Pixelify Sans 那样黏在一起；
 *    带重音的字母（é ü å ę ô …）自动由"字母 + 重音"拼出；
 *  - 中文、日文、韩文、西里尔字母等字库里没有的字：仍用离屏 canvas 以系统字体画出来再二值化，
 *    Windows 上宋体 12px 自带点阵字形，二值化后非常清晰；
 *  - 两种字混排时按同一条基线对齐。
 * 旧版（Pixelify Sans 方案）备份在 src/site/_backup-r6/rasterize.js。
 * 备注：如果以后拿到中文像素字体（如 Fusion Pixel 的 woff2），把 FALLBACK_FONT 换成它即可。
 */
import { ref } from 'vue'
import { latinGlyph, LATIN_ASCENT, LATIN_DESCENT, LATIN_GAP } from './latinFont'

// PixelText 依赖这个值来决定何时重画；现在不再加载网页字体，它保持不变（保留接口以免改动调用方）
export const fontsVersion = ref(0)

const FALLBACK_FONT = 'SimSun, "Songti SC", "Noto Sans SC", "PingFang SC", sans-serif'
const cache = new Map()

/**
 * 作用：文字 → { cells: [[x, y], ...], width, height }（单位：像素格）
 * size：系统字体部分的字号（px）。点阵字库是 7 格高的字形，size 每满 12 就放大 1 倍（保持整数倍，像素不变形）。
 */
export function rasterizeText(text, size = 12) {
  const key = `${size}|${text}`
  if (cache.has(key)) return cache.get(key)

  const k = Math.max(1, Math.round(size / 12)) // 点阵字的放大倍数
  const font = `${size}px ${FALLBACK_FONT}`
  const chars = [...text.normalize('NFC')]

  // ① 排版：逐字决定用点阵字库还是系统字体，算出每段的 x 位置
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = font
  const pieces = [] // { kind: 'glyph', g, x } | { kind: 'text', str, x }
  let x = 0
  let hasText = false
  let upperAccent = false
  for (const ch of chars) {
    const g = latinGlyph(ch)
    if (g) {
      pieces.push({ kind: 'glyph', g, x })
      x += (g.width + LATIN_GAP) * k
      if (g.cells.some(([, y]) => y < 0)) upperAccent = true
    } else {
      // 相邻的系统字体字符合成一段一起画（字距由字体自己决定）
      const last = pieces[pieces.length - 1]
      if (last?.kind === 'text') last.str += ch
      else pieces.push({ kind: 'text', str: ch, x })
      hasText = true
      x = pieces[pieces.length - 1].x + Math.ceil(measure.measureText(pieces[pieces.length - 1].str).width) + 1
    }
  }
  const width = Math.max(1, x - (pieces[pieces.length - 1]?.kind === 'glyph' ? LATIN_GAP * k : 0))

  // ② 竖向：有系统字体时沿用原来的 (size + 2) 行高，基线在约 0.85 字号处；
  //    纯点阵字时只留字形本身的高度（大写重音、下伸部分各自需要时才加行）
  const extraTop = upperAccent ? 2 * k : 0
  const base = hasText ? 1 + Math.round(size * 0.85) : LATIN_ASCENT * k + extraTop
  const height = hasText ? size + 2 : base + LATIN_DESCENT * k

  const cells = []
  // ③ 系统字体部分：画到 canvas 上再按 50% 透明度二值化
  if (hasText) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.font = font
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#fff'
    for (const p of pieces) if (p.kind === 'text') ctx.fillText(p.str, p.x, base)
    const { data } = ctx.getImageData(0, 0, width, height)
    for (let y = 0; y < height; y++) {
      for (let cx = 0; cx < width; cx++) {
        if (data[(y * width + cx) * 4 + 3] > 127) cells.push([cx, y])
      }
    }
  }
  // ④ 点阵字部分：字形第 0 行对齐到"基线上方 7 格"
  const top = base - LATIN_ASCENT * k
  for (const p of pieces) {
    if (p.kind !== 'glyph') continue
    for (const [gx, gy] of p.g.cells) {
      for (let dy = 0; dy < k; dy++) {
        for (let dx = 0; dx < k; dx++) cells.push([p.x + gx * k + dx, top + gy * k + dy])
      }
    }
  }

  const result = { cells, width, height }
  cache.set(key, result)
  return result
}
