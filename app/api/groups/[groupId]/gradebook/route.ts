import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ groupId: string }>;
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
    const { groupId } = await context.params;

    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        description: true,
        teacherId: true,
        level: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.teacherId !== user.teacherProfile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [lessons, memberships] = await Promise.all([
      prisma.lesson.findMany({
        where: { groupId: group.id },
        orderBy: { scheduledStart: "asc" },
        select: {
          id: true,
          title: true,
          scheduledStart: true,
          scheduledEnd: true,
          status: true,
        },
      }),
      prisma.groupMembership.findMany({
        where: {
          groupId: group.id,
          isActive: true,
        },
        orderBy: [
          { student: { user: { firstName: "asc" } } },
          { student: { user: { lastName: "asc" } } },
        ],
        select: {
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
              currentLevel: {
                select: {
                  code: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const lessonIds = lessons.map((lesson) => lesson.id);
    const studentIds = memberships.map((membership) => membership.student.id);

    const manualGrades =
      lessonIds.length > 0 && studentIds.length > 0
        ? await prisma.grade.findMany({
            where: {
              type: "ORAL_MANUAL",
              teacherId: user.id,
              lessonId: { in: lessonIds },
              studentId: { in: studentIds },
            },
            orderBy: { gradedAt: "desc" },
            select: {
              id: true,
              studentId: true,
              lessonId: true,
              value: true,
              comment: true,
              gradedAt: true,
            },
          })
        : [];

    const gradesByStudent = new Map<string, typeof manualGrades>();
    for (const grade of manualGrades) {
      const list = gradesByStudent.get(grade.studentId);
      if (list) {
        list.push(grade);
      } else {
        gradesByStudent.set(grade.studentId, [grade]);
      }
    }

    const students = memberships.map((membership) => ({
      id: membership.student.id,
      firstName: membership.student.user.firstName,
      lastName: membership.student.user.lastName,
      email: membership.student.user.email,
      currentLevel: membership.student.currentLevel
        ? {
            code: membership.student.currentLevel.code,
            title: membership.student.currentLevel.title,
          }
        : null,
      manualGrades: (gradesByStudent.get(membership.student.id) ?? []).map((grade) => ({
        id: grade.id,
        lessonId: grade.lessonId,
        value: grade.value,
        comment: grade.comment,
        gradedAt: grade.gradedAt,
      })),
    }));

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        level: group.level,
      },
      lessons,
      students,
    });
  } catch (error) {
    console.error("GET /api/groups/[groupId]/gradebook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
