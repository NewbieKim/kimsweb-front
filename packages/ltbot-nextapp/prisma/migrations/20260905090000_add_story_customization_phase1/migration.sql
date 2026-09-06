PRAGMA foreign_keys=OFF;

CREATE TABLE "ChildProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "traitsJson" TEXT NOT NULL,
    "partnerJson" TEXT NOT NULL,
    "sequenceCounter" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChildProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "new_Story" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ageGroup" TEXT NOT NULL,
    "themeType" TEXT NOT NULL,
    "classicTheme" TEXT,
    "classicSubTheme" TEXT,
    "customTheme" TEXT,
    "characterSettings" TEXT NOT NULL,
    "wordLimit" INTEGER NOT NULL,
    "content" TEXT,
    "coverImage" TEXT,
    "imageGallery" TEXT,
    "extData" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "childProfileId" INTEGER,
    "illustrationStatus" TEXT,
    "illustrationTargetFrames" INTEGER,
    "illustrationGeneratedFrames" INTEGER NOT NULL DEFAULT 0,
    "illustrationLastJobId" INTEGER,
    "illustrationStartedAt" DATETIME,
    "illustrationCompletedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Story_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Story" (
    "id", "ageGroup", "themeType", "classicTheme", "classicSubTheme", "customTheme",
    "characterSettings", "wordLimit", "content", "coverImage", "imageGallery", "extData",
    "visibility", "childProfileId", "illustrationStatus", "illustrationTargetFrames",
    "illustrationGeneratedFrames", "illustrationLastJobId", "illustrationStartedAt",
    "illustrationCompletedAt", "userId", "createdAt", "updatedAt"
)
SELECT
    "id", "ageGroup", "themeType", "classicTheme", "classicSubTheme", "customTheme",
    "characterSettings", "wordLimit", "content", "coverImage", "imageGallery", "extData",
    'PUBLIC', NULL, "illustrationStatus", "illustrationTargetFrames",
    "illustrationGeneratedFrames", "illustrationLastJobId", "illustrationStartedAt",
    "illustrationCompletedAt", "userId", "createdAt", "updatedAt"
FROM "Story";

DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";

CREATE TABLE "StoryCustomization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "storyId" INTEGER NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "sequenceNumber" INTEGER NOT NULL,
    "childSnapshotJson" TEXT NOT NULL,
    "dreamWorldSnapshotJson" TEXT NOT NULL,
    "growthTheme" TEXT NOT NULL,
    "tonightMaterialIntent" TEXT,
    "tonightMaterialText" TEXT,
    "creationKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryCustomization_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ChildProfile_userId_deletedAt_updatedAt_idx" ON "ChildProfile"("userId", "deletedAt", "updatedAt");
CREATE UNIQUE INDEX "StoryCustomization_storyId_key" ON "StoryCustomization"("storyId");
CREATE UNIQUE INDEX "StoryCustomization_creationKey_key" ON "StoryCustomization"("creationKey");
CREATE INDEX "StoryCustomization_createdAt_idx" ON "StoryCustomization"("createdAt");
CREATE INDEX "Story_userId_idx" ON "Story"("userId");
CREATE INDEX "Story_themeType_idx" ON "Story"("themeType");
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");
CREATE INDEX "Story_visibility_createdAt_idx" ON "Story"("visibility", "createdAt");
CREATE INDEX "Story_userId_childProfileId_createdAt_idx" ON "Story"("userId", "childProfileId", "createdAt");
CREATE INDEX "Story_illustrationStatus_idx" ON "Story"("illustrationStatus");

PRAGMA foreign_keys=ON;
