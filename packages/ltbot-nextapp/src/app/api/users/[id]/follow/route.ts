import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, badRequestResponse } from '@/lib/response';
import { auth, currentUser } from '@clerk/nextjs/server';

async function ensureCurrentUserExists(userId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (existingUser) {
    return;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error('无法获取当前用户信息');
  }

  await prisma.user.create({
    data: {
      id: clerkUser.id,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || '用户',
      email: clerkUser.emailAddresses[0]?.emailAddress || `${clerkUser.id}@clerk.local`,
      avatar: clerkUser.imageUrl || null,
    },
  });
}

/**
 * GET /api/users/[id]/follow
 * 查询当前登录用户是否已关注该用户
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse('请先登录', 401);
    }

    const { id } = await params;
    const targetUserId = id;

    if (!targetUserId || targetUserId.trim() === '') {
      return badRequestResponse('用户ID无效');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return errorResponse('用户不存在', 404);
    }

    const isSelf = userId === targetUserId;

    if (isSelf) {
      return successResponse(
        {
          isFollowing: false,
          isSelf: true,
        },
        '查询关注状态成功'
      );
    }

    const existingFollow = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "UserFollow"
      WHERE "followerId" = ${userId} AND "followingId" = ${targetUserId}
      LIMIT 1
    `;

    return successResponse(
      {
        isFollowing: existingFollow.length > 0,
        isSelf: false,
      },
      '查询关注状态成功'
    );
  } catch (error: any) {
    console.error('查询关注状态失败:', error);
    return errorResponse('查询关注状态失败', 500, error);
  }
}

/**
 * POST /api/users/[id]/follow
 * 关注目标用户
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse('请先登录', 401);
    }

    const { id } = await params;
    const targetUserId = id;

    if (!targetUserId || targetUserId.trim() === '') {
      return badRequestResponse('用户ID无效');
    }

    if (userId === targetUserId) {
      return badRequestResponse('不能关注自己');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return errorResponse('目标用户不存在', 404);
    }

    await ensureCurrentUserExists(userId);

    const existingFollow = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "UserFollow"
      WHERE "followerId" = ${userId} AND "followingId" = ${targetUserId}
      LIMIT 1
    `;

    if (existingFollow.length > 0) {
      return badRequestResponse('您已经关注过该用户');
    }

    await prisma.$executeRaw`
      INSERT INTO "UserFollow" ("followerId", "followingId")
      VALUES (${userId}, ${targetUserId})
    `;

    return successResponse(
      {
        followerId: userId,
        followingId: targetUserId,
      },
      '关注成功'
    );
  } catch (error: any) {
    console.error('关注失败:', error);
    return errorResponse('关注失败', 500, error);
  }
}

/**
 * DELETE /api/users/[id]/follow
 * 取消关注目标用户
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse('请先登录', 401);
    }

    const { id } = await params;
    const targetUserId = id;

    if (!targetUserId || targetUserId.trim() === '') {
      return badRequestResponse('用户ID无效');
    }

    if (userId === targetUserId) {
      return badRequestResponse('不能对自己取消关注');
    }

    const existingFollow = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM "UserFollow"
      WHERE "followerId" = ${userId} AND "followingId" = ${targetUserId}
      LIMIT 1
    `;

    if (existingFollow.length === 0) {
      return badRequestResponse('您尚未关注该用户');
    }

    await prisma.$executeRaw`
      DELETE FROM "UserFollow"
      WHERE "followerId" = ${userId} AND "followingId" = ${targetUserId}
    `;

    return successResponse(null, '取消关注成功');
  } catch (error: any) {
    console.error('取消关注失败:', error);
    return errorResponse('取消关注失败', 500, error);
  }
}
