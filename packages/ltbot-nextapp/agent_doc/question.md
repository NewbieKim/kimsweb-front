# 项目开发过程中重要的问题解决方案汇总

1.异步故事生成功能
2.移动端 BottomNav 适配方案

## 场景卡片目录、封面与返回恢复（2026-09-06）

- 问题：旧版只维护 4 张场景，创作页和 `DreamPlace.tsx` 各持有一份配置；扩展到 24 张后容易出现前后端名称、分龄内容和生成 Prompt 漂移。
- 方案：新增 `scene-catalog.ts` 作为唯一版本化目录，前端渲染和服务端校验共同导入；客户端只保存/提交 `sceneId`，服务端解析年龄配置后写入快照版本 2。
- 视觉：按高保真原型实现“四类纵向、类内横滑、3:4 背景图、底部渐变、右上勾选、所属分类下详情”。24 张封面由内置 imagegen 生成并落到 `public/scene-cards/`，不使用第三方热链；单图失败自动保留分类渐变、emoji 和选择能力。
- 状态：首次进入不默认选择；第 2 步组件保持挂载，进入第 3 步再返回时选中场景、横轨位置和纵向页面位置不丢失；下线 ID 会禁用下一步并提示重新选择。
- 验证：4 类各 6 张、24 个唯一 ID、4 个年龄段字段和 24 个本地资产均通过脚本检查；375px/1280px 浏览器验证无页面横向溢出，全局始终只有 1 张卡可选中。


# =======================异步故事生成功能实施指南================

## 📋 功能概述

本文档说明了故事异步生成功能的实施细节。该功能解决了 DeepSeek API 调用耗时长（10-30秒）导致的用户体验问题。

### 优化前后对比

| 方面 | 优化前 | 优化后 |
|------|--------|--------|
| 用户等待时间 | 10-30秒 | < 1秒 |
| 页面响应 | 长时间 loading | 立即跳转 |
| 失败风险 | 用户关闭页面导致积分损失 | 后台执行，安全可靠 |
| 用户体验 | 😰 焦虑等待 | 😊 流畅操作 |

---

## 🏗️ 架构设计

### 流程图

```
用户点击"生成故事"
      ↓
表单验证 + 积分检查
      ↓
保存故事基础信息（状态: pending）
      ↓
扣除积分
      ↓
触发后台异步生成任务 ← 不等待返回
      ↓
立即跳转到故事列表页
      ↓
【后台】调用 DeepSeek API
      ↓
【后台】更新故事内容（状态: completed）
      ↓
【前端】轮询刷新显示最新状态
```

---

## 📁 修改的文件列表

### 1. 前端页面
- ✅ `src/app/create-story/page.tsx` - 创建故事页面
- ✅ `src/app/to-explore-story/components/StoryCard.tsx` - 故事卡片组件
- ✅ `src/app/to-explore-story/components/StoryListClient.tsx` - 故事列表客户端组件

### 2. 后端 API
- ✅ `src/app/api/stories/generate-async/route.ts` - **新增**异步生成 API

### 3. 配置文件
- ✅ `env.production.example` - 环境变量配置示例

---

## 🔧 技术实现细节

### 1. 数据库设计（extData 字段）

Story 模型的 `extData` 字段（JSON 格式）增加以下字段：

```typescript
{
  "wordRange": "200-500",                        // 原有字段
  "generationStatus": "pending",                 // 生成状态
  "generationStartedAt": "2026-01-06T10:00:00Z", // 开始时间
  "generationCompletedAt": "2026-01-06T10:00:30Z", // 完成时间（可选）
  "generationError": null                        // 错误信息（可选）
}
```

#### 状态说明

| 状态 | 含义 | 显示 |
|------|------|------|
| `pending` | 等待生成 | 🟡 生成中 |
| `generating` | 正在生成 | 🟡 生成中 |
| `completed` | 生成完成 | ✅ 正常显示 |
| `failed` | 生成失败 | ❌ 生成失败 |

---

### 2. API 接口

#### POST `/api/stories/generate-async`

触发异步生成故事内容。

**请求参数：**
```json
{
  "storyId": 123,
  "formData": {
    "ageGroup": "3-5岁",
    "storySubjectType": "classic",
    "storySubject": "冒险",
    "storyChildSubject": "森林探险",
    "characterSetting": "小兔子波比...",
    "wordCountLimit": "200-500"
  }
}
```

**响应（立即返回 202）：**
```json
{
  "success": true,
  "message": "故事生成任务已启动",
  "data": {
    "storyId": 123
  }
}
```

---

### 3. 前端实现要点

#### 3.1 创建故事页面 (`create-story/page.tsx`)

