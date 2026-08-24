# ltbot-server API 接口文档

> 基于 `packages/ltbot-server/db` 与 `packages/ltbot-server/routes` 梳理。  
> 服务默认端口：`3000`；前端开发代理：`6688/api` → `localhost:3000/api`。

---

## 目录

1. [架构概览](#1-架构概览)
2. [数据层（db）](#2-数据层db)
3. [通用约定](#3-通用约定)
4. [文章接口 `/api/articles`](#4-文章接口-aparticles)
5. [待办接口 `/api/agencies`](#5-待办接口-apigencies)
6. [Chat 会话持久化 `/api/chat/sessions`](#6-chat-会话持久化-apichatsessions)
7. [Chat 流式对话 `POST /api/chat`](#7-chat-流式对话-post-apichat)
8. [智能体路由 `POST /api/chatAgent`](#8-智能体路由-post-apichatagent)
9. [Remote 页面控制 `/api/remote`](#9-remote-页面控制-apiremote)
10. [统计接口 `/api/statistics`](#10-统计接口-apistatistics)
11. [Chat 数据模型特殊说明](#11-chat-数据模型特殊说明)
12. [路由挂载关系](#12-路由挂载关系)

---

## 1. 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Express (index.ts)                      │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  routes/*    │  db/redis.ts │ db/chatService│  types.ts     │
│  HTTP 路由   │  Redis OM    │  原生 Redis   │  类型定义      │
│              │  Article     │  Chat 会话    │               │
│              │  Agency      │  消息存储     │               │
└──────────────┴──────────────┴──────────────┴────────────────┘
                              │
                    Redis (REDIS_URL)
```

| 模块 | 存储方式 | 说明 |
|------|----------|------|
| Article（文章） | Redis OM + RediSearch 索引 | Schema 定义字段，启动时 `createIndex()` |
| Agency（待办） | Redis OM + RediSearch 索引 | 同上 |
| Chat（会话/消息） | **原生 Redis 数据结构** | 不使用 Redis OM，手写 Key 设计 |
| Remote 会话 | **内存 Map** | 进程内临时存储，30 分钟 TTL |
| Statistics | 内存模拟 | 无持久化 |

**环境变量（Redis）**

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `REDIS_URL` | `redis://localhost:6379` | Redis 连接地址 |

**启动初始化流程**（`db/redis.ts` → `initRedis()`）：

1. 连接 Redis
2. 为 `article`、`agency` 创建 Redis OM 搜索索引（需 Redis Stack / RediSearch）
3. 调用 `initChatService(redis)` 初始化 Chat 数据服务

---

## 2. 数据层（db）

### 2.1 `db/redis.ts` — Redis OM 实体

#### Article Schema

| 字段 | Redis OM 类型 | 说明 |
|------|---------------|------|
| `title` | string | 标题 |
| `content` | text | 长文本正文 |
| `summary` | string | 摘要 |
| `author` | string | 作者 |
| `category` | string | 分类 |
| `tags` | string[] | 标签数组 |
| `views` | number | 阅读数 |
| `status` | string | `draft` / `published` |
| `createdAt` | date | 创建时间 |
| `updatedAt` | date | 更新时间 |

实体前缀：`article`（Redis OM 自动生成 Hash Key，如 `article:01H...`）

#### Agency Schema

| 字段 | Redis OM 类型 | 说明 |
|------|---------------|------|
| `title` | string | 待办标题 |
| `description` | string | 描述 |
| `status` | string | `pending` / `completed` / `cancelled` |
| `priority` | string | `low` / `medium` / `high` |
| `createdAt` | date | 创建时间 |
| `updatedAt` | date | 更新时间 |

实体前缀：`agency`

**索引创建**：服务启动时执行 `articleRepository.createIndex()` 和 `agencyRepository.createIndex()`。若 Redis 无 RediSearch 模块，索引创建会失败但不影响基本 CRUD。

### 2.2 `db/chatService.ts` — Chat 原生 Redis 服务

不使用 Redis OM，直接操作三种 Redis 数据结构（详见 [第 11 节](#11-chat-数据模型特殊说明)）。

| 方法 | 作用 |
|------|------|
| `getUserSessions()` | 分页获取用户会话列表 |
| `createSession()` | 创建新会话 |
| `getSessionMetadata()` | 读取会话元数据 |
| `updateSession()` | 更新 title / lastMessage |
| `deleteSession()` | 删除会话及全部消息 |
| `batchDeleteSessions()` | 批量删除 |
| `saveMessages()` | 追加消息到会话 |
| `getMessages()` | 读取消息列表 |
| `getSessionDetail()` | 会话 + 消息 |
| `isSessionOwner()` | 校验会话归属 |

---

## 3. 通用约定

### 3.1 响应格式

**Redis OM 类接口**（articles、agencies、chat/sessions）通常返回：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功描述"
}
```

**流式接口**（`POST /api/chat`、`POST /api/chatAgent`）返回 SSE，非 JSON 包装。

**Remote 接口** 部分直接返回业务对象，无统一 `success` 字段。

### 3.2 Redis 不可用

| 路由组 | HTTP 状态 | 提示 |
|--------|-----------|------|
| `/api/articles/*` | 503 | Redis 未连接 |
| `/api/agencies/*` | 503 | Redis 未连接 |
| `/api/chat/sessions/*` | 503 | Chat 服务未初始化 |

### 3.3 Chat 用户身份

Chat 会话接口通过 Header 识别用户（简化版，未集成 JWT）：

```
X-User-Id: your-user-id
```

未传时默认使用 `test-user-001`。

---

## 4. 文章接口 `/api/articles`

> 路由文件：`routes/article.ts`  
> 数据层：`articleRepository`（Redis OM）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/articles` | 创建文章 |
| GET | `/api/articles` | 分页列表 |
| GET | `/api/articles/search?q=` | 关键字搜索（内存过滤，非 RediSearch） |
| GET | `/api/articles/:id` | 详情（自动 views +1） |
| PUT | `/api/articles/:id` | 更新 |
| DELETE | `/api/articles/:id` | 删除 |

### 4.1 创建文章

**POST** `/api/articles`

```json
{
  "title": "文章标题",
  "content": "正文内容",
  "author": "Admin",
  "category": "Tech",
  "tags": ["redis", "node"],
  "summary": "可选摘要",
  "status": "published"
}
```

| 字段 | 必填 | 默认 |
|------|------|------|
| title | 是 | — |
| content | 是 | — |
| author | 否 | `Admin` |
| category | 否 | `Uncategorized` |
| tags | 否 | `[]` |
| summary | 否 | content 前 100 字符 |
| status | 否 | `published` |

**响应 `data`**：文章对象 + `entityId`（Redis OM 生成的唯一 ID）

### 4.2 文章列表

**GET** `/api/articles?page=1&pageSize=10`

```json
{
  "success": true,
  "data": [ { "entityId": "...", "title": "...", ... } ],
  "pagination": { "page": 1, "pageSize": 10, "total": 42 }
}
```

### 4.3 搜索

**GET** `/api/articles/search?q=redis`

在 title / content 上做简单 substring 匹配（降级方案，不依赖 RediSearch 全文索引）。

---

## 5. 待办接口 `/api/agencies`

> 路由文件：`routes/agency.ts`  
> 数据层：`agencyRepository`（Redis OM）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/agencies` | 获取全部待办 |
| POST | `/api/agencies` | 新增待办 |
| PATCH / PUT | `/api/agencies/:id` | 更新（`:id` 为 entityId） |
| DELETE | `/api/agencies/:id` | 删除 |

### 5.1 创建待办

**POST** `/api/agencies`

```json
{
  "title": "完成接口文档",
  "description": "梳理 db 和 routes",
  "status": "pending",
  "priority": "high"
}
```

| 字段 | 必填 | 合法值 |
|------|------|--------|
| title | 是 | 非空字符串 |
| description | 否 | 字符串 |
| status | 否 | `pending` / `completed` / `cancelled`，默认 `pending` |
| priority | 否 | `low` / `medium` / `high`，默认 `medium` |

### 5.2 与 Chat Agent 的关联

`POST /api/chatAgent` 在识别到待办意图（含「待办」「任务列表」等关键词）时，会通过 `agencyRepository.search().return.all()` 读取上述数据并格式化返回，**不经过 REST 接口**。

---

## 6. Chat 会话持久化 `/api/chat/sessions`

> 路由文件：`routes/chat.ts`  
> 数据层：`getChatService()`（原生 Redis）  
> 前端封装：`packages/ltbot/src/api/chat.ts`

这组接口负责**会话与消息的 CRUD 持久化**，与流式对话接口（第 7、8 节）职责分离：

- `/api/chat/sessions/*` → 读写 Redis 中的历史记录
- `POST /api/chat` / `POST /api/chatAgent` → 调用 LLM 生成回复（无状态或轻状态）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/chat/sessions` | 会话列表（分页） |
| POST | `/api/chat/sessions` | 创建会话 |
| GET | `/api/chat/sessions/:sessionId` | 会话详情 + 全部消息 |
| POST | `/api/chat/sessions/:sessionId/messages` | 追加保存消息 |
| PATCH | `/api/chat/sessions/:sessionId` | 更新标题等 |
| DELETE | `/api/chat/sessions/:sessionId` | 删除会话 |
| POST | `/api/chat/sessions/batch-delete` | 批量删除 |
| GET | `/api/chat/test/user-id` | 测试：返回当前 userId |

### 6.1 获取会话列表

**GET** `/api/chat/sessions?page=1&limit=20&sortBy=desc`

| Query | 默认 | 说明 |
|-------|------|------|
| page | 1 | 页码 |
| limit | 20 | 每页条数 |
| sortBy | desc | `desc` 最新优先 / `asc` 最早优先 |

```json
{
  "success": true,
  "data": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "sessions": [
      {
        "id": "chat-1723958400",
        "userId": "test-user-001",
        "title": "新对话",
        "lastMessage": "你好",
        "timestamp": 1723958400,
        "createdAt": "2024-08-18T02:00:00.000Z",
        "updatedAt": "2024-08-18T02:05:00.000Z",
        "messageCount": 4
      }
    ]
  }
}
```

### 6.2 创建会话

**POST** `/api/chat/sessions`

```json
{
  "title": "可选标题",
  "firstMessage": "可选首条消息预览"
}
```

- 不传 `title` 时默认为 `"新对话"`
- `sessionId` 格式：`chat-{unix秒级时间戳}`

### 6.3 获取会话详情

**GET** `/api/chat/sessions/:sessionId`

```json
{
  "success": true,
  "data": {
    "session": { "id": "chat-...", ... },
    "messages": [
      {
        "role": "user",
        "content": "你好",
        "avatar": "...",
        "name": "用户",
        "datetime": "2024-08-18T02:00:00.000Z"
      }
    ]
  }
}
```

### 6.4 保存消息

**POST** `/api/chat/sessions/:sessionId/messages`

```json
{
  "messages": [
    {
      "role": "user",
      "content": "消息内容",
      "avatar": "https://...",
      "name": "用户名",
      "datetime": "2024-08-18T02:00:00.000Z",
      "reasoning": "可选，思考过程",
      "tool_calls": [],
      "tool_call_id": "可选"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| role | `'user' \| 'assistant' \| 'tool'` | 消息角色 |
| content | string | 正文 |
| avatar | string | 头像 URL |
| name | string | 显示名 |
| datetime | string | ISO 时间 |
| reasoning | string? | DeepSeek Reasoner 思考内容 |
| tool_calls | any[]? | 工具调用 |
| tool_call_id | string? | 工具响应 ID |

消息以 **JSON 字符串** 追加到 Redis List 尾部（`rPush`），并自动更新会话的 `messageCount`、`lastMessage`（取最新 user/assistant 消息前 100 字符）。

### 6.5 更新 / 删除

**PATCH** `/api/chat/sessions/:sessionId`

```json
{ "title": "新标题", "lastMessage": "可选" }
```

**DELETE** `/api/chat/sessions/:sessionId` → 同时删除会话 Hash、消息 List，并从用户 ZSET 移除。

**POST** `/api/chat/sessions/batch-delete`

```json
{ "sessionIds": ["chat-1723958400", "chat-1723958500"] }
```

---

## 7. Chat 流式对话 `POST /api/chat`

> 路由文件：`routes/chatStream.ts`  
> **无 Redis 持久化**，直连 DeepSeek API，SSE 流式返回。

### 7.1 用途

供 `@ain-framework/remote-chat-sdk` 的 `createStreamingRuntime` 使用，实现打字机式逐字输出。

与 `/api/chat/sessions` 的区别：

| 维度 | `/api/chat/sessions` | `POST /api/chat` |
|------|----------------------|------------------|
| 协议 | REST JSON | SSE 事件流 |
| 存储 | Redis 持久化 | 无状态 |
| 职责 | 历史记录 CRUD | LLM 实时生成 |

### 7.2 请求

**POST** `/api/chat`

```json
{
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "parts": [{ "type": "text", "text": "你好" }]
    }
  ]
}
```

也兼容旧格式：`{ "role": "user", "content": "..." }`

### 7.3 响应（SSE）

`Content-Type: text/event-stream`

每行格式：`data: {"type":"...", ...}`

| 事件 type | 说明 |
|-----------|------|
| `text-start` | 开始输出，`id` 标识文本块 |
| `text-delta` | 正文增量 `{ id, delta }` |
| `reasoning-delta` | 思考过程增量（deepseek-reasoner） |
| `text-end` | 正文结束 |
| `finish` | 流结束 `{ finishReason: "stop" }` |
| `error` | 错误 `{ errorText: "..." }` |

### 7.4 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `DEEPSEEK_API_URL` | `https://api.deepseek.com/v1/chat/completions` | API 地址 |
| `DEEPSEEK_API_KEY` | — | **必填**（可兜底 `VITE_DEEPSEEK_API_KEY`） |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 模型名 |
| `DEEPSEEK_MAX_TOKENS` | `2048` | 最大 token |
| `DEEPSEEK_TEMPERATURE` | `0.7` | 温度 |

---

## 8. 智能体路由 `POST /api/chatAgent`

> 路由文件：`routes/chatAgent.ts`  
> 依赖：`@ain-framework/ain-agent-sdk`  
> 前端：`RemoteChat/index.vue` 默认指向此端点

### 8.1 路由流程

```
用户消息
   │
   ├─ 匹配待办意图 ──→ queryTodosTool() ──→ 读 agencyRepository
   │
   ├─ routeUserMessage() ──→ marketingAgent ──→ runMarketingAgent()
   │
   └─ 默认 ──→ deepseek_chat_llm.stream() 流式回答
```

待办意图正则：`/(待办|代办|todo|任务列表|我的任务|要做的(事|事情))/i`

### 8.2 请求

**POST** `/api/chatAgent`

SDK 格式：

```json
{
  "messages": [
    { "role": "user", "parts": [{ "type": "text", "text": "查一下我的待办" }] }
  ]
}
```

简化格式：

```json
{ "message": "帮我写一份营销方案" }
```

### 8.3 响应

与 `POST /api/chat` 相同的 SSE 协议（`text-start` / `text-delta` / `text-end` / `finish` / `error`）。

待办查询、营销 Agent 等非流式子流程会一次性 `text-delta` 输出完整文本。

### 8.4 环境变量

| 变量 | 说明 |
|------|------|
| `DEEPSEEK_API_KEY` | 必填 |
| `API_BASE_URL` | 可选，自定义 DeepSeek 兼容端点 |
| `TAVILY_API_KEY` | 可选，营销 Agent 深度调研 |

---

## 9. Remote 页面控制 `/api/remote`

> 路由文件：`routes/remote.ts`  
> 存储：**进程内存 Map**（非 Redis），会话 TTL 30 分钟

用于 Web MCP / 页面 Remote Control：浏览器注册当前页面 Tool 快照，服务端 Agent 可调用页面工具。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/remote/sessions` | 创建 Remote 会话 |
| POST | `/api/remote/sessions/:sessionId/heartbeat` | 心跳续期 |
| PUT | `/api/remote/sessions/:sessionId/tools` | 更新 Tool 快照 |
| POST | `/api/remote/chat` | 发送消息，执行 Remote Control Workflow |

### 9.1 创建会话

**POST** `/api/remote/sessions`

```json
{
  "clientId": "browser-tab-001",
  "pageKey": "/dashboard",
  "pageTitle": "控制台",
  "toolSnapshot": {
    "version": "1",
    "tools": [ /* RemoteToolSnapshot */ ]
  }
}
```

**响应 201**：

```json
{
  "sessionId": "remote-1723958400-abc123",
  "status": "active",
  "expiresAt": "2024-08-18T02:30:00.000Z",
  "connectionStatus": "connected"
}
```

### 9.2 心跳

**POST** `/api/remote/sessions/:sessionId/heartbeat`

```json
{ "toolSnapshotVersion": "1" }
```

**响应**：

```json
{
  "status": "active",
  "expiresAt": "...",
  "shouldRefreshTools": false
}
```

### 9.3 Remote Chat

**POST** `/api/remote/chat`

```json
{
  "sessionId": "remote-...",
  "message": "点击提交按钮",
  "pageContext": { /* RemoteAgentPageContext */ },
  "toolSnapshot": { "version": "1", "tools": [] },
  "toolResults": []
}
```

**响应**：

```json
{ "message": "Agent 回复文本" }
```

内部调用 `@ain-framework/ain-agent-sdk` 的 `runRemoteControlWorkflow()`。

---

## 10. 统计接口 `/api/statistics`

> 路由文件：`routes/statistics.ts`  
> 挂载：`app.use('/api/statistics', statisticsRouter)`  
> 注意：`index.ts` 中还存在另一个 `GET /api/statistics`（含商品统计），与之路径相同但实现不同，实际以后挂载的 router 为准。

**GET** `/api/statistics`

```json
{
  "onlineUsers": 87,
  "networkTraffic": {
    "incoming": 52428800,
    "outgoing": 41943040
  },
  "timestamp": "2024-08-18T02:00:00.000Z"
}
```

数据为内存模拟，每分钟随机更新。

---

## 11. Chat 数据模型特殊说明

Chat 是本项目 Redis 使用中**最特殊**的一块：Article / Agency 走 **Redis OM（类似 ORM + 自动建索引）**，而 Chat **完全手写 Key + 原生数据结构**，没有「建表 SQL」也没有 Redis OM Schema。

### 11.1 为什么不走 Redis OM？

| 对比项 | Article / Agency | Chat |
|--------|------------------|------|
| 建模方式 | Redis OM Schema | 手写 Key 命名规范 |
| 索引 | 启动时 `createIndex()` | 无索引，按 Key 直接访问 |
| 主键 | OM 自动生成 `entityId` | `chat-{timestamp}` 自定义 |
| 关系 | 单实体 | 用户 → 多会话 → 多消息（三层） |
| 排序 | search 分页 | ZSET score = 时间戳 |
| 消息体 | 固定字段 | JSON 序列化整对象（字段可扩展） |
| 过期 | 无 TTL | Hash + List 均 30 天 TTL |

Chat 的消息结构灵活（含 `reasoning`、`tool_calls` 等），且读写模式是「按会话追加 List」，用原生 Redis 更直接、性能更好。

### 11.2 三种 Redis Key 设计

```
用户 userId = "test-user-001"
会话 sessionId = "chat-1723958400"

① ZSET  chat:user:test-user-001:sessions
   member = sessionId
   score  = timestamp（秒，用于 desc/asc 排序）

② HASH  chat:session:test-user-001:chat-1723958400
   字段：
   ├─ id           → "chat-1723958400"
   ├─ userId       → "test-user-001"
   ├─ title        → "新对话"
   ├─ lastMessage  → 最后一条消息前 100 字符
   ├─ timestamp    → "1723958400"（字符串存 Hash）
   ├─ createdAt    → ISO 字符串
   ├─ updatedAt    → ISO 字符串
   └─ messageCount → "4"
   TTL: 30 天

③ LIST  chat:messages:test-user-001:chat-1723958400
   [0] → '{"role":"user","content":"你好",...}'   ← JSON 字符串
   [1] → '{"role":"assistant","content":"...",...}'
   ...
   TTL: 30 天
```

### 11.3 「建表 / 建字段」实际发生了什么？

**没有预建表步骤。** 第一次写入时 Redis 自动创建 Key：

| 操作 | Redis 命令 | 效果 |
|------|------------|------|
| 创建会话 | `ZADD` + `HSET` | 若 Key 不存在则自动创建 ZSET / Hash |
| 保存消息 | `RPUSH` | 若 List 不存在则自动创建 |
| 设置过期 | `EXPIRE` | 仅对 Hash 和 List 设置 30 天 TTL |

**字段不是 Redis Hash 的固定 Schema**：消息对象整体 `JSON.stringify` 后存入 List，因此新增 `reasoning` 等字段**无需迁移**，反序列化时自然带上。

**会话 ID 生成规则**（`createSession`）：

```typescript
const timestamp = Math.floor(Date.now() / 1000)
const sessionId = `chat-${timestamp}`
```

同一秒内多次创建可能冲突（当前实现未做唯一性后缀）。

### 11.4 数据流示例（完整对话生命周期）

```
1. POST /api/chat/sessions
   → ZADD chat:user:{uid}:sessions
   → HSET chat:session:{uid}:{sid}

2. POST /api/chat 或 /api/chatAgent（流式拿回复，不写 Redis）

3. POST /api/chat/sessions/{sid}/messages
   → RPUSH chat:messages:{uid}:{sid}  (JSON × N)
   → HSET 更新 messageCount、lastMessage、updatedAt

4. GET /api/chat/sessions/{sid}
   → HGETALL + LRANGE 组装返回

5. DELETE /api/chat/sessions/{sid}
   → DEL Hash + DEL List + ZREM
```

### 11.5 权限模型

- 所有 Key 都带 `userId` 前缀，天然隔离
- 路由层通过 `isSessionOwner()` 校验：读取 `chat:session:{userId}:{sessionId}` 是否存在且 `userId` 匹配
- 跨用户访问返回 404

### 11.6 与流式接口的关系

| 接口 | 是否写 Redis |
|------|-------------|
| `POST /api/chat` | 否 |
| `POST /api/chatAgent` | 否（待办 tool 只读 agency） |
| `POST /api/chat/sessions/:id/messages` | 是（需前端主动调用） |

**典型前端模式**：流式拿到 assistant 回复后，由 `packages/ltbot/src/stores/modules/chat.ts` 调用 `saveChatMessages()` 持久化。

---

## 12. 路由挂载关系

摘自 `index.ts`：

```typescript
app.use('/api/statistics', statisticsRouter)   // routes/statistics.ts
app.use('/api/agencies', agencyRouter)         // routes/agency.ts
app.use('/api/articles', articleRouter)        // routes/article.ts
app.use('/api/chat', chatRouter)               // routes/chat.ts      → /sessions/*
app.use('/api/chat', chatStreamRouter)         // routes/chatStream.ts → POST /
app.use('/api/chatAgent', chatAgentRouter)     // routes/chatAgent.ts  → POST /
app.use('/api/remote', remoteRouter)           // routes/remote.ts
```

**注意**：`chatRouter` 与 `chatStreamRouter` 同挂载在 `/api/chat` 下，Express 按注册顺序匹配：

- `GET/POST /api/chat/sessions...` → `chat.ts`
- `POST /api/chat`（根路径）→ `chatStream.ts`

---

## 附录：前端调用入口

| 功能 | 前端文件 |
|------|----------|
| 会话 CRUD | `packages/ltbot/src/api/chat.ts` |
| 流式 Chat Agent | `packages/ltbot/src/components/RemoteChat/index.vue` → `/api/chatAgent` |
| Pinia 状态 | `packages/ltbot/src/stores/modules/chat.ts` |

开发代理（`vite.config.ts`）：`/api` → `http://localhost:3000`

---

*文档生成时间：2026-08-18*
