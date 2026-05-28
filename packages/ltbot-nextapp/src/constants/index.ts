export const MenuList = [
    {
        name: "首页",
        path: "/",
    },
    {
        name: "创作故事",
        path: "/create-story",
    },
    {
        name: "探索故事",
        path: "/to-explore-story",
    },
    {
        name: "创作音乐",
        path: "/create-music",
    },
    {
        name: "音乐广场",
        path: "/to-explore-music",
    },
    {
        name: "我的主页",
        path: "/to-view-mine",
    },
    {
        name: "退出登录",
        path: "/to-sign-out",
    }
];

export const StorySubjectList =  [
    {
        label: "经典主题",
        childSubjectList: [
            {
                label: "成长挑战",
                value: "成长挑战",
            },
            {
                label: "情绪认知",
                value: "情绪认知",
            },
        ],
    },
    {
        label: "励志主题",
        childSubjectList: [
            {
                label: "励志主题",
                value: "励志主题",
            },
        ],
    },
    {
        label: "科普主题",
        childSubjectList: [
            {
                label: "海洋世界",
                value: "海洋世界",
            },
            {
                label: "动物世界",
                value: "动物世界",
            },
            {
                label: "植物世界",
                value: "植物世界",
            },
        ],
    },
    {
        label: "童话主题",
        childSubjectList: [
            {
                label: "童话主题",
                value: "童话主题",
            },
        ],
    },
    {
        label: "科幻主题",
        childSubjectList: [
            {
                label: "科幻主题",
                value: "科幻主题",
            },
        ],
    },
    {
        label: "历史主题",
        childSubjectList: [
            {
                label: "历史主题",
                value: "历史主题",
            },
        ],
    },
    {
        label: "地理主题",
        childSubjectList: [
            {
                label: "地理主题",
                value: "地理主题",
            },
        ],
    },
    {
        label: "文化主题",
        childSubjectList: [
            {
                label: "文化主题",
                value: "文化主题",
            },
        ],
    },
    {
        label: "生活主题",
        childSubjectList: [
            {
                label: "生活主题",
                value: "生活主题",
            },
        ],
    },
    {
        label: "动物主题",
        childSubjectList: [
            {
                label: "动物主题",
                value: "动物主题",
            },
        ],
    },
    {
        label: "植物主题",
        childSubjectList: [
            {
                label: "植物主题",
                value: "植物主题",
            },
        ],
    },
    {
        label: "科技主题",
        childSubjectList: [
            {
                label: "科技主题",
                value: "科技主题",
            },
        ],
    },
    // "未来主题",
    // "环保主题",
    // "健康主题",
];

export interface QuickGrowthThemeItem {
    id: string;
    shortLabel: string;
    fullLabel: string;
    icon: string;
}

export interface QuickGrowthThemeCategory {
    id: string;
    name: string;
    description: string;
    themes: QuickGrowthThemeItem[];
}