**关键改动：**
```typescript
// 1. 准备故事数据时，设置 pending 状态
const storyData = {
  // ... 其他字段
  extData: JSON.stringify({
    wordRange: formData.wordCountLimit,
    generationStatus: 'pending',
    generationStartedAt: new Date().toISOString(),
  }),
};

// 2. 触发异步任务（不等待）
fetch('/api/stories/generate-async', {
  method: 'POST',
  body: JSON.stringify({ storyId: story.id, formData }),
}).catch(err => console.error('触发生成任务失败:', err));

// 3. 立即跳转
router.push('/to-explore-story');
```

#### 3.2 故事卡片组件 (`StoryCard.tsx`)

**新增功能：**
1. ✅ 解析 `extData` 获取生成状态
2. ✅ 显示"生成中"动画标签
3. ✅ 显示"生成失败"错误提示
4. ✅ 正在生成时显示占位符

**视觉效果：**
- 🟡 生成中：黄色标签 + 脉冲动画
- ❌ 生成失败：红色标签 + 错误信息
- ⏳ AI 正在创作：三个跳动的点

#### 3.3 故事列表客户端 (`StoryListClient.tsx`)

**新增功能：**
1. ✅ 检测正在生成的故事
2. ✅ 自动轮询刷新（每 5 秒）
3. ✅ 所有故事完成后停止轮询

**轮询逻辑：**
```typescript
useEffect(() => {
  if (!hasGeneratingStories()) return;

  const interval = setInterval(() => {
    refreshGeneratingStories(); // 刷新正在生成的故事
  }, 5000);

  return () => clearInterval(interval);
}, [stories]);
```

---

### 4. 后端实现要点

#### 4.1 异步生成处理

**核心函数：** `generateStoryInBackground()`

```typescript
async function generateStoryInBackground(storyId, formData) {
  try {
    // 1. 更新状态为 generating
    await updateStoryStatus(storyId, 'generating');

    // 2. 生成 prompt
    const prompt = generatePrompt(formData);

    // 3. 调用 DeepSeek API（带重试）
    const content = await callAIWithRetry(prompt, 3);

    // 4. 更新故事内容和状态
    await prisma.story.update({
      where: { id: storyId },
      data: {
        content: content,
        extData: JSON.stringify({
          generationStatus: 'completed',
          generationCompletedAt: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    // 5. 失败处理
    await updateStoryStatus(storyId, 'failed', error.message);
  }
}
```

#### 4.2 错误处理与重试

**重试策略：**
- 最多重试 3 次
- 指数退避：2秒 → 4秒 → 8秒
- 超时时间：60 秒

```typescript
async function callAIWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callDeepSeekAPI(prompt);
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('API 调用失败');
}
```

---

## 🚀 部署步骤

### 1. 环境变量配置

在 `.env.production` 或 `.env.local` 中添加：

```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat
```

### 2. 数据库迁移

数据库结构无需修改，`extData` 字段已存在。现有故事会自动兼容（默认为 `completed` 状态）。

### 3. 代码部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖（如有更新）
pnpm install

# 3. 构建项目
pnpm build

# 4. 重启服务
pm2 restart ltbot-nextapp
# 或 Docker 重启
docker-compose up -d --build
```

### 4. 验证功能

#### 测试流程：
1. ✅ 登录系统，进入创建故事页面
2. ✅ 填写表单，点击"生成故事"
3. ✅ 验证是否立即跳转到列表页（< 1秒）
4. ✅ 验证故事卡片显示"生成中"标签
5. ✅ 等待 10-30 秒，验证自动刷新
6. ✅ 验证故事内容是否正常显示

---

## 🎨 用户体验优化

### 视觉反馈

| 状态 | 标签样式 | 内容区域 |
|------|----------|----------|
| 生成中 | 🟡 黄色脉冲 + "生成中" | ⏳ 三个跳动的点 + "AI 正在创作故事中..." |
| 生成失败 | 🔴 红色 + "生成失败" | 😔 "故事生成失败" + 错误信息 |
| 已完成 | ✅ 无特殊标签 | 📝 正常显示故事内容 |

### 动画效果

- **脉冲动画**：标签呼吸效果
- **跳动点**：三个点依次跳动
- **自动刷新**：无感知更新

---

## 📊 监控与日志

### 日志输出

后端会输出详细的生成日志：

```
[Story 123] 开始生成故事内容...
[Story 123] 生成的 prompt: ...
尝试调用 DeepSeek API (第 1/3 次)...
[Story 123] 故事内容生成成功，长度: 456
[Story 123] 状态已更新为: completed
[Story 123] 故事生成完成！
```

### 错误监控

失败情况会记录到 `extData.generationError`：
- API 调用失败
- 超时错误
- 网络错误

---

## ⚠️ 注意事项

### 1. API 密钥安全
- ✅ API 密钥存储在服务端环境变量
- ✅ 前端代码中已移除 API 配置
- ❌ 不要将密钥提交到 Git

### 2. 并发控制
- 当前版本：无并发限制
- 建议：业务量增长后添加队列限流

### 3. 积分处理
- 当前：创建故事后立即扣除积分
- 未来优化：生成成功后再扣除

### 4. 错误恢复
- 用户可刷新页面查看最新状态
- 失败的故事可添加"重试"按钮（待实现）

---

## 🔮 未来优化方向

### 第一阶段（已完成）✅
- [x] 基础异步生成
- [x] 状态轮询
- [x] 视觉反馈

### 第二阶段（推荐）
- [ ] Server-Sent Events (SSE) 实时推送
- [ ] 失败故事重试按钮
- [ ] 生成进度显示（0%-100%）

### 第三阶段（生产优化）
- [ ] 引入 Redis + BullMQ 消息队列
- [ ] 任务持久化（服务重启不丢失）
- [ ] 任务监控面板
- [ ] 邮件/站内信通知

---

## 📝 常见问题

### Q1: 服务重启后正在生成的故事会怎样？
A: 当前版本会丢失，状态停留在 `generating`。可手动更新状态或等待未来队列方案。

### Q2: 如何手动触发重新生成？
A: 暂无前端入口，可通过 API 手动调用：
```bash
curl -X POST http://localhost:3100/api/stories/generate-async \
  -H "Content-Type: application/json" \
  -d '{"storyId": 123, "formData": {...}}'
