import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function GET() {
  let user;
  try {
    user = await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const groups = await prisma.studyGroup.findMany({
      where: { teacherId: user.teacherProfile!.id },
      select: {
        id: true,
        name: true,
        description: true,
        level: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        createdAt: true,
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("GET /api/groups error:", error);
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
    const body = await request.json();
    const { name, description, levelId } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }
    if (!levelId || typeof levelId !== "string") {
      return NextResponse.json(
        { error: "Group level is required" },
        { status: 400 }
      );
    }

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

    const group = await prisma.studyGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        teacherId: user.teacherProfile!.id,
        levelId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        level: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        createdAt: true,
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error: unknown) {
    // Handle unique constraint violation (duplicate group name for this teacher)
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A group with this name already exists" },
        { status: 409 }
      );
    }

    console.error("POST /api/groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
