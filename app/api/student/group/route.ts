import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

export async function GET() {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "STUDENT" || !user.studentProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const activeMembership = await prisma.groupMembership.findFirst({
      where: {
        studentId: user.studentProfile.id,
        isActive: true,
      },
      select: {
        id: true,
        joinedAt: true,
        groupId: true,
      },
    });

    if (!activeMembership) {
      return NextResponse.json({
        group: null,
        membership: null,
        members: [],
      });
    }

    const group = await prisma.studyGroup.findUnique({
      where: { id: activeMembership.groupId },
      select: {
        id: true,
        name: true,
        description: true,
        level: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        teacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({
        group: null,
        membership: null,
        members: [],
      });
    }

    const members = await prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        isActive: true,
      },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        level: group.level,
        teacher: group.teacher?.user
          ? {
              firstName: group.teacher.user.firstName,
              lastName: group.teacher.user.lastName,
            }
          : null,
      },
      membership: {
        joinedAt: activeMembership.joinedAt,
      },
      members: members.map((membership) => ({
        id: membership.student.id,
        user: {
          firstName: membership.student.user.firstName,
          lastName: membership.student.user.lastName,
        },
      })),
    });
  } catch (error) {
    console.error("GET /api/student/group error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
