import { errorResponse, badRequestResponse } from '@/lib/response';
import { getHabitDashboard, saveHabitPlan } from '@/lib/habits/service';
import { habitFailure, habitSuccess, parsePositiveId, requireUserId } from '@/lib/habits/http';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('档案 ID 无效');
  try {
    return habitSuccess(await getHabitDashboard(userId, id), '获取今日习惯成功');
  } catch (error) {
    return habitFailure(error, { action: 'get_habits', userId, childProfileId: id });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('档案 ID 无效');
  try {
    return habitSuccess(await saveHabitPlan(userId, id, await request.json()), '习惯计划已保存');
  } catch (error) {
    return habitFailure(error, { action: 'save_habits', userId, childProfileId: id });
  }
}
