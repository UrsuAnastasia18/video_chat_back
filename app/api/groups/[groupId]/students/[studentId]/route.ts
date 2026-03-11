import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ groupId: string; studentId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  let user;
  try {
    user = await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { groupId, studentId } = await context.params;

    // Verify group exists and belongs to teacher
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.teacherId !== user.teacherProfile!.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this group" },
        { status: 403 }
      );
    }

    // Find the membership
    const membership = await prisma.groupMembership.findUnique({
      where: {
        groupId_studentId: { groupId, studentId },
      },
    });

    if (!membership || !membership.isActive) {
      return NextResponse.json(
        { error: "Student is not in this group" },
        { status: 404 }
      );
    }

    // Soft-delete: set isActive to false
    await prisma.groupMembership.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/groups/[groupId]/students/[studentId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
