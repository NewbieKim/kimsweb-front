import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { badRequestResponse, errorResponse, notFoundResponse, successResponse } from '@/lib/response';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return badRequestResponse('档案 ID 无效');

  try {
    const result = await prisma.childProfile.updateMany({
      where: { id, userId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    if (!result.count) return notFoundResponse('孩子档案不存在或无需恢复');
    return successResponse(null, '孩子档案已恢复');
  } catch (error) {
    console.error('孩子档案恢复失败', { userId, profileId: id, stage: 'restore', error });
    return errorResponse('恢复孩子档案失败', 500);
  }
}
