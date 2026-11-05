/**
 * 文件用途：预览页滚动入场动画指令（v-reveal）
 * 作用：为任意元素提供滚动驱动的「装配入场」动画，按元素形态分三种：
 *       - 章节工位（.preview-main 下的 .preview-card）：卡片从传送带右侧滑入 + 微摆归位，
 *         并通过 data-assemble → is-assembled 驱动 CSS 工序号从导轨滑入；
 *       - 下载项（.preview-download__item）：成品从装配线末端「出库下线」，从下方升起 + 轻微翻转归位；
 *       - 普通元素：保留原「滚入视口淡入上浮」入场动画。
 *       用法 <div v-reveal> 或 <div v-reveal="0.15">（0.15 为延迟秒数，用于子项错峰 stagger）。
 */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 原因：ScrollTrigger 是 GSAP 的插件，需显式注册后才能用 scrollTrigger 配置。
gsap.registerPlugin(ScrollTrigger)

// 作用：读取用户「减少动态效果」偏好。
// 原因：无障碍要求——用户开启系统减少动效时，元素应直接可见、不播放位移动画。
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const reveal = {
  /**
   * 作用：元素挂载后配置装配入场动画。
   * 参数：binding.value 为延迟秒数（默认 0），用于子项错峰入场。
   */
  mounted(el, binding) {
    // 原因：减少动效用户直接跳过动画，保持元素默认可见，避免内容「卡在透明」。
    if (prefersReducedMotion) return

    const delay = typeof binding.value === 'number' ? binding.value : 0

    // 作用：识别三种装配形态——章节工位（主内容下的 .preview-card）、
    //       出库件（下载项）、普通元素（默认淡入上浮）。
    // 装配线重设计（方向 A）：
    //   - 章节工位：卡片从传送带右侧滑入 + 微摆归位，工序号先藏、装配完成后随 CSS 过渡滑入；
    //   - 下载项：像成品从装配线末端「出库下线」，从下方升起 + 轻微翻转归位；
    //   - 普通元素：保留原淡入上浮。
    const isStation =
      el.classList.contains('preview-card') && el.parentElement?.classList.contains('preview-main')
    const isOutbound = el.classList.contains('preview-download__item')

    if (isStation) {
      // 作用：装配前隐藏工序号（CSS 读取 data-assemble），卡片从右侧滑入 + 微摆归位。
      el.dataset.assemble = ''
      gsap.set(el, { opacity: 0, x: 48, y: 10, rotate: 0.5 })
      el._revealTween = gsap.to(el, {
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        duration: 0.75,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
        onComplete() {
          // 作用：装配完成——加 is-assembled 后移除 data-assemble，触发工序号滑入过渡。
          el.classList.add('is-assembled')
          delete el.dataset.assemble
        },
      })
      return
    }

    if (isOutbound) {
      // 作用：下载项出库——从下方升起 + 轻微翻转归位，模拟成品从装配线末端下线出库。
      gsap.set(el, { opacity: 0, y: 56, rotateX: -8, transformPerspective: 400 })
      el._revealTween = gsap.to(el, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.6,
        delay,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true,
        },
      })
      return
    }

    // 作用：普通元素——先把元素设为透明并下移，作为动画起点。
    gsap.set(el, { opacity: 0, y: 28 })

    // 作用：滚动到元素进入视口 85% 位置时，淡入并上浮归位，且只播放一次。
    // 原因：once:true 保证动画不因来回滚动重复触发，性能与体验更稳。
    // 原因：把 tween 挂到元素上，卸载时可精确销毁「本元素」的动画与 ScrollTrigger。
    el._revealTween = gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      delay,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    })
  },

  /**
   * 作用：元素卸载前销毁其 tween 与 ScrollTrigger，避免内存泄漏。
   * 原因：原实现每卸载一个元素都遍历全部 ScrollTrigger（O(n²)），且只销毁触发器、不销毁 tween 本身；
   *       改为直接销毁挂在元素上的实例，开销 O(1) 且清理完整。
   */
  unmounted(el) {
    const tween = el._revealTween
    if (!tween) return
    tween.scrollTrigger?.kill()
    tween.kill()
    el._revealTween = null
  },
}
