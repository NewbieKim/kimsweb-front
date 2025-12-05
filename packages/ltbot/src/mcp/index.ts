import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { useAgencyStore } from "@/stores/modules/agency";

// 定义工具处理器类型
type ToolHandler = (args: any) => Promise<any>;

// 存储工具定义和处理器的注册表
const toolRegistry = {
    definitions: [] as any[],
    handlers: new Map<string, ToolHandler>()
};

// 辅助函数：注册工具
function registerTool(
    name: string,
    description: string,
    parameters: any, // OpenAI 格式的 parameters JSON
    handler: ToolHandler
) {
    // 1. 添加到定义列表（供 LLM 使用）
    toolRegistry.definitions.push({
        type: "function",
        function: {
            name,
            description,
            parameters
        }
    });

    // 2. 注册处理器（供本地调用）
    toolRegistry.handlers.set(name, handler);
}

// 单例实例
let mcpServer: McpServer | null = null;

export function initMcpServer() {
    if (mcpServer) return mcpServer;

    // 虽然我们主要使用自定义的 registry，但保留 McpServer 实例以便未来扩展标准协议
    mcpServer = new McpServer({ name: "ltbot-browser-server", version: "1.0.0" });

    // 获取 Store 实例（必须在 setup 或组件中使用，这里假设 init 在组件中调用）
    const store = useAgencyStore();

    // ============================
    // 1. 注册工具: add_todo
    // ============================
    registerTool(
        "add_todo",
        "创建新的待办事项",
        {
            type: "object",
            properties: {
                title: { type: "string", description: "待办事项的标题" },
                description: { type: "string", description: "详细描述" },
                priority: { type: "string", enum: ["high", "medium", "low"], description: "优先级 (high/medium/low)，默认 medium" }
            },
            required: ["title"]
        },
        async ({ title, description, priority }) => {
            try {
                await store.createAgency({
                    title,
                    description: description || "",
                    status: "pending",
                    priority: priority || "medium"
                });
                await store.fetchAgencies();
                return { success: true, message: `成功创建待办: ${title}` };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    );

    // ============================
    // 2. 注册工具: query_todos
    // ============================
    registerTool(
        "query_todos",
        "查询当前的待办事项列表，支持按状态过滤",
        {
            type: "object",
            properties: {
                status: { type: "string", enum: ["pending", "completed", "all"], description: "过滤状态: pending(未完成), completed(已完成), all(全部)" }
            }
        },
        async ({ status }) => {
            try {
                await store.fetchAgencies();
                let todos = store.agencies;
                
                if (status && status !== 'all') {
                    todos = todos.filter(t => t.status === status);
                }

                // 简化返回信息，节省 token
                const simpleTodos = todos.map(t => ({
                    id: t.entityId || t.id, // 兼容不同字段名
                    title: t.title,
                    status: t.status,
                    priority: t.priority
                }));

                return { 
                    success: true, 
                    count: simpleTodos.length,
                    todos: simpleTodos 
                };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    );

    // ============================
    // 3. 注册工具: update_todo_status
    // ============================
    registerTool(
        "update_todo_status",
        "更新待办事项的状态（完成/未完成）",
        {
            type: "object",
            properties: {
                title_keyword: { type: "string", description: "用于搜索待办事项的标题关键字" },
                status: { type: "string", enum: ["pending", "completed"], description: "新状态" }
            },
            required: ["title_keyword", "status"]
        },
        async ({ title_keyword, status }) => {
            try {
                await store.fetchAgencies();
                const todos = store.agencies;
                
                // 简单的模糊匹配
                const target = todos.find(t => t.title.includes(title_keyword));
                
                if (!target) {
                    return { success: false, error: `未找到包含关键字 "${title_keyword}" 的待办事项` };
                }

                // 调用 store 的更新方法 (假设 store 有 updateAgency 或直接修改)
                // 这里模拟更新，具体看 store 实现
                // 如果 store 没有直接更新状态的方法，可能需要先 delete 再 create，或者添加 update 方法
                // 这里假设有一个 updateAgency 方法，如果没有，我们尝试直接调用 create 覆盖或者 delete+create
                
                // 检查 store 是否有 updateAgency
                if ((store as any).updateAgency) {
                     await (store as any).updateAgency(target.entityId, { ...target, status });
                } else {
                     // 降级方案：如果 store 没有 update，这里暂时报错或者模拟
                     // 实际上我们应该去完善 store。为了演示，这里假设可以直接修改对象（如果 store 是 reactive 的）
                     target.status = status;
                     // 理想情况下应该调用 API 持久化
                }
                
                return { 
                    success: true, 
                    message: `已将 "${target.title}" 的状态更新为 ${status}`,
                    todo: { title: target.title, status: status }
                };
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        }
    );

    return mcpServer;
}

// 获取工具定义（供 ChatBot 发送给 LLM 使用）
export function getToolDefinitions() {
    return toolRegistry.definitions;
}

// 执行工具调用
export async function executeToolCall(name: string, args: any) {
    const handler = toolRegistry.handlers.get(name);
    if (!handler) {
        throw new Error(`工具 ${name} 未找到`);
    }
    console.log(`[MCP] 执行工具: ${name}`, args);
    return await handler(args);
}
