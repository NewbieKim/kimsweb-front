"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, SiteTheme } from "@/contexts/ThemeContext";

const THEMES: { id: SiteTheme; label: string; colors: string[] }[] = [
  {
    id: "beige",
    label: "米色风",
    colors: ["#c4956a", "#8b7355", "#f5f0e8"],
  },
  {
    id: "purple",
    label: "紫粉风",
    colors: ["#8b5cf6", "#ec4899", "#f3e8ff"],
  }
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--theme-bg-subtle)] transition-colors text-xl"
        aria-label="选择主题"
        title="选择主题风格"
      >
        🎨
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-52 rounded-2xl border shadow-xl p-3 flex flex-col gap-2"
          style={{
            background: "var(--theme-bg-surface)",
            borderColor: "var(--theme-border)",
            boxShadow: "0 8px 30px var(--theme-card-shadow)",
          }}
        >
          <p
            className="text-xs font-semibold mb-1 px-1"
            style={{ color: "var(--theme-text-muted)" }}
          >
            选择风格
          </p>
          <div className="flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="flex-1 flex flex-col items-center gap-1.5 rounded-xl p-2 border-2 transition-all"
                style={{
                  borderColor:
                    theme === t.id ? "var(--theme-accent)" : "var(--theme-border)",
                  background:
                    theme === t.id ? "var(--theme-bg-subtle)" : "transparent",
                }}
              >
                <div className="flex gap-0.5">
                  {t.colors.map((c) => (
                    <span
                      key={c}
                      className="w-4 h-4 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      theme === t.id
                        ? "var(--theme-accent)"
                        : "var(--theme-text-muted)",
                  }}
                >
                  {t.label}
                </span>
                {theme === t.id && (
                  <span className="text-xs" style={{ color: "var(--theme-accent)" }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