export const QUICK_GROWTH_THEME_CATEGORIES: QuickGrowthThemeCategory[] = [
    {
        id: "health-selfcare",
        name: "健康自理维度",
        description: "打下独立生活的基础",
        themes: [
            { id: "sleep-routine", shortLabel: "安静入睡", fullLabel: "安静入睡，养成规律作息", icon: "💤" },
            { id: "brush-teeth", shortLabel: "认真刷牙", fullLabel: "认真刷牙，爱护牙齿健康", icon: "🦷" },
            { id: "eat-independently", shortLabel: "自主进食", fullLabel: "自主进食，不挑食不浪费", icon: "🍚" },
            { id: "wash-hands", shortLabel: "主动洗手", fullLabel: "主动洗手，做好卫生防护", icon: "🫧" },
            { id: "dress-self", shortLabel: "自己穿衣", fullLabel: "自己穿衣，整理个人物品", icon: "🧥" },
            { id: "drink-water", shortLabel: "坚持喝水", fullLabel: "坚持喝水，养成健康习惯", icon: "💧" },
            { id: "toilet-on-time", shortLabel: "按时如厕", fullLabel: "按时如厕，学习自理能力", icon: "🚽" },
            { id: "protect-eyes", shortLabel: "爱护眼睛", fullLabel: "爱护眼睛，正确使用电子设备", icon: "👀" },
            { id: "daily-exercise", shortLabel: "规律运动", fullLabel: "规律运动，坚持每日锻炼", icon: "🏃" },
        ],
    },
    {
        id: "emotion-social",
        name: "情绪社交维度",
        description: "学会与自己、他人相处",
        themes: [
            { id: "embrace-emotion", shortLabel: "拥抱情绪", fullLabel: "拥抱情绪，学会表达感受", icon: "🌈" },
            { id: "learn-share", shortLabel: "学会分享", fullLabel: "学会分享，感受同伴快乐", icon: "🤝" },
            { id: "greet-politely", shortLabel: "礼貌问好", fullLabel: "礼貌问好，主动结交朋友", icon: "👋" },
            { id: "listen-patiently", shortLabel: "耐心倾听", fullLabel: "耐心倾听，理解他人想法", icon: "👂" },
            { id: "friendly-talk", shortLabel: "友好沟通", fullLabel: "友好沟通，不乱发脾气", icon: "💬" },
            { id: "apologize", shortLabel: "学会道歉", fullLabel: "学会道歉，主动承认错误", icon: "🙏" },
            { id: "accept-difference", shortLabel: "接纳差异", fullLabel: "接纳差异，尊重不同同伴", icon: "🧩" },
            { id: "cooperate", shortLabel: "学会合作", fullLabel: "学会合作，和伙伴共完成", icon: "🫶" },
            { id: "empathy", shortLabel: "学会共情", fullLabel: "学会共情，关心同伴情绪", icon: "💞" },
        ],
    },
    {
        id: "courage-explore",
        name: "勇气探索维度",
        description: "突破恐惧，大胆探索世界",
        themes: [
            { id: "overcome-dark", shortLabel: "克服怕黑", fullLabel: "克服怕黑，勇敢面对夜晚", icon: "🌙" },
            { id: "try-bravely", shortLabel: "勇敢尝试", fullLabel: "勇敢尝试，挑战未知事物", icon: "⭐" },
            { id: "learn-from-mistake", shortLabel: "不怕犯错", fullLabel: "不怕犯错，从失败中学习", icon: "🛠️" },
            { id: "ask-question", shortLabel: "主动提问", fullLabel: "主动提问，好奇探索世界", icon: "❓" },
            { id: "overcome-shy", shortLabel: "克服胆怯", fullLabel: "克服胆怯，大胆表达自己", icon: "🦁" },
            { id: "try-new", shortLabel: "尝试新物", fullLabel: "尝试新物，不害怕陌生体验", icon: "🧪" },
            { id: "enjoy-alone", shortLabel: "享受独处", fullLabel: "享受独处，学会和自己相处", icon: "🧘" },
            { id: "face-difficulty", shortLabel: "直面困难", fullLabel: "直面困难，不轻易说“放弃”", icon: "⛰️" },
            { id: "express-needs", shortLabel: "主动表达", fullLabel: "主动表达，说出自己的需求", icon: "📣" },
        ],
    },
    {
        id: "character-gratitude",
        name: "品格感恩维度",
        description: "塑造温暖有力量的品格",
        themes: [
            { id: "help-home", shortLabel: "为家分担", fullLabel: "为家分担，做力所能及的家务", icon: "🏠" },
            { id: "be-thankful", shortLabel: "感恩小事", fullLabel: "感恩小事，珍惜家人的付出", icon: "🎁" },
            { id: "keep-promise", shortLabel: "说到做到", fullLabel: "说到做到，培养诚信品格", icon: "✅" },
            { id: "respect-elder", shortLabel: "尊重长辈", fullLabel: "尊重长辈，学习传统礼仪", icon: "🙇" },
            { id: "follow-rules", shortLabel: "遵守规则", fullLabel: "遵守规则，养成良好秩序感", icon: "📏" },
            { id: "protect-earth", shortLabel: "爱护环境", fullLabel: "爱护环境，节约资源不乱丢", icon: "🌱" },
            { id: "help-others", shortLabel: "乐于助人", fullLabel: "乐于助人，主动帮助身边人", icon: "🤲" },
            { id: "care-items", shortLabel: "爱护物品", fullLabel: "爱护物品，懂得珍惜不浪费", icon: "🧸" },
            { id: "take-responsibility", shortLabel: "承担责任", fullLabel: "承担责任，为自己的行为负责", icon: "🛡️" },
        ],
    },
];

export interface MusicSquareItem {
    id: string;
    name: string;
    duration: number;
    audioUrl: string;
    cardGradient: string;
    playerGradient: string;
    iconColor: string;
    iconType: string;
    description: string;
    ageHint: string;
}

