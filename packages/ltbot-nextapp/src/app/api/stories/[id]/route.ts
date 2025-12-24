import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response'
import { ThemeType } from '@prisma/client'

/**
 * GET /api/stories/[id]
 * 获取故事详情
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);
    if (isNaN(storyId)) {
      return badRequestResponse('故事ID无效')
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        scoreTransactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!story) {
      return errorResponse('故事不存在', 404)
    }

    return successResponse(story, '获取故事详情成功')
  } catch (error) {
    console.error('获取故事详情时出错:', error)
    return errorResponse('获取故事详情失败', 500, error)
  }
}

/**
 * PUT /api/stories/[id]
 * 更新故事
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);
    const body = await request.json()

    if (isNaN(storyId)) {
      return badRequestResponse('故事ID无效')
    }

    // 检查故事是否存在
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId },
    })

    if (!existingStory) {
      return errorResponse('故事不存在', 404)
    }

    // 构建更新数据
    const updateData: any = {}

    if (body.ageGroup !== undefined) {
      updateData.ageGroup = body.ageGroup
    }
    if (body.themeType !== undefined) {
      // 验证主题类型
      if (
        body.themeType !== ThemeType.CLASSIC &&
        body.themeType !== ThemeType.CUSTOM
      ) {
        return badRequestResponse('主题类型不正确')
      }
      updateData.themeType = body.themeType
    }
    if (body.classicTheme !== undefined) {
      updateData.classicTheme = body.classicTheme
    }
    if (body.classicSubTheme !== undefined) {
      updateData.classicSubTheme = body.classicSubTheme
    }
    if (body.customTheme !== undefined) {
      updateData.customTheme = body.customTheme
    }
    if (body.characterSettings !== undefined) {
      updateData.characterSettings = body.characterSettings
    }
    if (body.wordLimit !== undefined) {
      updateData.wordLimit = parseInt(body.wordLimit)
    }
    if (body.content !== undefined) {
      updateData.content = body.content
    }
    if (body.extData !== undefined) {
      updateData.extData = body.extData
    }

    // 更新故事
    const story = await prisma.story.update({
      where: { id: storyId },
      data: updateData,
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

    return successResponse(story, '更新故事成功')
  } catch (error: any) {
    console.error('更新故事时出错:', error)
    return errorResponse('更新故事失败', 500, error)
  }
}

/**
 * DELETE /api/stories/[id]
 * 删除故事
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return badRequestResponse('故事ID无效')
    }

    // 检查故事是否存在
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId },
    })

    if (!existingStory) {
      return errorResponse('故事不存在', 404)
    }

    // 删除故事（注意：相关的积分交易记录会因为外键关系而保留，只是storyId变为null）
    await prisma.story.delete({
      where: { id: storyId },
    })

    return successResponse(null, '删除故事成功')
  } catch (error: any) {
    console.error('删除故事时出错:', error)
    return errorResponse('删除故事失败', 500, error)
  }
}

