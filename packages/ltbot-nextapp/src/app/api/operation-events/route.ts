import { badRequestResponse, createdResponse, errorResponse } from '@/lib/response';
import { createOperationEvent } from '@/lib/operation-event';

interface OperationEventRequestBody {
  eventType?: string;
  userId?: string;
  visitorId?: string;
  storyId?: number | string;
  metadata?: unknown;
}

/**
 * POST /api/operation-events
 * 轻量运营埋点入口
 */
export async function POST(request: Request) {
  try {
    const body: OperationEventRequestBody = await request.json();
    const eventType = body.eventType?.trim();

    if (!eventType) {
      return badRequestResponse('eventType 为必填项');
    }

    const storyId =
      body.storyId === undefined || body.storyId === null || body.storyId === ''
        ? null
        : Number(body.storyId);

    if (storyId !== null && !Number.isFinite(storyId)) {
      return badRequestResponse('storyId 必须为数字');
    }

    const event = await createOperationEvent({
      eventType,
      userId: body.userId,
      visitorId: body.visitorId,
      storyId,
      metadata: body.metadata,
    });

    return createdResponse(event, '埋点事件创建成功');
  } catch (error) {
    console.error('写入埋点事件失败:', error);
    return errorResponse('写入埋点事件失败', 500, error);
  }
}
