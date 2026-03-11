import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

/**
 * Verifies the group belongs to the current teacher. Returns group or error response.
 */
async function verifyGroupOwnership(groupId: string, teacherProfileId: string) {
  const group = await prisma.studyGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      teacherId: true,
      levelId: true,
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
    return { error: "Group not found", status: 404 };
  }

  if (group.teacherId !== teacherProfileId) {
    return { error: "Forbidden: You do not own this group", status: 403 };
  }

  return { group };
}

export async function GET(request: NextRequest, context: RouteContext) {
  let user;
  try {
    user = await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { groupId } = await context.params;

    const result = await verifyGroupOwnership(groupId, user.teacherProfile!.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const memberships = await prisma.groupMembership.findMany({
      where: { groupId, isActive: true },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
              },
            },
            currentLevel: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({
      group: {
        id: result.group.id,
        level: result.group.level,
      },
      students: memberships,
    });
  } catch (error) {
    console.error("GET /api/groups/[groupId]/students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  let user;
  try {
    user = await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { groupId } = await context.params;

    const result = await verifyGroupOwnership(groupId, user.teacherProfile!.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const { studentId } = body;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Student can belong to only one active group at a time.
    const activeMembership = await prisma.groupMembership.findFirst({
      where: {
        studentId,
        isActive: true,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (activeMembership) {
      if (activeMembership.groupId === groupId) {
        return NextResponse.json(
          { error: "Student is already in this group" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: `Student is already active in another group (${activeMembership.group.name})`,
        },
        { status: 409 }
      );
    }

    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        groupId_studentId: { groupId, studentId },
      },
    });

    const membership = await prisma.$transaction(async (tx) => {
      const membershipRecord = existingMembership
        ? await tx.groupMembership.update({
            where: { id: existingMembership.id },
            data: { isActive: true, joinedAt: new Date() },
          })
        : await tx.groupMembership.create({
            data: { groupId, studentId },
          });

      await tx.studentProfile.update({
        where: { id: studentId },
        data: { currentLevelId: result.group.levelId },
      });

      return membershipRecord;
    });

    return NextResponse.json(
      {
        membership,
        group: {
          id: result.group.id,
          level: result.group.level,
        },
      },
      { status: existingMembership ? 200 : 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "Student is already active in another group",
        },
        { status: 409 }
      );
    }

    console.error("POST /api/groups/[groupId]/students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
