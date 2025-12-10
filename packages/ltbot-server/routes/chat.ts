import express, { Router, Request, Response, NextFunction } from 'express'
import { getChatService } from '../db/chatService.js'
import type {
  CreateSessionRequest,
  SaveMessagesRequest,
  UpdateSessionRequest,
  SessionListResponse,
  SessionDetailResponse
} from '../types.js'

const router: Router = express.Router()

// ==================== 中间件 ====================

/**
 * 检查 Redis 连接状态
 */
const checkRedisConnection = (req: Request, res: Response, next: NextFunction) => {
  try {
    getChatService() // 会在未初始化时抛出错误
    next()
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: 'Chat 服务未初始化或 Redis 未连接',
      tip: '请启动 Redis 服务'
    })
  }
}

/**
 * 获取当前用户ID（简化版，实际应从 JWT Token 中解析）
 * TODO: 集成真实的用户认证系统
 */
const getUserId = (req: Request): string => {
  // 从 header 中获取（模拟）
  const userId = req.headers['x-user-id'] as string
  
  // 如果没有提供，使用默认测试用户
  if (!userId) {
    return 'test-user-001'
  }
  
  return userId
}

// 对所有 Chat 路由应用 Redis 连接检查
router.use(checkRedisConnection)

// ==================== API 路由 ====================

/**
 * 1. 获取会话列表
 * GET /api/chat/sessions?page=1&limit=20&sortBy=desc
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const sortBy = (req.query.sortBy as 'asc' | 'desc') || 'desc'
    
    const chatService = getChatService()
    const { sessions, total } = await chatService.getUserSessions(userId, page, limit, sortBy)
    
    const response: SessionListResponse = {
      total,
      page,
      limit,
      sessions
    }
    
    res.json({
      success: true,
      data: response,
      message: '获取会话列表成功'
    })
  } catch (error) {
    console.error('获取会话列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取会话列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

/**
 * 2. 创建新会话
 * POST /api/chat/sessions
 * Body: { title?: string, firstMessage?: string }
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { title, firstMessage } = req.body as CreateSessionRequest
    
    const chatService = getChatService()
    const session = await chatService.createSession(userId, title, firstMessage)
    
    res.status(201).json({
      success: true,
      data: session,
      message: '创建会话成功'
    })
  } catch (error) {
    console.error('创建会话失败:', error)
    res.status(500).json({
      success: false,
      message: '创建会话失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

/**
 * 3. 获取会话详情（包含所有消息）
 * GET /api/chat/sessions/:sessionId
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { sessionId } = req.params
    
    const chatService = getChatService()
    
    // 检查会话所有权
    const isOwner = await chatService.isSessionOwner(userId, sessionId)
    if (!isOwner) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或无权访问'
      })
    }
    
    const { session, messages } = await chatService.getSessionDetail(userId, sessionId)
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      })
    }
    
    const response: SessionDetailResponse = {
      session,
      messages
    }
    
    res.json({
      success: true,
      data: response,
      message: '获取会话详情成功'
    })
  } catch (error) {
    console.error('获取会话详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取会话详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

/**
 * 4. 保存消息到会话
 * POST /api/chat/sessions/:sessionId/messages
 * Body: { messages: ChatMessage[] }
 */
router.post('/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { sessionId } = req.params
    const { messages } = req.body as SaveMessagesRequest
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: '消息格式错误，需要 messages 数组'
      })
    }
    
    const chatService = getChatService()
    
    // 检查会话所有权
    const isOwner = await chatService.isSessionOwner(userId, sessionId)
    if (!isOwner) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或无权访问'
      })
    }
    
    const result = await chatService.saveMessages(userId, sessionId, messages)
    
    res.json({
      success: true,
      data: {
        savedCount: result.savedCount,
        totalMessages: result.totalMessages,
        updatedAt: new Date().toISOString()
      },
      message: '保存消息成功'
    })
  } catch (error) {
    console.error('保存消息失败:', error)
    res.status(500).json({
      success: false,
      message: '保存消息失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

/**
 * 5. 更新会话信息
 * PATCH /api/chat/sessions/:sessionId
 * Body: { title?: string, lastMessage?: string }
 */
router.patch('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { sessionId } = req.params
    const updates = req.body as UpdateSessionRequest
    
    const chatService = getChatService()
    
    // 检查会话所有权
    const isOwner = await chatService.isSessionOwner(userId, sessionId)
    if (!isOwner) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或无权访问'
      })
    }
    
    const session = await chatService.updateSession(userId, sessionId, updates)
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: '会话不存在'
      })
    }
    
    res.json({
      success: true,
      data: session,
      message: '更新会话成功'
    })
  } catch (error) {
    console.error('更新会话失败:', error)
    res.status(500).json({
      success: false,
      message: '更新会话失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

/**
 * 6. 删除会话
 * DELETE /api/chat/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { sessionId } = req.params
    
    const chatService = getChatService()
    
    // 检查会话所有权
    const isOwner = await chatService.isSessionOwner(userId, sessionId)
    if (!isOwner) {
      return res.status(404).json({
        success: false,
        message: '会话不存在或无权访问'
      })
    }
    
    const result = await chatService.deleteSession(userId, sessionId)
    
    res.json({
      success: true,
      data: {
        deletedSessionId: sessionId,
        deletedMessages: result.deletedMessages
      },
      message: '删除会话成功'
    })
  } catch (error) {
    console.error('删除会话失败:', error)
    res.status(500).json({
      success: false,
      message: '删除会话失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

/**
 * 7. 批量删除会话
 * POST /api/chat/sessions/batch-delete
 * Body: { sessionIds: string[] }
 */
router.post('/sessions/batch-delete', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req)
    const { sessionIds } = req.body
    
    if (!sessionIds || !Array.isArray(sessionIds)) {
      return res.status(400).json({
        success: false,
        message: '请求格式错误，需要 sessionIds 数组'
      })
    }
    
    const chatService = getChatService()
    const result = await chatService.batchDeleteSessions(userId, sessionIds)
    
    res.json({
      success: true,
      data: result,
      message: '批量删除完成'
    })
  } catch (error) {
    console.error('批量删除会话失败:', error)
    res.status(500).json({
      success: false,
      message: '批量删除会话失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// ==================== 测试路由 ====================

/**
 * 测试路由：获取当前用户ID
 * GET /api/chat/test/user-id
 */
router.get('/test/user-id', (req: Request, res: Response) => {
  const userId = getUserId(req)
  res.json({
    success: true,
    data: { userId },
    message: '当前用户ID（测试用）'
  })
})

export default router

