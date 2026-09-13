PRAGMA foreign_keys=OFF;

CREATE TABLE "HabitTemplate" (
  "templateKey" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "defaultFrequency" TEXT NOT NULL,
  "defaultSlotsJson" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "HabitTemplate_frequency_check" CHECK ("defaultFrequency" IN ('DAILY', 'TWICE_DAILY'))
);

CREATE TABLE "ChildHabit" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "childProfileId" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "templateKey" TEXT,
  "name" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "slotsJson" TEXT NOT NULL,
  "timeWindowJson" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ChildHabit_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChildHabit_templateKey_fkey" FOREIGN KEY ("templateKey") REFERENCES "HabitTemplate" ("templateKey") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ChildHabit_source_check" CHECK (("source" = 'TEMPLATE' AND "templateKey" IS NOT NULL) OR ("source" = 'CUSTOM' AND "templateKey" IS NULL)),
  CONSTRAINT "ChildHabit_frequency_check" CHECK ("frequency" IN ('DAILY', 'TWICE_DAILY'))
);

CREATE TABLE "HabitCheckIn" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "childProfileId" INTEGER NOT NULL,
  "childHabitId" INTEGER NOT NULL,
  "timezone" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "slot" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "completedAt" DATETIME NOT NULL,
  "revokedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "HabitCheckIn_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HabitCheckIn_childHabitId_fkey" FOREIGN KEY ("childHabitId") REFERENCES "ChildHabit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "HabitCheckIn_status_check" CHECK ("status" IN ('COMPLETED', 'REVOKED')),
  CONSTRAINT "HabitCheckIn_version_check" CHECK ("version" >= 1),
  CONSTRAINT "HabitCheckIn_localDate_check" CHECK (length("localDate") = 10)
);

CREATE TABLE "CompanionGrowth" (
  "childProfileId" INTEGER NOT NULL PRIMARY KEY,
  "displayName" TEXT NOT NULL DEFAULT '小芽',
  "appearanceKey" TEXT NOT NULL DEFAULT 'rabbit',
  "baseAppearanceKey" TEXT,
  "highestStage" INTEGER NOT NULL DEFAULT 1,
  "growthValue" INTEGER NOT NULL DEFAULT 0,
  "nutrientStateJson" TEXT NOT NULL DEFAULT '{"energy":0,"protein":0,"calcium":0,"iron":0,"vitamin":0,"water":0}',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CompanionGrowth_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CompanionGrowth_stage_check" CHECK ("highestStage" BETWEEN 1 AND 5),
  CONSTRAINT "CompanionGrowth_growth_check" CHECK ("growthValue" >= 0),
  CONSTRAINT "CompanionGrowth_appearance_check" CHECK ("appearanceKey" IN ('cat', 'dog', 'rabbit', 'frog', 'astronaut', 'custom')),
  CONSTRAINT "CompanionGrowth_base_appearance_check" CHECK ("baseAppearanceKey" IS NULL OR "baseAppearanceKey" IN ('cat', 'dog', 'rabbit', 'frog', 'astronaut')),
  CONSTRAINT "CompanionGrowth_nutrients_check" CHECK (
    json_valid("nutrientStateJson") AND
    json_extract("nutrientStateJson", '$.energy') >= 0 AND
    json_extract("nutrientStateJson", '$.protein') >= 0 AND
    json_extract("nutrientStateJson", '$.calcium') >= 0 AND
    json_extract("nutrientStateJson", '$.iron') >= 0 AND
    json_extract("nutrientStateJson", '$.vitamin') >= 0 AND
    json_extract("nutrientStateJson", '$.water') >= 0
  )
);

CREATE TABLE "FoodCardDefinition" (
  "cardKey" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "nutrientDeltaJson" TEXT NOT NULL,
  "factText" TEXT NOT NULL,
  "backTagsJson" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "FoodCardDefinition_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "ChildFoodCard" (
  "childProfileId" INTEGER NOT NULL,
  "cardKey" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "discoveredAt" DATETIME NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  PRIMARY KEY ("childProfileId", "cardKey"),
  CONSTRAINT "ChildFoodCard_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChildFoodCard_cardKey_fkey" FOREIGN KEY ("cardKey") REFERENCES "FoodCardDefinition" ("cardKey") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ChildFoodCard_quantity_check" CHECK ("quantity" >= 0)
);

