import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, badRequestResponse } from '@/lib/response';

type FollowListType = 'following' | 'followers';

function parseListType(value: string | null): FollowListType | null {
  if (value === 'following' || value === 'followers') {
    return value;
  }
  return null;
}

/**
 * GET /api/users/[id]/follows
 * - 不传 type：返回关注/粉丝统计
 * - 传 type=following|followers：返回对应用户列表
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const userId = id;

    if (!userId || userId.trim() === '') {
      return badRequestResponse('用户ID无效');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!targetUser) {
      return errorResponse('用户不存在', 404);
    }

    const { searchParams } = new URL(request.url);
    const type = parseListType(searchParams.get('type'));

    if (!type) {
      const [followingCountRows, followerCountRows] = await Promise.all([
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(1) AS count
          FROM "UserFollow"
          WHERE "followerId" = ${userId}
        `,
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(1) AS count
          FROM "UserFollow"
          WHERE "followingId" = ${userId}
        `,
      ]);

      return successResponse(
        {
          followingCount: Number(followingCountRows[0]?.count || 0),
          followerCount: Number(followerCountRows[0]?.count || 0),
        },
        '获取关注统计成功'
      );
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
    const offset = (page - 1) * pageSize;

    if (type === 'following') {
      const [rows, totalRows] = await Promise.all([
        prisma.$queryRaw<Array<{ id: string; name: string; avatar: string | null; followedAt: string }>>`
          SELECT u."id", u."name", u."avatar", uf."createdAt" AS "followedAt"
          FROM "UserFollow" uf
          JOIN "User" u ON u."id" = uf."followingId"
          WHERE uf."followerId" = ${userId}
          ORDER BY uf."createdAt" DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `,
        prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(1) AS count
          FROM "UserFollow"
          WHERE "followerId" = ${userId}
        `,
      ]);

      const total = Number(totalRows[0]?.count || 0);
      return successResponse(
        {
          type,
          users: rows,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
        '获取关注列表成功'
      );
    }

    const [rows, totalRows] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string; name: string; avatar: string | null; followedAt: string }>>`
        SELECT u."id", u."name", u."avatar", uf."createdAt" AS "followedAt"
        FROM "UserFollow" uf
        JOIN "User" u ON u."id" = uf."followerId"
        WHERE uf."followingId" = ${userId}
        ORDER BY uf."createdAt" DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(1) AS count
        FROM "UserFollow"
        WHERE "followingId" = ${userId}
      `,
    ]);

    const total = Number(totalRows[0]?.count || 0);
    return successResponse(
      {
        type,
        users: rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      '获取粉丝列表成功'
    );
  } catch (error: any) {
    console.error('获取关注数据失败:', error);
    return errorResponse('获取关注数据失败', 500, error);
  }
}
