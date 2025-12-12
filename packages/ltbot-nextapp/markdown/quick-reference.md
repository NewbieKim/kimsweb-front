# Tailwind CSS 快速参考卡片

快速查找常用的 Tailwind 类名和项目配置。

---

## 🎯 响应式断点

```
xs:   ≥ 375px   (小手机)
sm:   ≥ 640px   (手机横屏)
md:   ≥ 768px   (平板竖屏)
lg:   ≥ 1024px  (平板横屏/笔记本)
xl:   ≥ 1280px  (桌面)
2xl:  ≥ 1536px  (大屏)
```

**用法：** `类名` → `md:类名` → `lg:类名`

---

## 🎨 品牌颜色

### Primary (紫色系)
```
bg-primary-50    #faf5ff  (最浅)
bg-primary-100   #f3e8ff
bg-primary-200   #e9d5ff
bg-primary-300   #d8b4fe
bg-primary-400   #c084fc
bg-primary-500   #a855f7  ⭐ 主色
bg-primary-600   #9333ea
bg-primary-700   #7e22ce
bg-primary-800   #6b21a8
bg-primary-900   #581c87  (最深)
```

### Secondary (粉色系)
```
bg-secondary-50   #fdf2f8
bg-secondary-500  #ec4899  ⭐ 主色
bg-secondary-900  #831843
```

### Accent (蓝色系)
```
bg-accent-50   #eff6ff
bg-accent-500  #3b82f6  ⭐ 主色
bg-accent-900  #1e3a8a
```

---

## 📏 间距系统

### 标准间距
```
p-0   0px      space-y-0   0px
p-1   0.25rem  space-y-1   0.25rem
p-2   0.5rem   space-y-2   0.5rem
p-4   1rem     space-y-4   1rem     ⭐ 常用
p-6   1.5rem   space-y-6   1.5rem   ⭐ 常用
p-8   2rem     space-y-8   2rem     ⭐ 常用
p-12  3rem     space-y-12  3rem
p-16  4rem     space-y-16  4rem
```

### 响应式间距示例
```jsx
// 内边距：手机4 → 平板6 → 桌面8
p-4 md:p-6 lg:p-8

// 外边距：手机8 → 平板12 → 桌面16
mb-8 md:mb-12 lg:mb-16

// 元素间距：手机4 → 平板6 → 桌面8
space-y-4 md:space-y-6 lg:space-y-8
```

---

## 📱 常用布局

### Flex 布局
```jsx
// 水平居中
flex justify-center

// 垂直居中
flex items-center

// 水平垂直居中
flex items-center justify-center

// 两端对齐
flex justify-between

// 响应式方向：竖向 → 横向
flex flex-col md:flex-row

// 自动换行
flex flex-wrap

// 间距
flex gap-4
```

### Grid 布局
```jsx
// 单列 → 2列 → 3列
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3

// 固定列数
grid grid-cols-2
grid grid-cols-3
grid grid-cols-4

// 间距
grid gap-4 md:gap-6

// 自动填充
grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]
```

---

## 🔤 字体系统

### 字体大小
```jsx
text-xs    0.75rem   (12px)
text-sm    0.875rem  (14px)  ⭐ 辅助文字
text-base  1rem      (16px)  ⭐ 正文
text-lg    1.125rem  (18px)
text-xl    1.25rem   (20px)
text-2xl   1.5rem    (24px)  ⭐ 小标题
text-3xl   1.875rem  (30px)
text-4xl   2.25rem   (36px)  ⭐ 大标题
text-5xl   3rem      (48px)
text-6xl   3.75rem   (60px)
```

### 响应式字体
```jsx
// 标题：手机2xl → 平板3xl → 桌面4xl
text-2xl md:text-3xl lg:text-4xl

// 正文：手机sm → 平板base → 桌面lg
text-sm md:text-base lg:text-lg
```

### 字体粗细
```jsx
font-light      300
font-normal     400  ⭐ 默认
font-medium     500
font-semibold   600  ⭐ 小标题
font-bold       700  ⭐ 大标题
```

### 行高
```jsx
leading-none      1
leading-tight     1.25
leading-normal    1.5   ⭐ 默认
leading-relaxed   1.625 ⭐ 长文本
leading-loose     2
```

---

## 🎭 圆角

```jsx
rounded-none      0
rounded-sm        0.125rem
rounded           0.25rem
rounded-md        0.375rem
rounded-lg        0.5rem    ⭐ 卡片
rounded-xl        0.75rem   ⭐ 卡片
rounded-2xl       1rem      ⭐ 大卡片
rounded-3xl       1.5rem
rounded-4xl       2rem      ⭐ 超大圆角
rounded-full      9999px    ⭐ 按钮/头像
```

---

## 🌈 阴影

```jsx
shadow-sm         小阴影
shadow            标准阴影
shadow-md         中等阴影
shadow-lg         大阴影
shadow-xl         超大阴影
shadow-2xl        极大阴影

// 自定义阴影
shadow-soft       柔和阴影      ⭐ 推荐
shadow-medium     中等柔和阴影  ⭐ 推荐
shadow-strong     强烈阴影

// 悬停阴影
hover:shadow-lg
hover:shadow-xl
```

---

