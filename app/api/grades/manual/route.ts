import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";

type ManualGradeBody = {
  lessonId?: unknown;
  studentId?: unknown;
  value?: unknown;
  comment?: unknown;
};

function parseIntGrade(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }
  if (value < 1 || value > 10) {
    return null;
  }
  return value;
}

export async function POST(request: NextRequest) {
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
    const body = (await request.json()) as ManualGradeBody;
    const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    const value = parseIntGrade(body.value);
    const comment =
      typeof body.comment === "string" && body.comment.trim().length > 0
        ? body.comment.trim()
        : null;

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
    }
    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }
    if (value === null) {
      return NextResponse.json(
        { error: "value must be an integer between 1 and 10" },
        { status: 400 }
      );
    }

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

    const membership = await prisma.groupMembership.findFirst({
      where: {
        groupId: lesson.groupId,
        studentId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Student does not belong to this lesson group" },
        { status: 400 }
      );
    }

    const existingGrade = await prisma.grade.findFirst({
      where: {
        studentId,
        teacherId: user.id,
        lessonId: lesson.id,
        type: "ORAL_MANUAL",
      },
      orderBy: { gradedAt: "desc" },
      select: { id: true },
    });

    const grade = existingGrade
      ? await prisma.grade.update({
          where: { id: existingGrade.id },
          data: {
            value,
            comment,
            gradedAt: new Date(),
          },
          select: {
            id: true,
            studentId: true,
            teacherId: true,
            lessonId: true,
            worksheetSubmissionId: true,
            type: true,
            value: true,
            comment: true,
            gradedAt: true,
          },
        })
      : await prisma.grade.create({
          data: {
            studentId,
            teacherId: user.id,
            lessonId: lesson.id,
            worksheetSubmissionId: null,
            type: "ORAL_MANUAL",
            value,
            comment,
          },
          select: {
            id: true,
            studentId: true,
            teacherId: true,
            lessonId: true,
            worksheetSubmissionId: true,
            type: true,
            value: true,
            comment: true,
            gradedAt: true,
          },
        });

    return NextResponse.json(
      { grade, mode: existingGrade ? "updated" : "created" },
      { status: existingGrade ? 200 : 201 }
    );
  } catch (error) {
    console.error("POST /api/grades/manual error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
