import type {
  WorkbenchHero,
  WorkbenchNews,
  WorkbenchProject,
  WorkbenchResource,
  WorkbenchTodo,
  WorkbenchTool,
  WorkbenchWorkflow
} from '../types'

export const hero: WorkbenchHero = {
  eyebrow: '效率中枢 · 让 AI 先完成第一版',
  title: '开始您一天的工作吧！工欲善其事必先利其器！',
  subtitle: 'AI 工作台聚合 Agent 对话、全局搜索、工作流编排和项目知识库。只需要描述目标，系统自动推荐工具、拆解任务、调用模板并沉淀结果。',
  command: '帮我把今天的项目事项整理成周报，并生成待办清单',
  tabs: ['Agent对话', '搜索', '社区', '生活', '站内文章'],
  quickPrompts: ['生成需求文档', '总结会议纪要', '分析 Excel 数据', '生成前端页面', '制作 PPT 大纲', '检索项目知识库']
}

export const todos: WorkbenchTodo[] = [
  {
    title: '生成 AI 工作台需求说明',
    description: '输出信息架构、MVP 范围、页面模块和验收标准。',
    priority: 'high',
    priorityText: '高'
  },
  {
    title: '整理热门 AI 工具清单',
    description: '按写作、编程、设计、数据、办公分类维护。',
    priority: 'medium',
    priorityText: '中'
  },
  {
    title: '沉淀常用提示词模板',
    description: '围绕周报、接口评审、Bug 复盘、需求澄清建立模板库。',
    priority: 'low',
    priorityText: '低'
  }
]

export const workflows: WorkbenchWorkflow[] = [
  {
    icon: 'PRD',
    title: '需求输入到 PRD 初稿',
    description: '采集背景、目标、用户故事、验收标准，生成产品文档。',
    tag: '产品'
  },
  {
    icon: 'DEV',
    title: '代码理解与改造建议',
    description: '读取项目结构，输出影响范围、实现方案和风险点。',
    tag: '研发'
  },
  {
    icon: 'DOC',
    title: '资料整理与知识沉淀',
    description: '把链接、会议记录、接口文档整理成可检索知识卡片。',
    tag: '知识'
  },
  {
    icon: 'BI',
    title: '数据分析与结论生成',
    description: '上传表格后自动清洗、分析、可视化并输出结论。',
    tag: '数据'
  }
]

export const tools: WorkbenchTool[] = [
  {
    name: '智能对话助手',
    type: '通用',
    description: '用于问答、方案推演、文案润色、跨领域解释。',
    actions: ['提问', '总结', '翻译']
  },
  {
    name: 'AI 编程助手',
    type: '研发',
    description: '结合仓库上下文生成代码、解释逻辑、修复缺陷。',
    actions: ['读代码', '写组件', '查风险']
  },
  {
    name: 'AI 搜索研究',
    type: '调研',
    description: '聚合外部资料，输出带来源的竞品、技术、市场调研。',
    actions: ['竞品', '资料', '摘要']
  },
  {
    name: 'AI 设计生成',
    type: '设计',
    description: '生成页面原型、运营图、商品图和 PPT 视觉方向。',
    actions: ['原型', '配图', 'PPT']
  },
  {
    name: '文档知识库',
    type: '知识',
    description: '连接项目文档、接口说明、规范制度，支持语义检索。',
    actions: ['检索', '引用', '沉淀']
  },
  {
    name: 'Agent 自动化',
    type: '流程',
    description: '把重复任务编排为自动流程，支持定时和人工确认。',
    actions: ['编排', '监控', '复盘']
  }
]

export const news: WorkbenchNews[] = [
  {
    title: '多模态 Agent 成为办公套件新入口',
    description: '主流办公产品把搜索、文档、表格和会议助手整合为统一任务入口。',
    category: '效率工具',
    time: '09:30'
  },
  {
    title: 'AI 编程工具更强调仓库级上下文',
    description: '代码生成从单文件补全走向需求拆解、影响面分析和自动修复闭环。',
    category: '研发提效',
    time: '10:45'
  },
  {
    title: '企业知识库进入“可行动”阶段',
    description: '知识检索不再止步于答案，开始连接审批、工单、数据看板和自动化流程。',
    category: '知识管理',
    time: '14:20'
  }
]

