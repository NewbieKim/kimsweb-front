-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoginAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "ip" TEXT NOT NULL DEFAULT 'unknown',
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_LoginAttempt" ("failCount", "id", "ip", "lockedAt", "phone", "updatedAt") SELECT "failCount", "id", coalesce("ip", 'unknown') AS "ip", "lockedAt", "phone", "updatedAt" FROM "LoginAttempt";
DROP TABLE "LoginAttempt";
ALTER TABLE "new_LoginAttempt" RENAME TO "LoginAttempt";
CREATE INDEX "LoginAttempt_phone_idx" ON "LoginAttempt"("phone");
CREATE INDEX "LoginAttempt_updatedAt_idx" ON "LoginAttempt"("updatedAt");
CREATE UNIQUE INDEX "LoginAttempt_phone_ip_key" ON "LoginAttempt"("phone", "ip");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
