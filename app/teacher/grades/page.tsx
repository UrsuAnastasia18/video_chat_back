"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface GroupOption { id: string; name: string; level: { code: string; title: string }; }

type GradeType = "WORKSHEET_AUTO" | "ORAL_MANUAL";

interface CatalogGrade {
  id: string;
  type: GradeType;
  value: number;
  gradedAt: string;
  comment: string | null;
  lesson: { id: string; title: string } | null;
  worksheetSubmission: {
    id: string;
    worksheet: { id: string; title: string } | null;
  } | null;
}

interface CatalogStudent {
  id: string;
  user: { firstName: string; lastName: string; email: string };
  currentLevel: { code: string; title: string } | null;
  grades: CatalogGrade[];
}

function gradeStyle(v: number) {
  if (v >= 9) return { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" };
  if (v >= 7) return { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" };
  if (v >= 5) return { bg: "#fef9c3", text: "#a16207", border: "#fde68a" };
  return { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" };
}

const AVATAR_COLORS = [
  { bg: "rgba(79,142,247,0.12)", text: "#3b7de8" },
  { bg: "rgba(129,140,248,0.12)", text: "#6366f1" },
  { bg: "rgba(16,185,129,0.12)", text: "#059669" },
  { bg: "rgba(251,146,60,0.12)", text: "#ea580c" },
  { bg: "rgba(236,72,153,0.12)", text: "#db2777" },
];

const TYPE_META: Record<GradeType, { short: string; bg: string; text: string }> = {
  ORAL_MANUAL: { short: "Oral", bg: "rgba(129,140,248,0.1)", text: "#6366f1" },
  WORKSHEET_AUTO: { short: "Fișă", bg: "rgba(16,185,129,0.1)", text: "#059669" },
};

export default function TeacherGradesPage() {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [students, setStudents] = useState<CatalogStudent[]>([]);
  const [groupFilter, setGroupFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | GradeType>("all");
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const r = await fetch("/api/groups", { cache: "no-store" });
      const d = (await r.json()) as { groups?: GroupOption[] };
      const fetchedGroups = d.groups ?? [];
      setGroups(fetchedGroups);
      setGroupFilter((prev) => prev || fetchedGroups[0]?.id || "");
    } catch {
      setError("Failed to load groups");
    } finally {
      setGroupsLoading(false);
    }
  };

  const loadGroupStudents = async (targetGroupId: string) => {
    if (!targetGroupId) return;

    setStudentsLoading(true);
    setError(null);
    setStudentFilter("all");
    try {
      const r = await fetch(`/api/groups/${targetGroupId}/grades`);
      const d = (await r.json()) as { students?: CatalogStudent[]; error?: string };
      if (d.error) throw new Error(d.error);
      setStudents(d.students ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load grades");
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (!groupFilter) {
      return;
    }
    loadGroupStudents(groupFilter);
  }, [groupFilter]);

  const visibleStudents = useMemo(() =>
    students
      .filter((s) => studentFilter === "all" || s.id === studentFilter)
      .map((s) => ({
        ...s,
        grades: s.grades.filter((g) => typeFilter === "all" || g.type === typeFilter),
      }))
      .filter((s) => s.grades.length > 0 || studentFilter === s.id),
    [students, studentFilter, typeFilter]
  );

  const stats = useMemo(() => {
    const all = visibleStudents.flatMap((s) => s.grades);
    if (!all.length) return null;
    return {
      avg: all.reduce((a, g) => a + g.value, 0) / all.length,
      total: all.length,
      oral: all.filter((g) => g.type === "ORAL_MANUAL").length,
      auto: all.filter((g) => g.type === "WORKSHEET_AUTO").length,
    };
  }, [visibleStudents]);

  const selectedGroup = groups.find((g) => g.id === groupFilter);

  return (
    <section className="flex size-full flex-col gap-6" style={{ color: "#1e293b" }}>

      {/* header */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-6 text-white"
        style={{
          background: "linear-gradient(135deg, #1e2d40 0%, #243650 55%, #1a3a5c 100%)",
        }}
      >
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
            <h1 className="text-2xl font-bold tracking-tight">Note</h1>
            <p className="mt-0.5 text-sm text-white/70">Catalog note — oral și fișe de lucru.</p>
          </div>
          {selectedGroup && (
            <Link href={`/teacher/gradebook/${groupFilter}`}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 shrink-0"
              style={{ background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.15)" }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25M3.375 19.5a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m17.25 3.75a1.125 1.125 0 001.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m-17.25 0h17.25M5.625 4.5h12.75M5.625 4.5a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m12.75-3.75a1.125 1.125 0 011.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-12.75 0h12.75M7.5 10.875h9M7.5 10.875c0 .621-.504 1.125-1.125 1.125S5.25 11.496 5.25 10.875m9 0c0 .621.504 1.125 1.125 1.125s1.125-.504 1.125-1.125m-9 3.75h9" />
              </svg>
              Catalog clasic
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          {error}
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap gap-3">
        <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm font-medium outline-none"
          style={{ background: "#fff", border: "1.5px solid #e2e8f0", color: "#475569", cursor: "pointer", minWidth: "180px" }}>
          {groups.length === 0 ? <option value="">No groups available yet</option> : null}
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.level.code})</option>)}
        </select>

        <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)}
          disabled={!groupFilter}
          className="rounded-xl px-3 py-2 text-sm font-medium outline-none"
          style={{ background: "#fff", border: "1.5px solid #e2e8f0", color: "#475569", cursor: "pointer", minWidth: "180px", opacity: !groupFilter ? 0.45 : 1 }}>
          <option value="all">Toți elevii</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.user.lastName} {s.user.firstName}</option>
          ))}
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | GradeType)}
          className="rounded-xl px-3 py-2 text-sm font-medium outline-none"
          style={{ background: "#fff", border: "1.5px solid #e2e8f0", color: "#475569", cursor: "pointer" }}>
          <option value="all">Toate tipurile</option>
          <option value="ORAL_MANUAL">Oral / Manual</option>
          <option value="WORKSHEET_AUTO">Fișe de lucru</option>
        </select>
      </div>

      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => {
            const isSelected = group.id === groupFilter;
            return (
              <button
                key={group.id}
                onClick={() => setGroupFilter(group.id)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                style={
                  isSelected
                    ? { background: "rgba(79,142,247,0.12)", color: "#1d4ed8", border: "1px solid rgba(79,142,247,0.25)" }
                    : { background: "#ffffff", color: "#64748b", border: "1px solid #e2e8f0" }
                }
              >
                {group.name} ({group.level.code})
              </button>
            );
          })}
        </div>
      )}

      {/* stats */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Medie", value: stats.avg.toFixed(1), accent: "#4f8ef7", bg: "rgba(79,142,247,0.07)", border: "rgba(79,142,247,0.15)" },
            { label: "Total", value: stats.total, accent: "#818cf8", bg: "rgba(129,140,248,0.07)", border: "rgba(129,140,248,0.15)" },
            { label: "Note orale", value: stats.oral, accent: "#6366f1", bg: "rgba(99,102,241,0.07)", border: "rgba(99,102,241,0.15)" },
            { label: "Note fișe", value: stats.auto, accent: "#10b981", bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.15)" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <span className="text-lg font-bold" style={{ color: s.accent }}>{s.value}</span>
              <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* content */}
      {groupsLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl" style={{ background: "#e8edf4" }} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl py-20 gap-2"
          style={{ background: "#fff", border: "2px dashed #e2e8f0" }}>
          <p className="text-sm font-medium" style={{ color: "#64748b" }}>No groups available yet.</p>
        </div>
      ) : !groupFilter ? (
        <div className="flex flex-col items-center justify-center rounded-2xl py-20 gap-2"
          style={{ background: "#fff", border: "2px dashed #e2e8f0" }}>
          <p className="text-sm font-medium" style={{ color: "#64748b" }}>Selectează un grup pentru a vedea notele.</p>
        </div>
      ) : studentsLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl" style={{ background: "#e8edf4" }} />
          ))}
        </div>
      ) : visibleStudents.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl py-16"
          style={{ background: "#fff", border: "2px dashed #e2e8f0" }}>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {students.length === 0 ? "Niciun elev cu note în acest grup." : "Nicio notă pentru filtrele selectate."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleStudents.map((student) => {
            const avatarC = AVATAR_COLORS[student.user.firstName.charCodeAt(0) % AVATAR_COLORS.length];
            const avg = student.grades.length
              ? student.grades.reduce((a, g) => a + g.value, 0) / student.grades.length
              : null;
            const avgS = avg !== null ? gradeStyle(avg) : null;

            return (
              <div key={student.id} className="rounded-2xl overflow-hidden"
                style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

                {/* student row */}
                <div className="flex items-center justify-between gap-4 px-5 py-4"
                  style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ background: avatarC.bg, color: avatarC.text }}>
                      {student.user.firstName[0]}{student.user.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>
                        {student.user.lastName} {student.user.firstName}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{student.user.email}</p>
                    </div>
                    {student.currentLevel && (
                      <span className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: "rgba(240,165,0,0.1)", color: "#b45309" }}>
                        {student.currentLevel.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs" style={{ color: "#94a3b8" }}>
                      {student.grades.length} {student.grades.length === 1 ? "notă" : "note"}
                    </span>
                    {avg !== null && avgS && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: "#94a3b8" }}>Medie</span>
                        <span className="flex h-8 w-10 items-center justify-center rounded-lg text-sm font-bold"
                          style={{ background: avgS.bg, color: avgS.text, border: `1px solid ${avgS.border}` }}>
                          {avg.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* grades */}
                {student.grades
                  .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime())
                  .map((grade) => {
                    const gS = gradeStyle(grade.value);
                    const tm = TYPE_META[grade.type];
                    const source = grade.type === "WORKSHEET_AUTO"
                      ? (grade.worksheetSubmission?.worksheet?.title ?? "Fișă de lucru")
                      : (grade.lesson?.title ?? "Oral");

                    return (
                      <div key={grade.id} className="flex items-center gap-4 px-5 py-3"
                        style={{ borderTop: "1px solid #f8fafc" }}>
                        <span className="flex h-9 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold"
                          style={{ background: gS.bg, color: gS.text, border: `1px solid ${gS.border}` }}>
                          {grade.value}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium" style={{ color: "#334155" }}>{source}</p>
                          {grade.comment && (
                            <p className="truncate text-xs mt-0.5" style={{ color: "#94a3b8" }}>{grade.comment}</p>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: tm.bg, color: tm.text }}>
                          {tm.short}
                        </span>
                        <span className="shrink-0 text-xs" style={{ color: "#cbd5e1" }}>
                          {new Date(grade.gradedAt).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
