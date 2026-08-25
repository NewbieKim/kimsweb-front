import { createHmac, timingSafeEqual } from 'crypto';
import {
  FailReasonCode,
  IllustrationFrameStatus,
  IllustrationJobStatus,
  ProviderType,
  Prisma,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getIllustrationProviderAdapter } from './provider-adapters';
import {
  type IllustrationProgressQuery,
  type IllustrationProgressResponse,
  type IllustrationWebhookPayload,
  type StartIllustrationRequest,
  PROVIDER_TYPES,
} from './types';

type StartPipelineResult = {
  jobId: number | null;
  status: IllustrationJobStatus;
  target: number;
  generated: number;
  skippedReason?: string;
};

type WebhookResult = {
  storyId: number;
  jobId: number;
  frameIndex: number;
  frameStatus: IllustrationFrameStatus;
  jobStatus: IllustrationJobStatus;
  generated: number;
  target: number;
};

type IllustrationFeatureFlags = {
  enabled: boolean;
  internalStartEnabled: boolean;
  webhookEnabled: boolean;
};

const ACTIVE_JOB_STATUS: IllustrationJobStatus[] = [
  IllustrationJobStatus.PENDING,
  IllustrationJobStatus.RUNNING,
];

const TERMINAL_FRAME_STATUS: IllustrationFrameStatus[] = [
  IllustrationFrameStatus.SUCCEEDED,
  IllustrationFrameStatus.FAILED,
  IllustrationFrameStatus.CANCELLED,
];

// 创建主任务 + 分镜任务，支持幂等键、活跃任务复用、3~10 帧 clamp、故事状态快照回写。
export async function startIllustrationPipeline(
  input: StartIllustrationRequest
): Promise<StartPipelineResult> {
  const storyId = toPositiveInt(input.storyId);
  if (!storyId) {
    throw new Error('storyId 无效');
  }

  const flags = readFeatureFlags(); // 读取 feature flag，默认开启所有功能。
  if (!flags.enabled || !flags.internalStartEnabled) {
    await prisma.story.update({
      where: { id: storyId },
      data: {
        illustrationStatus: IllustrationJobStatus.SKIPPED, // 更新故事状态为 SKIPPED。
      },
    });
    return {
      jobId: null,
      status: IllustrationJobStatus.SKIPPED, // 返回 SKIPPED 状态。
      target: 0, // 目标帧数为 0。
      generated: 0, // 已生成帧数为 0。
      skippedReason: 'feature_disabled', // 跳过原因：功能未开启。
    };
  }

  const provider = normalizeProvider(input.provider); // 规范化 provider，默认 BYTEPLUS。
  ensureProviderAllowed(provider); // 确保 provider 在允许列表中。

  const pipelineResult = await prisma.$transaction(async (tx) => {
    const story = await tx.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        userId: true,
        content: true,
        wordLimit: true,
      },
    });
    if (!story) {
      throw new Error('故事不存在');
    }

    if (input.idempotencyKey?.trim()) {
      const existingByIdempotency = await tx.storyIllustrationJob.findUnique({
        where: { idempotencyKey: input.idempotencyKey.trim() },
      });
      if (existingByIdempotency) {
        return {
          jobId: existingByIdempotency.id,
          status: existingByIdempotency.status,
          target: existingByIdempotency.targetFrameCount,
          generated: existingByIdempotency.generatedFrameCount,
        };
      }
    }

    const existingActiveJob = await tx.storyIllustrationJob.findFirst({
      where: {
        storyId,
        status: {
          in: ACTIVE_JOB_STATUS,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingActiveJob && !input.forceRegenerate) {
      return {
        jobId: existingActiveJob.id,
        status: existingActiveJob.status,
        target: existingActiveJob.targetFrameCount,
        generated: existingActiveJob.generatedFrameCount,
      };
    }

    const targetFrameCount = resolveTargetFrameCount(story, input.maxFrames);
    const now = new Date();
    const idempotencyKey = input.idempotencyKey?.trim() || buildIdempotencyKey(storyId);

    const job = await tx.storyIllustrationJob.create({
      data: {
        storyId,
        userId: input.userId?.trim() || story.userId,
        status: IllustrationJobStatus.RUNNING,
        provider,
        targetFrameCount,
        generatedFrameCount: 0,
        successFrameCount: 0,
        failedFrameCount: 0,
        idempotencyKey,
        startedAt: now,
      },
    });

    const frameCreateData: Prisma.StoryIllustrationFrameCreateManyInput[] = [];
    for (let frameIndex = 0; frameIndex < targetFrameCount; frameIndex += 1) {
      frameCreateData.push({
        storyId,
        jobId: job.id,
        frameIndex,
        status:
          frameIndex === 0
            ? IllustrationFrameStatus.PROCESSING
            : IllustrationFrameStatus.PENDING,
        provider,
        providerTaskId: `${job.id}-${frameIndex}`,
        failReasonCode: FailReasonCode.NONE,
        startedAt: frameIndex === 0 ? now : null,
      });
    }
    await tx.storyIllustrationFrame.createMany({
      data: frameCreateData,
    });

    await tx.story.update({
      where: { id: storyId },
      data: {
        illustrationStatus: IllustrationJobStatus.RUNNING,
        illustrationTargetFrames: targetFrameCount,
        illustrationGeneratedFrames: 0,
        illustrationLastJobId: job.id,
        illustrationStartedAt: now,
        illustrationCompletedAt: null,
      },
    });

    return {
      jobId: job.id,
      status: job.status,
      target: job.targetFrameCount,
      generated: job.generatedFrameCount,
    };
  });

  if (
    pipelineResult.jobId &&
    pipelineResult.status === IllustrationJobStatus.RUNNING
  ) {
    await dispatchProviderGeneration(pipelineResult.jobId);
  }

  return pipelineResult;
}

