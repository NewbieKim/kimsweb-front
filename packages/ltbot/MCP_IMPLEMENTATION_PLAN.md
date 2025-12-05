# LTBOT MCP 功能实现方案

本文档描述了如何在 `ltbot` 项目中引入 MCP (Model Context Protocol) 架构，通过自然语言对话来实现待办事项（Todo）的增删改查。

参考方案：[OpenTiny NEXT 实操体验](https://bbs.huaweicloud.com/blogs/460752)

## 1. 架构设计

我们将采用 **In-Browser MCP** 架构，即 MCP Server 和 Client 都运行在浏览器端（前端应用内部）。

*   **MCP Server (`WebMcpServer`)**: 运行在前端，负责暴露 `ltbot` 的内部能力（如 `agency` store 的方法）为标准的 MCP Tools。
*   **MCP Client (`WebMcpClient`)**: 运行在前端，负责管理与 Server 的连接，并处理工具调用请求。
*   **AI Service (ChatBot)**: 现有的 DeepSeek 聊天组件，负责将用户的自然语言转换为 Tool Calls 指令。

### 核心流程

1.  **初始化**: 应用启动时，初始化 MCP Server，注册 `add_todo`、`query_todos` 等工具。
2.  **交互**:
    *   用户在 ChatBot 输入："帮我创建一个明天截止的高优先级待办，内容是编写MCP文档"。
    *   ChatBot 将消息 + 工具定义发送给 DeepSeek LLM。
    *   LLM 分析意图，返回 Tool Call 指令：`call_tool("add_todo", { title: "编写MCP文档", priority: "high", ... })`。
    *   ChatBot 拦截该指令，通过 MCP Client 调用 MCP Server。
    *   MCP Server 执行 `agencyStore.createAgency()`，返回执行结果。
    *   ChatBot 将结果回传给 LLM，LLM 生成最终回复："已为您创建高优先级待办：编写MCP文档"。

## 2. 实现步骤

### 第一步：引入依赖

我们需要引入 MCP 相关的 SDK。如果参考 OpenTiny 的方案，可以使用其封装好的 SDK（假设存在），或者直接使用标准的 `@modelcontextprotocol/sdk` 并在浏览器端做适配。

> **推荐**：为了兼容性和灵活性，建议在 `src/mcp` 目录下封装一层适配器。

```bash
pnpm add @modelcontextprotocol/sdk zod
```

### 第二步：定义 MCP Server

在 `src/mcp/server.ts` 中创建一个单例 Server，并连接到 Pinia Store。

**关键点**：
*   需要在 `setup()` 或 `store` 初始化之后注册工具，因为工具实现依赖 `useAgencyStore`。
*   工具参数使用 `zod` 定义，方便 LLM 理解格式。

**拟注册的工具 (Tools)**：

| 工具名称 | 描述 | 参数 (Schema) |
| :--- | :--- | :--- |
| `add_todo` | 创建新的待办事项 | `title` (string), `priority` (enum), `description` (string) |
| `query_todos` | 查询当前的待办事项列表 | `status` (optional string) |
| `update_todo_status` | 更新待办事项的状态 | `title` (string, 用于查找), `status` (completed/pending) |

### 第三步：改造 ChatBot 组件

现有的 `src/components/ChatBot/index.vue` 直接调用 DeepSeek API。我们需要对其进行升级，使其支持 **Function Calling (Tool Calling)**。

**改造逻辑 (`handleData` 方法)**：

1.  **构建 Tools 描述**: 将 MCP Server 中注册的工具转换为 OpenAI/DeepSeek 兼容的 JSON Schema 格式。
2.  **API 请求**: 在调用 `fetch(DEEPSEEK_CONFIG.apiUrl)` 时，在 body 中增加 `tools` 字段。
3.  **处理响应**:
    *   检查 DeepSeek 返回的数据中是否包含 `tool_calls`。
    *   **如果包含**:
        *   解析 `function.name` 和 `function.arguments`。
        *   调用本地 MCP Server 执行对应函数。
        *   获取执行结果 (Result)。
        *   构建一个新的 `tool` 角色消息，包含执行结果，**再次** 请求 DeepSeek。
    *   **如果不包含**: 直接显示 AI 的回复内容。

### 第四步：具体代码实现思路

#### 1. `src/mcp/index.ts` (Server 实现)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { useAgencyStore } from "@/stores/modules/agency";

// 单例实例
let mcpServer: McpServer | null = null;

export function initMcpServer() {
  if (mcpServer) return mcpServer;

  mcpServer = new McpServer({
    name: "ltbot-browser-server",
    version: "1.0.0"
  });

  const store = useAgencyStore();

  // 注册工具：添加待办
  mcpServer.tool(
    "add_todo",
    "创建新的待办事项",
    {
      title: z.string().describe("待办事项的标题"),
      description: z.string().optional().describe("详细描述"),
      priority: z.enum(["high", "medium", "low"]).default("medium").describe("优先级")
    },
    async ({ title, description, priority }) => {
      try {
        await store.createAgency({
          title,
          description: description || "",
          status: "pending",
          priority: priority as any
        });
        // 刷新列表
        await store.fetchAgencies();
        return {
          content: [{ type: "text", text: `成功创建待办: ${title} (优先级: ${priority})` }]
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `创建失败: ${e.message}` }],
          isError: true
        };
      }
    }
  );
  
  // ... 注册更多工具 (query, update)

  return mcpServer;
}

