import express, { Router, Request, Response } from 'express'
import {
  CHAT_WORKFLOW_NAME,
  MARKETING_AGENT_WORKFLOW_NAME,
  REMOTE_CONTROL_WORKFLOW_NAME,
  deepseek_chat_llm,
  routeUserMessage,
  runMarketingAgent,
} from '@ain-framework/ain-agent-sdk'
import { agencyRepository } from '../db/redis.js'

/**
 * POST /api/chatAgent —— 接入 @ain-framework/ain-agent-sdk 的智能体路由。
 *
 * 流程：问题识别 -> 路由到子 agent：
 *   1. 待办类请求（查询待办/我的任务等）→ 调用待办 tool（读取 Redis 中的 agency 数据）
 *   2. 营销类请求 → 路由到 ain-agent-sdk 的 marketingAgent（planner + researcher + writer）
 *   3. 其他普通问答 → 直接使用 deepseek_chat_llm 流式回答
 *
 * 与 /api/chat 的区别：/api/chat 是无状态直连 DeepSeek；chatAgent 先做意图路由，
 * 再按工作流分发给不同子 agent，并支持调用本地业务 tool（待办）。
 *
 * 请求体（兼容 @ain-framework/remote-chat-sdk 的 createStreamingRuntime）：
 *   { messages: [{ id, role: 'user' | 'assistant', parts: [{ type: 'text', text }] }] }
 * 也兼容简单客户端：{ message: '...' }
 *
 * 响应：SSE 文本流（AI SDK UI message stream 协议，与 /api/chat 一致）：
 *   text-start / text-delta / text-end / finish；出错发 error 事件。
 *
 * 环境变量：
 *   DEEPSEEK_API_KEY（必填）；DEEPSEEK_MODEL / DEEPSEEK_API_URL 由 SDK 内部模型读取
 *   API_BASE_URL（可选，自定义 DeepSeek 兼容端点）
 *   TAVILY_API_KEY（可选，营销 agent 做深度调研时使用；未配置则调研步骤会失败并返回错误）
 */

const router: Router = express.Router()

/* ==================== 消息提取 ==================== */

interface SdkChatMessage {
  id?: string
  role?: string
  parts?: Array<{ type?: string; text?: string }>
  content?: unknown
}

function extractText(message: SdkChatMessage): string {
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part.type === 'text' && typeof part.text === 'string')
      .map((part) => part.text as string)
      .join('')
      .trim()
  }
  if (typeof message.content === 'string') {
    return message.content.trim()
  }
  return ''
}

function extractLastUserText(messages: unknown): string {
  if (!Array.isArray(messages)) return ''
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as SdkChatMessage
    if (message?.role === 'user') {
      const text = extractText(message)
      if (text) return text
    }
  }
  return ''
}

/* ==================== 待办 tool ==================== */

const TODO_INTENT_PATTERN = /(待办|代办|todo|任务列表|我的任务|要做的(事|事情))/i

interface AgencyRow {
  entityId?: string
  title?: string
  description?: string
  status?: string
  priority?: string
}

/** 待办查询 tool：读取 Redis 中的 agency 数据并格式化为可读文本 */
async function queryTodosTool(): Promise<string> {
  try {
    const rows = (await agencyRepository.search().return.all()) as AgencyRow[]
    if (!rows.length) {
      return '当前没有待办事项。'
    }

    const statusLabel: Record<string, string> = {
      pending: '待处理',
      completed: '已完成',
      cancelled: '已取消',
    }
    const priorityLabel: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
    }

    const lines = rows.map((row, index) => {
      const title = row.title || '（无标题）'
      const status = statusLabel[row.status ?? ''] ?? row.status ?? '未知'
      const priority = priorityLabel[row.priority ?? ''] ?? row.priority ?? '-'
      const description = row.description ? `｜${row.description}` : ''
      return `${index + 1}. ${title}【${status} / 优先级${priority}】${description}`
    })

    return `当前待办（共 ${rows.length} 项）：\n${lines.join('\n')}`
  } catch (error) {
    return `读取待办失败：${error instanceof Error ? error.message : String(error)}`
  }
}

/* ==================== 普通问答：LangChain 消息转换 ==================== */

