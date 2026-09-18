import { randomUUID } from 'node:crypto';
import { copyFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const testDatabase = path.join(tmpdir(), `ltbot-habits-${process.pid}-${Date.now()}.db`);
copyFileSync(path.resolve('prisma/dev.db'), testDatabase);
process.env.DATABASE_URL = `file:${testDatabase}`;
process.env.HABITS_ENABLED = 'true';
execFileSync(process.execPath, [path.resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'pipe',
});

type HabitService = typeof import('@/lib/habits/service');
type PrismaModule = typeof import('@/lib/prisma');

let service: HabitService;
let prismaModule: PrismaModule;
let userId: string;
let childProfileId: number;

beforeAll(async () => {
  prismaModule = await import('@/lib/prisma');
  service = await import('@/lib/habits/service');
  userId = `habit_test_${randomUUID()}`;
  await prismaModule.prisma.user.create({ data: { id: userId, name: 'Habit integration test' } });
  const profile = await prismaModule.prisma.childProfile.create({
    data: {
      userId,
      avatarId: 'girl',
      nickname: 'Test child',
      ageGroup: '6-8',
      role: 'child',
      traitsJson: '[]',
      partnerJson: '{"type":"rabbit"}',
    },
  });
  childProfileId = profile.id;
});

afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  await prismaModule.prisma.$disconnect();
  unlinkSync(testDatabase);
});

