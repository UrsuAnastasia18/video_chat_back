import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";
import { validateWorksheetContent } from "@/lib/worksheet-content";

function parseBooleanFilter(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const levelId = searchParams.get("levelId");
    const isActiveRaw = searchParams.get("isActive");
    const isActive = parseBooleanFilter(isActiveRaw);

    if (isActiveRaw !== null && isActive === undefined) {
      return NextResponse.json(
        { error: "isActive must be true or false" },
        { status: 400 }
      );
    }

    const worksheets = await prisma.worksheet.findMany({
      where: {
        ...(typeof levelId === "string" && levelId.trim() ? { levelId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ worksheets });
  } catch (error) {
    console.error("GET /api/worksheets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      instructions?: unknown;
      levelId?: unknown;
      contentJson?: unknown;
      passingScore?: unknown;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const levelId = typeof body.levelId === "string" ? body.levelId.trim() : "";

    const description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;
    const instructions =
      typeof body.instructions === "string" && body.instructions.trim().length > 0
        ? body.instructions.trim()
        : null;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!levelId) {
      return NextResponse.json({ error: "levelId is required" }, { status: 400 });
    }
    if (body.contentJson === undefined || body.contentJson === null) {
      return NextResponse.json({ error: "contentJson is required" }, { status: 400 });
    }

    const validation = validateWorksheetContent(body.contentJson);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const level = await prisma.englishLevel.findUnique({
      where: { id: levelId },
      select: { id: true },
    });

    if (!level) {
      return NextResponse.json({ error: "Invalid levelId" }, { status: 400 });
    }

    const questions = (body.contentJson as { questions: unknown[] }).questions;
    const maxScore = questions.length;

    let passingScore: number | null = null;
    if (body.passingScore !== undefined && body.passingScore !== null) {
      if (typeof body.passingScore !== "number" || !Number.isInteger(body.passingScore)) {
        return NextResponse.json(
          { error: "passingScore must be an integer or null" },
          { status: 400 }
        );
      }
      if (body.passingScore < 0 || body.passingScore > maxScore) {
        return NextResponse.json(
          { error: `passingScore must be between 0 and ${maxScore}` },
          { status: 400 }
        );
      }
      passingScore = body.passingScore;
    }

    const worksheet = await prisma.worksheet.create({
      data: {
        title,
        description,
        instructions,
        levelId,
        contentJson: body.contentJson,
        maxScore,
        passingScore,
        isActive: true,
        createdById: user.id,
      },
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

    return NextResponse.json({ worksheet }, { status: 201 });
  } catch (error) {
    console.error("POST /api/worksheets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
