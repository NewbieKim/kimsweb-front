# ChatBot 与 MCP 实现总结

本文档总结 `ltbot` 项目中 `ChatBot` 组件的实现思路、核心流程、MCP 工具调用机制，以及流式与非流式输出的区别。

## 相关源码

- `src/components/ChatBot/index.vue`：ChatBot 核心组件，负责聊天 UI、用户输入、DeepSeek 请求、MCP Tool Calling、会话保存。
- `src/stores/modules/chat.ts`：Pinia Chat Store，负责会话列表、当前会话、消息加载与保存。
- `src/api/chat.ts`：聊天会话后端 API 封装。
- `src/mcp/index.ts`：前端 MCP 工具注册、工具定义导出、工具执行入口。
- `src/types/index.ts`：聊天消息、会话、接口响应类型定义。
- `src/components/AISidebar.vue`：把 ChatBot 嵌入 AI 侧边栏，并通过样式适配浮动窗口和侧边栏场景。
- `src/views/chat/index.vue`：ChatBot 独立聊天页面入口。

## ChatBot 整体实现

`ChatBot/index.vue` 是一个组合式 Vue 组件，整体由三部分组成：

1. 会话侧边栏
2. 主聊天区域
3. 聊天输入与 AI 响应处理逻辑

组件内部维护一个本地消息数组 `chatList`，用于即时 UI 渲染；同时通过 `useChatStore()` 使用 Pinia Store 来管理历史会话和持久化数据。

### 页面结构

模板中，最外层是 `.chat-box`：

```vue
<div class="chat-box">
  <div class="sidebar">...</div>
  <div class="main-chat-area">...</div>
</div>
```

左侧 `.sidebar` 展示会话列表，包括：

- LTBOT logo
- 展开/收起按钮
- 新建对话按钮
- 今天的会话
- 历史会话
- 删除会话按钮

右侧 `.main-chat-area` 根据 `chatList.length` 切换展示：

- `chatList.length === 0`：欢迎页、输入框、快捷建议
- `chatList.length > 0`：TDesign 的 `t-chat` 聊天界面

### 主要状态

`ChatBot` 内部关键状态包括：

```ts
const abortController = ref(null);
const loading = ref(false);
const isStreamLoad = ref(false);
const chatRef = ref(null);
const isShowToBottom = ref(false);
const welcomeInput = ref('');
const sidebarCollapsed = ref(false);
const chatList = ref([]);
```

含义如下：

- `abortController`：用于中断当前 DeepSeek 请求。
- `loading`：控制聊天组件的文本加载状态。
- `isStreamLoad`：标识当前是否正在生成 AI 回复。
- `chatRef`：获取 `t-chat` 实例，用于调用 `scrollToBottom`。
- `isShowToBottom`：控制“回到底部”按钮展示。
- `welcomeInput`：欢迎页输入框内容。
- `sidebarCollapsed`：控制左侧会话栏是否收起。
- `chatList`：当前聊天消息数组，项目中采用倒序渲染，最新消息在数组头部。

从 Pinia Store 派生的状态：

```ts
const currentChatId = computed(() => chatStore.currentSessionId);
const todayChats = computed(() => chatStore.todayChats);
const yesterdayChats = computed(() => chatStore.yesterdayChats);
const olderChats = computed(() => chatStore.olderChats);
```

这些状态用于侧边栏会话列表展示、当前会话高亮和切换。

## ChatBot 生命周期

组件挂载时执行：

```ts
onMounted(async () => {
  initMcpServer();
  await chatStore.fetchSessions();
});
```

作用：

- 初始化前端 MCP Server 和工具注册表。
- 从后端加载历史会话列表。

组件卸载前执行：

```ts
onBeforeUnmount(async () => {
  if (chatList.value.length > 0 && currentChatId.value) {
    await saveCurrentChat();
  }
});
```

作用：

- 如果当前会话存在未保存消息，则在组件卸载前保存。

## 聊天组件 140-175 行实现细节

