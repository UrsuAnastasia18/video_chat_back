import { NextRequest, NextResponse } from "next/server";
import { LessonStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

const ALLOWED_STATUSES: LessonStatus[] = [
  "SCHEDULED",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
];

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

async function getLessonById(lessonId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      description: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      streamCallId: true,
      createdById: true,
      groupId: true,
      group: {
        select: {
          id: true,
          name: true,
          teacherId: true,
          level: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
        },
      },
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { lessonId } = await context.params;
    const lesson = await getLessonById(lessonId);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (user.role === "TEACHER_ADMIN" && user.teacherProfile) {
      if (lesson.group.teacherId !== user.teacherProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ lesson });
    }

    if (user.role === "STUDENT" && user.studentProfile) {
      const activeMembership = await prisma.groupMembership.findFirst({
        where: {
          studentId: user.studentProfile.id,
          isActive: true,
          groupId: lesson.groupId,
        },
        select: { id: true },
      });

      if (!activeMembership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ lesson });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("GET /api/lessons/[lessonId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "TEACHER_ADMIN" || !user.teacherProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { lessonId } = await context.params;
    const lesson = await getLessonById(lessonId);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    if (lesson.group.teacherId !== user.teacherProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      scheduledStart?: unknown;
      scheduledEnd?: unknown;
      status?: unknown;
      streamCallId?: unknown;
    };

    const updateData: {
      title?: string;
      description?: string | null;
      scheduledStart?: Date;
      scheduledEnd?: Date;
      status?: LessonStatus;
      streamCallId?: string | null;
    } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: "title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== "string") {
        return NextResponse.json(
          { error: "description must be a string or null" },
          { status: 400 }
        );
      }
      updateData.description =
        body.description === null || body.description === ""
          ? null
          : (body.description as string).trim();
    }

    if (body.status !== undefined) {
      if (
        typeof body.status !== "string" ||
        !ALLOWED_STATUSES.includes(body.status as LessonStatus)
      ) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = body.status as LessonStatus;
    }

    if (body.streamCallId !== undefined) {
      if (
        body.streamCallId !== null &&
        (typeof body.streamCallId !== "string" || body.streamCallId.trim().length === 0)
      ) {
        return NextResponse.json(
          { error: "streamCallId must be a non-empty string or null" },
          { status: 400 }
        );
      }

      updateData.streamCallId =
        body.streamCallId === null ? null : (body.streamCallId as string).trim();
    }

    let nextStart = lesson.scheduledStart;
    let nextEnd = lesson.scheduledEnd;

    if (body.scheduledStart !== undefined) {
      const parsedStart = parseIsoDate(body.scheduledStart);
      if (!parsedStart) {
        return NextResponse.json(
          { error: "scheduledStart must be a valid ISO date" },
          { status: 400 }
        );
      }
      nextStart = parsedStart;
      updateData.scheduledStart = parsedStart;
    }

    if (body.scheduledEnd !== undefined) {
      const parsedEnd = parseIsoDate(body.scheduledEnd);
      if (!parsedEnd) {
        return NextResponse.json(
          { error: "scheduledEnd must be a valid ISO date" },
          { status: 400 }
        );
      }
      nextEnd = parsedEnd;
      updateData.scheduledEnd = parsedEnd;
    }

    if (nextStart >= nextEnd) {
      return NextResponse.json(
        { error: "scheduledStart must be before scheduledEnd" },
        { status: 400 }
      );
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: lesson.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
        streamCallId: true,
        group: {
          select: {
            id: true,
            name: true,
            level: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ lesson: updatedLesson });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This call is already linked to another lesson" },
        { status: 409 }
      );
    }
    console.error("PATCH /api/lessons/[lessonId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "TEACHER_ADMIN" || !user.teacherProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { lessonId } = await context.params;
    const lesson = await getLessonById(lessonId);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    if (lesson.group.teacherId !== user.teacherProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/lessons/[lessonId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
