# 首页改造与换肤功能开发文档

> 生成日期：2026-04-30  
> 关联方案：首页改造与换肤功能设计方案（`首页改造与换肤_0828c01b.plan.md`）

---

## 一、图一内容分析（DreamyTales Landing Page）

图一为产品标准落地页，从上至下共 **5 大区块**：

| # | 区块名称 | 核心内容 |
|---|---------|---------|
| 1 | **HeroSection**（首屏英雄区） | 品牌标语、主副标题、CTA 按钮组、社会证明、AI 插图 |
| 2 | **FeatureSection**（产品特性区） | 4 宫格特性卡片：AI定制故事 / 安全无广告 / 助力入睡 / 亲子时光 |
| 3 | **PersonalizationSection**（个性化定制演示区） | 左文右图两栏，功能特点列表 + CTA，右侧故事创作 UI 模拟 |
| 4 | **TestimonialsSection**（用户评价区） | 3 张评价卡片，含头像、星评、评价内容 |
| 5 | **FooterSection**（页脚/订阅区） | 品牌 Logo、邮件订阅、导航链接、社媒图标 |

---

## 二、组件清单

### 2.1 新增文件

```
src/
├── app/
│   ├── components/
│   │   ├── home/
│   │   │   ├── HeroSection.tsx               # 首屏区块
│   │   │   ├── FeatureSection.tsx             # 产品特性区块
│   │   │   ├── PersonalizationSection.tsx     # 个性化定制演示区块
│   │   │   ├── TestimonialsSection.tsx        # 用户评价区块
│   │   │   └── FooterSection.tsx             # 页脚区块
│   │   └── ThemeToggle.tsx                   # 换肤切换按钮（Popover 菜单）
│   └── page.tsx                              # 改造：引用各 home/ 子组件
├── contexts/
│   └── ThemeContext.tsx                      # 全局主题 Context + Provider
```

### 2.2 改动已有文件

| 文件 | 改动说明 |
|------|---------|
| `src/app/page.tsx` | 重构首页，按序引用 5 个 home/ 子组件 |
| `src/app/layout.tsx` | `<html>` 标签加 `suppressHydrationWarning`；`<head>` 注入防闪烁内联脚本 |
| `src/app/providers.tsx` | 包裹 `ThemeProvider` |
| `src/app/globals.css` | 添加两套主题 CSS 变量 |
| `src/app/components/Header.tsx` | 加入 `ThemeToggle` 组件 |

---

## 三、各组件设计规格

### 3.1 HeroSection

| 项目 | 规格 |
|------|------|
| 布局（移动） | 单列，上文下图，图片高度 260px |
| 布局（桌面） | `lg:flex-row` 左右两栏，左文右插图 |
| 标题（移动） | `text-3xl` |
| 标题（桌面） | `lg:text-6xl` |
| CTA（移动） | 两按钮垂直堆叠 |

**内容要素：**
- 顶部小标签 Badge：`专为 0-8 岁儿童打造的 AI 睡前故事应用`
- 主标题：`每个孩子的故事，都独一无二`
- 副标题文案
- 主 CTA：`免费生成故事` → `/create-story`
- 次 CTA：`探索故事` → `/to-explore-story`
- 社会证明：用户头像组 + 星评 + 用户数文案
- 右侧：AI 插图区（渐变背景 + emoji/图片）

### 3.2 FeatureSection

| 项目 | 规格 |
|------|------|
| 布局（移动） | `grid-cols-2`，2 列 2 行 |
| 布局（桌面） | `lg:grid-cols-4`，4 列 1 行 |

**4 个特性卡片结构：** 图标圆圈 + 标题 + 描述

| # | 图标 | 特性名称 |
|---|------|---------|
| 1 | 🤖 | AI 定制故事 |
| 2 | 🛡️ | 安全无广告 |
| 3 | 🌙 | 助力入睡 |
| 4 | 👨‍👩‍👧 | 亲子时光 |

### 3.3 PersonalizationSection

| 项目 | 规格 |
|------|------|
| 布局（移动） | 仅展示左侧文字内容 + CTA |
| 布局（桌面/平板） | 左文右图两栏，`md:grid-cols-2` |
| 右侧内容 | 故事创作 UI 模拟截图 + 故事插图（`md:block hidden`） |

