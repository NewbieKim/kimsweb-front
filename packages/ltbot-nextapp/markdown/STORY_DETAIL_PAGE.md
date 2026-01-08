# 故事详情页面功能说明

## ✅ 已完成的功能

### 📱 页面结构

```
故事详情页面 (/to-explore-story/[id])
├── 顶部导航栏（固定）
│   ├── 返回按钮
│   └── 分享按钮
├── 封面图片区域
│   ├── 封面图片展示
│   └── 降级方案（渐变背景）
├── 用户信息栏
│   ├── 用户头像
│   ├── 用户名
│   ├── 发布时间
│   └── 关注按钮
├── 故事内容区
│   ├── 故事标题
│   ├── 故事正文（优化排版）
│   ├── 标签展示
│   └── 互动数据统计
├── 评论区
│   ├── 评论列表
│   ├── 评论回复
│   └── 空状态提示
└── 底部互动栏（固定）
    ├── 评论输入框
    ├── 点赞按钮
    ├── 收藏按钮
    └── 分享按钮
```

---

## 🎨 功能特性

### 1. 顶部导航栏

**特点：**
- ✅ 固定定位，始终可见
- ✅ 毛玻璃效果（backdrop-blur）
- ✅ 返回按钮（router.back()）
- ✅ 分享按钮（支持原生分享 API）

**样式：**
```css
position: fixed
top: 0
background: white/80
backdrop-blur: md
z-index: 50
```

### 2. 封面图片展示

**功能：**
- ✅ 优先显示 `coverImage` 字段
- ✅ 降级方案：渐变背景 + 书本图标
- ✅ 响应式高度（移动端 50vh，桌面端 60vh）
- ✅ 图片优化加载

**降级方案：**
```tsx
{story.coverImage ? (
  <Image src={story.coverImage} />
) : (
  <div className="bg-gradient-to-br from-purple-400 to-pink-400">
    <span className="text-6xl">📖</span>
  </div>
)}
```

### 3. 用户信息栏

**显示内容：**
- ✅ 用户头像（来自 Clerk）
- ✅ 用户名
- ✅ 相对时间（如：2小时前）
- ✅ 关注按钮（暂无功能）

**时间格式化：**
- 使用 `date-fns` 的 `formatDistanceToNow`
- 中文本地化显示
- 示例：刚刚、5分钟前、2小时前、昨天

### 4. 故事内容区

**标题生成逻辑：**
```typescript
// 经典主题：冒险 · 森林探险
// 自定义主题：自定义主题名称
const getStoryTitle = (story: Story) => {
  if (story.classicTheme) {
    return `${story.classicTheme}${story.classicSubTheme ? ' · ' + story.classicSubTheme : ''}`;
  }
  return story.customTheme || '精彩故事';
};
```

**内容格式化：**
```typescript
// 按换行符分割段落
// 每个段落独立渲染
// 优化行高和间距
const formatContent = (content: string) => {
  const paragraphs = content.split('\n').filter(p => p.trim());
  return paragraphs.map((para, index) => (
    <p key={index} className="mb-4 leading-relaxed text-gray-800">
      {para}
    </p>
  ));
};
```

**标签展示：**
- ✅ 年龄组标签
- ✅ 主题标签
- ✅ 灰色圆角背景
- ✅ 自动换行

**互动数据：**
- ✅ 点赞数
- ✅ 收藏数
- ✅ 评论数
- ✅ 实时更新

### 5. 评论区功能

**评论列表：**
- ✅ 显示所有顶级评论
- ✅ 支持评论回复（嵌套显示）
- ✅ 用户头像 + 名称
- ✅ 相对时间显示
- ✅ 回复按钮

**评论项结构：**
```
┌─────────────────────────────┐
│ 👤 用户名                    │
│    评论内容...               │
│    2小时前  回复              │
│                              │
│    ├─ 👤 回复者              │
│    │     回复内容...         │
│    │     1小时前             │
└─────────────────────────────┘
```

**空状态：**
- 💬 表情图标
- "暂无评论，快来发表第一条评论吧"

