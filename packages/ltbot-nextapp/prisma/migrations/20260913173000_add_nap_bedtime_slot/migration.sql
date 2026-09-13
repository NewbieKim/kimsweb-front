UPDATE "HabitTemplate"
SET "defaultFrequency" = 'TWICE_DAILY',
    "defaultSlotsJson" = '["nap","evening"]'
WHERE "templateKey" = 'bedtime';

UPDATE "ChildHabit"
SET "frequency" = 'TWICE_DAILY',
    "slotsJson" = '["nap","evening"]',
    "timeWindowJson" = '{"nap":{"start":"11:30","end":"15:30"},"evening":{"start":"18:00","end":"04:00"}}'
WHERE "templateKey" = 'bedtime';

UPDATE "ChildHabit"
SET "timeWindowJson" = '{"morning":{"start":"04:00","end":"12:00"},"evening":{"start":"17:00","end":"04:00"}}'
WHERE "templateKey" = 'brush';
