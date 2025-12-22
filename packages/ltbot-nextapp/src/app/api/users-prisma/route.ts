import { prisma } from '@/lib/prisma'
import {
  successResponse,
  createdResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response'
import { User } from '@/types/response'

/**
 * GET /api/users-prisma
 * 获取所有用户列表
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        posts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse<User[]>(users, '获取用户列表成功')
  } catch (error) {
    console.error('获取用户时出错:', error)
    return errorResponse('获取用户列表失败', 500, error)
  }
}

/**
 * POST /api/users-prisma
 * 创建新用户
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 验证必需字段
    if (!body.name || !body.email) {
      return badRequestResponse('姓名和邮箱为必填项')
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return badRequestResponse('邮箱格式不正确')
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      return badRequestResponse('该邮箱已被注册')
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        age: body.age ? parseInt(body.age) : null,
      },
    })

    return createdResponse<User>(user, '创建用户成功')
  } catch (error: any) {
    console.error('创建用户时出错:', error)
    
    // 处理唯一约束错误
    if (error.code === 'P2002') {
      return badRequestResponse('该邮箱已被注册')
    }

    return errorResponse('创建用户失败', 500, error)
  }
}