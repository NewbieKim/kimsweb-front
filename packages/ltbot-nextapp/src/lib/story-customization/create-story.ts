import { Prisma, StoryVisibility, ThemeType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { freezePetStorySnapshot } from '@/lib/pets/story-snapshot';
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
  includePet?: unknown;
}

export class PetAdoptionRequiredError extends Error {
  constructor(readonly childProfileId: number) {
    super('请先领养宠物，再带它一起探索；也可以关闭宠物选项');
    this.name = 'PetAdoptionRequiredError';
  }
}

const WORD_LIMIT_BY_AGE: Record<string, number> = {
  '0-2': 280,
  '2-4': 420,
  '4-6': 650,
  '6-8': 900,
};

// The shared profile validator still requires a legacy partner; customized stories discard it.
const UNUSED_LEGACY_PARTNER = { type: 'preset', id: 'cat', name: '小猫', emoji: '🐱' };

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
}): ChildProfileInput {
  return validateChildProfileInput({
    avatarId: profile.avatarId,
    nickname: profile.nickname,
    ageGroup: profile.ageGroup,
    role: profile.role,
    traitIds: JSON.parse(profile.traitsJson) as string[],
    partner: UNUSED_LEGACY_PARTNER,
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
    ? validateChildProfileInput(request.childOverrides && typeof request.childOverrides === 'object'
      ? { ...request.childOverrides, partner: UNUSED_LEGACY_PARTNER }
      : request.childOverrides)
    : profileToInput(profile);
  const childSnapshot = resolveChildSnapshot(childInput);
  if (request.includePet !== undefined && typeof request.includePet !== 'boolean') {
    throw new ContentValidationError('宠物探索选项无效', 'includePet', 'FORMAT');
  }
  const includePet = request.includePet !== false;
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
  const characterDescription = `${childSnapshot.nickname}，${childSnapshot.roleLabel}，性格偏${childSnapshot.traitLabels.join('、')}，年龄段${childSnapshot.ageLabel}。`;

  try {
    const story = await prisma.$transaction(async (tx) => {
      const currentProfile = await tx.childProfile.findFirst({ where: { id: childProfileId, userId, deletedAt: null } });
      if (!currentProfile) throw new ContentValidationError('孩子档案不存在或已删除', 'childProfileId', 'FORMAT');
      const petSnapshot = includePet ? await freezePetStorySnapshot(tx, childProfileId) : null;
      if (includePet && !petSnapshot) {
        throw new PetAdoptionRequiredError(childProfileId);
      }
      const { partner: _legacyPartner, partnerLabel: _legacyPartnerLabel, ...newChildSnapshot } = childSnapshot;
      void _legacyPartner;
      void _legacyPartnerLabel;
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
              schemaVersion: 3,
              sequenceNumber: 0,
              includePet,
              petSnapshotJson: petSnapshot ? JSON.stringify(petSnapshot) : null,
              childSnapshotJson: JSON.stringify(newChildSnapshot),
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
