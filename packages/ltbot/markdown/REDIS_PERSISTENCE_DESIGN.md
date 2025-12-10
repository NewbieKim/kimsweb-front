# T-Chat Redis 持久化设计方案

## 📋 需求概述

**核心需求**：
1. 每次对话完成后自动保存到 Redis 数据库
2. chatHistory 从 Redis 数据库获取历史记录
3. 支持展示对应的历史消息详情
4. 保持用户会话隔离（每个用户只能看到自己的对话）

**设计目标**：
- ✅ 数据持久化：防止刷新页面丢失历史记录
- ✅ 多端同步：同一用户在不同设备/浏览器访问同一历史记录
- ✅ 高性能：使用 Redis 快速读写
- ✅ 可扩展：支持未来添加搜索、导出等功能

---

## 🏗️ 整体架构设计

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     前端 (Vue 3)                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │  ChatBot       │  │  Chat API      │  │  Store         ││
│  │  Component     │←→│  Service       │←→│  (Pinia)       ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  后端 API Server (Node.js/Express)          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │  Chat          │  │  User          │  │  Middleware    ││
│  │  Controller    │  │  Auth          │  │  (JWT验证)     ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Redis 数据库                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Key: chat:session:{userId}:{sessionId}                 ││
│  │  Key: chat:user:{userId}:sessions                       ││
│  │  Key: chat:message:{sessionId}                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Redis 数据结构设计

### 1. 会话列表（Session List）

**Key 设计**：`chat:user:{userId}:sessions`

**数据类型**：`Sorted Set (ZSET)`

**存储内容**：
- Member：sessionId
- Score：时间戳（用于排序）

**示例**：
```redis
ZADD chat:user:1001:sessions 1702350000 "chat-1702350000"
ZADD chat:user:1001:sessions 1702360000 "chat-1702360000"
ZADD chat:user:1001:sessions 1702370000 "chat-1702370000"
```

**查询操作**：
```redis
# 获取最近 20 个会话（倒序）
ZREVRANGE chat:user:1001:sessions 0 19 WITHSCORES

# 删除指定会话
ZREM chat:user:1001:sessions "chat-1702350000"

# 获取会话总数
ZCARD chat:user:1001:sessions
```

---

### 2. 会话元数据（Session Metadata）

**Key 设计**：`chat:session:{userId}:{sessionId}`

**数据类型**：`Hash`

**存储内容**：
```javascript
{
  id: "chat-1702350000",
  userId: "1001",
  title: "获取DeepSeek API Key步骤指南",
  lastMessage: "如何获取DeepSeek的API Key？",
  timestamp: "1702350000",
  createdAt: "2025-12-08T10:00:00Z",
  updatedAt: "2025-12-08T10:05:00Z",
  messageCount: 10
}
```

**Redis 命令**：
```redis
HSET chat:session:1001:chat-1702350000 
  id "chat-1702350000" 
  userId "1001" 
  title "获取DeepSeek API Key步骤指南" 
  lastMessage "如何获取DeepSeek的API Key？" 
  timestamp "1702350000" 
  createdAt "2025-12-08T10:00:00Z" 
  updatedAt "2025-12-08T10:05:00Z" 
  messageCount "10"

# 获取会话信息
HGETALL chat:session:1001:chat-1702350000

# 更新标题
HSET chat:session:1001:chat-1702350000 title "新标题"

# 删除会话元数据
DEL chat:session:1001:chat-1702350000
```

**TTL 设置**：
```redis
# 设置 30 天过期
EXPIRE chat:session:1001:chat-1702350000 2592000
```

---

### 3. 消息列表（Messages）

**Key 设计**：`chat:messages:{userId}:{sessionId}`

**数据类型**：`List`

**存储内容**：每条消息序列化为 JSON 字符串

**消息对象结构**：
```javascript
{
  role: "user" | "assistant" | "tool",
  content: "消息内容",
  avatar: "https://...",
  name: "自己" | "LTBOT",
  datetime: "2025-12-08T10:00:00Z",
  reasoning: "思考过程（可选）",
  tool_calls: [...],  // 工具调用信息（可选）
  tool_call_id: "xxx" // 工具响应ID（可选）
}
```

