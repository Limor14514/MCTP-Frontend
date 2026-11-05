/**
 * 文件用途：预览页 3D 卡片倾斜指令（v-tilt）
 * 作用：鼠标在卡片上移动时，卡片按鼠标相对位置做轻微 3D 倾斜（perspective + rotateX/rotateY），
 *       离开后回正，增加「可交互」的立体反馈；桌面端精细指针 + 非减少动效时才启用。
 */

// 作用：读取「减少动态效果」偏好与「精细指针」能力。
// 原因：触屏设备没有悬停语义，减少动效用户不应看到倾斜；两者都应直接跳过。
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
const hasFinePointer =
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches

export const tilt = {
  /**
   * 作用：挂载时绑定鼠标移动/离开事件，按鼠标位置计算倾斜角度。
   * 参数：binding.value 可为数字（最大角度，默认 8）或 { max } 对象。
   */
  mounted(el, binding) {
    if (prefersReducedMotion || !hasFinePointer) return

    const max = typeof binding.value === 'number' ? binding.value : (binding.value?.max ?? 8)
    let raf = 0

    // 作用：保持 3D 变换的层级与平滑过渡。
    el.style.transformStyle = 'preserve-3d'
    el.style.transition = 'transform 0.12s ease-out'

    function onMove(e) {
      const rect = el.getBoundingClientRect()
      // 作用：把鼠标位置换算成 -0.5 ~ 0.5 的相对比例。
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      cancelAnimationFrame(raf)
      // 原因：用 rAF 合并高频 mousemove 更新，避免布局抖动。
      raf = requestAnimationFrame(() => {
        el.style.transform =
          `perspective(700px) rotateX(${(-py * max).toFixed(2)}deg) ` +
          `rotateY(${(px * max).toFixed(2)}deg) translateZ(0)`
      })
    }

    function onLeave() {
      cancelAnimationFrame(raf)
      el.style.transform = ''
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    // 原因：把清理函数挂到元素上，供 unmounted 时解绑，避免内存泄漏。
    el._tiltCleanup = () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  },

  unmounted(el) {
    el._tiltCleanup?.()
  },
}
