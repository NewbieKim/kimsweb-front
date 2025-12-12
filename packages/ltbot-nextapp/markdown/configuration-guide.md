# 项目配置指南

本文档说明 AI睡眠空间 项目的配置文件和全局样式的使用方法。

---

## 配置文件结构

```
ltbot-nextapp/
├── tailwind.config.ts      # Tailwind CSS 配置
├── src/
│   └── app/
│       └── globals.css     # 全局样式
└── markdown/
    ├── tailwind-guide.md   # Tailwind 使用指南
    └── configuration-guide.md  # 本文档
```

---

## Tailwind 配置详解

### 1. 响应式断点

项目配置了7个断点，覆盖从小手机到大屏桌面的所有设备：

```typescript
screens: {
  'xs': '375px',      // iPhone SE, 小屏手机
  'sm': '640px',      // 手机横屏, 大屏手机
  'md': '768px',      // iPad 竖屏, 平板
  'lg': '1024px',     // iPad 横屏, 小笔记本
  'xl': '1280px',     // 桌面显示器
  '2xl': '1536px',    // 大屏显示器
  'miniapp': '375px', // 微信小程序标准宽度
}
```

**使用示例：**
```jsx
<div className="text-sm md:text-base lg:text-lg xl:text-xl">
  响应式文字
</div>
```

### 2. 自定义颜色系统

#### Primary (紫色系)
主要用于品牌色、主按钮、重要强调元素。

```jsx
<button className="bg-primary-500 hover:bg-primary-600">
  主按钮
</button>
```

#### Secondary (粉色系)
用于次要元素、装饰、辅助强调。

```jsx
<div className="border-secondary-300 text-secondary-600">
  次要内容
</div>
```

#### Accent (蓝色系)
用于链接、提示信息、特殊状态。

```jsx
<a href="#" className="text-accent-500 hover:text-accent-600">
  链接文本
</a>
```

### 3. 自定义间距

扩展了标准间距，适合大屏布局：

```typescript
spacing: {
  '128': '32rem',  // 512px
  '144': '36rem',  // 576px
}
```

**使用场景：**
```jsx
<div className="mb-128">大区块间距</div>
<div className="space-y-144">超大间距列表</div>
```

### 4. 字体大小

所有字体大小都包含行高配置，确保视觉平衡：

```jsx
<h1 className="text-5xl">    {/* 3rem / 1 */}
<h2 className="text-4xl">    {/* 2.25rem / 2.5rem */}
<h3 className="text-3xl">    {/* 1.875rem / 2.25rem */}
<p className="text-base">    {/* 1rem / 1.5rem */}
<span className="text-sm">   {/* 0.875rem / 1.25rem */}
```

### 5. 圆角

```typescript
borderRadius: {
  '4xl': '2rem',    // 32px
  '5xl': '2.5rem',  // 40px
}
```

**使用示例：**
```jsx
<div className="rounded-4xl">超大圆角</div>
<button className="rounded-full">完全圆角按钮</button>
```

### 6. 动画

预设了4种常用动画：

```jsx
<div className="animate-fade-in">淡入</div>
<div className="animate-slide-up">上滑</div>
<div className="animate-slide-down">下滑</div>
<div className="animate-scale-in">缩放</div>
```

### 7. 阴影

三种强度的柔和阴影：

```jsx
<div className="shadow-soft">轻柔阴影</div>
<div className="shadow-medium">中等阴影</div>
<div className="shadow-strong">强烈阴影</div>
```

---

## 全局样式详解

### 1. CSS 变量

在 `globals.css` 中定义的变量可在整个项目使用：

```css
:root {
  --color-primary: #a855f7;
  --color-secondary: #ec4899;
  --spacing-page: 1rem;
  --radius-md: 1rem;
  --shadow-soft: 0 2px 15px rgba(0, 0, 0, 0.08);
}
```

**使用方式：**
```jsx
<div style={{ color: 'var(--color-primary)' }}>
  使用 CSS 变量
</div>
```

### 2. 预设组件类

#### 按钮类

```jsx
// 主按钮
<button className="btn-primary">主要操作</button>

// 次要按钮
<button className="btn-secondary">次要操作</button>

// 基础按钮（需自定义颜色）
<button className="btn-base bg-green-500 text-white">
  自定义按钮
</button>
```

#### 卡片类

```jsx
<div className="card">
  <h3>卡片标题</h3>
  <p>卡片内容自动带有圆角、内边距和阴影效果</p>
</div>
```

#### 输入框类

```jsx
<input 
  type="text" 
  className="input" 
  placeholder="自动样式的输入框"
/>
```

### 3. 工具类

#### 文字渐变

```jsx
<h1 className="text-gradient-primary">
  紫粉渐变文字
</h1>

<h1 className="text-gradient-accent">
  三色渐变文字
</h1>
```

#### 背景渐变

```jsx
<div className="bg-gradient-primary">紫粉渐变背景</div>
<div className="bg-gradient-soft">柔和渐变背景</div>
<div className="bg-gradient-header">导航栏渐变背景</div>
```

#### 安全区域

```jsx
<header className="safe-top">
  适配刘海屏的顶部安全区域
</header>

<footer className="safe-bottom">
  适配底部安全区域
</footer>
```

#### 隐藏滚动条

```jsx
<div className="overflow-y-auto scrollbar-hide">
  内容可滚动但不显示滚动条
</div>
```

