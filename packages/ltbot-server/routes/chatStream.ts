import express, { Router, Request, Response } from 'express'

/**
 * POST /api/chat —— RemoteChat 的流式回复接口（AI SDK UI message stream 协议）。
 *
 * 与「非流式」接口的区别：
 * - 非流式：一次性等模型生成完整回复，再整体返回 JSON。实现简单、一次请求一次响应，
 *   但首字延迟 = 整段生成耗时，长回复时用户只能干等，且有超时/断连丢全部的风险。
 * - 流式（本接口）：服务端边生成边通过 SSE 推送 text-delta 增量，客户端逐字渲染。
 *   首字秒出、可随时中断，体验接近打字机；代价是需要 SSE 协议与增量解析。
 *
 * 请求体（来自 @ain-framework/remote-chat-sdk 的 createStreamingRuntime）：
 *   { messages: [{ id, role: 'user' | 'assistant', parts: [{ type: 'text', text }] }] }
 *
 * 响应：SSE 文本流，每行 data: <json>，事件格式对齐 AI SDK UI message stream：
 *   - text-start / text-delta / text-end：正文增量（SDK 归约为 text part）
 *   - reasoning-delta：思考过程增量（DeepSeek Reasoner 的 reasoning_content）
 *   - error：错误事件（SDK 归约为错误文本）
 *
 * 环境变量：
 *   DEEPSEEK_API_URL  （默认 https://api.deepseek.com/v1/chat/completions）
 *   DEEPSEEK_API_KEY  （必填，未配置时兜底读取 VITE_DEEPSEEK_API_KEY）
 *   DEEPSEEK_MODEL    （默认 deepseek-chat；可用 deepseek-reasoner 输出思考过程）
 *   DEEPSEEK_MAX_TOKENS / DEEPSEEK_TEMPERATURE
 */
const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || ''
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
const DEEPSEEK_MAX_TOKENS = parseInt(process.env.DEEPSEEK_MAX_TOKENS || '2048', 10)
const DEEPSEEK_TEMPERATURE = parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7')

const router: Router = express.Router()

/** SDK 消息（UIMessage：id + role + parts）的宽松结构 */
interface SdkChatMessage {
  id?: string
  role?: string
  parts?: Array<{ type?: string; text?: string }>
  content?: unknown
}

/** 提取一条 SDK 消息的纯文本（优先 parts 里的 text part） */
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

/** SDK 消息 -> OpenAI 兼容的 messages（只保留 user/assistant 且有文本的） */
function toOpenAiMessages(messages: SdkChatMessage[]) {
  const result: Array<{ role: 'user' | 'assistant'; content: string }> = []
  for (const message of messages) {
    if (message.role !== 'user' && message.role !== 'assistant') continue
    const content = extractText(message)
    if (!content) continue
    result.push({ role: message.role, content })
  }
  return result
}

router.post('/', async (req: Request, res: Response) => {
  const { messages } = req.body ?? {}
  if (!Array.isArray(messages)) {
    res.status(400).json({ message: '请求体需要 messages 数组' })
    return
  }
  if (!DEEPSEEK_API_KEY) {
    res.status(500).json({
      message: '服务端未配置 DEEPSEEK_API_KEY，请在 ltbot-server/.env 中设置',
    })
    return
  }

  const openAiMessages = toOpenAiMessages(messages)
  if (openAiMessages.length === 0) {
    res.status(400).json({ message: '没有可发送的文本消息' })
    return
  }

  // 先写响应头，让客户端立即进入流式接收状态
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // 关闭 Nginx 缓冲，保证增量即时下发
  })

  const textId = `text-${Date.now()}`
  const writeEvent = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  writeEvent({ type: 'text-start', id: textId })

  const controller = new AbortController()
  // 客户端断开时中止上游请求，避免泄漏
  res.on('close', () => controller.abort())

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: openAiMessages,
        stream: true,
        max_tokens: DEEPSEEK_MAX_TOKENS,
        temperature: DEEPSEEK_TEMPERATURE,
      }),
      signal: controller.signal,
    })

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => '')
      writeEvent({
        type: 'error',
        errorText: `DeepSeek API ${response.status}: ${detail.slice(0, 200)}`,
      })
      res.end()
      return
    }

    // 逐块读取 DeepSeek 的 SSE 流，转发为 AI SDK UI message stream 事件
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          const chunk = JSON.parse(data)
          const delta = chunk?.choices?.[0]?.delta ?? {}
          if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) {
            writeEvent({ type: 'reasoning-delta', id: textId, delta: delta.reasoning_content })
          }
          if (typeof delta.content === 'string' && delta.content) {
            writeEvent({ type: 'text-delta', id: textId, delta: delta.content })
          }
        } catch {
          // 忽略无法解析的片段，保持流不中断
        }
      }
    }

    writeEvent({ type: 'text-end', id: textId })
    writeEvent({ type: 'finish', finishReason: 'stop' })
  } catch (error) {
    if (!res.writableEnded) {
      writeEvent({
        type: 'error',
        errorText: error instanceof Error ? error.message : String(error),
      })
    }
  } finally {
    res.end()
  }
})

export default router
