import { prisma } from '@/lib/prisma';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
} from '@/lib/response';
import { ensureAdminAuthorized } from '@/lib/admin-auth';
import { OPERATION_EVENT_TYPES } from '@/lib/operation-event';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export async function GET(request: Request) {
  const unauthorized = ensureAdminAuthorized(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateRangeResult = resolveDateRange(
      searchParams.get('startDate'),
      searchParams.get('endDate'),
    );

    if ('error' in dateRangeResult) {
      return badRequestResponse(dateRangeResult.error);
    }

    const { startDate, endDate } = dateRangeResult;
    const rangeWhere = { gte: startDate, lte: endDate };
    const sevenDaysStart = startOfDay(new Date(endDate.getTime() - ONE_DAY_MS * 6));

    const [
      totalUserCount,
      registerUserCount,
      totalStoryCount,
      pageViewEvents,
      createdStories,
      generationEvents,
      ttsPlayEvents,
      feedbackEventCount,
      feedbackCommentCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: rangeWhere,
        },
      }),
      prisma.story.count(),
      prisma.operationEvent.findMany({
        where: {
          eventType: OPERATION_EVENT_TYPES.PAGE_VIEW,
          createdAt: rangeWhere,
        },
        select: {
          visitorId: true,
          userId: true,
          createdAt: true,
        },
      }),
      prisma.story.findMany({
        where: {
          createdAt: rangeWhere,
        },
        select: {
          id: true,
          userId: true,
          createdAt: true,
        },
      }),
      prisma.operationEvent.findMany({
        where: {
          eventType: {
            in: [
              OPERATION_EVENT_TYPES.STORY_GENERATE_SUCCESS,
              OPERATION_EVENT_TYPES.STORY_GENERATE_FAILED,
            ],
          },
          createdAt: rangeWhere,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          eventType: true,
          userId: true,
          storyId: true,
          metadata: true,
          createdAt: true,
        },
      }),
      prisma.operationEvent.findMany({
        where: {
          eventType: OPERATION_EVENT_TYPES.TTS_PLAY,
          createdAt: rangeWhere,
        },
        select: {
          userId: true,
          createdAt: true,
        },
      }),
      prisma.operationEvent.count({
        where: {
          eventType: OPERATION_EVENT_TYPES.FEEDBACK_SUBMIT,
          createdAt: rangeWhere,
        },
      }),
      prisma.storyComment.count({
        where: {
          isDeleted: false,
          createdAt: rangeWhere,
        },
      }),
    ]);

    const visitors = new Set<string>();
    const loginUsers = new Set<string>();
    const uvTrendMap = new Map<string, Set<string>>();

    pageViewEvents.forEach((event) => {
      const dayKey = toDateKey(event.createdAt);
      if (event.visitorId) {
        visitors.add(event.visitorId);
        if (!uvTrendMap.has(dayKey)) {
          uvTrendMap.set(dayKey, new Set<string>());
        }
        uvTrendMap.get(dayKey)!.add(event.visitorId);
      }
      if (event.userId) {
        loginUsers.add(event.userId);
      }
    });

    const storyCreateUsers = new Set<string>();
    const storyTrendMap = new Map<string, number>();
    createdStories.forEach((story) => {
      if (story.userId) {
        storyCreateUsers.add(story.userId);
      }
      const dayKey = toDateKey(story.createdAt);
      storyTrendMap.set(dayKey, (storyTrendMap.get(dayKey) || 0) + 1);
    });

    const generateSuccessUsers = new Set<string>();
    const failedStoryIds = new Set<number>();
    let generateSuccessCount = 0;
    let generateFailedCount = 0;
    const generateSevenDayMap = new Map<string, { success: number; failed: number }>();

    generationEvents.forEach((event) => {
      const dayKey = toDateKey(event.createdAt);
      const inSevenDays = event.createdAt >= sevenDaysStart && event.createdAt <= endDate;
      if (inSevenDays && !generateSevenDayMap.has(dayKey)) {
        generateSevenDayMap.set(dayKey, { success: 0, failed: 0 });
      }

      if (event.eventType === OPERATION_EVENT_TYPES.STORY_GENERATE_SUCCESS) {
        generateSuccessCount += 1;
        if (event.userId) {
          generateSuccessUsers.add(event.userId);
        }
        if (inSevenDays) {
          generateSevenDayMap.get(dayKey)!.success += 1;
        }
      }
      if (event.eventType === OPERATION_EVENT_TYPES.STORY_GENERATE_FAILED) {
        generateFailedCount += 1;
        if (typeof event.storyId === 'number') {
          failedStoryIds.add(event.storyId);
        }
        if (inSevenDays) {
          generateSevenDayMap.get(dayKey)!.failed += 1;
        }
      }
    });

    const ttsUsers = new Set<string>();
    ttsPlayEvents.forEach((event) => {
      if (event.userId) {
        ttsUsers.add(event.userId);
      }
    });

    const dailyBuckets = buildDailyBuckets(startDate, endDate);
    const trend = dailyBuckets.map((day) => ({
      date: day,
      uv: uvTrendMap.get(day)?.size || 0,
      storyCreate: storyTrendMap.get(day) || 0,
    }));

    const generateTrend7Days = buildDailyBuckets(sevenDaysStart, endDate).map((day) => ({
      date: day,
      success: generateSevenDayMap.get(day)?.success || 0,
      failed: generateSevenDayMap.get(day)?.failed || 0,
    }));

    const totalGenerateCount = generateSuccessCount + generateFailedCount;
    const generateSuccessRate = totalGenerateCount
      ? Number(((generateSuccessCount / totalGenerateCount) * 100).toFixed(2))
      : 0;

    const failedStories = await buildRecentFailedStories(
      Array.from(failedStoryIds),
      generationEvents,
    );

    return successResponse(
      {
        range: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        overview: {
          uv: visitors.size,
          registerUserCount,
          loginUserCount: loginUsers.size,
          totalUserCount,
          storyCreateCount: createdStories.length,
          totalStoryCount,
          generateSuccessCount,
          generateFailedCount,
          generateSuccessRate,
          ttsPlayCount: ttsPlayEvents.length,
          feedbackCount: feedbackEventCount + feedbackCommentCount,
        },
        trend,
        funnel: {
          uv: visitors.size,
          loginOrRegister: loginUsers.size,
          storyCreate: storyCreateUsers.size,
          generateSuccess: generateSuccessUsers.size,
          ttsPlay: ttsUsers.size,
        },
        stability: {
          generateSuccessRate,
          generateFailedCount,
          recentFailedStories: failedStories,
          generateTrend7Days,
        },
      },
      '获取运营指标成功',
    );
  } catch (error) {
    console.error('获取运营指标失败:', error);
    return errorResponse('获取运营指标失败', 500, error);
  }
}