export const projects: WorkbenchProject[] = [
  {
    title: '讯易链',
    iconText: 'XY',
    introduce: '生命是一个不断探索的过程。',
    links: [
      { label: '点击跳转开发环境', url: 'https://beehive-scf.lianyirong.com.cn/#/' },
      { label: '点击跳转测试环境', url: 'https://beehive-scf.qhhrly.cn/#/' },
      { label: '点击跳转生产环境', url: 'https://xyc.llschain.com/#/' }
    ]
  },
  {
    title: '微企链',
    iconText: 'WQ',
    introduce: '苟日新，日日新，又日新。',
    links: [
      { label: '点击跳转开发环境', url: 'https://wecscf.lianyirong.com.cn/#/' },
      { label: '点击跳转测试环境', url: 'https://wecscf.qhhrly.cn/#/' },
      { label: '点击跳转生产环境', url: 'https://wecscf.weqchain.com/#/' }
    ]
  },
  {
    title: '上海银行',
    iconText: 'B',
    introduce: '博学之，审问之，慎思之，明辨之，笃行之。',
    links: [
      { label: '点击跳转开发环境', url: 'https://bosc-wecscf.lianyirong.com.cn/#/' },
      { label: '点击跳转测试环境', url: 'https://bosc-wecscf.qhhrly.cn/#/' },
      { label: '点击跳转生产环境', url: 'https://bosc-wecscf.weqchain.com/#/' }
    ]
  },
  {
    title: '产融内管平台',
    iconText: 'FIN',
    introduce: '工欲善其事必先利其器',
    links: [
      { label: '点击跳转开发环境', url: 'https://ams-fin.lianyirong.com.cn/index.html#/login' },
      { label: '点击跳转测试环境', url: 'https://ams-fin.qhhrly.cn/#/login' },
      { label: '点击跳转生产环境', url: 'https://ams-fin.llschain.com/#/login' }
    ]
  },
  {
    title: '知识库',
    iconText: 'KB',
    introduce: '重复 是为了更加坦荡地接受孤独',
    links: [
      { label: '点击跳转生产环境', url: 'https://doc.linklogis.com/books_space/62736e2d026ee7001506965f/view/6459b4a6ef13090014f215fd' }
    ]
  },
  {
    title: 'Swagger文档',
    iconText: 'API',
    introduce: '众生皆具如来智慧德相',
    links: [
      { label: '点击跳转开发环境', url: 'https://beehive-scf.lianyirong.com.cn/scfpc-web/swagger-ui.html#/' }
    ]
  },
  {
    title: '智慧场馆',
    iconText: 'GYM',
    introduce: '智慧场馆服务一体化',
    links: [
      { label: '点击跳转测试环境', url: 'http://sports.jinzhengtaoche.com:9097/shSports/index.html#/page/stadium/list' }
    ]
  },
  {
    title: '元洪在线',
    iconText: 'FOOD',
    introduce: '一站式全球食材供采平台',
    links: [
      { label: '点击跳转生产环境', url: 'https://www.yhspzx.com:17443/' }
    ]
  },
  {
    title: '万匠大作',
    iconText: 'ART',
    introduce: '高端艺术品交易平台',
    links: [
      { label: '点击跳转测试环境', url: 'https://console.wjdz.art/mallYun-operator/#/dashboard' },
      { label: '点击跳转生产环境', url: 'https://console.wjdz.art/mallYun-operator/#/dashboard' }
    ]
  }
]

