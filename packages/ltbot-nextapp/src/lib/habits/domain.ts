export const HABIT_TIMEZONE = 'Asia/Shanghai';
export const HABIT_DAY_START_HOUR = 4;
export const DAILY_REWARD_LIMIT = 3;
export const DAILY_GROWTH_LIMIT = 8;

export const NUTRIENT_KEYS = [
  'energy',
  'protein',
  'calcium',
  'iron',
  'vitamin',
  'water',
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type NutrientState = Record<NutrientKey, number>;
export type HabitSlot = 'morning' | 'nap' | 'evening' | 'daily';
export type CompanionAppearance = 'cat' | 'dog' | 'rabbit' | 'frog' | 'astronaut';

export const EMPTY_NUTRIENTS: NutrientState = {
  energy: 0,
  protein: 0,
  calcium: 0,
  iron: 0,
  vitamin: 0,
  water: 0,
};

export const COMPANION_APPEARANCES: Array<{
  key: CompanionAppearance;
  name: string;
  emoji: string;
  image: string;
}> = [
  { key: 'cat', name: '小猫', emoji: '🐱', image: '/habits/companions/cat.png' },
  { key: 'dog', name: '小狗', emoji: '🐶', image: '/habits/companions/dog.png' },
  { key: 'rabbit', name: '小兔子', emoji: '🐰', image: '/habits/companions/rabbit.png' },
  { key: 'frog', name: '小青蛙', emoji: '🐸', image: '/habits/companions/frog.png' },
  { key: 'astronaut', name: '宇航员', emoji: '🧑‍🚀', image: '/habits/companions/astronaut.png' },
];

export const NUTRIENT_LABELS: Record<NutrientKey, { label: string; emoji: string; color: string }> = {
  energy: { label: '活力能量', emoji: '⚡', color: '#f4b64b' },
  protein: { label: '成长蛋白', emoji: '💪', color: '#ef7797' },
  calcium: { label: '骨骼钙', emoji: '🦴', color: '#8275df' },
  iron: { label: '元气铁', emoji: '🚂', color: '#ca7464' },
  vitamin: { label: '缤纷维生素', emoji: '🌈', color: '#66bd72' },
  water: { label: '清爽水分', emoji: '💧', color: '#51aed7' },
};

export class HabitDomainError extends Error {
  constructor(
    readonly errorCode: string,
    message: string,
    readonly status = 400,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HabitDomainError';
  }
}

function shanghaiParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: HABIT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

function dateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: HABIT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export interface BusinessClock {
  serverNow: string;
  timezone: typeof HABIT_TIMEZONE;
  localDate: string;
  localMinute: number;
}

export function getBusinessClock(now = new Date()): BusinessClock {
  const parts = shanghaiParts(now);
  return {
    serverNow: now.toISOString(),
    timezone: HABIT_TIMEZONE,
    localDate: dateKey(new Date(now.getTime() - HABIT_DAY_START_HOUR * 60 * 60 * 1000)),
    localMinute: parts.hour * 60 + parts.minute,
  };
}

function addDays(localDate: string, days: number) {
  const date = new Date(`${localDate}T12:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

function localIso(localDate: string, minuteOfDay: number) {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return new Date(`${localDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`).toISOString();
}

type SlotWindow = { start: number; end: number; windowLabel: string };

function slotWindow(slot: Exclude<HabitSlot, 'daily'>, templateKey: string | null): SlotWindow {
  if (slot === 'morning') return { start: 4 * 60, end: 12 * 60, windowLabel: '早上 04:00–12:00' };
  if (slot === 'nap') return { start: 11 * 60 + 30, end: 15 * 60 + 30, windowLabel: '午休 11:30–15:30' };
  return templateKey === 'bedtime'
    ? { start: 18 * 60, end: 4 * 60, windowLabel: '晚上 18:00–次日 04:00' }
    : { start: 17 * 60, end: 4 * 60, windowLabel: '晚上 17:00–次日 04:00' };
}

export function getSlotAvailability(
  slot: HabitSlot,
  templateKey: string | null,
  clock: BusinessClock,
) {
  const minute = clock.localMinute;
  if (slot === 'daily') {
    return { isOpen: true, nextOpenAt: null, windowLabel: '全天' };
  }
  const window = slotWindow(slot, templateKey);
  const wrapsMidnight = window.start > window.end;
  const isOpen = wrapsMidnight
    ? minute >= window.start || minute < window.end
    : minute >= window.start && minute < window.end;
  const nextDate = !wrapsMidnight && (minute < HABIT_DAY_START_HOUR * 60 || minute >= window.end)
    ? addDays(clock.localDate, 1)
    : clock.localDate;
  return {
    isOpen,
    nextOpenAt: isOpen ? null : localIso(nextDate, window.start),
    windowLabel: window.windowLabel,
  };
}

export function parseNutrients(value: string | null | undefined): NutrientState {
  try {
    const parsed = JSON.parse(value || '{}') as Partial<NutrientState>;
    return Object.fromEntries(
      NUTRIENT_KEYS.map((key) => [key, Math.max(0, Number(parsed[key]) || 0)]),
    ) as NutrientState;
  } catch {
    return { ...EMPTY_NUTRIENTS };
  }
}

export function addNutrients(base: NutrientState, delta: Partial<NutrientState>, factor = 1) {
  return Object.fromEntries(
    NUTRIENT_KEYS.map((key) => [key, Math.max(0, base[key] + (delta[key] || 0) * factor)]),
  ) as NutrientState;
}

export function nutrientCoverage(deltas: Array<Partial<NutrientState>>) {
  const covered = new Set<NutrientKey>();
  deltas.forEach((delta) => {
    NUTRIENT_KEYS.forEach((key) => {
      if ((delta[key] || 0) > 0) covered.add(key);
    });
  });
  return covered.size;
}

export function resolveStage(growthValue: number) {
  if (growthValue >= 140) return 5;
  if (growthValue >= 70) return 4;
  if (growthValue >= 30) return 3;
  if (growthValue >= 10) return 2;
  return 1;
}

export function stageLabel(stage: number) {
  return ['初来乍到', '熟悉新家', '一起探险', '星光搭档', '长久陪伴'][stage - 1] || '初来乍到';
}

export interface CandidateDefinition {
  cardKey: string;
  nutrientDeltaJson: string;
}

export function pickRewardCandidates(
  definitions: CandidateDefinition[],
  nutrients: NutrientState,
  random: () => number = Math.random,
) {
  if (definitions.length < 3) {
    throw new HabitDomainError('CATALOG_UNAVAILABLE', '食物卡目录暂不可用', 503);
  }
  const minimum = Math.min(...NUTRIENT_KEYS.map((key) => nutrients[key]));
  const weakest = NUTRIENT_KEYS.filter((key) => nutrients[key] === minimum);
  const target = weakest[Math.floor(random() * weakest.length)];
  const supporting = definitions.filter(
    (definition) => (parseNutrients(definition.nutrientDeltaJson)[target] || 0) > 0,
  );
  const first = supporting[Math.floor(random() * supporting.length)] || definitions[0];
  const rest = definitions
    .filter((definition) => definition.cardKey !== first.cardKey)
    .map((definition) => ({ definition, weight: random() }))
    .sort((a, b) => a.weight - b.weight)
    .slice(0, 2)
    .map(({ definition }) => definition);
  return [first, ...rest].map((definition) => definition.cardKey);
}

export function isHabitsEnabled() {
  const value = (process.env.HABITS_ENABLED || 'true').trim().toLowerCase();
  return !['false', '0', 'off', 'no'].includes(value);
}

export function assertIdempotencyKey(value: unknown) {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw new HabitDomainError('INVALID_IDEMPOTENCY_KEY', '幂等键格式无效', 400);
  }
  return key;
}