// 处理回调并推进分镜/任务状态，聚合成功/失败计数，任务终态收敛（SUCCEEDED/FAILED/PARTIAL_SUCCESS），首帧成功自动回填 story.coverImage。
export async function processIllustrationWebhook(params: {
  providerFromPath: string;
  payload: IllustrationWebhookPayload;
  rawBody: string;
  signature: string | null;
}): Promise<WebhookResult> {
  const flags = readFeatureFlags();
  if (!flags.enabled || !flags.webhookEnabled) {
    throw new Error('webhook 功能未开启');
  }

  const providerFromPath = normalizeProviderFromString(params.providerFromPath);
  const providerFromPayload = normalizeProvider(params.payload.provider);
  if (providerFromPath !== providerFromPayload) {
    throw new Error('provider 不匹配');
  }

  verifyWebhookSignatureIfNeeded(params.rawBody, params.signature);

  const frameStatus = mapWebhookStatus(params.payload.status);
  const failReasonCode = mapFailReasonCode(params.payload.errorCode);
  const finishedAt = parseOptionalDate(params.payload.finishedAt);
  const callbackAt = new Date();

  return prisma.$transaction(async (tx) => {
    const frame = await tx.storyIllustrationFrame.findUnique({
      where: {
        jobId_frameIndex: {
          jobId: params.payload.jobId,
          frameIndex: params.payload.frameIndex,
        },
      },
      include: {
        job: true,
      },
    });

    if (!frame) {
      throw new Error('插画分镜不存在');
    }

    const updatedFrame = await tx.storyIllustrationFrame.update({
      where: { id: frame.id },
      data: {
        status: frameStatus,
        providerTaskId: params.payload.providerTaskId || frame.providerTaskId,
        imageUrl: params.payload.imageUrl || null,
        imageWidth: params.payload.width ?? null,
        imageHeight: params.payload.height ?? null,
        failReasonCode,
        failReasonMessage: params.payload.errorMessage || null,
        callbackAt,
        completedAt:
          frameStatus === IllustrationFrameStatus.SUCCEEDED ||
          frameStatus === IllustrationFrameStatus.FAILED
            ? finishedAt || callbackAt
            : null,
        extData:
          params.payload.rawPayload === undefined
            ? frame.extData
            : safeJsonStringify(params.payload.rawPayload),
      },
    });

    const [successFrameCount, failedFrameCount, terminalFrameCount, totalFrameCount] =
      await Promise.all([
        tx.storyIllustrationFrame.count({
          where: {
            jobId: frame.jobId,
            status: IllustrationFrameStatus.SUCCEEDED,
          },
        }),
        tx.storyIllustrationFrame.count({
          where: {
            jobId: frame.jobId,
            status: IllustrationFrameStatus.FAILED,
          },
        }),
        tx.storyIllustrationFrame.count({
          where: {
            jobId: frame.jobId,
            status: {
              in: TERMINAL_FRAME_STATUS,
            },
          },
        }),
        tx.storyIllustrationFrame.count({
          where: {
            jobId: frame.jobId,
          },
        }),
      ]);

    const now = new Date();
    const isCompleted = totalFrameCount > 0 && terminalFrameCount >= totalFrameCount;
    const nextJobStatus = resolveJobStatus(successFrameCount, failedFrameCount, isCompleted);

    await tx.storyIllustrationJob.update({
      where: { id: frame.jobId },
      data: {
        status: nextJobStatus,
        generatedFrameCount: terminalFrameCount,
        successFrameCount,
        failedFrameCount,
        failReasonCode:
          nextJobStatus === IllustrationJobStatus.FAILED
            ? failReasonCode
            : FailReasonCode.NONE,
        failReasonMessage:
          nextJobStatus === IllustrationJobStatus.FAILED
            ? params.payload.errorMessage || null
            : null,
        lastCallbackAt: callbackAt,
        completedAt: isCompleted ? now : null,
      },
    });

    const storyUpdateData: Prisma.StoryUpdateInput = {
      illustrationStatus: nextJobStatus,
      illustrationGeneratedFrames: terminalFrameCount,
      illustrationTargetFrames: totalFrameCount,
      illustrationLastJobId: frame.jobId,
      illustrationCompletedAt: isCompleted ? now : null,
    };
    if (updatedFrame.frameIndex === 0 && updatedFrame.imageUrl) {
      storyUpdateData.coverImage = updatedFrame.imageUrl;
    }

    await tx.story.update({
      where: { id: frame.storyId },
      data: storyUpdateData,
    });

    return {
      storyId: frame.storyId,
      jobId: frame.jobId,
      frameIndex: frame.frameIndex,
      frameStatus,
      jobStatus: nextJobStatus,
      generated: terminalFrameCount,
      target: totalFrameCount,
    };
  });
}

