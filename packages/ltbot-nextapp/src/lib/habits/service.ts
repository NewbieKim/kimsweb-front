import {
  FeedRecordStatus,
  HabitCheckInStatus,
  HabitCommandOperation,
  HabitFrequency,
  HabitSource,
  Prisma,
  RewardGrantStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createOperationEvent } from '@/lib/operation-event';
import { PET_CATALOG, findPetDefinition, petSpriteUrl } from '@/lib/pets/catalog';
import { ContentValidationError, validateHabitName, validatePetName } from '@/lib/story-customization/validation';
import {
  addNutrients,
  assertIdempotencyKey,
  DAILY_GROWTH_LIMIT,
  DAILY_REWARD_LIMIT,
  EMPTY_NUTRIENTS,
  getBusinessClock,
  getSlotAvailability,
  HabitDomainError,
  type HabitSlot,
  isHabitsEnabled,
  nutrientCoverage,
  parseNutrients,
  pickRewardCandidates,
  resolveStage,
  stageLabel,
} from './domain';

type Tx = Prisma.TransactionClient;

export interface SaveHabitPlanInput {
  templates?: Array<{ templateKey: string; enabled?: boolean; sortOrder?: number }>;
  custom?: Array<{
    id?: number;
    name: string;
    emoji?: string;
    frequency: 'DAILY' | 'TWICE_DAILY';
    enabled?: boolean;
    sortOrder?: number;
  }>;
  deletedCustomIds?: number[];
}

export interface CheckInInput {
  expectedSlot?: string;
  expectedLocalDate?: string;
  idempotencyKey: string;
}

export interface CompanionPatchInput {
  displayName?: string;
  appearanceKey?: string;
}

const HABIT_EVENTS = {
  CHECK_IN_SUCCESS: 'habit_checkin_success',
  CHECK_IN_DUPLICATE: 'habit_checkin_duplicate',
  REWARD_SELECTED: 'habit_reward_selected',
  FEED_SUCCESS: 'habit_feed_success',
  SETTINGS_SAVED: 'habit_settings_saved',
  REVOKE: 'habit_revoke',
} as const;

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeSortOrder(value: unknown, fallback: number) {
  return Number.isInteger(value) ? Math.max(0, Math.min(999, Number(value))) : fallback;
}

function normalizeEmoji(value: unknown) {
  if (typeof value !== 'string') return '⭐';
  const normalized = value.normalize('NFC').trim();
  return Array.from(normalized).slice(0, 4).join('') || '⭐';
}

async function requireOwnedProfile(client: Tx | typeof prisma, childProfileId: number, userId: string) {
  const profile = await client.childProfile.findFirst({
    where: { id: childProfileId, userId, deletedAt: null },
  });
  if (!profile) throw new HabitDomainError('PROFILE_NOT_FOUND', '孩子档案不存在', 404);
  return profile;
}

async function requirePet(client: Tx | typeof prisma, childProfileId: number) {
  const pet = await client.childPet.findUnique({ where: { childProfileId }, include: { growth: true } });
  if (!pet?.growth) throw new HabitDomainError('PET_ADOPTION_REQUIRED', '请先领养宠物，再来打卡', 409);
  return pet;
}

function isRetryable(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P2002', 'P1008', 'P2028', 'P2034'].includes(error.code);
  }
  const message = error instanceof Error ? error.message : '';
  return /database is locked|SQLITE_BUSY|timed out/i.test(message);
}

async function withSqliteRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 30 * 2 ** attempt));
    }
  }
  throw lastError;
}

async function readCommand(
  client: Tx,
  childProfileId: number,
  operation: HabitCommandOperation,
  idempotencyKey: string,
  resourceId: string,
) {
  const command = await client.habitCommand.findUnique({
    where: { childProfileId_operation_idempotencyKey: { childProfileId, operation, idempotencyKey } },
  });
  if (!command) return null;
  if (command.resourceId && command.resourceId !== resourceId) {
    throw new HabitDomainError('IDEMPOTENCY_KEY_REUSED', '该幂等键已用于另一项操作', 409);
  }
  return safeJson<unknown>(command.responseSnapshotJson, null);
}

async function saveCommand(
  client: Tx,
  childProfileId: number,
  operation: HabitCommandOperation,
  idempotencyKey: string,
  resourceId: string,
  response: unknown,
) {
  await client.habitCommand.create({
    data: {
      childProfileId,
      operation,
      idempotencyKey,
      resourceId,
      responseSnapshotJson: JSON.stringify(response),
    },
  });
}

async function getProgress(client: Tx, childProfileId: number, localDate: string) {
  const habits = await client.childHabit.findMany({
    where: { childProfileId, enabled: true, deletedAt: null },
    select: { id: true, slotsJson: true },
  });
  const total = habits.reduce((sum, habit) => sum + safeJson<string[]>(habit.slotsJson, []).length, 0);
  const done = await client.habitCheckIn.count({
    where: {
      childProfileId,
      localDate,
      status: HabitCheckInStatus.COMPLETED,
      childHabit: { enabled: true, deletedAt: null },
    },
  });
  return { done, total };
}

function assertFeatureEnabled() {
  if (!isHabitsEnabled()) {
    throw new HabitDomainError('FEATURE_DISABLED', '习惯打卡正在维护，已有奖励和历史仍可查看', 403);
  }
}