export const hotTools: WorkbenchResource[] = [
  {
    name: '豆包',
    introduce: '字节跳动推出的免费AI智能助手',
    url: 'https://www.doubao.com/',
    image: 'https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/logo-icon.png',
    iconText: '豆'
  },
  {
    name: '即梦AI',
    introduce: '字节跳动推出的一站式AI创作平台',
    url: 'https://jimeng.jianying.com/',
    image: 'https://lf26-web-site-static.bytedance.com/obj/eden-cn/zlmsnh_pjbunp/jimeng/favicon.ico',
    iconText: '梦'
  },
  {
    name: 'TRAE编程',
    introduce: '字节跳动推出的免费AI编程工具，基于Claude模型',
    url: 'https://www.doubao.com/',
    image: 'https://img.icons8.com/fluent/48/code.png',
    iconText: 'T'
  },
  {
    name: 'AiPPT',
    introduce: 'AI快速生成高质量PPT',
    url: 'https://www.aippt.cn/',
    image: 'https://img.icons8.com/fluent/48/microsoft-powerpoint-2019.png',
    iconText: 'P'
  },
  {
    name: '秘塔AI搜索',
    introduce: '最好用的AI搜索工具，没有广告，直达结果',
    url: 'https://metaso.cn/',
    image: 'https://s.metaso.cn/favicon.ico',
    iconText: '搜'
  },
  {
    name: '码上飞',
    introduce: '一句话生成微信小程序、APP、H5网页',
    url: 'https://www.codethis.ai/',
    image: 'https://img.icons8.com/fluent/48/code.png',
    iconText: '码'
  },
  {
    name: '堆友AI',
    introduce: '阿里出品的免费AI绘画和出图神器',
    url: 'https://d.design/',
    image: 'https://img.icons8.com/fluent/48/design.png',
    iconText: '堆'
  },
  {
    name: '美图设计室',
    introduce: 'AI图像创作和设计平台',
    url: 'https://design.meitu.com/',
    image: 'https://img.icons8.com/fluent/48/image.png',
    iconText: '美'
  },
  {
    name: '绘蛙',
    introduce: 'AI电商营销工具，免费生成商品图',
    url: 'https://www.huiwa.com/',
    image: 'https://img.icons8.com/fluent/48/shopping-cart.png',
    iconText: '蛙'
  },
  {
    name: '办公小浣熊',
    introduce: '最强AI数据分析助手',
    url: 'https://raccoon.sensetime.com/',
    image: 'https://img.icons8.com/fluent/48/bar-chart.png',
    iconText: '熊'
  },
  {
    name: '稿定AI设计',
    introduce: '一站式AI设计与灵感创作平台',
    url: 'https://www.gaoding.com/',
    image: 'https://img.icons8.com/fluent/48/design.png',
    iconText: '稿'
  },
  {
    name: '扣子-AI办公',
    introduce: '全面免费开放，提供专业AI Agent服务',
    url: 'https://www.coze.cn/',
    image: 'https://img.icons8.com/fluent/48/robot.png',
    iconText: '扣'
  }
]

export const hotTutorials: WorkbenchResource[] = [
  {
    name: 'ES6 教程',
    introduce: '阮一峰ES6教程',
    url: 'https://es6.ruanyifeng.com/',
    image: 'https://img.icons8.com/fluent/48/javascript.png',
    iconText: 'ES'
  },
  {
    name: 'JavaScript 教程',
    introduce: '最通俗易懂的 JavaScript 教程',
    url: 'https://wangdoc.com/javascript/',
    image: 'https://img.icons8.com/fluent/48/javascript.png',
    iconText: 'JS'
  },
  {
    name: 'JS 代码规范',
    introduce: '优秀的 JS 代码规范',
    url: 'https://github.com/ryanmcdermott/clean-code-javascript',
    image: 'https://img.icons8.com/fluent/48/github.png',
    iconText: 'JS'
  },
  {
    name: 'TypeScript 教程',
    introduce: '通俗易懂的 TypeScript 教程',
    url: 'https://github.com/xcatliu/typescript-tutorial',
    image: 'https://img.icons8.com/fluent/48/typescript.png',
    iconText: 'TS'
  },
  {
    name: 'ms之道',
    introduce: '牛客热心网友知识整理',
    url: 'https://juejin.cn/post/7028478428680552456#heading-97',
    image: 'https://img.icons8.com/fluent/48/book.png',
    iconText: 'MS'
  },
  {
    name: 'Node.js 学习指南',
    introduce: 'Node.js 学习指南，笔记系统整理',
    image: 'https://img.icons8.com/fluent/48/nodejs.png',
    iconText: 'N'
  }
]
