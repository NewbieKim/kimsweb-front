import { badRequestResponse, errorResponse } from '@/lib/response';
import { revokeCheckIn } from '@/lib/habits/service';
import { habitFailure, habitSuccess, parsePositiveId, requireUserId } from '@/lib/habits/http';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parsePositiveId((await params).id);
  if (!id) return badRequestResponse('打卡记录 ID 无效');
  try {
    return habitSuccess(await revokeCheckIn(userId, id, await request.json()), '记录已撤销');
  } catch (error) {
    return habitFailure(error, { action: 'revoke', userId, checkInId: id });
  }
}
