import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'
import { auth } from '@clerk/nextjs/server'

// GET /api/users-prisma/[id]
// 查询用户信息及其积分信息
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const userId = id; // 直接使用字符串 ID（Clerk 用户 ID）
    
    if (!userId || userId.trim() === '') {
      return errorResponse('用户ID无效', 400);
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userScore: { // 包含用户的积分余额信息
          select: {
            balance: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    
    if (!user) {
      return errorResponse('用户不存在', 404);
    }
    
    return successResponse(user, '查询用户信息成功');
  } catch (error) {
    console.error('查询用户信息时出错:', error);
    return errorResponse('查询用户信息失败', 500, error);
  }
}

// PUT /api/users-prisma/[id]
// 更新用户扩展信息（当前仅允许用户更新自己的 extData）
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const targetUserId = id;

    if (!targetUserId || targetUserId.trim() === '') {
      return errorResponse('用户ID无效', 400);
    }

    const { userId } = await auth();
    if (!userId) {
      return errorResponse('未登录', 401);
    }
    if (userId !== targetUserId) {
      return errorResponse('无权限更新其他用户信息', 403);
    }

    const body = await request.json();

    if (body?.extData === undefined) {
      return errorResponse('extData 为必填项', 400);
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        extData: body.extData,
      },
      include: {
        userScore: {
          select: {
            balance: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return successResponse(user, '更新用户信息成功');
  } catch (error) {
    console.error('更新用户信息时出错:', error);
    return errorResponse('更新用户信息失败', 500, error);
  }
}