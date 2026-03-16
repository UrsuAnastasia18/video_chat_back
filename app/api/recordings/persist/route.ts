import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

type IncomingRecording = {
  streamRecordingId: string;
  streamCallId: string;
  recordingUrl: string;
  title: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
};

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toDateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function normalizeRecordings(payload: unknown): IncomingRecording[] {
  if (!Array.isArray(payload)) return [];

  const normalized: IncomingRecording[] = [];
  for (const item of payload) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;

    const streamCallId = toStringOrNull(record.streamCallId);
    const streamRecordingId =
      toStringOrNull(record.streamRecordingId) ??
      (() => {
        const sessionId = toStringOrNull(record.sessionId);
        const filename = toStringOrNull(record.filename);
        if (!sessionId || !filename) return null;
        return `${sessionId}:${filename}`;
      })();
    const recordingUrl =
      toStringOrNull(record.recordingUrl) ?? toStringOrNull(record.url);
    const title = toStringOrNull(record.title) ?? toStringOrNull(record.filename);
    const startedAt =
      toDateOrNull(record.startedAt) ?? toDateOrNull(record.startTime);
    const endedAt = toDateOrNull(record.endedAt) ?? toDateOrNull(record.endTime);

    if (!streamCallId || !streamRecordingId || !recordingUrl) continue;

    normalized.push({
      streamRecordingId,
      streamCallId,
      recordingUrl,
      title,
      startedAt,
      endedAt,
    });
  }

  const deduped = new Map<string, IncomingRecording>();
  normalized.forEach((recording) => {
    if (!deduped.has(recording.streamRecordingId)) {
      deduped.set(recording.streamRecordingId, recording);
    }
  });

  return Array.from(deduped.values());
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = (await request.json()) as { recordings?: unknown };
    const recordings = normalizeRecordings(body.recordings);

    if (recordings.length === 0) {
      return NextResponse.json({
        persisted: 0,
        skipped: 0,
      });
    }

    const streamCallIds = Array.from(
      new Set(recordings.map((recording) => recording.streamCallId))
    );

    let accessibleLessons: { id: string; streamCallId: string | null }[] = [];
    if (user.role === "TEACHER_ADMIN" && user.teacherProfile) {
      accessibleLessons = await prisma.lesson.findMany({
        where: {
          streamCallId: { in: streamCallIds },
          group: {
            teacherId: user.teacherProfile.id,
          },
        },
        select: {
          id: true,
          streamCallId: true,
        },
      });
    } else if (user.role === "STUDENT" && user.studentProfile) {
      accessibleLessons = await prisma.lesson.findMany({
        where: {
          streamCallId: { in: streamCallIds },
          group: {
            memberships: {
              some: {
                studentId: user.studentProfile.id,
                isActive: true,
              },
            },
          },
        },
        select: {
          id: true,
          streamCallId: true,
        },
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const lessonByCallId = new Map<string, string>();
    accessibleLessons.forEach((lesson) => {
      if (lesson.streamCallId) {
        lessonByCallId.set(lesson.streamCallId, lesson.id);
      }
    });

    let persisted = 0;
    let skipped = 0;

    await Promise.all(
      recordings.map(async (recording) => {
        const lessonId = lessonByCallId.get(recording.streamCallId);
        if (!lessonId) {
          skipped += 1;
          return;
        }

        await prisma.lessonRecording.upsert({
          where: {
            streamRecordingId: recording.streamRecordingId,
          },
          create: {
            lessonId,
            streamCallId: recording.streamCallId,
            streamRecordingId: recording.streamRecordingId,
            title: recording.title,
            recordingUrl: recording.recordingUrl,
            startedAt: recording.startedAt,
            endedAt: recording.endedAt,
          },
          update: {
            lessonId,
            streamCallId: recording.streamCallId,
            title: recording.title,
            recordingUrl: recording.recordingUrl,
            startedAt: recording.startedAt,
            endedAt: recording.endedAt,
          },
        });
        persisted += 1;
      })
    );

    return NextResponse.json({ persisted, skipped });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("POST /api/recordings/persist error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

