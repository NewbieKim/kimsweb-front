import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/stories/[id]/favorite
 * 收藏故事
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

    // 检查是否已经收藏
    const existingFavorite = await prisma.storyFavorite.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existingFavorite) {
      return badRequestResponse('您已经收藏过这个故事');
    }

    // 创建收藏记录
    const favorite = await prisma.storyFavorite.create({
      data: {
        storyId,
        userId,
      },
      include: {
        story: {
          select: {
            id: true,
            ageGroup: true,
            themeType: true,
            classicTheme: true,
            customTheme: true,
            coverImage: true,
          },
        },
      },
    });

    return successResponse(favorite, '收藏成功');
  } catch (error: any) {
    console.error('收藏失败:', error);
    return errorResponse('收藏失败', 500, error);
  }
}

/**
 * DELETE /api/stories/[id]/favorite
 * 取消收藏
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

    // 检查是否已经收藏
    const existingFavorite = await prisma.storyFavorite.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (!existingFavorite) {
      return badRequestResponse('您还未收藏这个故事');
    }

    // 删除收藏记录
    await prisma.storyFavorite.delete({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    return successResponse(null, '取消收藏成功');
  } catch (error: any) {
    console.error('取消收藏失败:', error);
    return errorResponse('取消收藏失败', 500, error);
  }
}

/**
 * GET /api/stories/[id]/favorite
 * 获取故事的收藏列表
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

    // 查询收藏列表和总数
    const [favorites, total] = await Promise.all([
      prisma.storyFavorite.findMany({
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
      prisma.storyFavorite.count({ where: { storyId } }),
    ]);

    return successResponse(
      {
        favorites,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      '获取收藏列表成功'
    );
  } catch (error: any) {
    console.error('获取收藏列表失败:', error);
    return errorResponse('获取收藏列表失败', 500, error);
  }
}

