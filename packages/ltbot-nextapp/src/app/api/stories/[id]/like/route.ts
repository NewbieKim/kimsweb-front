import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/stories/[id]/like
 * 点赞故事
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return errorResponse('请先登录', 401);
    }

    const { id } = await params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return badRequestResponse('故事ID无效');
    }

    // 检查故事是否存在
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return errorResponse('故事不存在', 404);
    }

    // 检查是否已经点赞
    const existingLike = await prisma.storyLike.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existingLike) {
      return badRequestResponse('您已经点赞过这个故事');
    }

    // 创建点赞记录
    const like = await prisma.storyLike.create({
      data: {
        storyId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return successResponse(like, '点赞成功');
  } catch (error: any) {
    console.error('点赞失败:', error);
    return errorResponse('点赞失败', 500, error);
  }
}

/**
 * DELETE /api/stories/[id]/like
 * 取消点赞
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return errorResponse('请先登录', 401);
    }

    const { id } = await params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return badRequestResponse('故事ID无效');
    }

    // 检查是否已经点赞
    const existingLike = await prisma.storyLike.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (!existingLike) {
      return badRequestResponse('您还未点赞这个故事');
    }

    // 删除点赞记录
    await prisma.storyLike.delete({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    return successResponse(null, '取消点赞成功');
  } catch (error: any) {
    console.error('取消点赞失败:', error);
    return errorResponse('取消点赞失败', 500, error);
  }
}

/**
 * GET /api/stories/[id]/like
 * 获取点赞列表
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);

    if (isNaN(storyId)) {
      return badRequestResponse('故事ID无效');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const skip = (page - 1) * pageSize;

    // 查询点赞列表和总数
    const [likes, total] = await Promise.all([
      prisma.storyLike.findMany({
        where: { storyId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.storyLike.count({ where: { storyId } }),
    ]);

    return successResponse(
      {
        likes,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      '获取点赞列表成功'
    );
  } catch (error: any) {
    console.error('获取点赞列表失败:', error);
    return errorResponse('获取点赞列表失败', 500, error);
  }
}