// 查询故事插画进度，支持失败帧过滤、封面帧快照、状态快照聚合。
export async function getIllustrationProgress(
  storyIdRaw: number,
  query: IllustrationProgressQuery
): Promise<IllustrationProgressResponse> {
  const storyId = toPositiveInt(storyIdRaw);
  if (!storyId) {
    throw new Error('storyId 无效');
  }

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: {
      id: true,
      illustrationLastJobId: true,
      illustrationStatus: true,
      illustrationGeneratedFrames: true,
      illustrationTargetFrames: true,
      updatedAt: true,
    },
  });

  if (!story) {
    throw new Error('故事不存在');
  }

  const job = story.illustrationLastJobId
    ? await prisma.storyIllustrationJob.findUnique({
        where: { id: story.illustrationLastJobId },
        include: {
          frames: {
            orderBy: { frameIndex: 'asc' },
          },
        },
      })
    : await prisma.storyIllustrationJob.findFirst({
        where: { storyId },
        orderBy: { createdAt: 'desc' },
        include: {
          frames: {
            orderBy: { frameIndex: 'asc' },
          },
        },
      });

  const includeFailedFrames = query.includeFailedFrames ?? true;
  const frames =
    job?.frames
      .filter((frame) => includeFailedFrames || frame.status !== IllustrationFrameStatus.FAILED)
      .map((frame) => ({
        frameIndex: frame.frameIndex,
        status: frame.status,
        imageUrl: frame.imageUrl,
        failReasonCode: frame.failReasonCode,
        failReasonMessage: frame.failReasonMessage,
        caption: frame.caption,
        width: frame.imageWidth,
        height: frame.imageHeight,
        updatedAt: frame.updatedAt.toISOString(),
      })) ?? [];

  const coverFrame = frames.find((frame) => frame.frameIndex === 0);
  const updatedAt = job?.updatedAt || story.updatedAt;

  return {
    storyId,
    jobId: job?.id ?? null,
    status: job?.status ?? story.illustrationStatus ?? IllustrationJobStatus.PENDING,
    generated: job?.generatedFrameCount ?? story.illustrationGeneratedFrames ?? 0,
    target: job?.targetFrameCount ?? story.illustrationTargetFrames ?? 0,
    coverFrameIndex: 0,
    coverReady: coverFrame?.status === IllustrationFrameStatus.SUCCEEDED,
    frames,
    updatedAt: updatedAt.toISOString(),
  };
}