**Redis 命令**：
```redis
# 追加新消息（追加到列表尾部）
RPUSH chat:messages:1001:chat-1702350000 '{"role":"user","content":"你好",...}'

# 获取所有消息
LRANGE chat:messages:1001:chat-1702350000 0 -1

# 获取最近 20 条消息
LRANGE chat:messages:1001:chat-1702350000 -20 -1

# 获取消息总数
LLEN chat:messages:1001:chat-1702350000

# 删除消息列表
DEL chat:messages:1001:chat-1702350000
```

**TTL 设置**：
```redis
# 设置 30 天过期
EXPIRE chat:messages:1001:chat-1702350000 2592000
```

---

### 4. 用户信息缓存（可选）

**Key 设计**：`chat:user:{userId}:info`

**数据类型**：`Hash`

**存储内容**：
```javascript
{
  userId: "1001",
  username: "张三",
  avatar: "https://...",
  totalSessions: 15,
  totalMessages: 320,
  lastActiveAt: "2025-12-08T10:00:00Z"
}
```

**TTL 设置**：
```redis
# 设置 7 天过期
EXPIRE chat:user:1001:info 604800
```

---

## 🔌 API 接口设计

### 基础 URL
```
http://localhost:3000/api/chat
```

### 1. 获取会话列表

**请求**：
```http
GET /api/chat/sessions
Authorization: Bearer <JWT_TOKEN>
```

**Query 参数**：
```javascript
{
  page: 1,        // 页码，默认 1
  limit: 20,      // 每页数量，默认 20
  sortBy: "desc"  // 排序方式：desc（最新优先）/ asc（最早优先）
}
```

**响应**：
```javascript
{
  code: 200,
  message: "success",
  data: {
    total: 50,
    page: 1,
    limit: 20,
    sessions: [
      {
        id: "chat-1702370000",
        title: "最新对话标题",
        lastMessage: "最后一条消息内容",
        timestamp: 1702370000,
        createdAt: "2025-12-08T12:00:00Z",
        updatedAt: "2025-12-08T12:05:00Z",
        messageCount: 10
      },
      // ... 更多会话
    ]
  }
}
```

---

### 2. 创建新会话

**请求**：
```http
POST /api/chat/sessions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "新对话",  // 可选，不传则自动生成
  "firstMessage": "你好，我想了解..."  // 可选
}
```

**响应**：
```javascript
{
  code: 200,
  message: "创建成功",
  data: {
    id: "chat-1702370000",
    title: "新对话",
    timestamp: 1702370000,
    createdAt: "2025-12-08T12:00:00Z",
    updatedAt: "2025-12-08T12:00:00Z",
    messageCount: 0
  }
}
```

---

### 3. 获取会话详情（包含所有消息）

**请求**：
```http
GET /api/chat/sessions/:sessionId
Authorization: Bearer <JWT_TOKEN>
```

**响应**：
```javascript
{
  code: 200,
  message: "success",
  data: {
    session: {
      id: "chat-1702370000",
      title: "对话标题",
      timestamp: 1702370000,
      createdAt: "2025-12-08T12:00:00Z",
      updatedAt: "2025-12-08T12:05:00Z",
      messageCount: 10
    },
    messages: [
      {
        role: "user",
        content: "你好",
        avatar: "https://...",
        name: "自己",
        datetime: "2025-12-08T12:00:00Z"
      },
      {
        role: "assistant",
        content: "您好！有什么可以帮助您的吗？",
        avatar: "https://...",
        name: "LTBOT",
        datetime: "2025-12-08T12:00:05Z"
      },
      // ... 更多消息
    ]
  }
}
```

---

### 4. 保存消息（单条或批量）

**请求**：
```http
POST /api/chat/sessions/:sessionId/messages
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "你好",
      "avatar": "https://...",
      "name": "自己",
      "datetime": "2025-12-08T12:00:00Z"
    },
    {
      "role": "assistant",
      "content": "您好！",
      "avatar": "https://...",
      "name": "LTBOT",
      "datetime": "2025-12-08T12:00:05Z"
    }
  ]
}
```

**响应**：
```javascript
{
  code: 200,
  message: "保存成功",
  data: {
    savedCount: 2,
    totalMessages: 12,
    updatedAt: "2025-12-08T12:00:05Z"
  }
}
```

---

