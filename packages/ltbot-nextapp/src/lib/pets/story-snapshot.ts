import { Prisma } from '@prisma/client';
import { findPetDefinition, petSpriteUrl } from './catalog';
import { stageLabel } from '@/lib/habits/domain';

export interface PetStorySnapshot {
  petKey: string;
  displayName: string;
  personalityKey: string;
  personality: string;
  assetVersion: number;
  spriteUrl: string;
  stage: number;
  stageLabel: string;
  facts: string[];
}

export function hasPetStoryIdentity(content: string, pet: PetStorySnapshot) {
  const species = findPetDefinition(pet.petKey)?.name;
  return content.includes(pet.displayName) && Boolean(species && content.includes(species));
}

export async function freezePetStorySnapshot(tx: Prisma.TransactionClient, childProfileId: number) {
  const pet = await tx.childPet.findUnique({ where: { childProfileId }, include: { growth: true } });
  if (!pet?.growth) return null;
  const definition = findPetDefinition(pet.petKey);
  if (!definition) return null;
  const completedBrushes = await tx.habitCheckIn.count({
    where: { childProfileId, status: 'COMPLETED', petEra: true, childHabit: { templateKey: 'brush' } },
  });
  const successfulFeeds = await tx.petFeedRecord.count({
    where: { childProfileId, status: 'FED' },
  });
  const facts = [
    pet.completedAdventureCount ? `已经一起成功创作${pet.completedAdventureCount}篇定制故事` : null,
    completedBrushes ? `已经一起完成${completedBrushes}次刷牙打卡` : null,
    successfulFeeds ? `已经收到${successfulFeeds}次食物卡星光` : null,
  ].filter((fact): fact is string => Boolean(fact)).slice(0, 3);
  return {
    petKey: pet.petKey,
    displayName: pet.displayName,
    personalityKey: pet.personalityKey,
    personality: definition.personality,
    assetVersion: pet.assetVersion,
    spriteUrl: petSpriteUrl(pet.petKey, pet.assetVersion),
    stage: pet.growth.highestStage,
    stageLabel: stageLabel(pet.growth.highestStage),
    facts,
  } satisfies PetStorySnapshot;
}
