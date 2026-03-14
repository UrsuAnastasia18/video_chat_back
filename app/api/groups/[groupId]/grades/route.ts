import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

/**
 * GET /api/groups/[groupId]/grades
 *
 * Returnează toți elevii activi din grup cu toate notele lor —
 * atât ORAL_MANUAL (date de profesor) cât și WORKSHEET_AUTO (generate automat).
 *
 * Pentru WORKSHEET_AUTO includem și titlul worksheet-ului din submission.
 * Pentru ORAL_MANUAL includem și titlul lecției.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireTeacher();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { groupId } = await context.params;

    // Verifică că grupul există
    const group = await prisma.studyGroup.findUnique({
      where: { id: groupId },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Ia toți elevii activi din grup cu notele lor complete
    const memberships = await prisma.groupMembership.findMany({
      where: { groupId, isActive: true },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            currentLevel: {
              select: { code: true, title: true },
            },
            grades: {
              orderBy: { gradedAt: "desc" },
              select: {
                id: true,
                type: true,
                value: true,
                gradedAt: true,
                comment: true,
                // Pentru note orale — lecția
                lesson: {
                  select: { id: true, title: true, groupId: true },
                },
                // Pentru note automate — submission + worksheet
                worksheetSubmission: {
                  select: {
                    id: true,
                    worksheet: {
                      select: { id: true, title: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    const students = memberships.map((m) => {
      const student = m.student;

      // Filtrăm notele:
      // - ORAL_MANUAL: doar notele pentru lecții din ACEST grup
      // - WORKSHEET_AUTO: toate notele din fișe (nu sunt legate de un grup specific)
      const filteredGrades = student.grades.filter((g) => {
        if (g.type === "ORAL_MANUAL") {
          // Includem doar dacă lecția aparține acestui grup
          return g.lesson?.groupId === groupId;
        }
        // WORKSHEET_AUTO — mereu includem
        return true;
      });

      return {
        id: student.id,
        user: {
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          email: student.user.email,
        },
        currentLevel: student.currentLevel
          ? { code: student.currentLevel.code, title: student.currentLevel.title }
          : null,
        grades: filteredGrades.map((g) => ({
          id: g.id,
          type: g.type,
          value: g.value,
          gradedAt: g.gradedAt.toISOString(),
          comment: g.comment,
          lesson: g.lesson
            ? { id: g.lesson.id, title: g.lesson.title }
            : null,
          worksheetSubmission: g.worksheetSubmission
            ? {
              id: g.worksheetSubmission.id,
              worksheet: g.worksheetSubmission.worksheet
                ? {
                  id: g.worksheetSubmission.worksheet.id,
                  title: g.worksheetSubmission.worksheet.title,
                }
                : null,
            }
            : null,
        })),
      };
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("GET /api/groups/[groupId]/grades error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}