CREATE TABLE "CheckInRewardGrant" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "checkInId" INTEGER NOT NULL,
  "childProfileId" INTEGER NOT NULL,
  "timezone" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "dailyRewardIndex" INTEGER NOT NULL,
  "candidatesJson" TEXT NOT NULL,
  "selectedCardKey" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING_SELECT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CheckInRewardGrant_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "HabitCheckIn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CheckInRewardGrant_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CheckInRewardGrant_index_check" CHECK ("dailyRewardIndex" BETWEEN 1 AND 3),
  CONSTRAINT "CheckInRewardGrant_status_check" CHECK ("status" IN ('PENDING_SELECT', 'SELECTED', 'FED', 'REVOKED')),
  CONSTRAINT "CheckInRewardGrant_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "CompanionFeedRecord" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "childProfileId" INTEGER NOT NULL,
  "grantId" INTEGER NOT NULL,
  "timezone" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "cardKey" TEXT NOT NULL,
  "nutrientDeltaSnapshotJson" TEXT NOT NULL,
  "growthDelta" INTEGER NOT NULL,
  "rainbowDelta" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'FED',
  "version" INTEGER NOT NULL DEFAULT 1,
  "fedAt" DATETIME NOT NULL,
  "reversedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CompanionFeedRecord_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CompanionFeedRecord_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "CheckInRewardGrant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CompanionFeedRecord_status_check" CHECK ("status" IN ('FED', 'REVERSED')),
  CONSTRAINT "CompanionFeedRecord_growth_check" CHECK ("growthDelta" >= 0 AND "rainbowDelta" >= 0),
  CONSTRAINT "CompanionFeedRecord_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "CompanionMilestone" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "childProfileId" INTEGER NOT NULL,
  "milestoneKey" TEXT NOT NULL,
  "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rewardJson" TEXT NOT NULL,
  CONSTRAINT "CompanionMilestone_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "HabitCommand" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "childProfileId" INTEGER NOT NULL,
  "operation" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "resourceId" TEXT,
  "responseSnapshotJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HabitCommand_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HabitCommand_operation_check" CHECK ("operation" IN ('CHECK_IN', 'REVOKE', 'SELECT', 'FEED')),
  CONSTRAINT "HabitCommand_key_check" CHECK (length("idempotencyKey") BETWEEN 1 AND 64)
);

CREATE UNIQUE INDEX "ChildHabit_childProfileId_templateKey_key" ON "ChildHabit"("childProfileId", "templateKey");
CREATE INDEX "ChildHabit_childProfileId_enabled_idx" ON "ChildHabit"("childProfileId", "enabled");
CREATE INDEX "ChildHabit_childProfileId_deletedAt_idx" ON "ChildHabit"("childProfileId", "deletedAt");
CREATE UNIQUE INDEX "HabitCheckIn_childProfileId_childHabitId_localDate_slot_key" ON "HabitCheckIn"("childProfileId", "childHabitId", "localDate", "slot");
CREATE INDEX "HabitCheckIn_childProfileId_localDate_status_idx" ON "HabitCheckIn"("childProfileId", "localDate", "status");
CREATE INDEX "ChildFoodCard_childProfileId_quantity_idx" ON "ChildFoodCard"("childProfileId", "quantity");
CREATE UNIQUE INDEX "CheckInRewardGrant_checkInId_key" ON "CheckInRewardGrant"("checkInId");
CREATE UNIQUE INDEX "CheckInRewardGrant_childProfileId_localDate_dailyRewardIndex_key" ON "CheckInRewardGrant"("childProfileId", "localDate", "dailyRewardIndex");
CREATE INDEX "CheckInRewardGrant_childProfileId_status_createdAt_idx" ON "CheckInRewardGrant"("childProfileId", "status", "createdAt");
CREATE UNIQUE INDEX "CompanionFeedRecord_grantId_key" ON "CompanionFeedRecord"("grantId");
CREATE INDEX "CompanionFeedRecord_childProfileId_localDate_status_idx" ON "CompanionFeedRecord"("childProfileId", "localDate", "status");
CREATE UNIQUE INDEX "CompanionMilestone_childProfileId_milestoneKey_key" ON "CompanionMilestone"("childProfileId", "milestoneKey");
CREATE INDEX "CompanionMilestone_childProfileId_unlockedAt_idx" ON "CompanionMilestone"("childProfileId", "unlockedAt");
CREATE UNIQUE INDEX "HabitCommand_childProfileId_operation_idempotencyKey_key" ON "HabitCommand"("childProfileId", "operation", "idempotencyKey");
CREATE INDEX "HabitCommand_childProfileId_createdAt_idx" ON "HabitCommand"("childProfileId", "createdAt");

