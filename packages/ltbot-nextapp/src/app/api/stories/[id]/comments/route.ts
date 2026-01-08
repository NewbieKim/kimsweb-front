import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response';
import { auth } from '@clerk/nextjs/server';

/**
 * POST /api/stories/[id]/comments
 * 发表评论
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
    const body = await request.json();

    if (isNaN(storyId)) {
      return badRequestResponse('故事ID无效');
    }

    if (!body.content || body.content.trim() === '') {
      return badRequestResponse('评论内容不能为空');
    }

    // 检查故事是否存在
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return errorResponse('故事不存在', 404);
    }

    // 如果是回复评论，检查父评论是否存在
    if (body.parentId) {
      const parentComment = await prisma.storyComment.findUnique({
        where: { id: parseInt(body.parentId) },
      });

      if (!parentComment || parentComment.storyId !== storyId) {
        return badRequestResponse('父评论不存在或不属于该故事');
      }
    }

    // 创建评论
    const comment = await prisma.storyComment.create({
      data: {
        storyId,
        userId,
        content: body.content.trim(),
        parentId: body.parentId ? parseInt(body.parentId) : null,
        replyToId: body.replyToId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return successResponse(comment, '评论成功');
  } catch (error: any) {
    console.error('发表评论失败:', error);
    return errorResponse('发表评论失败', 500, error);
  }
}

/**
 * GET /api/stories/[id]/comments
 * 获取故事的评论列表
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
    const sortBy = searchParams.get('sortBy') || 'latest'; // latest | oldest

    const skip = (page - 1) * pageSize;

    // 只查询顶级评论（parentId 为 null）
    const [comments, total] = await Promise.all([
      prisma.storyComment.findMany({
        where: {
          storyId,
          parentId: null,
          isDeleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          replies: {
            where: {
              isDeleted: false,
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
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              replies: {
                where: {
                  isDeleted: false,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: sortBy === 'oldest' ? 'asc' : 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.storyComment.count({
        where: {
          storyId,
          parentId: null,
          isDeleted: false,
        },
      }),
    ]);

    return successResponse(
      {
        comments,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      '获取评论列表成功'
    );
  } catch (error: any) {
    console.error('获取评论列表失败:', error);
    return errorResponse('获取评论列表失败', 500, error);
  }
}

