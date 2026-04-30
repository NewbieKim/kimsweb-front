"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  {
    title: "产品",
    items: [
      { label: "创作故事", href: "/create-story" },
      { label: "探索故事", href: "/to-explore-story" },
      { label: "探索音乐", href: "/to-explore-music" },
    ],
  },
  {
    title: "关于",
    items: [
      { label: "关于我们", href: "#" },
      { label: "隐私政策", href: "#" },
      { label: "服务条款", href: "#" },
    ],
  },
  {
    title: "支持",
    items: [
      { label: "帮助中心", href: "#" },
      { label: "联系我们", href: "#" },
      { label: "意见反馈", href: "#" },
    ],
  },
];

export default function FooterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer
      className="w-full pt-14 pb-8"
      style={{
        background: "var(--theme-bg-subtle)",
        borderTop: "1px solid var(--theme-border)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-10">
          {/* 左侧：品牌 + 订阅区 */}
          <div className="flex-1 flex flex-col gap-5">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌙</span>
              <span
                className="text-lg font-bold"
                style={{ color: "var(--theme-text)" }}
              >
                DreamyTales
              </span>
            </div>
            <p
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: "var(--theme-text-muted)" }}
            >
              专为 0-8 岁儿童打造的 AI 睡前故事应用，让每个孩子拥有属于自己的神奇故事。
            </p>

            {/* 订阅表单 */}
            <div className="flex flex-col gap-2">
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--theme-text)" }}
              >
                订阅获取最新故事灵感
              </p>
              {subscribed ? (
                <p className="text-sm" style={{ color: "var(--theme-accent)" }}>
                  感谢订阅！我们会定期发送精彩内容 ✨
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="输入你的邮箱"
                    required
                    className="flex-1 min-w-0 px-4 py-2.5 rounded-full text-sm border outline-none focus:ring-2"
                    style={{
                      background: "var(--theme-bg-surface)",
                      borderColor: "var(--theme-border)",
                      color: "var(--theme-text)",
                    }}
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-white whitespace-nowrap hover:opacity-90 transition-opacity"
                    style={{
                      background:
                        "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                    }}
                  >
                    订阅
                  </button>
                </form>
              )}
            </div>

            {/* 社媒图标 */}
            <div className="flex gap-3 mt-1">
              {["微信", "微博", "抖音"].map((s) => (
                <button
                  key={s}
                  className="text-xs px-3 py-1.5 rounded-full border hover:opacity-80 transition-opacity"
                  style={{
                    borderColor: "var(--theme-border)",
                    color: "var(--theme-text-muted)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 右侧：链接3列 */}
          <div className="flex gap-8 md:gap-12 flex-wrap">
            {LINKS.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--theme-text)" }}
                >
                  {group.title}
                </p>
                <ul className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-sm hover:underline transition-colors"
                        style={{ color: "var(--theme-text-muted)" }}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 底部版权 */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 border-t text-xs"
          style={{
            borderColor: "var(--theme-border)",
            color: "var(--theme-text-muted)",
          }}
        >
          <span>© 2026 DreamyTales. All rights reserved.</span>
          <span>Made with 💛 for every child's bedtime</span>
        </div>
      </div>
    </footer>
  );
}
