import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import {
    calculateWorksheetScore,
    didPassWorksheet,
    getWorksheetPassingScore,
    validateWorksheetContent,
    type WorksheetContent,
} from "@/lib/worksheet-content";

type RouteContext = {
    params: Promise<{ worksheetId: string }>;
};

/**
 * POST /api/worksheets/[worksheetId]/submit
 *
 * Body: { answers: Record<string, string> }
 *
 * Evaluează răspunsurile pe baza conținutului worksheet-ului.
 */
export async function POST(request: NextRequest, context: RouteContext) {
    let user;
    try {
        user = await requireCurrentUser();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "STUDENT" || !user.studentProfile) {
        return NextResponse.json(
            { error: "Forbidden: only students can submit worksheets" },
            { status: 403 }
        );
    }

    const studentProfile = user.studentProfile;
    const { worksheetId } = await context.params;

    let answers: Record<string, string>;
    try {
        const body = (await request.json()) as { answers?: unknown };

        if (
            !body.answers ||
            typeof body.answers !== "object" ||
            Array.isArray(body.answers)
        ) {
            return NextResponse.json(
                { error: "answers must be an object mapping questionId → optionId" },
                { status: 400 }
            );
        }

        answers = body.answers as Record<string, string>;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const worksheet = await prisma.worksheet.findUnique({
        where: { id: worksheetId },
        select: {
            id: true,
            title: true,
            contentJson: true,
            maxScore: true,
            passingScore: true,
            isActive: true,
        },
    });

    if (!worksheet) {
        return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });
    }

    if (!worksheet.isActive) {
        return NextResponse.json(
            { error: "This worksheet is no longer active" },
            { status: 410 }
        );
    }

    if (!worksheet.contentJson) {
        return NextResponse.json(
            { error: "Worksheet has no interactive content" },
            { status: 400 }
        );
    }

    const contentValidation = validateWorksheetContent(worksheet.contentJson);
    if (!contentValidation.valid) {
        return NextResponse.json(
            { error: "Worksheet content is invalid. Contact teacher." },
            { status: 400 }
        );
    }

    const content = worksheet.contentJson as WorksheetContent;
    for (const question of content.questions) {
        const selected = answers[question.id];
        if (!selected) {
            return NextResponse.json(
                { error: `Missing answer for question ${question.id}` },
                { status: 400 }
            );
        }

        const optionIds = new Set(question.options.map((option) => option.id));
        if (!optionIds.has(selected)) {
            return NextResponse.json(
                { error: `Invalid option for question ${question.id}` },
                { status: 400 }
            );
        }
    }

    const scoring = calculateWorksheetScore(content, answers);
    const maxScore = scoring.maxScore;
    const score = scoring.score;

    const gradeValue = Math.max(1, Math.round((score / maxScore) * 10));

    const passed = didPassWorksheet(score, getWorksheetPassingScore(maxScore));

    const existingSubmissions = await prisma.worksheetSubmission.findMany({
        where: { worksheetId, studentId: studentProfile.id },
        orderBy: { attemptNumber: "desc" },
        select: { id: true, attemptNumber: true, status: true },
    });

    const inProgress = existingSubmissions.find(
        (s) => s.status === "IN_PROGRESS"
    );
    const lastAttemptNumber = existingSubmissions[0]?.attemptNumber ?? 0;
    const attemptNumber = inProgress
        ? inProgress.attemptNumber
        : lastAttemptNumber + 1;

    let submission;

    if (inProgress) {
        submission = await prisma.worksheetSubmission.update({
            where: { id: inProgress.id },
            data: {
                answersJson: answers,
                score,
                submittedAt: new Date(),
                status: "SUBMITTED",
            },
            select: { id: true, attemptNumber: true },
        });
    } else {
        submission = await prisma.worksheetSubmission.create({
            data: {
                worksheetId,
                studentId: studentProfile.id,
                attemptNumber,
                answersJson: answers,
                score,
                submittedAt: new Date(),
                status: "SUBMITTED",
            },
            select: { id: true, attemptNumber: true },
        });
    }

    const existingGrade = await prisma.grade.findFirst({
        where: {
            studentId: studentProfile.id,
            worksheetSubmissionId: submission.id,
            type: "WORKSHEET_AUTO",
        },
        select: { id: true },
    });

    const comment = `Worksheet: ${worksheet.title} — correct answers: ${score}/${maxScore} (attempt #${submission.attemptNumber})`;

    const grade = existingGrade
        ? await prisma.grade.update({
            where: { id: existingGrade.id },
            data: {
                value: gradeValue,
                comment,
                gradedAt: new Date(),
            },
            select: { id: true, value: true, type: true, gradedAt: true },
        })
        : await prisma.grade.create({
            data: {
                studentId: studentProfile.id,
                teacherId: null,
                lessonId: null,
                worksheetSubmissionId: submission.id,
                type: "WORKSHEET_AUTO",
                value: gradeValue,
                comment,
            },
            select: { id: true, value: true, type: true, gradedAt: true },
        });

    return NextResponse.json(
        {
            submission: {
                id: submission.id,
                attemptNumber: submission.attemptNumber,
                score,
                maxScore,
                passed,
            },
            grade: {
                id: grade.id,
                value: grade.value,
                type: grade.type,
            },
        },
        { status: 201 }
    );
}

/**
 * GET /api/worksheets/[worksheetId]/submit
 *
 * Returnează submisiile elevului pentru acest worksheet.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
    let user;
    try {
        user = await requireCurrentUser();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "STUDENT" || !user.studentProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { worksheetId } = await context.params;

    const submissions = await prisma.worksheetSubmission.findMany({
        where: { worksheetId, studentId: user.studentProfile.id },
        orderBy: { attemptNumber: "desc" },
        select: {
            id: true,
            attemptNumber: true,
            score: true,
            status: true,
            submittedAt: true,
            grades: {
                where: { type: "WORKSHEET_AUTO" },
                select: { id: true, value: true, gradedAt: true },
                take: 1,
            },
        },
    });

    return NextResponse.json({ submissions });
}
