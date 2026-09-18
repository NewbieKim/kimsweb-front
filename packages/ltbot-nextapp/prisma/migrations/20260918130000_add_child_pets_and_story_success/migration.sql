ALTER TABLE "ChildProfile" ADD COLUMN "successfulStoryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CheckInRewardGrant" ADD COLUMN "petEra" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoryCustomization" ADD COLUMN "includePet" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoryCustomization" ADD COLUMN "petSnapshotJson" TEXT;
ALTER TABLE "StoryCustomization" ADD COLUMN "successOrdinal" INTEGER;
ALTER TABLE "StoryCustomization" ADD COLUMN "petAdventureOrdinal" INTEGER;
ALTER TABLE "StoryCustomization" ADD COLUMN "completedAt" DATETIME;

CREATE TABLE "PetDefinition" (
  "petKey" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "personalityKey" TEXT NOT NULL,
  "assetVersion" INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "ChildPet" (
  "childProfileId" INTEGER NOT NULL PRIMARY KEY,
  "petKey" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "personalityKey" TEXT NOT NULL,
  "assetVersion" INTEGER NOT NULL DEFAULT 1,
  "adoptedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "speciesLockedAt" DATETIME,
  "completedAdventureCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChildPet_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChildPet_petKey_fkey" FOREIGN KEY ("petKey") REFERENCES "PetDefinition" ("petKey") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PetGrowth" (
  "childProfileId" INTEGER NOT NULL PRIMARY KEY,
  "highestStage" INTEGER NOT NULL DEFAULT 1,
  "growthValue" INTEGER NOT NULL DEFAULT 0,
  "nutrientStateJson" TEXT NOT NULL DEFAULT '{"energy":0,"protein":0,"calcium":0,"iron":0,"vitamin":0,"water":0}',
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PetGrowth_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildPet" ("childProfileId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PetGrowth_growthValue_check" CHECK ("growthValue" >= 0 AND "highestStage" BETWEEN 1 AND 5)
);

CREATE TABLE "PetFoodCard" (
  "childProfileId" INTEGER NOT NULL,
  "cardKey" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("childProfileId", "cardKey"),
  CONSTRAINT "PetFoodCard_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildPet" ("childProfileId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PetFoodCard_cardKey_fkey" FOREIGN KEY ("cardKey") REFERENCES "FoodCardDefinition" ("cardKey") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PetFoodCard_quantity_check" CHECK ("quantity" >= 0)
);

CREATE TABLE "PetFeedRecord" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "childProfileId" INTEGER NOT NULL,
  "grantId" INTEGER NOT NULL UNIQUE,
  "timezone" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "cardKey" TEXT NOT NULL,
  "nutrientDeltaSnapshotJson" TEXT NOT NULL,
  "growthDelta" INTEGER NOT NULL,
  "rainbowDelta" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'FED',
  "fedAt" DATETIME NOT NULL,
  "reversedAt" DATETIME,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PetFeedRecord_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildPet" ("childProfileId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PetFeedRecord_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "CheckInRewardGrant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PetFeedRecord_status_check" CHECK ("status" IN ('FED', 'REVERSED'))
);

CREATE TABLE "PetMilestone" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "childProfileId" INTEGER NOT NULL,
  "milestoneKey" TEXT NOT NULL,
  "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PetMilestone_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildPet" ("childProfileId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PetFoodCard_childProfileId_quantity_idx" ON "PetFoodCard"("childProfileId", "quantity");
CREATE INDEX "PetFeedRecord_childProfileId_localDate_status_idx" ON "PetFeedRecord"("childProfileId", "localDate", "status");
CREATE UNIQUE INDEX "PetMilestone_childProfileId_milestoneKey_key" ON "PetMilestone"("childProfileId", "milestoneKey");

INSERT INTO "PetDefinition" ("petKey", "name", "personalityKey", "assetVersion", "sortOrder", "enabled") VALUES
('cat', '小猫', 'observant', 1, 1, true),
('dog', '小狗', 'reliable', 1, 2, true),
('rabbit', '小兔子', 'gentle', 1, 3, true),
('hamster', '小仓鼠', 'collector', 1, 4, true),
('guinea_pig', '豚鼠', 'curious', 1, 5, true),
('chinchilla', '龙猫', 'careful', 1, 6, true),
('alpaca', '羊驼', 'guide', 1, 7, true),
('mini_pig', '小香猪', 'scent', 1, 8, true),
('goat', '小山羊', 'brave', 1, 9, true),
('sheep', '小绵羊', 'kind', 1, 10, true),
('pony', '小马', 'steady', 1, 11, true),
('duck', '小鸭子', 'social', 1, 12, true);

-- Only retained, completed customized stories can be counted for the legacy baseline.
WITH ranked AS (
  SELECT sc."id", ROW_NUMBER() OVER (PARTITION BY s."childProfileId" ORDER BY s."createdAt", s."id") AS ordinal
  FROM "StoryCustomization" sc JOIN "Story" s ON s."id" = sc."storyId"
  WHERE s."childProfileId" IS NOT NULL AND s."content" IS NOT NULL AND length(trim(s."content")) > 0
)
UPDATE "StoryCustomization"
SET "successOrdinal" = (SELECT ordinal FROM ranked WHERE ranked."id" = "StoryCustomization"."id"),
    "completedAt" = (SELECT s."updatedAt" FROM "Story" s WHERE s."id" = "StoryCustomization"."storyId")
WHERE "id" IN (SELECT "id" FROM ranked);

UPDATE "ChildProfile" SET "successfulStoryCount" = (
  SELECT COUNT(*) FROM "StoryCustomization" sc JOIN "Story" s ON s."id" = sc."storyId"
  WHERE s."childProfileId" = "ChildProfile"."id" AND sc."successOrdinal" IS NOT NULL
);
