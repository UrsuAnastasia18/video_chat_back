"use client";

import {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { WorksheetContent, WorksheetQuestion } from "@/lib/worksheet-content";

interface Level {
  id: string;
  code: string;
  title: string;
}

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

function DecorativeDots() {
  return (
    <>
      <span className="absolute -left-10 top-16 h-24 w-24 rounded-full bg-[#f3a9c2]/70" />
      <span className="absolute right-10 top-12 h-6 w-6 rounded-full bg-[#eaa0bd]" />
      <span className="absolute right-28 top-20 h-4 w-4 rounded-full bg-[#9697f3]" />
      <span className="absolute bottom-10 right-10 h-24 w-24 rounded-full bg-[#ffe48c]/75" />
      <span className="absolute bottom-16 left-12 h-16 w-16 rounded-full bg-[#9697f3]/65" />
    </>
  );
}

function WorksheetIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function FeedbackBanner({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  const success = type === "success";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
        success
          ? "border-[#c7ecd6] bg-[#effcf4] text-[#198754]"
          : "border-[#f4c4cd] bg-[#fff2f4] text-[#c94b6c]"
      }`}
    >
      {message}
    </div>
  );
}

function StatCard({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "yellow" | "pink" | "violet";
}) {
  const styles = {
    yellow: "border-[#f6d98d] bg-[#fff4c9] text-[#8a6122]",
    pink: "border-[#f0b3c7] bg-[#ffe6ef] text-[#a04469]",
    violet: "border-[#d7d7fb] bg-[#efefff] text-[#6465c8]",
  }[tone];

  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${styles}`}>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] opacity-80">{label}</p>
    </div>
  );
}

