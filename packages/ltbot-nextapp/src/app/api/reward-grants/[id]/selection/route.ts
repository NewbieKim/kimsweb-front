import { badRequestResponse, errorResponse } from '@/lib/response';
import { selectReward } from '@/lib/habits/service';
import { habitFailure, habitSuccess, parsePositiveId, requireUserId } from '@/lib/habits/http';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('奖励 ID 无效');
  try {
    return habitSuccess(await selectReward(userId, id, await request.json()), '食物卡已放入背包');
  } catch (error) {
    return habitFailure(error, { action: 'select_reward', userId, grantId: id });
  }
}
