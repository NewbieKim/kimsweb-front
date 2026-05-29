-- CreateTable
CREATE TABLE "OperationEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "visitorId" TEXT,
    "storyId" INTEGER,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "OperationEvent_eventType_idx" ON "OperationEvent"("eventType");

-- CreateIndex
CREATE INDEX "OperationEvent_userId_idx" ON "OperationEvent"("userId");

-- CreateIndex
CREATE INDEX "OperationEvent_visitorId_idx" ON "OperationEvent"("visitorId");

-- CreateIndex
CREATE INDEX "OperationEvent_createdAt_idx" ON "OperationEvent"("createdAt");
