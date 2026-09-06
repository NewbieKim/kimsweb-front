import { auth } from '@clerk/nextjs/server';
import { StoryVisibility } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { badRequestResponse, errorResponse, notFoundResponse, successResponse } from '@/lib/response';
import { createOperationEvent, OPERATION_EVENT_TYPES } from '@/lib/operation-event';
import { findOwnedStory } from '@/lib/story-access';
import type { ChildSnapshot, DreamWorldSnapshot } from '@/lib/story-customization/types';
import { splitStoryFormats } from '@/lib/tts/storyScript';

type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

function parseExtData(raw: string | null) {
  if (!raw) return {} as Record<string, unknown>;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
}

function parseJson<T>(raw: string): T {
  return JSON.parse(raw) as T;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);

  try {
    const body = await request.json() as { storyId?: unknown };
    const storyId = Number(body.storyId);
    if (!Number.isInteger(storyId) || storyId <= 0) return badRequestResponse('故事 ID 为必填项');

    const story = await findOwnedStory(storyId, userId);
    if (!story) return notFoundResponse('故事不存在或暂不可访问');
    const extData = parseExtData(story.extData);
    const status = extData.generationStatus as GenerationStatus | undefined;
    if (status === 'completed' || story.content) {
      return successResponse({ storyId, status: 'completed' }, '故事已经生成完成');
    }
    if (status === 'generating') {
      return successResponse({ storyId, status: 'generating' }, '故事正在生成中');
    }

    const nextExtData = JSON.stringify({
      ...extData,
      generationStatus: 'generating',
      generationError: undefined,
      generationStartedAt: new Date().toISOString(),
    });
    const claimed = await prisma.story.updateMany({
      where: { id: storyId, userId, extData: story.extData },
      data: { extData: nextExtData },
    });
    if (!claimed.count) {
      return successResponse({ storyId, status: 'generating' }, '故事生成任务已被其他请求启动');
    }

    void generateStoryInBackground(storyId, userId);
    return new Response(JSON.stringify({
      success: true,
      code: 202,
      message: '故事生成任务已启动',
      data: { storyId, status: 'generating' },
      timestamp: new Date().toISOString(),
    }), { status: 202, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('故事生成任务启动失败', { stage: 'claim', error });
    return errorResponse('启动故事生成失败', 500);
  }
}

async function generateStoryInBackground(storyId: number, userId: string) {
  const startedAt = Date.now();
  try {
    const story = await findOwnedStory(storyId, userId);
    if (!story) throw new Error('STORY_NOT_FOUND');
    const prompt = await buildPrompt(story);
    const rawContent = await callAIWithRetry(prompt, 3);
    const { displayText, ttsScript, sourceFormat } = splitStoryFormats(rawContent);
    const extData = parseExtData(story.extData);
    await prisma.story.update({
      where: { id: storyId },
      data: {
        content: displayText,
        extData: JSON.stringify({
          ...extData,
          generationStatus: 'completed',
          generationError: undefined,
          generationCompletedAt: new Date().toISOString(),
          contentFormat: 'plain',
          ttsFormat: ttsScript ? 'script' : 'plain',
          ttsScript,
        }),
      },
    });
    await createOperationEvent({
      eventType: OPERATION_EVENT_TYPES.STORY_GENERATE_SUCCESS,
      userId,
      storyId,
      metadata: {
        generationMode: story.customization ? 'customized' : parseExtData(story.extData).generationMode,
        sourceFormat,
        contentLength: displayText.length,
        durationMs: Date.now() - startedAt,
      },
    });
    console.info('故事生成完成', { storyId, stage: 'completed', durationMs: Date.now() - startedAt });
  } catch (error) {
    const errorCode = error instanceof Error && error.message === 'STORY_NOT_FOUND'
      ? 'STORY_NOT_FOUND'
      : 'GENERATION_PROVIDER_FAILED';
    await updateStoryStatus(storyId, 'failed', '故事生成暂时失败，请稍后重试');
    await createOperationEvent({
      eventType: OPERATION_EVENT_TYPES.STORY_GENERATE_FAILED,
      userId,
      storyId,
      metadata: { errorCode, durationMs: Date.now() - startedAt },
    });
    console.error('故事生成失败', { storyId, stage: 'generate', errorCode, error });
  }
}

async function buildPrompt(story: Awaited<ReturnType<typeof findOwnedStory>>) {
  if (!story) throw new Error('STORY_NOT_FOUND');
  if (story.customization) {
    const child = parseJson<ChildSnapshot>(story.customization.childSnapshotJson);
    const world = parseJson<DreamWorldSnapshot>(story.customization.dreamWorldSnapshotJson);
    const tonight = story.customization.tonightMaterialText
      ? `${story.customization.tonightMaterialIntent || '今晚小事'}：${story.customization.tonightMaterialText}`
      : '无，由故事自然展开。';
    return [
      '你是一位专业的儿童睡前故事作家。请只输出故事正文，分段清晰。',
      `主角：${child.nickname}（${child.ageLabel}，${child.roleLabel}，${child.traitLabels.join('、')}）`,
      `伙伴：${child.partner.name}`,
      `梦境世界：${world.name}。${world.ageSetting}`,
      `世界规则：${world.worldView}`,
      `情绪走向：${world.emotionalArc}`,
      `故事骨架参考：${world.ageSkeleton || world.storySkeleton || ''}`,
      `成长主题：${story.customization.growthTheme}`,
      `今晚小事：${tonight}`,
      `安全规则：${world.safetyGuideline}；适龄、低刺激、温柔收束，不做心理诊断或医疗承诺。`,
      `篇幅：不超过 ${story.wordLimit} 字。成长主题和今晚小事通过情节自然呈现，不直接说教。`,
      `必须用名字“${child.nickname}”称呼主角，不使用“你”代称孩子。`,
    ].join('\n');
  }

  const extData = parseExtData(story.extData);
  const sourceStoryId = Number(extData.sourceStoryId);
  if (Number.isInteger(sourceStoryId) && sourceStoryId > 0) {
    const source = await prisma.story.findFirst({
      where: {
        id: sourceStoryId,
        OR: [{ visibility: StoryVisibility.PUBLIC }, { userId: story.userId }],
      },
      select: { content: true },
    });
    if (!source?.content) throw new Error('SOURCE_STORY_NOT_FOUND');
    return [
      '你是一位擅长儿童故事连续性的作家，请创作原故事的续集，只输出正文。',
      `年龄段：${story.ageGroup}`,
      `成长主题：${story.customTheme || story.classicTheme || '安心入睡'}`,
      `人物设定：${story.characterSettings}`,
      `原故事正文：${source.content.slice(0, 2200)}`,
      '要求：承接前作结尾，保持人物和世界观一致；加入一个新的温和目标；结尾回归平静入睡。',
    ].join('\n');
  }

  return [
    '你是一位专业的儿童睡前故事作家。请只输出故事正文，分段清晰。',
    `年龄段：${story.ageGroup}`,
    `成长主题：${story.customTheme || story.classicTheme || '安心入睡'}`,
    `人物设定：${story.characterSettings}`,
    `篇幅：不超过 ${story.wordLimit} 字。`,
    '要求：适龄、低刺激、积极温暖；主题通过剧情体现；结尾放缓节奏并引导入睡。',
  ].join('\n');
}

async function updateStoryStatus(storyId: number, status: GenerationStatus, errorMessage?: string) {
  const story = await prisma.story.findUnique({ where: { id: storyId }, select: { extData: true } });
  if (!story) return;
  const extData = parseExtData(story.extData);
  await prisma.story.update({
    where: { id: storyId },
    data: {
      extData: JSON.stringify({
        ...extData,
        generationStatus: status,
        generationError: errorMessage,
        ...(status === 'failed' ? { generationFailedAt: new Date().toISOString() } : {}),
      }),
    },
  });
}

async function callAIWithRetry(prompt: string, maxRetries: number) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await callDeepSeekAPI(prompt);
    } catch (error) {
      lastError = error;
      console.warn('故事生成服务调用失败', { attempt, maxRetries, stage: 'provider_call' });
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('GENERATION_PROVIDER_FAILED');
}

async function callDeepSeekAPI(prompt: string) {
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY_NOT_CONFIGURED');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`DEEPSEEK_HTTP_${response.status}`);
    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error(data.error?.message || 'DEEPSEEK_EMPTY_RESPONSE');
    return content;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('DEEPSEEK_TIMEOUT');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
