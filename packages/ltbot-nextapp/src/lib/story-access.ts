import { Prisma, StoryVisibility } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const storyRelations = Prisma.validator<Prisma.StoryInclude>()({
  user: { select: { id: true, name: true, avatar: true } },
  customization: true,
  childProfile: { select: { id: true, deletedAt: true } },
  _count: {
    select: {
      likes: true,
      favorites: true,
      comments: { where: { isDeleted: false } },
    },
  },
});

export type StoryWithRelations = Prisma.StoryGetPayload<{ include: typeof storyRelations }>;

export function readableStoryWhere(userId: string | null | undefined): Prisma.StoryWhereInput {
  return userId
    ? { OR: [{ visibility: StoryVisibility.PUBLIC }, { userId }] }
    : { visibility: StoryVisibility.PUBLIC };
}

export async function findReadableStory(storyId: number, userId: string | null | undefined) {
  return prisma.story.findFirst({
    where: { id: storyId, ...readableStoryWhere(userId) },
    include: storyRelations,
  });
}

export async function findOwnedStory(storyId: number, userId: string) {
  return prisma.story.findFirst({
    where: { id: storyId, userId },
    include: storyRelations,
  });
}

function parseExtData(raw: string | null) {
  if (!raw) return {} as Record<string, unknown>;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
}

function parseJsonObject(raw: string) {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function serializeStory(story: StoryWithRelations, viewerId?: string | null) {
  const isOwner = viewerId === story.userId;
  const extData = parseExtData(story.extData);
  const customization = isOwner && story.customization
    ? {
        schemaVersion: story.customization.schemaVersion,
        sequenceNumber: story.customization.sequenceNumber,
        child: parseJsonObject(story.customization.childSnapshotJson),
        dreamWorld: parseJsonObject(story.customization.dreamWorldSnapshotJson),
        growthTheme: story.customization.growthTheme,
        tonightMaterial: story.customization.tonightMaterialText
          ? {
              intent: story.customization.tonightMaterialIntent,
              text: story.customization.tonightMaterialText,
            }
          : null,
      }
    : null;

  return {
    id: story.id,
    ageGroup: story.ageGroup,
    themeType: story.themeType,
    classicTheme: story.classicTheme,
    classicSubTheme: story.classicSubTheme,
    customTheme: story.customTheme,
    characterSettings: story.characterSettings,
    wordLimit: story.wordLimit,
    content: story.content,
    coverImage: story.coverImage,
    imageGallery: story.imageGallery,
    visibility: story.visibility,
    childProfileId: isOwner ? story.childProfileId : null,
    childProfileDeleted: isOwner ? Boolean(story.childProfile?.deletedAt) : false,
    generationStatus: typeof extData.generationStatus === 'string' ? extData.generationStatus : story.content ? 'completed' : 'pending',
    generationError: isOwner && typeof extData.generationError === 'string' ? extData.generationError : null,
    ttsScript: typeof extData.ttsScript === 'string' ? extData.ttsScript : null,
    customization,
    illustrationStatus: story.illustrationStatus,
    illustrationTargetFrames: story.illustrationTargetFrames,
    illustrationGeneratedFrames: story.illustrationGeneratedFrames,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
    user: story.user,
    _count: story._count,
  };
}