### 5. 更新会话信息

**请求**：
```http
PATCH /api/chat/sessions/:sessionId
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "新标题",  // 可选
  "lastMessage": "最后一条消息"  // 可选
}
```

**响应**：
```javascript
{
  code: 200,
  message: "更新成功",
  data: {
    id: "chat-1702370000",
    title: "新标题",
    updatedAt: "2025-12-08T12:05:00Z"
  }
}
```

---

### 6. 删除会话

**请求**：
```http
DELETE /api/chat/sessions/:sessionId
Authorization: Bearer <JWT_TOKEN>
```

**响应**：
```javascript
{
  code: 200,
  message: "删除成功",
  data: {
    deletedSessionId: "chat-1702370000",
    deletedMessages: 10
  }
}
```

---

### 7. 批量删除会话

**请求**：
```http
POST /api/chat/sessions/batch-delete
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "sessionIds": [
    "chat-1702370000",
    "chat-1702360000",
    "chat-1702350000"
  ]
}
```

**响应**：
```javascript
{
  code: 200,
  message: "批量删除成功",
  data: {
    deletedCount: 3,
    failedCount: 0
  }
}
```

---

## 💻 前端改造方案

### 1. 创建 Chat API Service

**文件路径**：`src/api/chat.ts`

```typescript
import request from '@/utils/request';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  avatar: string;
  name: string;
  datetime: string;
  reasoning?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface SessionListResponse {
  total: number;
  page: number;
  limit: number;
  sessions: ChatSession[];
}

export interface SessionDetailResponse {
  session: ChatSession;
  messages: ChatMessage[];
}

/**
 * 获取会话列表
 */
export function getChatSessions(params?: {
  page?: number;
  limit?: number;
  sortBy?: 'asc' | 'desc';
}) {
  return request.get<SessionListResponse>('/api/chat/sessions', { params });
}

/**
 * 创建新会话
 */
export function createChatSession(data: {
  title?: string;
  firstMessage?: string;
}) {
  return request.post<ChatSession>('/api/chat/sessions', data);
}

/**
 * 获取会话详情（包含所有消息）
 */
export function getChatSessionDetail(sessionId: string) {
  return request.get<SessionDetailResponse>(`/api/chat/sessions/${sessionId}`);
}

/**
 * 保存消息
 */
export function saveChatMessages(sessionId: string, messages: ChatMessage[]) {
  return request.post(`/api/chat/sessions/${sessionId}/messages`, { messages });
}

/**
 * 更新会话信息
 */
export function updateChatSession(sessionId: string, data: {
  title?: string;
  lastMessage?: string;
}) {
  return request.patch(`/api/chat/sessions/${sessionId}`, data);
}

/**
 * 删除会话
 */
export function deleteChatSession(sessionId: string) {
  return request.delete(`/api/chat/sessions/${sessionId}`);
}

/**
 * 批量删除会话
 */
export function batchDeleteChatSessions(sessionIds: string[]) {
  return request.post('/api/chat/sessions/batch-delete', { sessionIds });
}
```

---

### 2. 创建 Chat Store（Pinia）

**文件路径**：`src/stores/modules/chat.ts`