**左侧功能特点列表（4 条打勾项）：**
1. 自定义主角姓名与外貌
2. 选择故事主题与场景
3. AI 实时生成专属故事
4. 配套精美插图

### 3.4 TestimonialsSection

| 项目 | 规格 |
|------|------|
| 布局（移动） | 横向滑动 `overflow-x-auto snap-x` |
| 布局（桌面） | `lg:grid-cols-3` |
| 卡片元素 | 头像 + 姓名 + 星评（5星）+ 评价内容 |

### 3.5 FooterSection

| 项目 | 规格 |
|------|------|
| 布局（移动） | 单列，订阅区在上，链接分块在下 |
| 布局（桌面） | 左侧插图+订阅区，右侧导航链接 3 列 |
| 功能 | 邮件订阅输入框 + 产品/支持/法律链接 + 社媒图标 |

---

## 四、换肤功能方案

### 4.1 技术架构

基于 **CSS 自定义属性（CSS Variables）** + `data-site-theme` 属性实现，对 Tailwind 与 HeroUI 侵入性最小。

```
ThemeContext（React Context）
    └── ThemeProvider（providers.tsx 包裹）
            ├── 初始化：读取 localStorage → 设置 html[data-site-theme]
            └── ThemeToggle（Header 内）
                    └── 用户点击 → 写入 localStorage + 更新 data-site-theme
                                    └── globals.css --theme-* 变量生效
                                            └── 各页面组件使用 theme 变量
```

支持主题值：`"purple"（默认，紫粉风格）` | `"beige"（米色风格）`

### 4.2 CSS Variables 定义（globals.css）

```css
/* 紫粉风格（默认） */
:root,
[data-site-theme="purple"] {
  --theme-bg-base:        #faf5ff;
  --theme-bg-surface:     #ffffff;
  --theme-bg-subtle:      #f3e8ff;
  --theme-accent:         #a855f7;
  --theme-accent-hover:   #9333ea;
  --theme-secondary:      #ec4899;
  --theme-text:           #171717;
  --theme-text-muted:     #6b7280;
  --theme-border:         #e9d5ff;
  --theme-card-shadow:    rgba(168,85,247,0.1);
  --theme-gradient-from:  #8b5cf6;
  --theme-gradient-to:    #ec4899;
  --theme-badge-bg:       #f3e8ff;
  --theme-badge-text:     #7e22ce;
}

/* 简约米色风格 */
[data-site-theme="beige"] {
  --theme-bg-base:        #faf7f2;
  --theme-bg-surface:     #fffcf7;
  --theme-bg-subtle:      #f5f0e8;
  --theme-accent:         #c4956a;
  --theme-accent-hover:   #a87a55;
  --theme-secondary:      #8b7355;
  --theme-text:           #3d2b1f;
  --theme-text-muted:     #7c6b5a;
  --theme-border:         #e8ddd0;
  --theme-card-shadow:    rgba(139,115,85,0.1);
  --theme-gradient-from:  #c4956a;
  --theme-gradient-to:    #8b7355;
  --theme-badge-bg:       #f5f0e8;
  --theme-badge-text:     #7c5c3a;
}
```

### 4.3 ThemeContext 设计（src/contexts/ThemeContext.tsx）

```tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type SiteTheme = "purple" | "beige";

interface ThemeContextValue {
  theme: SiteTheme;
  setTheme: (t: SiteTheme) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "purple",
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<SiteTheme>("purple");

  useEffect(() => {
    const saved = localStorage.getItem("site-theme") as SiteTheme;
    if (saved) applyTheme(saved);
  }, []);

  const applyTheme = (t: SiteTheme) => {
    document.documentElement.setAttribute("data-site-theme", t);
    localStorage.setItem("site-theme", t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

### 4.4 ThemeToggle 组件设计（src/app/components/ThemeToggle.tsx）

- **外观**：图标按钮（🎨），位于 Header 右侧
- **行为**：点击后弹出 Popover 小菜单，展示两个主题选项，各附预览色块
- **选中状态**：当前主题高亮显示（边框 + 勾选图标）

```
┌────────────────────────┐
│  🎨  选择风格           │
│ ┌──────┐  ┌──────────┐ │
│ │紫粉风 │  │ 米色风   │ │
│ │ ■■■  │  │  ■■■    │ │
│ │  ✓   │  │         │ │
│ └──────┘  └──────────┘ │
└────────────────────────┘
```

### 4.5 防止首屏主题闪烁（FOUC）

在 `layout.tsx` 的 `<head>` 中注入内联脚本，SSR 阶段从 localStorage 读取主题并立即设置：

```tsx
<html lang="zh" suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: `
      try {
        var t = localStorage.getItem('site-theme') || 'purple';
        document.documentElement.setAttribute('data-site-theme', t);
      } catch(e) {}
    `}} />
  </head>
  <body>...</body>
</html>
```

---

## 五、移动端适配策略

遵循 `tailwind-guide.md` 的移动优先原则（Mobile First）：

| 区块 | 移动端 | 平板+ |
|------|--------|-------|
| Hero | 单列，图在下，CTA 堆叠 | 左右两栏 |
| Features | 2 列 2 行（`grid-cols-2`） | 4 列 1 行（`lg:grid-cols-4`） |
| Personalization | 仅文字 + CTA | 左右两栏（`md:grid-cols-2`） |
| Testimonials | 横向滑动卡片（`overflow-x-auto snap-x`） | 3 列网格（`lg:grid-cols-3`） |
| Footer | 单列堆叠 | 两栏布局 |

---

## 六、开发任务清单

### 阶段一：换肤基础设施

- [ ] 创建 `src/contexts/ThemeContext.tsx`（ThemeContext + ThemeProvider + useTheme）
- [ ] 修改 `src/app/globals.css`，添加两套 CSS Variables
- [ ] 修改 `src/app/providers.tsx`，包裹 `ThemeProvider`
- [ ] 修改 `src/app/layout.tsx`，注入防闪烁脚本 + `suppressHydrationWarning`
- [ ] 创建 `src/app/components/ThemeToggle.tsx`
- [ ] 修改 `src/app/components/Header.tsx`，引入 `ThemeToggle`

### 阶段二：首页组件开发

- [ ] 创建 `src/app/components/home/HeroSection.tsx`
- [ ] 创建 `src/app/components/home/FeatureSection.tsx`
- [ ] 创建 `src/app/components/home/PersonalizationSection.tsx`
- [ ] 创建 `src/app/components/home/TestimonialsSection.tsx`
- [ ] 创建 `src/app/components/home/FooterSection.tsx`

### 阶段三：首页重构

- [ ] 重构 `src/app/page.tsx`，按序引用 5 个 home/ 子组件

### 阶段四：联调与验证

- [ ] 验证紫粉 / 米色主题切换效果
- [ ] 验证 localStorage 持久化（刷新后主题不变）
- [ ] 验证防闪烁效果（首屏不出现白屏再切主题）
- [ ] 验证移动端各区块响应式布局
- [ ] 验证桌面端各区块响应式布局

---

## 七、主题变量使用示例

在组件中通过 CSS 变量使用主题色，配合 Tailwind 的任意值语法：

```tsx
// 使用 CSS 变量（推荐，自动跟随主题切换）
<div style={{ backgroundColor: "var(--theme-bg-base)", color: "var(--theme-text)" }}>
  ...
</div>

// 或者在 globals.css 中定义 Tailwind 工具类扩展
// 并在组件中使用 className="bg-theme-base text-theme-primary"
```

---

## 八、文件依赖关系图

```
page.tsx
  ├── HeroSection.tsx
  ├── FeatureSection.tsx
  ├── PersonalizationSection.tsx
  ├── TestimonialsSection.tsx
  └── FooterSection.tsx

layout.tsx
  └── providers.tsx
        └── ThemeContext.tsx（ThemeProvider）

Header.tsx
  └── ThemeToggle.tsx
        └── ThemeContext.tsx（useTheme）

globals.css
  └── CSS Variables（--theme-*）
```