`ChatBot/index.vue` 的 140-175 行使用 TDesign Chat 组件族搭建聊天窗口：

```vue
<t-chat
  v-else
  ref="chatRef"
  :clear-history="chatList.length > 0 && !isStreamLoad"
  :data="chatList"
  :text-loading="loading"
  :is-stream-load="isStreamLoad"
  style="height: 600px"
  @scroll="handleChatScroll"
  @clear="clearConfirm"
>
  <template #content="{ item, index }">...</template>
  <template #actions="{ item, index }">...</template>
  <template #footer>...</template>
</t-chat>
```

### t-chat 主容器

`t-chat` 接收 `chatList` 作为消息数据：

```vue
:data="chatList"
```

同时接收加载状态：

```vue
:text-loading="loading"
:is-stream-load="isStreamLoad"
```

清空历史按钮是否可用由以下表达式控制：

```vue
:clear-history="chatList.length > 0 && !isStreamLoad"
```

含义是：只有存在消息且当前不在生成中，才允许清空历史。

滚动与清空事件：

```vue
@scroll="handleChatScroll"
@clear="clearConfirm"
```

- `handleChatScroll`：处理聊天区域滚动，控制回到底部按钮。
- `clearConfirm`：清空本地 `chatList`。

### content 插槽

`#content` 决定每条消息正文如何渲染：

```vue
<template #content="{ item, index }">
  <t-chat-reasoning v-if="item.reasoning?.length > 0" expand-icon-placement="right">
    ...
  </t-chat-reasoning>
  <t-chat-content v-if="item.content.length > 0" :content="item.content" />
</template>
```

逻辑：

- 如果消息有 `reasoning`，先用 `t-chat-reasoning` 展示推理过程。
- 如果消息有 `content`，再用 `t-chat-content` 展示正式回复。

推理区域头部会根据当前状态切换：

```vue
<t-chat-loading v-if="isStreamLoad && item.content.length === 0" text="思考中..." />
```

当 AI 正在生成且正式内容为空时，显示“思考中...”。

### actions 插槽

`#actions` 定义每条消息下方的操作按钮：

```vue
<t-chat-action
  :content="item.content"
  :operation-btn="['good', 'bad', 'replay', 'copy']"
  @operation="handleOperation"
/>
```

支持操作：

- `good`：点赞
- `bad`：点踩
- `replay`：重新生成
- `copy`：复制

目前 `handleOperation` 只是打印日志，尚未接入真实业务逻辑。

### footer 插槽

`#footer` 定义底部输入框：

```vue
<t-chat-input
  :stop-disabled="isStreamLoad"
  @send="inputEnter"
  @stop="onStop"
/>
```

事件：

- `send`：用户发送消息，调用 `inputEnter(inputValue)`。
- `stop`：用户点击停止，调用 `onStop()` 中断请求。

## 用户发送消息流程

发送入口是 `inputEnter(inputValue)`。

整体流程：

```txt
用户输入
  ↓
t-chat-input 触发 send
  ↓
inputEnter(inputValue)
  ↓
必要时创建新会话
  ↓
插入用户消息
  ↓
插入 assistant 空占位消息
  ↓
handleData(inputValue)
  ↓
请求 DeepSeek
  ↓
更新 assistant 消息内容
  ↓
保存消息到后端
```

关键逻辑：

```ts
if (isStreamLoad.value) {
  return;
}
if (!inputValue) return;
```

如果当前正在生成 AI 回复，则禁止再次发送。

如果当前没有会话，会自动创建新会话：

```ts
if (chatList.value.length === 0 && !currentChatId.value) {
  const newSession = await chatStore.createSession(
    generateChatTitle(inputValue),
    inputValue
  );
}
```

然后插入用户消息：

```ts
chatList.value.unshift({
  avatar: 'https://tdesign.gtimg.com/site/avatar.jpg',
  name: '自己',
  datetime: new Date().toDateString(),
  content: inputValue,
  role: 'user',
});
```

