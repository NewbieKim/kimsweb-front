import type { ChatSession, ChatMessage, SessionListResponse, SessionDetailResponse } from '../types'

// API 基础 URL 配置
const LOCALURL = 'http://localhost:6688/api'
const PRODURL = 'http://ltbot.top/api' // 生产环境地址
const API_BASE_URL = process.env.NODE_ENV === 'production' ? PRODURL : LOCALURL

// Chat API 端点
export const chatApi = {
  sessions: `${API_BASE_URL}/chat/sessions`,
  sessionDetail: (sessionId: string) => `${API_BASE_URL}/chat/sessions/${sessionId}`,
  sessionMessages: (sessionId: string) => `${API_BASE_URL}/chat/sessions/${sessionId}/messages`,
  batchDelete: `${API_BASE_URL}/chat/sessions/batch-delete`
}

/**
 * 获取会话列表
 */
export async function getChatSessions(params?: {
  page?: number
  limit?: number
  sortBy?: 'asc' | 'desc'
}): Promise<SessionListResponse> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy)

  const url = queryParams.toString() 
    ? `${chatApi.sessions}?${queryParams.toString()}`
    : chatApi.sessions

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // TODO: 添加用户认证 header
      // 'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

/**
 * 创建新会话
 */
export async function createChatSession(data: {
  title?: string
  firstMessage?: string
}): Promise<ChatSession> {
  const response = await fetch(chatApi.sessions, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

/**
 * 获取会话详情（包含所有消息）
 */
export async function getChatSessionDetail(sessionId: string): Promise<SessionDetailResponse> {
  const response = await fetch(chatApi.sessionDetail(sessionId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

/**
 * 保存消息
 */
export async function saveChatMessages(
  sessionId: string,
  messages: ChatMessage[]
): Promise<{ savedCount: number; totalMessages: number; updatedAt: string }> {
  const response = await fetch(chatApi.sessionMessages(sessionId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ messages })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

/**
 * 更新会话信息
 */
export async function updateChatSession(
  sessionId: string,
  data: {
    title?: string
    lastMessage?: string
  }
): Promise<ChatSession> {
  const response = await fetch(chatApi.sessionDetail(sessionId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

/**
 * 删除会话
 */
export async function deleteChatSession(sessionId: string): Promise<{
  deletedSessionId: string
  deletedMessages: number
}> {
  const response = await fetch(chatApi.sessionDetail(sessionId), {
    method: 'DELETE',
    credentials: 'include'
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

/**
 * 批量删除会话
 */
export async function batchDeleteChatSessions(sessionIds: string[]): Promise<{
  deletedCount: number
  failedCount: number
}> {
  const response = await fetch(chatApi.batchDelete, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ sessionIds })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

