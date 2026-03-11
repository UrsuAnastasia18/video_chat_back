import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const levels = await prisma.englishLevel.findMany({
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        code: true,
        title: true,
        orderIndex: true,
        description: true,
      },
    });

    return NextResponse.json({ levels });
  } catch (error) {
    console.error("GET /api/levels error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
