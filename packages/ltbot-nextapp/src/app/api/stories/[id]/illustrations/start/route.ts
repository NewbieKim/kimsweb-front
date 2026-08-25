import { ensureAdminAuthorized } from '@/lib/admin-auth';
import { errorResponse, successResponse } from '@/lib/response';
import { startIllustrationPipeline } from '@/lib/illustration/service';
import { type StartIllustrationRequest } from '@/lib/illustration/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = ensureAdminAuthorized(request);
    if (authError) {
      return authError;
    }

    const { id } = await params;
    const parsedStoryId = parseInt(id);
    if (!Number.isInteger(parsedStoryId) || parsedStoryId <= 0) {
      return errorResponse('storyId 无效', 400);
    }

    const body = (await safeJson(request)) as Partial<StartIllustrationRequest>;

    const result = await startIllustrationPipeline({
      storyId: parsedStoryId,
      userId: body.userId,
      provider: body.provider,
      maxFrames: body.maxFrames,
      forceRegenerate: body.forceRegenerate,
      idempotencyKey: body.idempotencyKey,
      triggerSource: body.triggerSource,
    });

    return successResponse(result, '插画任务启动成功');
  } catch (error) {
    console.error('启动插画任务失败:', error);
    return errorResponse('启动插画任务失败', 500, error);
  }
}

async function safeJson(request: Request): Promise<Record<string, unknown>> {
  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new Error('请求体不是合法 JSON');
  }
}
