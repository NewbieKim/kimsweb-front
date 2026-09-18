import { badRequestResponse, errorResponse } from '@/lib/response';
import { habitFailure, habitSuccess, parsePositiveId, requireUserId } from '@/lib/habits/http';
import { getLegacyHabitAssets } from '@/lib/habits/service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('档案 ID 无效');
  try { return habitSuccess(await getLegacyHabitAssets(userId, id), '旧成长档案（只读）'); }
  catch (error) { return habitFailure(error, { action: 'get_legacy_assets', userId, childProfileId: id }); }
}
