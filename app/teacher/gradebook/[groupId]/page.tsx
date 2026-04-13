"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type GroupOption = {
  id: string;
  name: string;
  level: { code: string; title: string };
};

type GradebookLesson = {
  id: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
};

type GradebookStudentGrade = {
  id: string;
  lessonId: string;
  value: number;
  comment: string | null;
  gradedAt: string;
};

type GradebookStudent = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentLevel: { code: string; title: string } | null;
  manualGrades: GradebookStudentGrade[];
};

type GradebookPayload = {
  group: {
    id: string;
    name: string;
    description: string | null;
    level: { id: string; code: string; title: string };
  };
  lessons: GradebookLesson[];
  students: GradebookStudent[];
};

function cellKey(studentId: string, lessonId: string) {
  return `${studentId}:${lessonId}`;
}

function gradeColor(value: number) {
  if (value >= 9) return { bg: "rgba(16,185,129,0.12)", text: "#059669", border: "rgba(16,185,129,0.25)" };
  if (value >= 7) return { bg: "rgba(79,142,247,0.12)", text: "#4f8ef7", border: "rgba(79,142,247,0.25)" };
  if (value >= 5) return { bg: "rgba(240,165,0,0.12)", text: "#d97706", border: "rgba(240,165,0,0.25)" };
  return { bg: "rgba(239,68,68,0.12)", text: "#dc2626", border: "rgba(239,68,68,0.25)" };
}

const AVATAR_COLORS = [
  { bg: "rgba(79,142,247,0.1)", text: "#4f8ef7" },
  { bg: "rgba(129,140,248,0.1)", text: "#818cf8" },
  { bg: "rgba(52,211,153,0.1)", text: "#10b981" },
  { bg: "rgba(251,146,60,0.1)", text: "#f97316" },
  { bg: "rgba(244,114,182,0.1)", text: "#ec4899" },
];

