import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import {
  calculateWorksheetScore,
  didPassWorksheet,
  getWorksheetPassingScore,
  validateWorksheetContent,
  type WorksheetContent,
} from "@/lib/worksheet-content";

type RouteContext = {
  params: Promise<{ worksheetId: string }>;
};

function isAnswersRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => typeof entry === "string");
}

export async function POST(request: NextRequest, context: RouteContext) {
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
    const body = (await request.json()) as { answers?: unknown };

    if (!isAnswersRecord(body.answers)) {
      return NextResponse.json(
        { error: "answers must be an object like { q1: 'b' }" },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: user.studentProfile.id },
      select: { id: true, currentLevelId: true },
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
        contentJson: true,
        passingScore: true,
      },
    });

    if (!worksheet) {
      return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
    }

    if (!worksheet.contentJson) {
      return NextResponse.json(
        { error: "Worksheet has no interactive content" },
        { status: 400 }
      );
    }

    const contentValidation = validateWorksheetContent(worksheet.contentJson);
    if (!contentValidation.valid) {
      return NextResponse.json(
        { error: "Worksheet content is invalid. Contact teacher." },
        { status: 400 }
      );
    }

    const content = worksheet.contentJson as WorksheetContent;

    for (const question of content.questions) {
      const selected = body.answers[question.id];
      if (!selected) {
        return NextResponse.json(
          { error: `Missing answer for question ${question.id}` },
          { status: 400 }
        );
      }

      const optionIds = new Set(question.options.map((option) => option.id));
      if (!optionIds.has(selected)) {
        return NextResponse.json(
          { error: `Invalid option for question ${question.id}` },
          { status: 400 }
        );
      }
    }

    const scoring = calculateWorksheetScore(content, body.answers);
    const { submission, grade } = await prisma.$transaction(async (tx) => {
      const lastSubmission = await tx.worksheetSubmission.findFirst({
        where: {
          worksheetId: worksheet.id,
          studentId: student.id,
        },
        orderBy: { attemptNumber: "desc" },
        select: { attemptNumber: true },
      });

      const attemptNumber = (lastSubmission?.attemptNumber ?? 0) + 1;
      const submission = await tx.worksheetSubmission.create({
        data: {
          worksheetId: worksheet.id,
          studentId: student.id,
          attemptNumber,
          answersJson: body.answers as Prisma.InputJsonValue,          score: scoring.score,
          submittedAt: new Date(),
          status: "SUBMITTED",
        },
        select: {
          id: true,
          worksheetId: true,
          studentId: true,
          attemptNumber: true,
          score: true,
          submittedAt: true,
          status: true,
          createdAt: true,
        },
      });

      const grade = await tx.grade.create({
        data: {
          studentId: student.id,
          worksheetSubmissionId: submission.id,
          type: "WORKSHEET_AUTO",
          value: scoring.score,
          teacherId: null,
          lessonId: null,
          comment: null,
        },
        select: { id: true },
      });

      return { submission, grade };
    });

    return NextResponse.json({
      submission,
      gradeId: grade.id,
      result: {
        score: scoring.score,
        maxScore: scoring.maxScore,
        passed: didPassWorksheet(scoring.score, getWorksheetPassingScore(scoring.maxScore)),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Worksheet was submitted concurrently. Please try again." },
        { status: 409 }
      );
    }

    console.error("POST /api/student/worksheets/[worksheetId]/submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