## 🎨 预设组件类

### 按钮
```jsx
// 主按钮
<button className="btn-primary">
  主要操作
</button>

// 次要按钮
<button className="btn-secondary">
  次要操作
</button>

// 基础按钮
<button className="btn-base bg-green-500 text-white">
  自定义按钮
</button>
```

### 卡片
```jsx
<div className="card">
  包含圆角、内边距、阴影的卡片
</div>
```

### 输入框
```jsx
<input className="input" placeholder="自动样式" />
```

---

## 🎯 实用工具类

### 文字渐变
```jsx
<h1 className="text-gradient-primary">
  紫粉渐变文字
</h1>

<h1 className="text-gradient-accent">
  三色渐变文字
</h1>
```

### 背景渐变
```jsx
<div className="bg-gradient-primary">    {/* 紫→粉 */}
<div className="bg-gradient-soft">       {/* 柔和渐变 */}
<div className="bg-gradient-header">     {/* 导航栏 */}
```

### 文字省略
```jsx
<p className="truncate">        {/* 单行省略 */}
<p className="line-clamp-2">    {/* 2行省略 */}
<p className="line-clamp-3">    {/* 3行省略 */}
```

### 安全区域
```jsx
<div className="safe-top">      {/* 顶部安全区 */}
<div className="safe-bottom">   {/* 底部安全区 */}
```

### 隐藏滚动条
```jsx
<div className="overflow-auto scrollbar-hide">
  可滚动但不显示滚动条
</div>
```

---

## 🎬 动画

```jsx
<div className="animate-fade-in">     {/* 淡入 */}
<div className="animate-slide-up">    {/* 上滑 */}
<div className="animate-slide-down">  {/* 下滑 */}
<div className="animate-scale-in">    {/* 缩放 */}

// 配合过渡
<div className="transition-all duration-300">
<div className="transition-colors">
<div className="transition-transform">
```

---

## 📐 常用尺寸

### 宽度
```jsx
w-full          100%
w-screen        100vw
w-1/2           50%
w-1/3           33.333%
w-2/3           66.667%
w-1/4           25%

// 最大宽度
max-w-sm        24rem (384px)
max-w-md        28rem (448px)
max-w-lg        32rem (512px)
max-w-xl        36rem (576px)
max-w-2xl       42rem (672px)
max-w-4xl       56rem (896px)
max-w-7xl       80rem (1280px)
```

### 高度
```jsx
h-screen        100vh
h-full          100%
h-auto          auto

min-h-screen    最小100vh
```

---

## 🎨 透明度

```jsx
// 背景透明度
bg-white/90     90%透明度
bg-black/50     50%透明度
bg-purple-500/10  10%紫色

// 文字透明度
text-black/75
text-white/90

// 边框透明度
border-gray-300/50
```

---

## 📱 显示/隐藏

```jsx
// 在小屏隐藏，大屏显示
hidden md:block

// 在小屏显示，大屏隐藏
block md:hidden

// 仅平板显示
hidden md:block lg:hidden
```

---

## 🔧 常用组合模式

### 居中容器
```jsx
<div className="container mx-auto px-4 md:px-6 lg:px-8">
  居中容器，响应式内边距
</div>
```

### 全屏居中
```jsx
<div className="min-h-screen flex items-center justify-center">
  内容垂直水平居中
</div>
```

### 卡片网格
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  <div className="card">卡片1</div>
  <div className="card">卡片2</div>
  <div className="card">卡片3</div>
</div>
```

### 响应式图片
```jsx
<img 
  src="/image.jpg" 
  alt="描述" 
  className="w-full h-auto rounded-lg object-cover"
/>
```

### 渐变按钮
```jsx
<button className="
  px-6 py-3
  bg-gradient-to-r from-purple-500 to-pink-500
  text-white font-semibold
  rounded-full
  shadow-lg hover:shadow-xl
  transition-all duration-300
  active:scale-95
">
  按钮文字
</button>
```

---

## 💡 开发技巧

### 1. 快速调试断点
```jsx
<div className="bg-red-500 sm:bg-yellow-500 md:bg-green-500 lg:bg-blue-500">
  不同屏幕显示不同颜色
</div>
```

### 2. 组合类名
```jsx
// 使用模板字符串
className={`base-class ${condition ? 'active-class' : 'inactive-class'}`}

// 使用 clsx
import clsx from 'clsx';
className={clsx('base-class', { 'active-class': isActive })}
```

### 3. 触摸优化
```jsx
<button className="touch-manipulation active:scale-95">
  无延迟点击
</button>
```

---

## 📋 检查清单

开发完成后检查：

- [ ] 文字在所有设备可读（≥14px）
- [ ] 按钮点击区域足够（≥44x44px）
- [ ] 图片使用 Next.js Image 组件
- [ ] 无横向滚动条
- [ ] 在真实设备测试
- [ ] 动画流畅不卡顿
- [ ] 颜色对比度足够（WCAG AA）

---

## 🔗 快速链接

- [完整使用指南](./tailwind-guide.md)
- [配置详解](./configuration-guide.md)
- [文档中心](./README.md)
- [Tailwind 官方文档](https://tailwindcss.com/docs)

---

**提示：** 将此页面加入书签，方便随时查阅！

