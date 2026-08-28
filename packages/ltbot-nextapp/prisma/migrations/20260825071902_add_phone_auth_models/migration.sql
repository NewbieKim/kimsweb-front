-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "ip" TEXT,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SmsSendLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "age" INTEGER,
    "extData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("age", "avatar", "createdAt", "email", "extData", "id", "name", "updatedAt") SELECT "age", "avatar", "createdAt", "email", "extData", "id", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LoginAttempt_phone_idx" ON "LoginAttempt"("phone");

-- CreateIndex
CREATE INDEX "LoginAttempt_updatedAt_idx" ON "LoginAttempt"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_phone_ip_key" ON "LoginAttempt"("phone", "ip");

-- CreateIndex
CREATE INDEX "SmsSendLog_phone_createdAt_idx" ON "SmsSendLog"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "SmsSendLog_createdAt_idx" ON "SmsSendLog"("createdAt");