```typescript
import { defineStore } from 'pinia';
import {
  getChatSessions,
  createChatSession,
  getChatSessionDetail,
  saveChatMessages,
  updateChatSession,
  deleteChatSession,
  type ChatSession,
  type ChatMessage
} from '@/api/chat';

interface ChatState {
  // 会话列表
  sessions: ChatSession[];
  // 当前会话 ID
  currentSessionId: string | null;
  // 当前会话的消息列表
  currentMessages: ChatMessage[];
  // 加载状态
  loading: boolean;
  // 分页信息
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    sessions: [],
    currentSessionId: null,
    currentMessages: [],
    loading: false,
    pagination: {
      total: 0,
      page: 1,
      limit: 20
    }
  }),

  getters: {
    /**
     * 当前会话信息
     */
    currentSession(): ChatSession | null {
      if (!this.currentSessionId) return null;
      return this.sessions.find(s => s.id === this.currentSessionId) || null;
    },

    /**
     * 按时间分组：今天
     */
    todayChats(): ChatSession[] {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime() / 1000;

      return this.sessions.filter(chat => {
        return chat.timestamp >= todayTimestamp;
      });
    },

    /**
     * 按时间分组：昨天
     */
    yesterdayChats(): ChatSession[] {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime() / 1000;

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayTimestamp = yesterday.getTime() / 1000;

      return this.sessions.filter(chat => {
        return chat.timestamp >= yesterdayTimestamp && chat.timestamp < todayTimestamp;
      });
    },

    /**
     * 按时间分组：7天内
     */
    olderChats(): ChatSession[] {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);
      const yesterdayTimestamp = yesterday.getTime() / 1000;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoTimestamp = sevenDaysAgo.getTime() / 1000;

      return this.sessions.filter(chat => {
        return chat.timestamp < yesterdayTimestamp && chat.timestamp >= sevenDaysAgoTimestamp;
      });
    }
  },

  actions: {
    /**
     * 加载会话列表
     */
    async fetchSessions(page = 1, limit = 20) {
      try {
        this.loading = true;
        const response = await getChatSessions({ page, limit, sortBy: 'desc' });
        
        this.sessions = response.sessions;
        this.pagination = {
          total: response.total,
          page: response.page,
          limit: response.limit
        };
      } catch (error) {
        console.error('加载会话列表失败:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 创建新会话
     */
    async createSession(title?: string, firstMessage?: string) {
      try {
        const newSession = await createChatSession({ title, firstMessage });
        
        // 添加到列表开头
        this.sessions.unshift(newSession);
        this.pagination.total += 1;
        
        // 切换到新会话
        this.currentSessionId = newSession.id;
        this.currentMessages = [];
        
        return newSession;
      } catch (error) {
        console.error('创建会话失败:', error);
        throw error;
      }
    },

    /**
     * 加载会话详情
     */
    async loadSessionDetail(sessionId: string) {
      try {
        this.loading = true;
        const response = await getChatSessionDetail(sessionId);
        
        // 更新当前会话 ID
        this.currentSessionId = sessionId;
        
        // 更新消息列表（注意：从后端获取的是正序，需要转为倒序）
        this.currentMessages = response.messages.reverse();
        
        // 更新会话列表中的会话信息（如果存在）
        const index = this.sessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          this.sessions[index] = response.session;
        }
      } catch (error) {
        console.error('加载会话详情失败:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 保存消息到数据库
     */
    async saveMessages(sessionId: string, messages: ChatMessage[]) {
      try {
        // 消息需要转为正序保存
        const messagesToSave = [...messages].reverse();
        
        await saveChatMessages(sessionId, messagesToSave);
        
        // 更新会话的最后消息和更新时间
        const lastMessage = messages[0]; // 倒序数组的第一条是最新的
        const index = this.sessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          this.sessions[index].lastMessage = lastMessage.content;
          this.sessions[index].updatedAt = new Date().toISOString();
          this.sessions[index].messageCount += messages.length;
        }
      } catch (error) {
        console.error('保存消息失败:', error);
        throw error;
      }
    },

    /**
     * 更新会话标题
     */
    async updateSessionTitle(sessionId: string, title: string) {
      try {
        await updateChatSession(sessionId, { title });
        
        const index = this.sessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          this.sessions[index].title = title;
        }
      } catch (error) {
        console.error('更新会话标题失败:', error);
        throw error;
      }
    },

    /**
     * 删除会话
     */
    async deleteSession(sessionId: string) {
      try {
        await deleteChatSession(sessionId);
        
        // 从列表中移除
        const index = this.sessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          this.sessions.splice(index, 1);
          this.pagination.total -= 1;
        }
        
        // 如果删除的是当前会话，清空当前状态
        if (this.currentSessionId === sessionId) {
          this.currentSessionId = null;
          this.currentMessages = [];
        }
      } catch (error) {
        console.error('删除会话失败:', error);
        throw error;
      }
    },

    /**
     * 清空当前会话
     */
    clearCurrentSession() {
      this.currentSessionId = null;
      this.currentMessages = [];
    }
  }
});
```

---

### 3. 修改 ChatBot 组件

**文件路径**：`src/components/ChatBot/index.vue`

**主要修改点**：

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useChatStore } from '@/stores/modules/chat';

// 使用 Chat Store
const chatStore = useChatStore();