### 6. 底部互动栏

**功能按钮：**

1. **评论输入框**
   - 点击弹出评论弹窗
   - 占位文字："说点什么..."
   - 灰色圆角背景

2. **点赞按钮**
   - 未点赞：🤍（白心）
   - 已点赞：❤️（红心）
   - 显示点赞数
   - 实时更新

3. **收藏按钮**
   - 未收藏：☆（空星）
   - 已收藏：⭐（实星）
   - 显示收藏数
   - 实时更新

4. **分享按钮**
   - 支持原生分享 API
   - 降级：复制链接
   - Toast 提示

**样式特点：**
- 固定底部
- 白色背景 + 顶部阴影
- 最大宽度 720px 居中
- z-index: 50

### 7. 评论输入弹窗

**功能：**
- ✅ 全屏遮罩（半透明黑色）
- ✅ 底部弹出（圆角顶部）
- ✅ 多行文本输入
- ✅ 支持回复评论
- ✅ 取消/发表按钮
- ✅ 提交加载状态

**回复功能：**
```typescript
// 点击回复按钮
handleReply(comment) → setReplyTo(comment)

// 显示回复提示
"回复 @用户名"

// 提交时带上 parentId
{
  content: commentText,
  parentId: replyTo?.id
}
```

---

## 🔌 API 接口使用

### 1. 获取故事详情
```typescript
GET /api/stories/${storyId}

// 响应包含：
- 故事基本信息
- 用户信息
- 互动统计（_count）
```

### 2. 获取评论列表
```typescript
GET /api/stories/${storyId}/comments

// 响应包含：
- 评论列表（含回复）
- 用户信息
- 分页信息
```

### 3. 发表评论
```typescript
POST /api/stories/${storyId}/comments
Body: {
  content: string,
  parentId?: number  // 回复评论时使用
}
```

### 4. 点赞操作
```typescript
POST   /api/stories/${storyId}/like    // 点赞
DELETE /api/stories/${storyId}/like    // 取消点赞
```

### 5. 收藏操作
```typescript
POST   /api/stories/${storyId}/favorite    // 收藏
DELETE /api/stories/${storyId}/favorite    // 取消收藏
```

---

## 🎯 交互流程

### 点赞流程
```
1. 用户点击点赞按钮
2. 检查登录状态
3. 调用 API（POST/DELETE）
4. 更新本地状态（liked）
5. 更新点赞数（+1/-1）
6. 显示 Toast 提示
```

### 收藏流程
```
1. 用户点击收藏按钮
2. 检查登录状态
3. 调用 API（POST/DELETE）
4. 更新本地状态（favorited）
5. 更新收藏数（+1/-1）
6. 显示 Toast 提示
```

### 评论流程
```
1. 用户点击"说点什么..."
2. 弹出评论输入框
3. 输入评论内容
4. 点击"发表"
5. 调用 API
6. 刷新评论列表
7. 更新评论数
8. 关闭输入框
9. 显示成功提示
```

### 回复流程
```
1. 用户点击"回复"按钮
2. 设置 replyTo 状态
3. 弹出评论输入框
4. 显示"回复 @用户名"
5. 输入回复内容
6. 提交时带上 parentId
7. 刷新评论列表
```

---

## 📱 响应式设计

### 移动端（< 768px）
- 全屏展示
- 封面高度：50vh
- 内容边距：16px
- 字体：15px（正文）

### 桌面端（≥ 768px）
- 最大宽度：720px 居中
- 封面高度：60vh
- 内容边距：32px
- 字体：16px（正文）

---

## 🎨 样式规范

### 颜色方案
```css
/* 主色 */
--primary: linear-gradient(to right, #9333EA, #EC4899)

/* 文字 */
--text-primary: #111827
--text-secondary: #6B7280
--text-tertiary: #9CA3AF

/* 背景 */
--bg-primary: #FFFFFF
--bg-secondary: #F9FAFB
--bg-tertiary: #F3F4F6
```

