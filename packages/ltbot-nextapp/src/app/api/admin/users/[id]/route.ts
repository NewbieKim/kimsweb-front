import { prisma } from '@/lib/prisma';
import { ensureAdminAuthorized } from '@/lib/admin-auth';
import {
  badRequestResponse,
  errorResponse,
  notFoundResponse,
  successResponse,
} from '@/lib/response';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const unauthorized = ensureAdminAuthorized(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { id: userId } = await context.params;
    const normalizedUserId = userId?.trim();
    if (!normalizedUserId) {
      return badRequestResponse('用户ID不能为空');
    }

    const user = await prisma.user.findUnique({
      where: {
        id: normalizedUserId,
      },
      include: {
        userScore: true,
        stories: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 30,
          include: {
            _count: {
              select: {
                likes: true,
                favorites: true,
                comments: {
                  where: {
                    isDeleted: false,
                  },
                },
              },
            },
          },
        },
        scoreTransactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
          include: {
            story: {
              select: {
                id: true,
                customTheme: true,
                classicTheme: true,
                classicSubTheme: true,
              },
            },
            music: {
              select: {
                id: true,
                musicStyle: true,
                description: true,
              },
            },
          },
        },
        storyLikes: {
          take: 50,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            story: {
              select: {
                id: true,
                customTheme: true,
                classicTheme: true,
                classicSubTheme: true,
                createdAt: true,
              },
            },
          },
        },
        storyFavorites: {
          take: 50,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            story: {
              select: {
                id: true,
                customTheme: true,
                classicTheme: true,
                classicSubTheme: true,
                createdAt: true,
              },
            },
          },
        },
        storyComments: {
          where: {
            isDeleted: false,
          },
          take: 50,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            story: {
              select: {
                id: true,
                customTheme: true,
                classicTheme: true,
                classicSubTheme: true,
              },
            },
          },
        },
        musics: {
          take: 30,
          orderBy: {
            createdAt: 'desc',
          },
        },
        followingRelations: {
          select: {
            followingId: true,
          },
        },
        followerRelations: {
          select: {
            followerId: true,
          },
        },
      },
    });

    if (!user) {
      return notFoundResponse('用户不存在');
    }

    const { extData, ...restUser } = user;
    const parsedExtData = safeParseJson(extData);
    const latestOperationEvent = await prisma.operationEvent.findFirst({
      where: {
        userId: normalizedUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        eventType: true,
        createdAt: true,
        visitorId: true,
        storyId: true,
        metadata: true,
      },
    });

    return successResponse(
      {
        user: {
          ...restUser,
          extData: parsedExtData,
          extDataRaw: extData,
        },
        overview: {
          scoreBalance: user.userScore?.balance || 0,
          storyCount: user.stories.length,
          transactionCount: user.scoreTransactions.length,
          likeCount: user.storyLikes.length,
          favoriteCount: user.storyFavorites.length,
          commentCount: user.storyComments.length,
          musicCount: user.musics.length,
          followingCount: user.followingRelations.length,
          followerCount: user.followerRelations.length,
          lastOperationEvent: latestOperationEvent
            ? {
                ...latestOperationEvent,
                metadata: safeParseJson(latestOperationEvent.metadata),
              }
            : null,
        },
      },
      '获取用户详情成功',
    );
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return errorResponse('获取用户详情失败', 500, error);
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