function toLangchainMessages(messages: unknown): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(messages)) return []
  const result: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const message of messages) {
    const role = (message as SdkChatMessage)?.role
    if (role !== 'user' && role !== 'assistant') continue
    const content = extractText(message as SdkChatMessage)
    if (!content) continue
    result.push({ role, content })
  }
  return result
}

/** 提取流式 chunk 的文本内容（兼容 string 与 content block 数组） */
function chunkText(chunk: { content?: unknown }): string {
  if (typeof chunk.content === 'string') return chunk.content
  if (Array.isArray(chunk.content)) {
    return chunk.content
      .map((part) => {
        if (typeof part === 'string') return part
        if (
          part &&
          typeof part === 'object' &&
          'text' in part &&
          typeof (part as { text?: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text
        }
        return ''
      })
      .join('')
  }
  return ''
}

/* ==================== SSE 输出 ==================== */

function sendSseHeaders(res: Response) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
}

/* ==================== 路由处理 ==================== */

router.post('/', async (req: Request, res: Response) => {
  const { messages, message } = req.body ?? {}
  const userText =
    typeof message === 'string' && message.trim()
      ? message.trim()
      : extractLastUserText(messages)

  if (!userText) {
    res.status(400).json({ message: '没有可用的用户消息' })
    return
  }

  sendSseHeaders(res)

  const textId = `text-${Date.now()}`
  const writeEvent = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  /** 单段文本整体输出（待办 / 营销结果等非流式子 agent） */
  const finishWithText = (text: string) => {
    writeEvent({ type: 'text-start', id: textId })
    writeEvent({ type: 'text-delta', id: textId, delta: text })
    writeEvent({ type: 'text-end', id: textId })
    writeEvent({ type: 'finish', finishReason: 'stop' })
  }

  const controller = new AbortController()
  res.on('close', () => controller.abort())

  try {
    // 1. 待办类请求：直接调用待办 tool；这里暂时还不是大模型识别的
    if (TODO_INTENT_PATTERN.test(userText)) {
      const result = await queryTodosTool()
      finishWithText(result)
      res.end()
      return
    }

    // 2. 问题识别 + 路由（由 ain-agent-sdk 的 routeUserMessage 完成）
    let workflow: string = CHAT_WORKFLOW_NAME
    let workflowInput: string = userText
    try {
      const decision = await routeUserMessage(userText) // 这里是大模型识别的，识别出用户意图，然后路由到对应的子agent
      workflow = decision.workflow
      workflowInput = decision.input?.userInput ?? userText
    } catch (error) {
      console.error('[chatAgent] 路由失败，降级为普通聊天', error)
    }

    // 工具调用
    if (workflow === REMOTE_CONTROL_WORKFLOW_NAME) {
      // const result = await queryTodosTool()
      // finishWithText(result)
      // res.end()
      // return
    }

    // 3. 营销方案：路由到 ain-agent-sdk 的 marketingAgent
    if (workflow === MARKETING_AGENT_WORKFLOW_NAME) {
      const startedAt = Date.now()
      const result = await runMarketingAgent(workflowInput, {
        interactive: false,
        writeToLark: false,
      })
      console.log('[chatAgent] marketingAgent 完成', {
        elapsedMs: Date.now() - startedAt,
      })
      finishWithText(result)
      res.end()
      return
    }

    // 4. 普通问答：deepseek_chat_llm 流式回答
    const langchainMessages = toLangchainMessages(messages)
    writeEvent({ type: 'text-start', id: textId })
    const stream = await deepseek_chat_llm.stream(langchainMessages, { // 这里是大模型流式回答的
      signal: controller.signal,
    })
    for await (const chunk of stream) {
      const text = chunkText(chunk)
      if (text) {
        writeEvent({ type: 'text-delta', id: textId, delta: text })
      }
    }
    writeEvent({ type: 'text-end', id: textId })
    writeEvent({ type: 'finish', finishReason: 'stop' })
    res.end()
  } catch (error) {
    if (!res.writableEnded) {
      writeEvent({
        type: 'error',
        errorText: error instanceof Error ? error.message : String(error),
      })
    }
    res.end()
  }
})

export default router
