"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { WorksheetContent } from "@/lib/worksheet-content";
import {
  StudentChip,
  StudentError,
  StudentHero,
  StudentPageHeader,
  StudentPanel,
} from "@/components/student/StudentShell";

interface WorksheetDetail {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  maxScore: number;
  passingScore: number | null;
  isActive: boolean;
  contentJson: WorksheetContent | null;
  level: { code: string; title: string };
}

interface PastSubmission {
  id: string;
  attemptNumber: number;
  score: number | null;
  status: string;
  submittedAt: string | null;
  grades: Array<{ id: string; value: number; gradedAt: string }>;
}

interface SubmitResult {
  submission: { id: string; attemptNumber: number; score: number; maxScore: number; passed: boolean | null };
  grade: { id: string; value: number; type: string };
}

function gradeStyle(v: number) {
  if (v >= 9) return { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" };
  if (v >= 7) return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" };
  if (v >= 5) return { bg: "#fef9c3", text: "#a16207", border: "#fde68a" };
  return { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" };
}

type PageState = "loading" | "quiz" | "result" | "error";

export default function StudentWorksheetDetailPage() {
  const params = useParams<{ worksheetId: string }>();
  const router = useRouter();
  const worksheetId = params.worksheetId;

  const [ws, setWs] = useState<WorksheetDetail | null>(null);
  const [past, setPast] = useState<PastSubmission[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pageState, setPageState] = useState<PageState>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── Load worksheet + past submissions ── */
  useEffect(() => {
    if (!worksheetId) return;
    const load = async () => {
      setPageState("loading");
      try {
        const [wsRes, subRes] = await Promise.all([
          fetch(`/api/worksheets/${worksheetId}`),
          fetch(`/api/worksheets/${worksheetId}/submit`),
        ]);

        const wsData = (await wsRes.json()) as { worksheet?: WorksheetDetail; error?: string };
        if (!wsRes.ok) throw new Error(wsData.error ?? "Failed to load worksheet");
        if (!wsData.worksheet) throw new Error("Worksheet not found");

        const subData = (await subRes.json()) as { submissions?: PastSubmission[] };

        setWs(wsData.worksheet);
        setPast(subData.submissions ?? []);
        setAnswers({});
        setPageState("quiz");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setPageState("error");
      }
    };
    load();
  }, [worksheetId]);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!ws) return;

    // check all answered
    const questions = ws.contentJson?.questions ?? [];
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Răspunde la toate întrebările. Mai ai ${unanswered.length} ${unanswered.length === 1 ? "întrebare" : "întrebări"} fără răspuns.`);
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/worksheets/${worksheetId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await res.json()) as SubmitResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setResult(data);
      setPageState("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Retry ── */
  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setError(null);
    setPageState("quiz");
  };

  /* ────────────────────────────────────────────────────────────────────── */
  if (pageState === "loading") return (
    <div className="flex flex-col gap-5">
      <div className="h-8 w-48 animate-pulse rounded-xl" style={{ background: "#e8edf4" }} />
      <div className="h-52 animate-pulse rounded-3xl" style={{ background: "#e8edf4" }} />
      <div className="h-36 animate-pulse rounded-2xl" style={{ background: "#e8edf4" }} />
    </div>
  );

  if (pageState === "error" || !ws) return (
    <div className="flex flex-col gap-4">
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold w-fit"
        style={{ color: "#4f8ef7" }}>
        ← Înapoi
      </button>
      <StudentError message={error ?? "Fișa nu a putut fi încărcată."} />
    </div>
  );

  const questions = ws.contentJson?.questions ?? [];

  /* ── RESULT screen ── */
  if (pageState === "result" && result) {
    const gS = gradeStyle(result.grade.value);
    const pct = Math.round((result.submission.score / result.submission.maxScore) * 100);
    const passed = result.submission.passed;

    return (
      <section className="flex size-full max-w-[760px] flex-col gap-6" style={{ color: "#1e293b" }}>
        <StudentPageHeader
          title="Rezultat fișă"
          subtitle="Scorul, nota și recapitularea răspunsurilor tale."
        />

        <StudentHero
          title={ws.title}
          subtitle="Rezultatul tău a fost calculat și salvat în catalog."
          rightSlot={
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="text-2xl font-black leading-none text-white">
                {result.grade.value}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                grade
              </p>
            </div>
          }
          chips={
            <>
              <StudentChip>
                {result.submission.score}/{result.submission.maxScore} corecte
              </StudentChip>
              <StudentChip>{pct}% completion</StudentChip>
            </>
          }
        />

        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold w-fit transition-colors hover:opacity-70"
          style={{ color: "#4f8ef7" }}>
          ← Înapoi la fișe
        </button>

        {/* result card */}
        <StudentPanel>
          <div className="rounded-2xl p-2 text-center">

          {/* big grade */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold"
            style={{ background: gS.bg, color: gS.text, border: `2px solid ${gS.border}` }}>
            {result.grade.value}
          </div>

          <h2 className="text-xl font-bold" style={{ color: "#1e293b" }}>
            {passed === true ? "Felicitări! Ai promovat." : passed === false ? "Nu ai promovat." : "Fișă completată!"}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            {result.submission.score} din {result.submission.maxScore} răspunsuri corecte ({pct}%)
          </p>

          {ws.passingScore !== null && (
            <p className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
              Scor minim pentru promovare: {ws.passingScore} / {ws.maxScore}
            </p>
          )}

          <p className="mt-3 text-xs" style={{ color: "#94a3b8" }}>
            Nota înregistrată în catalog: <strong style={{ color: gS.text }}>{result.grade.value}/10</strong>
          </p>

          {/* review answers */}
          <div className="mt-6 text-left flex flex-col gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>
              Recapitulare răspunsuri
            </p>
            {questions.map((q, i) => {
              const chosen = answers[q.id];
              const correct = q.correctOptionId;
              const isCorrect = chosen === correct;
              const hasCorrect = !!correct;

              return (
                <div key={q.id} className="rounded-xl p-4"
                  style={{
                    background: !hasCorrect ? "#f8fafc" : isCorrect ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
                    border: `1.5px solid ${!hasCorrect ? "#e2e8f0" : isCorrect ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}>
                  <p className="text-sm font-semibold mb-2" style={{ color: "#1e293b" }}>
                    <span className="mr-1.5 text-xs font-bold" style={{ color: "#94a3b8" }}>{i + 1}.</span>
                    {q.prompt}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {q.options.map((opt) => {
                      const isChosen = opt.id === chosen;
                      const isCorrectOpt = opt.id === correct;

                      let bg = "transparent";
                      let textColor = "#64748b";
                      let borderColor = "transparent";
                      let icon = null;

                      if (isCorrectOpt && hasCorrect) {
                        bg = "rgba(16,185,129,0.08)";
                        textColor = "#059669";
                        borderColor = "rgba(16,185,129,0.25)";
                        icon = <span style={{ color: "#059669", fontWeight: 700 }}>✓</span>;
                      } else if (isChosen && !isCorrect) {
                        bg = "rgba(239,68,68,0.06)";
                        textColor = "#dc2626";
                        borderColor = "rgba(239,68,68,0.2)";
                        icon = <span style={{ color: "#dc2626", fontWeight: 700 }}>✕</span>;
                      }

                      return (
                        <div key={opt.id} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
                          style={{ background: bg, border: `1px solid ${borderColor}`, color: textColor }}>
                          {icon && <span className="shrink-0 text-xs">{icon}</span>}
                          <span>{opt.label}</span>
                          {isChosen && !isCorrectOpt && isCorrect && (
                            <span className="ml-auto text-xs" style={{ color: "#94a3b8" }}>răspunsul tău</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={handleRetry}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "rgba(79,142,247,0.08)", color: "#4f8ef7", border: "1px solid rgba(79,142,247,0.2)" }}>
              Încearcă din nou
            </button>
            <button onClick={() => router.back()}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "#4f8ef7", color: "#fff" }}>
              Înapoi la fișe
            </button>
          </div>
          </div>
        </StudentPanel>

        {/* past attempts */}
        {past.length > 0 && (
          <StudentPanel title="Istoricul încercărilor">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Istoricul încercărilor
            </p>
            <div className="flex flex-col gap-2">
              {past.map((s) => {
                const gv = s.grades[0]?.value;
                const gs = gv ? gradeStyle(gv) : null;
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-xl px-4 py-2.5"
                    style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: "#475569" }}>
                        Încercarea #{s.attemptNumber}
                      </span>
                      <span className="ml-2 text-xs" style={{ color: "#94a3b8" }}>
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString("ro-RO") : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        {s.score ?? "—"}/{ws.maxScore}
                      </span>
                      {gs && gv && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                          style={{ background: gs.bg, color: gs.text, border: `1px solid ${gs.border}` }}>
                          {gv}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </StudentPanel>
        )}
      </section>
    );
  }

  /* ── QUIZ screen ── */
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <section className="flex size-full max-w-[860px] flex-col gap-6" style={{ color: "#1e293b" }}>
      <StudentPageHeader
        title="Fișă interactivă"
        subtitle="Completează toate întrebările și trimite pentru evaluare."
      />

      <StudentHero
        title={ws.title}
        subtitle={ws.description ?? "Rezolvă fișa și vezi imediat rezultatul."}
        chips={
          <>
            <StudentChip>{ws.level.code}</StudentChip>
            <StudentChip>
              {answeredCount}/{questions.length} răspunsuri
            </StudentChip>
          </>
        }
      />

      {/* back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold w-fit transition-colors hover:opacity-70"
        style={{ color: "#4f8ef7" }}>
        ← Înapoi la fișe
      </button>

      {/* worksheet header */}
      <StudentPanel>
        <div className="rounded-2xl px-1 py-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="mb-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: "rgba(240,165,0,0.1)", color: "#b45309" }}>
              {ws.level.code}
            </span>
            <h1 className="text-xl font-bold" style={{ color: "#1e293b" }}>{ws.title}</h1>
            {ws.description && (
              <p className="mt-1 text-sm" style={{ color: "#64748b" }}>{ws.description}</p>
            )}
          </div>
          {past.length > 0 && (
            <div className="shrink-0 text-right">
              <p className="text-xs" style={{ color: "#94a3b8" }}>Cel mai bun scor</p>
              {(() => {
                const best = Math.max(...past.flatMap((s) => s.grades.map((g) => g.value)));
                const gs = gradeStyle(best);
                return (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold mt-1"
                    style={{ background: gs.bg, color: gs.text, border: `1px solid ${gs.border}` }}>
                    {best}
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        {ws.instructions && (
          <div className="mt-4 rounded-xl px-4 py-3"
            style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.15)" }}>
            <p className="text-sm" style={{ color: "#334155" }}>{ws.instructions}</p>
          </div>
        )}

        {/* progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
              {answeredCount} / {questions.length} răspunsuri
            </span>
            <span className="text-xs font-bold" style={{ color: answeredCount === questions.length ? "#059669" : "#4f8ef7" }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#f1f5f9" }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: answeredCount === questions.length ? "#10b981" : "#4f8ef7" }} />
          </div>
        </div>
        </div>
      </StudentPanel>

      {/* error */}
      {error ? <StudentError message={error} /> : null}

      {/* questions */}
      <div className="flex flex-col gap-4">
        {questions.map((q, qIdx) => {
          const selected = answers[q.id];
          return (
            <div key={q.id} className="rounded-2xl p-5"
              style={{ background: "#fff", border: `1.5px solid ${selected ? "rgba(79,142,247,0.2)" : "#e2e8f0"}`, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>

              <p className="mb-4 text-sm font-semibold leading-relaxed" style={{ color: "#1e293b" }}>
                <span className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white align-middle"
                  style={{ background: selected ? "#4f8ef7" : "#cbd5e1" }}>
                  {qIdx + 1}
                </span>
                {q.prompt}
              </p>

              <div className="flex flex-col gap-2">
                {q.options.map((opt, oIdx) => {
                  const isSelected = selected === opt.id;
                  const optLabel = String.fromCharCode(65 + oIdx);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all"
                      style={{
                        background: isSelected ? "rgba(79,142,247,0.07)" : "#f8fafc",
                        border: `1.5px solid ${isSelected ? "#4f8ef7" : "#e8edf4"}`,
                        color: isSelected ? "#1d4ed8" : "#475569",
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all"
                        style={{
                          background: isSelected ? "#4f8ef7" : "#e2e8f0",
                          color: isSelected ? "#fff" : "#94a3b8",
                        }}>
                        {optLabel}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* submit */}
      <div className="flex items-center justify-between rounded-2xl px-5 py-4 sticky bottom-4"
        style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <p className="text-sm" style={{ color: "#64748b" }}>
          {answeredCount === questions.length
            ? "Toate întrebările au răspuns!"
            : `Mai ai ${questions.length - answeredCount} ${questions.length - answeredCount === 1 ? "întrebare" : "întrebări"}.`}
        </p>
        <button
          type="button"
          disabled={submitting || answeredCount !== questions.length}
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: "#4f8ef7" }}
        >
          {submitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
          ) : (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          {submitting ? "Se trimite..." : "Trimite fișa"}
        </button>
      </div>
    </section>
  );
}
