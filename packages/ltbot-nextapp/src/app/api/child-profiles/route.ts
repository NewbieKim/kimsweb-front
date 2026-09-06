import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createdResponse, errorResponse, successResponse, validationErrorResponse } from '@/lib/response';
import { ContentValidationError, parsePartner, validateChildProfileInput } from '@/lib/story-customization/validation';

function toProfileDto(profile: {
  id: number;
  avatarId: string;
  nickname: string;
  ageGroup: string;
  role: string;
  traitsJson: string;
  partnerJson: string;
  sequenceCounter: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { stories: number };
}) {
  return {
    id: profile.id,
    avatarId: profile.avatarId,
    nickname: profile.nickname,
    ageGroup: profile.ageGroup,
    role: profile.role,
    traitIds: JSON.parse(profile.traitsJson) as string[],
    partner: parsePartner(profile.partnerJson),
    sequenceCounter: profile.sequenceCounter,
    completedStoryCount: profile._count.stories,
    deletedAt: profile.deletedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);

  try {
    const includeDeleted = new URL(request.url).searchParams.get('includeDeleted') === 'true';
    const profiles = await prisma.childProfile.findMany({
      where: { userId, ...(includeDeleted ? {} : { deletedAt: null }) },
      include: {
        _count: { select: { stories: { where: { content: { not: null } } } } },
      },
      orderBy: [{ deletedAt: 'asc' }, { updatedAt: 'desc' }],
    });
    return successResponse(profiles.map(toProfileDto), '获取孩子档案成功');
  } catch (error) {
    console.error('孩子档案列表查询失败', { userId, stage: 'query', error });
    return errorResponse('获取孩子档案失败', 500);
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return errorResponse('请先登录', 401);

  try {
    const input = validateChildProfileInput(await request.json());
    const profile = await prisma.childProfile.create({
      data: {
        userId,
        avatarId: input.avatarId,
        nickname: input.nickname,
        ageGroup: input.ageGroup,
        role: input.role,
        traitsJson: JSON.stringify(input.traitIds),
        partnerJson: JSON.stringify(input.partner),
      },
      include: { _count: { select: { stories: true } } },
    });
    return createdResponse(toProfileDto(profile), '孩子档案已保存');
  } catch (error) {
    if (error instanceof ContentValidationError) {
      return validationErrorResponse(error.message, {
        errorCode: 'CONTENT_BLOCKED',
        field: error.field,
        category: error.category,
      });
    }
    console.error('孩子档案创建失败', { userId, stage: 'create', error });
    return errorResponse('保存孩子档案失败', 500);
  }
}