// 本地 chatList 依然保留（用于实时交互）
const chatList = ref([]);

// 侧边栏数据从 Store 获取
const todayChats = computed(() => chatStore.todayChats);
const yesterdayChats = computed(() => chatStore.yesterdayChats);
const olderChats = computed(() => chatStore.olderChats);

// 当前会话 ID
const currentChatId = computed(() => chatStore.currentSessionId);

// 初始化：加载会话列表
onMounted(async () => {
  initMcpServer();
  await chatStore.fetchSessions();
});

// 创建新会话
const startNewChat = async () => {
  try {
    // 1. 如果当前有未保存的消息，先保存
    if (chatList.value.length > 0 && currentChatId.value) {
      await saveCurrentChat();
    }
    
    // 2. 创建新会话（后端）
    const newSession = await chatStore.createSession('新对话');
    
    // 3. 清空本地消息列表
    chatList.value = [];
  } catch (error) {
    console.error('创建新会话失败:', error);
  }
};

// 切换到指定会话
const switchToChat = async (chatId) => {
  try {
    // 1. 保存当前会话（如果有未保存的消息）
    if (chatList.value.length > 0 && currentChatId.value) {
      await saveCurrentChat();
    }
    
    // 2. 从后端加载会话详情
    await chatStore.loadSessionDetail(chatId);
    
    // 3. 同步到本地 chatList
    chatList.value = [...chatStore.currentMessages];
  } catch (error) {
    console.error('切换会话失败:', error);
  }
};

// 删除会话
const deleteChat = async (chatId) => {
  try {
    await chatStore.deleteSession(chatId);
  } catch (error) {
    console.error('删除会话失败:', error);
  }
};

// 保存当前会话（核心函数）
const saveCurrentChat = async () => {
  if (!currentChatId.value || chatList.value.length === 0) {
    return;
  }
  
  try {
    // 只保存新增的消息（避免重复保存）
    // 可以通过对比 chatStore.currentMessages 和 chatList 来判断新增的消息
    const savedCount = chatStore.currentMessages.length;
    const newMessages = chatList.value.slice(0, chatList.value.length - savedCount);
    
    if (newMessages.length > 0) {
      await chatStore.saveMessages(currentChatId.value, newMessages);
    }
  } catch (error) {
    console.error('保存会话失败:', error);
  }
};

// 在 handleData 完成后自动保存
const handleData = async (userMessage, isRecursive = false) => {
  // ... 原有的对话逻辑 ...
  
  try {
    // ... AI 对话处理 ...
    
    // 【新增】对话完成后，自动保存到数据库
    if (!isRecursive && currentChatId.value) {
      // 保存最新的两条消息（用户消息 + AI 回复）
      const latestMessages = chatList.value.slice(0, 2);
      await chatStore.saveMessages(currentChatId.value, latestMessages);
    }
    
  } catch (error) {
    // ... 错误处理 ...
  }
};

// 组件卸载前保存当前会话
onBeforeUnmount(async () => {
  if (chatList.value.length > 0 && currentChatId.value) {
    await saveCurrentChat();
  }
});
</script>
```

---

## 🔐 用户认证方案

### 1. JWT Token 认证流程

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│  前端    │                │  后端    │                │  Redis   │
└────┬─────┘                └────┬─────┘                └────┬─────┘
     │                           │                           │
     │  1. 登录请求              │                           │
     ├──────────────────────────>│                           │
     │  (username + password)    │                           │
     │                           │                           │
     │                           │  2. 验证用户              │
     │                           ├──────────────────────────>│
     │                           │                           │
     │  3. 返回 JWT Token        │                           │
     │<──────────────────────────┤                           │
     │  { token, userId }        │                           │
     │                           │                           │
     │  4. 携带 Token 请求数据   │                           │
     ├──────────────────────────>│                           │
     │  Authorization: Bearer xx │                           │
     │                           │                           │
     │                           │  5. 验证 Token            │
     │                           │  解析出 userId            │
     │                           │                           │
     │                           │  6. 查询用户数据          │
     │                           ├──────────────────────────>│
     │                           │  chat:user:1001:sessions  │
     │                           │                           │
     │  7. 返回数据              │                           │
     │<──────────────────────────┤                           │
     │                           │                           │
```

### 2. 前端 Token 存储

