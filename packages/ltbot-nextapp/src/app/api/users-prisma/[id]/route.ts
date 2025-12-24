import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/response'

// GET /api/users-prisma/[id]
// 查询用户信息及其积分信息
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
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