import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import {
  getWorksheetMaxScore,
  getWorksheetPassingScore,
  validateWorksheetContent,
  type WorksheetContent,
} from "@/lib/worksheet-content";

type RouteContext = {
  params: Promise<{ worksheetId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
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
    const { worksheetId } = await context.params;

    const student = await prisma.studentProfile.findUnique({
      where: { id: user.studentProfile.id },
      select: { currentLevelId: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const worksheet = await prisma.worksheet.findFirst({
      where: {
        id: worksheetId,
        isActive: true,
        levelId: student.currentLevelId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        instructions: true,
        contentJson: true,
        maxScore: true,
        passingScore: true,
        level: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    if (!worksheet) {
      return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
    }

    const contentValidation = validateWorksheetContent(worksheet.contentJson);
    if (!contentValidation.valid) {
      return NextResponse.json({ worksheet });
    }

    const maxScore = getWorksheetMaxScore(worksheet.contentJson as WorksheetContent);

    return NextResponse.json({
      worksheet: {
        ...worksheet,
        maxScore,
        passingScore: getWorksheetPassingScore(maxScore),
      },
    });
  } catch (error) {
    console.error("GET /api/student/worksheets/[worksheetId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
