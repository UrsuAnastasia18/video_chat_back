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
    const student = await prisma.studentProfile.findUnique({
      where: { id: user.studentProfile.id },
      select: {
        id: true,
        currentLevelId: true,
      },
    });

    if (!student) {
      return NextResponse.json({ books: [] });
    }

    const books = await prisma.book.findMany({
      where: {
        isActive: true,
        levelId: student.currentLevelId,
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
    console.error("GET /api/student/books error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
