import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

function parseExtData(raw: string | null) {
  if (!raw) return {} as Record<string, unknown>;
  try { return JSON.parse(raw) as Record<string, unknown>; }
  catch { return {} as Record<string, unknown>; }
}

/** The story body, child ordinal, and pet adventure ordinal commit as one idempotent unit. */
export async function persistStorySuccess(
  storyId: number,
  userId: string,
  displayText: string,
  ttsScript: string | null,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const story = await tx.story.findUnique({ where: { id: storyId }, include: { customization: true } });
        if (!story || story.userId !== userId) throw new Error('STORY_NOT_FOUND');
        const extData = parseExtData(story.extData);
        const updated = await tx.story.updateMany({
          where: { id: storyId, userId, content: null },
          data: {
            content: displayText,
            extData: JSON.stringify({
              ...extData,
              generationStatus: 'completed',
              generationError: undefined,
              generationCompletedAt: new Date().toISOString(),
              contentFormat: 'plain',
              ttsFormat: ttsScript ? 'script' : 'plain',
              ttsScript,
            }),
          },
        });
        if (!updated.count) return false;
        if (story.customization && story.childProfileId) {
          const profile = await tx.childProfile.update({
            where: { id: story.childProfileId },
            data: { successfulStoryCount: { increment: 1 } },
            select: { successfulStoryCount: true },
          });
          let petAdventureOrdinal: number | null = null;
          if (story.customization.includePet && story.customization.petSnapshotJson) {
            const pet = await tx.childPet.update({
              where: { childProfileId: story.childProfileId },
              data: { completedAdventureCount: { increment: 1 } },
              select: { completedAdventureCount: true },
            });
            petAdventureOrdinal = pet.completedAdventureCount;
          }
          await tx.storyCustomization.update({
            where: { storyId },
            data: {
              sequenceNumber: profile.successfulStoryCount,
              successOrdinal: profile.successfulStoryCount,
              petAdventureOrdinal,
              completedAt: new Date(),
            },
          });
        }
        return true;
      });
    } catch (error) {
      lastError = error;
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && ['P1008', 'P2028', 'P2034'].includes(error.code)
        || error instanceof Error && /SQLITE_BUSY|database is locked/i.test(error.message);
      if (!retryable || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 30 * 2 ** attempt));
    }
  }
  throw lastError;
}
