"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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

function lessonStatusStyle(status: GradebookLesson["status"]) {
  switch (status) {
    case "COMPLETED": return { bg: "rgba(16,185,129,0.1)", text: "#059669" };
    case "LIVE": return { bg: "rgba(239,68,68,0.1)", text: "#dc2626" };
    case "SCHEDULED": return { bg: "rgba(79,142,247,0.1)", text: "#4f8ef7" };
    case "CANCELLED": return { bg: "rgba(100,116,139,0.1)", text: "#94a3b8" };
  }
}

export default function TeacherClassicGradebookPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;

  const [data, setData] = useState<GradebookPayload | null>(null);
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [savingCells, setSavingCells] = useState<Record<string, boolean>>({});
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const [cellSuccess, setCellSuccess] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGradebook = async (id: string) => {
    const res = await fetch(`/api/groups/${id}/gradebook`);
    const payload = (await res.json()) as GradebookPayload & { error?: string };
    if (!res.ok) throw new Error(payload.error ?? "Failed to load gradebook");
    setData({ group: payload.group, lessons: payload.lessons ?? [], students: payload.students ?? [] });
  };

  useEffect(() => {
    if (!groupId) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      try { await loadGradebook(groupId); }
      catch (err) { setError(err instanceof Error ? err.message : "Failed to load gradebook"); }
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

    if (!raw) { setCellErrors((p) => ({ ...p, [key]: "Required" })); return; }
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 10) {
      setCellErrors((p) => ({ ...p, [key]: "1–10 only" })); return;
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
      if (!res.ok) throw new Error(payload.error ?? "Failed to save grade");
      await loadGradebook(data.group.id);
      setCellSuccess((p) => ({ ...p, [key]: "✓" }));
      setTimeout(() => setCellSuccess((p) => ({ ...p, [key]: "" })), 2000);
    } catch (err) {
      setCellErrors((p) => ({ ...p, [key]: err instanceof Error ? err.message : "Failed" }));
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
    <section className="flex size-full flex-col gap-6">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-28 rounded-2xl" style={{ background: "#e8edf4" }} />
          <div className="h-64 rounded-2xl" style={{ background: "#e8edf4" }} />
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center rounded-2xl py-16" style={{ background: "#ffffff", border: "2px dashed #e2e8f0" }}>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Gradebook unavailable.</p>
        </div>
      ) : (
        <>
          {/* Group info card */}
          <div className="flex items-center justify-between gap-4 rounded-2xl p-5" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div>
              <h1 className="text-[26px] font-bold tracking-tight" style={{ color: "#1e293b" }}>
                {data.group.name}
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: "#64748b" }}>
                {data.group.level.code} — {data.group.level.title}
                {data.group.description && <span> · {data.group.description}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="rounded-xl px-3.5 py-2 text-center" style={{ background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.15)" }}>
                <p className="text-lg font-bold" style={{ color: "#4f8ef7" }}>{data.students.length}</p>
                <p className="text-[11px] font-medium" style={{ color: "#94a3b8" }}>students</p>
              </div>
              <div className="rounded-xl px-3.5 py-2 text-center" style={{ background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.15)" }}>
                <p className="text-lg font-bold" style={{ color: "#818cf8" }}>{data.lessons.length}</p>
                <p className="text-[11px] font-medium" style={{ color: "#94a3b8" }}>lessons</p>
              </div>
            </div>
          </div>

          {data.lessons.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl py-14 text-center" style={{ background: "#ffffff", border: "2px dashed #e2e8f0" }}>
              <p className="text-sm" style={{ color: "#94a3b8" }}>No lessons available for this group yet.</p>
            </div>
          ) : data.students.length === 0 ? (
            <div className="flex items-center justify-center rounded-2xl py-14 text-center" style={{ background: "#ffffff", border: "2px dashed #e2e8f0" }}>
              <p className="text-sm" style={{ color: "#94a3b8" }}>No active students in this group.</p>
            </div>
          ) : (
            /* ── Gradebook table ── */
            <div className="overflow-x-auto rounded-2xl" style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    {/* Student column header */}
                    <th
                      className="sticky left-0 z-20 min-w-[220px] px-4 py-3 text-left"
                      style={{ background: "#f8fafc", borderRight: "2px solid #e2e8f0" }}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                        Student
                      </span>
                    </th>

                    {/* Lesson columns */}
                    {data.lessons.map((lesson) => {
                      const statusStyle = lessonStatusStyle(lesson.status);
                      return (
                        <th key={lesson.id} className="min-w-[140px] px-3 py-3 text-left" style={{ borderRight: "1px solid #f1f5f9" }}>
                          <p className="text-xs font-semibold" style={{ color: "#475569" }}>
                            {new Date(lesson.scheduledStart).toLocaleDateString("en-RO", { day: "numeric", month: "short" })}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "#94a3b8" }}>{lesson.title}</p>
                          <span className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                            {lesson.status}
                          </span>
                        </th>
                      );
                    })}

                    {/* Average column */}
                    <th className="min-w-20 px-3 py-3 text-center" style={{ borderLeft: "2px solid #e2e8f0" }}>
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>Avg</span>
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
                        style={{ borderBottom: idx < data.students.length - 1 ? "1px solid #f1f5f9" : "none" }}
                      >
                        {/* Student info — sticky */}
                        <td
                          className="sticky left-0 z-10 px-4 py-3"
                          style={{ background: "#ffffff", borderRight: "2px solid #e2e8f0" }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: avatarColor.bg, color: avatarColor.text }}>
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
                            <td key={lesson.id} className="px-2 py-2.5 align-middle" style={{ borderRight: "1px solid #f1f5f9" }}>
                              <div className="flex flex-col items-center gap-1">
                                {/* Existing grade display */}
                                {hasGrade && (
                                  <div
                                    className="flex h-7 w-10 items-center justify-center rounded-lg text-sm font-bold"
                                    style={{ background: displayColor!.bg, color: displayColor!.text, border: `1px solid ${displayColor!.border}` }}
                                    title={existingGrade.comment ?? ""}
                                  >
                                    {existingGrade.value}
                                  </div>
                                )}

                                {/* Input */}
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  step={1}
                                  value={value}
                                  onChange={(e) => setCellValues((p) => ({ ...p, [key]: e.target.value }))}
                                  onKeyDown={(e) => e.key === "Enter" && handleCellSave(student.id, lesson.id)}
                                  className="w-14 rounded-lg py-1 text-center text-sm outline-none transition-all"
                                  style={{
                                    background: "#f8fafc",
                                    border: cellError ? "1.5px solid #fca5a5" : ok ? "1.5px solid #86efac" : "1.5px solid #e2e8f0",
                                    color: "#1e293b",
                                  }}
                                  placeholder="–"
                                  title={existingGrade?.comment ?? ""}
                                />

                                {/* Save button */}
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleCellSave(student.id, lesson.id)}
                                  className="w-14 rounded-lg py-0.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                                  style={{ background: ok ? "#10b981" : "#4f8ef7" }}
                                >
                                  {saving ? (
                                    <div className="mx-auto h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  ) : ok ? "✓" : "Save"}
                                </button>

                                {cellError && (
                                  <p className="text-center text-[10px] font-medium" style={{ color: "#ef4444" }}>{cellError}</p>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Average */}
                        <td className="px-3 py-3 text-center" style={{ borderLeft: "2px solid #e2e8f0" }}>
                          {avg && avgStyle ? (
                            <span
                              className="inline-flex items-center justify-center h-8 w-10 rounded-xl text-sm font-bold"
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
          )}
        </>
      )}
    </section>
  );
}