# 通用 ChatBot 组件对接文档

## 1. 目标

在外部 Vue 3 项目中，参考本项目独立封装一个可复用的 `ChatBot` 组件，基于 `@tdesign-vue-next/chat` 实现聊天 UI，并将会话管理、消息发送、流式响应、停止生成等逻辑封装在组件或服务层中。

适用场景：

- AI 助手侧边栏
- 独立聊天页面
- 嵌入式智能客服
- Agent 对话窗口
- MCP / 工具调用型 AI 助手

## 2. 依赖安装

```bash
pnpm add @tdesign-vue-next/chat tdesign-vue-next tdesign-icons-vue-next
```

如果项目未安装 Vue 生态基础依赖，还需要：

```bash
pnpm add vue pinia vue-router
```

## 3. 全局注册

在项目入口文件中注册 `TDesignChat`：

```ts
import { createApp } from 'vue'
import App from './App.vue'
import TDesignChat from '@tdesign-vue-next/chat'
import 'tdesign-vue-next/es/style/index.css'

const app = createApp(App)

app.use(TDesignChat)

app.mount('#app')
```

注册后可以在任意组件中直接使用：

```vue
<t-chat />
<t-chat-input />
<t-chat-content />
<t-chat-action />
<t-chat-reasoning />
<t-chat-loading />
```

## 4. 推荐目录结构

```txt
src/
  components/
    ChatBot/
      index.vue
      types.ts
      chatService.ts
      mock.ts
  stores/
    chat.ts
  api/
    chat.ts
```

职责建议：

- `ChatBot/index.vue`：聊天 UI 和交互入口。
- `types.ts`：消息、会话、接口响应类型。
- `chatService.ts`：AI 请求、流式解析、中断控制。
- `api/chat.ts`：后端会话接口。
- `stores/chat.ts`：可选，用于跨页面共享会话状态。

## 5. 核心数据结构

建议先定义统一消息类型：

```ts
export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  avatar?: string
  name?: string
  datetime?: string
  reasoning?: string
  tool_calls?: any[]
  tool_call_id?: string
}
```

`t-chat` 需要绑定消息列表：

```ts
const chatList = ref<ChatMessage[]>([])
```

## 6. 基础 ChatBot 组件

```vue
<template>
  <div class="chat-bot">
    <t-chat
      ref="chatRef"
      :data="chatList"
      :text-loading="loading"
      :is-stream-load="isStreamLoad"
      :clear-history="chatList.length > 0 && !isStreamLoad"
      style="height: 600px"
      @clear="clearChat"
      @scroll="handleScroll"
    >
      <template #content="{ item }">
        <t-chat-reasoning
          v-if="item.reasoning"
          expand-icon-placement="right"
        >
          <template #header>
            <t-chat-loading
              v-if="isStreamLoad && !item.content"
              text="思考中..."
            />
            <span v-else>已深度思考</span>
          </template>

          <t-chat-content :content="item.reasoning" />
        </t-chat-reasoning>

        <t-chat-content
          v-if="item.content"
          :content="item.content"
        />
      </template>

      <template #actions="{ item }">
        <t-chat-action
          :content="item.content"
          :operation-btn="['good', 'bad', 'replay', 'copy']"
          @operation="handleOperation"
        />
      </template>

      <template #footer>
        <t-chat-input
          :stop-disabled="!isStreamLoad"
          @send="sendMessage"
          @stop="stopGenerate"
        />
      </template>
    </t-chat>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ChatMessage } from './types'

const chatRef = ref()
const chatList = ref<ChatMessage[]>([])
const loading = ref(false)
const isStreamLoad = ref(false)
const abortController = ref<AbortController | null>(null)

async function sendMessage(content: string) {
  if (!content.trim()) return

  chatList.value.push({
    role: 'user',
    content,
    name: '用户',
    datetime: new Date().toLocaleString()
  })

  const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: '',
    reasoning: '',
    name: 'AI助手',
    datetime: new Date().toLocaleString()
  }

  chatList.value.push(assistantMessage)

  loading.value = true
  isStreamLoad.value = true
  abortController.value = new AbortController()

  try {
    await requestAIStream(content, {
      signal: abortController.value.signal,
      onReasoning(delta) {
        assistantMessage.reasoning = (assistantMessage.reasoning || '') + delta
      },
      onMessage(delta) {
        assistantMessage.content += delta
      }
    })
  } finally {
    loading.value = false
    isStreamLoad.value = false
    abortController.value = null
  }
}

function stopGenerate() {
  abortController.value?.abort()
  loading.value = false
  isStreamLoad.value = false
}

function clearChat() {
  chatList.value = []
}

function handleScroll() {}

function handleOperation(type: string, options: any) {
  console.log('operation:', type, options)
}

async function requestAIStream(
  prompt: string,
  options: {
    signal: AbortSignal
    onReasoning: (text: string) => void
    onMessage: (text: string) => void
  }
) {
  // 这里替换成真实 AI 接口
  options.onMessage(`收到你的问题：${prompt}`)
}
</script>

<style scoped>
.chat-bot {
  width: 100%;
  height: 100%;
}
</style>
```

## 7. AI 请求层封装

建议不要把请求逻辑全部写在组件里，可以单独封装：

