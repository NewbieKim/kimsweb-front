import express, { Request, Response } from "express";
import { IncomingMessage, ServerResponse } from "http";
import { z } from "zod";
import 'dotenv/config';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 导入自定义模块：飞书客户端api封装
import { FeishuClient } from './api/feishu.ts';
console.log('FeishuClient', FeishuClient);

export const Logger = {
    log: (...args: any[]) => console.log(...args),
    error: (...args: any[]) => console.error(...args)
};

// 飞书MCP服务器
export class FeishuMcpServer {
    private server: McpServer;
    private feishuClient: FeishuClient;
    private transport: Transport | null = null;

    constructor(private readonly appId: string, private readonly appSecret: string) {
        // 创建飞书客户端实例
        this.feishuClient = new FeishuClient(this.appId, this.appSecret);
        this.server = new McpServer({ name: 'feishu-mcp', version: '1.0.0' }, { capabilities: {logging: {}, tools: {}} });
        // 注册工具
        this.registerTools()
    }

    private registerTools() {
        this.server.tool(
            'list-spaces',
            '列出所有文档空间', 
            {},
            async () => {
                try {
                    console.log('开始执行工具list-spaces');
                    const response = await this.feishuClient.getSpaces();
                    const spaces = response.items || [];
                    return {
                        content: [
                            { 
                                type: 'text',
                                text: JSON.stringify({
                                    spaces: spaces.map(space => ({
                                      id: space.space_id, 
                                      name: space.name
                                    }))
                                })
                            }
                        ]
                    }
                } catch (error) {
                    return {
                        content: [{ type: 'text', text: `错误: ${error instanceof Error ? error.message : String(error)}` }]
                    }
                }
            }
        )
    }

    /**
     * 启动标准输入输出模式
     */
    async startStdio() {
        const transport = new StdioServerTransport();
        this.transport = transport;
        await this.connect(transport);
        return this;
    }

    /**
     * 启动HTTP服务器
     * @param port 端口号
     */
    async startHttp(port: number = 7777) {
        const app = express();
        
        // 添加健康检查终端
        app.get('/health', (req: Request, res: Response) => {
            res.status(200).send('OK');
        });

        // 主页 - 简单的HTML界面
        app.get('/', (req: Request, res: Response) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>飞书文档MCP服务</title>
                    <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { color: #3370ff; }
                    .status { padding: 10px; border-radius: 4px; display: inline-block; }
                    .running { background-color: #e3f0e3; color: #2b702b; }
                    pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
                    </style>
                </head>
                <body>
                    <h1>飞书文档MCP服务</h1>
                    <p>状态: <span class="status running">运行中</span></p>
                    <h2>可用功能:</h2>
                    <ul>
                    <li>列出文档空间</li>
                    <li>列出文档</li>
                    </ul>
                </body>
                </html>
            `);
        });

        // SSE 路由
        app.get('/mcp', async (req: Request, res: Response) => {
            console.log("新的MCP SSE连接已建立");
            const transport = new SSEServerTransport(
                "/mcp-messages",
                res as unknown as ServerResponse<IncomingMessage>,
            );
            this.transport = transport;
            await this.connect(transport);
        });

        app.post('/mcp-messages', async (req: Request, res: Response) => {
            console.log("新的MCP消息已到达");
            if (!this.transport) {
                res.status(400).send("SSE连接尚未建立");
                return;
            }
            
            const sseTransport = this.transport as SSEServerTransport;
            await sseTransport.handlePostMessage(
                req as unknown as IncomingMessage,
                res as unknown as ServerResponse<IncomingMessage>,
            );
        });

        // 启动HTTP服务器
        return new Promise<this>((resolve) => {
            const server = app.listen(port, () => {
                Logger.log(`HTTP服务器已启动，监听端口: ${port}`);
                Logger.log(`SSE端点: http://localhost:${port}/mcp`);
                Logger.log(`消息端点: http://localhost:${port}/mcp-messages`);
                resolve(this);
            });
        });
    }

    /**
     * 连接到传输层
     */
    private async connect(transport: Transport): Promise<void> {
        await this.server.connect(transport);

        Logger.log = (...args: any[]) => {
            this.server.server.sendLoggingMessage({
                level: "info",
                data: args,
            });
            console.log(...args);
            };
            
            Logger.error = (...args: any[]) => {
            this.server.server.sendLoggingMessage({
                level: "error",
                data: args,
            });
            console.error(...args);
        };

        Logger.log("服务器已连接，可以处理请求");
    }
}

// 用于动态导入
export { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";