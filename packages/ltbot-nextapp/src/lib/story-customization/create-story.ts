import { Prisma, StoryVisibility, ThemeType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CHILD_AGE_GROUPS, findCatalogItem, findScene } from './catalog';
import type { ChildProfileInput, DreamWorldSnapshot } from './types';
import {
  ContentValidationError,
  resolveChildSnapshot,
  validateChildProfileInput,
  validateGrowthTheme,
  validateTonightMaterial,
} from './validation';

interface CustomizedStoryRequest {
  childProfileId?: unknown;
  childOverrides?: unknown;
  dreamWorldId?: unknown;
  sceneId?: unknown;
  growthTheme?: unknown;
  tonightMaterial?: unknown;
}

const WORD_LIMIT_BY_AGE: Record<string, number> = {
  '0-2': 280,
  '2-4': 420,
  '4-6': 650,
  '6-8': 900,
};

function assertCreationKey(raw: string | null) {
  const key = raw?.trim() || '';
  if (key.length < 16 || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    throw new ContentValidationError('缺少有效的 Idempotency-Key', 'Idempotency-Key', 'FORMAT');
  }
  return key;
}

function profileToInput(profile: {
  avatarId: string;
  nickname: string;
  ageGroup: string;
  role: string;
  traitsJson: string;
  partnerJson: string;
}): ChildProfileInput {
  return validateChildProfileInput({
    avatarId: profile.avatarId,
    nickname: profile.nickname,
    ageGroup: profile.ageGroup,
    role: profile.role,
    traitIds: JSON.parse(profile.traitsJson) as string[],
    partner: JSON.parse(profile.partnerJson) as unknown,
  });
}

export async function createCustomizedStory(
  userId: string,
  rawKey: string | null,
  request: CustomizedStoryRequest,
) {
  const requestKey = `${userId}:${assertCreationKey(rawKey)}`;
  const childProfileId = Number(request.childProfileId);
  if (!Number.isInteger(childProfileId) || childProfileId <= 0) {
    throw new ContentValidationError('请选择孩子档案', 'childProfileId', 'FORMAT');
  }

  const existing = await prisma.storyCustomization.findUnique({
    where: { creationKey: requestKey },
    include: { story: true },
  });
  if (existing?.story.userId === userId) return { story: existing.story, duplicated: true };

  const profile = await prisma.childProfile.findFirst({
    where: { id: childProfileId, userId, deletedAt: null },
  });
  if (!profile) throw new ContentValidationError('孩子档案不存在或已删除', 'childProfileId', 'FORMAT');

  const childInput = request.childOverrides
    ? validateChildProfileInput(request.childOverrides)
    : profileToInput(profile);
  const childSnapshot = resolveChildSnapshot(childInput);
  const growthTheme = validateGrowthTheme(request.growthTheme);
  const tonightMaterial = validateTonightMaterial(request.tonightMaterial);
  const sceneId = typeof request.sceneId === 'string'
    ? request.sceneId
    : typeof request.dreamWorldId === 'string'
      ? request.dreamWorldId
      : '';
  const dreamWorld = findScene(sceneId);
  if (!dreamWorld) throw new ContentValidationError('请选择梦境场景', 'sceneId', 'FORMAT');
  const age = findCatalogItem(CHILD_AGE_GROUPS, childSnapshot.ageGroup)!;
  const dreamSnapshot: DreamWorldSnapshot = {
    sceneId: dreamWorld.id,
    categoryId: dreamWorld.categoryId,
    catalogVersion: dreamWorld.catalogVersion,
    name: dreamWorld.name,
    emoji: dreamWorld.emoji,
    coverImage: dreamWorld.coverImage,
    briefDescription: dreamWorld.description,
    ageSetting: dreamWorld.settings[age.id],
    ageSkeleton: dreamWorld.skeletons[age.id],
    worldView: dreamWorld.worldView,
    emotionalArc: dreamWorld.emotionalArc,
    safetyGuideline: dreamWorld.safetyGuideline,
  };
  const characterDescription = `${childSnapshot.nickname}，${childSnapshot.roleLabel}，性格偏${childSnapshot.traitLabels.join('、')}，年龄段${childSnapshot.ageLabel}，好伙伴是${childSnapshot.partner.name}。`;

  try {
    const story = await prisma.$transaction(async (tx) => {
      const increment = await tx.childProfile.updateMany({
        where: { id: childProfileId, userId, deletedAt: null },
        data: { sequenceCounter: { increment: 1 } },
      });
      if (!increment.count) throw new ContentValidationError('孩子档案不存在或已删除', 'childProfileId', 'FORMAT');
      const currentProfile = await tx.childProfile.findUniqueOrThrow({ where: { id: childProfileId } });
      const sequenceNumber = currentProfile.sequenceCounter;
      return tx.story.create({
        data: {
          userId,
          childProfileId,
          visibility: StoryVisibility.PRIVATE,
          ageGroup: childSnapshot.ageLabel,
          themeType: ThemeType.CUSTOM,
          customTheme: growthTheme,
          characterSettings: JSON.stringify({ description: characterDescription }),
          wordLimit: WORD_LIMIT_BY_AGE[childSnapshot.ageGroup] || 650,
          extData: JSON.stringify({
            generationStatus: 'pending',
            generationMode: 'customized',
            generationCreatedAt: new Date().toISOString(),
          }),
          customization: {
            create: {
              schemaVersion: 2,
              sequenceNumber,
              childSnapshotJson: JSON.stringify(childSnapshot),
              dreamWorldSnapshotJson: JSON.stringify(dreamSnapshot),
              growthTheme,
              tonightMaterialIntent: tonightMaterial?.intent || null,
              tonightMaterialText: tonightMaterial?.text || null,
              creationKey: requestKey,
            },
          },
        },
      });
    });
    return { story, duplicated: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const duplicate = await prisma.storyCustomization.findUnique({
        where: { creationKey: requestKey },
        include: { story: true },
      });
      if (duplicate?.story.userId === userId) return { story: duplicate.story, duplicated: true };
    }
    throw error;
  }
}
