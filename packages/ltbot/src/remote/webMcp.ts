import {
  RemoteToolRegistry,
  WebMcpClient,
  WebMcpServer,
  createMessageChannelTransportPair,
} from "@ain-framework/web-mcp-sdk";
import pinia from "@/stores";
import { useAgencyStore } from "@/stores/modules/agency";

let client: WebMcpClient | undefined;

/**
 * Registers ltbot's browser capabilities once and returns the page-side MCP client.
 * This is called from App.vue after Pinia has been installed on the Vue app.
 */
export function startRemoteMcp() {
  if (client) {
    return client;
  }

  const registry = new RemoteToolRegistry();
  const { clientTransport, serverTransport } = createMessageChannelTransportPair();
  const server = new WebMcpServer(registry, serverTransport);
  const agencyStore = useAgencyStore(pinia);

  registry.register({
    name: "ltbot.page.getCurrent",
    description: "读取当前 ltbot 页面的位置和标题。",
    inputSchema: {
      type: "object",
      additionalProperties: false,
    },
    permission: "read",
    riskLevel: "low",
    handler: () => ({
      path: window.location.pathname,
      hash: window.location.hash,
      title: document.title,
    }),
  });

  if (import.meta.env.VITE_REMOTE_ENABLE_TODO_TOOL === "true") {
    registry.register({
      name: "ltbot.todo.list",
      description: "读取当前待办事项列表。",
      inputSchema: {
        type: "object",
        additionalProperties: false,
      },
      permission: "read",
      riskLevel: "low",
      handler: async () => {
        await agencyStore.fetchAgencies();
        return agencyStore.agencies.map(({ id, title, status, priority, dueDate }) => ({
          id,
          title,
          status,
          priority,
          dueDate,
        }));
      },
    });
  }

  server.start();
  client = new WebMcpClient(clientTransport);
  client.start();

  return client;
}
