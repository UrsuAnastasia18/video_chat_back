"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  StudentChip,
  StudentEmptyState,
  StudentError,
  StudentHero,
  StudentLoadingGrid,
  StudentPageHeader,
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
      <StudentPageHeader
        title="Fișe de lucru"
        subtitle="Completează fișele disponibile pentru nivelul tău."
      />

      <StudentHero
        title="Exersare prin fișe"
        subtitle="Consolidează lecțiile prin exerciții structurate și urmărește progresul tău."
        rightSlot={
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
            <p className="text-2xl font-black leading-none text-white">{worksheets.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
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
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
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

          {/* ── Completed ── */}
          {completed.length > 0 && (
            <StudentPanel
              title={`Completate`}
              rightSlot={
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
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
        background: "#fff",
        border: `1px solid ${done ? "rgba(16,185,129,0.2)" : "#e2e8f0"}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        {/* level badge */}
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0"
          style={{ background: "rgba(240,165,0,0.1)", color: "#b45309" }}>
          {ws.level.code}
        </span>

        {/* status badge */}
        {done ? (
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
            style={{ background: "rgba(16,185,129,0.08)", color: "#059669" }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Completat
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
            style={{ background: "rgba(79,142,247,0.08)", color: "#4f8ef7" }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Nou
          </span>
        )}
      </div>

      {/* title + description */}
      <div className="flex-1 mb-4">
        <h3 className="font-bold leading-snug" style={{ color: "#1e293b", fontSize: "14px" }}>{ws.title}</h3>
        {ws.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
            {ws.description}
          </p>
        )}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "#94a3b8" }}>
            {ws.maxScore} {ws.maxScore === 1 ? "întrebare" : "întrebări"}
          </span>
          {status && (
            <span className="text-xs" style={{ color: "#cbd5e1" }}>
              · {status.attempts} {status.attempts === 1 ? "încercare" : "încercări"}
            </span>
          )}
        </div>

        {/* grade badge */}
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
