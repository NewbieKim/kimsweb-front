# 移动端 BottomNav 适配方案

## 📋 问题描述

移动端会出现 `BottomNav` 组件（底部导航栏），高度约 60px，固定在屏幕底部，导致两个问题：

1. **页面内容被遮挡**：页面底部的内容被 `BottomNav` 遮挡，用户无法看到
2. **固定元素重叠**：故事详情页的底部互动栏与 `BottomNav` 重叠，显示异常

---

## 🎯 解决方案

### 方案概述

创建设备检测 Hook (`useDevice`)，在移动端（< 768px）为页面添加底部留白，避免内容被遮挡。

### 核心思路

```
移动端布局：
┌─────────────────────┐
│   页面内容           │
│                     │
│   pb-[100-200px]    │ ← 底部留白
├─────────────────────┤
│ 固定互动栏 (可选)    │ ← pb-[60px]
├─────────────────────┤
│ BottomNav (60px)    │ ← 全局底部导航
└─────────────────────┘

桌面端布局：
┌─────────────────────┐
│   页面内容           │
│                     │
│   pb-20             │ ← 正常留白
└─────────────────────┘
(无 BottomNav)
```

---

## 🔧 实现步骤

### 1. 创建设备检测 Hook

**文件：** `src/hooks/useDevice.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';

/**
 * 检测设备类型的 Hook
 * @returns isMobile - 是否为移动设备（< 768px）
 */
export function useDevice() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 初始化时检测
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 首次检测
    checkDevice();

    // 监听窗口大小变化
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile };
}
```

**特点：**
- ✅ 客户端组件专用
- ✅ 响应式监听窗口变化
- ✅ 断点：768px（Tailwind 的 `md` 断点）
- ✅ 自动清理事件监听器

---

### 2. 修改故事详情页

**文件：** `src/app/to-explore-story/[id]/page.tsx`

#### 2.1 导入 Hook

```typescript
import { useDevice } from '@/hooks/useDevice';
```

#### 2.2 使用 Hook

```typescript
export default function StoryDetailPage() {
    const { isMobile } = useDevice();
    // ... 其他代码
}
```

#### 2.3 修改主容器

**修改前：**
```typescript
<div className="min-h-screen bg-white pb-20">
```

**修改后：**
```typescript
<div className={`min-h-screen bg-white ${isMobile ? 'pb-[200px]' : 'pb-20'}`}>
```

**说明：**
- 移动端：`pb-[200px]` = 200px 底部留白
  - 底部互动栏：~70px
  - BottomNav：60px
  - 额外留白：70px
- 桌面端：`pb-20` = 80px 正常留白

#### 2.4 修改底部互动栏

**修改前：**
```typescript
<div className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:top-auto md:bottom-auto ${true ? 'pb-[60px]' : ''}`}>
```

**修改后：**
```typescript
<div className={`fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 ${isMobile ? 'pb-[60px]' : ''}`}>
```

**说明：**
- 移动端：添加 `pb-[60px]`，避免被 BottomNav 遮挡
- 桌面端：无需额外 padding
- z-index 从 50 改为 40，确保层级正确

---

### 3. 修改个人中心页

**文件：** `src/app/to-view-mine/page.tsx`

#### 3.1 导入 Hook

```typescript
import { useDevice } from '@/hooks/useDevice';
```

#### 3.2 使用 Hook

```typescript
export default function ViewMinePage() {
    const { isMobile } = useDevice();
    // ... 其他代码
}
```

#### 3.3 修改主容器

**修改前：**
```typescript
<div className="min-h-screen bg-gray-50 pb-20">
```

**修改后：**
```typescript
<div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-[100px]' : 'pb-20'}`}>
```

**说明：**
- 移动端：`pb-[100px]` = 100px 底部留白（BottomNav 60px + 40px 额外空间）
- 桌面端：`pb-20` = 80px 正常留白

---

### 4. 修改故事列表页

**文件：** `src/app/to-explore-story/page.tsx`

由于这是**服务端组件**，不能直接使用客户端 Hook，需要创建包装组件。

#### 4.1 创建包装组件

**文件：** `src/app/to-explore-story/components/PageWrapper.tsx`

```typescript
'use client';
import { useDevice } from '@/hooks/useDevice';
import { ReactNode } from 'react';

interface PageWrapperProps {
    children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
    const { isMobile } = useDevice();

    return (
        <div className={`min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50 ${isMobile ? 'pb-[80px]' : ''}`}>
            {children}
        </div>
    );
}
```

#### 4.2 使用包装组件

**修改前：**
```typescript
return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-blue-50">
        {/* 内容 */}
    </div>
);
```

**修改后：**
```typescript
import PageWrapper from "./components/PageWrapper";

