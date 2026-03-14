import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

async function getAuthorizedLesson(lessonId: string) {
  const user = await requireCurrentUser();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      groupId: true,
      streamCallId: true,
      group: {
        select: {
          teacherId: true,
        },
      },
    },
  });

  if (!lesson) {
    return { error: "Lesson not found", status: 404 as const };
  }

  if (user.role === "TEACHER_ADMIN" && user.teacherProfile) {
    if (lesson.group.teacherId !== user.teacherProfile.id) {
      return { error: "Forbidden", status: 403 as const };
    }
    return { lesson };
  }

  if (user.role === "STUDENT" && user.studentProfile) {
    const membership = await prisma.groupMembership.findFirst({
      where: {
        studentId: user.studentProfile.id,
        groupId: lesson.groupId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!membership) {
      return { error: "Forbidden", status: 403 as const };
    }
    return { lesson };
  }

  return { error: "Forbidden", status: 403 as const };
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { lessonId } = await context.params;
    const result = await getAuthorizedLesson(lessonId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const lesson = result.lesson;
    if (!lesson.streamCallId) {
      return NextResponse.json({ recordings: [], streamCallId: null });
    }

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_SECRET_KEY;
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Stream credentials are not configured" },
        { status: 500 }
      );
    }

    const streamClient = new StreamClient(apiKey, apiSecret);
    const call = streamClient.video.call("default", lesson.streamCallId);
    const response = await call.listRecordings();

    const recordings = (response.recordings ?? [])
      .map((recording) => ({
        id: `${recording.session_id}:${recording.filename}`,
        filename: recording.filename,
        url: recording.url,
        recordingType: recording.recording_type,
        sessionId: recording.session_id,
        startTime: recording.start_time,
        endTime: recording.end_time,
      }))
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

    return NextResponse.json({
      recordings,
      streamCallId: lesson.streamCallId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("GET /api/lessons/[lessonId]/recordings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

