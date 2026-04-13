import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ bookId: string }>;
};

async function getBook(bookId: string) {
  return prisma.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      levelId: true,
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { bookId } = await context.params;
    const existingBook = await getBook(bookId);

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const body = (await request.json()) as {
      title?: unknown;
      description?: unknown;
      author?: unknown;
      levelId?: unknown;
      resourceUrl?: unknown;
      coverImageUrl?: unknown;
      isActive?: unknown;
    };

    const updateData: {
      title?: string;
      description?: string | null;
      author?: string | null;
      levelId?: string;
      resourceUrl?: string;
      coverImageUrl?: string | null;
      isActive?: boolean;
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

    if (body.author !== undefined) {
      if (body.author !== null && typeof body.author !== "string") {
        return NextResponse.json(
          { error: "author must be a string or null" },
          { status: 400 }
        );
      }
      updateData.author =
        body.author === null || body.author === ""
          ? null
          : (body.author as string).trim();
    }

    if (body.levelId !== undefined) {
      if (typeof body.levelId !== "string" || body.levelId.trim().length === 0) {
        return NextResponse.json(
          { error: "levelId must be a non-empty string" },
          { status: 400 }
        );
      }

      const level = await prisma.englishLevel.findUnique({
        where: { id: body.levelId },
        select: { id: true },
      });

      if (!level) {
        return NextResponse.json({ error: "Invalid levelId" }, { status: 400 });
      }

      updateData.levelId = body.levelId;
    }

    if (body.resourceUrl !== undefined) {
      if (
        typeof body.resourceUrl !== "string" ||
        body.resourceUrl.trim().length === 0
      ) {
        return NextResponse.json(
          { error: "resourceUrl must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.resourceUrl = body.resourceUrl.trim();
    }

    if (body.coverImageUrl !== undefined) {
      if (body.coverImageUrl !== null && typeof body.coverImageUrl !== "string") {
        return NextResponse.json(
          { error: "coverImageUrl must be a string or null" },
          { status: 400 }
        );
      }
      updateData.coverImageUrl =
        body.coverImageUrl === null || body.coverImageUrl === ""
          ? null
          : (body.coverImageUrl as string).trim();
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

    const book = await prisma.book.update({
      where: { id: existingBook.id },
      data: updateData,
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

    return NextResponse.json({ book });
  } catch (error) {
    console.error("PATCH /api/books/[bookId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { bookId } = await context.params;
    const existingBook = await getBook(bookId);

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    await prisma.book.delete({
      where: { id: existingBook.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/books/[bookId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
