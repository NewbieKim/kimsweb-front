// 定义待办事项类型
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