import { badRequestResponse, errorResponse } from '@/lib/response';
import { getHabitHistory } from '@/lib/habits/service';
import { habitFailure, habitSuccess, parsePositiveId, requireUserId } from '@/lib/habits/http';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('档案 ID 无效');
  try {
    const month = new URL(request.url).searchParams.get('month');
    return habitSuccess(await getHabitHistory(userId, id, month), '获取习惯历史成功');
  } catch (error) {
    return habitFailure(error, { action: 'habit_history', userId, childProfileId: id });
  }
}
