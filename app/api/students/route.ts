import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const where = search
      ? {
          user: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {};

    const students = await prisma.studentProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        currentLevel: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
      orderBy: {
        user: { lastName: "asc" },
      },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
