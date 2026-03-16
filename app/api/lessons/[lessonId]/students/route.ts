import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ lessonId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (lesson.group.teacherId !== user.teacherProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const memberships = await prisma.groupMembership.findMany({
      where: {
        groupId: lesson.groupId,
        isActive: true,
      },
      orderBy: { joinedAt: "asc" },
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
            currentLevel: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        },
      },
    });

    const students = memberships.map((membership) => ({
      studentId: membership.student.id,
      userId: membership.student.user.id,
      firstName: membership.student.user.firstName,
      lastName: membership.student.user.lastName,
      email: membership.student.user.email,
      currentLevel: membership.student.currentLevel
        ? {
            code: membership.student.currentLevel.code,
            title: membership.student.currentLevel.title,
          }
        : null,
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error("GET /api/lessons/[lessonId]/students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