```

### Q3: 轮询会影响性能吗？
A: 影响很小。仅当有正在生成的故事时才轮询，且仅查询特定故事，不会全量查询。

### Q4: 如何调整轮询频率？
A: 修改 `StoryListClient.tsx` 中的间隔时间：
```typescript
const interval = setInterval(() => {
  refreshGeneratingStories();
}, 5000); // 改为其他值，如 3000 (3秒) 或 10000 (10秒)
```

---

## 📧 技术支持

如有问题，请联系：
- 技术负责人：[您的名字]
- 邮箱：[您的邮箱]

---

## 📚 相关文档

- [API 文档](./API_DOCUMENTATION.md)
- [Docker 部署指南](./DOCKER_DEPLOYMENT_GUIDE.md)
- [配置指南](./configuration-guide.md)

---

**最后更新时间：** 2026-01-06  
**版本：** v1.0.0  
**实施状态：** ✅ 已完成




# ======================移动端 BottomNav 适配方案=======================

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
# 故事深度定制化一期实施记录（2026-09-05）

本期以 PRD 与高保真原型 v1.2.1 为唯一需求依据。采用全量开放；风险筛选使用服务端本地规则引擎；`PRIVATE` 故事作者可点赞、收藏、评论和使用 TTS。

关键决策：历史故事迁移为显式 `PUBLIC`，新故事及快速生成/续集默认为 `PRIVATE`；定制参数以 `StoryCustomization` 快照保存，档案编辑或删除不影响历史；`Idempotency-Key` 与序号递增、Story 创建处于同一事务；所有生成 Prompt 由服务端构建，日志不记录 Prompt、表单、DeepSeek 配置或环境变量。

验证结果：Prisma schema 与 migration status 通过，开发库 18 条历史故事均为 `PUBLIC`；本轮新增及改动文件定向 ESLint 0 error/0 warning；生产构建编译通过，但本地未提供 Clerk `publishableKey`，静态导出阶段在 `/agreement` 停止。全仓历史 lint 基线仍有 118 errors/44 warnings，未扩大清理范围。

界面复查（2026-09-05）：档案弹框确认按钮改为显式主题色，避免 HeroUI 默认主色未随站点主题映射而显示成白色；创作页底部操作栏在移动端上移 64px，避开全局 BottomNav；性格目录扩展到 8 项，档案弹框、创作页与服务端校验共用同一数据源。

构建复查同时发现创作页的 `useSearchParams` 缺少 Suspense 边界；已补齐并重新执行生产构建，36 个页面全部生成成功。定向 ESLint 无错误和警告；全仓 lint 仍有历史基线 59 errors/30 warnings，本次改动文件不在其中。

原型交互对齐（2026-09-05）：“我的故事”原先误用了浏览器原生下拉框，与高保真原型的圆角筛选标签不一致。已改为原型的“我的故事”标题 + “全部/各孩子档案”标签组；移动端上下排列，桌面端左右排列，已删除档案保留标记，选中态使用当前站点主题色。

档案列表布局修正（2026-09-05）：用户反馈页面标题和卡片操作层级过大、过散。已将“孩子档案”调整为常规 24px 标题，删除“管理主角设定……”说明行；档案卡片使用紧凑层级，主操作保留在左下，编辑和删除并排收入右下角。弹框确认按钮的主题色改为组件内联样式，移除原全局 `footer` 选择器，避免影响其他弹框。
