import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response';

/**
 * GET /api/users/[id]/favorites
 * 获取用户的收藏列表
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const userId = id;

    if (!userId || userId.trim() === '') {
      return badRequestResponse('用户ID无效');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const skip = (page - 1) * pageSize;

    // 查询收藏列表和总数
    const [favorites, total] = await Promise.all([
      prisma.storyFavorite.findMany({
        where: { userId },
        include: {
          story: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.storyFavorite.count({ where: { userId } }),
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

