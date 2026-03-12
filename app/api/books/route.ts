import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

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

    const books = await prisma.book.findMany({
      where: {
        ...(typeof levelId === "string" && levelId.trim() ? { levelId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        author: true,
        resourceUrl: true,
        coverImageUrl: true,
        isActive: true,
        level: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error("GET /api/books error:", error);
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
      author?: unknown;
      levelId?: unknown;
      resourceUrl?: unknown;
      coverImageUrl?: unknown;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const levelId = typeof body.levelId === "string" ? body.levelId.trim() : "";
    const resourceUrl =
      typeof body.resourceUrl === "string" ? body.resourceUrl.trim() : "";

    const description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;
    const author =
      typeof body.author === "string" && body.author.trim().length > 0
        ? body.author.trim()
        : null;
    const coverImageUrl =
      typeof body.coverImageUrl === "string" && body.coverImageUrl.trim().length > 0
        ? body.coverImageUrl.trim()
        : null;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!levelId) {
      return NextResponse.json({ error: "levelId is required" }, { status: 400 });
    }
    if (!resourceUrl) {
      return NextResponse.json({ error: "resourceUrl is required" }, { status: 400 });
    }

    const level = await prisma.englishLevel.findUnique({
      where: { id: levelId },
      select: { id: true },
    });

    if (!level) {
      return NextResponse.json({ error: "Invalid levelId" }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        title,
        description,
        author,
        levelId,
        resourceUrl,
        coverImageUrl,
        isActive: true,
        createdById: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        author: true,
        resourceUrl: true,
        coverImageUrl: true,
        isActive: true,
        level: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    console.error("POST /api/books error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
