import { badRequestResponse, errorResponse } from '@/lib/response';
import { feedCompanion } from '@/lib/habits/service';
import { habitFailure, habitSuccess, parsePositiveId, requireUserId } from '@/lib/habits/http';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('档案 ID 无效');
  try {
    return habitSuccess(await feedCompanion(userId, id, await request.json()), '喂养成功');
  } catch (error) {
    return habitFailure(error, { action: 'feed', userId, childProfileId: id });
  }
}
