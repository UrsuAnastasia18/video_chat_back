import { NextRequest, NextResponse } from "next/server";
import { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

const ALLOWED_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT"];

async function requireTeacherLessonAccess(lessonId: string) {
  const user = await requireCurrentUser();
  if (user.role !== "TEACHER_ADMIN" || !user.teacherProfile) {
    return { error: "Forbidden", status: 403 as const };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      groupId: true,
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
  if (lesson.group.teacherId !== user.teacherProfile.id) {
    return { error: "Forbidden", status: 403 as const };
  }

  return { lesson };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { lessonId } = await context.params;
    const access = await requireTeacherLessonAccess(lessonId);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const memberships = await prisma.groupMembership.findMany({
      where: {
        groupId: access.lesson.groupId,
        isActive: true,
      },
      orderBy: {
        joinedAt: "asc",
      },
      select: {
        student: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const userIds = memberships.map((m) => m.student.user.id);
    const attendanceRows = await prisma.lessonAttendance.findMany({
      where: {
        lessonId: access.lesson.id,
        userId: { in: userIds },
      },
      select: {
        userId: true,
        status: true,
        markedAt: true,
      },
    });

    const attendanceByUser = new Map(
      attendanceRows.map((row) => [row.userId, row])
    );

    const attendance = memberships.map((membership) => {
      const userId = membership.student.user.id;
      const existing = attendanceByUser.get(userId);
      return {
        studentId: membership.student.id,
        userId,
        firstName: membership.student.user.firstName,
        lastName: membership.student.user.lastName,
        email: membership.student.user.email,
        status: existing?.status ?? "PENDING",
        markedAt: existing?.markedAt ?? null,
      };
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/lessons/[lessonId]/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { lessonId } = await context.params;
    const access = await requireTeacherLessonAccess(lessonId);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = (await request.json()) as {
      userId?: unknown;
      status?: unknown;
    };
    const userId = typeof body.userId === "string" ? body.userId : "";
    const status = typeof body.status === "string" ? body.status : "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.includes(status as AttendanceStatus)) {
      return NextResponse.json({ error: "Invalid attendance status" }, { status: 400 });
    }

    const userMembership = await prisma.groupMembership.findFirst({
      where: {
        groupId: access.lesson.groupId,
        isActive: true,
        student: {
          userId,
        },
      },
      select: {
        student: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!userMembership) {
      return NextResponse.json(
        { error: "Student user does not belong to this lesson group" },
        { status: 400 }
      );
    }

    const attendance = await prisma.lessonAttendance.upsert({
      where: {
        lessonId_userId: {
          lessonId: access.lesson.id,
          userId,
        },
      },
      create: {
        lessonId: access.lesson.id,
        userId,
        status: status as AttendanceStatus,
        markedAt: new Date(),
      },
      update: {
        status: status as AttendanceStatus,
        markedAt: new Date(),
      },
      select: {
        lessonId: true,
        userId: true,
        status: true,
        markedAt: true,
      },
    });

    return NextResponse.json({
      attendance: {
        studentId: userMembership.student.id,
        userId: userMembership.student.user.id,
        firstName: userMembership.student.user.firstName,
        lastName: userMembership.student.user.lastName,
        email: userMembership.student.user.email,
        status: attendance.status,
        markedAt: attendance.markedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/lessons/[lessonId]/attendance error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