describe('habit lifecycle', () => {
  it('uses nap and evening slots for the bedtime template', async () => {
    const dashboard = await service.saveHabitPlan(userId, childProfileId, {
      templates: [{ templateKey: 'bedtime', enabled: true, sortOrder: 1 }],
      custom: [],
      deletedCustomIds: [],
    });
    const bedtime = dashboard.habits.find((item) => item.templateKey === 'bedtime');
    expect(bedtime?.frequency).toBe('TWICE_DAILY');
    expect(bedtime?.slots.map((slot) => slot.slot)).toEqual(['nap', 'evening']);
  });

  it('persists a plan and completes the reward-feed-revoke-recheck flow', async () => {
    await expect(service.getCompanion(userId, childProfileId)).rejects.toMatchObject({ errorCode: 'PET_ADOPTION_REQUIRED' });
    await service.adoptPet(userId, childProfileId, 'rabbit', '小芽');
    await expect(service.adoptPet(userId, childProfileId, 'cat')).rejects.toMatchObject({ errorCode: 'PET_ALREADY_ADOPTED' });
    expect((await service.updateCompanion(userId, childProfileId, { appearanceKey: 'cat' })).petKey).toBe('cat');
    expect((await service.updateCompanion(userId, childProfileId, { appearanceKey: 'rabbit' })).petKey).toBe('rabbit');
    const dashboard = await service.saveHabitPlan(userId, childProfileId, {
      templates: [{ templateKey: 'bathe', enabled: true, sortOrder: 1 }],
      custom: [],
      deletedCustomIds: [],
    });
    const habit = dashboard.habits.find((item) => item.templateKey === 'bathe');
    expect(habit?.enabled).toBe(true);

    const localDate = dashboard.localDate;
    const first = await service.checkInHabit(userId, habit!.id, {
      expectedSlot: 'daily',
      expectedLocalDate: localDate,
      idempotencyKey: randomUUID(),
    }) as { outcome: string; rewardOutcome: string; checkIn: { id: number } };
    expect(first.outcome).toBe('COMPLETED');
    expect(first.rewardOutcome).toBe('GRANTED');

    const duplicate = await service.checkInHabit(userId, habit!.id, {
      expectedSlot: 'daily',
      expectedLocalDate: localDate,
      idempotencyKey: randomUUID(),
    });
    expect(duplicate.outcome).toBe('ALREADY_COMPLETED');

    const pending = await service.listPendingRewards(userId, childProfileId);
    const grant = pending[0];
    expect(grant.candidates).toHaveLength(3);
    const cardKey = grant.candidates[0]!.cardKey;

    const selected = await service.selectReward(userId, grant.id, {
      cardKey,
      idempotencyKey: randomUUID(),
    });
    expect(selected.outcome).toBe('SELECTED');

    const fed = await service.feedCompanion(userId, childProfileId, {
      grantId: grant.id,
      idempotencyKey: randomUUID(),
    });
    expect(fed.outcome).toBe('FED');
    expect(fed.growthDelta).toBeGreaterThan(0);
    await expect(service.updateCompanion(userId, childProfileId, { appearanceKey: 'cat' })).rejects.toMatchObject({ errorCode: 'PET_SPECIES_LOCKED' });

    const revoked = await service.revokeCheckIn(userId, first.checkIn.id, {
      idempotencyKey: randomUUID(),
    }) as { outcome: string; hadFed: boolean };
    expect(revoked.outcome).toBe('REVOKED');
    expect(revoked.hadFed).toBe(true);
    expect((await service.getCompanion(userId, childProfileId)).speciesLockedAt).not.toBeNull();

    const rechecked = await service.checkInHabit(userId, habit!.id, {
      expectedSlot: 'daily',
      expectedLocalDate: localDate,
      idempotencyKey: randomUUID(),
    }) as { checkIn: { id: number }; grant: { id: number; candidatesJson: string } };
    expect(rechecked.checkIn.id).toBe(first.checkIn.id);
    expect(rechecked.grant.id).toBe(grant.id);
    expect(JSON.parse(rechecked.grant.candidatesJson)).toContain(cardKey);
  });

  it('rejects a sibling user reading the profile', async () => {
    await expect(service.getHabitDashboard('another-user', childProfileId)).rejects.toMatchObject({
      errorCode: 'PROFILE_NOT_FOUND',
      status: 404,
    });
    await expect(service.getCompanion('another-user', childProfileId)).rejects.toMatchObject({ errorCode: 'PROFILE_NOT_FOUND' });
    await expect(service.adoptPet('another-user', childProfileId, 'cat')).rejects.toMatchObject({ errorCode: 'PROFILE_NOT_FOUND' });
  });

  it('can revoke a new check-in even when the daily card limit left it without a grant', async () => {
    const db = prismaModule.prisma;
    const profile = await db.childProfile.create({ data: {
      userId, avatarId: 'boy', nickname: '限额孩子', ageGroup: '4-6', role: 'boy', traitsJson: '["patient"]',
      partnerJson: '{"type":"preset","id":"dog","name":"小狗","emoji":"🐶"}',
    } });
    await service.adoptPet(userId, profile.id, 'dog');
    const dashboard = await service.saveHabitPlan(userId, profile.id, {
      templates: ['bathe', 'tidy', 'read', 'story'].map((templateKey) => ({ templateKey, enabled: true })),
      custom: [],
    });
    const results = [];
    for (const templateKey of ['bathe', 'tidy', 'read', 'story']) {
      const habit = dashboard.habits.find((item) => item.templateKey === templateKey)!;
      results.push(await service.checkInHabit(userId, habit.id, {
        expectedSlot: 'daily', expectedLocalDate: dashboard.localDate, idempotencyKey: randomUUID(),
      }));
    }
    const fourth = results[3] as { rewardOutcome: string; checkIn: { id: number; petEra: boolean } };
    expect(fourth.rewardOutcome).toBe('NO_REWARD');
    expect(fourth.checkIn.petEra).toBe(true);
    expect((await service.revokeCheckIn(userId, fourth.checkIn.id, { idempotencyKey: randomUUID() })).outcome).toBe('REVOKED');
  });

  it('includes only completed new-era brushing in a later pet story snapshot', async () => {
    const { freezePetStorySnapshot } = await import('@/lib/pets/story-snapshot');
    const db = prismaModule.prisma;
    const profile = await db.childProfile.create({ data: {
      userId, avatarId: 'girl', nickname: '刷牙孩子', ageGroup: '4-6', role: 'girl', traitsJson: '["kind"]',
      partnerJson: '{"type":"preset","id":"cat","name":"小猫","emoji":"🐱"}',
    } });
    await service.adoptPet(userId, profile.id, 'cat');
    const dashboard = await service.saveHabitPlan(userId, profile.id, {
      templates: [{ templateKey: 'brush', enabled: true }], custom: [],
    });
    const habit = dashboard.habits.find((item) => item.templateKey === 'brush')!;
    const newCheckIn = await db.habitCheckIn.create({ data: {
      childProfileId: profile.id, childHabitId: habit.id, timezone: 'Asia/Shanghai',
      localDate: dashboard.localDate, slot: 'morning', petEra: true, completedAt: new Date(),
    } });
    const snapshot = await db.$transaction((tx) => freezePetStorySnapshot(tx, profile.id));
    expect(snapshot?.facts).toContain('已经一起完成1次刷牙打卡');
    await db.habitCheckIn.update({ where: { id: newCheckIn.id }, data: { status: 'REVOKED', revokedAt: new Date() } });
    const afterRevoke = await db.$transaction((tx) => freezePetStorySnapshot(tx, profile.id));
    expect(afterRevoke?.facts.some((fact) => fact.includes('刷牙'))).toBe(false);
  });

  it('keeps legacy growth and cards read-only while the new pet starts empty', async () => {
    const db = prismaModule.prisma;
    const legacy = await db.childProfile.create({ data: {
      userId, avatarId: 'girl', nickname: 'Legacy child', ageGroup: '4-6', role: 'child', traitsJson: '["curious"]', partnerJson: '{"type":"preset","id":"cat","name":"小猫","emoji":"🐱"}',
    } });
    await db.companionGrowth.create({ data: { childProfileId: legacy.id, appearanceKey: 'cat', growthValue: 80, highestStage: 2, nutrientStateJson: '{}' } });
    await db.childFoodCard.create({ data: { childProfileId: legacy.id, cardKey: 'rice', quantity: 2, discoveredAt: new Date() } });
    const dashboard = await service.saveHabitPlan(userId, legacy.id, { templates: [{ templateKey: 'bathe', enabled: true }], custom: [] });
    const habit = dashboard.habits.find((item) => item.templateKey === 'bathe')!;
    const oldCheckIn = await db.habitCheckIn.create({ data: { childProfileId: legacy.id, childHabitId: habit.id, timezone: 'Asia/Shanghai', localDate: dashboard.localDate, slot: 'daily', completedAt: new Date() } });
    const oldGrant = await db.checkInRewardGrant.create({ data: { childProfileId: legacy.id, checkInId: oldCheckIn.id, timezone: 'Asia/Shanghai', localDate: dashboard.localDate, dailyRewardIndex: 1, candidatesJson: '["rice","egg","water"]', selectedCardKey: 'rice', status: 'SELECTED' } });
    const adopted = await service.adoptPet(userId, legacy.id, 'dog');
    expect(adopted.growthValue).toBe(0);
    expect(adopted.inventory).toHaveLength(0);
    const archive = await service.getLegacyHabitAssets(userId, legacy.id);
    expect(archive.growth?.growthValue).toBe(80);
    expect(archive.inventory[0]?.quantity).toBe(2);
    expect((await service.getHabitDashboard(userId, legacy.id)).rewards.remainingToday).toBe(2);
    await expect(service.selectReward(userId, oldGrant.id, { cardKey: 'rice', idempotencyKey: randomUUID() })).rejects.toMatchObject({ errorCode: 'LEGACY_READ_ONLY' });
    await expect(service.revokeCheckIn(userId, oldCheckIn.id, { idempotencyKey: randomUUID() })).rejects.toMatchObject({ errorCode: 'LEGACY_READ_ONLY' });
    const duplicate = await service.checkInHabit(userId, habit.id, { expectedSlot: 'daily', expectedLocalDate: dashboard.localDate, idempotencyKey: randomUUID() });
    expect(duplicate.outcome).toBe('ALREADY_COMPLETED');
    expect(duplicate.rewardOutcome).toBe('NO_REWARD');
  });

  it('counts only committed customized stories once and never decrements on deletion', async () => {
    const { persistStorySuccess } = await import('@/lib/story-customization/success');
    const db = prismaModule.prisma;
    const before = await db.childProfile.findUniqueOrThrow({ where: { id: childProfileId } });
    const petBefore = await db.childPet.findUniqueOrThrow({ where: { childProfileId } });
    async function createPending(includePet: boolean) {
      return db.story.create({
        data: {
          userId,
          childProfileId,
          ageGroup: '4-6',
          themeType: 'CUSTOM',
          customTheme: '友谊',
          characterSettings: '{}',
          wordLimit: 300,
          extData: JSON.stringify({ generationStatus: 'generating' }),
          customization: { create: {
            schemaVersion: 3,
            sequenceNumber: 0,
            includePet,
            petSnapshotJson: includePet ? JSON.stringify({ petKey: 'rabbit', displayName: '小芽' }) : null,
            childSnapshotJson: '{}',
            dreamWorldSnapshotJson: '{}',
            growthTheme: '友谊',
            creationKey: randomUUID(),
          } },
        },
      });
    }
    const withPet = await createPending(true);
    expect((await db.childProfile.findUniqueOrThrow({ where: { id: childProfileId } })).successfulStoryCount).toBe(before.successfulStoryCount);
    expect(await persistStorySuccess(withPet.id, userId, '小芽是一只小兔子。', null)).toBe(true);
    expect(await persistStorySuccess(withPet.id, userId, '重复正文', null)).toBe(false);
    const first = await db.storyCustomization.findUniqueOrThrow({ where: { storyId: withPet.id } });
    expect(first.successOrdinal).toBe(before.successfulStoryCount + 1);
    expect(first.petAdventureOrdinal).toBe(petBefore.completedAdventureCount + 1);
    await db.story.delete({ where: { id: withPet.id } });
    const withoutPet = await createPending(false);
    expect(await persistStorySuccess(withoutPet.id, userId, '孩子独自完成了探索。', null)).toBe(true);
    const second = await db.storyCustomization.findUniqueOrThrow({ where: { storyId: withoutPet.id } });
    expect(second.successOrdinal).toBe(before.successfulStoryCount + 2);
    expect(second.petAdventureOrdinal).toBeNull();
    expect((await db.childProfile.findUniqueOrThrow({ where: { id: childProfileId } })).successfulStoryCount).toBe(before.successfulStoryCount + 2);
    expect((await db.childPet.findUniqueOrThrow({ where: { childProfileId } })).completedAdventureCount).toBe(petBefore.completedAdventureCount + 1);
  });

  it('allows a custom story without adoption only when the pet option is off, then freezes the adopted pet', async () => {
    const { createCustomizedStory, PetAdoptionRequiredError } = await import('@/lib/story-customization/create-story');
    const db = prismaModule.prisma;
    const profile = await db.childProfile.create({ data: {
      userId, avatarId: 'girl', nickname: '故事孩子', ageGroup: '4-6', role: 'girl',
      traitsJson: '["curious"]',
      partnerJson: '{"type":"preset","id":"cat","name":"小猫","emoji":"🐱"}',
    } });
    const request = { childProfileId: profile.id, sceneId: 'cloud_bakery', growthTheme: '好奇探索' };
    await expect(createCustomizedStory(userId, randomUUID(), request)).rejects.toBeInstanceOf(PetAdoptionRequiredError);

    const withoutPet = await createCustomizedStory(userId, randomUUID(), { ...request, includePet: false });
    const soloCustomization = await db.storyCustomization.findUniqueOrThrow({ where: { storyId: withoutPet.story.id } });
    expect(soloCustomization.includePet).toBe(false);
    expect(soloCustomization.petSnapshotJson).toBeNull();
    expect(JSON.parse(soloCustomization.childSnapshotJson)).not.toHaveProperty('partner');
    expect(withoutPet.story.characterSettings).not.toContain('小猫');

    await service.adoptPet(userId, profile.id, 'rabbit', '小芽');
    const withPet = await createCustomizedStory(userId, randomUUID(), request);
    const petCustomization = await db.storyCustomization.findUniqueOrThrow({ where: { storyId: withPet.story.id } });
    expect(petCustomization.includePet).toBe(true);
    expect(JSON.parse(petCustomization.petSnapshotJson!)).toMatchObject({ petKey: 'rabbit', displayName: '小芽' });
    await service.updateCompanion(userId, profile.id, { displayName: '小月' });
    const snapshotAfterRename = await db.storyCustomization.findUniqueOrThrow({ where: { storyId: withPet.story.id } });
    expect(JSON.parse(snapshotAfterRename.petSnapshotJson!).displayName).toBe('小芽');
  });
});