再插入一个 assistant 空占位：

```ts
chatList.value.unshift({
  avatar: 'https://tdesign.gtimg.com/site/chat-avatar.png',
  name: 'LTBOT',
  datetime: new Date().toDateString(),
  content: '',
  reasoning: '',
  role: 'assistant',
});
```

最后调用：

```ts
handleData(inputValue);
```

## DeepSeek 请求实现

AI 请求主要由两个函数完成：

- `handleData(userMessage, isRecursive = false)`
- `getChatDataStream(messages, options = {})`

### handleData

`handleData` 负责构造上下文、请求模型、处理普通回复或 Tool Calling。

开始时设置状态：

```ts
loading.value = true;
isStreamLoad.value = true;
```

非递归调用时创建 `AbortController`：

```ts
if (!isRecursive) {
  abortController.value = new AbortController();
}
```

构造上下文时，因为 `chatList` 是倒序，所以先反转：

```ts
const fullHistory = [...chatList.value].reverse();
fullHistory.pop();
```

然后截取最近 20 条消息：

```ts
const recentMessages = fullHistory.slice(-20).map(msg => {
  const apiMsg = {
    role: msg.role,
    content: msg.content || ''
  };
  if (msg.tool_calls) apiMsg.tool_calls = msg.tool_calls;
  if (msg.tool_call_id) apiMsg.tool_call_id = msg.tool_call_id;
  return apiMsg;
});
```

这里保留了：

- `role`
- `content`
- `tool_calls`
- `tool_call_id`

目的是让模型能够理解完整的工具调用链路。

然后获取 MCP 工具定义：

```ts
const tools = getToolDefinitions();
```

调用 DeepSeek：

```ts
const response = await getChatDataStream(recentMessages, {
  signal: abortController.value.signal,
  tools: tools.length > 0 ? tools : undefined,
  stream: false
});
```

当前项目传的是 `stream: false`，即非流式请求。

### getChatDataStream

该函数封装 DeepSeek Chat Completions 请求：

```ts
const DEEPSEEK_CONFIG = {
  apiUrl: import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
  model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat',
  maxTokens: 2048,
  temperature: 0.7
};
```

请求体：

```ts
const requestBody = {
  model,
  messages,
  max_tokens: maxTokens,
  temperature,
  stream,
  tools
};
```

请求方式：

```ts
fetch(DEEPSEEK_CONFIG.apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
  },
  body: JSON.stringify(requestBody),
  signal
});
```

## 会话持久化流程

会话持久化由 `chatStore` 和 `api/chat.ts` 负责。

### API 封装

`api/chat.ts` 中定义了后端接口地址：

```ts
const LOCALURL = 'http://localhost:6688/api';
const PRODURL = 'http://ltbot.top/api';
const API_BASE_URL = process.env.NODE_ENV === 'production' ? PRODURL : LOCALURL;
```

主要接口：

- `GET /chat/sessions`：获取会话列表
- `POST /chat/sessions`：创建新会话
- `GET /chat/sessions/:sessionId`：获取会话详情
- `POST /chat/sessions/:sessionId/messages`：保存消息
- `PATCH /chat/sessions/:sessionId`：更新会话信息
- `DELETE /chat/sessions/:sessionId`：删除会话
- `POST /chat/sessions/batch-delete`：批量删除会话

### Store 状态

`stores/modules/chat.ts` 中的核心状态：

```ts
sessions: [],
currentSessionId: null,
currentMessages: [],
loading: false,
error: null,
pagination: {
  total: 0,
  page: 1,
  limit: 20
}
```

### 消息顺序转换

前端 `chatList` 是倒序，最新消息在前；后端通常按正序保存。

加载会话详情时：

```ts
this.currentMessages = response.messages.reverse();
```

保存消息时：

```ts
const messagesToSave = [...messages].reverse();
```

也就是说：

```txt
后端正序消息
  ↓ reverse
前端倒序展示
  ↓ reverse
后端正序保存
```

