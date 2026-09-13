import { randomUUID } from 'node:crypto';
import { copyFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const testDatabase = path.join(tmpdir(), `ltbot-habits-${process.pid}-${Date.now()}.db`);
copyFileSync(path.resolve('prisma/dev.db'), testDatabase);
process.env.DATABASE_URL = `file:${testDatabase}`;
process.env.HABITS_ENABLED = 'true';

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

    const revoked = await service.revokeCheckIn(userId, first.checkIn.id, {
      idempotencyKey: randomUUID(),
    }) as { outcome: string; hadFed: boolean };
    expect(revoked.outcome).toBe('REVOKED');
    expect(revoked.hadFed).toBe(true);

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
  });
});