INSERT INTO "HabitTemplate" ("templateKey", "name", "emoji", "defaultFrequency", "defaultSlotsJson", "sortOrder", "enabled") VALUES
  ('brush', '认真刷牙', '🪥', 'TWICE_DAILY', '["morning","evening"]', 1, true),
  ('bathe', '洗澡或洗漱', '🛁', 'DAILY', '["daily"]', 2, true),
  ('tidy', '收好玩具', '🧸', 'DAILY', '["daily"]', 3, true),
  ('read', '今日阅读', '📖', 'DAILY', '["daily"]', 4, true),
  ('story', '听一个故事', '🎧', 'DAILY', '["daily"]', 5, true),
  ('bedtime', '按时睡觉', '🌙', 'DAILY', '["daily"]', 6, true);

INSERT INTO "FoodCardDefinition" ("cardKey", "name", "emoji", "nutrientDeltaJson", "factText", "backTagsJson", "version", "enabled") VALUES
  ('rice', '米饭', '🍚', '{"energy":4}', '给今天的冒险加满出发力。', '["谷物","活力能量"]', 1, true),
  ('oats', '燕麦', '🥣', '{"energy":3,"protein":1}', '慢慢释放活力的小谷粒。', '["谷物","成长蛋白"]', 1, true),
  ('sweet_potato', '红薯', '🍠', '{"energy":2,"vitamin":1,"water":1}', '藏着甜甜能量的地下宝藏。', '["薯类","缤纷维生素"]', 1, true),
  ('egg', '鸡蛋', '🥚', '{"protein":2,"energy":1,"vitamin":1}', '小小一颗，也有建造身体的材料。', '["蛋类","成长蛋白"]', 1, true),
  ('milk', '奶类', '🥛', '{"calcium":2,"protein":1,"water":1}', '把骨骼小屋搭得稳稳的。', '["奶类","骨骼钙"]', 1, true),
  ('tofu', '豆腐', '◻️', '{"protein":2,"calcium":1,"iron":1}', '软软的豆豆变身记。', '["豆制品","成长蛋白"]', 1, true),
  ('fish', '鱼', '🐟', '{"protein":2,"energy":1,"vitamin":1}', '来自水里的成长伙伴。', '["水产","成长蛋白"]', 1, true),
  ('lean_meat', '瘦肉', '🍖', '{"protein":2,"iron":2}', '帮助元气小火车运送氧气。', '["肉类","元气铁"]', 1, true),
  ('broccoli', '西兰花', '🥦', '{"vitamin":2,"water":1,"calcium":1}', '像一棵可以吃的小树。', '["蔬菜","缤纷维生素"]', 1, true),
  ('carrot', '胡萝卜', '🥕', '{"vitamin":3,"energy":1}', '橙色食物也有自己的小本领。', '["蔬菜","缤纷维生素"]', 1, true),
  ('orange', '橙子', '🍊', '{"vitamin":2,"water":2}', '酸甜果瓣装着缤纷小帮手。', '["水果","清爽水分"]', 1, true),
  ('water', '白水', '💧', '{"water":4}', '最简单的清爽补给。', '["饮水","清爽水分"]', 1, true);

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
