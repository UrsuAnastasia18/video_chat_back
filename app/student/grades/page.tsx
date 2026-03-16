"use client";

import { useEffect, useState } from "react";
import {
  StudentChip,
  StudentEmptyState,
  StudentError,
  StudentHero,
  StudentLoadingGrid,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentShell";

interface StudentGrade {
  id: string;
  type: "WORKSHEET_AUTO" | "ORAL_MANUAL";
  value: number;
  gradedAt: string;
  comment: string | null;
  lesson: {
    id: string;
    title: string;
  } | null;
  worksheetSubmission: {
    id: string;
    worksheet: {
      id: string;
      title: string;
    } | null;
  } | null;
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGrades = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/student/grades");
        const payload = (await res.json()) as {
          grades?: StudentGrade[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(payload.error ?? "Failed to load grades");
        }

        setGrades(payload.grades ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load grades");
      } finally {
        setLoading(false);
      }
    };

    loadGrades();
  }, []);

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <StudentPageHeader
        title="My Grades"
        subtitle="Track worksheet and lesson grades in one place."
      />

      <StudentHero
        title="Academic Progress"
        subtitle="See your recorded grades from worksheets and teacher evaluations."
        rightSlot={
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
            <p className="text-2xl font-black leading-none text-white">{grades.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
              grades
            </p>
          </div>
        }
        chips={
          <>
            <StudentChip>Worksheet Auto</StudentChip>
            <StudentChip>Teacher Manual</StudentChip>
          </>
        }
      />

      {error ? <StudentError message={error} /> : null}

      {loading ? (
        <StudentLoadingGrid cards={6} />
      ) : grades.length === 0 ? (
        <StudentEmptyState
          title="No grades yet"
          description="Your grades will appear here after worksheet submissions or teacher evaluation."
        />
      ) : (
        <StudentPanel
          title="Grades History"
          rightSlot={
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
              {grades.length}
            </span>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {grades.map((grade) => {
              const typeLabel =
                grade.type === "WORKSHEET_AUTO" ? "Worksheet Auto" : "Oral Manual";
              const sourceLabel = grade.worksheetSubmission?.worksheet?.title
                ? `Worksheet: ${grade.worksheetSubmission.worksheet.title}`
                : grade.lesson?.title
                  ? `Lesson: ${grade.lesson.title}`
                  : "Source unavailable";

              return (
                <article
                  key={grade.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="inline-flex w-fit rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    {typeLabel}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    Grade: {grade.value}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">{sourceLabel}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Graded: {new Date(grade.gradedAt).toLocaleString()}
                  </p>
                  {grade.comment ? (
                    <p className="mt-2 text-sm text-slate-600">{grade.comment}</p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No comment.</p>
                  )}
                </article>
              );
            })}
          </div>
        </StudentPanel>
      )}
    </section>
  );
}
