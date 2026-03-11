-- Add levelId to StudyGroup (temporarily nullable for backfill)
ALTER TABLE "StudyGroup" ADD COLUMN "levelId" TEXT;

-- Backfill existing groups with the lowest available English level
UPDATE "StudyGroup"
SET "levelId" = (
  SELECT "id"
  FROM "EnglishLevel"
  ORDER BY "orderIndex" ASC
  LIMIT 1
)
WHERE "levelId" IS NULL;

-- Make levelId required after backfill
ALTER TABLE "StudyGroup" ALTER COLUMN "levelId" SET NOT NULL;

-- Add indexes
CREATE INDEX "StudyGroup_levelId_idx" ON "StudyGroup"("levelId");
CREATE INDEX "GroupMembership_studentId_isActive_idx" ON "GroupMembership"("studentId", "isActive");
CREATE UNIQUE INDEX "GroupMembership_single_active_student_idx"
ON "GroupMembership" ("studentId")
WHERE "isActive" = true;

-- Add foreign key
ALTER TABLE "StudyGroup"
  ADD CONSTRAINT "StudyGroup_levelId_fkey"
  FOREIGN KEY ("levelId") REFERENCES "EnglishLevel"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
