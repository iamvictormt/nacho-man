CREATE TABLE IF NOT EXISTS "IndicatorAnalysis" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "question" TEXT NOT NULL,
  "answer" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "model" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "IndicatorAnalysis_userId_createdAt_idx" ON "IndicatorAnalysis"("userId", "createdAt");
