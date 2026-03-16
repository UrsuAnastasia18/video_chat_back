"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorksheetContent, WorksheetQuestion } from "@/lib/worksheet-content";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Level { id: string; code: string; title: string; }

interface Worksheet {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  contentJson: WorksheetContent | null;
  isActive: boolean;
  maxScore: number;
  passingScore: number | null;
  level: Level;
}

type ActiveFilter = "all" | "active" | "inactive";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

function emptyQuestion(): WorksheetQuestion {
  return {
    id: uid(),
    prompt: "",
    type: "single_choice",
    options: [
      { id: uid(), label: "" },
      { id: uid(), label: "" },
      { id: uid(), label: "" },
      { id: uid(), label: "" },
    ],
    correctOptionId: undefined,
  };
}

/* ── Shared input style ──────────────────────────────────────────────────── */
const inp: React.CSSProperties = {
  background: "#f8fafc",
  border: "1.5px solid #e2e8f0",
  borderRadius: "0.65rem",
  padding: "8px 12px",
  fontSize: "13px",
  color: "#1e293b",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
};

const lbl: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  color: "#64748b",
  marginBottom: "4px",
  display: "block",
};

const premiumSurfaceStyle = {
  background: "linear-gradient(135deg, #1e2d40 0%, #243650 55%, #1a3a5c 100%)",
};

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 26px rgba(30,45,64,0.08)",
};

