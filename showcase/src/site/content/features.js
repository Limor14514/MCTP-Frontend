/**
 * 文件用途：主页面"功能区"的 8 个入口（两行，每行四个，顺序 = 从左到右、从上到下）
 * 每一项：
 *  - key     路由标识，功能介绍页地址为 /home/f/<key>；
 *  - name    显示名；en 英文副标题；desc 一句话说明（卡片上显示）；
 *  - plans   计划中的具体功能（介绍页上逐条列出，开发时照着做）；
 *  - upload  玩家能否上传；review 上传后是否需要管理员审核；
 *  - icon    16×16 像素图标（本站原创绘制），由 PixelIcon 组件渲染成矢量 SVG。
 * 现状：8 个功能都还没有后端接口，点击后进入"功能介绍页（待开发）"；"敬请期待"不可点击。
 */

// —— 封神榜图标：禁止标志（圆环 + 斜杠）用公式生成，比手写字符更圆 ——
function banSign() {
  const rows = []
  for (let y = 0; y < 16; y++) {
    let row = ''
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8)
      const slash = Math.abs(x - y) <= 1
      if (d > 8) row += '.'
      else if (d > 7) row += 'O' // 描边
      else if (d > 5.1) row += x + y > 17 ? 'r' : 'R' // 红色圆环，右下偏暗
      else if (slash) row += x + y > 15 ? 'r' : 'R' // 左上 → 右下的斜杠
      else row += x + y < 9 ? 'H' : 'W' // 白色底，左上一点高光
    }
    rows.push(row)
  }
  return rows
}

