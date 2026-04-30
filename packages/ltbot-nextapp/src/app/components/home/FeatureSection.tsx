const FEATURES = [
  {
    icon: "🤖",
    title: "AI 定制故事",
    desc: "根据孩子的姓名、喜好、性格量身创作，每次都是专属情节",
  },
  {
    icon: "🛡️",
    title: "安全无广告",
    desc: "纯净内容环境，无任何广告打扰，适合 0-8 岁儿童安心使用",
  },
  {
    icon: "🌙",
    title: "助力入睡",
    desc: "舒缓语调与睡前故事场景设计，帮助孩子快速平静、进入梦乡",
  },
  {
    icon: "💛",
    title: "亲子时光",
    desc: "父母与孩子共同聆听，加深亲子情感，培养阅读兴趣",
  },
];

export default function FeatureSection() {
  return (
    <section className="w-full py-16" style={{ background: "var(--theme-bg-surface)" }}>
      <div className="container mx-auto px-4">
        {/* 标题区 */}
        <div className="text-center mb-10">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: "var(--theme-text)" }}
          >
            为什么选择 DreamyTales？
          </h2>
          <p className="text-sm md:text-base" style={{ color: "var(--theme-text-muted)" }}>
            每一个功能，都是为孩子的美好睡眠而设计
          </p>
        </div>

        {/* 4宫格卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center text-center gap-3 p-5 md:p-6 rounded-2xl border transition-shadow hover:shadow-md"
              style={{
                background: "var(--theme-bg-subtle)",
                borderColor: "var(--theme-border)",
                boxShadow: "0 2px 12px var(--theme-card-shadow)",
              }}
            >
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-2xl md:text-3xl"
                style={{ background: "var(--theme-bg-surface)" }}
              >
                {f.icon}
              </div>
              <h3
                className="font-semibold text-sm md:text-base"
                style={{ color: "var(--theme-text)" }}
              >
                {f.title}
              </h3>
              <p className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