## MCP 实现细节

MCP 相关代码位于 `src/mcp/index.ts`。

当前实现并不是完整地通过标准 MCP 传输层与外部服务通信，而是在前端实现了一个轻量工具注册表：

```ts
const toolRegistry = {
  definitions: [] as any[],
  handlers: new Map<string, ToolHandler>()
};
```

其中：

- `definitions`：保存 OpenAI/DeepSeek function calling 格式的工具定义，传给 LLM。
- `handlers`：保存本地工具处理函数，由前端执行。

### registerTool

工具注册函数：

```ts
function registerTool(
  name: string,
  description: string,
  parameters: any,
  handler: ToolHandler
) {
  toolRegistry.definitions.push({
    type: "function",
    function: {
      name,
      description,
      parameters
    }
  });

  toolRegistry.handlers.set(name, handler);
}
```

这个函数同时做两件事：

1. 把工具 schema 注册到 `definitions`，供模型选择调用。
2. 把真实执行函数注册到 `handlers`，供前端执行。

### initMcpServer

初始化函数：

```ts
export function initMcpServer() {
  if (mcpServer) return mcpServer;

  mcpServer = new McpServer({ name: "ltbot-browser-server", version: "1.0.0" });

  const store = useAgencyStore();

  registerTool(...);

  return mcpServer;
}
```

这里创建了一个 `McpServer` 实例，但当前主要执行路径仍然依赖自定义 `toolRegistry`。

### 当前注册的工具

#### add_todo

作用：创建新的待办事项。

参数：

- `title`：待办标题，必填。
- `description`：详细描述。
- `priority`：优先级，支持 `high`、`medium`、`low`。

内部调用：

```ts
await store.createAgency({
  title,
  description: description || "",
  status: "pending",
  priority: priority || "medium"
});
await store.fetchAgencies();
```

#### query_todos

作用：查询待办列表，支持按状态过滤。

参数：

- `status`：`pending`、`completed`、`all`

内部调用：

```ts
await store.fetchAgencies();
let todos = store.agencies;
```

然后根据 `status` 过滤并返回简化后的待办列表。

#### update_todo_status

作用：根据标题关键字更新待办状态。

参数：

- `title_keyword`：标题关键字。
- `status`：`pending` 或 `completed`。

内部先拉取待办列表，再用标题做简单模糊匹配：

```ts
const target = todos.find(t => t.title.includes(title_keyword));
```

如果 Store 中存在 `updateAgency`，则调用它更新；否则降级为直接修改响应式对象。

#### query_project_info

作用：查询项目详情。

当前实现中 `getProjectInfo(projectId)` 返回 mock 项目信息，再经过：

```ts
const normalized = buildNormalizedProjectInfo(project);
const summary_markdown = buildSummaryMarkdownFromNormalized(normalized);
```

最终返回：

- `project_info`：原始项目对象。
- `normalized`：结构化释义。
- `summary_markdown`：可读摘要。

## MCP / Tool Calling 流程

整体流程如下：

```txt
组件挂载
  ↓
initMcpServer()
  ↓
registerTool 注册工具定义和 handler
  ↓
用户发送消息
  ↓
ChatBot 构造 messages
  ↓
getToolDefinitions() 获取工具 schema
  ↓
请求 DeepSeek，携带 tools
  ↓
模型判断是否需要调用工具
  ↓
如果返回 tool_calls
  ↓
ChatBot 解析 tool_calls
  ↓
executeToolCall(name, args)
  ↓
执行本地 handler
  ↓
把工具结果作为 role=tool 的消息插入 chatList
  ↓
递归调用 handleData(null, true)
  ↓
模型读取工具结果并生成最终自然语言回复
```

### 获取工具定义

`ChatBot` 中：

```ts
const tools = getToolDefinitions();
```

`mcp/index.ts` 中：

```ts
export function getToolDefinitions() {
  return toolRegistry.definitions;
}
```

