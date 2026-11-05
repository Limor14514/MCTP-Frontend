/**
 * 文件用途：主页面"更新日志"的数据
 * 现状：先手写在这里（内容是本站重建以来真实的更新记录）。
 *       之后如果要记录服务器 / 整合包的更新，可以加 scope: 'server' 的条目；
 *       或者接后端（建议 GET /api/v1/changelog/，管理员在后台填写），返回同样的形状即可。
 * 数据形状：{ version, date: 'YYYY-MM-DD', title, items: [{ type: 'add' | 'improve' | 'fix', text }] }
 *           按时间从新到旧排列，第一条默认展开。
 */
export const CHANGE_TYPES = {
  add: { label: '新增', color: '#80c71f' },
  improve: { label: '优化', color: '#3ab3da' },
  fix: { label: '修复', color: '#f9801d' },
}

export const CHANGELOG = [
  {
    version: 'v0.5',
    date: '2026-11-05',
    title: '功能区与页脚',
    items: [
      { type: 'add', text: '主页面功能区：整合包、蓝图站、自研模组、积分站、画廊、封神榜、历史记录点' },
      { type: 'add', text: '主页面底部的更新日志与最近评论' },
      { type: 'add', text: '全站页脚：用户交流、站点支持与协议条款页' },
    ],
  },
  {
    version: 'v0.4',
    date: '2026-11-05',
    title: '主页面与反馈页',
    items: [
      { type: 'add', text: '账号面板、今日运势与塔罗星盘' },
      { type: 'add', text: '翻牌显示器公告板，管理员可视化编辑' },
      { type: 'add', text: '"书与笔"反馈页' },
      { type: 'improve', text: '背景银河只推动星星，星云保持静止' },
    ],
  },
  {
    version: 'v0.3',
    date: '2026-11-05',
    title: '导航栏与加载页',
    items: [
      { type: 'improve', text: '加载标题改为机械动力黄铜立体像素字' },
      { type: 'add', text: '导航栏 MCREATOPIA 字标、Language 语言滚筒、金色时钟' },
      { type: 'improve', text: '转场 A 段的收拢、旋转与放大改为 3 秒缓入缓出' },
    ],
  },
  {
    version: 'v0.2',
    date: '2026-11-04',
    title: '转场打磨',
    items: [
      { type: 'improve', text: 'M → MCREATOPIA → A 转场节奏调整' },
      { type: 'fix', text: '重启后链接打不开的问题' },
    ],
  },
  {
    version: 'v0.1',
    date: '2026-11-04',
    title: '新站上线',
    items: [
      { type: 'add', text: '加载页、像素银河背景与页面转场' },
      { type: 'add', text: '索引页 3D 场景与全屏分段' },
    ],
  },
]
