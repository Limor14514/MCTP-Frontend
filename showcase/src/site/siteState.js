/**
 * 文件用途：全站共享的少量状态（模块单例）
 * booted：首次加载页是否已结束。索引页的入场动画、导航栏掉落都等它变 true 再播放，
 *         保证这些效果不会在加载遮罩后面"偷偷播完"。
 */
import { ref } from 'vue'

export const booted = ref(false)
