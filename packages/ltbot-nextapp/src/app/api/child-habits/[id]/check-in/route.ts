import { badRequestResponse, errorResponse } from '@/lib/response';
import { checkInHabit } from '@/lib/habits/service';
import { habitFailure, habitSuccess, parsePositiveId, requireUserId } from '@/lib/habits/http';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('习惯 ID 无效');
  try {
    return habitSuccess(await checkInHabit(userId, id, await request.json()), '打卡成功');
  } catch (error) {
    return habitFailure(error, { action: 'check_in', userId, childHabitId: id });
  }
}
