import { badRequestResponse, errorResponse } from '@/lib/response';
import { getCompanion, updateCompanion } from '@/lib/habits/service';
import { habitFailure, habitSuccess, parsePositiveId, requireUserId } from '@/lib/habits/http';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('档案 ID 无效');
  try {
    return habitSuccess(await getCompanion(userId, id), '获取伙伴档案成功');
  } catch (error) {
    return habitFailure(error, { action: 'get_companion', userId, childProfileId: id });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('档案 ID 无效');
  try {
    return habitSuccess(await updateCompanion(userId, id, await request.json()), '伙伴档案已更新');
  } catch (error) {
    return habitFailure(error, { action: 'update_companion', userId, childProfileId: id });
  }
}
