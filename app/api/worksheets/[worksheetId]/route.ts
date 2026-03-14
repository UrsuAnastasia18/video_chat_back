import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, requireTeacher } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ worksheetId: string }>;
};

async function getWorksheet(worksheetId: string) {
  return prisma.worksheet.findUnique({
    where: { id: worksheetId },
    select: { id: true, isActive: true, maxScore: true },
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/worksheets/[worksheetId]
   Accesibil de oricine autentificat (elev sau profesor).
   Elevii văd doar fișele active; profesorii văd și cele inactive.
────────────────────────────────────────────────────────────────────────── */
export async function GET(_request: NextRequest, context: RouteContext) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { worksheetId } = await context.params;

  const worksheet = await prisma.worksheet.findUnique({
    where: { id: worksheetId },
    select: {
      id: true,
      title: true,
      description: true,
      instructions: true,
      isActive: true,
      maxScore: true,
      passingScore: true,
      resourceUrl: true,
      level: { select: { id: true, code: true, title: true } },
    },
  });

  if (!worksheet) {
    return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
  }

  if (!worksheet.isActive && user.role === "STUDENT") {
    return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
  }

  return NextResponse.json({ worksheet });
}

/* ──────────────────────────────────────────────────────────────────────────
   PATCH /api/worksheets/[worksheetId]
   Doar profesori.
   Variantă compatibilă cu schema actuală fără contentJson.
────────────────────────────────────────────────────────────────────────── */
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
      return NextResponse.json(
        { error: "Worksheet not found" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      instructions?: unknown;
      levelId?: unknown;
      isActive?: unknown;
      passingScore?: unknown;
      maxScore?: unknown;
      resourceUrl?: unknown;
    };

    const updateData: {
      title?: string;
      description?: string | null;
      instructions?: string | null;
      levelId?: string;
      isActive?: boolean;
      maxScore?: number;
      passingScore?: number | null;
      resourceUrl?: string | null;
    } = {};

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
          : (body.description as string).trim();
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
          : (body.instructions as string).trim();
    }

    if (body.resourceUrl !== undefined) {
      if (body.resourceUrl !== null && typeof body.resourceUrl !== "string") {
        return NextResponse.json(
          { error: "resourceUrl must be a string or null" },
          { status: 400 }
        );
      }
      updateData.resourceUrl =
        body.resourceUrl === null || body.resourceUrl === ""
          ? null
          : (body.resourceUrl as string).trim();
    }

    if (body.levelId !== undefined) {
      if (typeof body.levelId !== "string" || body.levelId.trim().length === 0) {
        return NextResponse.json(
          { error: "levelId must be a non-empty string" },
          { status: 400 }
        );
      }

      const level = await prisma.englishLevel.findUnique({
        where: { id: body.levelId.trim() },
        select: { id: true },
      });

      if (!level) {
        return NextResponse.json({ error: "Invalid levelId" }, { status: 400 });
      }

      updateData.levelId = body.levelId.trim();
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

    if (body.maxScore !== undefined) {
      if (
        typeof body.maxScore !== "number" ||
        !Number.isInteger(body.maxScore) ||
        body.maxScore < 0
      ) {
        return NextResponse.json(
          { error: "maxScore must be a non-negative integer" },
          { status: 400 }
        );
      }
      updateData.maxScore = body.maxScore;
    }

    if (body.passingScore !== undefined) {
      if (body.passingScore === null) {
        updateData.passingScore = null;
      } else if (
        typeof body.passingScore === "number" &&
        Number.isInteger(body.passingScore)
      ) {
        const effectiveMaxScore =
          updateData.maxScore ?? existing.maxScore ?? 0;

        if (
          body.passingScore < 0 ||
          body.passingScore > effectiveMaxScore
        ) {
          return NextResponse.json(
            {
              error: `passingScore must be between 0 and ${effectiveMaxScore}`,
            },
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
        isActive: true,
        maxScore: true,
        passingScore: true,
        resourceUrl: true,
        level: { select: { id: true, code: true, title: true } },
      },
    });

    return NextResponse.json({ worksheet });
  } catch (error) {
    console.error("PATCH /api/worksheets/[worksheetId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   DELETE /api/worksheets/[worksheetId]
   Soft-delete (isActive = false). Doar profesori.
────────────────────────────────────────────────────────────────────────── */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { worksheetId } = await context.params;
    const existing = await getWorksheet(worksheetId);

    if (!existing) {
      return NextResponse.json(
        { error: "Worksheet not found" },
        { status: 404 }
      );
    }

    await prisma.worksheet.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/worksheets/[worksheetId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}