// 获取工具定义（供 ChatBot 发送给 LLM 使用）
export function getToolDefinitions() {
    // 这里需要编写一个帮助函数，将 Zod Schema 转换为 OpenAI Tools JSON 格式
    // 或者直接硬编码返回，如果工具不经常变动
}

// 执行工具调用
export async function executeToolCall(name: string, args: any) {
    // 通过 mcpServer 实例直接调用注册的处理函数
    // 由于 SDK 在浏览器端的特殊性，我们可以直接维护一个 Map<Name, Function> 的映射来手动分发
    // 或者使用 SDK 的内部机制
}
```

#### 2. `src/components/ChatBot/index.vue` (交互改造)

```javascript
// 在 handleData 中
const tools = getToolDefinitions(); // 获取工具定义

const requestBody = {
  model,
  messages,
  tools, // <--- 新增：告诉 AI 我有哪些能力
  stream: false // 建议处理 Tool Call 时先关闭流式，简化逻辑，或者处理复杂的流式 Tool 解析
};

const response = await fetch(...);
const data = await response.json();

const message = data.choices[0].message;

// 检查是否有工具调用
if (message.tool_calls) {
  // 1. 将 AI 的回复（包含 tool_calls）加入历史
  chatList.value.unshift(message);
  
  // 2. 遍历执行所有工具
  for (const toolCall of message.tool_calls) {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);
    
    // 3. 执行本地逻辑
    const result = await executeToolCall(functionName, functionArgs);
    
    // 4. 将结果加入历史
    chatList.value.unshift({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(result)
    });
  }
  
  // 5. 再次调用 AI，让它根据结果生成最终回复
  await handleData(); // 递归调用，这次 AI 会看到 tool 的结果
}
```

## 3. 待办事项的具体实现细节

为了支持自然语言修改，我们需要确保 AI 能找到对应的待办。

*   **查询增强**: 注册 `query_todos` 工具，让 AI 在修改前先“看”一下当前的列表。
*   **模糊匹配**: AI 可能会说“把那个买菜的任务完成了”。工具实现中，可能需要根据 `title` 进行模糊查找，或者让 AI 先查询获取 ID，再通过 ID 操作。
*   **反馈机制**: 操作完成后，务必返回操作后的最新状态，让 AI 能够确认。

## 4. 总结

通过在 `ltbot` 中集成 MCP 模式，我们将实现：
1.  **解耦**: AI 逻辑与业务逻辑（Store）分离，通过 Tools 接口交互。
2.  **可扩展**: 未来想增加“发送邮件”、“查询天气”等功能，只需注册新的 Tool，无需修改 ChatBot 核心代码。
3.  **智能化**: 用户不再需要手动点击按钮，只需对话即可完成复杂的待办管理。

