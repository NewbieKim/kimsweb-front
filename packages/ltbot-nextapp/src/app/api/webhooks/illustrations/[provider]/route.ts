import { errorResponse, successResponse } from '@/lib/response';
import { processIllustrationWebhook } from '@/lib/illustration/service';
import { type IllustrationWebhookPayload } from '@/lib/illustration/types';

// POST 接收供应商回调，读取 x-illustration-signature（或 x-signature），委托 service 处理状态推进。
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const signature =
      request.headers.get('x-illustration-signature') ||
      request.headers.get('x-signature');

    const rawBody = await request.text();
    if (!rawBody.trim()) {
      return errorResponse('请求体不能为空', 400);
    }

    let payload: IllustrationWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as IllustrationWebhookPayload;
    } catch {
      return errorResponse('请求体不是合法 JSON', 400);
    }

    const result = await processIllustrationWebhook({
      providerFromPath: provider,
      payload,
      rawBody,
      signature,
    });

    return successResponse(result, '插画回调处理成功');
  } catch (error) {
    console.error('处理插画回调失败:', error);
    return errorResponse('处理插画回调失败', 500, error);
  }
}