export const FEATURES = [
  {
    key: 'modpack',
    name: '整合包',
    en: 'MODPACK',
    desc: '下载服务器整合包与历史版本',
    upload: false,
    review: false,
    plans: ['最新版整合包一键下载（显示版本号、大小、更新时间）', '历史版本列表与各版本更新说明', '安装教程：启动器导入步骤、常见问题', '下载镜像（多个下载源备用）'],
    icon: {
      colors: { O: '#2a1a0c', W: '#a8743a', w: '#6e4a22', L: '#c99a5b', G: '#6fd147', g: '#3a8a22', M: '#d8d8d8' },
      map: [
        '.....OOOOOO.....',
        '.....OGGGgO.....',
        '.....OGGGgO.....',
        '..OOOOGGGgOOOO..',
        '...OGGGGGGggO...',
        '....OGGGGggO....',
        '.....OGGggO.....',
        '..OOOOOGgOOOOO..',
        '.OLLLLLOOLLLLLO.',
        '.OWWWWWWWWWWWWO.',
        '.OwwwwwwwwwwwwO.',
        '.OWWWWWMMWWWWWO.',
        '.OWWWWWMMWWWWWO.',
        '.OwwwwwwwwwwwwO.',
        '.OWWWWWWWWWWWWO.',
        '.OOOOOOOOOOOOOO.',
      ],
    },
  },
  {
    key: 'blueprints',
    name: '蓝图站',
    en: 'BLUEPRINTS',
    desc: '分享投影蓝图与机械动力蓝图',
    upload: true,
    review: true,
    plans: ['上传 .litematic（投影）与 .nbt（机械动力蓝图）文件', '填写名称、尺寸、所需材料、预览截图', '管理员审核通过后公开，可按类型 / 尺寸筛选', '下载次数、收藏与评论'],
    icon: {
      colors: { O: '#0d1b3a', B: '#2f6fd6', b: '#1f4c9e', L: '#8fb8ff', W: '#ffffff', R: '#6f9cf0' },
      map: [
        '................',
        '.OOOOOOOOOOOOOO.',
        '.ORRRRRRRRRRRRO.',
        '.OBBLBBBBLBBBBO.',
        '.OBBLBWWWWBBBBO.',
        '.OLLLLWLLWLLLLO.',
        '.OBBLBWWWWBBBBO.',
        '.OBBLBBWWBBBBBO.',
        '.OBBLBBWWBBLBBO.',
        '.OLLLWWWWWWLLLO.',
        '.OBBLWBBBBWLBBO.',
        '.OBBLWWWWWWLBBO.',
        '.OBBLBBBBBBLOOO.',
        '.ObbbbbbbbbbORO.',
        '.OOOOOOOOOOOOO..',
        '................',
      ],
    },
  },
  {
    key: 'mods',
    name: '自研模组',
    en: 'IN-HOUSE MODS',
    desc: '玩家与服务器自研模组的发布与审核',
    upload: true,
    review: true,
    plans: ['上传模组 .jar 与源码仓库地址', '填写适配的游戏 / 模组加载器版本、功能介绍', '管理员审核（安全检查、与服务器兼容性）后发布', '审核通过的模组可被收录进下一版整合包'],
    icon: {
      colors: { O: '#2a1a0c', Y: '#e8b24a', y: '#8d5418', H: '#fff0a8', D: '#2b2c31' },
      map: [
        '......OOOO......',
        '......OYYO......',
        '..OO..OYYO..OO..',
        '.OYYOOYYYYOOYyO.',
        '.OYHYYYYYYYYyyO.',
        '..OYYYYyyYYYyO..',
        'OOOYYYyOOyYYyOOO',
        'OHYYYyODDOyYYYyO',
        'OHYYYyODDOyYYYyO',
        'OOOYYYyOOyYYyOOO',
        '..OYYYYyyYYYyO..',
        '.OYHYYYYYYYYyyO.',
        '.OYyOOYYYyOOyyO.',
        '..OO..OYyO..OO..',
        '......OYyO......',
        '......OOOO......',
      ],
    },
  },
  {
    key: 'points',
    name: '积分站',
    en: 'POINTS SHOP',
    desc: '用积分兑换专属称号、头像框等',
    upload: false,
    review: false,
    plans: ['展示可兑换物品：专属称号、专属头像框，以及更多（待定）', '显示我的积分余额与积分获取 / 消耗记录', '物品详情：价格、限量、有效期、预览效果', '兑换后自动发放到账号（需后端与游戏服打通）'],
    icon: {
      colors: { O: '#3a2208', Y: '#f5c542', y: '#b8860b', H: '#fff6b0', S: '#d9961a' },
      map: [
        '................',
        '.....OOOOOO.....',
        '...OOYYYYYYOO...',
        '..OYYHHYYYYYyO..',
        '..OYHYYYYYYyyO..',
        '.OYHYYYSSYYYyyO.',
        '.OYYYSSSSSSYyyO.',
        '.OYYYYSSSSYYyyO.',
        '.OYYYYSSSSYYyyO.',
        '.OYYYSSYYSSYyyO.',
        '.OYYYYYYYYYYyyO.',
        '..OYYYYYYYYyyO..',
        '..OyYYYYYYyyyO..',
        '...OOyyyyyyOO...',
        '.....OOOOOO.....',
        '................',
      ],
    },
  },
  {
    key: 'gallery',
    name: '画廊',
    en: 'GALLERY',
    desc: '展示玩家的建筑与机械作品',
    upload: true,
    review: true,
    plans: ['上传作品截图（多张）、标题、坐标与简介', '管理员审核通过后展示', '瀑布流浏览，按周目 / 类型筛选', '点赞与评论（评论会出现在主页面"最近评论"）'],
    icon: {
      colors: { O: '#2a1a0c', F: '#8a5a2b', f: '#5e3a18', S: '#7ec8f0', U: '#ffe14d', C: '#ffffff', G: '#5fbf3a', g: '#3a7d22' },
      map: [
        '................',
        'OOOOOOOOOOOOOOOO',
        'OFFFFFFFFFFFFFfO',
        'OFSSSSSSSSSUUSfO',
        'OFSSCCSSSSSUUSfO',
        'OFSCCCCSSSSSSSfO',
        'OFSSSSSSSSSSSSfO',
        'OFSSSSSSGGSSSSfO',
        'OFSSSSSGGGGSSSfO',
        'OFSSGGGGGGGGSSfO',
        'OFSGGGGGgGGGGGfO',
        'OFGGGgGGGGGgGGfO',
        'OFGGGGGGGGGGGGfO',
        'OFfffffffffffffO',
        'OOOOOOOOOOOOOOOO',
        '................',
      ],
    },
  },
  {
    key: 'banlist',
    name: '封神榜',
    en: 'BAN LIST',
    desc: '公示被封禁的玩家及原因',
    upload: false,
    review: false,
    plans: ['封禁玩家列表：游戏名、UID、封禁时间、期限（临时 / 永久）', '封禁原因与证据摘要（由管理员填写）', '按时间 / 原因筛选与搜索', '对封禁有异议可走反馈页的"申诉"'],
    icon: {
      colors: { O: '#3a0d0a', R: '#e0443a', r: '#9c2219', W: '#f4f4f4', H: '#ffffff' },
      map: banSign(),
    },
  },
  {
    key: 'history',
    name: '历史记录点',
    en: 'CHRONICLE',
    desc: '记录每个周目的大小事件',
    upload: false,
    review: false,
    plans: ['按周目分组的时间线', '每个事件：日期、标题、配图、参与玩家', '管理员维护，玩家可在反馈页补充线索', '与画廊作品互相关联'],
    icon: {
      colors: { O: '#2a1a0c', F: '#8a5a2b', G: '#cfe9f5', S: '#e8c66a' },
      map: [
        '..OOOOOOOOOOOO..',
        '..OFFFFFFFFFFO..',
        '..OOOOOOOOOOOO..',
        '...OGSSSSSSGO...',
        '...OGGSSSSGGO...',
        '....OGGSSGGO....',
        '.....OGSSGO.....',
        '......OSSO......',
        '......OGSO......',
        '.....OGGSGO.....',
        '....OGGGSGGO....',
        '...OGGGSSGGGO...',
        '...OGSSSSSSGO...',
        '..OOOOOOOOOOOO..',
        '..OFFFFFFFFFFO..',
        '..OOOOOOOOOOOO..',
      ],
    },
  },
  {
    key: 'soon',
    name: '敬请期待',
    en: 'COMING SOON',
    desc: '更多功能正在装配中',
    disabled: true, // 无任何作用：不可点击
    plans: [],
    icon: {
      colors: { O: '#1a1a1a', K: '#7b7b7b', k: '#4e4e4e', H: '#a5a5a5', Q: '#dcdcdc' },
      map: [
        'OOOOOOOOOOOOOOOO',
        'OHHHHHHHHHHHHHkO',
        'OHKKKKKKKKKKKKkO',
        'OHKKKKQQQQKKKKkO',
        'OHKKKQQkkQQKKKkO',
        'OHKKKQQKKQQkKKkO',
        'OHKKKKkKKQQkKKkO',
        'OHKKKKKKQQkKKKkO',
        'OHKKKKKQQkKKKKkO',
        'OHKKKKKQQkKKKKkO',
        'OHKKKKKKkKKKKKkO',
        'OHKKKKKQQKKKKKkO',
        'OHKKKKKQQkKKKKkO',
        'OHKKKKKKkKKKKKkO',
        'OkkkkkkkkkkkkkkO',
        'OOOOOOOOOOOOOOOO',
      ],
    },
  },
]

/** 作用：按 key 找功能（"敬请期待"没有介绍页，返回 null） */
export const featureByKey = (key) => FEATURES.find((f) => f.key === key && !f.disabled) || null
