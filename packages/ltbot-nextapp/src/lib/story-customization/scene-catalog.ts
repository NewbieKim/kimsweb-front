export const SCENE_CATALOG_VERSION = 'scene-cards@0.1.0';

export type SceneAgeGroupId = '0-2' | '2-4' | '4-6' | '6-8';
export type SceneStatus = 'ACTIVE' | 'INACTIVE';

export interface SceneCategoryDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
  status: SceneStatus;
  fallbackGradient: string;
}

export interface SceneCardDefinition {
  id: string;
  categoryId: string;
  name: string;
  emoji: string;
  coverImage: string;
  description: string;
  sortOrder: number;
  status: SceneStatus;
  catalogVersion: string;
  worldView: string;
  emotionalArc: string;
  safetyGuideline: string;
  settings: Record<SceneAgeGroupId, string>;
  skeletons: Record<SceneAgeGroupId, string>;
}

export const SCENE_CATEGORIES: readonly SceneCategoryDefinition[] = [
  {
    id: 'fantasy',
    name: '奇幻想象',
    icon: '✨',
    description: '去现实之外，遇见温柔又奇妙的新规则。',
    sortOrder: 1,
    status: 'ACTIVE',
    fallbackGradient: 'linear-gradient(140deg,#5e4a8a,#d782ba)',
  },
  {
    id: 'nature',
    name: '自然探索',
    icon: '🌿',
    description: '走进海洋、森林与四季，发现生命的秘密。',
    sortOrder: 2,
    status: 'ACTIVE',
    fallbackGradient: 'linear-gradient(140deg,#176d7d,#75b56c)',
  },
  {
    id: 'science',
    name: '科学发现',
    icon: '🔭',
    description: '把一个真实知识点，变成孩子能参与的小任务。',
    sortOrder: 3,
    status: 'ACTIVE',
    fallbackGradient: 'linear-gradient(140deg,#263b75,#2d9caf)',
  },
  {
    id: 'daily',
    name: '温暖日常',
    icon: '🏠',
    description: '从熟悉的家庭和社区出发，安心进入故事。',
    sortOrder: 4,
    status: 'ACTIVE',
    fallbackGradient: 'linear-gradient(140deg,#9a6445,#d8a45d)',
  },
] as const;

interface SceneSeed {
  id: string;
  categoryId: string;
  name: string;
  emoji: string;
  description: string;
  sortOrder: number;
  worldView: string;
  emotionalArc: string;
  safetyGuideline: string;
  ageFocus: Record<SceneAgeGroupId, string>;
  settings?: Record<SceneAgeGroupId, string>;
  skeletons?: Record<SceneAgeGroupId, string>;
}

function defineScene(seed: SceneSeed): SceneCardDefinition {
  const settings = seed.settings ?? {
    '0-2': `${seed.worldView}${seed.ageFocus['0-2']}，用柔和感官和重复节奏展开。`,
    '2-4': `${seed.worldView}${seed.ageFocus['2-4']}，围绕一个清楚的小任务单线推进。`,
    '4-6': `${seed.worldView}${seed.ageFocus['4-6']}，加入观察、选择与轻量协作。`,
    '6-8': `${seed.worldView}${seed.ageFocus['6-8']}，加入简单推理、分工和复盘。`,
  };
  const skeletons = seed.skeletons ?? {
    '0-2': `从${seed.ageFocus['0-2']}开始，围绕“${seed.description}”反复感受声音与动作，最后在熟悉陪伴中安静入睡。`,
    '2-4': `主角遇见${seed.ageFocus['2-4']}，完成一个可预期的小任务，得到感谢后回到温暖、安全的休息处。`,
    '4-6': `主角根据${seed.ageFocus['4-6']}找到线索，与伙伴完成“${seed.description}”的温和任务，带着纪念物安心回家。`,
    '6-8': `主角围绕${seed.ageFocus['6-8']}制定简单计划，在协作中解决问题，分享收获后平静看夜色入睡。`,
  };
  return {
    ...seed,
    coverImage: `/scene-cards/${seed.id}.jpg`,
    status: 'ACTIVE',
    catalogVersion: SCENE_CATALOG_VERSION,
    settings,
    skeletons,
  };
}