### 字体大小
```css
/* 标题 */
h1: 20px (mobile) / 24px (desktop)

/* 正文 */
p: 15px (mobile) / 16px (desktop)

/* 辅助文字 */
small: 12px (mobile) / 14px (desktop)
```

### 圆角
```css
/* 按钮 */
border-radius: 9999px (full)

/* 卡片 */
border-radius: 12px

/* 输入框 */
border-radius: 8px
```

---

## 🔧 技术实现

### 状态管理
```typescript
const [story, setStory] = useState<Story | null>(null);
const [comments, setComments] = useState<Comment[]>([]);
const [liked, setLiked] = useState(false);
const [favorited, setFavorited] = useState(false);
const [loading, setLoading] = useState(true);
const [showCommentInput, setShowCommentInput] = useState(false);
const [commentText, setCommentText] = useState('');
const [replyTo, setReplyTo] = useState<Comment | null>(null);
```

### 数据加载
```typescript
useEffect(() => {
  loadStoryDetail();    // 加载故事详情
  loadComments();       // 加载评论列表
}, [storyId]);

useEffect(() => {
  checkUserInteraction();  // 检查用户互动状态
}, [isSignedIn, story?.id]);
```

### 工具函数
```typescript
// 时间格式化
formatTime(dateString) → "2小时前"

// 标题生成
getStoryTitle(story) → "冒险 · 森林探险"

// 内容格式化
formatContent(content) → <p>段落1</p><p>段落2</p>
```

---

## 🧪 测试指南

### 功能测试

**测试 1：页面加载**
```bash
1. 访问 /to-explore-story/1
2. 验证故事详情正确显示
3. 验证封面图片加载
4. 验证用户信息显示
5. 验证评论列表加载
```

**测试 2：点赞功能**
```bash
1. 未登录点击点赞 → 提示"请先登录"
2. 登录后点击点赞 → 红心 + 数量+1
3. 再次点击 → 白心 + 数量-1
4. 刷新页面 → 状态保持
```

**测试 3：收藏功能**
```bash
1. 未登录点击收藏 → 提示"请先登录"
2. 登录后点击收藏 → 实星 + 数量+1
3. 再次点击 → 空星 + 数量-1
4. 刷新页面 → 状态保持
```

**测试 4：评论功能**
```bash
1. 点击"说点什么..." → 弹出输入框
2. 输入评论内容
3. 点击"发表" → 评论成功
4. 刷新页面 → 评论显示
5. 点击"回复" → 显示回复提示
6. 输入回复内容 → 回复成功
```

**测试 5：分享功能**
```bash
1. 点击分享按钮
2. 支持原生分享 → 调用系统分享
3. 不支持 → 复制链接 + 提示
```

---

## 💡 优化建议

### 已实现 ✅
- [x] 页面基础结构
- [x] 封面图片展示
- [x] 用户信息栏
- [x] 内容格式化
- [x] 评论列表
- [x] 点赞/收藏功能
- [x] 评论/回复功能
- [x] 分享功能
- [x] 响应式布局

### 待优化 🔮
- [ ] 图片双击点赞
- [ ] 评论点赞功能
- [ ] 评论分页加载
- [ ] 下拉刷新
- [ ] 骨架屏加载
- [ ] 图片懒加载
- [ ] 虚拟滚动（大量评论）
- [ ] 关注功能实现
- [ ] 举报功能
- [ ] 删除自己的评论

---

## 🎉 总结

✅ **故事详情页面已完成！**

**核心功能：**
- ✅ 完整的故事详情展示
- ✅ 优化的内容排版
- ✅ 完整的评论系统
- ✅ 点赞/收藏/分享功能
- ✅ 响应式设计
- ✅ 流畅的交互体验

**设计特色：**
- 🎨 仿小红书风格
- 📱 移动端优先
- ✨ 优雅的动画
- 🔍 清晰的信息层级

**技术亮点：**
- 🚀 Next.js 14 App Router
- 💾 实时数据更新
- 🔐 Clerk 身份认证
- 🎯 TypeScript 类型安全
- 📅 date-fns 时间格式化

现在用户可以完整查看故事详情并进行互动了！🎊