export async function getHabitDashboard(userId: string, childProfileId: number) {
  await requireOwnedProfile(prisma, childProfileId, userId);
  const clock = getBusinessClock();
  const [templates, habits, checkIns, todayGrantCount, pendingSelect, pendingFeed, pet] = await Promise.all([
    prisma.habitTemplate.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.childHabit.findMany({
      where: { childProfileId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.habitCheckIn.findMany({
      where: { childProfileId, localDate: clock.localDate },
      include: { rewardGrant: true },
    }),
    prisma.checkInRewardGrant.count({ where: { childProfileId, localDate: clock.localDate } }),
    prisma.checkInRewardGrant.count({ where: { childProfileId, petEra: true, status: RewardGrantStatus.PENDING_SELECT } }),
    prisma.checkInRewardGrant.count({ where: { childProfileId, petEra: true, status: RewardGrantStatus.SELECTED } }),
    prisma.childPet.findUnique({ where: { childProfileId }, select: { petKey: true, displayName: true } }),
  ]);
  const checkInMap = new Map(checkIns.map((item) => [`${item.childHabitId}:${item.slot}`, item]));
  const enabledHabits = habits.filter((habit) => habit.enabled);
  const progress = {
    done: checkIns.filter(
      (item) => item.status === HabitCheckInStatus.COMPLETED && enabledHabits.some((habit) => habit.id === item.childHabitId),
    ).length,
    total: enabledHabits.reduce((sum, habit) => sum + safeJson<string[]>(habit.slotsJson, []).length, 0),
  };
  return {
    ...clock,
    featureEnabled: isHabitsEnabled(),
    pet,
    adoptionRequired: !pet,
    templates: templates.map((template) => ({
      ...template,
      slots: safeJson<string[]>(template.defaultSlotsJson, []),
    })),
    habits: habits.map((habit) => ({
      id: habit.id,
      source: habit.source,
      templateKey: habit.templateKey,
      name: habit.name,
      emoji: habit.emoji,
      frequency: habit.frequency,
      enabled: habit.enabled,
      sortOrder: habit.sortOrder,
      slots: safeJson<HabitSlot[]>(habit.slotsJson, []).map((slot) => {
        const checkIn = checkInMap.get(`${habit.id}:${slot}`);
        const availability = getSlotAvailability(slot, habit.templateKey, clock);
        return {
          slot,
          isOpen: availability.isOpen,
          nextOpenAt: availability.nextOpenAt,
          windowLabel: availability.windowLabel,
          status: checkIn?.status || 'NONE',
          checkInId: checkIn?.id || null,
          grant: checkIn?.rewardGrant?.petEra ? checkIn.rewardGrant : null,
        };
      }),
    })),
    progress,
    rewards: {
      remainingToday: Math.max(0, DAILY_REWARD_LIMIT - todayGrantCount),
      pendingSelect,
      pendingFeed,
    },
  };
}

export async function saveHabitPlan(
  userId: string,
  childProfileId: number,
  input: SaveHabitPlanInput,
) {
  assertFeatureEnabled();
  const requestedTemplates = Array.isArray(input.templates) ? input.templates : [];
  const requestedCustom = Array.isArray(input.custom) ? input.custom : [];
  const deletedCustomIds = Array.isArray(input.deletedCustomIds)
    ? input.deletedCustomIds.filter((id) => Number.isInteger(id) && id > 0)
    : [];
  const enabledCount = requestedTemplates.filter((item) => item.enabled !== false).length
    + requestedCustom.filter((item) => item.enabled !== false).length;
  const normalizedCustom = requestedCustom.map((item, index) => ({
    ...item,
    name: validateHabitName(item.name),
    emoji: normalizeEmoji(item.emoji),
    frequency: item.frequency === 'TWICE_DAILY' ? HabitFrequency.TWICE_DAILY : HabitFrequency.DAILY,
    enabled: item.enabled !== false,
    sortOrder: normalizeSortOrder(item.sortOrder, 100 + index),
  }));

  await prisma.$transaction(async (tx) => {
    await requireOwnedProfile(tx, childProfileId, userId);
    const templates = await tx.habitTemplate.findMany({ where: { enabled: true } });
    const templateMap = new Map(templates.map((template) => [template.templateKey, template]));
    const requestedMap = new Map(requestedTemplates.map((item) => [item.templateKey, item]));
    if (requestedTemplates.some((item) => !templateMap.has(item.templateKey))) {
      throw new HabitDomainError('INVALID_TEMPLATE', '习惯模板无效', 400);
    }
    const existingTemplates = await tx.childHabit.findMany({
      where: { childProfileId, source: HabitSource.TEMPLATE },
    });
    for (const existing of existingTemplates) {
      if (!requestedMap.has(existing.templateKey || '')) {
        await tx.childHabit.update({ where: { id: existing.id }, data: { enabled: false } });
      }
    }
    for (let index = 0; index < requestedTemplates.length; index += 1) {
      const item = requestedTemplates[index];
      const template = templateMap.get(item.templateKey)!;
      await tx.childHabit.upsert({
        where: { childProfileId_templateKey: { childProfileId, templateKey: item.templateKey } },
        create: {
          childProfileId,
          source: HabitSource.TEMPLATE,
          templateKey: item.templateKey,
          name: template.name,
          emoji: template.emoji,
          frequency: template.defaultFrequency,
          slotsJson: template.defaultSlotsJson,
          enabled: item.enabled !== false,
          sortOrder: normalizeSortOrder(item.sortOrder, index),
        },
        update: {
          name: template.name,
          emoji: template.emoji,
          frequency: template.defaultFrequency,
          slotsJson: template.defaultSlotsJson,
          enabled: item.enabled !== false,
          sortOrder: normalizeSortOrder(item.sortOrder, index),
          deletedAt: null,
        },
      });
    }
    const existingCustom = await tx.childHabit.findMany({
      where: { childProfileId, source: HabitSource.CUSTOM, deletedAt: null },
    });
    const retainedIds = new Set(normalizedCustom.map((item) => item.id).filter(Boolean));
    for (const existing of existingCustom) {
      if (!retainedIds.has(existing.id)) {
        await tx.childHabit.update({ where: { id: existing.id }, data: { enabled: false } });
      }
    }
    for (const item of normalizedCustom) {
      const slots = item.frequency === HabitFrequency.TWICE_DAILY ? ['morning', 'evening'] : ['daily'];
      if (item.id) {
        const owned = existingCustom.some((habit) => habit.id === item.id);
        if (!owned) throw new HabitDomainError('HABIT_NOT_FOUND', '自定义习惯不存在', 404);
        await tx.childHabit.update({
          where: { id: item.id },
          data: {
            name: item.name,
            emoji: item.emoji,
            frequency: item.frequency,
            slotsJson: JSON.stringify(slots),
            enabled: item.enabled,
            sortOrder: item.sortOrder,
          },
        });
      } else {
        await tx.childHabit.create({
          data: {
            childProfileId,
            source: HabitSource.CUSTOM,
            name: item.name,
            emoji: item.emoji,
            frequency: item.frequency,
            slotsJson: JSON.stringify(slots),
            enabled: item.enabled,
            sortOrder: item.sortOrder,
          },
        });
      }
    }
    if (deletedCustomIds.length) {
      await tx.childHabit.updateMany({
        where: { id: { in: deletedCustomIds }, childProfileId, source: HabitSource.CUSTOM },
        data: { enabled: false, deletedAt: new Date() },
      });
    }
  });
  void createOperationEvent({
    eventType: HABIT_EVENTS.SETTINGS_SAVED,
    userId,
    metadata: { childProfileId, enabledCount, customCount: normalizedCustom.length },
  });
  return getHabitDashboard(userId, childProfileId);
}

function resolveRequestedSlot(
  habit: { templateKey: string | null; slotsJson: string },
  input: CheckInInput,
) {
  const clock = getBusinessClock();
  if (input.expectedLocalDate && input.expectedLocalDate !== clock.localDate) {
    throw new HabitDomainError('CLIENT_TIME_DRIFT', '日期已变化，请刷新后重试', 409, clock);
  }
  const slots = safeJson<HabitSlot[]>(habit.slotsJson, []);
  if (input.expectedSlot) {
    if (!slots.includes(input.expectedSlot as HabitSlot)) {
      throw new HabitDomainError('INVALID_SLOT', '打卡时段无效', 400);
    }
    const availability = getSlotAvailability(input.expectedSlot as HabitSlot, habit.templateKey, clock);
    if (!availability.isOpen) {
      throw new HabitDomainError('SLOT_NOT_OPEN', '这个时段还没有开放', 409, {
        ...clock,
        nextOpenAt: availability.nextOpenAt,
      });
    }
    return { clock, slot: input.expectedSlot as HabitSlot };
  }
  const openSlot = slots.find((slot) => getSlotAvailability(slot, habit.templateKey, clock).isOpen);
  if (!openSlot) {
    const nextOpenAt = slots
      .map((slot) => getSlotAvailability(slot, habit.templateKey, clock).nextOpenAt)
      .filter(Boolean)
      .sort()[0];
    throw new HabitDomainError('SLOT_NOT_OPEN', '当前没有可打卡的时段', 409, { ...clock, nextOpenAt });
  }
  return { clock, slot: openSlot };
}

export async function checkInHabit(userId: string, childHabitId: number, input: CheckInInput) {
  assertFeatureEnabled();
  const idempotencyKey = assertIdempotencyKey(input.idempotencyKey);
  const habit = await prisma.childHabit.findFirst({
    where: { id: childHabitId, enabled: true, deletedAt: null, childProfile: { userId, deletedAt: null } },
    include: { childProfile: true },
  });
  if (!habit) throw new HabitDomainError('HABIT_NOT_FOUND', '习惯不存在或未启用', 404);
  const { clock, slot } = resolveRequestedSlot(habit, input);
  const resourceId = `${childHabitId}:${clock.localDate}:${slot}`;
  const result = await withSqliteRetry(() => prisma.$transaction(async (tx) => {
    const cached = await readCommand(tx, habit.childProfileId, HabitCommandOperation.CHECK_IN, idempotencyKey, resourceId);
    if (cached) return cached as Record<string, unknown>;
    await requireOwnedProfile(tx, habit.childProfileId, userId);
    const pet = await requirePet(tx, habit.childProfileId);
    let checkIn = await tx.habitCheckIn.findUnique({
      where: {
        childProfileId_childHabitId_localDate_slot: {
          childProfileId: habit.childProfileId,
          childHabitId,
          localDate: clock.localDate,
          slot,
        },
      },
      include: { rewardGrant: true },
    });
    let outcome = 'COMPLETED';
    if (checkIn?.status === HabitCheckInStatus.COMPLETED) {
      outcome = 'ALREADY_COMPLETED';
    } else if (checkIn) {
      if (!checkIn.petEra) {
        throw new HabitDomainError('LEGACY_READ_ONLY', '旧打卡记录仅供查看', 409);
      }
      checkIn = await tx.habitCheckIn.update({
        where: { id: checkIn.id },
        data: { status: HabitCheckInStatus.COMPLETED, completedAt: new Date(), revokedAt: null, version: { increment: 1 } },
        include: { rewardGrant: true },
      });
      if (checkIn.rewardGrant) {
        await tx.checkInRewardGrant.update({
          where: { id: checkIn.rewardGrant.id },
          data: { status: RewardGrantStatus.PENDING_SELECT, selectedCardKey: null, version: { increment: 1 } },
        });
      }
    } else {
      checkIn = await tx.habitCheckIn.create({
        data: {
          childProfileId: habit.childProfileId,
          childHabitId,
          timezone: clock.timezone,
          localDate: clock.localDate,
          slot,
          petEra: true,
          completedAt: new Date(),
        },
        include: { rewardGrant: true },
      });
    }

    let grant = await tx.checkInRewardGrant.findUnique({ where: { checkInId: checkIn.id } });
    if (!grant && outcome !== 'ALREADY_COMPLETED') {
      const grants = await tx.checkInRewardGrant.findMany({
        where: { childProfileId: habit.childProfileId, localDate: clock.localDate },
        select: { dailyRewardIndex: true },
      });
      const occupied = new Set(grants.map((item) => item.dailyRewardIndex));
      const rewardIndex = [1, 2, 3].find((index) => !occupied.has(index));
      if (rewardIndex) {
        const definitions = await tx.foodCardDefinition.findMany({ where: { enabled: true } });
        grant = await tx.checkInRewardGrant.create({
          data: {
            checkInId: checkIn.id,
            childProfileId: habit.childProfileId,
            timezone: clock.timezone,
            localDate: clock.localDate,
            dailyRewardIndex: rewardIndex,
            petEra: true,
            candidatesJson: JSON.stringify(pickRewardCandidates(definitions, parseNutrients(pet.growth!.nutrientStateJson))),
          },
        });
      }
    }
    const progress = await getProgress(tx, habit.childProfileId, clock.localDate);
    const response = {
      outcome,
      rewardOutcome: grant?.petEra ? 'GRANTED' : 'NO_REWARD',
      checkIn: { ...checkIn, rewardGrant: undefined },
      grant: grant?.petEra ? grant : null,
      progress,
      serverNow: clock.serverNow,
      localDate: clock.localDate,
    };
    await saveCommand(tx, habit.childProfileId, HabitCommandOperation.CHECK_IN, idempotencyKey, resourceId, response);
    return response;
  }));
  void createOperationEvent({
    eventType: result.outcome === 'ALREADY_COMPLETED' ? HABIT_EVENTS.CHECK_IN_DUPLICATE : HABIT_EVENTS.CHECK_IN_SUCCESS,
    userId,
    metadata: { childProfileId: habit.childProfileId, habitKey: habit.templateKey || 'custom', slot, localDate: clock.localDate },
  });
  return result;
}

export async function listPendingRewards(userId: string, childProfileId: number) {
  await requireOwnedProfile(prisma, childProfileId, userId);
  const grants = await prisma.checkInRewardGrant.findMany({
    where: {
      childProfileId,
      petEra: true,
      status: { in: [RewardGrantStatus.PENDING_SELECT, RewardGrantStatus.SELECTED] },
    },
    include: { checkIn: { include: { childHabit: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const definitions = await prisma.foodCardDefinition.findMany({ where: { enabled: true } });
  const definitionMap = new Map(definitions.map((item) => [item.cardKey, item]));
  return grants.map((grant) => ({
    ...grant,
    candidates: safeJson<string[]>(grant.candidatesJson, []).map((key) => definitionMap.get(key)).filter(Boolean),
  }));
}

export async function selectReward(
  userId: string,
  grantId: number,
  input: { cardKey: string; idempotencyKey: string },
) {
  const idempotencyKey = assertIdempotencyKey(input.idempotencyKey);
  const initial = await prisma.checkInRewardGrant.findFirst({
    where: { id: grantId, childProfile: { userId, deletedAt: null } },
  });
  if (!initial) throw new HabitDomainError('GRANT_NOT_FOUND', '奖励不存在', 404);
  if (!initial.petEra) throw new HabitDomainError('LEGACY_READ_ONLY', '旧奖励仅供查看', 409);
  const resourceId = String(grantId);
  const result = await withSqliteRetry(() => prisma.$transaction(async (tx) => {
    const cached = await readCommand(tx, initial.childProfileId, HabitCommandOperation.SELECT, idempotencyKey, resourceId);
    if (cached) return cached as Record<string, unknown>;
    const grant = await tx.checkInRewardGrant.findUnique({ where: { id: grantId } });
    if (!grant) throw new HabitDomainError('GRANT_NOT_FOUND', '奖励不存在', 404);
    if (!grant.petEra) throw new HabitDomainError('LEGACY_READ_ONLY', '旧奖励仅供查看', 409);
    await requirePet(tx, grant.childProfileId);
    if (grant.status !== RewardGrantStatus.PENDING_SELECT) {
      throw new HabitDomainError('INVALID_TRANSITION', '这份奖励当前不能选卡', 409, grant);
    }
    const candidates = safeJson<string[]>(grant.candidatesJson, []);
    if (!candidates.includes(input.cardKey)) {
      throw new HabitDomainError('INVALID_CARD', '请选择候选中的食物卡', 400);
    }
    const definition = await tx.foodCardDefinition.findFirst({
      where: { cardKey: input.cardKey, enabled: true },
    });
    if (!definition) throw new HabitDomainError('CARD_NOT_FOUND', '食物卡不可用', 404);
    await tx.petFoodCard.upsert({
      where: { childProfileId_cardKey: { childProfileId: grant.childProfileId, cardKey: input.cardKey } },
      create: { childProfileId: grant.childProfileId, cardKey: input.cardKey, quantity: 1, discoveredAt: new Date() },
      update: { quantity: { increment: 1 } },
    });
    const updated = await tx.checkInRewardGrant.update({
      where: { id: grantId },
      data: { selectedCardKey: input.cardKey, status: RewardGrantStatus.SELECTED, version: { increment: 1 } },
    });
    const response = { outcome: 'SELECTED', grant: updated, card: definition };
    await saveCommand(tx, grant.childProfileId, HabitCommandOperation.SELECT, idempotencyKey, resourceId, response);
    return response;
  }));
  void createOperationEvent({
    eventType: HABIT_EVENTS.REWARD_SELECTED,
    userId,
    metadata: { childProfileId: initial.childProfileId, grantId, cardKey: input.cardKey },
  });
  return result;
}

export async function getCompanion(userId: string, childProfileId: number) {
  await requireOwnedProfile(prisma, childProfileId, userId);
  const pet = await requirePet(prisma, childProfileId);
  const growth = pet.growth!;
  const clock = getBusinessClock();
  const [inventory, pendingFeed, todayFeeds, milestones] = await Promise.all([
    prisma.petFoodCard.findMany({
      where: { childProfileId },
      include: { definition: true },
      orderBy: { discoveredAt: 'asc' },
    }),
    prisma.checkInRewardGrant.findMany({
      where: { childProfileId, petEra: true, status: RewardGrantStatus.SELECTED },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.petFeedRecord.findMany({
      where: { childProfileId, localDate: clock.localDate, status: FeedRecordStatus.FED },
    }),
    prisma.petMilestone.findMany({ where: { childProfileId }, orderBy: { unlockedAt: 'asc' } }),
  ]);
  return {
    ...growth,
    petKey: pet.petKey,
    assetVersion: pet.assetVersion,
    displayName: pet.displayName,
    speciesLockedAt: pet.speciesLockedAt,
    completedAdventureCount: pet.completedAdventureCount,
    nutrients: parseNutrients(growth.nutrientStateJson),
    stage: growth.highestStage,
    stageLabel: stageLabel(growth.highestStage),
    appearanceKey: pet.petKey,
    appearance: pet.petKey,
    appearanceCatalog: PET_CATALOG.map((item) => ({ key: item.petKey, label: item.name, image: petSpriteUrl(item.petKey) })),
    inventory,
    pendingFeed,
    pendingFeedCount: pendingFeed.length,
    dailyGrowth: todayFeeds.reduce((sum, feed) => sum + feed.growthDelta + feed.rainbowDelta, 0),
    dailyGrowthLimit: DAILY_GROWTH_LIMIT,
    milestones,
    ...clock,
  };
}

export async function listPetCatalog() {
  const enabled = await prisma.petDefinition.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } });
  return enabled.flatMap((item) => {
    const copy = findPetDefinition(item.petKey);
    return copy ? [{ ...copy, assetVersion: item.assetVersion, spriteUrl: petSpriteUrl(item.petKey, item.assetVersion) }] : [];
  });
}

export async function adoptPet(userId: string, childProfileId: number, petKey: string, displayName?: string) {
  const definition = findPetDefinition(petKey);
  if (!definition) throw new HabitDomainError('INVALID_PET', '请选择可领养的宠物', 400);
  await withSqliteRetry(() => prisma.$transaction(async (tx) => {
    await requireOwnedProfile(tx, childProfileId, userId);
    const enabledDefinition = await tx.petDefinition.findFirst({ where: { petKey, enabled: true } });
    if (!enabledDefinition) throw new HabitDomainError('INVALID_PET', '这位宠物暂不可领养', 409);
    const existing = await tx.childPet.findUnique({ where: { childProfileId } });
    if (existing) throw new HabitDomainError('PET_ALREADY_ADOPTED', '这个孩子已经领养过宠物', 409);
    await tx.childPet.create({
      data: {
        childProfileId,
        petKey,
        displayName: displayName ? validatePetName(displayName) : definition.name,
        personalityKey: definition.personalityKey,
        assetVersion: enabledDefinition.assetVersion,
        growth: { create: { nutrientStateJson: JSON.stringify(EMPTY_NUTRIENTS) } },
      },
    });
  }));
  return getCompanion(userId, childProfileId);
}

export async function updateCompanion(
  userId: string,
  childProfileId: number,
  input: CompanionPatchInput,
) {
  await withSqliteRetry(() => prisma.$transaction(async (tx) => {
    await requireOwnedProfile(tx, childProfileId, userId);
    const pet = await requirePet(tx, childProfileId);
    const data: Prisma.ChildPetUpdateInput = {};
    if (input.displayName !== undefined) data.displayName = validatePetName(input.displayName);
    if (input.appearanceKey !== undefined && input.appearanceKey !== pet.petKey) {
      if (pet.speciesLockedAt) throw new HabitDomainError('PET_SPECIES_LOCKED', '首次喂养后不能更换宠物种类', 409);
      const definition = findPetDefinition(input.appearanceKey);
      if (!definition) throw new HabitDomainError('INVALID_PET', '宠物种类无效', 400);
      const enabledDefinition = await tx.petDefinition.findFirst({ where: { petKey: definition.petKey, enabled: true } });
      if (!enabledDefinition) throw new HabitDomainError('INVALID_PET', '这位宠物暂不可选择', 409);
      data.definition = { connect: { petKey: definition.petKey } };
      data.personalityKey = definition.personalityKey;
      data.assetVersion = enabledDefinition.assetVersion;
    }
    if (Object.keys(data).length) await tx.childPet.update({ where: { childProfileId }, data });
  }));
  return getCompanion(userId, childProfileId);
}

export async function feedCompanion(
  userId: string,
  childProfileId: number,
  input: { grantId: number; idempotencyKey: string },
) {
  const idempotencyKey = assertIdempotencyKey(input.idempotencyKey);
  await requireOwnedProfile(prisma, childProfileId, userId);
  const resourceId = String(input.grantId);
  const result = await withSqliteRetry(() => prisma.$transaction(async (tx) => {
    const cached = await readCommand(tx, childProfileId, HabitCommandOperation.FEED, idempotencyKey, resourceId);
    if (cached) return cached as Record<string, unknown>;
    const grant = await tx.checkInRewardGrant.findFirst({
      where: { id: input.grantId, childProfileId, petEra: true },
    });
    if (!grant || grant.status !== RewardGrantStatus.SELECTED || !grant.selectedCardKey) {
      throw new HabitDomainError('INVALID_TRANSITION', '这张食物卡当前不能喂养', 409, grant);
    }
    const definition = await tx.foodCardDefinition.findUnique({ where: { cardKey: grant.selectedCardKey } });
    if (!definition) throw new HabitDomainError('CARD_NOT_FOUND', '食物卡不存在', 404);
    const pet = await requirePet(tx, childProfileId);
    const clock = getBusinessClock();
    const activeFeeds = await tx.petFeedRecord.findMany({
      where: { childProfileId, localDate: clock.localDate, status: FeedRecordStatus.FED },
    });
    const currentDailyGrowth = activeFeeds.reduce((sum, feed) => sum + feed.growthDelta + feed.rainbowDelta, 0);
    const beforeCoverage = nutrientCoverage(activeFeeds.map((feed) => parseNutrients(feed.nutrientDeltaSnapshotJson)));
    const delta = parseNutrients(definition.nutrientDeltaJson);
    const afterCoverage = nutrientCoverage([...activeFeeds.map((feed) => parseNutrients(feed.nutrientDeltaSnapshotJson)), delta]);
    const rainbowDelta = beforeCoverage < 4 && afterCoverage >= 4 ? 2 : 0;
    const growthDelta = 2;
    if (currentDailyGrowth + growthDelta + rainbowDelta > DAILY_GROWTH_LIMIT) {
      throw new HabitDomainError('DAILY_GROWTH_CAP', '今天成长值满啦，小卡已保存，明天再来喂', 409, {
        dailyGrowth: currentDailyGrowth,
        dailyGrowthLimit: DAILY_GROWTH_LIMIT,
      });
    }
    const deducted = await tx.petFoodCard.updateMany({
      where: { childProfileId, cardKey: grant.selectedCardKey, quantity: { gt: 0 } },
      data: { quantity: { decrement: 1 } },
    });
    if (!deducted.count) throw new HabitDomainError('CARD_QUANTITY_EMPTY', '食物卡数量不足', 409);
    const companion = pet.growth!;
    const nutrients = addNutrients(parseNutrients(companion.nutrientStateJson), delta);
    const growthValue = companion.growthValue + growthDelta + rainbowDelta;
    const stage = resolveStage(growthValue);
    const highestStage = Math.max(companion.highestStage, stage);
    await tx.petGrowth.update({
      where: { childProfileId },
      data: { nutrientStateJson: JSON.stringify(nutrients), growthValue, highestStage },
    });
    const existingFeed = await tx.petFeedRecord.findUnique({ where: { grantId: grant.id } });
    const feed = existingFeed
      ? await tx.petFeedRecord.update({
          where: { id: existingFeed.id },
          data: {
            timezone: clock.timezone,
            localDate: clock.localDate,
            cardKey: grant.selectedCardKey,
            nutrientDeltaSnapshotJson: definition.nutrientDeltaJson,
            growthDelta,
            rainbowDelta,
            status: FeedRecordStatus.FED,
            fedAt: new Date(),
            reversedAt: null,
          },
        })
      : await tx.petFeedRecord.create({
          data: {
            childProfileId,
            grantId: grant.id,
            timezone: clock.timezone,
            localDate: clock.localDate,
            cardKey: grant.selectedCardKey,
            nutrientDeltaSnapshotJson: definition.nutrientDeltaJson,
            growthDelta,
            rainbowDelta,
            fedAt: new Date(),
          },
        });
    await tx.checkInRewardGrant.update({
      where: { id: grant.id },
      data: { status: RewardGrantStatus.FED, version: { increment: 1 } },
    });
    if (!pet.speciesLockedAt) {
      await tx.childPet.update({ where: { childProfileId }, data: { speciesLockedAt: new Date() } });
    }
    for (let milestoneStage = companion.highestStage + 1; milestoneStage <= highestStage; milestoneStage += 1) {
      await tx.petMilestone.upsert({
        where: { childProfileId_milestoneKey: { childProfileId, milestoneKey: `stage_${milestoneStage}` } },
        create: {
          childProfileId,
          milestoneKey: `stage_${milestoneStage}`,
        },
        update: {},
      });
    }
    const response = {
      outcome: 'FED',
      cardKey: grant.selectedCardKey,
      feed,
      growthValue,
      growthDelta: growthDelta + rainbowDelta,
      rainbowDelta,
      nutrients,
      stage,
      stageBefore: companion.highestStage,
      highestStage,
      stageLabel: stageLabel(highestStage),
      dailyGrowth: currentDailyGrowth + growthDelta + rainbowDelta,
    };
    await saveCommand(tx, childProfileId, HabitCommandOperation.FEED, idempotencyKey, resourceId, response);
    return response;
  }));
  const feedMeta = result as {
    cardKey?: string;
    growthDelta?: number;
    rainbowDelta?: number;
    stageBefore?: number;
    highestStage?: number;
  };
  void createOperationEvent({
    eventType: HABIT_EVENTS.FEED_SUCCESS,
    userId,
    metadata: {
      childProfileId,
      grantId: input.grantId,
      cardKey: feedMeta.cardKey,
      growthDelta: feedMeta.growthDelta,
      rainbowDelta: feedMeta.rainbowDelta,
      stageBefore: feedMeta.stageBefore,
      stageAfter: feedMeta.highestStage,
      localDate: getBusinessClock().localDate,
    },
  });
  return result;
}

export async function revokeCheckIn(
  userId: string,
  checkInId: number,
  input: { idempotencyKey: string },
) {
  const idempotencyKey = assertIdempotencyKey(input.idempotencyKey);
  const initial = await prisma.habitCheckIn.findFirst({
    where: { id: checkInId, childProfile: { userId, deletedAt: null } },
    include: { rewardGrant: true },
  });
  if (!initial) throw new HabitDomainError('CHECK_IN_NOT_FOUND', '打卡记录不存在', 404);
  if (!initial.petEra) throw new HabitDomainError('LEGACY_READ_ONLY', '旧打卡记录仅供查看', 409);
  const clock = getBusinessClock();
  if (initial.localDate !== clock.localDate) {
    throw new HabitDomainError('REVOKE_WINDOW_CLOSED', '只能撤销当前业务日的记录', 409);
  }
  const resourceId = String(checkInId);
  const result = await withSqliteRetry(() => prisma.$transaction(async (tx) => {
    const cached = await readCommand(tx, initial.childProfileId, HabitCommandOperation.REVOKE, idempotencyKey, resourceId);
    if (cached) return cached as Record<string, unknown>;
    const checkIn = await tx.habitCheckIn.findUnique({
      where: { id: checkInId },
      include: { rewardGrant: { include: { petFeedRecord: true } } },
    });
    if (!checkIn) throw new HabitDomainError('CHECK_IN_NOT_FOUND', '打卡记录不存在', 404);
    if (checkIn.status === HabitCheckInStatus.REVOKED) {
      const response = { outcome: 'ALREADY_REVOKED', checkIn };
      await saveCommand(tx, checkIn.childProfileId, HabitCommandOperation.REVOKE, idempotencyKey, resourceId, response);
      return response;
    }
    const grant = checkIn.rewardGrant;
    if (!checkIn.petEra) throw new HabitDomainError('LEGACY_READ_ONLY', '旧打卡记录仅供查看', 409);
    let hadFed = false;
    if (grant?.status === RewardGrantStatus.SELECTED && grant.selectedCardKey) {
      const reclaimed = await tx.petFoodCard.updateMany({
        where: { childProfileId: checkIn.childProfileId, cardKey: grant.selectedCardKey, quantity: { gt: 0 } },
        data: { quantity: { decrement: 1 } },
      });
      if (!reclaimed.count) throw new HabitDomainError('CARD_QUANTITY_EMPTY', '奖励卡状态异常，请刷新后重试', 409);
    }
    if (grant?.status === RewardGrantStatus.FED) {
      hadFed = true;
      const feed = grant.petFeedRecord;
      if (!feed || feed.status !== FeedRecordStatus.FED) {
        throw new HabitDomainError('INVALID_TRANSITION', '喂养记录状态异常', 409);
      }
      const allActiveFeeds = await tx.petFeedRecord.findMany({
        where: { childProfileId: checkIn.childProfileId, localDate: feed.localDate, status: FeedRecordStatus.FED },
        orderBy: { fedAt: 'asc' },
      });
      const remaining = allActiveFeeds.filter((item) => item.id !== feed.id);
      const oldRainbow = allActiveFeeds.reduce((sum, item) => sum + item.rainbowDelta, 0);
      const targetRainbow = nutrientCoverage(remaining.map((item) => parseNutrients(item.nutrientDeltaSnapshotJson))) >= 4 ? 2 : 0;
      await tx.petFeedRecord.updateMany({
        where: { id: { in: remaining.map((item) => item.id) } },
        data: { rainbowDelta: 0 },
      });
      if (targetRainbow && remaining[0]) {
        await tx.petFeedRecord.update({ where: { id: remaining[0].id }, data: { rainbowDelta: targetRainbow } });
      }
      await tx.petFeedRecord.update({
        where: { id: feed.id },
        data: { status: FeedRecordStatus.REVERSED, reversedAt: new Date(), rainbowDelta: 0 },
      });
      const companion = await tx.petGrowth.findUnique({ where: { childProfileId: checkIn.childProfileId } });
      if (!companion) throw new HabitDomainError('COMPANION_NOT_FOUND', '伙伴档案不存在', 404);
      const nutrients = addNutrients(
        parseNutrients(companion.nutrientStateJson),
        parseNutrients(feed.nutrientDeltaSnapshotJson),
        -1,
      );
      const growthValue = Math.max(0, companion.growthValue - feed.growthDelta - oldRainbow + targetRainbow);
      await tx.petGrowth.update({
        where: { childProfileId: checkIn.childProfileId },
        data: { nutrientStateJson: JSON.stringify(nutrients), growthValue },
      });
    }
    if (grant) {
      await tx.checkInRewardGrant.update({
        where: { id: grant.id },
        data: { status: RewardGrantStatus.REVOKED, selectedCardKey: null, version: { increment: 1 } },
      });
    }
    const updated = await tx.habitCheckIn.update({
      where: { id: checkInId },
      data: { status: HabitCheckInStatus.REVOKED, revokedAt: new Date(), version: { increment: 1 } },
    });
    const response = {
      outcome: 'REVOKED',
      checkIn: updated,
      hadFed,
      rewardStatus: grant?.status || null,
      progress: await getProgress(tx, checkIn.childProfileId, clock.localDate),
    };
    await saveCommand(tx, checkIn.childProfileId, HabitCommandOperation.REVOKE, idempotencyKey, resourceId, response);
    return response;
  }));
  const resultMeta = result as { hadFed?: boolean; rewardStatus?: string | null };
  void createOperationEvent({
    eventType: HABIT_EVENTS.REVOKE,
    userId,
    metadata: {
      childProfileId: initial.childProfileId,
      hadFed: Boolean(resultMeta.hadFed),
      rewardStatus: resultMeta.rewardStatus || null,
    },
  });
  return result;
}

export async function getFoodAlbum(userId: string, childProfileId: number) {
  await requireOwnedProfile(prisma, childProfileId, userId);
  const [definitions, inventory] = await Promise.all([
    prisma.foodCardDefinition.findMany({ where: { enabled: true }, orderBy: { cardKey: 'asc' } }),
    prisma.petFoodCard.findMany({ where: { childProfileId } }),
  ]);
  const inventoryMap = new Map(inventory.map((item) => [item.cardKey, item]));
  return definitions.map((definition) => {
    const owned = inventoryMap.get(definition.cardKey);
    return {
      ...definition,
      nutrients: parseNutrients(definition.nutrientDeltaJson),
      tags: safeJson<string[]>(definition.backTagsJson, []),
      discovered: Boolean(owned),
      discoveredAt: owned?.discoveredAt || null,
      quantity: owned?.quantity || 0,
      image: `/habits/foods/${definition.cardKey}.png`,
    };
  });
}

export async function getLegacyHabitAssets(userId: string, childProfileId: number) {
  await requireOwnedProfile(prisma, childProfileId, userId);
  const [growth, inventory, milestones, feeds] = await Promise.all([
    prisma.companionGrowth.findUnique({ where: { childProfileId } }),
    prisma.childFoodCard.findMany({ where: { childProfileId }, include: { definition: true }, orderBy: { discoveredAt: 'asc' } }),
    prisma.companionMilestone.findMany({ where: { childProfileId }, orderBy: { unlockedAt: 'asc' } }),
    prisma.companionFeedRecord.findMany({ where: { childProfileId }, orderBy: { fedAt: 'desc' }, take: 50 }),
  ]);
  return { growth, inventory, milestones, feeds, readOnly: true };
}

export async function getHabitHistory(userId: string, childProfileId: number, month?: string | null) {
  await requireOwnedProfile(prisma, childProfileId, userId);
  const clock = getBusinessClock();
  const selectedMonth = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ? month
    : clock.localDate.slice(0, 7);
  const records = await prisma.habitCheckIn.findMany({
    where: { childProfileId, localDate: { startsWith: selectedMonth } },
    include: { childHabit: true, rewardGrant: { include: { feedRecord: true } } },
    orderBy: [{ localDate: 'desc' }, { completedAt: 'desc' }],
  });
  const days = new Map<string, typeof records>();
  records.forEach((record) => {
    const group = days.get(record.localDate) || [];
    group.push(record);
    days.set(record.localDate, group);
  });
  return {
    month: selectedMonth,
    timezone: clock.timezone,
    currentLocalDate: clock.localDate,
    days: Array.from(days.entries()).map(([localDate, items]) => ({
      localDate,
      completed: items.filter((item) => item.status === HabitCheckInStatus.COMPLETED).length,
      records: items.map((item) => ({
        id: item.id,
        habitId: item.childHabitId,
        habitName: item.childHabit.name,
        habitEmoji: item.childHabit.emoji,
        slot: item.slot,
        status: item.status,
        completedAt: item.completedAt,
        canRevoke: localDate === clock.localDate && item.status === HabitCheckInStatus.COMPLETED && item.petEra,
        archived: !item.petEra,
        rewardStatus: item.rewardGrant?.status || null,
        hadFed: item.rewardGrant?.feedRecord?.status === FeedRecordStatus.FED,
      })),
    })),
  };
}

export function toHabitError(error: unknown) {
  if (error instanceof HabitDomainError) return error;
  if (error instanceof ContentValidationError) {
    return new HabitDomainError('CONTENT_BLOCKED', error.message, 400, {
      field: error.field,
      category: error.category,
    });
  }
  return null;
}