export const SCENE_CARDS: readonly SceneCardDefinition[] = [
  defineScene({
    id: 'cloud_bakery', categoryId: 'fantasy', name: '云朵面包房', emoji: '☁️', sortOrder: 1,
    description: '把热乎乎的月亮面包送到窗边。',
    worldView: '每份食物都承载关心，合作让温暖被传递。', emotionalArc: '从期待到完成，再到满足和放松。',
    safetyGuideline: '避免火焰危险细节，烘焙过程低风险呈现。',
    ageFocus: { '0-2': '软云像被子、钟声缓缓响', '2-4': '面团精灵等待一起做点心', '4-6': '风铃街上的夜空订单', '6-8': '配方、路线和时间需要协调' },
    settings: {
      '0-2': '软软云层像被子，空气里有淡淡奶香，钟声慢慢响。',
      '2-4': '彩虹烤箱会唱歌，面团精灵在面粉星星里翻滚。',
      '4-6': '天空街区有邮差滑索和棉花糖桥，夜空订单缓缓送达。',
      '6-8': '云端工坊分区协作，负责烘焙、配送与顾客反馈。',
    },
    skeletons: {
      '0-2': '在软云床和缓慢烤箱声里闻着香气入睡。',
      '2-4': '和面团精灵做点心并把它送给云端伙伴。',
      '4-6': '穿过风铃街完成一份夜空订单。',
      '6-8': '协调配方、路线和时间，在合作后看星空放松。',
    },
  }),
  defineScene({
    id: 'moon_post_office', categoryId: 'fantasy', name: '月亮邮局', emoji: '🌙', sortOrder: 2,
    description: '替月亮寄出一封写给星星的晚安信。',
    worldView: '月光会化成邮票，真诚的晚安都能找到收信人。', emotionalArc: '从思念到行动，最终获得回应与安宁。',
    safetyGuideline: '旅程始终有月光指引，不出现黑暗迷失或高空危险。',
    ageFocus: { '0-2': '月光邮票轻轻闪烁', '2-4': '小信封等待找到邮箱', '4-6': '远近不同的星星收件点', '6-8': '星图路线与投递顺序' },
  }),
  defineScene({
    id: 'starlight_forest', categoryId: 'fantasy', name: '星光森林', emoji: '🌟', sortOrder: 3,
    description: '跟着萤火虫找回迷路的小星星。',
    worldView: '森林里的微光会互相照亮，星星也能在树梢休息。', emotionalArc: '从小小担心到互相帮助，再到团聚安心。',
    safetyGuideline: '不进入幽暗洞穴，不出现猛兽、追逐或惊吓。',
    ageFocus: { '0-2': '萤火虫一亮一灭', '2-4': '小星星在树叶后等待', '4-6': '光亮、声音和叶片组成线索', '6-8': '不同亮度的路线需要判断' },
  }),
  defineScene({
    id: 'toy_kingdom', categoryId: 'fantasy', name: '玩具王国', emoji: '🧸', sortOrder: 4,
    description: '在玩具醒来的夜晚，完成温柔巡游。',
    worldView: '被珍惜的玩具在夜里醒来，用游戏维护小小王国。', emotionalArc: '从惊喜到投入，最终归位并道晚安。',
    safetyGuideline: '不使用知名 IP，不出现玩具打斗、破坏或争抢。',
    ageFocus: { '0-2': '积木轻响、布偶挥手', '2-4': '玩具们等待睡前点名', '4-6': '巡游队伍需要轮流和配合', '6-8': '玩具街区的任务需要合理分工' },
  }),
  defineScene({
    id: 'candy_island', categoryId: 'fantasy', name: '糖果浮岛', emoji: '🍭', sortOrder: 5,
    description: '乘棉花糖热气球送回彩虹果实。',
    worldView: '彩色岛屿漂在柔软云海上，甜味只是想象中的颜色魔法。', emotionalArc: '从缤纷好奇到顺利送达，最后回到柔软云床。',
    safetyGuideline: '不鼓励过量吃糖，不描写坠落、失控飞行或牙齿焦虑。',
    ageFocus: { '0-2': '柔软云朵和彩色圆点', '2-4': '彩虹果实等待按颜色放好', '4-6': '热气球沿颜色航标前进', '6-8': '风向、重量和投递顺序需要配合' },
  }),
  defineScene({
    id: 'dino_express_station', categoryId: 'fantasy', name: '恐龙快递站', emoji: '🦕', sortOrder: 6,
    description: '骑着小翼龙，把晚安包裹送到山谷。',
    worldView: '温和恐龙与现代服务协作共存，规则明确、互助友好。', emotionalArc: '从任务期待到顺利完成，回落到平静满足。',
    safetyGuideline: '恐龙均为温和伙伴，不出现捕食或惊吓场景。',
    ageFocus: { '0-2': '小恐龙脚步像摇篮节拍', '2-4': '歪掉的路线牌等待扶正', '4-6': '取件、识路与投递三个环节', '6-8': '替代路线兼顾效率和休息' },
    settings: {
      '0-2': '温顺的小恐龙在月光草地慢慢走，脚步像摇篮节拍。',
      '2-4': '快递站像大树屋，滑索把包裹送到蘑菇站台。',
      '4-6': '山谷里有路线牌和风向塔，翼龙负责温柔导航。',
      '6-8': '快递系统有调度中心、路线规划和社区服务任务。',
    },
    skeletons: {
      '0-2': '听着小恐龙缓慢脚步和晚风，在摇晃中入睡。',
      '2-4': '扶正路线牌并送达一件温暖的小包裹。',
      '4-6': '完成取件、识路、投递三段式温和任务。',
      '6-8': '与伙伴制定替代路线，兼顾效率和关怀。',
    },
  }),

  defineScene({
    id: 'ocean_bubble_city', categoryId: 'nature', name: '海底泡泡城', emoji: '🫧', sortOrder: 1,
    description: '和章鱼公交一起，去送一封发光的信。',
    worldView: '海洋是有温度的城市，每一种生物都在友好协作。', emotionalArc: '从好奇到安心，结尾回归温柔的漂浮感。',
    safetyGuideline: '避免惊吓性海怪和危险追逐，结尾回到安心入睡。',
    ageFocus: { '0-2': '蓝光、泡泡与缓慢水声', '2-4': '小鱼等待章鱼公交送它回家', '4-6': '发光水母路灯组成路线', '6-8': '社区送信和路线设计任务' },
    settings: {
      '0-2': '一个被柔和蓝光包裹的水下摇篮，透明泡泡轻轻飘动。',
      '2-4': '透明管道连接会发光的泡泡房子，章鱼公交在珊瑚站台停靠。',
      '4-6': '海底缓坡上的发光城市，有水晶穹顶、海胆摩天轮和海蛇电车。',
      '6-8': '分区清晰的海底社区，有海马邮局、水母剧院和鲸歌图书馆。',
    },
    skeletons: {
      '0-2': '在温暖蓝光与重复水声中获得安全感，慢慢入睡。',
      '2-4': '乘章鱼公交帮助走丢的小鱼找到家人，再回到泡泡房间。',
      '4-6': '沿发光水母路灯完成一项温和任务，带着纪念物回家。',
      '6-8': '通过送信、观察与路线设计完成一次社区协作任务。',
    },
  }),
  defineScene({
    id: 'rainforest_treehouse', categoryId: 'nature', name: '雨林树屋', emoji: '🦜', sortOrder: 2,
    description: '沿藤蔓电梯拜访树冠上的动物邻居。',
    worldView: '雨林从地面到树冠住着不同邻居，大家尊重彼此的家。', emotionalArc: '从陌生好奇到礼貌拜访，再到听雨安心。',
    safetyGuideline: '不触碰未知动植物，不出现毒虫、坠落或独自冒险。',
    ageFocus: { '0-2': '雨滴、叶片和鸟鸣重复', '2-4': '藤蔓电梯停靠一个树屋', '4-6': '地面、树干和树冠住着不同动物', '6-8': '根据动物习性安排拜访路线' },
  }),
  defineScene({
    id: 'polar_light_station', categoryId: 'nature', name: '极地星光站', emoji: '🐧', sortOrder: 3,
    description: '陪小企鹅记录慢慢展开的极光。',
    worldView: '极地观测站温暖明亮，窗外的天空会缓慢变换颜色。', emotionalArc: '从耐心等待到发现惊喜，最后在暖屋里分享。',
    safetyGuideline: '始终在成人或站员陪同下观察，不描写暴风雪受困。',
    ageFocus: { '0-2': '绿蓝光带慢慢摇摆', '2-4': '小企鹅等待喜欢的颜色', '4-6': '用颜色和方向记录极光', '6-8': '比较多次观察并整理变化' },
  }),
  defineScene({
    id: 'insect_hotel', categoryId: 'nature', name: '昆虫旅馆', emoji: '🐞', sortOrder: 4,
    description: '帮瓢虫管家为夜归客人准备房间。',
    worldView: '昆虫旅馆用树枝、叶片和小孔洞为不同访客提供安静住处。', emotionalArc: '从忙碌准备到客人归来，最终一同熄灯。',
    safetyGuideline: '只观察不抓取未知昆虫，不渲染密集虫群或叮咬。',
    ageFocus: { '0-2': '小翅膀和叶片发出轻响', '2-4': '不同客人需要不同小房间', '4-6': '根据翅膀和身体特征准备住处', '6-8': '比较昆虫习性并规划房间' },
  }),
  defineScene({
    id: 'four_season_valley', categoryId: 'nature', name: '四季花谷', emoji: '🌼', sortOrder: 5,
    description: '穿过四扇门，收集不同颜色的花香。',
    worldView: '花谷的四个区域同时保留春夏秋冬，每扇门都有自己的颜色和气味。', emotionalArc: '从变化惊喜到完成配对，最后停在最舒适的季节。',
    safetyGuideline: '不采食陌生植物，不出现极端天气和过敏医疗建议。',
    ageFocus: { '0-2': '四种颜色和花香轮流出现', '2-4': '花瓣等待回到同色篮子', '4-6': '季节、颜色和天气需要配对', '6-8': '观察季节变化并解释简单原因' },
  }),
  defineScene({
    id: 'volcano_spring_valley', categoryId: 'nature', name: '火山温泉谷', emoji: '♨️', sortOrder: 6,
    description: '认识温暖岩石和轻轻升起的蒸汽。',
    worldView: '温泉谷设有安全观景台，岩石余温让水汽缓缓升起。', emotionalArc: '从谨慎观察到理解现象，最后在温暖中放松。',
    safetyGuideline: '只在安全距离观察，不接近热水或火山口，不出现喷发追逐。',
    ageFocus: { '0-2': '暖色岩石和白色蒸汽缓缓移动', '2-4': '在栏杆后寻找温暖与凉爽的颜色', '4-6': '观察热气上升和水滴变化', '6-8': '比较岩石温度与蒸汽形成线索' },
  }),

  defineScene({
    id: 'space_observatory', categoryId: 'science', name: '太空观测站', emoji: '🚀', sortOrder: 1,
    description: '为打哈欠的小行星画一条回家轨道。',
    worldView: '观测站用图画和模型认识星体运动，太空安静而有秩序。', emotionalArc: '从疑问到发现规律，最后看星光缓慢远去。',
    safetyGuideline: '不渲染太空灾难、失重恐惧或真实航天危险。',
    ageFocus: { '0-2': '星点按缓慢节奏移动', '2-4': '小行星沿一条圆圆路线回家', '4-6': '根据远近和方向画轨道', '6-8': '比较轨道线索并修正简单路线' },
  }),
  defineScene({
    id: 'weather_factory', categoryId: 'science', name: '天气工厂', emoji: '🌦️', sortOrder: 2,
    description: '把云、风和小雨滴放进天气盒子。',
    worldView: '天气工厂用友好模型演示云、风和雨的联系，不控制真实天气。', emotionalArc: '从混乱分类到看懂联系，最后听轻雨入睡。',
    safetyGuideline: '不出现雷击、洪水或极端天气逃生情节。',
    ageFocus: { '0-2': '云朵、风声和雨滴依次出现', '2-4': '三种天气元素等待放回盒子', '4-6': '观察云、风和雨的简单关系', '6-8': '根据线索组合一份温和天气记录' },
  }),
  defineScene({
    id: 'robot_lab', categoryId: 'science', name: '机器人实验室', emoji: '🤖', sortOrder: 3,
    description: '教小机器人分辨轻重、远近和声音。',
    worldView: '机器人通过比较和练习学习，每次出错都可以温柔重来。', emotionalArc: '从笨拙试验到逐步掌握，最终一起充电休息。',
    safetyGuideline: '不出现电击、爆炸、失控机器或替代人类的焦虑。',
    ageFocus: { '0-2': '机器人重复简单声音和动作', '2-4': '轻重不同的积木等待分类', '4-6': '轻重、远近和声音需要比较', '6-8': '设计测试顺序并根据结果调整' },
  }),
  defineScene({
    id: 'body_universe', categoryId: 'science', name: '身体小宇宙', emoji: '🫀', sortOrder: 4,
    description: '乘迷你飞船认识心跳和呼吸。',
    worldView: '身体用心跳、呼吸和休息维持日常节奏，每个部分都值得照顾。', emotionalArc: '从倾听身体到理解节奏，最后跟随呼吸放松。',
    safetyGuideline: '只做基础身体认知，不提供诊断、治疗承诺或医疗操作。',
    ageFocus: { '0-2': '听心跳、感受慢慢呼吸', '2-4': '小飞船沿呼吸节奏前进', '4-6': '比较活动和休息时的身体感受', '6-8': '记录心跳呼吸并理解休息的重要' },
  }),
  defineScene({
    id: 'transport_invention_city', categoryId: 'science', name: '交通发明城', emoji: '🚲', sortOrder: 5,
    description: '为不同道路选择轮子、船帆和路线。',
    worldView: '城市用不同交通工具连接陆地、水面和缓坡，安全规则始终优先。', emotionalArc: '从选择困难到找到合适工具，最后顺利抵达。',
    safetyGuideline: '强调安全带、陪同和规则，不出现竞速、碰撞或危险驾驶。',
    ageFocus: { '0-2': '轮子慢慢转、船帆轻轻摇', '2-4': '道路和交通工具等待配对', '4-6': '比较地面、水面和坡道条件', '6-8': '综合路线、工具和安全规则做选择' },
  }),
  defineScene({
    id: 'dino_dig_camp', categoryId: 'science', name: '恐龙考古营', emoji: '🦴', sortOrder: 6,
    description: '从脚印和化石拼出一位远古朋友。',
    worldView: '考古营根据留下的线索认识过去，猜想需要和证据分开。', emotionalArc: '从发现线索到耐心拼合，最终欣赏远古生命。',
    safetyGuideline: '不复活真实恐龙，不出现捕食、惊吓或危险挖掘。',
    ageFocus: { '0-2': '刷子轻扫、石头纹路重复', '2-4': '几块大骨头等待放回轮廓', '4-6': '脚印和化石提供不同线索', '6-8': '区分证据和猜想并完成复原记录' },
  }),

  defineScene({
    id: 'grandma_magic_garden', categoryId: 'daily', name: '外婆的魔法菜园', emoji: '🌱', sortOrder: 1,
    description: '和豆荚一起种下发光的晚安种子。',
    worldView: '植物会回应善意，照料与劳动创造温柔奇迹。', emotionalArc: '从探索到收获，最终回归被爱包裹的平静。',
    safetyGuideline: '冲突仅限轻度迷路或物品丢失，不设置危险追逐。',
    ageFocus: { '0-2': '晚风、叶响和家人的手', '2-4': '豆荚等待找回种子', '4-6': '花粉线索与彩虹花墙', '6-8': '照料、采收和分享任务' },
    settings: {
      '0-2': '黄昏的菜园暖暖的，风吹叶子沙沙响，南瓜灯像小月亮。',
      '2-4': '豆藤搭成拱门，萝卜会眨眼，外婆在花径尽头招手。',
      '4-6': '菜园里有四季轮转的小温室，昆虫邮差在叶脉桥上送信。',
      '6-8': '菜园是村庄食材实验站，孩子参与照料、分工和分享。',
    },
    skeletons: {
      '0-2': '牵着家人的手听晚风歌，在暖光和拥抱中入睡。',
      '2-4': '帮助豆荚找回种子，沿叶子小路完成一个简单任务。',
      '4-6': '和萤火虫寻找花粉，修复彩虹花墙。',
      '6-8': '担任小园长，安排照料与分享任务后安心入睡。',
    },
  }),
  defineScene({
    id: 'bedtime_library', categoryId: 'daily', name: '晚安图书馆', emoji: '📚', sortOrder: 2,
    description: '帮书页角色找到各自的故事房间。',
    worldView: '每本书都有一间安静小屋，角色在合上书页前互道晚安。', emotionalArc: '从角色走散到逐一归位，最后图书馆熄灯。',
    safetyGuideline: '不使用知名作品角色，不出现被书困住或黑暗惊吓。',
    ageFocus: { '0-2': '翻页声和暖灯反复出现', '2-4': '一个小角色等待回到图画里', '4-6': '根据故事线索匹配角色和房间', '6-8': '整理角色顺序并补全温和故事线' },
  }),
  defineScene({
    id: 'little_kitchen', categoryId: 'daily', name: '小小厨房', emoji: '🥣', sortOrder: 3,
    description: '和家人准备一碗会冒星星的暖汤。',
    worldView: '厨房是家人一起准备食物的温暖空间，每个人都有安全的小任务。', emotionalArc: '从备料期待到共同完成，最后分享暖意。',
    safetyGuideline: '孩子不靠近刀具、明火或热锅，不提供饮食医疗建议。',
    ageFocus: { '0-2': '汤匙轻响、香气和拥抱', '2-4': '软食材等待放进安全小碗', '4-6': '颜色、顺序和分工组成食谱', '6-8': '安排准备步骤并照顾每个人的需要' },
  }),
  defineScene({
    id: 'kindergarten_night', categoryId: 'daily', name: '幼儿园夜游', emoji: '🎒', sortOrder: 4,
    description: '替安静教室里的玩具完成睡前点名。',
    worldView: '夜晚的幼儿园熟悉而安静，玩具们遵循白天学会的秩序。', emotionalArc: '从重返熟悉空间到完成点名，最终安心离开。',
    safetyGuideline: '始终有可信成人陪同，不描写独自滞留、陌生人或黑暗恐惧。',
    ageFocus: { '0-2': '熟悉的椅子、铃声和软玩具', '2-4': '玩具等待一个个报到', '4-6': '按区域和顺序完成点名', '6-8': '核对名单并帮助遗漏玩具归位' },
  }),
  defineScene({
    id: 'community_store', categoryId: 'daily', name: '社区便利店', emoji: '🧺', sortOrder: 5,
    description: '帮夜班小动物把物品放回正确货架。',
    worldView: '小店连接社区邻居，物品按用途摆放，互相帮忙让夜晚更安心。', emotionalArc: '从货架小混乱到整齐有序，最后向邻居道晚安。',
    safetyGuideline: '不涉及真实交易诱导、独自夜行或陌生人风险。',
    ageFocus: { '0-2': '包装颜色和收银铃轻响', '2-4': '相同物品等待放在一起', '4-6': '按用途和颜色整理货架', '6-8': '根据邻居需求规划整理顺序' },
  }),
  defineScene({
    id: 'family_camp', categoryId: 'daily', name: '家庭露营地', emoji: '⛺', sortOrder: 6,
    description: '搭好帐篷，听着虫鸣一起看星星。',
    worldView: '露营地离家不远，家人共同准备，在规则和陪伴中亲近夜色。', emotionalArc: '从搭建期待到静听自然，最后依偎入睡。',
    safetyGuideline: '强调家人陪同、营地边界和用火安全，不进入野外深处。',
    ageFocus: { '0-2': '虫鸣、毯子和家人呼吸', '2-4': '睡袋和小灯等待放好', '4-6': '一起搭帐篷并辨认几颗星星', '6-8': '分配装备、观察天气并遵守营地规则' },
  }),
] as const;

export const ACTIVE_SCENE_CATEGORIES = SCENE_CATEGORIES
  .filter((category) => category.status === 'ACTIVE')
  .sort((a, b) => a.sortOrder - b.sortOrder);

export const ACTIVE_SCENE_CARDS = SCENE_CARDS
  .filter((scene) => scene.status === 'ACTIVE')
  .sort((a, b) => a.sortOrder - b.sortOrder);

export function getScenesByCategory(categoryId: string) {
  return ACTIVE_SCENE_CARDS.filter((scene) => scene.categoryId === categoryId);
}

export function findScene(sceneId: string) {
  return ACTIVE_SCENE_CARDS.find((scene) => scene.id === sceneId);
}
