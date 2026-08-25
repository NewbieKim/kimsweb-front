import { errorResponse, successResponse } from '@/lib/response';
import { getIllustrationProgress } from '@/lib/illustration/service';
// GET 查询进度，支持 includeFailedFrames、includePrompt 查询参数。
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedStoryId = parseInt(id);
    if (!Number.isInteger(parsedStoryId) || parsedStoryId <= 0) {
      return errorResponse('storyId 无效', 400);
    }

    const { searchParams } = new URL(request.url);
    const includeFailedFrames = parseBooleanQuery(searchParams.get('includeFailedFrames'), true);
    const includePrompt = parseBooleanQuery(searchParams.get('includePrompt'), false);

    const result = await getIllustrationProgress(parsedStoryId, {
      storyId: parsedStoryId,
      includeFailedFrames,
      includePrompt,
    });

    return successResponse(result, '获取插画进度成功');
  } catch (error) {
    console.error('获取插画进度失败:', error);
    return errorResponse('获取插画进度失败', 500, error);
  }
}

function parseBooleanQuery(raw: string | null, defaultValue: boolean): boolean {
  if (raw === null) {
    return defaultValue;
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no') {
    return false;
  }
  return defaultValue;
}
