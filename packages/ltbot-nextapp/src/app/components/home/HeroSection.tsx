import Link from "next/link";
import Image from "next/image";

const AVATARS = ["👩", "👨", "👧", "👦", "🧒"];

export default function HeroSection() {
  return (
    <section
      className="w-full pt-4 pb-12 md:pt-8 md:pb-16"
      style={{ background: "var(--theme-bg-base)" }}
    >
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
        {/* 左侧文字区 */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          {/* Badge */}
          <span
            className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{
              background: "var(--theme-badge-bg)",
              color: "var(--theme-badge-text)",
            }}
          >
            ✨ 专为 0-8 岁儿童打造的 AI 睡前故事应用
          </span>

          {/* 主标题 */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span
              style={{
                background:
                  "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              每个孩子的故事
            </span>
            <br />
            <span style={{ color: "var(--theme-text)" }}>都独一无二</span>
          </h1>

          {/* 副标题 */}
          <p
            className="text-base md:text-lg max-w-xl"
            style={{ color: "var(--theme-text-muted)" }}
          >
            用 AI 为孩子量身定制专属睡前故事，融入他最爱的角色、名字与冒险场景，
            每晚入睡前都是一段奇妙旅程。
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/create-story"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-white font-semibold text-base shadow-lg hover:opacity-90 transition-opacity"
              style={{
                background:
                  "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
              }}
            >
              免费生成故事 →
            </Link>
            <Link
              href="/to-explore-story"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-semibold text-base border-2 hover:opacity-80 transition-opacity"
              style={{
                borderColor: "var(--theme-accent)",
                color: "var(--theme-accent)",
              }}
            >
              探索故事
            </Link>
          </div>

          {/* 社会证明 */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex -space-x-2">
              {AVATARS.map((a, i) => (
                <span
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 border-white"
                  style={{ background: "var(--theme-bg-subtle)" }}
                >
                  {a}
                </span>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-yellow-400 text-sm">★★★★★</span>
              <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                深受 10,000+ 家庭喜爱
              </span>
            </div>
          </div>
        </div>

        {/* 右侧背景图 + 静态播放器 */}
        <div className="flex-1 w-full max-w-md lg:max-w-none">
          <div
            className="relative rounded-3xl overflow-hidden min-h-[320px] md:min-h-[420px] shadow-2xl"
            style={{ border: "1px solid var(--theme-border)" }}
          >
            <Image
              src="/home/backup.png"
              alt="睡前故事场景背景图"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm">
              <div className="rounded-2xl bg-white/95 backdrop-blur px-3 py-2 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src="/home/backup.png"
                      alt="播放器封面"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 truncate">
                      月夜里的小星星
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      为 5 岁昕昕定制
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500">▶</span>
                      <div className="flex-1 h-1 rounded-full bg-zinc-200 overflow-hidden">
                        <div className="h-full w-1/3 rounded-full bg-violet-500" />
                      </div>
                      <span className="text-[10px] text-zinc-500">02:45</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
