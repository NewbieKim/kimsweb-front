import { defineStore } from 'pinia'
import type { ChatSession, ChatMessage } from '@/types'
import {
  getChatSessions,
  createChatSession,
  getChatSessionDetail,
  saveChatMessages,
  updateChatSession,
  deleteChatSession,
  batchDeleteChatSessions
} from '@/api/chat'

interface ChatState {
  // 会话列表
  sessions: ChatSession[]
  // 当前会话 ID
  currentSessionId: string | null
  // 当前会话的消息列表（倒序：最新的在前）
  currentMessages: ChatMessage[]
  // 加载状态
  loading: boolean
  // 错误信息
  error: string | null
  // 分页信息
  pagination: {
    total: number
    page: number
    limit: number
  }
}

/**
 * Chat Store - 聊天会话管理
 * 
 * 功能：
 * - 会话列表管理（创建、查询、更新、删除）
 * - 消息管理（保存、加载）
 * - 会话切换
 * - 按时间分组（今天、昨天、7天内）
 */
export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    sessions: [],
    currentSessionId: null,
    currentMessages: [],
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 20
    }
  }),

  getters: {
    /**
     * 当前会话信息
     */
    currentSession(): ChatSession | null {
      if (!this.currentSessionId) return null
      return this.sessions.find(s => s.id === this.currentSessionId) || null
    },

    /**
     * 按时间分组：今天
     */
    todayChats(): ChatSession[] {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = today.getTime() / 1000

      return this.sessions.filter(chat => {
        return chat.timestamp >= todayTimestamp
      })
    },

    /**
     * 按时间分组：昨天
     */
    yesterdayChats(): ChatSession[] {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = today.getTime() / 1000

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayTimestamp = yesterday.getTime() / 1000

      return this.sessions.filter(chat => {
        return chat.timestamp >= yesterdayTimestamp && chat.timestamp < todayTimestamp
      })
    },

    /**
     * 按时间分组：历史对话
     */
    olderChats(): ChatSession[] {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(23, 59, 59, 999)
      const yesterdayTimestamp = yesterday.getTime() / 1000

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoTimestamp = sevenDaysAgo.getTime() / 1000

      return this.sessions.filter(chat => {
        return chat.timestamp < yesterdayTimestamp && chat.timestamp >= sevenDaysAgoTimestamp
      })
    }
  },

  actions: {
    /**
     * 加载会话列表
     */
    async fetchSessions(page = 1, limit = 20) {
      this.loading = true
      this.error = null
      
      try {
        const response = await getChatSessions({ page, limit, sortBy: 'desc' })
        
        this.sessions = response.sessions
        this.pagination = {
          total: response.total,
          page: response.page,
          limit: response.limit
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        console.error('加载会话列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 创建新会话
     */
    async createSession(title?: string, firstMessage?: string) {
      this.loading = true
      this.error = null
      
      try {
        const newSession = await createChatSession({ title, firstMessage })
        
        // 添加到列表开头
        this.sessions.unshift(newSession)
        this.pagination.total += 1
        
        // 切换到新会话
        this.currentSessionId = newSession.id
        this.currentMessages = []
        
        return newSession
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        console.error('创建会话失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 加载会话详情
     */
    async loadSessionDetail(sessionId: string) {
      this.loading = true
      this.error = null
      
      try {
        const response = await getChatSessionDetail(sessionId)
        
        // 更新当前会话 ID
        this.currentSessionId = sessionId
        
        // 更新消息列表（注意：从后端获取的是正序，需要转为倒序）
        this.currentMessages = response.messages.reverse()
        
        // 更新会话列表中的会话信息（如果存在）
        const index = this.sessions.findIndex(s => s.id === sessionId)
        if (index !== -1) {
          this.sessions[index] = response.session
        } else {
          // 如果列表中不存在，添加到开头
          this.sessions.unshift(response.session)
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        console.error('加载会话详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 保存消息到数据库
     */
    async saveMessages(sessionId: string, messages: ChatMessage[]) {
      this.error = null
      
      try {
        // 消息需要转为正序保存
        const messagesToSave = [...messages].reverse()
        
        const result = await saveChatMessages(sessionId, messagesToSave)
        
        // 更新会话的最后消息和更新时间
        const index = this.sessions.findIndex(s => s.id === sessionId)
        if (index !== -1) {
          const lastMessage = messages[0] // 倒序数组的第一条是最新的
          this.sessions[index].lastMessage = lastMessage.content.substring(0, 100)
          this.sessions[index].updatedAt = result.updatedAt
          this.sessions[index].messageCount = result.totalMessages
        }
        
        return result
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        console.error('保存消息失败:', error)
        throw error
      }
    },

    /**
     * 更新会话标题
     */
    async updateSessionTitle(sessionId: string, title: string) {
      this.error = null
      
      try {
        const updatedSession = await updateChatSession(sessionId, { title })
        
        const index = this.sessions.findIndex(s => s.id === sessionId)
        if (index !== -1) {
          this.sessions[index] = updatedSession
        }
        
        return updatedSession
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        console.error('更新会话标题失败:', error)
        throw error
      }
    },

    /**
     * 删除会话
     */
    async deleteSession(sessionId: string) {
      this.loading = true
      this.error = null
      
      try {
        await deleteChatSession(sessionId)
        
        // 从列表中移除
        const index = this.sessions.findIndex(s => s.id === sessionId)
        if (index !== -1) {
          this.sessions.splice(index, 1)
          this.pagination.total -= 1
        }
        
        // 如果删除的是当前会话，清空当前状态
        if (this.currentSessionId === sessionId) {
          this.currentSessionId = null
          this.currentMessages = []
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        console.error('删除会话失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 批量删除会话
     */
    async batchDelete(sessionIds: string[]) {
      this.loading = true
      this.error = null
      
      try {
        const result = await batchDeleteChatSessions(sessionIds)
        
        // 从列表中批量移除
        this.sessions = this.sessions.filter(s => !sessionIds.includes(s.id))
        this.pagination.total -= result.deletedCount
        
        // 如果当前会话被删除，清空当前状态
        if (this.currentSessionId && sessionIds.includes(this.currentSessionId)) {
          this.currentSessionId = null
          this.currentMessages = []
        }
        
        return result
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error'
        console.error('批量删除会话失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 清空当前会话
     */
    clearCurrentSession() {
      this.currentSessionId = null
      this.currentMessages = []
    },

    /**
     * 重置 Store 状态
     */
    resetState() {
      this.sessions = []
      this.currentSessionId = null
      this.currentMessages = []
      this.loading = false
      this.error = null
      this.pagination = {
        total: 0,
        page: 1,
        limit: 20
      }
    }
  }
})