// 根据故事内容/字数估算分镜数，clamp 3~10 帧。
function resolveTargetFrameCount(
  story: { content: string | null; wordLimit: number },
  maxFrames?: number
): number {
  if (typeof maxFrames === 'number' && Number.isFinite(maxFrames)) {
    return clampFrameCount(maxFrames);
  }

  const contentLength = (story.content || '').trim().length;
  if (contentLength > 0) {
    const estimated = Math.ceil(contentLength / 140);
    return clampFrameCount(estimated);
  }

  const byWordLimit = Math.ceil(story.wordLimit / 120);
  return clampFrameCount(byWordLimit);
}

//  clamp 3~10 帧。
function clampFrameCount(value: number): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded)) return 3;
  return Math.min(10, Math.max(3, rounded));
}

// 构建幂等键，格式：storyId-timestamp。
function buildIdempotencyKey(storyId: number): string {
  return `${storyId}-${Date.now()}`;
}

function resolveJobStatus(
  successFrameCount: number,
  failedFrameCount: number,
  isCompleted: boolean
): IllustrationJobStatus {
  if (!isCompleted) {
    return IllustrationJobStatus.RUNNING;
  }
  if (failedFrameCount === 0) {
    return IllustrationJobStatus.SUCCEEDED;
  }
  if (successFrameCount === 0) {
    return IllustrationJobStatus.FAILED;
  }
  return IllustrationJobStatus.PARTIAL_SUCCESS;
}

// 映射回调状态到分镜状态，处理 SUCCESS/FAILED/PROCESSING。
function mapWebhookStatus(
  status: IllustrationWebhookPayload['status']
): IllustrationFrameStatus {
  if (status === 'SUCCESS') return IllustrationFrameStatus.SUCCEEDED;
  if (status === 'FAILED') return IllustrationFrameStatus.FAILED;
  return IllustrationFrameStatus.PROCESSING;
}

// 映射错误码到失败原因码，处理 TIMEOUT/RATE_LIMIT/QUOTA_EXCEEDED/SIGNATURE_INVALID/CALLBACK_MISSING/PROVIDER_REJECTED/INVALID_INPUT/INTERNAL_ERROR。
function mapFailReasonCode(errorCode?: string): FailReasonCode {
  const normalized = (errorCode || '').trim().toUpperCase();
  switch (normalized) {
    case 'TIMEOUT':
      return FailReasonCode.TIMEOUT;
    case 'RATE_LIMIT':
      return FailReasonCode.RATE_LIMIT;
    case 'QUOTA_EXCEEDED':
      return FailReasonCode.QUOTA_EXCEEDED;
    case 'SIGNATURE_INVALID':
      return FailReasonCode.SIGNATURE_INVALID;
    case 'CALLBACK_MISSING':
      return FailReasonCode.CALLBACK_MISSING;
    case 'PROVIDER_REJECTED':
      return FailReasonCode.PROVIDER_REJECTED;
    case 'INVALID_INPUT':
      return FailReasonCode.INVALID_INPUT;
    case 'INTERNAL_ERROR':
      return FailReasonCode.INTERNAL_ERROR;
    default:
      return FailReasonCode.NONE;
  }
}