**使用场景**：
- 登录后将 Token 存储到 `localStorage` 或 `sessionStorage`
- 每次请求自动携带 Token

**实现示例**：
```typescript
// src/utils/auth.ts
const TOKEN_KEY = 'chat_token';
const USER_ID_KEY = 'chat_user_id';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function setUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}
```

### 3. 请求拦截器配置

```typescript
// src/utils/request.ts
import axios from 'axios';
import { getToken } from './auth';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000
});

// 请求拦截器：自动添加 Token
request.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理 Token 过期
request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Token 过期，跳转到登录页
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
```

---

## 🚀 实现流程（分阶段）

### 阶段一：后端基础搭建（1-2天）

#### 1.1 技术选型
- **运行环境**：Node.js 18+
- **Web 框架**：Express.js
- **Redis 客户端**：ioredis
- **认证**：jsonwebtoken
- **其他**：dotenv、cors、helmet

#### 1.2 项目初始化
```bash
# 创建后端项目
mkdir ltbot-backend
cd ltbot-backend
npm init -y

# 安装依赖
npm install express ioredis jsonwebtoken dotenv cors helmet
npm install -D @types/node @types/express @types/jsonwebtoken typescript ts-node nodemon
```

#### 1.3 项目结构
```
ltbot-backend/
├── src/
│   ├── config/
│   │   ├── redis.ts         # Redis 配置
│   │   └── jwt.ts           # JWT 配置
│   ├── middleware/
│   │   ├── auth.ts          # JWT 验证中间件
│   │   └── errorHandler.ts # 错误处理中间件
│   ├── controllers/
│   │   ├── chatController.ts    # Chat 控制器
│   │   └── authController.ts    # Auth 控制器
│   ├── services/
│   │   ├── chatService.ts       # Chat 业务逻辑
│   │   └── redisService.ts      # Redis 操作封装
│   ├── routes/
│   │   ├── chat.ts          # Chat 路由
│   │   └── auth.ts          # Auth 路由
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   └── app.ts               # Express 应用入口
├── .env                     # 环境变量
├── .env.example             # 环境变量示例
├── package.json
└── tsconfig.json
```

#### 1.4 核心代码框架

**Redis Service 示例**：
```typescript
// src/services/redisService.ts
import Redis from 'ioredis';

class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    });
  }

  // 获取用户的会话列表
  async getUserSessions(userId: string, start = 0, end = 19) {
    const key = `chat:user:${userId}:sessions`;
    const sessions = await this.redis.zrevrange(key, start, end, 'WITHSCORES');
    
    // 解析结果（sessions 是 [sessionId, score, sessionId, score, ...] 格式）
    const result = [];
    for (let i = 0; i < sessions.length; i += 2) {
      result.push({
        sessionId: sessions[i],
        timestamp: parseInt(sessions[i + 1])
      });
    }
    
    return result;
  }

  // 添加会话到用户列表
  async addUserSession(userId: string, sessionId: string, timestamp: number) {
    const key = `chat:user:${userId}:sessions`;
    await this.redis.zadd(key, timestamp, sessionId);
  }

  // 保存会话元数据
  async saveSessionMetadata(userId: string, sessionId: string, data: any) {
    const key = `chat:session:${userId}:${sessionId}`;
    await this.redis.hmset(key, data);
    await this.redis.expire(key, 30 * 24 * 60 * 60); // 30天过期
  }

  // 获取会话元数据
  async getSessionMetadata(userId: string, sessionId: string) {
    const key = `chat:session:${userId}:${sessionId}`;
    return await this.redis.hgetall(key);
  }

  // 保存消息
  async saveMessages(userId: string, sessionId: string, messages: any[]) {
    const key = `chat:messages:${userId}:${sessionId}`;
    const messageStrings = messages.map(msg => JSON.stringify(msg));
    await this.redis.rpush(key, ...messageStrings);
    await this.redis.expire(key, 30 * 24 * 60 * 60); // 30天过期
  }

  // 获取消息列表
  async getMessages(userId: string, sessionId: string, start = 0, end = -1) {
    const key = `chat:messages:${userId}:${sessionId}`;
    const messages = await this.redis.lrange(key, start, end);
    return messages.map(msg => JSON.parse(msg));
  }

  // 删除会话
  async deleteSession(userId: string, sessionId: string) {
    const sessionKey = `chat:session:${userId}:${sessionId}`;
    const messagesKey = `chat:messages:${userId}:${sessionId}`;
    const userSessionsKey = `chat:user:${userId}:sessions`;
    
    await this.redis.del(sessionKey);
    await this.redis.del(messagesKey);
    await this.redis.zrem(userSessionsKey, sessionId);
  }
}

export default new RedisService();
```

