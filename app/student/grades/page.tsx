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
          throw new Error(payload.error ?? "Nu am putut încărca notele");
        }

        setGrades(payload.grades ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nu am putut încărca notele");
      } finally {
        setLoading(false);
      }
    };

    loadGrades();
  }, []);

  return (
    <section className="flex size-full flex-col gap-6 text-black">
      <StudentPageHeader
        title="Notele mele"
        subtitle="Urmărește notele la fișe și lecții într-un singur loc."
      />

      <StudentHero
        title="Progres academic"
        subtitle="Vezi notele înregistrate din fișe și evaluările profesorului."
        rightSlot={
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
            <p className="text-2xl font-black leading-none text-white">{grades.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
              note
            </p>
          </div>
        }
        chips={
          <>
            <StudentChip>Fișe automate</StudentChip>
            <StudentChip>Evaluare profesor</StudentChip>
          </>
        }
      />

      {error ? <StudentError message={error} /> : null}

      {loading ? (
        <StudentLoadingGrid cards={6} />
      ) : grades.length === 0 ? (
        <StudentEmptyState
          title="Încă nu există note"
          description="Notele tale vor apărea aici după trimiterea fișelor sau evaluarea profesorului."
        />
      ) : (
        <StudentPanel
          title="Istoric note"
          rightSlot={
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
              {grades.length}
            </span>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {grades.map((grade) => {
              const typeLabel =
                grade.type === "WORKSHEET_AUTO" ? "Fișă automată" : "Oral manual";
              const sourceLabel = grade.worksheetSubmission?.worksheet?.title
                ? `Fișă: ${grade.worksheetSubmission.worksheet.title}`
                : grade.lesson?.title
                  ? `Lecție: ${grade.lesson.title}`
                  : "Sursa nu este disponibilă";

              return (
                <article
                  key={grade.id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="inline-flex w-fit rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    {typeLabel}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    Notă: {grade.value}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">{sourceLabel}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Notată la: {new Date(grade.gradedAt).toLocaleString()}
                  </p>
                  {grade.comment ? (
                    <p className="mt-2 text-sm text-slate-600">{grade.comment}</p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">Fără comentariu.</p>
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
