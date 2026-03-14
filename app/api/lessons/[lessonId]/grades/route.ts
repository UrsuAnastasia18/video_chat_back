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

    const grades = await prisma.grade.findMany({
      where: {
        lessonId: lesson.id,
        type: "ORAL_MANUAL",
      },
      orderBy: { gradedAt: "desc" },
      select: {
        id: true,
        value: true,
        comment: true,
        gradedAt: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const manualGrades = grades.map((grade) => ({
      gradeId: grade.id,
      value: grade.value,
      comment: grade.comment,
      gradedAt: grade.gradedAt,
      student: {
        id: grade.student.id,
        firstName: grade.student.user.firstName,
        lastName: grade.student.user.lastName,
        email: grade.student.user.email,
      },
    }));

    return NextResponse.json({ grades: manualGrades });
  } catch (error) {
    console.error("GET /api/lessons/[lessonId]/grades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
