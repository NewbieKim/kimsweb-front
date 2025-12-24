-- CreateTable
CREATE TABLE "Story" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ageGroup" TEXT NOT NULL,
    "themeType" TEXT NOT NULL,
    "classicTheme" TEXT,
    "classicSubTheme" TEXT,
    "customTheme" TEXT,
    "characterSettings" TEXT NOT NULL,
    "wordLimit" INTEGER NOT NULL,
    "content" TEXT,
    "extData" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Music" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "musicStyle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audioUrl" TEXT,
    "extData" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Music_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "storyId" INTEGER,
    "musicId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoreTransaction_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScoreTransaction_musicId_fkey" FOREIGN KEY ("musicId") REFERENCES "Music" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScoreTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Story_userId_idx" ON "Story"("userId");

-- CreateIndex
CREATE INDEX "Story_themeType_idx" ON "Story"("themeType");

-- CreateIndex
CREATE INDEX "Music_userId_idx" ON "Music"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserScore_userId_key" ON "UserScore"("userId");

-- CreateIndex
CREATE INDEX "UserScore_userId_idx" ON "UserScore"("userId");

-- CreateIndex
CREATE INDEX "ScoreTransaction_userId_idx" ON "ScoreTransaction"("userId");

-- CreateIndex
CREATE INDEX "ScoreTransaction_transactionType_idx" ON "ScoreTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "ScoreTransaction_createdAt_idx" ON "ScoreTransaction"("createdAt");
