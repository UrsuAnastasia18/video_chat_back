"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type GradebookLesson = {
  id: string;
  title: string;
  scheduledStart: string;
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

type TeacherGroup = {
  id: string;
  name: string;
  level: {
    code: string;
    title: string;
  };
};

function cellKey(studentId: string, lessonId: string) {
  return `${studentId}:${lessonId}`;
}

function gradeStyle(value: number) {
  if (value >= 9) return { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" };
  if (value >= 7) return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" };
  if (value >= 5) return { bg: "#fef9c3", text: "#a16207", border: "#fde68a" };
  return { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" };
}

const AVATAR_COLORS = [
  { bg: "rgba(79,142,247,0.12)", text: "#3b7de8" },
  { bg: "rgba(129,140,248,0.12)", text: "#6366f1" },
  { bg: "rgba(16,185,129,0.12)", text: "#059669" },
  { bg: "rgba(251,146,60,0.12)", text: "#ea580c" },
  { bg: "rgba(236,72,153,0.12)", text: "#db2777" },
];

const STATUS_DOT: Record<GradebookLesson["status"], { symbol: string; color: string }> = {
  COMPLETED: { symbol: "✓", color: "#059669" },
  LIVE: { symbol: "●", color: "#dc2626" },
  SCHEDULED: { symbol: "○", color: "#94a3b8" },
  CANCELLED: { symbol: "✕", color: "#cbd5e1" },
};

export default function TeacherClassicGradebookPage() {
  const [data, setData] = useState<GradebookPayload | null>(null);
  const [gradeMap, setGradeMap] = useState<Map<string, GradebookStudentGrade>>(new Map());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<TeacherGroup[]>([]);
  const [hasGroups, setHasGroups] = useState(true);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
  const [successCells, setSuccessCells] = useState<Set<string>>(new Set());
  const [errorCells, setErrorCells] = useState<Map<string, string>>(new Map());

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── data fetching ── */
  const loadGradebook = async (id: string) => {
    const res = await fetch(`/api/groups/${id}/gradebook`);
    const payload = (await res.json()) as GradebookPayload & { error?: string };
    if (!res.ok) throw new Error(payload.error ?? "Failed to load gradebook");

    const map = new Map<string, GradebookStudentGrade>();
    for (const s of payload.students ?? [])
      for (const g of s.manualGrades)
        map.set(cellKey(s.id, g.lessonId), g);

    setData({ group: payload.group, lessons: payload.lessons ?? [], students: payload.students ?? [] });
    setGradeMap(map);
    setSelectedGroupId(id);
    localStorage.setItem("teacher_grades_selected_group_id", id);
  };

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      setPageError(null);
      try {
        const groupsRes = await fetch("/api/groups");
        const groupsPayload = (await groupsRes.json()) as {
          groups?: TeacherGroup[];
          error?: string;
        };

        if (!groupsRes.ok) {
          throw new Error(groupsPayload.error ?? "Failed to load groups");
        }

        const groups = groupsPayload.groups ?? [];
        setGroups(groups);
        if (groups.length === 0) {
          setHasGroups(false);
          setData(null);
          setGradeMap(new Map());
          setSelectedGroupId(null);
          return;
        }

        setHasGroups(true);
        const savedGroupId = localStorage.getItem("teacher_grades_selected_group_id");
        const hasSaved = savedGroupId && groups.some((group) => group.id === savedGroupId);
        await loadGradebook(hasSaved ? (savedGroupId as string) : groups[0].id);
      } catch (e) {
        setPageError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, []);

  const onGroupChange = async (nextGroupId: string) => {
    if (!nextGroupId || nextGroupId === selectedGroupId) return;
    setLoading(true);
    setPageError(null);
    try {
      await loadGradebook(nextGroupId);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editingKey) setTimeout(() => inputRef.current?.focus(), 20);
  }, [editingKey]);

  /* ── editing ── */
  const startEditing = (key: string) => {
    const existing = gradeMap.get(key);
    setEditingKey(key);
    setEditingValue(existing ? String(existing.value) : "");
  };

  const commitEdit = async (studentId: string, lessonId: string) => {
    const key = cellKey(studentId, lessonId);
    const raw = editingValue.trim();
    setEditingKey(null);
    if (!raw) return;

    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      setErrorCells((p) => new Map(p).set(key, "1–10"));
      setTimeout(() => setErrorCells((p) => { const m = new Map(p); m.delete(key); return m; }), 2500);
      return;
    }

    const existing = gradeMap.get(key);
    if (existing?.value === n) return;

    setSavingCells((p) => new Set(p).add(key));
    setErrorCells((p) => { const m = new Map(p); m.delete(key); return m; });

    try {
      const res = await fetch("/api/grades/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, studentId, value: n, comment: existing?.comment ?? null }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "Failed");
      await loadGradebook(selectedGroupId ?? data!.group.id);
      setSuccessCells((p) => new Set(p).add(key));
      setTimeout(() => setSuccessCells((p) => { const s = new Set(p); s.delete(key); return s; }), 1800);
    } catch (e) {
      setErrorCells((p) => new Map(p).set(key, e instanceof Error ? e.message : "Error"));
      setTimeout(() => setErrorCells((p) => { const m = new Map(p); m.delete(key); return m; }), 3000);
    } finally {
      setSavingCells((p) => { const s = new Set(p); s.delete(key); return s; });
    }
  };

  /* ── averages ── */
  const studentAvg = useMemo(() => {
    if (!data) return {} as Record<string, number | null>;
    return Object.fromEntries(
      data.students.map((s) => [
        s.id,
        s.manualGrades.length
          ? s.manualGrades.reduce((a, g) => a + g.value, 0) / s.manualGrades.length
          : null,
      ])
    );
  }, [data]);

  const globalAvg = useMemo(() => {
    if (!data) return null;
    const vals = data.students.flatMap((s) => s.manualGrades.map((g) => g.value));
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  }, [data]);

  /* ── month grouping helper ── */
  const monthOf = (lesson: GradebookLesson) =>
    new Date(lesson.scheduledStart).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  /* ── render ── */
  if (loading)
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-24 rounded-2xl" style={{ background: "#e8edf4" }} />
        <div className="h-72 rounded-2xl" style={{ background: "#e8edf4" }} />
      </div>
    );

  if (pageError)
    return (
      <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
        style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
        {pageError}
      </div>
    );

  if (!hasGroups)
    return (
      <div className="flex items-center justify-center rounded-2xl py-16"
        style={{ background: "#fff", border: "2px dashed #e2e8f0" }}>
        <p className="text-sm" style={{ color: "#94a3b8" }}>Nu ai încă grupe active.</p>
      </div>
    );

  if (!data)
    return (
      <div className="flex items-center justify-center rounded-2xl py-16"
        style={{ background: "#fff", border: "2px dashed #e2e8f0" }}>
        <p className="text-sm" style={{ color: "#94a3b8" }}>Gradebook unavailable.</p>
      </div>
    );

  return (
    <section className="flex size-full flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 rounded-2xl px-6 py-4"
        style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1e293b" }}>{data.group.name}</h1>
          <p className="mt-0.5 text-sm" style={{ color: "#64748b" }}>
            {data.group.level.code} — {data.group.level.title}
            {data.group.description && <span style={{ color: "#94a3b8" }}> · {data.group.description}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {groups.length > 0 ? (
            <select
              value={selectedGroupId ?? ""}
              onChange={(e) => void onGroupChange(e.target.value)}
              className="rounded-xl px-3 py-2 text-sm font-medium"
              style={{ border: "1px solid #d7deea", color: "#334155", background: "#fff" }}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.level.code})
                </option>
              ))}
            </select>
          ) : null}
          {[
            { v: data.students.length, label: "elevi", c: "#4f8ef7", bg: "rgba(79,142,247,0.07)" },
            { v: data.lessons.length, label: "lecții", c: "#818cf8", bg: "rgba(129,140,248,0.07)" },
            ...(globalAvg ? [{ v: globalAvg, label: "medie cls.", c: "#059669", bg: "rgba(16,185,129,0.07)" }] : []),
          ].map((s) => (
            <div key={s.label} className="rounded-xl px-3.5 py-2 text-center min-w-[60px]"
              style={{ background: s.bg, border: `1px solid ${s.c}22` }}>
              <p className="text-base font-bold leading-none" style={{ color: s.c }}>{s.v}</p>
              <p className="mt-0.5 text-[10px] font-medium" style={{ color: "#94a3b8" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hint ── */}
      <p className="text-[12px]" style={{ color: "#94a3b8" }}>
        Click pe o celulă pentru a introduce sau modifica nota (1–10).
        Apasă <kbd className="rounded px-1.5 py-0.5 font-mono text-[11px]"
          style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}>Enter</kbd> sau
        click în altă parte pentru a salva.
      </p>

      {data.lessons.length === 0 || data.students.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl py-14"
          style={{ background: "#fff", border: "2px dashed #e2e8f0" }}>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {data.lessons.length === 0 ? "Nu există lecții pentru acest grup." : "Nu există elevi activi."}
          </p>
        </div>
      ) : (

        /* ── CATALOG TABLE ── */
        <div className="overflow-x-auto rounded-2xl"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <table className="min-w-full border-collapse" style={{ fontSize: "13px" }}>

            {/* ══ THEAD ══ */}
            <thead>

              {/* Row 1 — dark bar with month labels */}
              <tr style={{ background: "#1e2d40" }}>
                <th className="sticky left-0 z-20 px-5 py-2.5"
                  style={{ background: "#1e2d40", borderRight: "1px solid rgba(255,255,255,0.07)", minWidth: "230px", textAlign: "left" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                    Catalog {new Date().getFullYear()}
                  </span>
                </th>

                {data.lessons.map((lesson, i) => {
                  const prev = i > 0 ? data.lessons[i - 1] : null;
                  const isNewMonth = !prev || monthOf(lesson) !== monthOf(prev);
                  return (
                    <th key={lesson.id} className="text-center py-2 px-0"
                      style={{
                        borderLeft: isNewMonth && i > 0 ? "2px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.05)",
                        minWidth: "68px", maxWidth: "68px",
                      }}>
                      {isNewMonth && (
                        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                          {monthOf(lesson)}
                        </span>
                      )}
                    </th>
                  );
                })}

                {/* AVG dark header */}
                <th className="text-center py-2 px-2"
                  style={{ borderLeft: "2px solid rgba(255,255,255,0.12)", minWidth: "72px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                    Media
                  </span>
                </th>
              </tr>

              {/* Row 2 — lesson details */}
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #dde3ed" }}>
                <th className="sticky left-0 z-20 px-5 py-2 text-left"
                  style={{ background: "#f8fafc", borderRight: "1px solid #dde3ed" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8" }}>
                    Elev
                  </span>
                </th>

                {data.lessons.map((lesson, i) => {
                  const prev = i > 0 ? data.lessons[i - 1] : null;
                  const isNewMonth = !prev || monthOf(lesson) !== monthOf(prev);
                  const dot = STATUS_DOT[lesson.status];

                  return (
                    <th key={lesson.id} className="text-center py-2 px-1"
                      style={{ borderLeft: isNewMonth && i > 0 ? "2px solid #dde3ed" : "1px solid #edf0f5" }}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-bold" style={{ fontSize: "12px", color: "#334155" }}>
                          {new Date(lesson.scheduledStart).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" })}
                        </span>
                        <span className="line-clamp-1 text-center w-full px-0.5" style={{ fontSize: "10px", color: "#94a3b8" }} title={lesson.title}>
                          {lesson.title}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: dot.color }} title={lesson.status}>
                          {dot.symbol}
                        </span>
                      </div>
                    </th>
                  );
                })}

                <th className="text-center py-2" style={{ borderLeft: "2px solid #dde3ed" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>Avg</span>
                </th>
              </tr>
            </thead>

            {/* ══ TBODY ══ */}
            <tbody>
              {data.students.map((student, sIdx) => {
                const avatarC = AVATAR_COLORS[student.firstName.charCodeAt(0) % AVATAR_COLORS.length];
                const avg = studentAvg[student.id];
                const avgS = avg !== null && avg !== undefined ? gradeStyle(avg) : null;
                const isLast = sIdx === data.students.length - 1;
                const isOdd = sIdx % 2 === 1;

                return (
                  <tr key={student.id}
                    style={{ background: isOdd ? "#fafbfd" : "#ffffff", borderBottom: isLast ? "none" : "1px solid #edf0f5" }}>

                    {/* Student name */}
                    <td className="sticky left-0 z-10 px-5 py-2"
                      style={{ background: isOdd ? "#fafbfd" : "#ffffff", borderRight: "1px solid #dde3ed" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                          style={{ background: avatarC.bg, color: avatarC.text }}>
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ fontSize: "13px", color: "#1e293b" }}>
                            {student.lastName}, {student.firstName}
                          </p>
                          {student.currentLevel && (
                            <span className="rounded px-1.5 py-px font-semibold"
                              style={{ fontSize: "10px", background: "rgba(240,165,0,0.1)", color: "#b45309" }}>
                              {student.currentLevel.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Grade cells */}
                    {data.lessons.map((lesson, lIdx) => {
                      const key = cellKey(student.id, lesson.id);
                      const existing = gradeMap.get(key);
                      const isEditing = editingKey === key;
                      const isSaving = savingCells.has(key);
                      const isOk = successCells.has(key);
                      const cellErr = errorCells.get(key);
                      const prev = lIdx > 0 ? data.lessons[lIdx - 1] : null;
                      const isNewMonth = !prev || monthOf(lesson) !== monthOf(prev);
                      const gS = existing ? gradeStyle(existing.value) : null;

                      return (
                        <td key={lesson.id} className="p-0 text-center"
                          style={{
                            borderLeft: isNewMonth && lIdx > 0 ? "2px solid #dde3ed" : "1px solid #edf0f5",
                            width: "68px", minWidth: "68px", maxWidth: "68px",
                          }}>

                          {isEditing ? (
                            <input
                              ref={inputRef}
                              type="number" min={1} max={10}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitEdit(student.id, lesson.id);
                                if (e.key === "Escape") setEditingKey(null);
                              }}
                              onBlur={() => commitEdit(student.id, lesson.id)}
                              className="w-full text-center font-bold outline-none"
                              style={{ height: "44px", background: "#eff6ff", border: "none", borderBottom: "2px solid #4f8ef7", fontSize: "16px", color: "#1d4ed8" }}
                            />
                          ) : (
                            <button type="button" onClick={() => startEditing(key)}
                              className="w-full flex items-center justify-center transition-colors"
                              style={{ height: "44px" }}
                              title={existing ? `${existing.value}${existing.comment ? ` — ${existing.comment}` : ""}` : "Click to grade"}
                              onMouseEnter={(e) => { if (!existing) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                            >
                              {isSaving ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
                                  style={{ borderColor: "#4f8ef7", borderTopColor: "transparent" }} />
                              ) : cellErr ? (
                                <span style={{ fontSize: "10px", fontWeight: 600, color: "#dc2626" }}>{cellErr}</span>
                              ) : existing && gS ? (
                                <span className="inline-flex items-center justify-center rounded-lg font-bold"
                                  style={{ width: "36px", height: "30px", fontSize: "14px", background: gS.bg, color: gS.text, border: `1px solid ${gS.border}` }}>
                                  {isOk ? "✓" : existing.value}
                                </span>
                              ) : isOk ? (
                                <span style={{ fontSize: "16px", fontWeight: 700, color: "#059669" }}>✓</span>
                              ) : (
                                <span style={{ fontSize: "18px", fontWeight: 300, color: "#dde3ed" }}>–</span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}

                    {/* Per-student average */}
                    <td className="text-center py-2 px-2" style={{ borderLeft: "2px solid #dde3ed" }}>
                      {avg !== null && avg !== undefined && avgS ? (
                        <span className="inline-flex items-center justify-center rounded-lg font-bold"
                          style={{ width: "40px", height: "28px", fontSize: "13px", background: avgS.bg, color: avgS.text, border: `1px solid ${avgS.border}` }}>
                          {avg.toFixed(1)}
                        </span>
                      ) : (
                        <span style={{ fontSize: "18px", fontWeight: 300, color: "#dde3ed" }}>–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* ══ TFOOT — class average ══ */}
            {globalAvg && (
              <tfoot>
                <tr style={{ background: "#f1f5f9", borderTop: "2px solid #dde3ed" }}>
                  <td className="sticky left-0 px-5 py-2.5"
                    style={{ background: "#f1f5f9", borderRight: "1px solid #dde3ed" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#64748b" }}>
                      Medie generală
                    </span>
                  </td>
                  {data.lessons.map((lesson, lIdx) => {
                    const vals = data.students
                      .map((s) => gradeMap.get(cellKey(s.id, lesson.id))?.value)
                      .filter((v): v is number => v !== undefined);
                    const lavg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                    const lS = lavg !== null ? gradeStyle(lavg) : null;
                    const prev = lIdx > 0 ? data.lessons[lIdx - 1] : null;
                    const isNew = !prev || monthOf(lesson) !== monthOf(prev);

                    return (
                      <td key={lesson.id} className="text-center py-2"
                        style={{ borderLeft: isNew && lIdx > 0 ? "2px solid #dde3ed" : "1px solid #e2e8f0" }}>
                        {lavg !== null && lS ? (
                          <span className="inline-flex items-center justify-center rounded font-bold"
                            style={{ width: "34px", height: "24px", fontSize: "12px", background: lS.bg, color: lS.text }}>
                            {lavg.toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: "#dde3ed" }}>–</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center py-2 px-2" style={{ borderLeft: "2px solid #dde3ed" }}>
                    {(() => {
                      const gS = gradeStyle(Number(globalAvg));
                      return (
                        <span className="inline-flex items-center justify-center rounded-lg font-bold"
                          style={{ width: "40px", height: "28px", fontSize: "13px", background: gS.bg, color: gS.text, border: `1px solid ${gS.border}` }}>
                          {globalAvg}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>
      )}
    </section>
  );
}
