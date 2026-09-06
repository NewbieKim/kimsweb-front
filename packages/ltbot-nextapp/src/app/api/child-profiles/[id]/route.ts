import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { badRequestResponse, errorResponse, notFoundResponse, successResponse, validationErrorResponse } from '@/lib/response';
import { ContentValidationError, parsePartner, validateChildProfileInput } from '@/lib/story-customization/validation';

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parseId((await params).id);
  if (!id) return badRequestResponse('档案 ID 无效');

  try {
    const existing = await prisma.childProfile.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) return notFoundResponse('孩子档案不存在');
    const input = validateChildProfileInput(await request.json());
    const profile = await prisma.childProfile.update({
      where: { id },
      data: {
        avatarId: input.avatarId,
        nickname: input.nickname,
        ageGroup: input.ageGroup,
        role: input.role,
        traitsJson: JSON.stringify(input.traitIds),
        partnerJson: JSON.stringify(input.partner),
      },
    });
    return successResponse({
      id: profile.id,
      avatarId: profile.avatarId,
      nickname: profile.nickname,
      ageGroup: profile.ageGroup,
      role: profile.role,
      traitIds: JSON.parse(profile.traitsJson) as string[],
      partner: parsePartner(profile.partnerJson),
      sequenceCounter: profile.sequenceCounter,
      deletedAt: profile.deletedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }, '孩子档案已更新');
  } catch (error) {
    if (error instanceof ContentValidationError) {
      return validationErrorResponse(error.message, {
        errorCode: 'CONTENT_BLOCKED', field: error.field, category: error.category,
      });
    }
    console.error('孩子档案更新失败', { userId, profileId: id, stage: 'update', error });
    return errorResponse('更新孩子档案失败', 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);
  const id = parseId((await params).id);
  if (!id) return badRequestResponse('档案 ID 无效');

  try {
    const result = await prisma.childProfile.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count) return notFoundResponse('孩子档案不存在');
    return successResponse(null, '孩子档案已删除，历史故事不受影响');
  } catch (error) {
    console.error('孩子档案删除失败', { userId, profileId: id, stage: 'soft_delete', error });
    return errorResponse('删除孩子档案失败', 500);
  }
}
