import {
  successResponse,
  errorResponse,
} from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { syncUserFromClerk } from '@/lib/user-sync';

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

    // 3. 幂等同步用户（含新人积分赠送）
    const { user, created } = await syncUserFromClerk({
      id: clerkUser.id,
      name:
        `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
        clerkUser.username ||
        '用户',
      email: clerkUser.emailAddresses[0]?.emailAddress || null,
      phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
      username: clerkUser.username || null,
      avatar: clerkUser.imageUrl || null,
    });

    return successResponse(
      {
        user,
        isNewUser: created,
      },
      created ? '用户创建成功' : '用户信息已更新'
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

