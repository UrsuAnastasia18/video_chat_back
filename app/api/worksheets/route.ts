import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, requireTeacher } from "@/lib/auth";
import {
  getWorksheetMaxScore,
  getWorksheetPassingScore,
  validateWorksheetContent,
  type WorksheetContent,
} from "@/lib/worksheet-content";

function parseBooleanFilter(value: string | null): boolean | undefined {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

/**
 * GET /api/worksheets
 * Accesibil oricui autentificat (elevi + profesori).
 * Elevii văd doar fișele active de la nivelul lor curent.
 * Profesorii văd tot și pot filtra manual.
 */
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const isActiveFilter: boolean | undefined =
      user.role === "STUDENT" ? true : isActive;

    let studentLevelId: string | undefined;
    if (user.role === "STUDENT") {
      if (!user.studentProfile?.currentLevelId) {
        return NextResponse.json({ worksheets: [] });
      }
      studentLevelId = user.studentProfile.currentLevelId;
    }

    const worksheets = await prisma.worksheet.findMany({
      where: {
        ...(user.role === "STUDENT"
          ? { levelId: studentLevelId }
          : typeof levelId === "string" && levelId.trim()
            ? { levelId: levelId.trim() }
            : {}),
        ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        instructions: true,
        contentJson: true,
        resourceUrl: true,
        isActive: true,
        maxScore: true,
        passingScore: true,
        createdAt: true,
        level: {
          select: { id: true, code: true, title: true },
        },
      },
    });

    const normalizedWorksheets = worksheets.map((worksheet) => {
      const contentValidation = validateWorksheetContent(worksheet.contentJson);
      if (!contentValidation.valid) {
        return worksheet;
      }

      const maxScore = getWorksheetMaxScore(worksheet.contentJson as WorksheetContent);
      return {
        ...worksheet,
        maxScore,
        passingScore: getWorksheetPassingScore(maxScore),
      };
    });

    return NextResponse.json({ worksheets: normalizedWorksheets });
  } catch (error) {
    console.error("GET /api/worksheets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worksheets
 * Doar profesori.
 *
 * Worksheet-ul este definit prin contentJson.
 * maxScore și passingScore sunt derivate automat.
 */
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
      passingScore?: unknown;
      maxScore?: unknown;
      resourceUrl?: unknown;
      contentJson?: unknown;
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

    const resourceUrl =
      typeof body.resourceUrl === "string" && body.resourceUrl.trim().length > 0
        ? body.resourceUrl.trim()
        : null;

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    if (!levelId) {
      return NextResponse.json(
        { error: "levelId is required" },
        { status: 400 }
      );
    }

    const contentValidation = validateWorksheetContent(body.contentJson);
    if (!contentValidation.valid) {
      return NextResponse.json(
        { error: contentValidation.error },
        { status: 400 }
      );
    }

    const contentJson = body.contentJson as WorksheetContent;
    const maxScore = getWorksheetMaxScore(contentJson);
    const passingScore = getWorksheetPassingScore(maxScore);

    const level = await prisma.englishLevel.findUnique({
      where: { id: levelId },
      select: { id: true },
    });

    if (!level) {
      return NextResponse.json(
        { error: "Invalid levelId" },
        { status: 400 }
      );
    }

    const worksheet = await prisma.worksheet.create({
      data: {
        title,
        description,
        instructions,
        contentJson,
        resourceUrl,
        levelId,
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
        resourceUrl: true,
        isActive: true,
        maxScore: true,
        passingScore: true,
        createdAt: true,
        level: { select: { id: true, code: true, title: true } },
      },
    });

    return NextResponse.json({ worksheet }, { status: 201 });
  } catch (error) {
    console.error("POST /api/worksheets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
