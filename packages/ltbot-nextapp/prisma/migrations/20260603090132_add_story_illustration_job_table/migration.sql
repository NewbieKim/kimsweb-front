-- CreateTable
CREATE TABLE "StoryIllustrationJob" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "storyId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "failReasonCode" TEXT NOT NULL DEFAULT 'NONE',
    "failReasonMessage" TEXT,
    "targetFrameCount" INTEGER NOT NULL,
    "generatedFrameCount" INTEGER NOT NULL DEFAULT 0,
    "successFrameCount" INTEGER NOT NULL DEFAULT 0,
    "failedFrameCount" INTEGER NOT NULL DEFAULT 0,
    "providerRequestId" TEXT,
    "idempotencyKey" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "lastCallbackAt" DATETIME,
    "extData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryIllustrationJob_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryIllustrationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryIllustrationFrame" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "storyId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "frameIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "prompt" TEXT,
    "promptVersion" TEXT,
    "provider" TEXT NOT NULL,
    "providerTaskId" TEXT,
    "imageUrl" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "caption" TEXT,
    "failReasonCode" TEXT NOT NULL DEFAULT 'NONE',
    "failReasonMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetryCount" INTEGER NOT NULL DEFAULT 2,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "callbackAt" DATETIME,
    "extData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryIllustrationFrame_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryIllustrationFrame_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "StoryIllustrationJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "illustrationStatus" TEXT,
    "illustrationTargetFrames" INTEGER,
    "illustrationGeneratedFrames" INTEGER NOT NULL DEFAULT 0,
    "illustrationLastJobId" INTEGER,
    "illustrationStartedAt" DATETIME,
    "illustrationCompletedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Story" ("ageGroup", "characterSettings", "classicSubTheme", "classicTheme", "content", "coverImage", "createdAt", "customTheme", "extData", "id", "imageGallery", "themeType", "updatedAt", "userId", "wordLimit") SELECT "ageGroup", "characterSettings", "classicSubTheme", "classicTheme", "content", "coverImage", "createdAt", "customTheme", "extData", "id", "imageGallery", "themeType", "updatedAt", "userId", "wordLimit" FROM "Story";
DROP TABLE "Story";
ALTER TABLE "new_Story" RENAME TO "Story";
CREATE INDEX "Story_userId_idx" ON "Story"("userId");
CREATE INDEX "Story_themeType_idx" ON "Story"("themeType");
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");
CREATE INDEX "Story_illustrationStatus_idx" ON "Story"("illustrationStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StoryIllustrationJob_idempotencyKey_key" ON "StoryIllustrationJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "StoryIllustrationJob_storyId_status_idx" ON "StoryIllustrationJob"("storyId", "status");

-- CreateIndex
CREATE INDEX "StoryIllustrationJob_userId_createdAt_idx" ON "StoryIllustrationJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StoryIllustrationJob_provider_createdAt_idx" ON "StoryIllustrationJob"("provider", "createdAt");

-- CreateIndex
CREATE INDEX "StoryIllustrationFrame_storyId_frameIndex_idx" ON "StoryIllustrationFrame"("storyId", "frameIndex");

-- CreateIndex
CREATE INDEX "StoryIllustrationFrame_status_updatedAt_idx" ON "StoryIllustrationFrame"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "StoryIllustrationFrame_providerTaskId_idx" ON "StoryIllustrationFrame"("providerTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryIllustrationFrame_jobId_frameIndex_key" ON "StoryIllustrationFrame"("jobId", "frameIndex");
