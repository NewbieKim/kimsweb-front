import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  badRequestResponse,
} from '@/lib/response';
import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * POST /api/users/sync
 * 同步当前登录用户信息到数据库
 * 自动从 Clerk 获取用户信息并创建/更新本地数据库记录
 */
export async function POST(request: Request) {
  try {
    // 1. 验证用户是否登录
    const { userId } = await auth();
    
    if (!userId) {
      return errorResponse('未登录', 401);
    }

    // 2. 获取 Clerk 用户完整信息
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return errorResponse('无法获取用户信息', 404);
    }

    console.log('同步用户信息clerkUser:', clerkUser);

    // 3. 准备用户数据
    const userData = {
      id: clerkUser.id,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || '用户',
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      avatar: clerkUser.imageUrl || null,
    };

    // 4. 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    let user;

    if (existingUser) {
      // 更新现有用户
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
        },
      });
      console.log('用户信息已更新:', user.id);
    } else {
      // 创建新用户
      user = await prisma.user.create({
        data: userData,
      });
      
      // 为新用户创建积分记录，赠送初始积分
      await prisma.userScore.create({
        data: {
          userId: user.id,
          balance: 100, // 新用户赠送 100 积分
        },
      });

      console.log('新用户创建成功:', user.id, '赠送 100 积分');
    }

    return successResponse(
      {
        user,
        isNewUser: !existingUser,
      },
      existingUser ? '用户信息已更新' : '用户创建成功'
    );
  } catch (error: any) {
    console.error('同步用户信息失败:', error);
    return errorResponse('同步用户信息失败', 500, error);
  }
}

/**
 * GET /api/users/sync
 * 获取当前用户同步状态
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return errorResponse('未登录', 401);
    }

    // 检查用户是否存在于本地数据库
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userScore: true,
      },
    });

    return successResponse(
      {
        synced: !!user,
        user: user || null,
      },
      '获取同步状态成功'
    );
  } catch (error: any) {
    console.error('获取同步状态失败:', error);
    return errorResponse('获取同步状态失败', 500, error);
  }
}

