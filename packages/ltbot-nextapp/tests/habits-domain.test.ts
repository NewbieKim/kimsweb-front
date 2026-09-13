import { describe, expect, it } from 'vitest';
import {
  EMPTY_NUTRIENTS,
  getBusinessClock,
  getSlotAvailability,
  NUTRIENT_KEYS,
  parseNutrients,
  pickRewardCandidates,
  resolveStage,
} from '@/lib/habits/domain';
import { FOOD_EDUCATION, getFoodEducation } from '@/lib/habits/food-education';

function atShanghai(isoLocal: string) {
  return new Date(`${isoLocal}+08:00`);
}

describe('habit domain clock', () => {
  it('uses the previous business date before 04:00', () => {
    expect(getBusinessClock(atShanghai('2026-09-11T03:59:00')).localDate).toBe('2026-09-10');
    expect(getBusinessClock(atShanghai('2026-09-11T04:00:00')).localDate).toBe('2026-09-11');
  });

  it('opens brushing in broad morning and evening windows', () => {
    const morning = getBusinessClock(atShanghai('2026-09-11T04:00:00'));
    const noon = getBusinessClock(atShanghai('2026-09-11T12:00:00'));
    const evening = getBusinessClock(atShanghai('2026-09-11T17:00:00'));
    const beforeEvening = getBusinessClock(atShanghai('2026-09-11T16:59:00'));
    expect(getSlotAvailability('morning', 'brush', morning).isOpen).toBe(true);
    expect(getSlotAvailability('morning', 'brush', noon).isOpen).toBe(false);
    expect(getSlotAvailability('evening', 'brush', beforeEvening).isOpen).toBe(false);
    expect(getSlotAvailability('evening', 'brush', evening).isOpen).toBe(true);
    expect(getSlotAvailability('daily', 'bathe', noon).isOpen).toBe(true);
  });

  it('opens bedtime for nap and evening periods', () => {
    const napStart = getBusinessClock(atShanghai('2026-09-11T11:30:00'));
    const napEnd = getBusinessClock(atShanghai('2026-09-11T15:30:00'));
    const beforeBedtime = getBusinessClock(atShanghai('2026-09-11T17:59:00'));
    const bedtime = getBusinessClock(atShanghai('2026-09-11T18:00:00'));
    expect(getSlotAvailability('nap', 'bedtime', napStart)).toMatchObject({
      isOpen: true,
      windowLabel: '午休 11:30–15:30',
    });
    expect(getSlotAvailability('nap', 'bedtime', napEnd).isOpen).toBe(false);
    expect(getSlotAvailability('evening', 'bedtime', beforeBedtime).isOpen).toBe(false);
    expect(getSlotAvailability('evening', 'bedtime', bedtime).isOpen).toBe(true);
  });

  it('points pre-dawn morning and nap openings to the coming calendar day', () => {
    const preDawn = getBusinessClock(atShanghai('2026-09-11T02:00:00'));
    expect(getSlotAvailability('morning', 'brush', preDawn).nextOpenAt).toBe('2026-09-10T20:00:00.000Z');
    expect(getSlotAvailability('nap', 'bedtime', preDawn).nextOpenAt).toBe('2026-09-11T03:30:00.000Z');
  });
});

describe('habit reward and growth rules', () => {
  it('returns three distinct cards and targets a weakest nutrient', () => {
    const definitions = NUTRIENT_KEYS.map((key, index) => ({
      cardKey: `card-${index}`,
      nutrientDeltaJson: JSON.stringify({ [key]: 1 }),
    }));
    const candidates = pickRewardCandidates(definitions, EMPTY_NUTRIENTS, () => 0);
    expect(candidates).toHaveLength(3);
    expect(new Set(candidates).size).toBe(3);
    expect(candidates[0]).toBe('card-0');
  });

  it('advances stages from growth and nutrient coverage', () => {
    const fourNutrients = { ...EMPTY_NUTRIENTS, energy: 1, protein: 1, calcium: 1, iron: 1 };
    expect(resolveStage(19, fourNutrients)).toBe(1);
    expect(resolveStage(20, fourNutrients)).toBe(2);
    expect(resolveStage(60, fourNutrients)).toBe(3);
    expect(resolveStage(140, fourNutrients)).toBe(4);
    expect(resolveStage(300, fourNutrients)).toBe(5);
  });

  it('normalizes malformed nutrient JSON to zeroes', () => {
    expect(parseNutrients('{broken')).toEqual(EMPTY_NUTRIENTS);
  });
});

describe('food education catalog', () => {
  it('contains nutrition and body benefits for every launch food card', () => {
    const launchCards = ['rice', 'oats', 'sweet_potato', 'egg', 'milk', 'tofu', 'fish', 'lean_meat', 'broccoli', 'carrot', 'orange', 'water'];
    expect(Object.keys(FOOD_EDUCATION).sort()).toEqual(launchCards.sort());
    launchCards.forEach((cardKey) => {
      const education = getFoodEducation(cardKey);
      expect(education.nutrients.length).toBeGreaterThan(0);
      expect(education.benefit.length).toBeGreaterThan(15);
    });
  });
});
