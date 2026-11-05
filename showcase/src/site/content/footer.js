/**
 * 文件用途：全站页脚的链接与文字（三个页面共用：索引页、主页面、反馈页，以及其他普通页面）
 * 链接写法：
 *  - to:   站内页面（走路由和转场），例如 '/feedback'、'/legal/terms'；
 *  - href: 站外链接（新标签页打开），例如 QQ 群邀请链接、B 站空间；
 *  - 两个都没填 = 【待填】，页面上显示成灰色不可点击，鼠标移上去提示"待填写"。
 * 需要你提供的：玩家 QQ 群号 / 邀请链接、Oopz、B 站、联系邮箱、ICP 备案号（站点在中国大陆备案后填写）。
 */
export const FOOTER_GROUPS = [
  {
    title: '用户交流',
    links: [
      { label: '玩家 QQ 群' }, // 【待填】href: 'https://qm.qq.com/...'
      { label: 'Oopz' }, // 【待填】Oopz 频道邀请链接
      { label: 'B 站' }, // 【待填】
      { label: '社区规范', to: '/legal/community' },
    ],
  },
  {
    title: '站点支持',
    links: [
      { label: '意见反馈', to: '/feedback' },
      { label: '封禁申诉', to: '/feedback' },
      { label: '联系管理员' }, // 【待填】href: 'mailto:...'
      { label: '服务器状态' }, // 【待开发】
    ],
  },
  {
    title: '协议条款',
    links: [
      { label: '用户协议', to: '/legal/terms' },
      { label: '隐私政策', to: '/legal/privacy' },
      { label: '社区规范', to: '/legal/community' },
      { label: '免责声明', to: '/legal/disclaimer' },
    ],
  },
]

/** 索引页（全屏 3D）空间有限，只放一行精简链接 */
export const FOOTER_COMPACT = [
  { label: '用户协议', to: '/legal/terms' },
  { label: '隐私政策', to: '/legal/privacy' },
  { label: '社区规范', to: '/legal/community' },
  { label: '意见反馈', to: '/feedback' },
]

export const FOOTER_TEXT = {
  copyright: `© ${new Date().getFullYear()} MCREATOPIA`,
  icp: '', // 【待填】ICP 备案号，例如 "京ICP备XXXXXXXX号"；留空则不显示
  // Minecraft 服务器网站惯例的声明（Mojang 使用准则要求不得让人误以为是官方产品）
  notOfficial: '非 Minecraft 官方产品，未经 Mojang 或 Microsoft 批准，亦与其无关。',
  create: '"机械动力"（Create）模组版权归其原作者所有。',
}