export const MUSIC_SQUARE_LIST: MusicSquareItem[] = [
    {
        id: 'sleep-1',
        name: '摇篮曲',
        description: '摇篮曲，给宝宝带来放松的感觉',
        ageHint: '0-3岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/lullaby.mp3',
        cardGradient: 'from-pink-200 via-purple-100 to-indigo-100',
        playerGradient: 'linear-gradient(160deg, #fbcfe8 0%, #e9d5ff 40%, #c7d2fe 100%)',
        iconColor: '#7c3aed',
        iconType: 'lullaby',
    },
    {
        id: 'sleep-2',
        name: '妈妈哼唱',
        description: '柔和哼唱像被轻轻摇晃，帮助快速安静下来',
        ageHint: '0-3岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/moon.mp3',
        cardGradient: 'from-violet-200 via-purple-100 to-indigo-100',
        playerGradient: 'linear-gradient(160deg, #ddd6fe 0%, #e9d5ff 40%, #c7d2fe 100%)',
        iconColor: '#7c3aed',
        iconType: 'moon-cradle',
    },
    {
        id: 'sleep-3',
        name: '雨夜屋檐',
        description: '雨点节奏均匀，降低兴奋感，适合睡前过渡',
        ageHint: '2-8岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/rain.mp3',
        cardGradient: 'from-blue-200 via-sky-100 to-indigo-100',
        playerGradient: 'linear-gradient(160deg, #bfdbfe 0%, #bae6fd 40%, #c7d2fe 100%)',
        iconColor: '#2563eb',
        iconType: 'rain-cloud',
    },
    {
        id: 'sleep-4',
        name: '海浪呼吸',
        description: '一进一退的海浪节拍，引导孩子慢呼吸入睡',
        ageHint: '3-8岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/ocean.mp3',
        cardGradient: 'from-cyan-200 via-sky-100 to-blue-100',
        playerGradient: 'linear-gradient(160deg, #a5f3fc 0%, #bae6fd 40%, #dbeafe 100%)',
        iconColor: '#0891b2',
        iconType: 'water-waves',
    },
    {
        id: 'sleep-5',
        name: '林间虫鸣',
        description: '低密度虫鸣与风声，营造被自然包围的安心感',
        ageHint: '3-8岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/forest.mp3',
        cardGradient: 'from-green-200 via-emerald-100 to-lime-100',
        playerGradient: 'linear-gradient(160deg, #bbf7d0 0%, #a7f3d0 40%, #d9f99d 100%)',
        iconColor: '#16a34a',
        iconType: 'forest-cricket',
    },
    {
        id: 'sleep-6',
        name: '晚风风铃',
        description: '轻风掠过风铃，清透不刺耳，帮助情绪收拢',
        ageHint: '4-8岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/wind.mp3',
        cardGradient: 'from-amber-200 via-yellow-100 to-orange-100',
        playerGradient: 'linear-gradient(160deg, #fde68a 0%, #fef08a 40%, #fed7aa 100%)',
        iconColor: '#d97706',
        iconType: 'wind-chime',
    },
    {
        id: 'sleep-7',
        name: '篝火呢喃',
        description: '细小木柴噼啪声像夜间故事背景，温暖又稳定',
        ageHint: '4-8岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/campfire.mp3',
        cardGradient: 'from-orange-200 via-amber-100 to-rose-100',
        playerGradient: 'linear-gradient(160deg, #fdba74 0%, #fde68a 40%, #fecdd3 100%)',
        iconColor: '#ea580c',
        iconType: 'campfire',
    },
    {
        id: 'sleep-8',
        name: '星夜八音盒',
        description: '旋律简短重复，给 5-8 岁孩子温柔收尾仪式感',
        ageHint: '5-8岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/music-box.mp3',
        cardGradient: 'from-slate-200 via-indigo-100 to-violet-100',
        playerGradient: 'linear-gradient(160deg, #cbd5e1 0%, #c7d2fe 40%, #ddd6fe 100%)',
        iconColor: '#4f46e5',
        iconType: 'music-box',
    },
    {
        id: 'sleep-9',
        name: '吹风机白噪音',
        description: '吹风机白噪音，给宝宝带来放松的感觉',
        ageHint: '0-1岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/hair-dryer.mp3',
        cardGradient: 'from-gray-200 via-gray-100 to-gray-100',
        playerGradient: 'linear-gradient(160deg, #fecdd3 0%, #fbcfe8 40%, #fed7aa 100%)',
        iconColor: '#6b7280',
        iconType: 'fan',
    },
    {
        id: 'sleep-10',
        name: '妈妈心跳',
        description: '低频心跳律动，给 0-2 岁宝宝安全包裹感',
        ageHint: '0-2岁',
        duration: 1800,
        audioUrl: 'https://www.ltbot.top/audio/heartbeat.mp3',
        cardGradient: 'from-rose-200 via-pink-100 to-orange-100',
        playerGradient: 'linear-gradient(160deg, #fecdd3 0%, #fbcfe8 40%, #fed7aa 100%)',
        iconColor: '#e11d48',
        iconType: 'heartbeat',
    }
];