// 验证 webhook 签名，如果配置了 secret 则必须匹配。
function verifyWebhookSignatureIfNeeded(rawBody: string, signature: string | null) {
  const secret = (process.env.ILLUSTRATION_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return;
  }

  if (!signature) {
    throw new Error('缺少 webhook 签名');
  }

  const normalizedSignature = signature.replace(/^sha256=/i, '').trim().toLowerCase();
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex').toLowerCase();

  const signatureBuffer = Buffer.from(normalizedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error('webhook 签名校验失败');
  }
}

// 读取 feature flag，默认开启所有功能。
function readFeatureFlags(): IllustrationFeatureFlags {
  return {
    enabled: readBooleanEnv('ILLUSTRATION_ENABLED', true),
    internalStartEnabled: readBooleanEnv('ILLUSTRATION_INTERNAL_START_ENABLED', true),
    webhookEnabled: readBooleanEnv('ILLUSTRATION_WEBHOOK_ENABLED', true),
  };
}

function ensureProviderAllowed(provider: ProviderType) {
  const rawAllowList = (process.env.ILLUSTRATION_PROVIDER_ALLOW_LIST || '').trim();
  if (!rawAllowList) {
    return;
  }

  const allowedProviders = rawAllowList
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  if (!allowedProviders.includes(provider)) {
    throw new Error(`provider ${provider} 不在允许列表`);
  }
}

function normalizeProvider(provider?: ProviderType): ProviderType {
  if (provider) {
    return provider;
  }
  const rawDefault = (process.env.ILLUSTRATION_DEFAULT_PROVIDER || '').trim();
  if (!rawDefault) {
    return inferDefaultProviderByKey();
  }
  return normalizeProviderFromString(rawDefault);
}

function inferDefaultProviderByKey(): ProviderType {
  const bytePlusKey = (process.env.ILLUSTRATION_BYTEPLUS_API_KEY || '').trim();
  if (bytePlusKey) {
    return ProviderType.BYTEPLUS;
  }
  const openAIKey = (
    process.env.ILLUSTRATION_OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  ).trim();
  if (openAIKey) {
    return ProviderType.OPENAI_IMAGE;
  }
  return ProviderType.BYTEPLUS;
}

function normalizeProviderFromString(provider: string): ProviderType {
  const upper = provider.trim().toUpperCase();
  if (upper in PROVIDER_TYPES) {
    return upper as ProviderType;
  }
  throw new Error(`未知 provider: ${provider}`);
}

// 读取环境变量，处理 1/0/true/false/yes/no 等布尔值。
function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const rawValue = process.env[name];
  if (rawValue === undefined) {
    return defaultValue;
  }
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }
  return defaultValue;
}

// 解析可选日期字符串，处理 null/undefined/ISO 格式。
function parseOptionalDate(raw?: string): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPositiveInt(value: unknown): number | null {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ raw: String(value) });
  }
}