function resolveDateRange(
  startDateRaw: string | null,
  endDateRaw: string | null,
): DateRange | { error: string } {
  const today = new Date();
  const defaultEnd = endOfDay(today);
  const defaultStart = startOfDay(new Date(defaultEnd.getTime() - ONE_DAY_MS * 6));

  const startDate = startDateRaw
    ? startOfDay(new Date(startDateRaw))
    : defaultStart;
  const endDate = endDateRaw
    ? endOfDay(new Date(endDateRaw))
    : defaultEnd;

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { error: '日期格式不正确，需传入 YYYY-MM-DD 或 ISO 日期字符串' };
  }

  if (startDate > endDate) {
    return { error: 'startDate 不能晚于 endDate' };
  }

  return { startDate, endDate };
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDailyBuckets(startDate: Date, endDate: Date) {
  const days: string[] = [];
  const cursor = startOfDay(startDate);
  const end = startOfDay(endDate);
  while (cursor <= end) {
    days.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

async function buildRecentFailedStories(
  failedStoryIds: number[],
  generationEvents: Array<{
    storyId: number | null;
    eventType: string;
    metadata: string | null;
    createdAt: Date;
  }>,
) {
  if (!failedStoryIds.length) {
    return [];
  }

  const stories = await prisma.story.findMany({
    where: {
      id: {
        in: failedStoryIds,
      },
    },
    select: {
      id: true,
      ageGroup: true,
      themeType: true,
      classicTheme: true,
      classicSubTheme: true,
      customTheme: true,
      userId: true,
    },
  });

  const storyMap = new Map(stories.map((story) => [story.id, story]));
  const results: Array<{
    storyId: number;
    userId: string | null;
    themeSummary: string;
    failedAt: string;
    errorMessage: string;
  }> = [];

  for (const event of generationEvents) {
    if (event.eventType !== OPERATION_EVENT_TYPES.STORY_GENERATE_FAILED) {
      continue;
    }
    if (typeof event.storyId !== 'number') {
      continue;
    }
    const story = storyMap.get(event.storyId);
    if (!story) {
      continue;
    }
    results.push({
      storyId: story.id,
      userId: story.userId || null,
      themeSummary:
        story.customTheme ||
        story.classicSubTheme ||
        story.classicTheme ||
        story.themeType,
      failedAt: event.createdAt.toISOString(),
      errorMessage: parseFailedReason(event.metadata),
    });
    if (results.length >= 10) {
      break;
    }
  }

  return results;
}

function parseFailedReason(metadata: string | null) {
  if (!metadata) {
    return 'unknown_error';
  }
  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    if (typeof parsed.errorMessage === 'string' && parsed.errorMessage.trim()) {
      return parsed.errorMessage;
    }
  } catch {
    return metadata;
  }
  return 'unknown_error';
}
