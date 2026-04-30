import Link from "next/link";

const FEATURES = [
  "输入孩子的名字，AI 自动将 TA 变为故事主角",
  "选择喜欢的动物、场景、冒险风格",
  "自定义故事时长，适合不同年龄段",
  "每次生成都是全新独特的故事情节",
];

export default function PersonalizationSection() {
  return (
    <section className="w-full py-16" style={{ background: "var(--theme-bg-base)" }}>
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
        {/* 左侧文字内容 */}
        <div className="flex-1 flex flex-col items-start gap-6">
          <span
            className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{
              background: "var(--theme-badge-bg)",
              color: "var(--theme-badge-text)",
            }}
          >
            🎨 个性化定制
          </span>

          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-bold leading-snug"
            style={{ color: "var(--theme-text)" }}
          >
            专属故事，
            <br />
            <span
              style={{
                background:
                  "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              由你来定义
            </span>
          </h2>

          <p className="text-sm md:text-base" style={{ color: "var(--theme-text-muted)" }}>
            只需几步简单设置，AI 便能为孩子创作一个充满想象力的专属冒险故事。
          </p>

          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm md:text-base">
                <span
                  className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                  }}
                >
                  ✓
                </span>
                <span style={{ color: "var(--theme-text)" }}>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/create-story"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-white font-semibold text-base shadow-lg hover:opacity-90 transition-opacity mt-2"
            style={{
              background:
                "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
            }}
          >
            开始创作 →
          </Link>
        </div>

        {/* 右侧 UI 演示区（md 以上展示） */}
        <div className="hidden md:flex flex-1 justify-center">
          <div
            className="w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col gap-4 border"
            style={{
              background: "var(--theme-bg-surface)",
              borderColor: "var(--theme-border)",
            }}
          >
            <div
              className="text-sm font-semibold"
              style={{ color: "var(--theme-text-muted)" }}
            >
              故事创作设置
            </div>

            {/* 模拟输入框 */}
            {[
              { label: "主角姓名", placeholder: "例如：小明、Lily..." },
              { label: "喜欢的动物", placeholder: "例如：小龙猫、独角兽..." },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--theme-text-muted)" }}
                >
                  {item.label}
                </label>
                <div
                  className="rounded-xl px-4 py-2.5 text-sm border"
                  style={{
                    background: "var(--theme-bg-subtle)",
                    borderColor: "var(--theme-border)",
                    color: "var(--theme-text-muted)",
                  }}
                >
                  {item.placeholder}
                </div>
              </div>
            ))}

            {/* 风格选择 */}
            <div className="flex flex-col gap-1">
              <label
                className="text-xs font-medium"
                style={{ color: "var(--theme-text-muted)" }}
              >
                故事风格
              </label>
              <div className="flex gap-2 flex-wrap">
                {["奇幻冒险", "温馨日常", "星际探险"].map((tag, i) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium border"
                    style={{
                      background: i === 0 ? "var(--theme-bg-subtle)" : "transparent",
                      borderColor: i === 0 ? "var(--theme-accent)" : "var(--theme-border)",
                      color: i === 0 ? "var(--theme-accent)" : "var(--theme-text-muted)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 插图预览区 */}
            <div
              className="rounded-2xl flex items-center justify-center py-6 text-5xl mt-2"
              style={{ background: "var(--theme-bg-subtle)" }}
            >
              🌟🐉🧒🌙✨
            </div>

            <div
              className="text-center text-xs"
              style={{ color: "var(--theme-text-muted)" }}
            >
              AI 正在为你的孩子创作专属故事…
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
