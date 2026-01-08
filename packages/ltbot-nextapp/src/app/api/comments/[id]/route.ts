import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response';
import { auth } from '@clerk/nextjs/server';

/**
 * PUT /api/comments/[id]
 * 编辑评论
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return errorResponse('请先登录', 401);
    }

    const { id } = await params;
    const commentId = parseInt(id);
    const body = await request.json();

    if (isNaN(commentId)) {
      return badRequestResponse('评论ID无效');
    }

    if (!body.content || body.content.trim() === '') {
      return badRequestResponse('评论内容不能为空');
    }

    // 检查评论是否存在
    const comment = await prisma.storyComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return errorResponse('评论不存在', 404);
    }

    // 检查是否是评论作者
    if (comment.userId !== userId) {
      return errorResponse('无权编辑此评论', 403);
    }

    // 检查是否已被删除
    if (comment.isDeleted) {
      return badRequestResponse('评论已被删除，无法编辑');
    }

    // 更新评论
    const updatedComment = await prisma.storyComment.update({
      where: { id: commentId },
      data: {
        content: body.content.trim(),
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

    return successResponse(updatedComment, '编辑评论成功');
  } catch (error: any) {
    console.error('编辑评论失败:', error);
    return errorResponse('编辑评论失败', 500, error);
  }
}

/**
 * DELETE /api/comments/[id]
 * 删除评论（软删除）
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
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return badRequestResponse('评论ID无效');
    }

    // 检查评论是否存在
    const comment = await prisma.storyComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return errorResponse('评论不存在', 404);
    }

    // 检查是否是评论作者
    if (comment.userId !== userId) {
      return errorResponse('无权删除此评论', 403);
    }

    // 软删除评论
    await prisma.storyComment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
      },
    });

    return successResponse(null, '删除评论成功');
  } catch (error: any) {
    console.error('删除评论失败:', error);
    return errorResponse('删除评论失败', 500, error);
  }
}