这些工具定义会作为 `tools` 字段传给 DeepSeek：

```ts
const requestBody = {
  model,
  messages,
  max_tokens: maxTokens,
  temperature,
  stream,
  tools
};
```

### 模型返回 tool_calls

如果模型认为需要调用工具，会返回：

```ts
message.tool_calls
```

ChatBot 检查：

```ts
if (message.tool_calls) {
  ...
}
```

然后记录本次工具调用：

```ts
lastItem.tool_calls = message.tool_calls;
```

### 执行工具

遍历每个工具调用：

```ts
for (const toolCall of message.tool_calls) {
  const fnName = toolCall.function.name;
  let fnArgs = JSON.parse(toolCall.function.arguments);
  const result = await executeToolCall(fnName, fnArgs);
}
```

`executeToolCall` 实现：

```ts
export async function executeToolCall(name: string, args: any) {
  const handler = toolRegistry.handlers.get(name);
  if (!handler) {
    throw new Error(`工具 ${name} 未找到`);
  }
  return await handler(args);
}
```

### 插入工具结果

工具执行完成后，ChatBot 把结果作为一条 `tool` 消息插入：

```ts
chatList.value.unshift({
  role: 'tool',
  tool_call_id: toolCall.id,
  content: JSON.stringify(result),
  name: fnName,
  datetime: new Date().toDateString(),
  avatar: 'https://tdesign.gtimg.com/site/chat-avatar.png',
});
```

这里的 `tool_call_id` 用来关联模型之前返回的某个 `tool_call`。

### 递归生成最终回复

插入工具结果后，再创建一个新的 assistant 占位：

```ts
chatList.value.unshift({
  avatar: 'https://tdesign.gtimg.com/site/chat-avatar.png',
  name: 'LTBOT',
  datetime: new Date().toDateString(),
  content: '',
  role: 'assistant',
});
```

然后递归调用：

```ts
await handleData(null, true);
```

递归调用时，用户消息、assistant tool_calls、tool 结果都已经在 `chatList` 历史里，因此不再额外追加用户消息。

最终模型会基于工具执行结果生成自然语言回复。

## 流式与非流式输出

AI 聊天接口通常支持两种输出方式：

- 非流式输出
- 流式输出

### 非流式输出

非流式是指：模型完整生成答案后，一次性返回完整 JSON。

请求参数：

```ts
stream: false
```

典型处理方式：

```ts
const response = await fetch(url, options);
const data = await response.json();
const message = data.choices[0].message;
```

特点：

- 实现简单。
- 一次性拿到完整 `content`。
- 一次性拿到完整 `tool_calls`。
- 更适合 Tool Calling、JSON 输出、结构化返回。
- 用户需要等待完整回复生成完成后才能看到内容。

当前 `ChatBot` 实际使用的是非流式：

```ts
const response = await getChatDataStream(recentMessages, {
  signal: abortController.value.signal,
  tools: tools.length > 0 ? tools : undefined,
  stream: false
});

const data = await response.json();
```

### 流式输出

流式是指：模型一边生成，一边把片段返回给前端。

请求参数：

```ts
stream: true
```

典型处理方式：

```ts
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // 解析 chunk，并持续追加到当前 assistant 消息
}
```

特点：

- 首字响应更快。
- 用户体验类似 ChatGPT，内容逐字或逐段出现。
- 可以边接收边渲染。
- 中断体验更自然。
- 前端实现更复杂。
- Tool Calling 更难处理，因为 `tool_calls` 的 name、arguments 可能也是分片返回，需要自行拼接完整。

### 两者对比

```txt
非流式：
用户提问 -> 等待完整生成 -> 一次性返回完整答案 -> 渲染

流式：
用户提问 -> 收到第一个片段 -> 持续追加内容 -> 完成
```

