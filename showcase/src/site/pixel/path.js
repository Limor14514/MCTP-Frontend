/**
 * 文件用途：像素格 → SVG path 字符串
 * 原因：一个字几十个像素，如果每格一个 <rect>，十几个字就是上千个 DOM 节点；
 *       合并成一条 path（每格一个 "M x y h1 v1 h-1 z" 小方块）只需一个节点，动画更流畅。
 */
import { glyphCells, GLYPH_W } from './glyphs'

export function cellsToPath(cells, ox = 0, oy = 0, size = 1) {
  let d = ''
  for (const [x, y] of cells) d += `M${ox + x * size} ${oy + y * size}h${size}v${size}h${-size}z`
  return d
}

/** 作用：单个字母的 path（以字母左上角为原点，单位 = 1 像素格） */
export function glyphPath(ch) {
  return cellsToPath(glyphCells(ch))
}

/**
 * 作用：整串文字的排版信息——每个字母的左上角 x 坐标与 path，字间距 1 格。
 * 返回 { letters: [{ ch, x, d }], width }
 */
export function layoutWord(text, gap = 1) {
  const letters = []
  let x = 0
  for (const ch of text) {
    letters.push({ ch, x, d: glyphPath(ch) })
    x += GLYPH_W + gap
  }
  return { letters, width: x - gap }
}

/** 作用：整串文字合并成一条 path（用于不需要逐字动画的小号文字，如百分比） */
export function wordPath(text, gap = 1) {
  let d = ''
  let x = 0
  for (const ch of text) {
    d += cellsToPath(glyphCells(ch), x)
    x += GLYPH_W + gap
  }
  return { d, width: x - gap }
}
