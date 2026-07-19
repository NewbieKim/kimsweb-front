import express, { Router, Request, Response } from "express";
import type {
  RemoteAgentPageContext,
  type RemoteAgentToolDefinition,
  type RemoteAgentToolResult,
} from "@ain-framework/ain-agent-sdk";
import type { RemoteToolSnapshot } from "@ain-framework/web-mcp-sdk";

type RemoteSession = {
  clientId: string;
  pageKey: string;
  pageTitle: string;
  expiresAt: string;
  toolSnapshot: RemoteToolSnapshot;
};

const SESSION_TTL_MS = 30 * 60 * 1000;
const sessions = new Map<string, RemoteSession>();
const router: Router = express.Router();

function createSessionId() {
  return `remote-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString();
}

function getActiveSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session || Date.parse(session.expiresAt) <= Date.now()) {
    sessions.delete(sessionId);
    return undefined;
  }
  return session;
}

router.post("/sessions", (req: Request, res: Response) => {
  const { clientId, pageKey, pageTitle, toolSnapshot } = req.body ?? {};
  if (!clientId || !pageKey || !pageTitle || !toolSnapshot) {
    return res.status(400).json({ message: "clientId、pageKey、pageTitle 和 toolSnapshot 均为必填项。" });
  }

  const sessionId = createSessionId();
  const expiresAt = getExpiry();
  sessions.set(sessionId, { clientId, pageKey, pageTitle, expiresAt, toolSnapshot });

  return res.status(201).json({
    sessionId,
    status: "active",
    expiresAt,
    connectionStatus: "connected",
  });
});

router.post("/sessions/:sessionId/heartbeat", (req: Request, res: Response) => {
  const session = getActiveSession(String(req.params.sessionId));
  if (!session) {
    return res.status(404).json({ message: "Remote 会话不存在或已过期。" });
  }

  session.expiresAt = getExpiry();
  return res.json({
    status: "active",
    expiresAt: session.expiresAt,
    shouldRefreshTools: req.body?.toolSnapshotVersion !== session.toolSnapshot.version,
  });
});

router.put("/sessions/:sessionId/tools", (req: Request, res: Response) => {
  const session = getActiveSession(String(req.params.sessionId));
  const toolSnapshot = req.body?.toolSnapshot as RemoteToolSnapshot | undefined;
  if (!session) {
    return res.status(404).json({ message: "Remote 会话不存在或已过期。" });
  }
  if (!toolSnapshot?.tools || !Array.isArray(toolSnapshot.tools)) {
    return res.status(400).json({ message: "toolSnapshot.tools 必须为数组。" });
  }

  session.toolSnapshot = toolSnapshot;
  return res.json({ acceptedCount: toolSnapshot.tools.length, rejectedTools: [] });
});

router.post("/chat", async (req: Request, res: Response) => {
  const { sessionId, message, pageContext, toolSnapshot, toolResults } = req.body ?? {};
  const session = getActiveSession(sessionId);
  if (!session) {
    return res.status(404).json({ message: "Remote 会话不存在或已过期。" });
  }
  if (typeof message !== "string" || !message.trim() || !pageContext || !toolSnapshot) {
    return res.status(400).json({ message: "message、pageContext 和 toolSnapshot 均为必填项。" });
  }

  session.toolSnapshot = toolSnapshot as RemoteToolSnapshot;

  // if (process.env.REMOTE_CHAT_MODE === "mock") {
  //   return res.json({
  //     message: "Mock 模式已启用：消息发送与接收链路正常。",
  //   });
  // }

  const { runRemoteControlWorkflow } = await import("@ain-framework/ain-agent-sdk");
  const reply = await runRemoteControlWorkflow({
    message,
    sessionId,
    pageContext: pageContext as RemoteAgentPageContext,
    tools: (toolSnapshot.tools ?? []) as RemoteAgentToolDefinition[],
    toolResults: (toolResults ?? []) as RemoteAgentToolResult[],
  });

  return res.json({ message: reply });
});

export default router;