| 维度 | 非流式 | 流式 |
| --- | --- | --- |
| 响应方式 | 完整返回 | 分片返回 |
| 用户体验 | 等待后一次展示 | 边生成边展示 |
| 实现复杂度 | 低 | 高 |
| Tool Calling | 简单 | 复杂 |
| 中断请求 | 可中断，但用户只看到最终/错误状态 | 可中断，体验更自然 |
| 适合场景 | 短回复、结构化输出、工具调用 | 长文本、聊天体验、逐字展示 |

### MockSSEResponse

项目中存在：

```ts
src/components/ChatBot/mockdata/sseRequest-reasoning.ts
```

其中 `MockSSEResponse` 用于模拟流式响应：

```ts
const chunk = this.data.slice(0, 1);
this.data = this.data.slice(1);
this.controller.enqueue(this.encoder.encode(chunk));
```

它会把字符串拆成单个字符，按延迟逐个推给前端。

不过当前 `ChatBot/index.vue` 中只是引入了它，没有实际使用：

```ts
import { MockSSEResponse } from './mockdata/sseRequest-reasoning';
```

实际请求仍然传了：

```ts
stream: false
```

因此当前生产逻辑没有真正启用流式输出。




## 当前实现中的注意点

### 1. 用户消息可能重复进入上下文

`inputEnter` 中已经把用户消息插入 `chatList`：

```ts
chatList.value.unshift(params);
```

而 `handleData(userMessage)` 构造上下文时，`chatList` 已经包含该用户消息。随后又执行：

```ts
if (userMessage) {
  recentMessages.push({
    role: 'user',
    content: userMessage
  });
}
```

这可能导致当前用户消息在请求上下文里重复出现。

### 2. Tool Calling 分支保存逻辑可能不完整

如果模型返回 `tool_calls`，代码执行工具后会递归：

```ts
await handleData(null, true);
return;
```

普通消息保存逻辑位于后续代码中，并且条件是：

```ts
if (!isRecursive && currentChatId.value) {
  await chatStore.saveMessages(...);
}
```

因此 Tool Calling 链路中的 tool 消息和最终 assistant 回复可能不会按普通路径完整保存。

### 3. Store 保存后没有同步 currentMessages

`saveMessages` 保存成功后只更新了会话摘要：

```ts
this.sessions[index].lastMessage = lastMessage.content.substring(0, 100);
this.sessions[index].updatedAt = result.updatedAt;
this.sessions[index].messageCount = result.totalMessages;
```

但没有同步更新：

```ts
this.currentMessages
```

而 `saveCurrentChat` 会依赖 `chatStore.currentMessages.length` 判断本地新增消息数量。这可能带来重复保存或新消息计算不准的问题。

### 4. 真实流式能力尚未接入

虽然组件中有：

```ts
isStreamLoad
```

以及 mock SSE 工具，但真实请求仍然是非流式。若要启用真正的流式输出，需要改造：

- 请求参数 `stream: true`
- 使用 `response.body.getReader()` 读取 chunk
- 解析 SSE data
- 持续追加到当前 assistant 消息的 `content`
- 处理流式 tool_calls 参数拼接

## 总结

当前 `ChatBot` 的设计可以概括为：

```txt
Vue 组件负责交互与即时渲染
  +
Pinia Store 负责会话状态和持久化
  +
DeepSeek Chat Completions 负责模型回复
  +
前端 MCP registry 负责本地工具定义和工具执行
```

普通聊天路径：

```txt
用户输入 -> 插入本地消息 -> 请求 DeepSeek -> 填充 assistant 回复 -> 保存消息
```

工具调用路径：

```txt
用户输入 -> 请求 DeepSeek + tools -> 模型返回 tool_calls -> 前端执行工具 -> 插入 tool 结果 -> 再请求模型 -> 生成最终回复
```

当前实现优先选择非流式输出，主要好处是 Tool Calling 处理简单；如果未来更关注 ChatGPT 式逐字输出体验，可以在现有 `isStreamLoad`、`AbortController` 和 `MockSSEResponse` 思路基础上继续改造成真实流式解析。
