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
        teacherId: true,
        level: {
          select: {
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

    const memberships = await prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        isActive: true,
      },
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
      orderBy: [
        { student: { user: { firstName: "asc" } } },
        { student: { user: { lastName: "asc" } } },
      ],
    });

    const studentIds = memberships.map((membership) => membership.student.id);

    const grades = studentIds.length
      ? await prisma.grade.findMany({
          where: {
            studentId: { in: studentIds },
          },
          orderBy: { gradedAt: "desc" },
          select: {
            id: true,
            studentId: true,
            type: true,
            value: true,
            gradedAt: true,
            comment: true,
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
            worksheetSubmission: {
              select: {
                id: true,
                worksheet: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        })
      : [];

    const gradesByStudent = new Map<string, typeof grades>();
    for (const grade of grades) {
      const existing = gradesByStudent.get(grade.studentId);
      if (existing) {
        existing.push(grade);
      } else {
        gradesByStudent.set(grade.studentId, [grade]);
      }
    }

    const students = memberships.map((membership) => ({
      id: membership.student.id,
      user: {
        firstName: membership.student.user.firstName,
        lastName: membership.student.user.lastName,
        email: membership.student.user.email,
      },
      currentLevel: membership.student.currentLevel
        ? {
            code: membership.student.currentLevel.code,
            title: membership.student.currentLevel.title,
          }
        : null,
      grades: (gradesByStudent.get(membership.student.id) ?? []).map((grade) => ({
        id: grade.id,
        type: grade.type,
        value: grade.value,
        gradedAt: grade.gradedAt,
        comment: grade.comment,
        lesson: grade.lesson,
        worksheetSubmission: grade.worksheetSubmission,
      })),
    }));

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        level: group.level,
      },
      students,
    });
  } catch (error) {
    console.error("GET /api/groups/[groupId]/grades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
