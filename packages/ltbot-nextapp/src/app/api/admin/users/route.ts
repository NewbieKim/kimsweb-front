import { prisma } from '@/lib/prisma';
import { ensureAdminAuthorized } from '@/lib/admin-auth';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
} from '@/lib/response';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const unauthorized = ensureAdminAuthorized(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '10');
    const keyword = (searchParams.get('keyword') || '').trim();
    const registerStartDateRaw = (searchParams.get('registerStartDate') || '').trim();
    const registerEndDateRaw = (searchParams.get('registerEndDate') || '').trim();

    if (!Number.isInteger(page) || page < 1) {
      return badRequestResponse('page 必须是大于 0 的整数');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return badRequestResponse('pageSize 必须是 1 到 100 之间的整数');
    }

    const registerStartDate = registerStartDateRaw
      ? new Date(registerStartDateRaw)
      : null;
    const registerEndDate = registerEndDateRaw
      ? new Date(registerEndDateRaw)
      : null;

    if (registerStartDate && Number.isNaN(registerStartDate.getTime())) {
      return badRequestResponse('registerStartDate 日期格式不正确');
    }
    if (registerEndDate && Number.isNaN(registerEndDate.getTime())) {
      return badRequestResponse('registerEndDate 日期格式不正确');
    }
    if (registerStartDate && registerEndDate && registerStartDate > registerEndDate) {
      return badRequestResponse('注册开始时间不能晚于结束时间');
    }

    const where: Prisma.UserWhereInput = keyword
      ? {
          OR: [
            {
              id: {
                contains: keyword,
              },
            },
            {
              name: {
                contains: keyword,
              },
            },
            {
              email: {
                contains: keyword,
              },
            },
          ],
        }
      : {};

    if (registerStartDate || registerEndDate) {
      where.createdAt = {};
      if (registerStartDate) {
        registerStartDate.setHours(0, 0, 0, 0);
        where.createdAt.gte = registerStartDate;
      }
      if (registerEndDate) {
        registerEndDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = registerEndDate;
      }
    }

    const skip = (page - 1) * pageSize;
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          age: true,
          createdAt: true,
          updatedAt: true,
          extData: true,
        },
      }),
    ]);

    const userIds = users.map((user) => user.id);
    const [storyGroup, transactionGroup, commentGroup, userScores, eventGroup] =
      userIds.length
        ? await Promise.all([
            prisma.story.groupBy({
              by: ['userId'],
              where: {
                userId: {
                  in: userIds,
                },
              },
              _count: {
                _all: true,
              },
              _max: {
                createdAt: true,
              },
            }),
            prisma.scoreTransaction.groupBy({
              by: ['userId'],
              where: {
                userId: {
                  in: userIds,
                },
              },
              _count: {
                _all: true,
              },
              _max: {
                createdAt: true,
              },
            }),
            prisma.storyComment.groupBy({
              by: ['userId'],
              where: {
                userId: {
                  in: userIds,
                },
                isDeleted: false,
              },
              _count: {
                _all: true,
              },
              _max: {
                createdAt: true,
              },
            }),
            prisma.userScore.findMany({
              where: {
                userId: {
                  in: userIds,
                },
              },
              select: {
                userId: true,
                balance: true,
              },
            }),
            prisma.operationEvent.groupBy({
              by: ['userId'],
              where: {
                userId: {
                  in: userIds,
                },
              },
              _max: {
                createdAt: true,
              },
            }),
          ])
        : [[], [], [], [], []];

    const storyMap = new Map(
      storyGroup.map((item) => [item.userId, item]),
    );
    const transactionMap = new Map(
      transactionGroup.map((item) => [item.userId, item]),
    );
    const commentMap = new Map(
      commentGroup.map((item) => [item.userId, item]),
    );
    const scoreMap = new Map(userScores.map((item) => [item.userId, item.balance]));
    const eventMap = new Map(
      eventGroup
        .filter((item) => item.userId)
        .map((item) => [item.userId as string, item._max.createdAt]),
    );

    const list = users.map((user) => {
      const storyStat = storyMap.get(user.id);
      const transactionStat = transactionMap.get(user.id);
      const commentStat = commentMap.get(user.id);

      const lastActiveAt = latestDate([
        user.updatedAt,
        storyStat?._max.createdAt || null,
        transactionStat?._max.createdAt || null,
        commentStat?._max.createdAt || null,
        eventMap.get(user.id) || null,
      ]);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        age: user.age,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        extData: safeParseJson(user.extData),
        scoreBalance: scoreMap.get(user.id) || 0,
        storyCount: storyStat?._count._all || 0,
        transactionCount: transactionStat?._count._all || 0,
        commentCount: commentStat?._count._all || 0,
        lastActiveAt: lastActiveAt?.toISOString() || null,
      };
    });

    return successResponse(
      {
        list,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      '获取用户列表成功',
    );
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return errorResponse('获取用户列表失败', 500, error);
  }
}

function safeParseJson(value: string | null) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function latestDate(values: Array<Date | null | undefined>) {
  const dates = values.filter((value): value is Date => value instanceof Date);
  if (!dates.length) {
    return null;
  }
  return dates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest,
  );
}
