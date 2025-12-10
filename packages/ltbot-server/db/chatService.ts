import { createClient } from 'redis'
import type { ChatSession, ChatMessage } from '../types.js'

/**
 * Chat Service - Redis 聊天数据服务
 * 
 * 数据结构设计：
 * 1. chat:user:{userId}:sessions (ZSET) - 用户的会话列表，按时间排序
 * 2. chat:session:{userId}:{sessionId} (Hash) - 会话元数据
 * 3. chat:messages:{userId}:{sessionId} (List) - 会话的消息列表
 */
class ChatService {
  private client: ReturnType<typeof createClient>

  constructor(redisClient: ReturnType<typeof createClient>) {
    this.client = redisClient
  }

  /**
   * 获取用户的会话列表
   * @param userId 用户ID
   * @param page 页码（从1开始）
   * @param limit 每页数量
   * @param sortBy 排序方式：desc（最新优先）/ asc（最早优先）
   */
  async getUserSessions(
    userId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'asc' | 'desc' = 'desc'
  ): Promise<{ sessions: ChatSession[], total: number }> {
    const key = `chat:user:${userId}:sessions`
    
    // 获取总数
    const total = await this.client.zCard(key)
    
    // 计算分页
    const start = (page - 1) * limit
    const end = start + limit - 1
    
    // 获取会话ID列表（带分数/时间戳）
    const sessionIds = sortBy === 'desc'
      ? await this.client.zRangeWithScores(key, start, end, { REV: true })
      : await this.client.zRangeWithScores(key, start, end)
    
    // 批量获取会话详情
    const sessions: ChatSession[] = []
    for (const item of sessionIds) {
      const sessionId = item.value
      const session = await this.getSessionMetadata(userId, sessionId)
      if (session) {
        sessions.push(session)
      }
    }
    
    return { sessions, total }
  }

  /**
   * 创建新会话
   * @param userId 用户ID
   * @param title 会话标题
   * @param firstMessage 第一条消息（可选）
   */
  async createSession(
    userId: string,
    title?: string,
    firstMessage?: string
  ): Promise<ChatSession> {
    const timestamp = Math.floor(Date.now() / 1000)
    const sessionId = `chat-${timestamp}`
    const now = new Date().toISOString()
    
    const session: ChatSession = {
      id: sessionId,
      userId,
      title: title || '新对话',
      lastMessage: firstMessage || '',
      timestamp,
      createdAt: now,
      updatedAt: now,
      messageCount: 0
    }
    
    // 1. 添加到用户会话列表（ZSET）
    // zAdd: 添加一个或多个成员到有序集合，或者更新已存在成员的分数
    await this.client.zAdd(`chat:user:${userId}:sessions`, {
      score: timestamp,
      value: sessionId
    })
    
    // 2. 保存会话：会话元数据（Hash）
    await this.saveSessionMetadata(userId, sessionId, session)
    
    return session
  }

