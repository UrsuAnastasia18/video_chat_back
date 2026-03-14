import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { validateWorksheetContent } from "@/lib/worksheet-content";

type RouteContext = {
  params: Promise<{ worksheetId: string }>;
};

async function getWorksheet(worksheetId: string) {
  return prisma.worksheet.findUnique({
    where: { id: worksheetId },
    select: { id: true, maxScore: true },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { worksheetId } = await context.params;
    const existing = await getWorksheet(worksheetId);

    if (!existing) {
      return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      instructions?: unknown;
      levelId?: unknown;
      contentJson?: unknown;
      isActive?: unknown;
      passingScore?: unknown;
    };

    const updateData: Prisma.WorksheetUncheckedUpdateInput = {};
    let maxScoreForValidation: number | null = null;

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: "title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      if (body.description !== null && typeof body.description !== "string") {
        return NextResponse.json(
          { error: "description must be a string or null" },
          { status: 400 }
        );
      }

      updateData.description =
        body.description === null || body.description === ""
          ? null
          : body.description.trim();
    }

    if (body.instructions !== undefined) {
      if (body.instructions !== null && typeof body.instructions !== "string") {
        return NextResponse.json(
          { error: "instructions must be a string or null" },
          { status: 400 }
        );
      }

      updateData.instructions =
        body.instructions === null || body.instructions === ""
          ? null
          : body.instructions.trim();
    }

    if (body.levelId !== undefined) {
      if (typeof body.levelId !== "string" || body.levelId.trim().length === 0) {
        return NextResponse.json(
          { error: "levelId must be a non-empty string" },
          { status: 400 }
        );
      }

      const trimmedLevelId = body.levelId.trim();

      const level = await prisma.englishLevel.findUnique({
        where: { id: trimmedLevelId },
        select: { id: true },
      });

      if (!level) {
        return NextResponse.json({ error: "Invalid levelId" }, { status: 400 });
      }

      updateData.levelId = trimmedLevelId;
    }

    if (body.contentJson !== undefined) {
      if (body.contentJson === null) {
        updateData.contentJson = Prisma.JsonNull;
        updateData.maxScore = 0;
        maxScoreForValidation = 0;
      } else {
        const validation = validateWorksheetContent(body.contentJson);

        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const questions = (body.contentJson as { questions: unknown[] }).questions;

        updateData.contentJson = body.contentJson as Prisma.InputJsonValue;
        updateData.maxScore = questions.length;
        maxScoreForValidation = questions.length;
      }
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be a boolean" },
          { status: 400 }
        );
      }

      updateData.isActive = body.isActive;
    }

    if (body.passingScore !== undefined) {
      if (body.passingScore === null) {
        updateData.passingScore = null;
      } else if (
        typeof body.passingScore === "number" &&
        Number.isInteger(body.passingScore)
      ) {
        const resolvedMaxScore = maxScoreForValidation ?? existing.maxScore ?? 0;

        if (body.passingScore < 0 || body.passingScore > resolvedMaxScore) {
          return NextResponse.json(
            { error: `passingScore must be between 0 and ${resolvedMaxScore}` },
            { status: 400 }
          );
        }

        updateData.passingScore = body.passingScore;
      } else {
        return NextResponse.json(
          { error: "passingScore must be an integer or null" },
          { status: 400 }
        );
      }
    }

    const worksheet = await prisma.worksheet.update({
      where: { id: existing.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        instructions: true,
        contentJson: true,
        isActive: true,
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

    return NextResponse.json({ worksheet });
  } catch (error) {
    console.error("PATCH /api/worksheets/[worksheetId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, routeContext: RouteContext) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { worksheetId } = await routeContext.params;
    const existing = await getWorksheet(worksheetId);

    if (!existing) {
      return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
    }

    await prisma.worksheet.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/worksheets/[worksheetId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}