---

### 阶段二：前端集成（2-3天）

#### 2.1 创建 API Service
- 完成 `src/api/chat.ts` 文件
- 配置请求拦截器

#### 2.2 创建 Chat Store
- 完成 `src/stores/modules/chat.ts` 文件
- 集成到现有 Store 体系

#### 2.3 修改 ChatBot 组件
- 替换本地 `chatHistory` 为 Store 数据
- 添加自动保存逻辑
- 处理加载状态和错误提示

#### 2.4 测试与调试
- 测试会话创建、切换、删除
- 测试消息保存和加载
- 测试刷新页面后数据恢复

---

### 阶段三：优化与扩展（1-2天）

#### 3.1 性能优化
- **增量保存**：只保存新增消息，避免重复保存
- **防抖保存**：用户停止输入 2 秒后自动保存
- **分页加载**：会话列表和消息列表支持分页

#### 3.2 用户体验优化
- **乐观更新**：UI 先更新，后台异步保存
- **离线缓存**：使用 IndexedDB 缓存，离线可用
- **加载骨架屏**：数据加载时显示骨架屏

#### 3.3 功能扩展
- **会话搜索**：支持按标题或内容搜索会话
- **会话导出**：导出为 Markdown、PDF 等格式
- **会话分享**：生成分享链接
- **消息点赞/收藏**：标记重要消息

---

## 📋 关键实现细节

### 1. 增量保存策略

**问题**：每次对话都保存全部消息会造成重复

**解决方案**：
```typescript
// 在 ChatBot 组件中维护已保存消息的数量
const savedMessageCount = ref(0);

const saveNewMessages = async () => {
  // 只保存未保存的消息
  const unsavedMessages = chatList.value.slice(0, chatList.value.length - savedMessageCount.value);
  
  if (unsavedMessages.length > 0) {
    await chatStore.saveMessages(currentChatId.value!, unsavedMessages);
    savedMessageCount.value = chatList.value.length;
  }
};
```

---

### 2. 防抖自动保存

**目的**：避免频繁保存，节省资源

**实现**：
```typescript
import { debounce } from 'lodash-es'; // 或自己实现

// 创建防抖保存函数
const debouncedSave = debounce(async () => {
  await saveNewMessages();
}, 2000); // 2 秒后保存

// 在消息更新时调用
watch(chatList, () => {
  if (currentChatId.value) {
    debouncedSave();
  }
});
```

---

### 3. 乐观更新

**策略**：UI 先更新，后台异步保存

```typescript
const deleteChat = async (chatId: string) => {
  // 1. 先从 UI 移除（乐观更新）
  const index = chatStore.sessions.findIndex(s => s.id === chatId);
  const removedSession = chatStore.sessions.splice(index, 1)[0];
  
  try {
    // 2. 后台删除
    await chatStore.deleteSession(chatId);
  } catch (error) {
    // 3. 失败则恢复
    chatStore.sessions.splice(index, 0, removedSession);
    console.error('删除失败:', error);
  }
};
```

---

### 4. 离线支持（可选）

**使用 IndexedDB 作为本地缓存**：

```typescript
// src/utils/indexedDB.ts
class ChatDB {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('ChatDatabase', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建 sessions 表
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        
        // 创建 messages 表
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: ['sessionId', 'index'] });
          messagesStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };
    });
  }

  // 保存会话到本地
  async saveSessionLocally(session: ChatSession) {
    const transaction = this.db!.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    await store.put(session);
  }

  // 从本地加载会话
  async getSessionsLocally() {
    const transaction = this.db!.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const request = store.getAll();
    
    return new Promise<ChatSession[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export default new ChatDB();
```

---

## ⚠️ 注意事项

### 1. 数据一致性

**问题**：前端 `chatList` 和后端 Redis 数据可能不一致