```ts
export async function sendChatMessage(params: {
  messages: Array<{ role: string; content: string }>
  signal?: AbortSignal
  onMessage?: (delta: string) => void
  onReasoning?: (delta: string) => void
}) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    signal: params.signal,
    body: JSON.stringify({
      messages: params.messages
    })
  })

  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder('utf-8')

  if (!reader) return

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    params.onMessage?.(chunk)
  }
}
```

组件只调用服务：

```ts
await sendChatMessage({
  messages: chatList.value,
  signal: abortController.value.signal,
  onMessage(delta) {
    assistantMessage.content += delta
  }
})
```

## 8. 会话管理建议

如果需要历史会话，建议抽成 Store：

```ts
export interface ChatSession {
  id: string
  title: string
  lastMessage: string
  createdAt: string
  updatedAt: string
  messageCount: number
}
```

推荐能力：

- 创建会话
- 切换会话
- 删除会话
- 保存当前消息
- 拉取历史消息
- 自动生成会话标题

组件侧只关心：

```ts
const currentSessionId = computed(() => chatStore.currentSessionId)
const sessions = computed(() => chatStore.sessions)
```

## 9. 外层容器封装建议

如果要做侧边栏 AI 助手，建议拆成两层：

```txt
AISidebar.vue
  -> 控制打开、关闭、浮动、拖拽、遮罩
  -> 内部渲染 ChatBot.vue

ChatBot.vue
  -> 只负责聊天本身
```

示例：

```vue
<template>
  <div v-if="modelValue" class="ai-sidebar">
    <header class="sidebar-header">
      <span>AI助手</span>
      <button @click="$emit('update:modelValue', false)">关闭</button>
    </header>

    <ChatBot />
  </div>
</template>

<script setup lang="ts">
import ChatBot from './ChatBot/index.vue'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>
```

## 10. 全局悬浮按钮接入

如果需要网站全局入口，可以在布局组件中挂载：

```vue
<template>
  <RouterView />

  <button class="ai-float-button" @click="showAI = true">
    AI
  </button>

  <AISidebar v-model="showAI" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AISidebar from '@/components/AISidebar.vue'

const showAI = ref(false)
</script>
```

## 11. 推荐组件 Props / Emits

为了让 `ChatBot` 更通用，可以设计成：

```ts
interface Props {
  height?: string
  placeholder?: string
  defaultMessages?: ChatMessage[]
  enableReasoning?: boolean
  enableHistory?: boolean
}

interface Emits {
  send: [message: string]
  stop: []
  clear: []
  error: [error: Error]
}
```

示例：

```vue
<ChatBot
  height="600px"
  placeholder="给 AI 发送消息"
  :enable-history="true"
  @send="handleSend"
  @error="handleError"
/>
```

## 12. 对接后端接口建议

推荐接口：

```txt
GET    /api/chat/sessions
POST   /api/chat/sessions
GET    /api/chat/sessions/:id
PATCH  /api/chat/sessions/:id
DELETE /api/chat/sessions/:id

POST   /api/chat/sessions/:id/messages
POST   /api/chat/completions
```

其中：

- `sessions` 管理历史会话。
- `messages` 保存会话消息。
- `completions` 调用大模型，支持流式返回。

## 13. 流式响应处理建议

推荐组件内部维护三个状态：

```ts
const loading = ref(false)
const isStreamLoad = ref(false)
const abortController = ref<AbortController | null>(null)
```

发送时：

```ts
loading.value = true
isStreamLoad.value = true
abortController.value = new AbortController()
```

停止时：

```ts
abortController.value?.abort()
loading.value = false
isStreamLoad.value = false
```

## 14. 样式注意事项

`@tdesign-vue-next/chat` 会依赖 TDesign 的全局 CSS 变量，因此必须引入：

```ts
import 'tdesign-vue-next/es/style/index.css'
```

如果放在侧边栏中，需要额外处理高度：

```css
.chat-bot {
  height: 100%;
}

:deep(.t-chat) {
  height: 100%;
}

:deep(.t-chat__list) {
  flex: 1;
  overflow-y: auto;
}
```

## 15. 通用封装原则

建议遵循以下拆分：

- `ChatBot` 只负责聊天交互和展示。
- `AISidebar` 只负责容器、打开关闭、浮动拖拽。
- `chatService` 只负责请求 AI。
- `chatStore` 只负责会话状态。
- `api/chat.ts` 只负责 HTTP 接口。
- MCP / 工具调用逻辑不要直接塞进 UI，建议独立成 `tools` 或 `mcp` 模块。

## 16. 最小接入流程

1. 安装依赖：

```bash
pnpm add @tdesign-vue-next/chat tdesign-vue-next tdesign-icons-vue-next
```

2. 在入口注册：

```ts
import TDesignChat from '@tdesign-vue-next/chat'
import 'tdesign-vue-next/es/style/index.css'

app.use(TDesignChat)
```

3. 创建 `ChatBot.vue`。

4. 使用 `t-chat` 渲染消息列表。

5. 使用 `t-chat-input` 接收用户输入。

6. 封装 AI 请求函数。

7. 接入流式返回和停止生成。

8. 可选接入会话历史和侧边栏容器。

## 17. 推荐最终结构

```txt
components/
  AISidebar.vue
  ChatBot/
    index.vue
    types.ts
    chatService.ts

stores/
  chat.ts

api/
  chat.ts
```

这样封装后，外部项目只需要：

```vue
<template>
  <AISidebar v-model="showAI" />
</template>
```

或：

```vue
<template>
  <ChatBot />
</template>
```

即可独立复用。
