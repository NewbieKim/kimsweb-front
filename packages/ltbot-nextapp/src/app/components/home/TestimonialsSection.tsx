const TESTIMONIALS = [
  {
    avatar: "👩",
    name: "李雅婷",
    role: "两个孩子的妈妈",
    stars: 5,
    content:
      "自从用了 DreamyTales，每天晚上孩子都主动要求听故事！AI 把她的名字和小猫咪编进故事里，她激动得不行，每次都听到睡着。",
  },
  {
    avatar: "👨",
    name: "张文博",
    role: "5岁男孩的爸爸",
    stars: 5,
    content:
      "以前哄睡要一个小时，现在半小时就搞定。故事内容很有想象力，孩子听完会主动说：爸爸我们明天继续听！真的太省心了。",
  },
  {
    avatar: "👩‍🦱",
    name: "陈晓云",
    role: "幼儿园老师",
    stars: 5,
    content:
      "我推荐给了很多家长，反馈都很好。故事内容积极健康，没有任何广告，节奏舒缓很适合睡前使用。作为老师我强烈推荐！",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="w-full py-16" style={{ background: "var(--theme-bg-surface)" }}>
      <div className="container mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-10">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: "var(--theme-text)" }}
          >
            家长们怎么说
          </h2>
          <p className="text-sm md:text-base" style={{ color: "var(--theme-text-muted)" }}>
            真实用户的真实反馈，来自 10,000+ 个幸福家庭
          </p>
        </div>

        {/* 评价卡片 - 移动端横向滑动，桌面端3列 */}
        <div className="flex lg:grid lg:grid-cols-3 gap-5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-2 lg:pb-0">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex-shrink-0 w-72 sm:w-80 lg:w-auto snap-start flex flex-col gap-4 p-6 rounded-2xl border"
              style={{
                background: "var(--theme-bg-subtle)",
                borderColor: "var(--theme-border)",
                boxShadow: "0 2px 16px var(--theme-card-shadow)",
              }}
            >
              {/* 头像 + 姓名 */}
              <div className="flex items-center gap-3">
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center text-2xl border-2"
                  style={{
                    background: "var(--theme-bg-surface)",
                    borderColor: "var(--theme-border)",
                  }}
                >
                  {t.avatar}
                </span>
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "var(--theme-text)" }}
                  >
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                    {t.role}
                  </p>
                </div>
              </div>

              {/* 星评 */}
              <div className="flex gap-0.5 text-yellow-400 text-sm">
                {"★".repeat(t.stars)}
              </div>

              {/* 评价内容 */}
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--theme-text-muted)" }}
              >
                "{t.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
