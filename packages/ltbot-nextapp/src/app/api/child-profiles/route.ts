import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createdResponse, errorResponse, successResponse, validationErrorResponse } from '@/lib/response';
import { findPetDefinition } from '@/lib/pets/catalog';
import { EMPTY_NUTRIENTS } from '@/lib/habits/domain';
import { ContentValidationError, parsePartner, validateChildProfileInput, validatePetName } from '@/lib/story-customization/validation';

function toProfileDto(profile: {
  id: number;
  avatarId: string;
  nickname: string;
  ageGroup: string;
  role: string;
  traitsJson: string;
  partnerJson: string;
  sequenceCounter: number;
  successfulStoryCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  pet?: { petKey: string; displayName: string } | null;
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
    completedStoryCount: profile.successfulStoryCount,
    pet: profile.pet || null,
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
      include: { pet: { select: { petKey: true, displayName: true } } },
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
    const body = await request.json();
    const input = validateChildProfileInput(body);
    const petKey = typeof body.petKey === 'string' ? body.petKey.trim() : '';
    const petDisplayName = typeof body.petDisplayName === 'string' ? body.petDisplayName : undefined;
    const definition = petKey ? findPetDefinition(petKey) : null;

    if (petKey && !definition) {
      return validationErrorResponse('请选择可领养的宠物', {
        errorCode: 'CONTENT_BLOCKED',
        field: 'petKey',
        category: 'FORMAT',
      });
    }

    const profile = await prisma.$transaction(async (tx) => {
      let enabledDefinition = null as { assetVersion: number } | null;
      if (petKey && definition) {
        enabledDefinition = await tx.petDefinition.findFirst({ where: { petKey, enabled: true } });
        if (!enabledDefinition) {
          throw new ContentValidationError('这位宠物暂不可领养', 'petKey', 'FORMAT');
        }
      }

      const created = await tx.childProfile.create({
        data: {
          userId,
          avatarId: input.avatarId,
          nickname: input.nickname,
          ageGroup: input.ageGroup,
          role: input.role,
          traitsJson: JSON.stringify(input.traitIds),
          partnerJson: JSON.stringify(input.partner),
        },
      });

      if (petKey && definition && enabledDefinition) {
        await tx.childPet.create({
          data: {
            childProfileId: created.id,
            petKey,
            displayName: petDisplayName ? validatePetName(petDisplayName) : definition.name,
            personalityKey: definition.personalityKey,
            assetVersion: enabledDefinition.assetVersion,
            growth: { create: { nutrientStateJson: JSON.stringify(EMPTY_NUTRIENTS) } },
          },
        });
      }

      return tx.childProfile.findUniqueOrThrow({
        where: { id: created.id },
        include: { pet: { select: { petKey: true, displayName: true } } },
      });
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