/* ══════════════════════════════════════════════════════════════════════════ */
export default function TeacherWorksheetsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* filters */
  const [levelFilter, setLevelFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  /* form visibility */
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  /* form fields */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("Choose one correct answer for each question and submit.");
  const [levelId, setLevelId] = useState("");
  const [isActive, setIsActive] = useState(true);

  /* question builder */
  const [questions, setQuestions] = useState<WorksheetQuestion[]>([emptyQuestion()]);

  /* ── API ──────────────────────────────────────────────────────────────── */
  const activeQuery = useMemo(() => {
    if (activeFilter === "active") return "true";
    if (activeFilter === "inactive") return "false";
    return null;
  }, [activeFilter]);

  const loadWorksheets = useCallback(async (lf = levelFilter, aq = activeQuery) => {
    const q = new URLSearchParams();
    if (lf && lf !== "all") q.set("levelId", lf);
    if (aq === "true" || aq === "false") q.set("isActive", aq);
    const res = await fetch(`/api/worksheets${q.toString() ? `?${q}` : ""}`);
    const data = (await res.json()) as { worksheets?: Worksheet[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Failed to load worksheets");
    setWorksheets(data.worksheets ?? []);
  }, [activeQuery, levelFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [lr, wr] = await Promise.all([fetch("/api/levels"), fetch("/api/worksheets")]);
        const ld = (await lr.json()) as { levels?: Level[]; error?: string };
        const wd = (await wr.json()) as { worksheets?: Worksheet[]; error?: string };
        if (!lr.ok) throw new Error(ld.error ?? "Failed to load levels");
        if (!wr.ok) throw new Error(wd.error ?? "Failed to load worksheets");
        const lvls = ld.levels ?? [];
        setLevels(lvls);
        setWorksheets(wd.worksheets ?? []);
        setLevelId(lvls[0]?.id ?? "");
      } catch (e) {
        setPageError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (loading) return;
    loadWorksheets(levelFilter, activeQuery).catch((e) =>
      setPageError(e instanceof Error ? e.message : "Failed to filter")
    );
  }, [activeQuery, levelFilter, loadWorksheets, loading]);

  const derivedMaxScore = questions.length;
  const derivedPassingScore = questions.length > 0 ? 1 : 0;

  /* ── Form helpers ─────────────────────────────────────────────────────── */
  const resetForm = () => {
    setTitle(""); setDescription(""); setIsActive(true);
    setInstructions("Choose one correct answer for each question and submit.");
    setLevelId(levels[0]?.id ?? "");
    setQuestions([emptyQuestion()]);
    setEditingId(null);
    setFormOpen(false);
    setPageError(null);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const openEdit = (ws: Worksheet) => {
    setEditingId(ws.id);
    setTitle(ws.title);
    setDescription(ws.description ?? "");
    setInstructions(ws.instructions ?? "");
    setLevelId(ws.level.id);
    setIsActive(ws.isActive);
    setQuestions(
      ws.contentJson?.questions?.length
        ? ws.contentJson.questions.map((q) => ({
          ...q,
          options: q.options.length >= 2 ? q.options : [...q.options, { id: uid(), label: "" }, { id: uid(), label: "" }],
        }))
        : [emptyQuestion()]
    );
    setFormOpen(true);
    setPageError(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  /* ── Question builder actions ─────────────────────────────────────────── */
  const addQuestion = () =>
    setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (qIdx: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== qIdx));

  const updateQuestion = (qIdx: number, patch: Partial<WorksheetQuestion>) =>
    setQuestions((prev) => prev.map((q, i) => i === qIdx ? { ...q, ...patch } : q));

  const updateOption = (qIdx: number, oIdx: number, label: string) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIdx ? q : {
          ...q,
          options: q.options.map((o, j) => j === oIdx ? { ...o, label } : o),
        }
      )
    );

  const addOption = (qIdx: number) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIdx ? q : { ...q, options: [...q.options, { id: uid(), label: "" }] }
      )
    );

  const removeOption = (qIdx: number, oIdx: number) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = q.options.filter((_, j) => j !== oIdx);
        return {
          ...q,
          options: newOpts,
          correctOptionId: q.correctOptionId === q.options[oIdx]?.id ? undefined : q.correctOptionId,
        };
      })
    );

  const setCorrect = (qIdx: number, optionId: string) =>
    updateQuestion(qIdx, { correctOptionId: optionId });

  /* ── Submit ───────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setPageError(null);
    setSuccessMsg(null);

    // validate
    if (!title.trim()) { setPageError("Titlul este obligatoriu."); return; }
    if (!levelId) { setPageError("Selectează un nivel."); return; }
    if (questions.length === 0) { setPageError("Adaugă cel puțin o întrebare."); return; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) { setPageError(`Întrebarea ${i + 1}: textul este obligatoriu.`); return; }
      if (q.options.length < 2) { setPageError(`Întrebarea ${i + 1}: minim 2 opțiuni.`); return; }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].label.trim()) {
          setPageError(`Întrebarea ${i + 1}, opțiunea ${j + 1}: textul este obligatoriu.`); return;
        }
      }
      if (!q.correctOptionId) {
        setPageError(`Întrebarea ${i + 1}: selectează răspunsul corect.`); return;
      }
    }

    const contentJson: WorksheetContent = {
      title: title.trim(),
      questions,
    };

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      instructions: instructions.trim() || null,
      levelId,
      contentJson,
      passingScore: derivedPassingScore,
      ...(editingId ? { isActive } : {}),
    };

    setSubmitting(true);
    try {
      const res = await fetch(
        editingId ? `/api/worksheets/${editingId}` : "/api/worksheets",
        { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      await loadWorksheets();
      setSuccessMsg(editingId ? "Fișa a fost actualizată." : "Fișa a fost creată cu succes.");
      resetForm();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setPageError(null);
    try {
      const res = await fetch(`/api/worksheets/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await loadWorksheets();
      setSuccessMsg("Fișa a fost dezactivată.");
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Failed to deactivate");
    }
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <section className="flex size-full flex-col gap-6" style={{ color: "#1e293b" }}>

      {/* ── Page header ── */}
      <div className="relative overflow-hidden rounded-2xl px-6 py-6 text-white" style={premiumSurfaceStyle}>
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)," +
              "repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 48px)",
          }}
        />
        <div
          className="absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #4f8ef7 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-10 left-1/3 h-36 w-36 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fișe de lucru</h1>
            <p className="mt-0.5 text-sm text-white/70">
              Creează și gestionează fișe interactive pe nivele.
            </p>
          </div>
          {!formOpen && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-blue-1 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ flexShrink: 0 }}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Fișă nouă
            </button>
          )}
        </div>
      </div>

      {/* ── Toasts ── */}
      {pageError && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {pageError}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* ══ FORM ══════════════════════════════════════════════════════════ */}
      {formOpen && (
        <div ref={formRef} className="rounded-2xl"
          style={panelStyle}>

          {/* form header */}
          <div className="flex items-center justify-between border-b px-6 py-4"
            style={{ borderColor: "#f1f5f9" }}>
            <h2 className="text-base font-bold" style={{ color: "#1e293b" }}>
              {editingId ? "Editează fișa" : "Fișă nouă"}
            </h2>
            <button type="button" onClick={resetForm}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
              style={{ color: "#94a3b8" }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-6 px-6 py-5">

            {/* meta fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label style={lbl}>Titlu *</label>
                <input style={inp} value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: A1 — Present Simple Practice"
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f8ef7"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"; }} />
              </div>

              <div>
                <label style={lbl}>Nivel *</label>
                <select style={{ ...inp, cursor: "pointer" }} value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}>
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>{l.code} — {l.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Scor maxim</label>
                <input style={inp} type="number" value={derivedMaxScore} readOnly />
                <p className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
                  Se calculează automat din numărul de întrebări.
                </p>
              </div>

              <div>
                <label style={lbl}>Scor minim de promovare</label>
                <input style={inp} type="number" value={derivedPassingScore} readOnly />
                <p className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
                  Fișa este promovată cu cel puțin 1 răspuns corect.
                </p>
              </div>

              <div className="md:col-span-2">
                <label style={lbl}>Instrucțiuni pentru elev</label>
                <textarea style={{ ...inp, minHeight: "64px", resize: "vertical" }}
                  value={instructions} onChange={(e) => setInstructions(e.target.value)}
                  onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#4f8ef7"; }}
                  onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#e2e8f0"; }} />
              </div>

              <div className="md:col-span-2">
                <label style={lbl}>Descriere (opțional)</label>
                <textarea style={{ ...inp, minHeight: "56px", resize: "vertical" }}
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#4f8ef7"; }}
                  onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#e2e8f0"; }} />
              </div>

              {editingId && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div
                      onClick={() => setIsActive((p) => !p)}
                      className="relative h-5 w-9 rounded-full transition-colors"
                      style={{ background: isActive ? "#4f8ef7" : "#cbd5e1", flexShrink: 0 }}>
                      <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                        style={{ transform: isActive ? "translateX(16px)" : "translateX(2px)" }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#475569" }}>
                      Fișă activă {isActive ? "(vizibilă pentru elevi)" : "(ascunsă)"}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* ── Question builder ── */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
                    Întrebări — {questions.length} {questions.length === 1 ? "întrebare" : "întrebări"}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "#cbd5e1" }}>
                    Bifează opțiunea corectă pentru fiecare întrebare.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {questions.map((q, qIdx) => (
                  <div key={q.id} className="rounded-xl p-4"
                    style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>

                    {/* question header */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: "#4f8ef7" }}>
                        {qIdx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(qIdx)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:bg-red-50"
                          style={{ color: "#ef4444" }}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Șterge
                        </button>
                      )}
                    </div>

                    {/* prompt */}
                    <div className="mb-3">
                      <label style={{ ...lbl, marginBottom: "6px" }}>Textul întrebării *</label>
                      <input style={{ ...inp, background: "#fff" }}
                        value={q.prompt}
                        onChange={(e) => updateQuestion(qIdx, { prompt: e.target.value })}
                        placeholder="ex: Maggie and Carol ______ good friends."
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "#4f8ef7"; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#e2e8f0"; }} />
                    </div>

                    {/* options */}
                    <div className="flex flex-col gap-2">
                      <label style={lbl}>Opțiuni — bifează răspunsul corect</label>
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctOptionId === opt.id;
                        const optLabel = String.fromCharCode(65 + oIdx); // A, B, C, D…

                        return (
                          <div key={opt.id} className="flex items-center gap-2">
                            {/* correct toggle */}
                            <button
                              type="button"
                              onClick={() => setCorrect(qIdx, opt.id)}
                              title="Marchează ca răspuns corect"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all"
                              style={{
                                borderColor: isCorrect ? "#10b981" : "#e2e8f0",
                                background: isCorrect ? "#10b981" : "transparent",
                                color: isCorrect ? "#fff" : "#94a3b8",
                              }}
                            >
                              {isCorrect ? (
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              ) : (
                                <span className="text-[10px] font-bold">{optLabel}</span>
                              )}
                            </button>

                            {/* option text */}
                            <input
                              style={{
                                ...inp, background: isCorrect ? "rgba(16,185,129,0.04)" : "#fff",
                                borderColor: isCorrect ? "rgba(16,185,129,0.4)" : "#e2e8f0", flex: 1
                              }}
                              value={opt.label}
                              onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                              placeholder={`Opțiunea ${optLabel}`}
                              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = isCorrect ? "#10b981" : "#4f8ef7"; }}
                              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = isCorrect ? "rgba(16,185,129,0.4)" : "#e2e8f0"; }}
                            />

                            {/* remove option */}
                            {q.options.length > 2 && (
                              <button type="button" onClick={() => removeOption(qIdx, oIdx)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-50"
                                style={{ color: "#cbd5e1" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#cbd5e1"; }}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* add option */}
                      {q.options.length < 6 && (
                        <button type="button" onClick={() => addOption(qIdx)}
                          className="mt-1 flex items-center gap-1.5 text-xs font-semibold transition-colors"
                          style={{ color: "#94a3b8" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#4f8ef7"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Adaugă opțiune
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* add question */}
              <button type="button" onClick={addQuestion}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all"
                style={{ border: "2px dashed #e2e8f0", color: "#94a3b8", background: "transparent" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#4f8ef7"; el.style.color = "#4f8ef7"; el.style.background = "rgba(79,142,247,0.04)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e2e8f0"; el.style.color = "#94a3b8"; el.style.background = "transparent"; }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Adaugă întrebare
              </button>
            </div>

            {/* form actions */}
            <div className="flex items-center gap-3 border-t pt-4" style={{ borderColor: "#f1f5f9" }}>
              <button type="button" disabled={submitting} onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "#4f8ef7" }}>
                {submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                ) : (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {submitting ? "Se salvează..." : editingId ? "Actualizează fișa" : "Creează fișa"}
              </button>
              <button type="button" onClick={resetForm}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                style={{ color: "#64748b", border: "1.5px solid #e2e8f0" }}>
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ WORKSHEETS TABLE ══════════════════════════════════════════════ */}
      <div className="rounded-2xl"
        style={panelStyle}>

        {/* table header */}
        <div className="flex flex-wrap items-center gap-3 border-b bg-slate-50/80 px-6 py-4" style={{ borderColor: "#e2e8f0" }}>
          <h2 className="mr-auto text-sm font-bold" style={{ color: "#1e293b" }}>
            Biblioteca de fișe
            {worksheets.length > 0 && (
              <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: "rgba(79,142,247,0.08)", color: "#4f8ef7" }}>
                {worksheets.length}
              </span>
            )}
          </h2>

          {/* filters */}
          {[
            { value: levelFilter, onChange: setLevelFilter, options: [{ value: "all", label: "Toate nivelele" }, ...levels.map((l) => ({ value: l.id, label: `${l.code} — ${l.title}` }))] },
            { value: activeFilter, onChange: (v: string) => setActiveFilter(v as ActiveFilter), options: [{ value: "all", label: "Toate statusurile" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
          ].map((sel, i) => (
            <select key={i} value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm font-medium outline-none transition-colors"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#475569", cursor: "pointer" }}>
              {sel.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b px-6 py-4 animate-pulse"
                style={{ borderColor: "#f8fafc" }}>
                <div className="h-4 w-48 rounded" style={{ background: "#e8edf4" }} />
                <div className="h-5 w-10 rounded-full ml-2" style={{ background: "#e8edf4" }} />
                <div className="ml-auto h-4 w-16 rounded" style={{ background: "#e8edf4" }} />
              </div>
            ))}
          </div>
        ) : worksheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "rgba(79,142,247,0.08)" }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="#4f8ef7" strokeWidth={1.5} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "#64748b" }}>Nicio fișă găsită.</p>
            <button type="button" onClick={openCreate}
              className="text-sm font-semibold hover:underline" style={{ color: "#4f8ef7" }}>
              Creează prima fișă →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse" style={{ fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Titlu", "Nivel", "Întrebări", "Scor minim", "Status", "Acțiuni"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left"
                      style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {worksheets.map((ws, i) => (
                  <tr key={ws.id}
                    style={{ borderBottom: i < worksheets.length - 1 ? "1px solid #f8fafc" : "none" }}
                    className="group transition-colors hover:bg-slate-50">

                    <td className="px-5 py-3">
                      <p className="font-semibold" style={{ color: "#1e293b" }}>{ws.title}</p>
                      {ws.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "#94a3b8" }}>{ws.description}</p>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <span className="rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{ background: "rgba(240,165,0,0.1)", color: "#b45309" }}>
                        {ws.level.code}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <span className="font-semibold" style={{ color: "#475569" }}>
                        {ws.maxScore}
                      </span>
                    </td>

                    <td className="px-5 py-3" style={{ color: "#64748b" }}>
                      {ws.passingScore !== null ? ws.passingScore : <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>

                    <td className="px-5 py-3">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={ws.isActive
                          ? { background: "rgba(16,185,129,0.1)", color: "#059669" }
                          : { background: "#f1f5f9", color: "#94a3b8" }}>
                        {ws.isActive ? "Activă" : "Inactivă"}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openEdit(ws)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-100"
                          style={{ color: "#475569", border: "1px solid #e2e8f0" }}>
                          Editează
                        </button>
                        {ws.isActive && (
                          <button type="button" onClick={() => handleDeactivate(ws.id)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                            style={{ color: "#dc2626", border: "1px solid #fecaca", background: "transparent" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                            Dezactivează
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
