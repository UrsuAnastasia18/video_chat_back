"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  StudentChip,
  StudentEmptyState,
  StudentError,
  StudentHero,
  StudentLoadingGrid,
  StudentPanel,
} from "@/components/student/StudentShell";

interface Level { id: string; code: string; title: string; }

interface Worksheet {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  maxScore: number;
  passingScore: number | null;
  level: Level;
}

interface SubmissionStatus {
  worksheetId: string;
  bestScore: number | null;
  attempts: number;
  passed: boolean | null;
  gradeValue: number | null;
}

function gradeStyle(v: number) {
  if (v >= 9) return { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" };
  if (v >= 7) return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" };
  if (v >= 5) return { bg: "#fef9c3", text: "#a16207", border: "#fde68a" };
  return { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" };
}

export default function StudentWorksheetsPage() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [statuses, setStatuses] = useState<Record<string, SubmissionStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch active worksheets for student's level
        const res = await fetch("/api/worksheets?isActive=true");
        const data = (await res.json()) as { worksheets?: Worksheet[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Nu am putut încărca fișele");
        const wsList = data.worksheets ?? [];
        setWorksheets(wsList);

        // Fetch submission status for each worksheet
        const statusResults = await Promise.allSettled(
          wsList.map((ws) =>
            fetch(`/api/worksheets/${ws.id}/submit`)
              .then((r) => r.json())
              .then((d: { submissions?: Array<{ score: number | null; status: string; grades: Array<{ value: number }> }> }) => ({
                worksheetId: ws.id,
                submissions: d.submissions ?? [],
              }))
          )
        );

        const statusMap: Record<string, SubmissionStatus> = {};
        for (const result of statusResults) {
          if (result.status !== "fulfilled") continue;
          const { worksheetId, submissions } = result.value;
          const submitted = submissions.filter((s) => s.status === "SUBMITTED");
          if (submitted.length === 0) continue;

          const bestScore = Math.max(...submitted.map((s) => s.score ?? 0));
          const ws = wsList.find((w) => w.id === worksheetId);
          const passed = ws?.passingScore !== null && ws?.passingScore !== undefined
            ? bestScore >= ws.passingScore
            : null;

          const gradeValue = submitted
            .flatMap((s) => s.grades)
            .sort((a, b) => b.value - a.value)[0]?.value ?? null;

          statusMap[worksheetId] = {
            worksheetId,
            bestScore,
            attempts: submitted.length,
            passed,
            gradeValue,
          };
        }
        setStatuses(statusMap);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Nu am putut încărca datele");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completed = worksheets.filter((ws) => statuses[ws.id]);
  const pending = worksheets.filter((ws) => !statuses[ws.id]);

  return (
    <section className="flex size-full flex-col gap-6" style={{ color: "#1e293b" }}>
      

      <StudentHero
        title="Exersare prin fișe"
        subtitle="Consolidează lecțiile prin exerciții structurate și urmărește progresul tău."
        rightSlot={
          <div className="rounded-2xl border border-[#f6d98d] bg-[#fff4c9] px-4 py-3 text-center">
            <p className="text-2xl font-black leading-none text-[#8a6122]">{worksheets.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#b0894a]">
              fișe
            </p>
          </div>
        }
        chips={
          <>
            <StudentChip>De completat: {pending.length}</StudentChip>
            <StudentChip>Completate: {completed.length}</StudentChip>
          </>
        }
      />

      {error ? <StudentError message={error} /> : null}

      {loading ? (
        <StudentLoadingGrid cards={6} />
      ) : worksheets.length === 0 ? (
        <StudentEmptyState
          title="Nicio fișă disponibilă momentan"
          description="Profesorul tău va publica fișe noi pentru nivelul curent."
        />
      ) : (
        <>
          {/* ── Pending ── */}
          {pending.length > 0 && (
            <StudentPanel
              title={`De completat`}
              rightSlot={
                <span className="rounded-full border border-[#f6d98d] bg-[#fff4c9] px-2.5 py-0.5 text-xs font-bold text-[#8a6122]">
                  {pending.length}
                </span>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((ws) => (
                  <WorksheetCard key={ws.id} ws={ws} status={null} />
                ))}
              </div>
            </StudentPanel>
          )}

          {completed.length > 0 && (
            <StudentPanel
              title={`Completate`}
              rightSlot={
                <span className="rounded-full border border-[#bde7cf] bg-[#e9fff1] px-2.5 py-0.5 text-xs font-bold text-[#177245]">
                  {completed.length}
                </span>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((ws) => (
                  <WorksheetCard key={ws.id} ws={ws} status={statuses[ws.id]} />
                ))}
              </div>
            </StudentPanel>
          )}
        </>
      )}
    </section>
  );
}

/* ── Worksheet card ────────────────────────────────────────────────────── */
function WorksheetCard({ ws, status }: { ws: Worksheet; status: SubmissionStatus | null }) {
  const done = status !== null;
  const gS = status?.gradeValue ? gradeStyle(status.gradeValue) : null;

  return (
    <Link href={`/student/worksheets/${ws.id}`}
      className="flex flex-col justify-between rounded-2xl p-5 transition-all duration-150 hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(180deg,#ffffff 0%,#fff8f1 100%)",
        border: `1px solid ${done ? "rgba(140,215,178,0.8)" : "#eadfeb"}`,
        boxShadow: "0 12px 28px rgba(58,36,72,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 34px rgba(58,36,72,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 28px rgba(58,36,72,0.06)";
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="rounded-full border border-[#f6d98d] bg-[#fff4c9] px-2.5 py-1 text-[11px] font-bold shrink-0 text-[#8a6122]">
          {ws.level.code}
        </span>

        {done ? (
          <span className="flex items-center gap-1 rounded-full border border-[#bde7cf] bg-[#e9fff1] px-2.5 py-1 text-[11px] font-semibold shrink-0 text-[#177245]">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Completat
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full border border-[#f0b3c7] bg-[#ffe6ef] px-2.5 py-1 text-[11px] font-semibold shrink-0 text-[#a04469]">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Nou
          </span>
        )}
      </div>

      <div className="mb-4 flex-1">
        <h3 className="font-bold leading-snug" style={{ color: "#17141f", fontSize: "14px" }}>{ws.title}</h3>
        {ws.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: "#75697c" }}>
            {ws.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "#8b7c8f" }}>
            {ws.maxScore} {ws.maxScore === 1 ? "întrebare" : "întrebări"}
          </span>
          {status && (
            <span className="text-xs" style={{ color: "#d0b7c3" }}>
              · {status.attempts} {status.attempts === 1 ? "încercare" : "încercări"}
            </span>
          )}
        </div>

        {gS && status?.gradeValue && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
            style={{ background: gS.bg, color: gS.text, border: `1px solid ${gS.border}` }}>
            {status.gradeValue}
          </span>
        )}
      </div>
    </Link>
  );
}