  /**
   * 获取会话元数据
   * @param userId 用户ID
   * @param sessionId 会话ID
   */
  async getSessionMetadata(userId: string, sessionId: string): Promise<ChatSession | null> {
    const key = `chat:session:${userId}:${sessionId}`
    const data = await this.client.hGetAll(key)
    
    if (!data || Object.keys(data).length === 0) {
      return null
    }
    
    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      lastMessage: data.lastMessage,
      timestamp: parseInt(data.timestamp),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      messageCount: parseInt(data.messageCount || '0')
    }
  }

  /**
   * 保存会话元数据
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param session 会话数据
   */
  async saveSessionMetadata(
    userId: string,
    sessionId: string,
    session: ChatSession
  ): Promise<void> {
    const key = `chat:session:${userId}:${sessionId}`
    // hSet: 设置哈希表字段的值
    await this.client.hSet(key, {
      id: session.id,
      userId: session.userId,
      title: session.title,
      lastMessage: session.lastMessage,
      timestamp: session.timestamp.toString(),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messageCount.toString()
    })
    
    // 设置 30 天过期
    await this.client.expire(key, 30 * 24 * 60 * 60)
  }

  /**
   * 更新会话信息
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param updates 要更新的字段
   */
  async updateSession(
    userId: string,
    sessionId: string,
    updates: Partial<Pick<ChatSession, 'title' | 'lastMessage'>>
  ): Promise<ChatSession | null> {
    const session = await this.getSessionMetadata(userId, sessionId)
    if (!session) {
      return null
    }
    
    // 更新字段
    if (updates.title !== undefined) {
      session.title = updates.title
    }
    if (updates.lastMessage !== undefined) {
      session.lastMessage = updates.lastMessage
    }
    session.updatedAt = new Date().toISOString()
    
    // 保存
    await this.saveSessionMetadata(userId, sessionId, session)
    
    return session
  }

  /**
   * 删除会话
   * @param userId 用户ID
   * @param sessionId 会话ID
   */
  async deleteSession(userId: string, sessionId: string): Promise<{ deletedMessages: number }> {
    const sessionKey = `chat:session:${userId}:${sessionId}`
    const messagesKey = `chat:messages:${userId}:${sessionId}`
    const userSessionsKey = `chat:user:${userId}:sessions`
    
    // 获取消息数量
    const messageCount = await this.client.lLen(messagesKey)
    
    // 删除会话元数据
    await this.client.del(sessionKey)
    
    // 删除消息列表
    await this.client.del(messagesKey)
    
    // 从用户会话列表中移除
    await this.client.zRem(userSessionsKey, sessionId)
    
    return { deletedMessages: messageCount }
  }

  /**
   * 批量删除会话
   * @param userId 用户ID
   * @param sessionIds 会话ID数组
   */
  async batchDeleteSessions(
    userId: string,
    sessionIds: string[]
  ): Promise<{ deletedCount: number, failedCount: number }> {
    let deletedCount = 0
    let failedCount = 0
    
    for (const sessionId of sessionIds) {
      try {
        await this.deleteSession(userId, sessionId)
        deletedCount++
      } catch (error) {
        console.error(`删除会话 ${sessionId} 失败:`, error)
        failedCount++
      }
    }
    
    return { deletedCount, failedCount }
  }

  /**
   * 保存消息到会话
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param messages 消息数组（正序）
   */
  async saveMessages(
    userId: string,
    sessionId: string,
    messages: ChatMessage[]
  ): Promise<{ savedCount: number, totalMessages: number }> {
    if (messages.length === 0) {
      // lLen: 获取列表的长度
      const totalMessages = await this.client.lLen(`chat:messages:${userId}:${sessionId}`)
      return { savedCount: 0, totalMessages }
    }
    
    const messagesKey = `chat:messages:${userId}:${sessionId}`
    
    // 将消息序列化为 JSON 字符串并追加到 List
    const messageStrings = messages.map(msg => JSON.stringify(msg))
    // rPush: 将一个或多个值插入到列表的末尾（最右边）
    await this.client.rPush(messagesKey, messageStrings)
    
    // 设置 30 天过期
    await this.client.expire(messagesKey, 30 * 24 * 60 * 60)
    
    // 获取总消息数
    const totalMessages = await this.client.lLen(messagesKey)
    
    // 更新会话元数据
    const session = await this.getSessionMetadata(userId, sessionId)
    if (session) {
      session.messageCount = totalMessages
      session.updatedAt = new Date().toISOString()
      
      // 更新最后一条消息（取最新的用户或助手消息）
      const lastUserOrAssistantMsg = messages.reverse().find(
        msg => msg.role === 'user' || msg.role === 'assistant'
      )
      if (lastUserOrAssistantMsg) {
        session.lastMessage = lastUserOrAssistantMsg.content.substring(0, 100)
      }
      
      await this.saveSessionMetadata(userId, sessionId, session)
    }
    
    return { savedCount: messages.length, totalMessages }
  }

  /**
   * 获取会话的所有消息
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param start 起始位置（默认0，表示从头开始）
   * @param end 结束位置（默认-1，表示到末尾）
   */
  async getMessages(
    userId: string,
    sessionId: string,
    start: number = 0,
    end: number = -1
  ): Promise<ChatMessage[]> {
    const messagesKey = `chat:messages:${userId}:${sessionId}`
    const messageStrings = await this.client.lRange(messagesKey, start, end)
    
    return messageStrings.map(str => JSON.parse(str))
  }

  /**
   * 获取会话详情（包含所有消息）
   * @param userId 用户ID
   * @param sessionId 会话ID
   */
  async getSessionDetail(userId: string, sessionId: string): Promise<{
    session: ChatSession | null
    messages: ChatMessage[]
  }> {
    const session = await this.getSessionMetadata(userId, sessionId)
    const messages = session ? await this.getMessages(userId, sessionId) : []
    
    return { session, messages }
  }

  /**
   * 检查会话是否属于用户
   * @param userId 用户ID
   * @param sessionId 会话ID
   */
  async isSessionOwner(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.getSessionMetadata(userId, sessionId)
    return session !== null && session.userId === userId
  }
}

// 导出单例（使用全局 Redis 客户端）
let chatServiceInstance: ChatService | null = null

export const initChatService = (redisClient: ReturnType<typeof createClient>) => {
  chatServiceInstance = new ChatService(redisClient)
  return chatServiceInstance
}

export const getChatService = (): ChatService => {
  if (!chatServiceInstance) {
    throw new Error('ChatService 未初始化，请先调用 initChatService()')
  }
  return chatServiceInstance
}

export default ChatService

