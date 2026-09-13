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
      habitEvents,
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
      prisma.operationEvent.findMany({
        where: {
          eventType: { startsWith: 'habit_' },
          createdAt: rangeWhere,
        },
        select: { eventType: true, metadata: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
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
    const habitMetrics = buildHabitMetrics(habitEvents);

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
        habits: habitMetrics,
      },
      '获取运营指标成功',
    );
  } catch (error) {
    console.error('获取运营指标失败:', error);
    return errorResponse('获取运营指标失败', 500, error);
  }
}

function buildHabitMetrics(events: Array<{ eventType: string; metadata: string | null; createdAt: Date }>) {
  const profileSets = new Map<string, Set<number>>();
  const counts = new Map<string, number>();
  const feedingDays = new Map<number, Set<string>>();
  const firstFeed = new Map<number, string>();
  let rainbowFeeds = 0;
  let feedCount = 0;

  for (const event of events) {
    counts.set(event.eventType, (counts.get(event.eventType) || 0) + 1);
    const metadata = parseEventMetadata(event.metadata);
    const profileId = Number(metadata.childProfileId);
    if (Number.isInteger(profileId) && profileId > 0) {
      if (!profileSets.has(event.eventType)) profileSets.set(event.eventType, new Set());
      profileSets.get(event.eventType)!.add(profileId);
      if (event.eventType === OPERATION_EVENT_TYPES.HABIT_FEED_SUCCESS) {
        const localDate = typeof metadata.localDate === 'string'
          ? metadata.localDate
          : event.createdAt.toISOString().slice(0, 10);
        if (!feedingDays.has(profileId)) feedingDays.set(profileId, new Set());
        feedingDays.get(profileId)!.add(localDate);
        if (!firstFeed.has(profileId) || localDate < firstFeed.get(profileId)!) firstFeed.set(profileId, localDate);
        feedCount += 1;
        if (Number(metadata.rainbowDelta) > 0) rainbowFeeds += 1;
      }
    }
  }

  let d1 = 0;
  let d7 = 0;
  for (const [profileId, d0] of firstFeed) {
    const dates = feedingDays.get(profileId) || new Set<string>();
    if (dates.has(addUtcDays(d0, 1))) d1 += 1;
    if (dates.has(addUtcDays(d0, 7))) d7 += 1;
  }
  const firstFeedProfiles = firstFeed.size;
  const unique = (eventType: string) => profileSets.get(eventType)?.size || 0;
  const selected = counts.get(OPERATION_EVENT_TYPES.HABIT_REWARD_SELECTED) || 0;
  const checkIns = counts.get(OPERATION_EVENT_TYPES.HABIT_CHECKIN_SUCCESS) || 0;
  const averageWeeklyDays = feedingDays.size
    ? Number((Array.from(feedingDays.values()).reduce((sum, days) => sum + days.size, 0) / feedingDays.size).toFixed(2))
    : 0;

  return {
    funnel: {
      exposure: counts.get(OPERATION_EVENT_TYPES.HABIT_FEATURE_EXPOSURE) || 0,
      entryProfiles: unique(OPERATION_EVENT_TYPES.HABIT_HOME_ENTRY_CLICK),
      checkInProfiles: unique(OPERATION_EVENT_TYPES.HABIT_CHECKIN_SUCCESS),
      selectedProfiles: unique(OPERATION_EVENT_TYPES.HABIT_REWARD_SELECTED),
      fedProfiles: unique(OPERATION_EVENT_TYPES.HABIT_FEED_SUCCESS),
    },
    checkInCount: checkIns,
    selectionRate: checkIns ? Number((selected / checkIns * 100).toFixed(2)) : 0,
    feedCompletionRate: selected ? Number((feedCount / selected * 100).toFixed(2)) : 0,
    rainbowRate: feedCount ? Number((rainbowFeeds / feedCount * 100).toFixed(2)) : 0,
    averageWeeklyFeedingDays: averageWeeklyDays,
    d1RefedRate: firstFeedProfiles ? Number((d1 / firstFeedProfiles * 100).toFixed(2)) : 0,
    d7RefedRate: firstFeedProfiles ? Number((d7 / firstFeedProfiles * 100).toFixed(2)) : 0,
    duplicateRewardCount: 0,
  };
}

function parseEventMetadata(metadata: string | null): Record<string, unknown> {
  if (!metadata) return {};
  try { return JSON.parse(metadata) as Record<string, unknown>; } catch { return {}; }
}

function addUtcDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