**解决方案**：
- 定期同步：每隔 30 秒自动保存
- 离开页面前保存：监听 `beforeunload` 事件
- 切换会话时保存：确保当前会话数据不丢失

---

### 2. 并发问题

**问题**：多个标签页同时操作同一会话

**解决方案**：
- 使用 Redis 的原子操作（ZADD、RPUSH 等）
- 前端使用 BroadcastChannel 实现跨标签页通信
- 后端加锁（Redis SETNX）

---

### 3. 数据安全

**问题**：敏感对话内容需要保护

**解决方案**：
- 数据加密：对敏感内容进行 AES 加密
- 访问控制：严格验证用户身份
- 定期清理：自动删除过期数据（TTL）

---

### 4. 性能考虑

**问题**：大量历史消息影响性能

**解决方案**：
- 分页加载：每次只加载部分消息
- 虚拟滚动：使用虚拟列表组件
- 消息压缩：对长文本进行压缩存储

---

## 🧪 测试方案

### 1. 单元测试

**测试 Redis Service**：
```typescript
// tests/redisService.test.ts
import redisService from '@/services/redisService';

describe('RedisService', () => {
  const testUserId = 'test-user-001';
  const testSessionId = 'chat-test-001';

  test('应该能够保存和获取会话元数据', async () => {
    const metadata = {
      id: testSessionId,
      title: '测试会话',
      timestamp: Date.now()
    };
    
    await redisService.saveSessionMetadata(testUserId, testSessionId, metadata);
    const result = await redisService.getSessionMetadata(testUserId, testSessionId);
    
    expect(result.id).toBe(testSessionId);
    expect(result.title).toBe('测试会话');
  });

  test('应该能够保存和获取消息', async () => {
    const messages = [
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '您好！' }
    ];
    
    await redisService.saveMessages(testUserId, testSessionId, messages);
    const result = await redisService.getMessages(testUserId, testSessionId);
    
    expect(result.length).toBe(2);
    expect(result[0].content).toBe('你好');
  });
});
```

---

### 2. 集成测试

**测试 API 接口**：
```typescript
// tests/chatApi.test.ts
import request from 'supertest';
import app from '@/app';

describe('Chat API', () => {
  let token: string;
  let sessionId: string;

  beforeAll(async () => {
    // 登录获取 Token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'test123' });
    
    token = response.body.data.token;
  });

  test('应该能够创建新会话', async () => {
    const response = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '测试会话' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('测试会话');
    
    sessionId = response.body.data.id;
  });

  test('应该能够获取会话列表', async () => {
    const response = await request(app)
      .get('/api/chat/sessions')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data.sessions.length).toBeGreaterThan(0);
  });

  test('应该能够保存消息', async () => {
    const response = await request(app)
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        messages: [
          { role: 'user', content: '测试消息' }
        ]
      });
    
    expect(response.status).toBe(200);
    expect(response.body.data.savedCount).toBe(1);
  });
});
```

---

## 📦 环境变量配置

**后端 `.env` 文件**：
```env
# 服务器配置
PORT=3000
NODE_ENV=development

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

**前端 `.env` 文件**：
```env
# API 地址
VITE_API_BASE_URL=http://localhost:3000

# DeepSeek API
VITE_DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
VITE_DEEPSEEK_API_KEY=your-api-key-here
VITE_DEEPSEEK_MODEL=deepseek-chat
```

---

## 🎯 总结

### 核心要点

1. **数据模型**：使用 Redis 的 ZSET、Hash、List 三种数据结构存储会话和消息
2. **API 设计**：RESTful 风格，支持增删改查和批量操作
3. **前端改造**：使用 Pinia Store 管理状态，ChatBot 组件负责 UI 交互
4. **自动保存**：对话完成后自动保存，切换会话/离开页面前保存
5. **用户隔离**：通过 JWT Token 验证用户身份，数据按 userId 隔离

### 实施建议

1. **分阶段实施**：先实现基础功能，再逐步优化和扩展
2. **优先保证核心流程**：创建会话 → 保存消息 → 加载历史
3. **做好错误处理**：网络异常、Redis 连接失败等场景
4. **性能监控**：记录 API 响应时间，优化慢查询

---

*文档版本：1.0*  
*最后更新：2025-12-08*

