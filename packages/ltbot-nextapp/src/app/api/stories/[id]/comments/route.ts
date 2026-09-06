import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { findReadableStory } from '@/lib/story-access';
import { badRequestResponse, errorResponse, successResponse } from '@/lib/response';

type RouteContext = { params: Promise<{ id: string }> };
type CommentBody = { content?: unknown; parentId?: unknown; replyToId?: unknown };

async function readableStoryId(id: string, userId?: string | null) {
  const storyId = Number(id);
  if (!Number.isInteger(storyId) || storyId <= 0) return null;
  return (await findReadableStory(storyId, userId))?.id ?? null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);

  try {
    const storyId = await readableStoryId((await params).id, userId);
    if (!storyId) return errorResponse('故事不存在', 404);

    const body = await request.json() as CommentBody;
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content || content.length > 500) return badRequestResponse('评论内容需为 1–500 字');

    const parentId = body.parentId === undefined || body.parentId === null ? null : Number(body.parentId);
    if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
      return badRequestResponse('父评论ID无效');
    }
    if (parentId) {
      const parent = await prisma.storyComment.findFirst({
        where: { id: parentId, storyId, isDeleted: false },
        select: { id: true },
      });
      if (!parent) return badRequestResponse('父评论不存在或不属于该故事');
    }

    const replyToId = typeof body.replyToId === 'string' && body.replyToId.trim()
      ? body.replyToId.trim()
      : null;
    const comment = await prisma.storyComment.create({
      data: { storyId, userId, content, parentId, replyToId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        parent: {
          select: {
            id: true,
            content: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    return successResponse(comment, '评论成功');
  } catch (error) {
    console.error('发表评论失败', { stage: 'create-comment', error });
    return errorResponse('发表评论失败', 500);
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
    const sortBy = searchParams.get('sortBy') === 'oldest' ? 'oldest' : 'latest';
    const where = { storyId, parentId: null, isDeleted: false };
    const [comments, total] = await Promise.all([
      prisma.storyComment.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          replies: {
            where: { isDeleted: false },
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { replies: { where: { isDeleted: false } } } },
        },
        orderBy: { createdAt: sortBy === 'oldest' ? 'asc' : 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.storyComment.count({ where }),
    ]);
    return successResponse({
      comments,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }, '获取评论列表成功');
  } catch (error) {
    console.error('获取评论列表失败', { stage: 'list-comments', error });
    return errorResponse('获取评论列表失败', 500);
  }
}
