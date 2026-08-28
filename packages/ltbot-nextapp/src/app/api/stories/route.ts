import { prisma } from '@/lib/prisma'
import {
  successResponse,
  createdResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response'
import { createOperationEvent, OPERATION_EVENT_TYPES } from '@/lib/operation-event'
import { ThemeType } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'

/**
 * GET /api/stories
 * 获取故事列表（支持分页和筛选）
 * 查询参数：
 * - userId: 用户ID（可选）
 * - page: 页码，默认1
 * - pageSize: 每页数量，默认10
 * - ageGroup: 年龄组筛选（可选）
 * - themeType: 主题类型筛选（可选）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const ageGroup = searchParams.get('ageGroup')
    const themeType = searchParams.get('themeType')

    // 构建查询条件
    const where: any = {}
    if (userId) {
      where.userId = userId as string
    }
    if (ageGroup) {
      where.ageGroup = ageGroup
    }
    if (themeType) {
      where.themeType = themeType as ThemeType
    }

    // 计算分页
    const skip = (page - 1) * pageSize
    const take = pageSize

    // 查询故事列表和总数
    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              favorites: true,
              comments: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.story.count({ where }),
    ])

    return successResponse(
      {
        stories,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      '获取故事列表成功'
    )
  } catch (error) {
    console.error('获取故事列表时出错:', error)
    return errorResponse('获取故事列表失败', 500, error)
  }
}

/**
 * POST /api/stories
 * 创建新故事
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse('请先登录', 401);
    }

    const body = await request.json()

    // 验证必需字段
    if (!body.ageGroup) {
      return badRequestResponse('年龄组为必填项')
    }
    if (!body.themeType) {
      return badRequestResponse('主题类型为必填项')
    }
    if (!body.wordLimit) {
      return badRequestResponse('字数限制为必填项')
    }
    if (!body.characterSettings) {
      return badRequestResponse('人物设定为必填项')
    }

    // 验证主题类型
    if (body.themeType === ThemeType.CLASSIC) {
      if (!body.classicTheme) {
        return badRequestResponse('经典主题为必填项')
      }
    } else if (body.themeType === ThemeType.CUSTOM) {
      if (!body.customTheme) {
        return badRequestResponse('自定义主题为必填项')
      }
    } else {
      return badRequestResponse('主题类型不正确')
    }

    // 创建故事
    const story = await prisma.story.create({
      data: {
        userId,
        ageGroup: body.ageGroup,
        themeType: body.themeType,
        classicTheme: body.classicTheme || null,
        classicSubTheme: body.classicSubTheme || null,
        customTheme: body.customTheme || null,
        characterSettings: body.characterSettings,
        wordLimit: parseInt(body.wordLimit),
        content: body.content || null,
        extData: body.extData || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    createOperationEvent({
      eventType: OPERATION_EVENT_TYPES.STORY_CREATE,
      userId: story.userId,
      storyId: story.id,
      metadata: {
        themeType: story.themeType,
        ageGroup: story.ageGroup,
      },
    }).catch((eventError) => {
      console.error('写入 story_create 埋点失败:', eventError)
    })

    return createdResponse(story, '创建故事成功')
  } catch (error: any) {
    console.error('创建故事时出错:', error)
    return errorResponse('创建故事失败', 500, error)
  }
}

