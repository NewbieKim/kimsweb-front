# Tailwind CSS 使用指南

本指南针对 AI睡眠空间 H5应用程序，涵盖PC端、平板、手机（含微信小程序）的响应式设计最佳实践。

---

## 目录

1. [响应式设计断点](#响应式设计断点)
2. [移动优先策略](#移动优先策略)
3. [常用布局模式](#常用布局模式)
4. [自定义颜色系统](#自定义颜色系统)
5. [字体和排版](#字体和排版)
6. [间距规范](#间距规范)
7. [组件开发规范](#组件开发规范)
8. [性能优化建议](#性能优化建议)
9. [常见问题和解决方案](#常见问题和解决方案)

---

## 响应式设计断点

### 断点配置

项目配置的断点如下：

```javascript
{
  'xs': '375px',      // 小手机（iPhone SE）
  'sm': '640px',      // 手机横屏
  'md': '768px',      // 平板竖屏（iPad）
  'lg': '1024px',     // 平板横屏/小笔记本
  'xl': '1280px',     // 桌面
  '2xl': '1536px',    // 大屏桌面
  'miniapp': '375px', // 微信小程序
}
```

### 使用示例

```jsx
// 基础用法：从小到大逐步覆盖
<div className="text-sm md:text-base lg:text-lg">
  响应式文字大小
</div>

// 显示/隐藏元素
<div className="hidden md:block">
  仅在平板及以上显示
</div>

<div className="block md:hidden">
  仅在手机上显示
</div>

// 布局变化
<div className="flex-col md:flex-row">
  手机竖向排列，平板及以上横向排列
</div>
```

---

## 移动优先策略

### 核心原则

**始终从最小屏幕开始设计，然后逐步增强。**

✅ **推荐做法**

```jsx
// 默认样式适配手机，然后逐步增强
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">标题</h1>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* 内容 */}
  </div>
</div>
```

❌ **避免做法**

```jsx
// 不要从桌面开始然后向下适配
<div className="p-8 md:p-6 sm:p-4"> {/* 错误！ */}
```

### 容器设计

```jsx
// 使用 container 类配合响应式 padding
<div className="container mx-auto px-4 md:px-6 lg:px-8">
  {/* 内容会自动适配不同屏幕 */}
</div>

// 设置最大宽度防止内容过宽
<div className="max-w-md md:max-w-lg lg:max-w-4xl mx-auto">
  {/* 内容 */}
</div>
```

---

## 常用布局模式

### 1. 响应式网格布局

```jsx
// 自适应列数
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <div>项目1</div>
  <div>项目2</div>
  <div>项目3</div>
  <div>项目4</div>
</div>

// 卡片网格
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
  {/* 卡片内容 */}
</div>
```

### 2. Flex 布局

```jsx
// 响应式方向切换
<div className="flex flex-col md:flex-row gap-4 items-center">
  <div className="w-full md:w-1/2">左侧内容</div>
  <div className="w-full md:w-1/2">右侧内容</div>
</div>

// 自动换行
<div className="flex flex-wrap gap-2 md:gap-4">
  <button>按钮1</button>
  <button>按钮2</button>
  <button>按钮3</button>
</div>
```

### 3. 居中布局

```jsx
// 水平垂直居中
<div className="flex items-center justify-center min-h-screen">
  <div>居中内容</div>
</div>

// 文字居中，不同屏幕不同对齐
<div className="text-center md:text-left">
  手机居中，平板及以上左对齐
</div>
```

### 4. 侧边栏布局

```jsx
// 响应式侧边栏
<div className="flex flex-col md:flex-row">
  {/* 侧边栏 */}
  <aside className="w-full md:w-64 lg:w-80 bg-gray-100 p-4">
    侧边栏内容
  </aside>
  
  {/* 主内容 */}
  <main className="flex-1 p-4 md:p-6 lg:p-8">
    主内容区域
  </main>
</div>
```

---

## 自定义颜色系统

### 品牌色使用

项目定义了三套颜色系统：

```jsx
// 主色调 - 紫色系
<div className="bg-primary-500 text-white">主按钮</div>
<div className="text-primary-600 hover:text-primary-700">链接</div>

// 次要色 - 粉色系
<div className="bg-secondary-500">次要元素</div>
<div className="border-secondary-300">边框</div>

// 强调色 - 蓝色系
<div className="bg-accent-500">强调内容</div>
<div className="text-accent-600">提示文字</div>
```

### 渐变效果

```jsx
// 品牌渐变
<div className="bg-gradient-to-r from-purple-500 to-pink-500">
  紫粉渐变背景
</div>

<div className="bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
  柔和渐变背景
</div>

// 文字渐变
<span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
  渐变文字效果
</span>
```

### 透明度使用

```jsx
// 使用透明度创建层次感
<div className="bg-white/90 backdrop-blur-sm">
  半透明背景 + 毛玻璃效果
</div>

<div className="bg-purple-500/10 hover:bg-purple-500/20">
  浅色背景，悬停加深
</div>
```

---

## 字体和排版

### 响应式字体大小

```jsx
// 标题层级
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
  一级标题
</h1>

<h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold">
  二级标题
</h2>

<h3 className="text-xl md:text-2xl lg:text-3xl font-semibold">
  三级标题
</h3>

// 正文
<p className="text-sm md:text-base lg:text-lg leading-relaxed">
  正文内容，行高舒适
</p>

// 小字
<span className="text-xs md:text-sm text-gray-500">
  辅助说明文字
</span>
```

### 字体粗细

```jsx
<p className="font-light">细体 - 300</p>
<p className="font-normal">常规 - 400</p>
<p className="font-medium">中等 - 500</p>
<p className="font-semibold">半粗 - 600</p>
<p className="font-bold">粗体 - 700</p>
```

### 行高和间距

```jsx
// 紧凑布局
<p className="leading-tight">紧凑行高</p>

// 正常布局
<p className="leading-normal">正常行高</p>

// 宽松布局（适合长文本）
<p className="leading-relaxed md:leading-loose">
  宽松行高，阅读舒适
</p>

// 字间距
<p className="tracking-tight">紧凑字间距</p>
<p className="tracking-wide">宽松字间距</p>
```

---

## 间距规范

### 内边距（Padding）

```jsx
// 响应式内边距
<div className="p-4 md:p-6 lg:p-8">
  全方向内边距
</div>

// 单方向内边距
<div className="pt-4 pb-6 px-4 md:px-6">
  顶部4，底部6，左右响应式
</div>

// 容器内边距推荐值
<div className="px-4 md:px-6 lg:px-8 xl:px-12">
  标准容器内边距
</div>
```

### 外边距（Margin）

```jsx
// 元素间距
<div className="space-y-4 md:space-y-6 lg:space-y-8">
  <div>元素1</div>
  <div>元素2</div>
  <div>元素3</div>
</div>

// 区块间距
<section className="mb-8 md:mb-12 lg:mb-16">
  区块内容
</section>

// 响应式间距
<div className="mt-4 md:mt-6 lg:mt-8">
  响应式上边距
</div>
```

### 间距推荐表

| 用途 | 手机 (xs-sm) | 平板 (md) | 桌面 (lg+) |
|-----|-------------|----------|-----------|
| 容器内边距 | p-4 | p-6 | p-8 |
| 元素间距 | space-y-4 | space-y-6 | space-y-8 |
| 区块间距 | mb-8 | mb-12 | mb-16 |
| 卡片内边距 | p-4 | p-5 | p-6 |
| 按钮内边距 | px-4 py-2 | px-6 py-3 | px-8 py-4 |

---

## 组件开发规范

### 1. 按钮组件

```jsx
// 主按钮
<button className="
  px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4
  text-sm md:text-base lg:text-lg
  bg-gradient-to-r from-purple-500 to-pink-500
  text-white font-semibold
  rounded-full
  shadow-lg hover:shadow-xl
  transition-all duration-300
  active:scale-95
">
  创作故事
</button>

// 次要按钮
<button className="
  px-4 py-2 md:px-6 md:py-3
  text-sm md:text-base
  border-2 border-purple-300
  text-purple-600
  rounded-full
  hover:bg-purple-50
  transition-colors
">
  探索更多
</button>
```

### 2. 卡片组件

```jsx
<div className="
  bg-white
  rounded-xl md:rounded-2xl lg:rounded-3xl
  p-4 md:p-5 lg:p-6
  shadow-soft hover:shadow-medium
  transition-shadow duration-300
">
  <h3 className="text-lg md:text-xl font-semibold mb-2">卡片标题</h3>
  <p className="text-sm md:text-base text-gray-600">卡片内容</p>
</div>
```

### 3. 表单输入

```jsx
<input
  type="text"
  className="
    w-full
    px-4 py-3 md:px-5 md:py-3.5
    text-sm md:text-base
    border-2 border-gray-300
    rounded-lg md:rounded-xl
    focus:border-purple-500 focus:ring-2 focus:ring-purple-200
    transition-colors
    placeholder:text-gray-400
  "
  placeholder="请输入内容"
/>
```

### 4. 导航栏

```jsx
<nav className="
  sticky top-0 z-50
  bg-gradient-to-r from-purple-50 to-pink-50
  backdrop-blur-sm bg-white/90
  border-b border-gray-200
  px-4 md:px-6 lg:px-8
  py-4
">
  {/* 导航内容 */}
</nav>
```

---

## 性能优化建议

### 1. 减少类名数量

```jsx
// ✅ 推荐：提取公共样式到组件
const buttonBaseClasses = "px-6 py-3 rounded-full font-semibold transition-all";
<button className={`${buttonBaseClasses} bg-purple-500 text-white`}>按钮</button>

// ❌ 避免：过多重复类名
<button className="px-6 py-3 rounded-full font-semibold transition-all bg-purple-500 text-white">按钮1</button>
<button className="px-6 py-3 rounded-full font-semibold transition-all bg-pink-500 text-white">按钮2</button>
```

### 2. 使用 @apply（谨慎）

```css
/* globals.css */
@layer components {
  .btn-primary {
    @apply px-4 py-2 md:px-6 md:py-3 
           bg-gradient-to-r from-purple-500 to-pink-500
           text-white font-semibold rounded-full
           shadow-lg hover:shadow-xl
           transition-all duration-300;
  }
}
```

```jsx
<button className="btn-primary">使用自定义类</button>
```

### 3. 条件类名

```jsx
import clsx from 'clsx'; // 或使用 classnames 库

const Button = ({ variant, size, children }) => {
  return (
    <button
      className={clsx(
        'font-semibold rounded-full transition-all',
        {
          'bg-purple-500 text-white': variant === 'primary',
          'bg-white text-purple-500 border-2': variant === 'secondary',
          'px-4 py-2 text-sm': size === 'small',
          'px-6 py-3 text-base': size === 'medium',
          'px-8 py-4 text-lg': size === 'large',
        }
      )}
    >
      {children}
    </button>
  );
};
```

---

## 常见问题和解决方案

### 1. 移动端点击延迟

```jsx
// 添加 touch-action 类
<button className="touch-manipulation active:scale-95">
  无延迟按钮
</button>
```

### 2. 防止横向滚动

```css
/* globals.css */
html, body {
  overflow-x: hidden;
}
```

```jsx
// 使用 max-w-full 和 overflow-hidden
<div className="max-w-full overflow-hidden">
  内容不会导致横向滚动
</div>
```

### 3. 安全区域适配（刘海屏）

```css
/* globals.css */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### 4. 微信小程序兼容

```jsx
// 避免使用 backdrop-filter（性能问题）
// ❌ <div className="backdrop-blur-lg">

// 使用固定颜色替代
// ✅ <div className="bg-white/90">
```

### 5. 图片响应式

```jsx
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="描述"
  width={800}
  height={600}
  className="w-full h-auto rounded-lg"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// 或使用背景图
<div className="
  w-full h-48 md:h-64 lg:h-80
  bg-cover bg-center bg-no-repeat
  rounded-lg
" style={{ backgroundImage: 'url(/image.jpg)' }}>
</div>
```

### 6. 文字截断

```jsx
// 单行截断
<p className="truncate w-full">
  超长文本会被截断...
</p>

// 多行截断
<p className="line-clamp-2 md:line-clamp-3">
  手机显示2行，平板及以上显示3行
</p>
```

---

## 实战示例

### 完整的响应式卡片组件

```jsx
const StoryCard = ({ title, description, image }) => {
  return (
    <div className="
      group
      bg-white
      rounded-xl md:rounded-2xl
      overflow-hidden
      shadow-soft hover:shadow-medium
      transition-all duration-300
      hover:-translate-y-1
    ">
      {/* 图片区域 */}
      <div className="
        relative
        w-full
        h-48 md:h-56 lg:h-64
        overflow-hidden
      ">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* 内容区域 */}
      <div className="p-4 md:p-5 lg:p-6 space-y-2 md:space-y-3">
        <h3 className="
          text-lg md:text-xl lg:text-2xl
          font-semibold
          text-gray-800
          line-clamp-2
        ">
          {title}
        </h3>

        <p className="
          text-sm md:text-base
          text-gray-600
          line-clamp-3
        ">
          {description}
        </p>

        <button className="
          w-full md:w-auto
          px-4 py-2 md:px-6 md:py-3
          text-sm md:text-base
          bg-gradient-to-r from-purple-500 to-pink-500
          text-white font-semibold
          rounded-full
          hover:shadow-lg
          transition-shadow
        ">
          阅读故事
        </button>
      </div>
    </div>
  );
};
```

---

## 调试技巧

### 1. 查看当前断点

```jsx
// 添加调试组件（开发环境）
const BreakpointIndicator = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black text-white px-3 py-1 rounded text-xs font-mono">
      <span className="sm:hidden">xs</span>
      <span className="hidden sm:inline md:hidden">sm</span>
      <span className="hidden md:inline lg:hidden">md</span>
      <span className="hidden lg:inline xl:hidden">lg</span>
      <span className="hidden xl:inline 2xl:hidden">xl</span>
      <span className="hidden 2xl:inline">2xl</span>
    </div>
  );
};
```

### 2. 浏览器开发者工具

- Chrome DevTools 的设备模拟器
- 响应式设计模式（Ctrl/Cmd + Shift + M）
- 自定义设备尺寸测试

---

## 总结

### 关键要点

1. **移动优先**：始终从最小屏幕开始设计
2. **渐进增强**：逐步为大屏幕添加样式
3. **语义化断点**：使用有意义的断点名称
4. **性能优先**：减少不必要的类名和样式
5. **可维护性**：保持代码整洁和一致性

### 快速检查清单

- [ ] 所有文字大小都有响应式适配
- [ ] 容器内边距在不同屏幕合适
- [ ] 图片在所有设备正常显示
- [ ] 按钮点击区域足够大（至少44x44px）
- [ ] 在真实设备上测试（而不仅是浏览器）
- [ ] 检查横屏和竖屏显示
- [ ] 确保无横向滚动条（除非有意为之）
- [ ] 微信小程序内测试通过

---

## 参考资源

- [Tailwind CSS 官方文档](https://tailwindcss.com/docs)
- [Next.js 图片优化](https://nextjs.org/docs/basic-features/image-optimization)
- [MDN 响应式设计](https://developer.mozilla.org/zh-CN/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [移动端适配最佳实践](https://web.dev/responsive-web-design-basics/)

