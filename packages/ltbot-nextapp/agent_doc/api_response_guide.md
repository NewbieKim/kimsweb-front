# API 统一响应格式指南

## 📋 统一响应格式

### 响应结构

```typescript
interface ApiResponse<T> {
  success: boolean;      // 是否成功
  code: number;          // 状态码
  message: string;       // 提示信息
  data?: T;              // 响应数据
  error?: string;        // 错误信息
  timestamp?: string;    // 时间戳
}
```

---

## ✅ 成功响应示例

### 获取用户列表（成功）

```json
{
  "success": true,
  "code": 200,
  "message": "获取用户列表成功",
  "data": [
    {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@qq.com",
      "age": 25,
      "createdAt": "2025-12-22T06:54:49.028Z",
      "updatedAt": "2025-12-22T06:54:49.028Z",
      "posts": []
    }
  ],
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

### 创建用户（成功）

```json
{
  "success": true,
  "code": 201,
  "message": "创建用户成功",
  "data": {
    "id": 2,
    "name": "李四",
    "email": "lisi@qq.com",
    "age": 30,
    "createdAt": "2025-12-22T10:30:00.000Z",
    "updatedAt": "2025-12-22T10:30:00.000Z"
  },
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

---

## ❌ 错误响应示例

### 参数错误（400）

```json
{
  "success": false,
  "code": 400,
  "message": "姓名和邮箱为必填项",
  "error": "姓名和邮箱为必填项",
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

### 邮箱已存在（400）

```json
{
  "success": false,
  "code": 400,
  "message": "该邮箱已被注册",
  "error": "该邮箱已被注册",
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

### 服务器错误（500）

```json
{
  "success": false,
  "code": 500,
  "message": "获取用户列表失败",
  "error": "Database connection error",
  "timestamp": "2025-12-22T10:30:00.000Z"
}
```

---

## 🔧 使用方法

### 1. API 路由中使用

```typescript
import { successResponse, errorResponse, createdResponse } from '@/lib/response'

// GET 请求
export async function GET() {
  try {
    const data = await prisma.user.findMany()
    return successResponse(data, '获取成功')
  } catch (error) {
    return errorResponse('获取失败', 500, error)
  }
}

// POST 请求
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // 参数验证
    if (!body.name) {
      return badRequestResponse('名称不能为空')
    }
    
    const data = await prisma.user.create({ data: body })
    return createdResponse(data, '创建成功')
  } catch (error) {
    return errorResponse('创建失败', 500, error)
  }
}
```

### 2. 服务端组件中使用

```typescript
async function fetchData() {
  try {
    const data = await prisma.user.findMany()
    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error.message,
    }
  }
}

export default async function MyPage() {
  const result = await fetchData()
  
  if (!result.success) {
    return <div>错误: {result.error}</div>
  }
  
  return <div>{/* 渲染数据 */}</div>
}
```

### 3. 客户端组件中使用

```typescript
"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import { ApiResponse, User } from '@/types/response'

export default function MyComponent() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get<ApiResponse<User[]>>('/api/users-prisma')
      
      if (response.data.success) {
        setUsers(response.data.data || [])
      } else {
        setError(response.data.error || '加载失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error}</div>

  return <div>{/* 渲染用户列表 */}</div>
}
```

---

## 📊 状态码说明

| 状态码 | 说明 | 使用场景 |
|--------|------|---------|
| 200 | 成功 | GET, PUT, DELETE 成功 |
| 201 | 创建成功 | POST 创建资源成功 |
| 400 | 参数错误 | 请求参数验证失败 |
| 401 | 未授权 | 需要登录 |
| 403 | 禁止访问 | 没有权限 |
| 404 | 未找到 | 资源不存在 |
| 500 | 服务器错误 | 服务器内部错误 |

---

## 🎯 响应工具函数

### successResponse - 成功响应

```typescript
successResponse<T>(
  data: T,
  message?: string,
  code?: number
)
```

**示例：**
```typescript
return successResponse(users, '获取用户成功')
```

### errorResponse - 错误响应

```typescript
errorResponse(
  message: string,
  code?: number,
  error?: any
)
```

**示例：**
```typescript
return errorResponse('操作失败', 500, error)
```

### createdResponse - 创建成功

```typescript
createdResponse<T>(
  data: T,
  message?: string
)
```

**示例：**
```typescript
return createdResponse(user, '创建用户成功')
```

### badRequestResponse - 参数错误

```typescript
badRequestResponse(message: string)
```

**示例：**
```typescript
return badRequestResponse('邮箱格式不正确')
```

### unauthorizedResponse - 未授权

```typescript
unauthorizedResponse(message?: string)
```

### forbiddenResponse - 禁止访问

```typescript
forbiddenResponse(message?: string)
```

### notFoundResponse - 未找到

```typescript
notFoundResponse(message?: string)
```

---

## 💡 最佳实践

### 1. 始终返回统一格式

```typescript
// ✅ 好的做法
return successResponse(data, '成功')

// ❌ 不好的做法
return NextResponse.json(data)
```

### 2. 提供有意义的错误信息

```typescript
// ✅ 好的做法
return badRequestResponse('邮箱格式不正确，请输入有效的邮箱地址')

// ❌ 不好的做法
return badRequestResponse('错误')
```

### 3. 记录详细的错误日志

```typescript
try {
  // ...
} catch (error) {
  console.error('详细错误:', error)
  return errorResponse('操作失败', 500, error)
}
```

### 4. 验证输入数据

```typescript
// 验证必填字段
if (!body.email) {
  return badRequestResponse('邮箱为必填项')
}

// 验证格式
if (!emailRegex.test(body.email)) {
  return badRequestResponse('邮箱格式不正确')
}

// 验证业务逻辑
const existing = await prisma.user.findUnique({ where: { email } })
if (existing) {
  return badRequestResponse('该邮箱已被注册')
}
```

### 5. 处理 Prisma 特定错误

```typescript
catch (error: any) {
  // Prisma 唯一约束错误
  if (error.code === 'P2002') {
    return badRequestResponse('该记录已存在')
  }
  
  // Prisma 外键约束错误
  if (error.code === 'P2003') {
    return badRequestResponse('关联的记录不存在')
  }
  
  // 其他错误
  return errorResponse('操作失败', 500, error)
}
```

---

## 🎉 总结

使用统一的响应格式可以：

✅ **提高代码可维护性** - 统一的结构易于理解和维护
✅ **改善前端体验** - 前端可以统一处理响应
✅ **便于调试** - 清晰的错误信息和时间戳
✅ **类型安全** - TypeScript 完整类型支持
✅ **符合规范** - RESTful API 最佳实践

现在你的 API 已经拥有了企业级的响应处理系统！🚀

