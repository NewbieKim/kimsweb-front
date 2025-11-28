# 博客文章 Redis 存储功能说明

## 📋 功能概述

本次更新将博客文章的存储方式从 `localStorage` 升级到 **Redis 数据库**，实现了数据的持久化、多设备同步和高效检索。

## 🎯 主要改动

### 1. 后端接口（ltbot-server）

已新增完整的文章 CRUD RESTful API：

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 创建文章 | POST | `/api/articles` | 创建草稿或发布文章 |
| 获取列表 | GET | `/api/articles?page=1&pageSize=10` | 分页获取文章列表 |
| 全文搜索 | GET | `/api/articles/search?q=关键词` | 根据标题/内容检索 |
| 获取详情 | GET | `/api/articles/:id` | 获取单篇文章（自动 +1 阅读数）|
| 更新文章 | PUT | `/api/articles/:id` | 更新标题、内容、状态等 |
| 删除文章 | DELETE | `/api/articles/:id` | 删除指定文章 |

**文章数据结构**：
```typescript
{
  entityId: string       // Redis 自动生成的唯一 ID
  title: string          // 标题
  content: string        // 正文（Markdown）
  summary: string        // 摘要
  author: string         // 作者（默认 "kim"）
  category: string       // 分类
  tags: string[]         // 标签数组
  views: number          // 阅读数
  status: 'draft' | 'published'  // 状态
  createdAt: Date        // 创建时间
  updatedAt: Date        // 更新时间
}
```

### 2. 前端改造（ltbot）

#### 2.1 编辑器页面（`blog/editor.vue`）

**保存草稿**：
- **旧逻辑**：存储到 `localStorage`（`article_drafts`）
- **新逻辑**：调用 `POST /api/articles`（status: draft）
- **编辑模式**：若 URL 携带 `draftId`，调用 `PUT /api/articles/:id`

**发布文章**：
- **旧逻辑**：存储到 `localStorage`（`article_published`）
- **新逻辑**：调用 `POST /api/articles`（status: published）或 `PUT /api/articles/:id`（将草稿改为已发布）

**加载草稿**：
- **旧逻辑**：从 `localStorage` 读取
- **新逻辑**：`onMounted` 时调用 `GET /api/articles/:id` 从后端获取

#### 2.2 博客列表页面（`blog/index.vue`）

**"我的"标签页**：
- **旧逻辑**：从 `localStorage` 读取草稿和已发布文章
- **新逻辑**：调用 `GET /api/articles?pageSize=100`，根据 `status` 字段分离草稿和已发布文章
- **降级方案**：若后端请求失败，仍会尝试从 `localStorage` 加载（兼容旧数据）

## 🚀 使用流程

### 创建草稿
1. 用户在编辑器中输入标题和内容。
2. 点击 **"暂存草稿"** 按钮。
3. 前端调用 `POST /api/articles`（status: draft）。
4. 后端将草稿保存到 Redis 并返回 `entityId`。
5. 前端更新 URL 参数为 `?draftId={entityId}`（避免重复保存）。

### 发布文章
1. 用户填写分类、标签、封面等信息。
2. 点击 **"发布文章"** 按钮。
3. 前端调用：
   - 如果是新文章：`POST /api/articles`（status: published）
   - 如果是草稿转发布：`PUT /api/articles/:id`（更新 status）
4. 跳转到"我的"标签页查看已发布文章。

### 查看我的文章
1. 点击"我的"标签页。
2. 前端调用 `GET /api/articles?pageSize=100`。
3. 根据 `status` 字段分离：
   - **草稿**：点击跳转到编辑器继续编辑（`/blog/editor?draftId={id}`）
   - **已发布**：显示阅读数、发布时间等信息

## 🔧 环境要求

### 1. Redis 服务
确保 Redis 服务已启动：
```bash
# 使用 Docker（推荐）
docker run -d -p 6379:6379 redis/redis-stack:latest

# 或本地安装的 Redis
redis-server
```

### 2. 后端服务
```bash
cd packages/ltbot-server
pnpm dev
```

服务启动后会自动连接 Redis 并创建索引。

### 3. 前端服务
```bash
pnpm dev
```

## 📊 数据迁移

如果你之前已经在 `localStorage` 中保存了草稿和文章，**暂时不会自动迁移**。可以采取以下策略：

### 方案一：手动迁移（推荐）
1. 在浏览器控制台执行：
```javascript
// 导出草稿
console.log(JSON.stringify(JSON.parse(localStorage.getItem('article_drafts') || '[]'), null, 2))

// 导出已发布文章
console.log(JSON.stringify(JSON.parse(localStorage.getItem('article_published') || '[]'), null, 2))
```
2. 复制输出的 JSON，通过 Postman 或前端调用 `POST /api/articles` 批量创建。

### 方案二：保留旧数据（兼容模式）
前端代码已支持降级逻辑：当后端请求失败时，会自动从 `localStorage` 加载。

## ⚠️ 注意事项

1.  **自动保存仍使用 localStorage**：每 30 秒的自动保存仍存储在本地（`article_auto_save`），只有点击"暂存草稿"或"发布文章"才会提交到后端。
2.  **entityId 是 Redis 生成的**：不要在前端手动设置，后端会自动返回。
3.  **删除功能尚未实现**：目前"我的"标签页中暂无删除按钮，可通过后端接口 `DELETE /api/articles/:id` 删除。
4.  **全文搜索需 Redis Stack**：如果使用普通 Redis，`/search` 接口可能无法正常工作，需要安装 `redis/redis-stack`。

## 📖 相关文档

- [Redis OM 使用指南](./Redis使用指南.md) - Redis 连接、Schema 定义、Repository API
- [后端 API 文档](../routes/article.ts) - 完整的接口实现代码

---

*更新时间：2025-01-27*  
*技术栈：Redis OM + Node.js Express + Vue 3 Composition API*

