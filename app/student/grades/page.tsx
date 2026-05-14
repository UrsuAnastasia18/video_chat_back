"use client";

import { useEffect, useState } from "react";
import {
  StudentChip,
  StudentEmptyState,
  StudentError,
  StudentHero,
  StudentLoadingGrid,
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
  const worksheetGrades = grades.filter((grade) => grade.type === "WORKSHEET_AUTO");
  const oralGrades = grades.filter((grade) => grade.type === "ORAL_MANUAL");
  const averageGrade = grades.length
    ? (grades.reduce((sum, grade) => sum + grade.value, 0) / grades.length).toFixed(1)
    : null;

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
      

      <StudentHero
        title="Progres academic"
        subtitle="Vezi notele înregistrate din fișe și evaluările profesorului."
        rightSlot={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="min-w-[102px] rounded-[28px] border border-[#f6d98d] bg-[#fff4c9] px-4 py-3 text-center shadow-[0_12px_24px_rgba(246,217,141,0.24)]">
              <p className="text-2xl font-black leading-none text-[#8a6122]">{grades.length}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b0894a]">
                note
              </p>
            </div>
            <div className="min-w-[102px] rounded-[28px] border border-[#cfcffd] bg-[#eef0ff] px-4 py-3 text-center shadow-[0_12px_24px_rgba(150,151,243,0.18)]">
              <p className="text-2xl font-black leading-none text-[#5b60d8]">
                {averageGrade ?? "0.0"}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7f83e8]">
                media
              </p>
            </div>
          </div>
        }
        chips={
          <>
            <StudentChip>{worksheetGrades.length} note din fișe</StudentChip>
            <StudentChip>{oralGrades.length} evaluări profesor</StudentChip>
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
            <span className="rounded-full border border-[#f6d98d] bg-[#fff4c9] px-3 py-1 text-xs font-bold text-[#8a6122]">
              {grades.length} total
            </span>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {grades.map((grade) => {
              const typeLabel =
                grade.type === "WORKSHEET_AUTO" ? "Fișă automată" : "Oral manual";
              const typeTone =
                grade.type === "WORKSHEET_AUTO"
                  ? {
                      chip: "border-[#f6d98d] bg-[#fff4c9] text-[#8a6122]",
                      accent: "bg-[#ffe8a3]",
                    }
                  : {
                      chip: "border-[#f0b3c7] bg-[#ffe6ef] text-[#a04469]",
                      accent: "bg-[#ffc8dc]",
                    };
              const sourceLabel = grade.worksheetSubmission?.worksheet?.title
                ? `Fișă: ${grade.worksheetSubmission.worksheet.title}`
                : grade.lesson?.title
                  ? `Lecție: ${grade.lesson.title}`
                  : "Sursa nu este disponibilă";

              return (
                <article
                  key={grade.id}
                  className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] p-5 shadow-[0_16px_36px_rgba(58,36,72,0.06)]"
                >
                  <div className="pointer-events-none absolute right-4 top-4 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(255,228,140,0.3)_0%,transparent_70%)]" />

                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${typeTone.chip}`}>
                        {typeLabel}
                      </p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-[#9a8ca4]">
                        Sursa notei
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#5f5168]">{sourceLabel}</p>
                    </div>
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] ${typeTone.accent}`}>
                      <span className="text-2xl font-black text-[#17141f]">{grade.value}</span>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#f1e4eb] bg-white/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#df6f98]">
                      Înregistrată la
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#4c4054]">
                      {new Date(grade.gradedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-4 rounded-3xl border border-[#f1e4eb] bg-[#fffaf4] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#df6f98]">
                      Comentariu
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#75697c]">
                      {grade.comment || "Profesorul nu a adăugat încă un comentariu pentru această notă."}
                    </p>
                  </div>

                  
                </article>
              );
            })}
          </div>
        </StudentPanel>
      )}
    </section>
  );
}
