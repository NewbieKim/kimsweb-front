import { errorResponse } from '@/lib/response';
import { habitSuccess, requireUserId } from '@/lib/habits/http';
import { listPetCatalog } from '@/lib/habits/service';

export async function GET() {
  if (!await requireUserId()) return errorResponse('请先登录', 401);
  return habitSuccess(await listPetCatalog(), '宠物图鉴');
}
