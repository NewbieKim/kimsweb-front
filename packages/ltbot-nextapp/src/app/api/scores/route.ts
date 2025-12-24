import { prisma } from '@/lib/prisma'
import {
  successResponse,
  createdResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response'
import { TransactionType } from '@prisma/client'

/**
 * GET /api/scores
 * 查询用户积分信息和交易记录
 * 查询参数：
 * - userId: 用户ID（必需）
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认20
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    if (!userId) {
      return badRequestResponse('用户ID为必填项')
    }

    const parsedUserId = parseInt(userId)

    if (isNaN(parsedUserId)) {
      return badRequestResponse('用户ID无效')
    }

    // 获取用户积分余额
    const userScore = await prisma.userScore.findUnique({
      where: { userId: parsedUserId },
    })

    // 计算分页
    const skip = (page - 1) * pageSize
    const take = pageSize

    // 查询交易记录和总数
    const [transactions, total] = await Promise.all([
      prisma.scoreTransaction.findMany({
        where: { userId: parsedUserId },
        include: {
          story: {
            select: {
              id: true,
              ageGroup: true,
              themeType: true,
            },
          },
          music: {
            select: {
              id: true,
              musicStyle: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.scoreTransaction.count({
        where: { userId: parsedUserId },
      }),
    ])

    return successResponse(
      {
        balance: userScore?.balance || 0,
        transactions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      '获取积分信息成功'
    )
  } catch (error) {
    console.error('获取积分信息时出错:', error)
    return errorResponse('获取积分信息失败', 500, error)
  }
}

