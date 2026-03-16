ALTER TABLE "LessonRecording"
ADD COLUMN "streamCallId" TEXT;

UPDATE "LessonRecording" lr
SET "streamCallId" = l."streamCallId"
FROM "Lesson" l
WHERE lr."lessonId" = l."id"
  AND l."streamCallId" IS NOT NULL;

ALTER TABLE "LessonRecording"
ALTER COLUMN "streamCallId" SET NOT NULL;

CREATE INDEX "LessonRecording_streamCallId_idx" ON "LessonRecording"("streamCallId");
