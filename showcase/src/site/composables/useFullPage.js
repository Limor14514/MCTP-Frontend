/**
 * 文件用途：全屏分段式滑动（fullpage）
 * 作用：滚轮 / 触摸滑动 / 鼠标拖拽 / 键盘 ↑↓ PageUp PageDown 空格 → 每次只切换一整屏。
 * 依赖：GSAP 官方 Observer 插件（统一抹平 wheel/touch/pointer 差异，无需自写底层手势）。
 * 机制：
 *  - 所有分段竖向排在 track 里，切段 = 用 GSAP 把 track 平移到 -index × 100%；
 *  - 动画期间与结束后 COOLDOWN 毫秒内锁定，吸收触控板惯性滚动，避免一次连跳多屏；
 *  - onEnter(index, prev, firstTime)：firstTime 只有第一次到达该段时为 true，
 *    用来实现"单向一次性触发"的入场效果（回滑不会重播、不会倒放）。
 * 移动端定身：Observer preventDefault + 外层 touch-action:none + overscroll-behavior:none，
 *            iOS 不会出现橡皮筋回弹、地址栏伸缩导致的页面跳动（高度用 100dvh）。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'

gsap.registerPlugin(Observer)

const DURATION = 1.05
const COOLDOWN = 350

export function useFullPage(trackRef, count, onEnter) {
  const index = ref(0)
  const visited = new Set()
  let locked = false
  let observer

  function goTo(next) {
    next = Math.max(0, Math.min(count - 1, next))
    if (locked || next === index.value) return
    locked = true
    const prev = index.value
    index.value = next
    const first = !visited.has(next)
    visited.add(next)
    onEnter?.(next, prev, first)
    gsap.to(trackRef.value, {
      yPercent: (-100 * next) / count,
      duration: DURATION,
      ease: 'power3.inOut',
      onComplete: () => setTimeout(() => (locked = false), COOLDOWN),
    })
  }

  function onKey(e) {
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault()
      goTo(index.value + 1)
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault()
      goTo(index.value - 1)
    }
  }

  onMounted(() => {
    visited.add(0)
    onEnter?.(0, -1, true)
    observer = Observer.create({
      target: window,
      type: 'wheel,touch,pointer',
      // wheelSpeed -1：让"滚轮向下"与"手指向上推"统一走 onUp → 下一段
      wheelSpeed: -1,
      tolerance: 12,
      preventDefault: true,
      dragMinimum: 6,
      onUp: () => goTo(index.value + 1),
      onDown: () => goTo(index.value - 1),
      // 带 data-fp-ignore 的元素（如可滚动的列表、表单）不触发切段
      ignore: '[data-fp-ignore]',
    })
    window.addEventListener('keydown', onKey)
  })

  onBeforeUnmount(() => {
    observer?.kill()
    window.removeEventListener('keydown', onKey)
    gsap.killTweensOf(trackRef.value)
  })

  return { index, goTo }
}
