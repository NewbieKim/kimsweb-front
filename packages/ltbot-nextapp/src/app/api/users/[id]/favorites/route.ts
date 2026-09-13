import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/response';
import { serializeStory, storyRelations } from '@/lib/story-access';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  const requestedUserId = (await params).id;
  if (!userId) return errorResponse('请先登录', 401);
  if (!requestedUserId?.trim() || requestedUserId !== userId) return errorResponse('用户不存在', 404);

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 20));
    const where = { userId };
    const [favorites, total] = await Promise.all([
      prisma.storyFavorite.findMany({
        where,
        include: {
          story: {
            include: storyRelations,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.storyFavorite.count({ where }),
    ]);
    return successResponse({
      favorites: favorites.map((favorite) => ({
        ...favorite,
        story: serializeStory(favorite.story, userId),
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }, '获取收藏列表成功');
  } catch (error) {
    console.error('获取收藏列表失败', { stage: 'user-favorites', error });
    return errorResponse('获取收藏列表失败', 500);
  }
}
