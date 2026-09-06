import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { findReadableStory } from '@/lib/story-access';
import { badRequestResponse, errorResponse, successResponse } from '@/lib/response';

type RouteContext = { params: Promise<{ id: string }> };

async function readableStoryId(id: string, userId?: string | null) {
  const storyId = Number(id);
  if (!Number.isInteger(storyId) || storyId <= 0) return null;
  return (await findReadableStory(storyId, userId))?.id ?? null;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);

  try {
    const storyId = await readableStoryId((await params).id, userId);
    if (!storyId) return errorResponse('故事不存在', 404);
    const existing = await prisma.storyFavorite.findUnique({
      where: { storyId_userId: { storyId, userId } },
    });
    if (existing) return badRequestResponse('您已经收藏过这个故事');

    const favorite = await prisma.storyFavorite.create({
      data: { storyId, userId },
      include: {
        story: {
          select: {
            id: true,
            ageGroup: true,
            themeType: true,
            classicTheme: true,
            customTheme: true,
            coverImage: true,
            visibility: true,
          },
        },
      },
    });
    return successResponse(favorite, '收藏成功');
  } catch (error) {
    console.error('收藏失败', { stage: 'create-favorite', error });
    return errorResponse('收藏失败', 500);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);

  try {
    const storyId = await readableStoryId((await params).id, userId);
    if (!storyId) return errorResponse('故事不存在', 404);
    const existing = await prisma.storyFavorite.findUnique({
      where: { storyId_userId: { storyId, userId } },
    });
    if (!existing) return badRequestResponse('您还未收藏这个故事');

    await prisma.storyFavorite.delete({ where: { storyId_userId: { storyId, userId } } });
    return successResponse(null, '取消收藏成功');
  } catch (error) {
    console.error('取消收藏失败', { stage: 'delete-favorite', error });
    return errorResponse('取消收藏失败', 500);
  }
}

export async function GET(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  try {
    const storyId = await readableStoryId((await params).id, userId);
    if (!storyId) return errorResponse('故事不存在', 404);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize')) || 20));
    const where = { storyId };
    const [favorites, total] = await Promise.all([
      prisma.storyFavorite.findMany({
        where,
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.storyFavorite.count({ where }),
    ]);
    return successResponse({
      favorites,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }, '获取收藏列表成功');
  } catch (error) {
    console.error('获取收藏列表失败', { stage: 'list-favorites', error });
    return errorResponse('获取收藏列表失败', 500);
  }
}
