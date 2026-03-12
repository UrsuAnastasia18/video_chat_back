import { NextRequest, NextResponse } from "next/server";
import { LessonStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

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

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get("upcoming") === "true";
    const previous = searchParams.get("previous") === "true";
    const statusParam = searchParams.get("status");

    if (upcoming && previous) {
      return NextResponse.json(
        { error: "Use either upcoming or previous filter, not both" },
        { status: 400 }
      );
    }

    let parsedStatus: LessonStatus | undefined;
    if (statusParam) {
      if (!ALLOWED_STATUSES.includes(statusParam as LessonStatus)) {
        return NextResponse.json(
          { error: "Invalid status filter" },
          { status: 400 }
        );
      }
      parsedStatus = statusParam as LessonStatus;
    }

    const baseFilters: {
      status?: LessonStatus;
      scheduledStart?: { gte: Date };
      scheduledEnd?: { lt: Date };
    } = {};

    if (parsedStatus) {
      baseFilters.status = parsedStatus;
    }
    if (upcoming) {
      baseFilters.scheduledStart = { gte: new Date() };
    }
    if (previous) {
      baseFilters.scheduledEnd = { lt: new Date() };
    }

    const orderBy = previous
      ? ({ scheduledStart: "desc" } as const)
      : ({ scheduledStart: "asc" } as const);

    if (user.role === "TEACHER_ADMIN" && user.teacherProfile) {
      const lessons = await prisma.lesson.findMany({
        where: {
          ...baseFilters,
          group: {
            teacherId: user.teacherProfile.id,
          },
        },
        orderBy,
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

      return NextResponse.json({ lessons });
    }

    if (user.role === "STUDENT" && user.studentProfile) {
      const activeMembership = await prisma.groupMembership.findFirst({
        where: {
          studentId: user.studentProfile.id,
          isActive: true,
        },
        select: {
          groupId: true,
        },
      });

      if (!activeMembership) {
        return NextResponse.json({ lessons: [] });
      }

      const lessons = await prisma.lesson.findMany({
        where: {
          ...baseFilters,
          groupId: activeMembership.groupId,
        },
        orderBy,
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

      return NextResponse.json({ lessons });
    }

    return NextResponse.json({ lessons: [] });
  } catch (error) {
    console.error("GET /api/lessons error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      groupId?: unknown;
      scheduledStart?: unknown;
      scheduledEnd?: unknown;
      streamCallId?: unknown;
    };

    const title =
      typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : null;
    const groupId = typeof body.groupId === "string" ? body.groupId : "";
    const streamCallId =
      typeof body.streamCallId === "string" && body.streamCallId.trim().length > 0
        ? body.streamCallId.trim()
        : null;
    const scheduledStart = parseIsoDate(body.scheduledStart);
    const scheduledEnd = parseIsoDate(body.scheduledEnd);

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }
    if (!scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: "scheduledStart and scheduledEnd must be valid ISO dates" },
        { status: 400 }
      );
    }
    if (scheduledStart >= scheduledEnd) {
      return NextResponse.json(
        { error: "scheduledStart must be before scheduledEnd" },
        { status: 400 }
      );
    }

    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true, teacherId: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (group.teacherId !== user.teacherProfile.id) {
      return NextResponse.json(
        { error: "Forbidden: you do not own this group" },
        { status: 403 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description: description || null,
        scheduledStart,
        scheduledEnd,
        status: "SCHEDULED",
        groupId: group.id,
        createdById: user.id,
        streamCallId,
      },
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

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A lesson with this Stream call already exists" },
        { status: 409 }
      );
    }
    console.error("POST /api/lessons error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
