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
    const grades = await prisma.grade.findMany({
      where: {
        studentId: user.studentProfile.id,
      },
      orderBy: { gradedAt: "desc" },
      select: {
        id: true,
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
    });

    return NextResponse.json({ grades });
  } catch (error) {
    console.error("GET /api/student/grades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
