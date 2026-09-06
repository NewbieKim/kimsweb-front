import { auth } from '@clerk/nextjs/server';
import { Prisma, StoryVisibility, ThemeType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { badRequestResponse, createdResponse, errorResponse, successResponse, validationErrorResponse } from '@/lib/response';
import { createOperationEvent, OPERATION_EVENT_TYPES } from '@/lib/operation-event';
import { readableStoryWhere, serializeStory, storyRelations } from '@/lib/story-access';
import { createCustomizedStory } from '@/lib/story-customization/create-story';
import { ContentValidationError, validateGrowthTheme } from '@/lib/story-customization/validation';

function positiveInteger(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

export async function GET(request: Request) {
  try {
    const { userId: viewerId } = await auth();
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const page = positiveInteger(searchParams.get('page'), 1);
    const pageSize = positiveInteger(searchParams.get('pageSize'), 10, 50);
    const childProfileIdRaw = searchParams.get('childProfileId');
    const childProfileId = childProfileIdRaw ? Number(childProfileIdRaw) : null;

    if (childProfileId !== null && (!viewerId || requestedUserId !== viewerId || !Number.isInteger(childProfileId))) {
      return badRequestResponse('孩子档案筛选仅用于我的故事');
    }

    const isOwnList = Boolean(viewerId && requestedUserId === viewerId);
    const where: Prisma.StoryWhereInput = {
      ...(requestedUserId ? { userId: requestedUserId } : {}),
      ...(isOwnList ? {} : readableStoryWhere(viewerId)),
      ...(!requestedUserId ? { visibility: StoryVisibility.PUBLIC, content: { not: null } } : {}),
      ...(childProfileId ? { childProfileId } : {}),
      ...(searchParams.get('ageGroup') ? { ageGroup: searchParams.get('ageGroup')! } : {}),
      ...(searchParams.get('themeType') ? { themeType: searchParams.get('themeType') as ThemeType } : {}),
    };
    if (requestedUserId && !isOwnList) {
      where.visibility = StoryVisibility.PUBLIC;
      where.content = { not: null };
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: storyRelations,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.story.count({ where }),
    ]);

    return successResponse({
      stories: stories.map((story) => serializeStory(story, viewerId)),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }, '获取故事列表成功');
  } catch (error) {
    console.error('故事列表查询失败', { stage: 'query', error });
    return errorResponse('获取故事列表失败', 500);
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);

  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.mode === 'customized') {
      const result = await createCustomizedStory(userId, request.headers.get('Idempotency-Key'), body);
      const story = await prisma.story.findUniqueOrThrow({
        where: { id: result.story.id },
        include: storyRelations,
      });
      if (!result.duplicated) {
        void createOperationEvent({
          eventType: OPERATION_EVENT_TYPES.STORY_CREATE,
          userId,
          storyId: story.id,
          metadata: { generationMode: 'customized', hasTonightMaterial: Boolean(story.customization?.tonightMaterialText) },
        });
      }
      return result.duplicated
        ? successResponse(serializeStory(story, userId), '重复请求已返回原故事')
        : createdResponse(serializeStory(story, userId), '创建故事成功');
    }

    const ageGroup = typeof body.ageGroup === 'string' ? body.ageGroup.trim() : '';
    const themeType = body.themeType === ThemeType.CLASSIC ? ThemeType.CLASSIC : ThemeType.CUSTOM;
    const customTheme = themeType === ThemeType.CUSTOM ? validateGrowthTheme(body.customTheme) : null;
    const classicTheme = themeType === ThemeType.CLASSIC && typeof body.classicTheme === 'string'
      ? validateGrowthTheme(body.classicTheme)
      : null;
    const characterSettings = typeof body.characterSettings === 'string' && body.characterSettings.length <= 1000
      ? body.characterSettings
      : '';
    const wordLimit = Number(body.wordLimit);
    if (!ageGroup || !characterSettings || !Number.isInteger(wordLimit) || wordLimit < 100 || wordLimit > 2000 || (!classicTheme && !customTheme)) {
      return badRequestResponse('故事参数不完整');
    }

    const sourceStoryId = Number(body.sourceStoryId);
    const hasSourceStory = Number.isInteger(sourceStoryId) && sourceStoryId > 0;
    if (hasSourceStory) {
      const source = await prisma.story.findFirst({
        where: { id: sourceStoryId, ...readableStoryWhere(userId) },
        select: { id: true },
      });
      if (!source) return errorResponse('原故事不存在', 404);
    }

    const story = await prisma.story.create({
      data: {
        userId,
        visibility: StoryVisibility.PRIVATE,
        ageGroup,
        themeType,
        classicTheme,
        classicSubTheme: typeof body.classicSubTheme === 'string' ? body.classicSubTheme.slice(0, 80) : null,
        customTheme,
        characterSettings,
        wordLimit,
        extData: JSON.stringify({
          generationStatus: 'pending',
          generationMode: hasSourceStory ? 'continuation' : 'quick',
          sourceStoryId: hasSourceStory ? sourceStoryId : undefined,
          generationCreatedAt: new Date().toISOString(),
        }),
      },
      include: storyRelations,
    });
    void createOperationEvent({
      eventType: OPERATION_EVENT_TYPES.STORY_CREATE,
      userId,
      storyId: story.id,
      metadata: { generationMode: hasSourceStory ? 'continuation' : 'quick' },
    });
    return createdResponse(serializeStory(story, userId), '创建故事成功');
  } catch (error) {
    if (error instanceof ContentValidationError) {
      return validationErrorResponse(error.message, {
        errorCode: 'CONTENT_BLOCKED', field: error.field, category: error.category,
      });
    }
    console.error('故事创建失败', { userId, stage: 'create', error });
    return errorResponse('创建故事失败', 500);
  }
}