function FormLabel({ children }: { children: string }) {
  return <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-[#8b7c8f]">{children}</label>;
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[#eadfeb] bg-white px-4 py-3 text-sm text-[#17141f] outline-none transition placeholder:text-[#ab9cab] focus:border-[#9697f3] focus:ring-4 focus:ring-[#9697f3]/10 ${props.className ?? ""}`}
    />
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-[#eadfeb] bg-white px-4 py-3 text-sm text-[#17141f] outline-none transition placeholder:text-[#ab9cab] focus:border-[#9697f3] focus:ring-4 focus:ring-[#9697f3]/10 ${props.className ?? ""}`}
    />
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-2xl border border-[#eadfeb] bg-white px-4 py-3 pr-11 text-sm text-[#17141f] outline-none transition focus:border-[#9697f3] focus:ring-4 focus:ring-[#9697f3]/10"
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b7c8f]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-[28px] border-2 border-dashed border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[#d7d7fb] bg-[#efefff] text-[#6465c8] shadow-[0_10px_24px_rgba(150,151,243,0.16)]">
        <WorksheetIcon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-xl font-black text-[#17141f]">Nu există încă fișe de lucru</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7c7081]">
        Creează prima fișă interactivă pentru elevi și organizează exercițiile după nivel.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#9697f3] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(150,151,243,0.3)] transition hover:bg-[#7f80ea]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Creează prima fișă
      </button>
    </div>
  );
}

export default function TeacherWorksheetsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("Choose one correct answer for each question and submit.");
  const [levelId, setLevelId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<WorksheetQuestion[]>([emptyQuestion()]);

  const activeQuery = useMemo(() => {
    if (activeFilter === "active") return "true";
    if (activeFilter === "inactive") return "false";
    return null;
  }, [activeFilter]);

  const loadWorksheets = useCallback(
    async (lf = levelFilter, aq = activeQuery) => {
      const q = new URLSearchParams();
      if (lf && lf !== "all") q.set("levelId", lf);
      if (aq === "true" || aq === "false") q.set("isActive", aq);
      const res = await fetch(`/api/worksheets${q.toString() ? `?${q}` : ""}`);
      const data = (await res.json()) as { worksheets?: Worksheet[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load worksheets");
      setWorksheets(data.worksheets ?? []);
    },
    [activeQuery, levelFilter]
  );

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
  const activeCount = worksheets.filter((worksheet) => worksheet.isActive).length;
  const inactiveCount = worksheets.length - activeCount;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIsActive(true);
    setInstructions("Choose one correct answer for each question and submit.");
    setLevelId(levels[0]?.id ?? "");
    setQuestions([emptyQuestion()]);
    setEditingId(null);
    setFormOpen(false);
    setPageError(null);
  };

  const openCreate = () => {
    resetForm();
    setSuccessMsg(null);
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
        ? ws.contentJson.questions.map((question) => ({
            ...question,
            options:
              question.options.length >= 2
                ? question.options
                : [...question.options, { id: uid(), label: "" }, { id: uid(), label: "" }],
          }))
        : [emptyQuestion()]
    );
    setFormOpen(true);
    setPageError(null);
    setSuccessMsg(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (qIdx: number) => setQuestions((prev) => prev.filter((_, index) => index !== qIdx));

  const updateQuestion = (qIdx: number, patch: Partial<WorksheetQuestion>) =>
    setQuestions((prev) => prev.map((question, index) => (index === qIdx ? { ...question, ...patch } : question)));

  const updateOption = (qIdx: number, oIdx: number, label: string) =>
    setQuestions((prev) =>
      prev.map((question, index) =>
        index !== qIdx
          ? question
          : {
              ...question,
              options: question.options.map((option, optionIndex) =>
                optionIndex === oIdx ? { ...option, label } : option
              ),
            }
      )
    );

  const addOption = (qIdx: number) =>
    setQuestions((prev) =>
      prev.map((question, index) =>
        index !== qIdx ? question : { ...question, options: [...question.options, { id: uid(), label: "" }] }
      )
    );

  const removeOption = (qIdx: number, oIdx: number) =>
    setQuestions((prev) =>
      prev.map((question, index) => {
        if (index !== qIdx) return question;
        const newOptions = question.options.filter((_, optionIndex) => optionIndex !== oIdx);
        return {
          ...question,
          options: newOptions,
          correctOptionId: question.correctOptionId === question.options[oIdx]?.id ? undefined : question.correctOptionId,
        };
      })
    );

  const setCorrect = (qIdx: number, optionId: string) => updateQuestion(qIdx, { correctOptionId: optionId });

  const handleSubmit = async () => {
    setPageError(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setPageError("Titlul este obligatoriu.");
      return;
    }
    if (!levelId) {
      setPageError("Selectează un nivel.");
      return;
    }
    if (questions.length === 0) {
      setPageError("Adaugă cel puțin o întrebare.");
      return;
    }

    for (let i = 0; i < questions.length; i += 1) {
      const question = questions[i];
      if (!question.prompt.trim()) {
        setPageError(`Întrebarea ${i + 1}: textul este obligatoriu.`);
        return;
      }
      if (question.options.length < 2) {
        setPageError(`Întrebarea ${i + 1}: minim 2 opțiuni.`);
        return;
      }
      for (let j = 0; j < question.options.length; j += 1) {
        if (!question.options[j].label.trim()) {
          setPageError(`Întrebarea ${i + 1}, opțiunea ${j + 1}: textul este obligatoriu.`);
          return;
        }
      }
      if (!question.correctOptionId) {
        setPageError(`Întrebarea ${i + 1}: selectează răspunsul corect.`);
        return;
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
      const res = await fetch(editingId ? `/api/worksheets/${editingId}` : "/api/worksheets", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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

  const handleDeleteWorksheet = async (id: string) => {
    setPageError(null);
    try {
      const res = await fetch(`/api/worksheets/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await loadWorksheets();
      setSuccessMsg("Fișa a fost ștearsă.");
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <section
      className="-mx-6 -mt-10 flex min-h-[calc(100vh-57px)] flex-col overflow-hidden px-4 py-5 sm:-mx-14 sm:px-8 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at 0% 12%, #f3a9c2 0 76px, transparent 77px)," +
          "radial-gradient(circle at 100% 42%, #ffe48c 0 150px, transparent 151px)," +
          "radial-gradient(circle at 4% 92%, #9697f3 0 120px, transparent 121px)," +
          "#fbf6f1",
        color: "#17141f",
      }}
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-[28px] bg-white px-6 py-6 shadow-[0_26px_80px_rgba(58,36,72,0.14)] sm:px-9 lg:px-10">
        <DecorativeDots />

        <div className="relative z-10 flex flex-col gap-6">
          <section className="relative overflow-hidden rounded-[30px] border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] px-7 py-7 shadow-[0_18px_42px_rgba(58,36,72,0.08)]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,#df6f98 0,#df6f98 1px,transparent 1px,transparent 48px)," +
                  "repeating-linear-gradient(90deg,#f6a43a 0,#f6a43a 1px,transparent 1px,transparent 48px)",
              }}
            />
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(243,169,194,0.3)_0%,transparent_65%)]" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(150,151,243,0.2)_0%,transparent_65%)]" />
            <div className="pointer-events-none absolute bottom-6 right-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,228,140,0.38)_0%,transparent_70%)]" />

            <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#17141f] sm:text-3xl">
                  Fișe de lucru
                </h1>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <StatCard value={worksheets.length} label="fișe" tone="yellow" />
                  <StatCard value={activeCount} label="active" tone="pink" />
                  <StatCard value={inactiveCount} label="inactive" tone="violet" />
                </div>
              </div>

              {!formOpen ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-full bg-[#9697f3] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(150,151,243,0.3)] transition hover:bg-[#7f80ea]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Fișă nouă
                </button>
              ) : null}
            </div>
          </section>

          {pageError ? <FeedbackBanner type="error" message={pageError} /> : null}
          {successMsg ? <FeedbackBanner type="success" message={successMsg} /> : null}

          {formOpen ? (
            <section
              ref={formRef}
              className="relative overflow-hidden rounded-[28px] border border-[#eadfeb] bg-[#fbf6f1] p-5 shadow-[0_18px_42px_rgba(58,36,72,0.08)] sm:p-6"
            >
              <span className="pointer-events-none absolute -right-10 top-4 h-24 w-24 rounded-full bg-[#ffe48c]/40" />
              <span className="pointer-events-none absolute bottom-3 left-6 h-16 w-16 rounded-full bg-[#9697f3]/15" />

              <div className="relative z-10 mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#df6f98]">
                    {editingId ? "Actualizare fișă" : "Fișă nouă"}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#17141f]">
                    {editingId ? "Editează fișa" : "Creează o fișă nouă"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-[#eadfeb] bg-white px-4 py-2 text-sm font-semibold text-[#75697c] transition hover:border-[#f0b3c7] hover:text-[#a04469]"
                >
                  Închide
                </button>
              </div>

              <div className="relative z-10 flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FormLabel>Titlu *</FormLabel>
                    <TextInput
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="ex: A1 - Present Simple Practice"
                    />
                  </div>

                  <div>
                    <FormLabel>Nivel *</FormLabel>
                    <SelectField value={levelId} onChange={setLevelId}>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.code} - {level.title}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div>
                    <FormLabel>Scor maxim</FormLabel>
                    <TextInput type="number" readOnly value={derivedMaxScore} />
                    <p className="mt-2 text-xs text-[#8b7c8f]">Se calculează automat din numărul de întrebări.</p>
                  </div>

                  <div>
                    <FormLabel>Scor minim de promovare</FormLabel>
                    <TextInput type="number" readOnly value={derivedPassingScore} />
                    <p className="mt-2 text-xs text-[#8b7c8f]">Fișa este promovată cu cel puțin 1 răspuns corect.</p>
                  </div>

                  {editingId ? (
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setIsActive((prev) => !prev)}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          isActive
                            ? "border-[#c7ecd6] bg-[#effcf4] text-[#198754]"
                            : "border-[#d7d7fb] bg-[#efefff] text-[#6465c8]"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-[#26b36d]" : "bg-[#9697f3]"}`} />
                        {isActive ? "Fișă activă" : "Fișă inactivă"}
                      </button>
                    </div>
                  ) : null}

                  <div className="md:col-span-2">
                    <FormLabel>Instrucțiuni pentru elev</FormLabel>
                    <TextArea
                      value={instructions}
                      onChange={(event) => setInstructions(event.target.value)}
                      className="min-h-[92px] resize-y"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <FormLabel>Descriere</FormLabel>
                    <TextArea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="min-h-[88px] resize-y"
                      placeholder="Descriere scurtă pentru această fișă..."
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-[#eadfeb] bg-white/80 p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#df6f98]">
                        Întrebări
                      </p>
                      <h3 className="mt-1 text-xl font-black text-[#17141f]">
                        {questions.length} {questions.length === 1 ? "întrebare" : "întrebări"}
                      </h3>
                      <p className="mt-1 text-sm text-[#7c7081]">Bifează răspunsul corect pentru fiecare întrebare.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {questions.map((question, questionIndex) => (
                      <div
                        key={question.id}
                        className="rounded-3xl border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] p-4 shadow-[0_10px_24px_rgba(58,36,72,0.05)]"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#9697f3] text-sm font-black text-white shadow-[0_10px_18px_rgba(150,151,243,0.28)]">
                              {questionIndex + 1}
                            </span>
                            <div>
                              <p className="text-sm font-black text-[#17141f]">Întrebarea {questionIndex + 1}</p>
                              <p className="text-xs text-[#8b7c8f]">Alege o singură variantă corectă</p>
                            </div>
                          </div>

                          {questions.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeQuestion(questionIndex)}
                              className="rounded-full border border-[#f4c4cd] bg-[#fff2f4] px-3 py-1.5 text-xs font-bold text-[#c94b6c] transition hover:bg-[#ffe7eb]"
                            >
                              Șterge
                            </button>
                          ) : null}
                        </div>

                        <div className="mb-4">
                          <FormLabel>Textul întrebării *</FormLabel>
                          <TextInput
                            value={question.prompt}
                            onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })}
                            placeholder="ex: Maggie and Carol ______ good friends."
                          />
                        </div>

                        <div className="flex flex-col gap-3">
                          <FormLabel>Opțiuni</FormLabel>
                          {question.options.map((option, optionIndex) => {
                            const isCorrect = question.correctOptionId === option.id;
                            const optionLetter = String.fromCharCode(65 + optionIndex);

                            return (
                              <div key={option.id} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setCorrect(questionIndex, option.id)}
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 text-sm font-black transition ${
                                    isCorrect
                                      ? "border-[#26b36d] bg-[#26b36d] text-white"
                                      : "border-[#d7d7fb] bg-[#efefff] text-[#6465c8]"
                                  }`}
                                >
                                  {isCorrect ? "✓" : optionLetter}
                                </button>

                                <TextInput
                                  value={option.label}
                                  onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                                  placeholder={`Opțiunea ${optionLetter}`}
                                  className={isCorrect ? "border-[#c7ecd6] bg-[#f7fffa]" : ""}
                                />

                                {question.options.length > 2 ? (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(questionIndex, optionIndex)}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eadfeb] bg-white text-[#8b7c8f] transition hover:border-[#f0b3c7] hover:bg-[#fff2f4] hover:text-[#c94b6c]"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                ) : null}
                              </div>
                            );
                          })}

                          {question.options.length < 6 ? (
                            <button
                              type="button"
                              onClick={() => addOption(questionIndex)}
                              className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-[#d7d7fb] bg-[#efefff] px-4 py-2 text-sm font-bold text-[#6465c8] transition hover:bg-[#e5e5ff]"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                              Adaugă opțiune
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addQuestion}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[#d7d7fb] bg-white/60 py-4 text-sm font-bold text-[#6465c8] transition hover:bg-[#efefff]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Adaugă întrebare
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-[#f1e4ec] pt-4">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 rounded-full bg-[#9697f3] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(150,151,243,0.3)] transition hover:bg-[#7f80ea] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
                    {submitting ? "Se salvează..." : editingId ? "Actualizează fișa" : "Creează fișa"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-[#eadfeb] bg-white px-5 py-3 text-sm font-semibold text-[#75697c] transition hover:border-[#f0b3c7] hover:text-[#a04469]"
                  >
                    Anulează
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-[28px] bg-[#fbf6f1] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="mt-1.5 text-2xl font-black text-[#17141f]">Fișele create</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="min-w-[210px]">
                  <SelectField value={levelFilter} onChange={setLevelFilter}>
                    <option value="all">Toate nivelele</option>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.code} - {level.title}
                      </option>
                    ))}
                  </SelectField>
                </div>

                <div className="min-w-[210px]">
                  <SelectField value={activeFilter} onChange={(value) => setActiveFilter(value as ActiveFilter)}>
                    <option value="all">Toate statusurile</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </SelectField>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-44 animate-pulse rounded-[26px] border border-[#eadfeb] bg-white/80"
                  />
                ))}
              </div>
            ) : worksheets.length === 0 ? (
              <EmptyState onCreateClick={openCreate} />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {worksheets.map((worksheet) => (
                  <article
                    key={worksheet.id}
                    className="group relative overflow-hidden rounded-[28px] border border-[#eadfeb] bg-[linear-gradient(180deg,#ffffff_0%,#fff8f1_100%)] p-5 shadow-[0_14px_32px_rgba(58,36,72,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_38px_rgba(58,36,72,0.12)]"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.05]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(0deg,#df6f98 0,#df6f98 1px,transparent 1px,transparent 48px)," +
                          "repeating-linear-gradient(90deg,#f6a43a 0,#f6a43a 1px,transparent 1px,transparent 48px)",
                      }}
                    />
                    <div className="pointer-events-none absolute -right-16 top-6 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,228,140,0.35)_0%,transparent_70%)]" />
                    <div className="pointer-events-none absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(150,151,243,0.18)_0%,transparent_70%)]" />

                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d7d7fb] bg-[#efefff] text-[#6465c8] shadow-[0_10px_24px_rgba(150,151,243,0.16)]">
                          <WorksheetIcon />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#f6d98d] bg-[#fff4c9] px-3 py-1 text-xs font-bold text-[#8a6122]">
                              {worksheet.level.code}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                worksheet.isActive
                                  ? "border-[#c7ecd6] bg-[#effcf4] text-[#198754]"
                                  : "border-[#d7d7fb] bg-[#efefff] text-[#6465c8]"
                              }`}
                            >
                              {worksheet.isActive ? "Activă" : "Inactivă"}
                            </span>
                          </div>

                          <h3 className="mt-3 text-xl font-black leading-tight text-[#17141f]">{worksheet.title}</h3>
                          <p className="mt-1 text-sm text-[#75697c]">
                            {worksheet.description?.trim() || "Fără descriere adăugată pentru această fișă."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white/80 px-4 py-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8b7c8f]">Întrebări</p>
                          <p className="mt-1 text-lg font-black text-[#17141f]">{worksheet.maxScore}</p>
                        </div>
                        <div className="rounded-2xl bg-white/80 px-4 py-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8b7c8f]">Scor minim</p>
                          <p className="mt-1 text-lg font-black text-[#17141f]">{worksheet.passingScore ?? "—"}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8b7c8f]">Instrucțiuni</p>
                        <p className="mt-2 text-sm leading-6 text-[#7c7081]">
                          {worksheet.instructions?.trim() || "Fără instrucțiuni suplimentare pentru elev."}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => openEdit(worksheet)}
                          className="rounded-full border border-[#d7d7fb] bg-[#efefff] px-4 py-2 text-sm font-bold text-[#6465c8] transition hover:bg-[#e5e5ff]"
                        >
                          Editează
                        </button>

                        {worksheet.isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteWorksheet(worksheet.id)}
                            className="rounded-full border border-[#f4c4cd] bg-[#fff2f4] px-4 py-2 text-sm font-bold text-[#c94b6c] transition hover:bg-[#ffe7eb]"
                          >
                            Șterge fișa
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
