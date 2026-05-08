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
        name: "关于我",
        path: "/to-view-mine",
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