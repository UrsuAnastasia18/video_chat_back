"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  StudentEmptyState,
  StudentError,
  StudentPanel,
} from "@/components/student/StudentShell";

type LessonDetails = {
  id: string;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  streamCallId: string | null;
  group: {
    id: string;
    name: string;
    level: {
      id: string;
      code: string;
      title: string;
    };
  };
};

type LessonRecording = {
  id: string;
  filename: string;
  url: string;
  recordingType: string;
  sessionId: string;
  startTime: string;
  endTime: string;
};

type LessonStudent = {
  studentId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  currentLevel: {
    code: string;
    title: string;
  } | null;
};

type AttendanceStatus = "PENDING" | "PRESENT" | "ABSENT";

type LessonAttendanceRow = {
  studentId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: AttendanceStatus;
  markedAt: string | null;
};

type ManualGrade = {
  gradeId: string;
  value: number;
  comment: string | null;
  gradedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

type StudentFormState = {
  value: string;
  comment: string;
  submitting: boolean;
  error: string | null;
  success: string | null;
};

export default function TeacherLessonGradesPage() {
  const params = useParams<{ lessonId: string }>();
  const lessonId = params.lessonId;

  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [students, setStudents] = useState<LessonStudent[]>([]);
  const [grades, setGrades] = useState<ManualGrade[]>([]);
  const [forms, setForms] = useState<Record<string, StudentFormState>>({});
  const [attendance, setAttendance] = useState<LessonAttendanceRow[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceUpdating, setAttendanceUpdating] = useState<
    Record<string, boolean>
  >({});
  const [recordings, setRecordings] = useState<LessonRecording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (targetLessonId: string) => {
    const [lessonRes, studentsRes, gradesRes] = await Promise.all([
      fetch(`/api/lessons/${targetLessonId}`),
      fetch(`/api/lessons/${targetLessonId}/students`),
      fetch(`/api/lessons/${targetLessonId}/grades`),
    ]);

    const lessonPayload = (await lessonRes.json()) as {
      lesson?: LessonDetails;
      error?: string;
    };
    const studentsPayload = (await studentsRes.json()) as {
      students?: LessonStudent[];
      error?: string;
    };
    const gradesPayload = (await gradesRes.json()) as {
      grades?: ManualGrade[];
      error?: string;
    };

    if (!lessonRes.ok) {
      throw new Error(lessonPayload.error ?? "Failed to load lesson");
    }
    if (!studentsRes.ok) {
      throw new Error(studentsPayload.error ?? "Failed to load lesson students");
    }
    if (!gradesRes.ok) {
      throw new Error(gradesPayload.error ?? "Nu am putut încărca notele lecției");
    }

    setLesson(lessonPayload.lesson ?? null);
    setStudents(studentsPayload.students ?? []);
    setGrades(gradesPayload.grades ?? []);
  };

  const loadRecordings = async (targetLessonId: string) => {
    setRecordingsLoading(true);
    setRecordingsError(null);

    try {
      const recordingsRes = await fetch(`/api/lessons/${targetLessonId}/recordings`);
      const recordingsPayload = (await recordingsRes.json()) as {
        recordings?: LessonRecording[];
        error?: string;
      };

      if (!recordingsRes.ok) {
        throw new Error(recordingsPayload.error ?? "Failed to load lesson recordings");
      }

      setRecordings(recordingsPayload.recordings ?? []);
    } catch (err) {
      setRecordings([]);
      setRecordingsError(
        err instanceof Error ? err.message : "Failed to load lesson recordings"
      );
    } finally {
      setRecordingsLoading(false);
    }
  };

  const loadAttendance = async (targetLessonId: string) => {
    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const attendanceRes = await fetch(`/api/lessons/${targetLessonId}/attendance`);
      const attendancePayload = (await attendanceRes.json()) as {
        attendance?: LessonAttendanceRow[];
        error?: string;
      };

      if (!attendanceRes.ok) {
        throw new Error(attendancePayload.error ?? "Failed to load attendance");
      }

      setAttendance(attendancePayload.attendance ?? []);
    } catch (err) {
      setAttendance([]);
      setAttendanceError(
        err instanceof Error ? err.message : "Failed to load attendance"
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (!lessonId) return;

    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          loadData(lessonId),
          loadRecordings(lessonId),
          loadAttendance(lessonId),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lesson data");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [lessonId]);

  useEffect(() => {
    const initialForms: Record<string, StudentFormState> = {};
    students.forEach((student) => {
      initialForms[student.studentId] = {
        value: "",
        comment: "",
        submitting: false,
        error: null,
        success: null,
      };
    });
    setForms(initialForms);
  }, [students]);

  const gradesByStudent = useMemo(() => {
    const grouped: Record<string, ManualGrade[]> = {};
    grades.forEach((grade) => {
      if (!grouped[grade.student.id]) {
        grouped[grade.student.id] = [];
      }
      grouped[grade.student.id].push(grade);
    });
    return grouped;
  }, [grades]);

  const updateStudentForm = (
    studentId: string,
    patch: Partial<StudentFormState>
  ) => {
    setForms((prev) => ({
      ...prev,
      [studentId]: {
        value: prev[studentId]?.value ?? "",
        comment: prev[studentId]?.comment ?? "",
        submitting: prev[studentId]?.submitting ?? false,
        error: prev[studentId]?.error ?? null,
        success: prev[studentId]?.success ?? null,
        ...patch,
      },
    }));
  };

  const handleSaveGrade = async (
    event: FormEvent<HTMLFormElement>,
    studentId: string
  ) => {
    event.preventDefault();
    if (!lessonId) return;

    const form = forms[studentId];
    const numericValue = Number(form?.value);

    if (!form?.value.trim()) {
      updateStudentForm(studentId, { error: "Grade value is required.", success: null });
      return;
    }
    if (!Number.isInteger(numericValue)) {
      updateStudentForm(studentId, { error: "Grade must be an integer.", success: null });
      return;
    }
    if (numericValue < 1 || numericValue > 10) {
      updateStudentForm(studentId, {
        error: "Grade must be between 1 and 10.",
        success: null,
      });
      return;
    }

    updateStudentForm(studentId, { submitting: true, error: null, success: null });

    try {
      const res = await fetch("/api/grades/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          studentId,
          value: numericValue,
          comment: form.comment.trim() ? form.comment.trim() : null,
        }),
      });

      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to save manual grade");
      }

      await loadData(lessonId);
      await loadRecordings(lessonId);
      updateStudentForm(studentId, {
        value: "",
        comment: "",
        submitting: false,
        error: null,
        success: "Grade saved.",
      });
    } catch (err) {
      updateStudentForm(studentId, {
        submitting: false,
        error: err instanceof Error ? err.message : "Failed to save manual grade",
        success: null,
      });
    }
  };

  const formatDateTime = (value: string) => new Date(value).toLocaleString();

  const canOpenLessonMeeting = (targetLesson: LessonDetails) => {
    if (!targetLesson.streamCallId) return false;
    if (targetLesson.status === "COMPLETED" || targetLesson.status === "CANCELLED") {
      return false;
    }

    return new Date(targetLesson.scheduledEnd).getTime() >= Date.now();
  };

  const getLessonStatusLabel = (status: LessonDetails["status"]) => {
    if (status === "SCHEDULED") return "Programată";
    if (status === "LIVE") return "În desfășurare";
    if (status === "COMPLETED") return "Finalizată";
    if (status === "CANCELLED") return "Anulată";
    return status;
  };

  const getAttendanceBadgeClassName = (status: AttendanceStatus) => {
    if (status === "PRESENT") {
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    }
    if (status === "ABSENT") {
      return "bg-rose-100 text-rose-700 border border-rose-200";
    }
    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  const handleMarkAttendance = async (
    targetUserId: string,
    status: "PRESENT" | "ABSENT"
  ) => {
    if (!lessonId) return;
    setAttendanceUpdating((prev) => ({ ...prev, [targetUserId]: true }));
    setAttendanceError(null);

    try {
      const response = await fetch(`/api/lessons/${lessonId}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, status }),
      });
      const payload = (await response.json()) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Nu am putut actualiza prezența");
      }
      await loadAttendance(lessonId);
    } catch (err) {
      setAttendanceError(
        err instanceof Error ? err.message : "Nu am putut actualiza prezența"
      );
    } finally {
      setAttendanceUpdating((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  return (
    <section
      className="-mx-7 -my-7 flex min-h-[calc(100vh-57px)] flex-col overflow-hidden px-4 py-5 sm:-mx-10 sm:-my-8 sm:px-8 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at 0% 12%, #f3a9c2 0 76px, transparent 77px)," +
          "radial-gradient(circle at 100% 42%, #ffe48c 0 150px, transparent 151px)," +
          "radial-gradient(circle at 4% 92%, #9697f3 0 120px, transparent 121px)," +
          "#fbf6f1",
        color: "#17141f",
      }}
    >
      <div className="relative mx-auto flex w-full flex-1 flex-col gap-6 overflow-hidden rounded-[28px] bg-white px-6 py-6 shadow-[0_26px_80px_rgba(58,36,72,0.14)] sm:px-8 lg:px-10">
        <span className="pointer-events-none absolute -left-12 top-20 h-28 w-28 rounded-full bg-[#f3a9c2]/70" />
        <span className="pointer-events-none absolute -right-16 top-40 h-40 w-40 rounded-full bg-[#ffe48c]/80" />
        <span className="pointer-events-none absolute bottom-16 left-8 h-20 w-20 rounded-full bg-[#9697f3]/75" />
        <span className="pointer-events-none absolute right-20 top-24 h-5 w-5 rounded-full bg-[#eaa0bd]" />
        <span className="pointer-events-none absolute right-56 top-32 h-3 w-3 rounded-full bg-[#9697f3]" />
        <span className="pointer-events-none absolute right-80 top-36 h-4 w-4 rounded-full bg-[#ffe17e]" />

        <div className="relative z-10 flex flex-col gap-6">
      {error ? <StudentError message={error} /> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-[28px]"
              style={{ background: "#f7ecf1", animationDelay: `${index * 55}ms` }}
            />
          ))}
        </div>
      ) : !lesson ? (
        <StudentEmptyState
          title="Lecția nu a fost găsită"
          description="Verifică linkul accesat sau revino în lista lecțiilor pentru a selecta o altă ședință."
        />
      ) : (
        <>
          <section className="rounded-3xl border border-[#eadfeb] bg-white px-6 py-5 shadow-[0_12px_28px_rgba(58,36,72,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl font-black tracking-tight text-[#17141f]">
                {lesson.title}
              </h1>
              {canOpenLessonMeeting(lesson) ? (
                <a
                  href={`/meeting/${lesson.streamCallId}`}
                  className="inline-flex items-center rounded-full border border-[#d8cff8] bg-[#9697f3] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(150,151,243,0.24)] transition-colors hover:bg-[#7c7de8]"
                >
                  Deschide ședința
                </a>
              ) : lesson.streamCallId ? (
                <div className="rounded-full border border-[#eadfeb] bg-[#fcfafc] px-4 py-2 text-sm font-medium text-[#8b7c8f]">
                  Ședință încheiată
                </div>
              ) : (
                <div className="rounded-full border border-[#eadfeb] bg-[#fcfafc] px-4 py-2 text-sm font-medium text-[#8b7c8f]">
                  Fără apel asociat
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-6">
            <StudentPanel title="Prezentare generală">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Titlul lecției", value: lesson.title, accent: "#ffe6ef" },
                  { label: "Status", value: getLessonStatusLabel(lesson.status), accent: "#fff4c9" },
                  { label: "Grupă", value: lesson.group.name, accent: "#ededff" },
                  {
                    label: "Nivel",
                    value: `${lesson.group.level.code} - ${lesson.group.level.title}`,
                    accent: "#fff0bf",
                  },
                  { label: "Începe la", value: formatDateTime(lesson.scheduledStart), accent: "#e9fff1" },
                  { label: "Se încheie la", value: formatDateTime(lesson.scheduledEnd), accent: "#fff8f1" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border p-3 xl:min-h-[132px]"
                    style={{
                      borderColor: "rgba(234,223,235,0.95)",
                      background: "linear-gradient(180deg, #ffffff 0%, #fff8f1 100%)",
                    }}
                  >
                    <div
                      className="mb-2 h-7 w-7 rounded-xl"
                      style={{ background: item.accent }}
                    />
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8b7c8f]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[15px] font-semibold leading-5 text-[#17141f]">
                      {item.value}
                    </p>
                  </div>
                ))}
                <div
                  className="rounded-3xl border p-3 xl:min-h-[132px]"
                  style={{
                    background: "#fff8f1",
                    borderColor: "rgba(234,223,235,0.95)",
                  }}
                >
                  <div
                    className="mb-2 h-7 w-7 rounded-xl"
                    style={{ background: "#fff0bf" }}
                  />
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#df6f98]">
                    Descriere
                  </p>
                  <p className="mt-1 text-[14px] leading-5 text-[#5f5564]">
                    {lesson.description?.trim()
                      ? lesson.description
                      : "Nu a fost adăugată nicio descriere pentru această lecție."}
                  </p>
                </div>
              </div>
            </StudentPanel>

            
          </div>

          <StudentPanel title="Prezență">
            {attendanceError ? <StudentError message={attendanceError} /> : null}

            {attendanceLoading ? (
              <p className="text-sm text-[#75697c]">Se încarcă prezența...</p>
            ) : attendance.length === 0 ? (
              <StudentEmptyState
                title="Nu există elevi pentru prezență"
                description="Grupa lecției nu are elevi activi disponibili în acest moment."
              />
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2">
                {attendance.map((row) => {
                  const isUpdating = attendanceUpdating[row.userId] ?? false;

                  return (
                    <li
                      key={row.userId}
                      className="rounded-3xl border p-4"
                      style={{
                        background: "linear-gradient(180deg, #ffffff 0%, #fff8f1 100%)",
                        borderColor: "rgba(234,223,235,0.95)",
                      }}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-bold text-[#17141f]">
                              {row.firstName} {row.lastName}
                            </p>
                            <p className="text-sm text-[#75697c]">{row.email}</p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getAttendanceBadgeClassName(
                              row.status
                            )}`}
                          >
                            {row.status}
                          </span>
                        </div>

                        <p className="text-xs text-[#8b7c8f]">
                          {row.markedAt
                            ? `Marcat: ${formatDateTime(row.markedAt)}`
                            : "Încă nemarcat"}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleMarkAttendance(row.userId, "PRESENT")}
                            className="rounded-full bg-[#1fa56f] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(31,165,111,0.2)] disabled:opacity-60"
                          >
                            Prezent
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleMarkAttendance(row.userId, "ABSENT")}
                            className="rounded-full bg-[#df6f98] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_20px_rgba(223,111,152,0.2)] disabled:opacity-60"
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </StudentPanel>

          <div className="grid gap-6">
            <StudentPanel title="Înregistrările Lecției">
              {recordingsLoading ? (
                <p className="text-sm text-[#75697c]">Se încarcă înregistrările...</p>
              ) : recordingsError ? (
                <StudentError message={recordingsError} />
              ) : recordings.length === 0 ? (
                <StudentEmptyState
                  title="Nu există înregistrări disponibile"
                  description={
                    lesson.streamCallId
                      ? "Apelul este asociat, dar încă nu au fost generate înregistrări."
                      : "Lecția nu are apel video asociat, deci nu pot exista înregistrări."
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {recordings.map((recording) => (
                    <li
                      key={recording.id}
                      className="rounded-3xl border p-4"
                      style={{
                        background: "linear-gradient(180deg, #ffffff 0%, #fff8f1 100%)",
                        borderColor: "rgba(234,223,235,0.95)",
                      }}
                    >
                      <p className="text-base font-bold text-[#17141f]">{recording.filename}</p>
                      <p className="mt-1 text-sm text-[#75697c]">{formatDateTime(recording.startTime)}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8b7c8f]">
                        Tip: {recording.recordingType}
                      </p>
                      <a
                        href={recording.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center rounded-full border border-[#eadfeb] bg-white px-4 py-2 text-sm font-semibold text-[#17141f] transition-colors hover:bg-[#fff8f1]"
                      >
                        Redă înregistrarea
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </StudentPanel>

            <StudentPanel title="Note Manuale">
              {students.length === 0 ? (
                <StudentEmptyState
                  title="Nu există elevi activi în grupă"
                  description="Adaugă sau reactivează elevii din grupă pentru a putea introduce note."
                />
              ) : (
                <div className="space-y-4">
                  {students.map((student) => {
                    const form = forms[student.studentId] ?? {
                      value: "",
                      comment: "",
                      submitting: false,
                      error: null,
                      success: null,
                    };
                    const studentGrades = gradesByStudent[student.studentId] ?? [];

                    return (
                      <article
                        key={student.studentId}
                        className="rounded-3xl border p-5"
                        style={{
                          background: "linear-gradient(180deg, #ffffff 0%, #fff8f1 100%)",
                          borderColor: "rgba(234,223,235,0.95)",
                        }}
                      >
                        <div className="flex flex-col gap-1">
                          <h4 className="text-lg font-black text-[#17141f]">
                            {student.firstName} {student.lastName}
                          </h4>
                          <p className="text-sm text-[#75697c]">{student.email}</p>
                          <p className="text-sm text-[#8b7c8f]">
                            Nivel:{" "}
                            {student.currentLevel
                              ? `${student.currentLevel.code} - ${student.currentLevel.title}`
                              : "N/A"}
                          </p>
                        </div>

                        <form
                          className="mt-4 grid gap-3 md:grid-cols-[140px_1fr_auto]"
                          onSubmit={(event) => handleSaveGrade(event, student.studentId)}
                        >
                          <input
                            type="number"
                            min={1}
                            max={10}
                            step={1}
                            value={form.value}
                            onChange={(event) =>
                              updateStudentForm(student.studentId, {
                                value: event.target.value,
                                error: null,
                                success: null,
                              })
                            }
                            placeholder="Notă 1-10"
                            className="rounded-2xl border border-[#eadfeb] bg-white px-4 py-3 text-sm text-[#17141f] outline-none transition-colors focus:border-[#9697f3]"
                          />
                          <textarea
                            value={form.comment}
                            onChange={(event) =>
                              updateStudentForm(student.studentId, {
                                comment: event.target.value,
                                error: null,
                                success: null,
                              })
                            }
                            placeholder="Comentariu opțional"
                            rows={2}
                            className="rounded-2xl border border-[#eadfeb] bg-white px-4 py-3 text-sm text-[#17141f] outline-none transition-colors focus:border-[#9697f3]"
                          />
                          <button
                            type="submit"
                            disabled={form.submitting}
                            className="rounded-full bg-[#9697f3] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(150,151,243,0.24)] disabled:opacity-60"
                          >
                            {form.submitting ? "Se salvează..." : "Salvează nota"}
                          </button>
                        </form>

                        {form.error ? (
                          <p className="mt-3 text-sm text-[#a04469]">{form.error}</p>
                        ) : null}
                        {form.success ? (
                          <p className="mt-3 text-sm text-[#177245]">{form.success}</p>
                        ) : null}

                        <div className="mt-5">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8b7c8f]">
                            Note existente
                          </p>
                          {studentGrades.length === 0 ? (
                            <p className="mt-2 text-sm text-[#75697c]">Încă nu există note pentru această lecție.</p>
                          ) : (
                            <ul className="mt-3 space-y-2">
                              {studentGrades.map((grade) => (
                                <li
                                  key={grade.gradeId}
                                  className="rounded-[20px] border border-[#eadfeb] bg-white px-4 py-3 text-sm text-[#5f5564]"
                                >
                                  <span className="font-semibold text-[#17141f]">Valoare: {grade.value}</span>{" "}
                                  <span className="text-[#8b7c8f]">
                                    ({new Date(grade.gradedAt).toLocaleString()})
                                  </span>
                                  {grade.comment ? (
                                    <p className="mt-1 text-[#75697c]">{grade.comment}</p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </StudentPanel>
          </div>
        </>
      )}
        </div>
      </div>
    </section>
  );
}