export default function TeacherClassicGradebookPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const groupId = params.groupId;

  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [data, setData] = useState<GradebookPayload | null>(null);
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [savingCells, setSavingCells] = useState<Record<string, boolean>>({});
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const [cellSuccess, setCellSuccess] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    const res = await fetch("/api/groups", { cache: "no-store" });
    const payload = (await res.json()) as { groups?: GroupOption[]; error?: string };
    if (!res.ok) throw new Error(payload.error ?? "Nu am putut încărca grupele");
    setGroups(payload.groups ?? []);
  };

  const loadGradebook = async (id: string) => {
    const res = await fetch(`/api/groups/${id}/gradebook`);
    const payload = (await res.json()) as GradebookPayload & { error?: string };
    if (!res.ok) throw new Error(payload.error ?? "Nu am putut încărca catalogul");
    setData({ group: payload.group, lessons: payload.lessons ?? [], students: payload.students ?? [] });
  };

  useEffect(() => {
    if (!groupId) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadGroups(), loadGradebook(groupId)]);
      }
      catch (err) { setError(err instanceof Error ? err.message : "Nu am putut încărca catalogul"); }
      finally { setLoading(false); }
    };
    run();
  }, [groupId]);

  useEffect(() => {
    if (!data) return;
    const init: Record<string, string> = {};
    for (const student of data.students) {
      const byLesson = new Map(student.manualGrades.map((g) => [g.lessonId, g]));
      for (const lesson of data.lessons) {
        const key = cellKey(student.id, lesson.id);
        init[key] = byLesson.get(lesson.id) ? String(byLesson.get(lesson.id)!.value) : "";
      }
    }
    setCellValues(init);
    setSavingCells({});
    setCellErrors({});
    setCellSuccess({});
  }, [data]);

  const gradeMap = useMemo(() => {
    const map = new Map<string, GradebookStudentGrade>();
    if (!data) return map;
    for (const student of data.students)
      for (const grade of student.manualGrades)
        map.set(cellKey(student.id, grade.lessonId), grade);
    return map;
  }, [data]);

  const handleCellSave = async (studentId: string, lessonId: string) => {
    if (!data) return;
    const key = cellKey(studentId, lessonId);
    const raw = (cellValues[key] ?? "").trim();
    const numeric = Number(raw);
    const existing = gradeMap.get(key);

    if (!raw) { setCellErrors((p) => ({ ...p, [key]: "Obligatoriu" })); return; }
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 10) {
      setCellErrors((p) => ({ ...p, [key]: "Doar 1–10" })); return;
    }

    setSavingCells((p) => ({ ...p, [key]: true }));
    setCellErrors((p) => ({ ...p, [key]: "" }));
    setCellSuccess((p) => ({ ...p, [key]: "" }));

    try {
      const res = await fetch("/api/grades/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, studentId, value: numeric, comment: existing?.comment ?? null }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Nu am putut salva nota");
      await loadGradebook(data.group.id);
      setCellSuccess((p) => ({ ...p, [key]: "✓" }));
      setTimeout(() => setCellSuccess((p) => ({ ...p, [key]: "" })), 2000);
    } catch (err) {
      setCellErrors((p) => ({ ...p, [key]: err instanceof Error ? err.message : "Eroare" }));
    } finally {
      setSavingCells((p) => ({ ...p, [key]: false }));
    }
  };

  // Per-student averages
  const studentAverages = useMemo(() => {
    if (!data) return {};
    const avgs: Record<string, string | null> = {};
    for (const student of data.students) {
      if (student.manualGrades.length === 0) { avgs[student.id] = null; continue; }
      avgs[student.id] = (student.manualGrades.reduce((s, g) => s + g.value, 0) / student.manualGrades.length).toFixed(1);
    }
    return avgs;
  }, [data]);

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
        <span className="pointer-events-none absolute -left-12 top-20 h-28 w-28 rounded-full bg-[#f3a9c2]/70" />
        <span className="pointer-events-none absolute -right-16 top-40 h-40 w-40 rounded-full bg-[#ffe48c]/80" />
        <span className="pointer-events-none absolute bottom-16 left-8 h-20 w-20 rounded-full bg-[#9697f3]/75" />
        <span className="pointer-events-none absolute right-20 top-24 h-5 w-5 rounded-full bg-[#eaa0bd]" />
        <span className="pointer-events-none absolute right-56 top-32 h-3 w-3 rounded-full bg-[#9697f3]" />
        <span className="pointer-events-none absolute right-80 top-36 h-4 w-4 rounded-full bg-[#ffe17e]" />

        <div className="relative z-10 flex flex-col gap-6">
          {error && (
            <div className="rounded-xl border border-[#f0b3c7] bg-[#fff1f5] px-4 py-3 text-sm text-[#a04469]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="h-32 rounded-[28px]" style={{ background: "#f7ecf1" }} />
              <div className="h-72 rounded-[28px]" style={{ background: "#f7ecf1" }} />
            </div>
          ) : !data ? (
            <div
              className="flex items-center justify-center rounded-[28px] py-16 text-center"
              style={{ background: "linear-gradient(180deg,#ffffff 0%,#fff8f1 100%)", border: "2px dashed #eadfeb" }}
            >
              <p className="text-sm" style={{ color: "#94a3b8" }}>Catalogul nu este disponibil.</p>
            </div>
          ) : (
            <>
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
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#df6f98]">Catalog</p>
                    <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#17141f] sm:text-3xl">
                      {data.group.name}
                    </h1>
                    {data.group.description ? (
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#75697c]">
                        {data.group.description}
                      </p>
                    ) : null}

                    <div className="mt-4 max-w-[320px]">
                      <div className="relative">
                        <select
                          value={groupId}
                          onChange={(event) => router.push(`/teacher/gradebook/${event.target.value}`)}
                          className="w-full appearance-none rounded-2xl border border-[#eadfeb] bg-white px-4 py-3 pr-11 text-sm font-medium text-[#17141f] outline-none transition focus:border-[#9697f3] focus:ring-4 focus:ring-[#9697f3]/10"
                        >
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name} ({group.level.code})
                            </option>
                          ))}
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
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#f6d98d] bg-[#fff4c9] px-4 py-3 text-center">
                      <p className="text-2xl font-black leading-none text-[#8a6122]">{data.students.length}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#b0894a]">elevi</p>
                    </div>
                    <div className="rounded-2xl border border-[#d7d7fb] bg-[#efefff] px-4 py-3 text-center">
                      <p className="text-2xl font-black leading-none text-[#6465c8]">{data.lessons.length}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8182d7]">lecții</p>
                    </div>
                  </div>
                </div>
              </section>

              {data.lessons.length === 0 ? (
                <div
                  className="flex items-center justify-center rounded-[28px] py-14 text-center"
                  style={{ background: "linear-gradient(180deg,#ffffff 0%,#fff8f1 100%)", border: "2px dashed #eadfeb" }}
                >
                  <p className="text-sm" style={{ color: "#94a3b8" }}>Nu există încă lecții pentru această grupă.</p>
                </div>
              ) : data.students.length === 0 ? (
                <div
                  className="flex items-center justify-center rounded-[28px] py-14 text-center"
                  style={{ background: "linear-gradient(180deg,#ffffff 0%,#fff8f1 100%)", border: "2px dashed #eadfeb" }}
                >
                  <p className="text-sm" style={{ color: "#94a3b8" }}>Nu există elevi activi în această grupă.</p>
                </div>
              ) : (
                <section className="overflow-hidden rounded-[28px] border border-[#eadfeb] bg-white shadow-[0_14px_32px_rgba(58,36,72,0.08)]">
                  <div className="border-b border-[#f1e4ec] px-5 py-4">
                    <h2 className="mt-1.5 text-2xl font-black text-[#17141f]">Catalog electronic</h2>
                  </div>

                  <div className="overflow-x-auto bg-[#fffdfb]">
                    <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr style={{ background: "#fff8f1", borderBottom: "2px solid #eadfeb" }}>
                    {/* Student column header */}
                    <th
                      className="sticky left-0 z-20 min-w-[220px] px-4 py-3 text-left"
                      style={{ background: "#fff8f1", borderRight: "2px solid #eadfeb" }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                        Elevi
                      </span>
                    </th>

                    {/* Lesson columns */}
                    {data.lessons.map((lesson) => (
                      <th key={lesson.id} className="min-w-[140px] px-3 py-3 text-left" style={{ borderRight: "1px solid #f5e8ef" }}>
                        <p className="text-xs font-semibold" style={{ color: "#475569" }}>
                          {new Date(lesson.scheduledStart).toLocaleDateString("ro-RO", { day: "numeric", month: "short" })}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "#94a3b8" }}>{lesson.title}</p>
                      </th>
                    ))}

                    {/* Average column */}
                    <th className="min-w-20 px-3 py-3 text-center" style={{ borderLeft: "2px solid #eadfeb" }}>
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>Medie</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.students.map((student, idx) => {
                    const avatarColor = AVATAR_COLORS[student.firstName.charCodeAt(0) % AVATAR_COLORS.length];
                    const avg = studentAverages[student.id];
                    const avgStyle = avg ? gradeColor(Number(avg)) : null;

                    return (
                      <tr
                        key={student.id}
                        style={{ borderBottom: idx < data.students.length - 1 ? "1px solid #f8edf3" : "none" }}
                      >
                        {/* Student info — sticky */}
                        <td
                          className="sticky left-0 z-10 px-4 py-3"
                          style={{ background: "#fffdfb", borderRight: "2px solid #eadfeb" }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold" style={{ background: avatarColor.bg, color: avatarColor.text }}>
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold" style={{ color: "#1e293b" }}>
                                {student.firstName} {student.lastName}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-xs" style={{ color: "#94a3b8" }}>{student.email}</p>
                                {student.currentLevel && (
                                  <span className="shrink-0 rounded-full px-1.5 py-0 text-[10px] font-semibold" style={{ background: "rgba(240,165,0,0.1)", color: "#d97706" }}>
                                    {student.currentLevel.code}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Grade cells */}
                        {data.lessons.map((lesson) => {
                          const key = cellKey(student.id, lesson.id);
                          const existingGrade = gradeMap.get(key);
                          const value = cellValues[key] ?? "";
                          const saving = Boolean(savingCells[key]);
                          const cellError = cellErrors[key];
                          const ok = cellSuccess[key];
                          const hasGrade = existingGrade !== undefined;
                          const displayColor = hasGrade ? gradeColor(existingGrade.value) : null;

                          return (
                            <td key={lesson.id} className="px-2 py-2.5 align-middle" style={{ borderRight: "1px solid #f8edf3" }}>
                              <div className="flex flex-col items-center gap-1">
                                {/* Existing grade display */}
                                {hasGrade && (
                                  <div
                                    className="flex h-8 w-10 items-center justify-center rounded-xl text-sm font-bold"
                                    style={{ background: displayColor!.bg, color: displayColor!.text, border: `1px solid ${displayColor!.border}` }}
                                    title={existingGrade.comment ?? ""}
                                  >
                                    {existingGrade.value}
                                  </div>
                                )}

                                {!hasGrade ? (
                                  <>
                                    {/* Input */}
                                    <input
                                      type="number"
                                      min={1}
                                      max={10}
                                      step={1}
                                      value={value}
                                      onChange={(e) => setCellValues((p) => ({ ...p, [key]: e.target.value }))}
                                      onKeyDown={(e) => e.key === "Enter" && handleCellSave(student.id, lesson.id)}
                                      className="w-14 rounded-xl py-1.5 text-center text-sm outline-none transition-all"
                                      style={{
                                        background: "#ffffff",
                                        border: cellError ? "1.5px solid #fca5a5" : ok ? "1.5px solid #86efac" : "1.5px solid #eadfeb",
                                        color: "#1e293b",
                                      }}
                                      placeholder="–"
                                    />

                                    {/* Save button */}
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => handleCellSave(student.id, lesson.id)}
                                      className="w-14 rounded-xl py-1 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                                      style={{ background: ok ? "#10b981" : "#9697f3" }}
                                    >
                                      {saving ? (
                                        <div className="mx-auto h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                      ) : ok ? "✓" : "Salv."}
                                    </button>

                                    {cellError && (
                                      <p className="text-center text-[10px] font-medium" style={{ color: "#ef4444" }}>{cellError}</p>
                                    )}
                                  </>
                                ) : null}
                              </div>
                            </td>
                          );
                        })}

                        {/* Average */}
                        <td className="px-3 py-3 text-center" style={{ borderLeft: "2px solid #eadfeb" }}>
                          {avg && avgStyle ? (
                            <span
                              className="inline-flex h-9 w-11 items-center justify-center rounded-2xl text-sm font-bold"
                              style={{ background: avgStyle.bg, color: avgStyle.text, border: `1px solid ${avgStyle.border}` }}
                            >
                              {avg}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "#cbd5e1" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
