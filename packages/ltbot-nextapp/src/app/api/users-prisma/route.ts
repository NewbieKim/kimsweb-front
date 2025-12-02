import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users-prisma - 获取所有用户
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        posts: true
      }
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error('获取用户时出错:', error)
    return NextResponse.json(
      { error: '获取用户失败' }, 
      { status: 500 }
    )
  }
}

// POST /api/users-prisma - 创建新用户
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // 验证必需字段
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: '姓名和邮箱为必填项' }, 
        { status: 400 }
      )
    }
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        age: body.age ? parseInt(body.age) : undefined
      }
    })
    
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('创建用户时出错:', error)
    return NextResponse.json(
      { error: '创建用户失败' }, 
      { status: 500 }
    )
  }
}