#### 文字省略

```jsx
<p className="line-clamp-1">单行省略</p>
<p className="line-clamp-2">两行省略</p>
<p className="line-clamp-3">三行省略</p>
```

### 4. 响应式容器

```jsx
<div className="container-responsive">
  自动响应式内边距的容器
  - 手机: 1rem
  - 平板: 2rem
  - 桌面: 3rem，最大宽度1280px
</div>
```

---

## 实际应用示例

### 示例 1: 响应式页面布局

```jsx
export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* 容器 */}
      <div className="container-responsive py-8 md:py-12 lg:py-16">
        {/* 标题 */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gradient-primary mb-6">
          页面标题
        </h1>
        
        {/* 网格布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* 卡片 */}
          <div className="card animate-fade-in">
            <h3 className="text-xl font-semibold mb-2">卡片标题</h3>
            <p className="text-gray-600 line-clamp-3">卡片内容...</p>
            <button className="btn-primary mt-4 w-full">操作按钮</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 示例 2: 自定义组件

```jsx
// components/FeatureCard.tsx
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="card hover:-translate-y-1 transition-transform">
      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      <p className="text-sm md:text-base text-gray-600 line-clamp-2">
        {description}
      </p>
    </div>
  );
};

// 使用
<FeatureCard 
  icon="✨"
  title="快速创作"
  description="几分钟即可生成精彩故事"
/>
```

### 示例 3: 表单组件

```jsx
export const ContactForm = () => {
  return (
    <form className="space-y-4 md:space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          姓名
        </label>
        <input 
          type="text" 
          className="input" 
          placeholder="请输入您的姓名"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          邮箱
        </label>
        <input 
          type="email" 
          className="input" 
          placeholder="your@email.com"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          留言
        </label>
        <textarea 
          className="input h-32 resize-none" 
          placeholder="写下您的想法..."
        />
      </div>
      
      <button type="submit" className="btn-primary w-full">
        提交
      </button>
    </form>
  );
};
```

---

## 微信小程序特殊适配

### 1. 安全区域

```jsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body className="safe-top safe-bottom">
        {children}
      </body>
    </html>
  );
}
```

### 2. 避免使用的样式

```jsx
// ❌ 不推荐：backdrop-filter 性能差
<div className="backdrop-blur-lg">内容</div>

// ✅ 推荐：使用透明度
<div className="bg-white/90">内容</div>
```

### 3. 触摸优化

```jsx
<button className="touch-manipulation active:scale-95">
  按钮点击无延迟
</button>
```

---

## 性能优化建议

### 1. 使用预设类而非重复代码

```jsx
// ❌ 不推荐
<button className="px-6 py-3 bg-purple-500 text-white rounded-full">按钮1</button>
<button className="px-6 py-3 bg-purple-500 text-white rounded-full">按钮2</button>

// ✅ 推荐
<button className="btn-primary">按钮1</button>
<button className="btn-primary">按钮2</button>
```

### 2. 条件类名使用工具

```bash
npm install clsx
```

```jsx
import clsx from 'clsx';

<button className={clsx(
  'btn-base',
  isPrimary ? 'bg-primary-500' : 'bg-secondary-500',
  isLarge && 'px-8 py-4'
)}>
  动态按钮
</button>
```

### 3. 提取重复组件

将常用的样式组合提取为独立组件，提高可维护性。

---

## 调试工具

### 断点指示器（开发环境）

在 `layout.tsx` 中添加：

```jsx
const BreakpointIndicator = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black text-white px-3 py-2 rounded text-xs font-mono">
      <span className="xs:hidden sm:hidden md:hidden lg:hidden xl:hidden 2xl:hidden">xs</span>
      <span className="hidden sm:inline md:hidden">sm</span>
      <span className="hidden md:inline lg:hidden">md</span>
      <span className="hidden lg:inline xl:hidden">lg</span>
      <span className="hidden xl:inline 2xl:hidden">xl</span>
      <span className="hidden 2xl:inline">2xl</span>
    </div>
  );
};
```

---

## 常见问题

### Q: 为什么我的自定义颜色不生效？

A: 确保已重启开发服务器。Tailwind 配置更改需要重启。

### Q: 如何添加新的颜色？

A: 在 `tailwind.config.ts` 的 `theme.extend.colors` 中添加：

```typescript
colors: {
  custom: {
    500: '#your-color',
  }
}
```

### Q: 全局样式没有应用？

A: 检查 `globals.css` 是否在 `layout.tsx` 中正确导入：

```tsx
import './globals.css';
```

### Q: 如何禁用深色模式？

A: 在 `tailwind.config.ts` 中添加：

```typescript
darkMode: false, // 或 'class' 使用类名控制
```

---

## 更新日志

### v1.0.0 (2024-12)
- ✅ 初始化 Tailwind 配置
- ✅ 添加响应式断点
- ✅ 配置品牌色系统
- ✅ 创建全局样式
- ✅ 添加预设组件类

---

## 相关文档

- [Tailwind 使用指南](./tailwind-guide.md)
- [Tailwind 官方文档](https://tailwindcss.com)
- [Next.js 样式文档](https://nextjs.org/docs/app/building-your-application/styling)

---

## 技术支持

如有问题，请查阅：
1. 本配置指南
2. [Tailwind 使用指南](./tailwind-guide.md)
3. 项目 README.md

