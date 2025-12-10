// 用户类型
export interface User {
  id: number
  username: string
  avatar?: string
}

// 商品类型
export interface Product {
  id: number
  name: string
  price: number
  description: string
  image: string
  category: string
  stock: number
  status: 'on' | 'off' // on: 上架, off: 下架
  createdAt: string
  updatedAt: string
}

// 登录表单类型
export interface LoginForm {
  username: string
  password: string
}

// 商品表单类型
export interface ProductForm {
  name: string
  price: number
  description: string
  image: string
  category: string
  stock: number
  status: 'on' | 'off'
}

// 代办类型
export interface Agency {
  id: number
  title: string
  description: string
  status: 'pending' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  dueDate?: string
}

// 代办表单类型
export interface AgencyForm {
  title: string
  description: string
  status: 'pending' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
}

// ==================== Chat 相关类型 ====================

// 聊天消息类型
export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  avatar: string
  name: string
  datetime: string
  reasoning?: string      // 思考过程（深度思考模式）
  tool_calls?: any[]      // 工具调用信息
  tool_call_id?: string   // 工具响应ID
}

// 聊天会话类型
export interface ChatSession {
  id: string              // 会话ID，格式：chat-timestamp
  userId: string          // 用户ID
  title: string           // 会话标题
  lastMessage: string     // 最后一条消息
  timestamp: number       // 时间戳（秒）
  createdAt: string       // 创建时间 ISO
  updatedAt: string       // 更新时间 ISO
  messageCount: number    // 消息数量
}

// 创建会话请求
export interface CreateSessionRequest {
  title?: string          // 可选，不传则自动生成
  firstMessage?: string   // 可选，第一条消息
}

// 保存消息请求
export interface SaveMessagesRequest {
  messages: ChatMessage[]
}

// 更新会话请求
export interface UpdateSessionRequest {
  title?: string
  lastMessage?: string
}

// 会话列表响应
export interface SessionListResponse {
  total: number
  page: number
  limit: number
  sessions: ChatSession[]
}

// 会话详情响应
export interface SessionDetailResponse {
  session: ChatSession
  messages: ChatMessage[]
}