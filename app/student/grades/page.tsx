"use client";

import { useEffect, useState } from "react";

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
      <div>
        <h1 className="text-3xl font-bold">My Grades</h1>
        <p className="text-sm text-slate-500">
          Unified list of your automatic worksheet grades and teacher manual grades.
        </p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading grades...</p>
      ) : grades.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          You do not have grades yet.
        </div>
      ) : (
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
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="text-xs font-semibold text-blue-600">{typeLabel}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
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
      )}
    </section>
  );
}