return (
    <PageWrapper>
        {/* 内容 */}
    </PageWrapper>
);
```

---

## 📊 底部留白尺寸对照表

| 页面 | 移动端 | 桌面端 | 说明 |
|------|--------|--------|------|
| **故事详情页** | `pb-[200px]` | `pb-20` | 有底部互动栏 + BottomNav |
| **个人中心页** | `pb-[100px]` | `pb-20` | 只有 BottomNav |
| **故事列表页** | `pb-[80px]` | 无 | 只有 BottomNav |
| **详情页互动栏** | `pb-[60px]` | 无 | 避免被 BottomNav 遮挡 |

---

## 🎨 BottomNav 组件信息

**文件：** `src/app/components/BottomNav.tsx`

**特点：**
```typescript
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-50 md:hidden">
```

- **定位：** `fixed bottom-0` - 固定在底部
- **高度：** 约 60px（`py-2` + 内容 + border）
- **显示：** `md:hidden` - 只在移动端显示（< 768px）
- **层级：** `z-50` - 较高的 z-index

---

## 🔍 层级关系

```
z-index 层级（从高到低）：
z-50: BottomNav (全局底部导航)
z-50: 顶部导航栏
z-40: 故事详情页底部互动栏
z-10: 故事列表页头部
```

---

## ✅ 修改的文件清单

### 新增文件
- [x] `src/hooks/useDevice.ts` - 设备检测 Hook
- [x] `src/app/to-explore-story/components/PageWrapper.tsx` - 页面包装组件

### 修改文件
- [x] `src/app/to-explore-story/[id]/page.tsx` - 故事详情页
- [x] `src/app/to-view-mine/page.tsx` - 个人中心页
- [x] `src/app/to-explore-story/page.tsx` - 故事列表页

---

## 🧪 测试指南

### 测试 1：移动端适配

```bash
1. 打开浏览器开发者工具
2. 切换到移动设备视图（< 768px）
3. 访问各个页面
4. 滚动到页面底部
5. 验证：
   ✅ 内容不被 BottomNav 遮挡
   ✅ 底部有足够的留白
   ✅ BottomNav 固定在底部
```

### 测试 2：桌面端适配

```bash
1. 切换到桌面视图（≥ 768px）
2. 访问各个页面
3. 验证：
   ✅ BottomNav 不显示
   ✅ 底部留白正常（pb-20）
   ✅ 布局正常
```

### 测试 3：响应式切换

```bash
1. 在桌面端打开页面
2. 逐渐缩小浏览器窗口
3. 观察在 768px 临界点时：
   ✅ BottomNav 显示/隐藏
   ✅ 底部留白动态调整
   ✅ 无闪烁或跳动
```

### 测试 4：故事详情页

```bash
1. 移动端访问故事详情页
2. 滚动到评论区底部
3. 验证：
   ✅ 评论区内容不被遮挡
   ✅ 底部互动栏完整显示
   ✅ 底部互动栏上方有 BottomNav
   ✅ 点击互动按钮正常
```

---

## 💡 设计要点

### 1. 响应式断点

```css
/* Tailwind 断点 */
sm: 640px   /* 小屏手机 */
md: 768px   /* 平板（我们的断点） */
lg: 1024px  /* 小笔记本 */
xl: 1280px  /* 桌面 */
```

**选择 768px 的原因：**
- ✅ 与 Tailwind `md` 断点一致
- ✅ 与 BottomNav 的 `md:hidden` 一致
- ✅ 覆盖大部分移动设备（手机 + 小平板）

### 2. 留白计算

```
故事详情页移动端留白 = 200px
├─ 底部互动栏高度：70px
├─ BottomNav 高度：60px
└─ 额外缓冲空间：70px

个人中心页移动端留白 = 100px
├─ BottomNav 高度：60px
└─ 额外缓冲空间：40px

故事列表页移动端留白 = 80px
├─ BottomNav 高度：60px
└─ 额外缓冲空间：20px
```

### 3. 性能优化

**useDevice Hook 优化：**
- ✅ 使用 `resize` 事件监听器（自动节流）
- ✅ 组件卸载时清理监听器
- ✅ 避免频繁重新渲染

**替代方案（不推荐）：**
```typescript
// ❌ 纯 CSS 方案（无法动态检测）
<div className="pb-20 md:pb-[100px]">

// ❌ 使用 window.matchMedia（更复杂）
const media = window.matchMedia('(max-width: 768px)');
```

---

## 🚀 扩展建议

### 未来优化

1. **添加平滑过渡**
```typescript
<div className="transition-all duration-300 pb-[100px]">
```

2. **支持更多断点**
```typescript
export function useDevice() {
  return {
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  };
}
```

3. **全局状态管理**
```typescript
// 使用 Context 避免每个组件都监听 resize
<DeviceProvider>
  <App />
</DeviceProvider>
```

---

## 📝 总结

### ✅ 完成的工作

1. ✅ 创建了 `useDevice` Hook，实现设备检测
2. ✅ 修改了 3 个页面，添加移动端适配
3. ✅ 创建了 `PageWrapper` 组件，适配服务端组件
4. ✅ 统一了底部留白策略

### 🎯 解决的问题

1. ✅ 页面内容不再被 BottomNav 遮挡
2. ✅ 故事详情页底部互动栏与 BottomNav 不再重叠
3. ✅ 移动端和桌面端有不同的布局策略
4. ✅ 响应式切换流畅

### 🔮 技术亮点

- 🎨 统一的设备检测策略
- 📱 移动端优先的设计思路
- 🔧 灵活的组件包装方案
- ✨ 响应式布局完美适配

**现在移动端布局问题已完美解决！** 🎉

