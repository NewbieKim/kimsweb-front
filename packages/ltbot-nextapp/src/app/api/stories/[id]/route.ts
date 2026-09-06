import { auth } from '@clerk/nextjs/server';
import { ThemeType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { badRequestResponse, errorResponse, notFoundResponse, successResponse } from '@/lib/response';
import { findOwnedStory, findReadableStory, serializeStory, storyRelations } from '@/lib/story-access';

function parseStoryId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const storyId = parseStoryId((await params).id);
  if (!storyId) return badRequestResponse('故事 ID 无效');
  try {
    const { userId } = await auth();
    const story = await findReadableStory(storyId, userId);
    if (!story) return notFoundResponse('故事不存在或暂不可访问');
    return successResponse(serializeStory(story, userId), '获取故事详情成功');
  } catch (error) {
    console.error('故事详情查询失败', { storyId, stage: 'query', error });
    return errorResponse('获取故事详情失败', 500);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);
  const storyId = parseStoryId((await params).id);
  if (!storyId) return badRequestResponse('故事 ID 无效');

  try {
    const existing = await findOwnedStory(storyId, userId);
    if (!existing) return notFoundResponse('故事不存在或暂不可访问');
    const body = await request.json() as Record<string, unknown>;
    const data: {
      classicTheme?: string | null;
      classicSubTheme?: string | null;
      customTheme?: string | null;
      coverImage?: string | null;
      imageGallery?: string | null;
    } = {};

    if (!existing.customization) {
      if (body.classicTheme === null || typeof body.classicTheme === 'string') data.classicTheme = body.classicTheme?.slice(0, 80) ?? null;
      if (body.classicSubTheme === null || typeof body.classicSubTheme === 'string') data.classicSubTheme = body.classicSubTheme?.slice(0, 80) ?? null;
      if (body.customTheme === null || typeof body.customTheme === 'string') data.customTheme = body.customTheme?.slice(0, 80) ?? null;
    }
    if (body.coverImage === null || typeof body.coverImage === 'string') data.coverImage = body.coverImage?.slice(0, 2000) ?? null;
    if (body.imageGallery === null || typeof body.imageGallery === 'string') data.imageGallery = body.imageGallery?.slice(0, 10000) ?? null;

    if (body.themeType !== undefined && body.themeType !== ThemeType.CLASSIC && body.themeType !== ThemeType.CUSTOM) {
      return badRequestResponse('主题类型不正确');
    }
    if (!Object.keys(data).length) return badRequestResponse('没有可更新字段');

    const story = await prisma.story.update({
      where: { id: storyId },
      data,
      include: storyRelations,
    });
    return successResponse(serializeStory(story, userId), '更新故事成功');
  } catch (error) {
    console.error('故事更新失败', { userId, storyId, stage: 'update', error });
    return errorResponse('更新故事失败', 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);
  const storyId = parseStoryId((await params).id);
  if (!storyId) return badRequestResponse('故事 ID 无效');

  try {
    const existing = await findOwnedStory(storyId, userId);
    if (!existing) return notFoundResponse('故事不存在或暂不可访问');
    await prisma.story.delete({ where: { id: storyId } });
    return successResponse(null, '删除故事成功');
  } catch (error) {
    console.error('故事删除失败', { userId, storyId, stage: 'delete', error });
    return errorResponse('删除故事失败', 500);
  }
}
