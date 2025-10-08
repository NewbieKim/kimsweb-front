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