async function dispatchProviderGeneration(jobId: number) {
  const job = await prisma.storyIllustrationJob.findUnique({
    where: { id: jobId },
    include: {
      story: {
        select: {
          id: true,
          ageGroup: true,
          themeType: true,
          classicTheme: true,
          classicSubTheme: true,
          customTheme: true,
          characterSettings: true,
          content: true,
        },
      },
      frames: {
        orderBy: { frameIndex: 'asc' },
      },
    },
  });

  if (!job) {
    throw new Error(`插画任务不存在: ${jobId}`);
  }

  const adapter = getIllustrationProviderAdapter(job.provider);

  const pendingFrames = job.frames.filter(
    (frame) =>
      frame.status === IllustrationFrameStatus.PENDING ||
      frame.status === IllustrationFrameStatus.PROCESSING
  );

  for (const frame of pendingFrames) {
    if (frame.status === IllustrationFrameStatus.PENDING) {
      await prisma.storyIllustrationFrame.update({
        where: { id: frame.id },
        data: {
          status: IllustrationFrameStatus.PROCESSING,
          startedAt: frame.startedAt || new Date(),
        },
      });
    }

    try {
      const generated = await adapter.generateFrame({
        prompt: buildFramePrompt(
          job.story,
          frame.frameIndex,
          job.targetFrameCount
        ),
        frameIndex: frame.frameIndex,
        jobId: job.id,
      });

      await processFrameResultAsWebhook({
        provider: job.provider,
        jobId: job.id,
        storyId: job.storyId,
        frameIndex: frame.frameIndex,
        providerTaskId: generated.providerTaskId,
        status: 'SUCCESS',
        imageUrl: generated.imageUrl,
      });
    } catch (error) {
      console.error(`提交/生成插画失败 job=${job.id} frame=${frame.frameIndex}`, error);
      await processFrameResultAsWebhook({
        provider: job.provider,
        jobId: job.id,
        storyId: job.storyId,
        frameIndex: frame.frameIndex,
        providerTaskId: frame.providerTaskId || `${job.id}-${frame.frameIndex}`,
        status: 'FAILED',
        errorCode: inferProviderErrorCode(error),
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function buildFramePrompt(
  story: {
    ageGroup: string;
    themeType: string;
    classicTheme: string | null;
    classicSubTheme: string | null;
    customTheme: string | null;
    characterSettings: string;
    content: string | null;
  },
  frameIndex: number,
  targetFrameCount: number
): string {
  const storyTheme =
    story.themeType === 'CLASSIC'
      ? `${story.classicTheme || ''}${story.classicSubTheme ? ` · ${story.classicSubTheme}` : ''}`.trim()
      : (story.customTheme || '').trim();
  const contentSnippet = (story.content || '').replace(/\s+/g, ' ').slice(0, 900);
  const shotLabel =
    frameIndex === 0
      ? '封面镜头'
      : `第 ${frameIndex + 1} 帧 / 共 ${targetFrameCount} 帧`;

  return [
    '你是儿童绘本插画师，请生成温暖、治愈、适合睡前故事的单张插画。',
    `年龄段：${story.ageGroup}`,
    `主题：${storyTheme || '温馨陪伴'}`,
    `镜头：${shotLabel}`,
    `人物设定：${story.characterSettings}`,
    contentSnippet ? `故事片段：${contentSnippet}` : '',
    '画面要求：高清，卡通绘本风，柔和光影，避免恐怖元素，避免文字水印。',
  ]
    .filter(Boolean)
    .join('\n');
}

async function processFrameResultAsWebhook(params: {
  provider: ProviderType;
  jobId: number;
  storyId: number;
  frameIndex: number;
  providerTaskId: string;
  status: IllustrationWebhookPayload['status'];
  imageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}) {
  const payload: IllustrationWebhookPayload = {
    provider: params.provider,
    providerTaskId: params.providerTaskId,
    storyId: params.storyId,
    jobId: params.jobId,
    frameIndex: params.frameIndex,
    status: params.status,
    imageUrl: params.imageUrl,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    finishedAt: new Date().toISOString(),
  };
  const rawBody = JSON.stringify(payload);

  const secret = (process.env.ILLUSTRATION_WEBHOOK_SECRET || '').trim();
  const signature = secret
    ? `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`
    : null;

  await processIllustrationWebhook({
    providerFromPath: params.provider,
    payload,
    rawBody,
    signature,
  });
}

function inferProviderErrorCode(error: unknown): string {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  const codeMatch = message.match(/code=(\d{5})/);
  const providerCode = codeMatch ? Number.parseInt(codeMatch[1], 10) : null;
  if (providerCode === 50429 || providerCode === 50430 || message.includes('429')) {
    return 'RATE_LIMIT';
  }
  if (providerCode === 50511 || providerCode === 50519) {
    return 'PROVIDER_REJECTED';
  }
  if (providerCode === 50412 || providerCode === 50413 || providerCode === 50411 || providerCode === 50518) {
    return 'INVALID_INPUT';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'TIMEOUT';
  }
  if (message.includes('rate limit')) {
    return 'RATE_LIMIT';
  }
  if (message.includes('quota')) {
    return 'QUOTA_EXCEEDED';
  }
  if (message.includes('invalid') || message.includes('400')) {
    return 'INVALID_INPUT';
  }
  if (message.includes('401') || message.includes('403') || message.includes('forbidden')) {
    return 'PROVIDER_REJECTED';
  }
  return 'INTERNAL_ERROR';
}
